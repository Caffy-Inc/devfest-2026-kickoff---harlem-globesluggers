import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetPanel } from '@/components/budget-panel';
import { DietaryRestrictions } from '@/components/dietary-restrictions';
import { HomeLogo } from '@/components/home-logo';
import { NutritionBlueprint } from '@/components/nutrition-blueprint';
import { trainingWeekdays } from '@/lib/plan';
import { useCurrentMealPlan } from '@/lib/use-meal-plan';
import { colors, themedStyles } from '@/lib/theme';
import { themed } from '@/components/themed-screen';

/** "Your Meals" tab: the food budget and the Nutrition Blueprint for the selected plan. */
function MyMealsScreen() {
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your meals</Text>
            <HomeLogo style={styles.headerLogo} />
          </View>
          <BudgetPanel budget={budget} mealPlan={mealPlan} />
          <DietaryRestrictions selected={restrictions} />
          <NutritionBlueprint
            summary={nutrition.summary}
            tips={nutrition.tips}
            targets={nutrition.targets}
            mealPlan={mealPlan}
            trainingDays={trainingWeekdays(selected.plan.days)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => ({
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
}));

// Redraws with the new look when the appearance settings change.
export default themed(MyMealsScreen);
