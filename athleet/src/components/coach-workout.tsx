import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';


import { getCoach } from '@/data/coaches';
import { StreakBadge } from '@/components/streak-badge';
import { hypeLine, signatureFor } from '@/data/hype';
import { useSelectedPlan } from '@/lib/selected-plan';
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

export function CoachWorkout({ dayIndex, onExit, onCue, onCancelEmpty }: { dayIndex: number; onExit: () => void; onCue: (text: string, completed: boolean) => void; onCancelEmpty: () => void }) {
  const activePlan = useSelectedPlan();
  const [selected] = useState(activePlan);
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
  const [shoutUntil, setShoutUntil] = useState(0);
  const saved = useRef(false);
  const lastCompleted = useRef('');

  // One clock drives the elapsed time and the rest countdown.
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [finished]);

  const total = entries.reduce((n, sets) => n + sets.length, 0);
  const doneCount = entries.reduce((n, sets) => n + sets.filter((s) => s.done).length, 0);
  const resting = restEnd !== null && now < restEnd;

  // The next set to do: first one not done yet.
  let current: { ex: number; set: number } | null = null;
  for (let i = 0; i < entries.length && !current; i++) {
    const j = entries[i].findIndex((s) => !s.done);
    if (j !== -1) current = { ex: i, set: j };
  }

  const hype = coach ? finished
    ? hypeLine(coach.id, 'finish', doneCount)
    : now < shoutUntil ? signatureFor(coach.id).text
    : resting ? hypeLine(coach.id, 'rest', doneCount)
    : current ? `${planDay?.exercises[current.ex].name}. Set ${current.set + 1}. Aim for ${planDay?.exercises[current.ex].reps}. ${hypeLine(coach.id, 'setStart', doneCount)}`
    : 'All sets are done. Take a moment to cool down, then save your workout.' : '';
  useEffect(() => { onCue(hype, finished); }, [hype, finished, onCue]);
  if (!selected || !planDay || !coach) return <View style={styles.center}><Text style={styles.title}>Choose a workout day first.</Text><Pressable onPress={onExit}><Text style={styles.muted}>Back to plan</Text></Pressable></View>;

  function update(ex: number, set: number, changes: Partial<SetEntry>) {
    setEntries((prev) => prev.map((sets, i) => (i !== ex ? sets : sets.map((s, j) => (j === set ? { ...s, ...changes } : s)))));
  }

  function toggleDone(ex: number, set: number) {
    const key = `${ex}:${set}`;
    if (resting || lastCompleted.current === key || entries[ex][set].done) return;
    lastCompleted.current = key;
    const wasDone = entries[ex][set].done;
    update(ex, set, { done: !wasDone });
    if (wasDone) return;
    setShoutUntil(Date.now() + 2500);
    const isLastOverall = doneCount + 1 >= total;
    const rest = restSeconds(planDay!.exercises[ex].rest);
    setRestEnd(!isLastOverall && rest > 0 ? Date.now() + rest * 1000 : null);
  }

  function undoLastSet() {
    for (let ex = entries.length - 1; ex >= 0; ex--) {
      for (let set = entries[ex].length - 1; set >= 0; set--) {
        if (!entries[ex][set].done) continue;
        update(ex, set, { done: false });
        lastCompleted.current = ''; setRestEnd(null); setShoutUntil(0); return;
      }
    }
  }

  function finish() {
    if (saved.current || doneCount === 0) return;
    saved.current = true;
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
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => onExit()} accessibilityRole="button" accessibilityLabel="Pause workout and view plan" hitSlop={12}>
          <Text style={styles.close}>←</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.dayName} numberOfLines={1}>{planDay.name}</Text>
          <Text style={styles.focus} numberOfLines={1}>{planDay.focus}</Text>
        </View>
        <Text style={styles.timer}>{clock((now - startedAt) / 1000)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${total ? (doneCount / total) * 100 : 0}%` }]} />
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
            <Text style={styles.summaryTitle}>{doneCount === total ? 'Workout complete 🎉' : 'Workout saved'}</Text>
            <View style={styles.statsRow}>
              <Stat value={`${doneCount}/${total}`} label="sets" />
              <Stat value={clock((now - startedAt) / 1000)} label="time" />
              <Stat value={volume ? `${Math.round(volume).toLocaleString()}` : '—'} label="lb lifted" />
            </View>
          </View>
          <StreakBadge />
          <Pressable style={styles.primaryBtn} onPress={() => onExit()} accessibilityRole="button">
            <Text style={styles.primaryText}>Back to plan with coach</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>{doneCount} / {total} SETS COMPLETE</Text>
          {doneCount === 0 && <><Text style={styles.sectionLabel}>Warm-up</Text><Text style={styles.muted}>{planDay.warmUp}</Text></>}

          {planDay.exercises.map((e, i) => {
            if (current?.ex !== i) return null;
            const timed = isTimed(e.sets, e.reps);
            return (
              <View key={e.name} style={[styles.card, current?.ex === i && styles.cardActive]}>
                <Text style={styles.exName}>{i + 1}. {e.name}</Text>
                <Text style={styles.muted}>
                  {timed ? e.reps : `${e.sets} × ${e.reps}`}{e.rest && e.rest !== '—' ? ` · rest ${e.rest}` : ''}
                </Text>
                {e.notes ? <Text style={styles.note}>💡 {e.notes}</Text> : null}

                {entries[i].map((s, j) => {
                  if (current?.set !== j) return null;
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
                        disabled={resting}
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

          {!current && <><Text style={styles.sectionLabel}>Cool-down</Text><Text style={styles.muted}>{planDay.coolDown}</Text></>}

          {doneCount === 0 && <Pressable onPress={onCancelEmpty} accessibilityRole="button"><Text style={styles.muted}>Cancel empty workout</Text></Pressable>}
          {doneCount > 0 && <Pressable onPress={undoLastSet} accessibilityRole="button"><Text style={styles.muted}>Undo last set</Text></Pressable>}
          <Pressable disabled={doneCount === 0} style={[styles.primaryBtn, doneCount === 0 && { opacity: .4 }]} onPress={finish} accessibilityRole="button">
            <Text style={styles.primaryText}>
              {doneCount >= total ? 'Finish workout 🎉' : `Save partial workout (${doneCount}/${total} sets)`}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
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
  screen: { flex: 1, backgroundColor: '#14130f' },
  flex: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  title: { color: '#ffda62', fontSize: 22, fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  close: { color: '#c9bea3', fontSize: 22 },
  dayName: { color: '#ffda62', fontSize: 17, fontWeight: '800' },
  focus: { color: '#b5ad94', fontSize: 13 },
  timer: { color: '#ffda62', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 4, backgroundColor: '#393222', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#ffda62', borderRadius: 2 },
  hypeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  hypeBubble: { flex: 1, backgroundColor: '#211f18', borderWidth: 1, borderColor: '#50462b', borderRadius: 14, borderBottomLeftRadius: 4, padding: 12 },
  hypeName: { color: '#b5ad94', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  hypeText: { color: '#ffda62', fontSize: 17, fontWeight: '800', marginTop: 2 },
  restBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 12, backgroundColor: '#1f3a26', borderColor: '#3d7a4e', borderWidth: 1, borderRadius: 10, padding: 12 },
  restText: { color: '#b8f0c6', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  restSkip: { color: '#b8f0c6', fontSize: 14, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 48, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  sectionLabel: { color: '#c9bea3', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  muted: { color: '#b5ad94', fontSize: 13 },
  note: { color: '#c9bea3', fontSize: 12, fontStyle: 'italic' },
  card: { backgroundColor: '#211f18', borderWidth: 1, borderColor: '#393222', borderRadius: 10, padding: 14, gap: 6 },
  cardActive: { borderColor: '#6b6b72' },
  exName: { color: '#ffda62', fontSize: 16, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  setRowCurrent: { borderColor: '#ffda62', backgroundColor: '#232327' },
  setRowDone: { opacity: 0.55 },
  setLabel: { color: '#d0d0d5', fontSize: 14, fontWeight: '600', width: 52 },
  input: { flex: 1, minWidth: 0, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#50462b', backgroundColor: '#14130f', color: '#ffda62', textAlign: 'center', fontSize: 15 },
  check: { width: 44, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#50462b', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  checkDone: { backgroundColor: '#3d7a4e', borderColor: '#3d7a4e' },
  checkText: { color: '#6b6b72', fontSize: 18, fontWeight: '800' },
  checkTextDone: { color: '#ffda62' },
  primaryBtn: { backgroundColor: '#ffda62', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  primaryText: { color: '#14130f', fontSize: 16, fontWeight: '800' },
  summary: { backgroundColor: '#211f18', borderWidth: 1, borderColor: '#50462b', borderRadius: 12, padding: 20, gap: 16 },
  summaryTitle: { color: '#ffda62', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { color: '#ffda62', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
