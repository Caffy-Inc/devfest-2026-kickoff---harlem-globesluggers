import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanView } from '@/components/plan-view';
import { useSelectedPlan } from '@/lib/selected-plan';
import { colors } from '@/lib/theme';

export default function MyPlanScreen() {
  const selected = useSelectedPlan();
  if (!selected) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.title}>No plan yet</Text>
          <Text style={styles.text}>Build your plan with a coach, then train together one set at a time.</Text>
          <Pressable style={styles.btn} onPress={() => router.navigate('/coaches')} accessibilityRole="button">
            <Text style={styles.btnText}>Browse coaches</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  // key: rebuild the view when a different plan is selected from another screen.
  // Stay inside the tabs so Workout Plan and Your Meals remain reachable; workouts still open with the coach.
  return (
    <PlanView
      key={`${selected.coachId}`}
      mode="saved"
      onStartWorkout={day => router.push({ pathname: '/chat/[id]', params: { id: selected.coachId, view: 'workout', day: String(day) } })}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  text: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  btn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
