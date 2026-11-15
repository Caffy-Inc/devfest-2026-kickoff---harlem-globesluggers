import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { wordmarkImage } from '@/components/athleet-wordmark';
import { CoachAvatar } from '@/components/coach-avatar';
import { getCoach } from '@/data/coaches';
import { generatePlan, type GeneratePlanResponse } from '@/lib/api';
import { planWarnings } from '@/lib/plan';
import { getProfile, updateProfile } from '@/lib/profile-store';
import { selectPlan, useSelectedPlan } from '@/lib/selected-plan';

type PlanParams = {
  coachId?: string;
  age?: string;
  sex?: string;
  heightCm?: string;
  weightKg?: string;
  goal?: string;
  level?: string;
  daysPerWeek?: string;
  sessionMinutes?: string;
  equipment?: string;
  injuries?: string;
};

/**
 * Generated workout plan, shown day by day.
 * - preview: opened from a coach chat, with a "Select this plan" button.
 * - saved: the "Your Plan" tab; changes are saved automatically.
 */
export function PlanView({ mode = 'preview' }: { mode?: 'preview' | 'saved' }) {
  const params = useLocalSearchParams<PlanParams>();
  const router = useRouter();
  const profile = getProfile();
  const selected = useSelectedPlan();
  const saved = mode === 'saved' ? selected : null;

  const coachId = saved?.coachId || params.coachId || 'lebron';
  const coach = getCoach(coachId);

  const age = Number(params.age) || profile?.age || 26;
  const sex = (params.sex as any) || profile?.sex || 'male';
  const heightCm = Number(params.heightCm) || profile?.heightCm || 178;
  const weightKg = Number(params.weightKg) || profile?.weightKg || 75;
  const goal = params.goal || profile?.goal || 'build_muscle';
  const level = (params.level as any) || profile?.level || 'intermediate';
  const initialDays = saved?.daysPerWeek || Number(params.daysPerWeek) || profile?.daysPerWeek || 3;
  const [daysPerWeek, setDaysPerWeek] = useState(initialDays);
  const initialMinutes = saved?.sessionMinutes || Number(params.sessionMinutes) || profile?.sessionMinutes || 60;
  const [sessionMinutes, setSessionMinutes] = useState(initialMinutes);
  const equipment = (params.equipment as any) || profile?.equipment || 'full_gym';
  const injuries = params.injuries || profile?.injuries || 'none';

  const [plan, setPlan] = useState<GeneratePlanResponse | null>(saved?.plan ?? null);
  const [loading, setLoading] = useState(!saved);
  const [regenerating, setRegenerating] = useState(false);
  const [seed, setSeed] = useState(saved?.seed ?? 0);
  // The saved tab already has its plan, so skip the first fetch there.
  const skipFirstFetch = useRef(!!saved);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPlan = useCallback(async (currentSeed: number) => {
    if (currentSeed === 0) setLoading(true);
    else setRegenerating(true);
    setError(null);
    try {
      const result = await generatePlan(
        {
          coachId,
          age,
          sex,
          heightCm,
          weightKg,
          goal,
          level,
          daysPerWeek,
          sessionMinutes,
          equipment,
          injuries,
        },
        currentSeed
      );
      setPlan(result);
      if (mode === 'saved') {
        selectPlan({ coachId, daysPerWeek, sessionMinutes, seed: currentSeed, plan: result });
      }
      if (currentSeed > 0) {
        setToastMessage(`Variation #${currentSeed + 1} generated!`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to generate plan');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [mode, coachId, age, sex, heightCm, weightKg, goal, level, daysPerWeek, sessionMinutes, equipment, injuries]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    // Load the plan when the screen opens or settings change.
    fetchPlan(0);
  }, [fetchPlan]);

  function changeDays(n: number) {
    if (n === daysPerWeek) return;
    setDaysPerWeek(n);
    setSeed(0);
    setExpandedDay(0);
    updateProfile({ daysPerWeek: n });
  }

  function changeMinutes(n: number) {
    if (n === sessionMinutes) return;
    setSessionMinutes(n);
    setSeed(0);
    setExpandedDay(0);
    updateProfile({ sessionMinutes: n });
  }

  const isSelected =
    !!selected &&
    selected.coachId === coachId &&
    selected.daysPerWeek === daysPerWeek &&
    selected.sessionMinutes === sessionMinutes &&
    selected.seed === seed;

  function handleSelect() {
    if (!plan) return;
    selectPlan({ coachId, daysPerWeek, sessionMinutes, seed, plan });
    router.dismissAll();
    router.navigate('/my-plan');
  }

  function handleRegenerate() {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    fetchPlan(nextSeed);
  }

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#f5f5f5" />
            <Text style={styles.loadingTitle}>
              {coach ? `Coach ${coach.name.split(' ')[0]} is crafting your routine...` : 'Building your routine...'}
            </Text>
            <Text style={styles.loadingSubtitle}>
              Personalizing sets, rest periods, and volume to your baseline
            </Text>
            <View style={styles.loadingDots}>
              {[
                `Adapting ${coach?.name}'s signature routine`,
                `Applying baseline calibration (Age ${age}, ${level})`,
                `Filtering for ${equipment.replace(/_/g, ' ')}`,
              ].map((step) => (
                <View key={step} style={styles.loadingStep}>
                  <Text style={styles.loadingStepDot}>●</Text>
                  <Text style={styles.loadingStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error || !plan) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Could not load plan</Text>
            <Text style={styles.errorMessage}>{error ?? 'No plan received'}</Text>
            <Pressable style={styles.retryBtn} onPress={() => fetchPlan(seed)} accessibilityRole="button">
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.backLink}>
              <Text style={styles.backLinkText}>← Go back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const quote = plan.coachMessage || plan.why;
  const adaptationPills = plan.notes ? plan.notes.split(' | ').filter(Boolean) : [];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {mode === 'saved' ? (
            <Text style={styles.headerTitle}>Your plan</Text>
          ) : (
            <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.headerBack}>← Back</Text>
            </Pressable>
          )}
          <Image source={wordmarkImage} style={styles.headerLogo} accessible accessibilityLabel="Athleet" contentFit="contain" />
        </View>

        {/* Feedback notification toast */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>⚡ {toastMessage}</Text>
          </View>
        )}

        {/* Coach Header banner */}
        <View style={styles.quoteCard}>
          {coach && (
            <View style={styles.quoteCoach}>
              <CoachAvatar coach={coach} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quoteCoachName}>Coach {coach.name}</Text>
                <Text style={styles.quoteCoachSub}>{coach.category} • Authentic Athlete Routine</Text>
              </View>
              {seed > 0 && (
                <View style={styles.variationBadge}>
                  <Text style={styles.variationBadgeText}>Var #{seed + 1}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.quoteText}>{`"${quote}"`}</Text>
        </View>

        {/* Baseline Personalization Badges */}
        <View style={styles.baselineBox}>
          <Text style={styles.baselineHeader}>ACTIVE BASELINE ADAPTATION</Text>
          <Text style={styles.baselineSub}>
            Calibrated for: <Text style={styles.baselineHighlight}>{age} yrs</Text> •{' '}
            <Text style={styles.baselineHighlight}>{level.toUpperCase()}</Text> •{' '}
            <Text style={styles.baselineHighlight}>{equipment.replace(/_/g, ' ')}</Text> •{' '}
            <Text style={styles.baselineHighlight}>{daysPerWeek} {daysPerWeek === 1 ? 'day' : 'days'}/wk</Text> •{' '}
            <Text style={styles.baselineHighlight}>{sessionMinutes} min</Text>
          </Text>

          {adaptationPills.length > 0 && (
            <View style={styles.pillsRow}>
              {adaptationPills.map((pill, idx) => {
                const parts = pill.split(': ');
                const label = parts[0];
                return (
                  <View key={idx} style={styles.adaptationPill}>
                    <Text style={styles.adaptationPillText}>{label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Training days per week */}
        <View style={styles.daysPicker}>
          <Text style={styles.daysPickerLabel}>DAYS PER WEEK</Text>
          <View style={styles.daysPickerRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Pressable
                key={n}
                onPress={() => changeDays(n)}
                style={[styles.daysChip, daysPerWeek === n && styles.daysChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Train ${n} days per week`}>
                <Text style={[styles.daysChipText, daysPerWeek === n && styles.daysChipTextActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Minutes per session */}
        <View style={styles.daysPicker}>
          <Text style={styles.daysPickerLabel}>MINUTES PER SESSION</Text>
          <View style={styles.daysPickerRow}>
            {[...new Set([20, 30, 45, 60, 90, 120, sessionMinutes])].sort((a, b) => a - b).map((n) => (
              <Pressable
                key={n}
                onPress={() => changeMinutes(n)}
                style={[styles.daysChip, styles.minutesChip, sessionMinutes === n && styles.daysChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Train ${n} minutes per session`}>
                <Text style={[styles.daysChipText, sessionMinutes === n && styles.daysChipTextActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Warnings: not enough to reach the goal, or not enough rest */}
        {planWarnings({ age, level, goal: goal as any, daysPerWeek, sessionMinutes }).map((w) => (
          <View key={w.title} style={[styles.warnCard, w.tone === 'high' ? styles.warnHigh : styles.warnLow]}>
            <Text style={styles.warnTitle}>{w.tone === 'high' ? '⚠️ Needs more rest: ' : '⚠️ Might not reach your goal: '}{w.title}</Text>
            <Text style={styles.warnText}>{w.text}</Text>
          </View>
        ))}

        {/* Day selection tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabs}
          style={styles.dayTabsScroll}
        >
          {plan.days.map((day, index) => (
            <Pressable
              key={index}
              onPress={() => setExpandedDay(index)}
              style={[styles.dayTab, expandedDay === index && styles.dayTabActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.dayTabText, expandedDay === index && styles.dayTabTextActive]}>
                {day.name.split(' — ')[0]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Active day details */}
        {plan.days[expandedDay] && (
          <View style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{plan.days[expandedDay].name}</Text>
              <Text style={styles.dayFocus}>{plan.days[expandedDay].focus}</Text>
              {plan.days[expandedDay].estimatedMinutes && (
                <Text style={styles.dayMeta}>
                  ⏱ {plan.days[expandedDay].estimatedMinutes} min session • {plan.days[expandedDay].exercises.length} exercises
                </Text>
              )}
            </View>

            {/* Warm-up */}
            {plan.days[expandedDay].warmUp && (
              <View style={styles.phaseBlock}>
                <Text style={styles.phaseLabel}>🔥 WARM-UP & MOBILITY</Text>
                <Text style={styles.phaseText}>{plan.days[expandedDay].warmUp}</Text>
              </View>
            )}

            {/* Exercises */}
            {plan.days[expandedDay].exercises.map((exercise, exIndex) => (
              <View key={exIndex} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{exIndex + 1}</Text>
                  </View>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                </View>

                <View style={styles.exerciseStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Sets</Text>
                    <Text style={styles.statValue}>{exercise.sets}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Reps</Text>
                    <Text style={styles.statValue}>{exercise.reps}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Rest</Text>
                    <Text style={styles.statValue}>{exercise.rest}</Text>
                  </View>
                </View>

                {exercise.notes && (
                  <Text style={styles.exerciseNotes}>💡 {exercise.notes}</Text>
                )}
                {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                  <View style={styles.muscleTags}>
                    {exercise.muscleGroups.map((mg) => (
                      <View key={mg} style={styles.muscleTag}>
                        <Text style={styles.muscleTagText}>{mg}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Cool-down */}
            {plan.days[expandedDay].coolDown && (
              <View style={styles.phaseBlock}>
                <Text style={styles.phaseLabel}>🧊 COOL-DOWN & RECOVERY</Text>
                <Text style={styles.phaseText}>{plan.days[expandedDay].coolDown}</Text>
              </View>
            )}
          </View>
        )}

        {/* Nutrition Blueprint */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🥗 Nutrition Blueprint</Text>
          <Text style={styles.infoSummary}>{plan.nutrition.summary}</Text>
          {plan.nutrition.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Recovery & Longevity */}
        {plan.recovery && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💤 Longevity & Recovery</Text>
            <Text style={styles.infoSummary}>{plan.recovery.summary}</Text>
            {plan.recovery.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {mode === 'preview' ? (
            <Pressable
              style={[styles.selectBtn, isSelected && styles.selectBtnDone]}
              onPress={handleSelect}
              disabled={isSelected}
              accessibilityRole="button"
              accessibilityLabel="Select this plan">
              <Text style={[styles.selectText, isSelected && styles.selectTextDone]}>
                {isSelected ? '✓  This is your plan' : '✓  Select this plan'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.chatBtn}
              onPress={() => router.navigate('/coaches')}
              accessibilityRole="button">
              <Text style={styles.chatBtnText}>🔁  Switch coach</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.regenerateBtn, regenerating && styles.regenerateBtnActive]}
            onPress={handleRegenerate}
            disabled={regenerating}
            accessibilityRole="button"
          >
            {regenerating ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color="#f5f5f5" />
                <Text style={styles.regenerateText}>  Generating Variation...</Text>
              </View>
            ) : (
              <Text style={styles.regenerateText}>🔄  Regenerate Plan (New Variation)</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.chatBtn}
            onPress={() => router.push({ pathname: '/chat/[id]' as any, params: { id: coachId } })}
            accessibilityRole="button"
          >
            <Text style={styles.chatBtnText}>💬  Chat with {coach?.name.split(' ')[0]}</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          ⚕️ Always consult a physician before initiating a high-intensity training protocol.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f5f5f5' },
  selectBtn: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
  selectBtnDone: { backgroundColor: '#1f3a26', borderWidth: 1, borderColor: '#3d7a4e' },
  selectText: { color: '#0d0d0f', fontSize: 17, fontWeight: '800' },
  selectTextDone: { color: '#b8f0c6' },
  daysPicker: { marginTop: 16, gap: 8 },
  daysPickerLabel: { color: '#8a8a90', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  daysPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  minutesChip: { width: 'auto', minWidth: 40, paddingHorizontal: 8 },
  warnCard: { borderRadius: 8, borderWidth: 1, padding: 14, marginTop: 12, gap: 4 },
  warnLow: { backgroundColor: '#2a2410', borderColor: '#6b5a1e' },
  warnHigh: { backgroundColor: '#2e1616', borderColor: '#7a2e2e' },
  warnTitle: { color: '#f5f5f5', fontSize: 14, fontWeight: '700' },
  warnText: { color: '#d0d0d5', fontSize: 13, lineHeight: 19 },
  daysChip: { flexGrow: 1, minWidth: 38, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a40', backgroundColor: '#1a1a1d', alignItems: 'center', justifyContent: 'center' },
  daysChipActive: { backgroundColor: '#f5f5f5', borderColor: '#f5f5f5' },
  daysChipText: { color: '#d0d0d5', fontSize: 15, fontWeight: '700' },
  daysChipTextActive: { color: '#0d0d0f' },
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 64,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: { fontSize: 15, color: '#a0a0a6' },
  headerLogo: { width: 96, height: 30 },

  // Toast
  toastBanner: {
    backgroundColor: '#2a2a2e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f5f5f5',
  },
  toastText: { color: '#f5f5f5', fontSize: 13, fontWeight: '600' },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingCard: {
    backgroundColor: '#1a1a1d',
    borderWidth: 1,
    borderColor: '#2a2a2e',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: '#f5f5f5', marginTop: 20, textAlign: 'center' },
  loadingSubtitle: { fontSize: 14, color: '#8a8a90', marginTop: 6, textAlign: 'center' },
  loadingDots: { marginTop: 24, gap: 10, alignSelf: 'stretch' },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingStepDot: { fontSize: 8, color: '#f5f5f5' },
  loadingStepText: { fontSize: 13, color: '#a0a0a6' },

  // Error
  errorCard: {
    backgroundColor: '#1a1a1d',
    borderWidth: 1,
    borderColor: '#2a2a2e',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  errorEmoji: { fontSize: 40 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#f5f5f5', marginTop: 16 },
  errorMessage: { fontSize: 14, color: '#8a8a90', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 24,
  },
  retryText: { color: '#0d0d0f', fontWeight: '700', fontSize: 15 },
  backLink: { marginTop: 16 },
  backLinkText: { color: '#8a8a90', fontSize: 14 },

  // Quote card
  quoteCard: {
    backgroundColor: '#1a1a1d',
    borderWidth: 1,
    borderColor: '#2a2a2e',
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
  },
  quoteCoach: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  quoteCoachName: { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },
  quoteCoachSub: { color: '#8a8a90', fontSize: 12, marginTop: 2 },
  quoteText: { color: '#e0e0e5', fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  variationBadge: {
    backgroundColor: '#2a2a2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  variationBadgeText: { color: '#a0a0a6', fontSize: 11, fontWeight: '700' },

  // Baseline Box
  baselineBox: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#2a2a2e',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  baselineHeader: { fontSize: 11, fontWeight: '800', color: '#8a8a90', letterSpacing: 1 },
  baselineSub: { fontSize: 13, color: '#a0a0a6', marginTop: 4 },
  baselineHighlight: { color: '#f5f5f5', fontWeight: '600' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  adaptationPill: {
    backgroundColor: '#1f1f23',
    borderColor: '#3a3a42',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adaptationPillText: { color: '#d0d0d8', fontSize: 12, fontWeight: '600' },

  // Day tabs
  dayTabsScroll: { marginTop: 18 },
  dayTabs: { gap: 8, paddingRight: 20 },
  dayTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1d',
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  dayTabActive: { backgroundColor: '#f5f5f5', borderColor: '#f5f5f5' },
  dayTabText: { fontSize: 13, fontWeight: '600', color: '#8a8a90' },
  dayTabTextActive: { color: '#0d0d0f' },

  // Day card
  dayCard: {
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    marginTop: 16,
    overflow: 'hidden',
  },
  dayHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2e',
  },
  dayTitle: { fontSize: 18, fontWeight: '700', color: '#f5f5f5' },
  dayFocus: { fontSize: 14, color: '#a0a0a6', marginTop: 2 },
  dayMeta: { fontSize: 12, color: '#6b6b72', marginTop: 4 },

  // Phase blocks
  phaseBlock: {
    padding: 14,
    backgroundColor: '#141416',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2e',
  },
  phaseLabel: { fontSize: 11, fontWeight: '700', color: '#8a8a90', letterSpacing: 1, marginBottom: 4 },
  phaseText: { fontSize: 14, color: '#c0c0c5', lineHeight: 20 },

  // Exercise card
  exerciseCard: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2e',
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseNumber: {
    backgroundColor: '#2a2a2e',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: { color: '#f5f5f5', fontSize: 12, fontWeight: '700' },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#f5f5f5', flex: 1 },

  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#141416',
    borderRadius: 8,
    padding: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#8a8a90', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#f5f5f5', marginTop: 2 },
  statDivider: { width: 1, height: 26, backgroundColor: '#2a2a2e' },

  exerciseNotes: { fontSize: 13, color: '#a0a0a6', marginTop: 8, fontStyle: 'italic' },
  muscleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  muscleTag: {
    backgroundColor: '#2a2a2e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  muscleTagText: { fontSize: 11, color: '#b0b0b5' },

  // Info cards
  infoCard: {
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    padding: 16,
    marginTop: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#f5f5f5', marginBottom: 8 },
  infoSummary: { fontSize: 14, color: '#a0a0a6', lineHeight: 20, marginBottom: 8 },
  tipRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tipBullet: { fontSize: 14, color: '#6b6b72' },
  tipText: { fontSize: 14, color: '#c0c0c5', flex: 1, lineHeight: 20 },

  disclaimer: { fontSize: 12, color: '#6b6b72', textAlign: 'center', marginTop: 20 },

  // Actions
  actions: { marginTop: 24, gap: 10 },
  regenerateBtn: {
    borderWidth: 1,
    borderColor: '#3a3a40',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#1a1a1d',
  },
  regenerateBtnActive: { opacity: 0.8 },
  regenerateText: { color: '#f5f5f5', fontWeight: '600', fontSize: 15 },
  chatBtn: {
    borderWidth: 1,
    borderColor: '#3a3a40',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#1a1a1d',
  },
  chatBtnText: { color: '#f5f5f5', fontWeight: '600', fontSize: 15 },
});
