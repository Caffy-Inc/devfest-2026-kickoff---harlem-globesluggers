import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DietaryRestrictions } from '@/components/dietary-restrictions';
import { HomeLogo } from '@/components/home-logo';
import { NutritionBlueprint } from '@/components/nutrition-blueprint';
import { withMealPlan } from '@/lib/api';
import { useDietaryRestrictions } from '@/lib/dietary-store';
import { buildMealPlan } from '@/lib/meal-plan';
import { useProfile } from '@/lib/profile-store';
import { useSelectedPlan, type SelectedPlan } from '@/lib/selected-plan';
import type { RestrictionId } from '@/data/dietary';
import type { Goal } from '@/lib/types';
import { colors } from '@/lib/theme';

/** "Your Meals" tab: the Nutrition Blueprint for the selected plan. */
export default function MyMealsScreen() {
  const selected = useSelectedPlan();
  const restrictions = useDietaryRestrictions();
  const profile = useProfile();
  // Rebuild the menu on-device whenever restrictions change, so every option and swap fits them.
  const mealPlan = useMemo(
    () => (selected ? mealPlanFor(selected, restrictions, profile?.goal) : undefined),
    [selected, restrictions, profile?.goal]
  );

  if (!selected) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.title}>No meals yet</Text>
          <Text style={styles.text}>Pick a plan first — your meals come with it.</Text>
          <Pressable style={styles.btn} onPress={() => router.navigate('/coaches')} accessibilityRole="button">
            <Text style={styles.btnText}>Browse coaches</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { nutrition } = selected.plan;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your meals</Text>
          <HomeLogo style={styles.headerLogo} />
        </View>
        <DietaryRestrictions selected={restrictions} />
        <NutritionBlueprint
          summary={nutrition.summary}
          tips={nutrition.tips}
          targets={nutrition.targets}
          mealPlan={mealPlan}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function mealPlanFor(selected: SelectedPlan, restrictions: RestrictionId[], profileGoal?: Goal) {
  const { plan, request, seed } = selected;
  if (request) return withMealPlan(plan, request, seed, restrictions).nutrition.mealPlan;
  const saved = plan.nutrition.mealPlan;
  const targets = plan.nutrition.targets;
  if (!targets) return saved;
  return buildMealPlan({
    goal: profileGoal ?? 'general_fitness',
    coachId: selected.coachId,
    targets,
    seed,
    coachTips: plan.nutrition.tips,
    restrictions,
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 64 },
  header: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerLogo: { width: 96, height: 30 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  text: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  btn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
