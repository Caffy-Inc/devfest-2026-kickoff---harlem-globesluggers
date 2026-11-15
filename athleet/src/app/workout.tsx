import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachAvatar } from '@/components/coach-avatar';
import { StreakBadge } from '@/components/streak-badge';
import { getCoach } from '@/data/coaches';
import { hypeLine, signatureFor } from '@/data/hype';
import { useSelectedPlan } from '@/lib/selected-plan';
import { setVoiceMuted, shoutSignature } from '@/lib/voice';
import { restSeconds, saveWorkout, type LoggedSet } from '@/lib/workout-log';

type SetEntry = { reps: string; weight: string; done: boolean };

/** Timed or distance work ("10 min", "6 x 30m") is logged as a single "done" row. */
function isTimed(sets: number, reps: string) {
  return sets <= 1 && /min|x|rounds|runs|m\b|s\b/i.test(reps);
}

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function WorkoutScreen() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  const selected = useSelectedPlan();
  const dayIndex = Number(day) || 0;
  const planDay = selected?.plan.days[dayIndex];
  const coach = selected ? getCoach(selected.coachId) : undefined;

  const [entries, setEntries] = useState<SetEntry[][]>(() =>
    (planDay?.exercises ?? []).map((e) =>
      Array.from({ length: isTimed(e.sets, e.reps) ? 1 : Math.max(1, e.sets) }, () => ({ reps: '', weight: '', done: false }))
    )
  );
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  // Shows the signature line in the bubble for a moment after a set is logged.
  const [shoutUntil, setShoutUntil] = useState(0);

  // One clock drives the elapsed time and the rest countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const total = entries.reduce((n, sets) => n + sets.length, 0);
  const doneCount = entries.reduce((n, sets) => n + sets.filter((s) => s.done).length, 0);
  const resting = restEnd !== null && now < restEnd;

  // The next set to do: first one not done yet.
  let current: { ex: number; set: number } | null = null;
  for (let i = 0; i < entries.length && !current; i++) {
    const j = entries[i].findIndex((s) => !s.done);
    if (j !== -1) current = { ex: i, set: j };
  }

  if (!selected || !planDay || !coach) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.title}>No workout selected</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.primaryText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const first = coach.name.split(' ')[0];
  const shouting = now < shoutUntil;
  const hype = finished
    ? hypeLine(coach.id, 'finish', doneCount)
    : shouting
      ? signatureFor(coach.id).text
      : resting
      ? hypeLine(coach.id, 'rest', doneCount)
      : hypeLine(coach.id, 'setStart', doneCount);

  function update(ex: number, set: number, changes: Partial<SetEntry>) {
    setEntries((prev) => prev.map((sets, i) => (i !== ex ? sets : sets.map((s, j) => (j === set ? { ...s, ...changes } : s)))));
  }

  function toggleDone(ex: number, set: number) {
    const wasDone = entries[ex][set].done;
    update(ex, set, { done: !wasDone });
    if (wasDone) return;
    shoutSignature(coach!.id);
    setShoutUntil(Date.now() + 2500);
    const isLastOverall = doneCount + 1 >= total;
    const rest = restSeconds(planDay!.exercises[ex].rest);
    setRestEnd(!isLastOverall && rest > 0 ? Date.now() + rest * 1000 : null);
  }

  function finish() {
    const sets: LoggedSet[] = [];
    entries.forEach((list, i) =>
      list.forEach((s, j) => {
        if (s.done) sets.push({ exercise: planDay!.exercises[i].name, set: j + 1, reps: s.reps || planDay!.exercises[i].reps, weight: s.weight });
      })
    );
    saveWorkout({
      coachId: coach!.id,
      dayIndex,
      dayName: planDay!.name,
      finishedAt: Date.now(),
      minutes: Math.round((Date.now() - startedAt) / 60000),
      sets,
    });
    setRestEnd(null);
    setFinished(true);
  }

  const volume = entries.reduce(
    (sum, list) => sum + list.reduce((s, e) => s + (e.done ? (Number(e.weight) || 0) * (parseInt(e.reps, 10) || 0) : 0), 0),
    0
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close workout" hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.dayName} numberOfLines={1}>{planDay.name}</Text>
          <Text style={styles.focus} numberOfLines={1}>{planDay.focus}</Text>
        </View>
        <Pressable
          onPress={() => { setVoiceMuted(!muted); setMuted(!muted); }}
          accessibilityRole="button"
          accessibilityLabel={muted ? 'Unmute coach voice' : 'Mute coach voice'}
          hitSlop={10}>
          <Text style={styles.mute}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>
        <Text style={styles.timer}>{clock((now - startedAt) / 1000)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${total ? (doneCount / total) * 100 : 0}%` }]} />
      </View>

      {/* Coach hype */}
      <View style={styles.hypeRow}>
        <CoachAvatar coach={coach} size={52} />
        <View style={styles.hypeBubble}>
          <Text style={styles.hypeName}>{first}</Text>
          <Text key={hype + doneCount} style={[styles.hypeText, shouting && !finished && styles.hypeShout]}>{hype}</Text>
        </View>
      </View>

      {resting && (
        <View style={styles.restBar}>
          <Text style={styles.restText}>Rest {clock((restEnd! - now) / 1000)}</Text>
          <Pressable onPress={() => setRestEnd(null)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.restSkip}>Skip rest →</Text>
          </Pressable>
        </View>
      )}

      {finished ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Workout complete 🎉</Text>
            <View style={styles.statsRow}>
              <Stat value={`${doneCount}/${total}`} label="sets" />
              <Stat value={clock((now - startedAt) / 1000)} label="time" />
              <Stat value={volume ? `${Math.round(volume).toLocaleString()}` : '—'} label="lb lifted" />
            </View>
          </View>
          <StreakBadge />
          <Pressable style={styles.primaryBtn} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.primaryText}>Back to my plan</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>🔥 Warm-up</Text>
          <Text style={styles.muted}>{planDay.warmUp}</Text>

          {planDay.exercises.map((e, i) => {
            const timed = isTimed(e.sets, e.reps);
            return (
              <View key={e.name} style={[styles.card, current?.ex === i && styles.cardActive]}>
                <Text style={styles.exName}>{i + 1}. {e.name}</Text>
                <Text style={styles.muted}>
                  {timed ? e.reps : `${e.sets} × ${e.reps}`}{e.rest && e.rest !== '—' ? ` · rest ${e.rest}` : ''}
                </Text>
                {e.notes ? <Text style={styles.note}>💡 {e.notes}</Text> : null}

                {entries[i].map((s, j) => {
                  const isCurrent = current?.ex === i && current?.set === j;
                  return (
                    <View key={j} style={[styles.setRow, isCurrent && styles.setRowCurrent, s.done && styles.setRowDone]}>
                      <Text style={styles.setLabel}>{timed ? 'Done?' : `Set ${j + 1}`}</Text>
                      {!timed && (
                        <>
                          <TextInput
                            style={styles.input}
                            value={s.reps}
                            onChangeText={(v) => update(i, j, { reps: v.replace(/[^0-9]/g, '') })}
                            placeholder={e.reps.replace(/\s*reps?/i, '')}
                            placeholderTextColor="#6b6b72"
                            keyboardType="number-pad"
                            keyboardAppearance="dark"
                            accessibilityLabel={`${e.name} set ${j + 1} reps`}
                            editable={!s.done}
                          />
                          <TextInput
                            style={styles.input}
                            value={s.weight}
                            onChangeText={(v) => update(i, j, { weight: v.replace(/[^0-9.]/g, '') })}
                            placeholder="lb"
                            placeholderTextColor="#6b6b72"
                            keyboardType="decimal-pad"
                            keyboardAppearance="dark"
                            accessibilityLabel={`${e.name} set ${j + 1} weight`}
                            editable={!s.done}
                          />
                        </>
                      )}
                      <Pressable
                        onPress={() => toggleDone(i, j)}
                        style={[styles.check, s.done && styles.checkDone]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: s.done }}
                        accessibilityLabel={`Mark ${e.name} set ${j + 1} done`}>
                        <Text style={[styles.checkText, s.done && styles.checkTextDone]}>✓</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            );
          })}

          <Text style={styles.sectionLabel}>🧊 Cool-down</Text>
          <Text style={styles.muted}>{planDay.coolDown}</Text>

          <Pressable style={styles.primaryBtn} onPress={finish} accessibilityRole="button">
            <Text style={styles.primaryText}>
              {doneCount >= total ? 'Finish workout 🎉' : `Finish workout (${doneCount}/${total} sets)`}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  flex: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  title: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  close: { color: '#a0a0a6', fontSize: 22 },
  dayName: { color: '#f5f5f5', fontSize: 17, fontWeight: '800' },
  focus: { color: '#8a8a90', fontSize: 13 },
  timer: { color: '#f5f5f5', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 4, backgroundColor: '#2a2a2e', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#f5f5f5', borderRadius: 2 },
  hypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  hypeBubble: { flex: 1, backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#3a3a40', borderRadius: 14, borderBottomLeftRadius: 4, padding: 12 },
  hypeName: { color: '#8a8a90', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  hypeText: { color: '#f5f5f5', fontSize: 17, fontWeight: '800', marginTop: 2 },
  hypeShout: { fontSize: 22, color: '#ffd23f' },
  mute: { fontSize: 20 },
  restBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 12, backgroundColor: '#1f3a26', borderColor: '#3d7a4e', borderWidth: 1, borderRadius: 10, padding: 12 },
  restText: { color: '#b8f0c6', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  restSkip: { color: '#b8f0c6', fontSize: 14, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 48, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  sectionLabel: { color: '#a0a0a6', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  muted: { color: '#8a8a90', fontSize: 13 },
  note: { color: '#a0a0a6', fontSize: 12, fontStyle: 'italic' },
  card: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, padding: 14, gap: 6 },
  cardActive: { borderColor: '#6b6b72' },
  exName: { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  setRowCurrent: { borderColor: '#f5f5f5', backgroundColor: '#232327' },
  setRowDone: { opacity: 0.55 },
  setLabel: { color: '#d0d0d5', fontSize: 14, fontWeight: '600', width: 52 },
  input: { flex: 1, minWidth: 0, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a40', backgroundColor: '#0d0d0f', color: '#f5f5f5', textAlign: 'center', fontSize: 15 },
  check: { width: 44, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a40', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  checkDone: { backgroundColor: '#3d7a4e', borderColor: '#3d7a4e' },
  checkText: { color: '#6b6b72', fontSize: 18, fontWeight: '800' },
  checkTextDone: { color: '#f5f5f5' },
  primaryBtn: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  primaryText: { color: '#0d0d0f', fontSize: 16, fontWeight: '800' },
  summary: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#3a3a40', borderRadius: 12, padding: 20, gap: 16 },
  summaryTitle: { color: '#f5f5f5', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { color: '#f5f5f5', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
