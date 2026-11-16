import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DietaryRestrictions } from '@/components/dietary-restrictions';
import { HomeLogo } from '@/components/home-logo';
import { NutritionBlueprint } from '@/components/nutrition-blueprint';
import { budgetLabel } from '@/components/budget-options';
import { useCurrentMealPlan } from '@/lib/use-meal-plan';
import { colors } from '@/lib/theme';

/** "Your Meals" tab: the Nutrition Blueprint for the selected plan. */
export default function MyMealsScreen() {
  // Rebuilt on-device whenever restrictions or the budget change, so every option and swap fits them.
  const { selected, mealPlan, restrictions, budget } = useCurrentMealPlan();

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
        <Pressable
          style={styles.budgetPill}
          onPress={() => router.navigate('/budget')}
          accessibilityRole="button"
          accessibilityLabel={`Budget: ${budgetLabel(budget)}. Change budget`}>
          <Text style={styles.budgetText}>💵 {budgetLabel(budget)}</Text>
          <Text style={styles.budgetEdit}>Change ›</Text>
        </Pressable>
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
  budgetPill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  budgetText: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1 },
  budgetEdit: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  text: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  btn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
