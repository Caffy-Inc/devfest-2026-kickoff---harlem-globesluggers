import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetOptions } from '@/components/budget-options';
import { HomeLogo } from '@/components/home-logo';
import { colors } from '@/lib/theme';
import { useCurrentMealPlan } from '@/lib/use-meal-plan';

const money = (n: number) => `$${n.toFixed(2)}`;

/** "Budget" tab: choose a weekly food budget, the cheapest plan, or no budget. */
export default function BudgetScreen() {
  const { selected, mealPlan, budget } = useCurrentMealPlan();

  if (!selected) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No meal plan yet</Text>
          <Text style={styles.emptyText}>Pick a plan first, then set a food budget for its meals.</Text>
          <Pressable style={styles.btn} onPress={() => router.navigate('/coaches')} accessibilityRole="button">
            <Text style={styles.btnText}>Browse coaches</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const weekly = mealPlan?.costPerWeek ?? 0;
  const info = mealPlan?.budget;
  const limit = budget.mode === 'weekly' ? budget.weeklyLimit : undefined;
  const over = !!limit && weekly > limit + 0.005;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Budget</Text>
            <HomeLogo style={styles.headerLogo} />
          </View>

          <Text style={styles.intro}>
            How much do you want to spend on food? Your meals, swaps and grocery list update to match.
          </Text>

          <BudgetOptions budget={budget} />

          {mealPlan && (
            <View style={styles.result}>
              <Text style={styles.resultLabel}>YOUR MEAL PLAN COSTS</Text>
              <Text style={styles.resultValue}>
                {money(weekly)}
                <Text style={styles.resultUnit}> / week</Text>
              </Text>
              <Text style={styles.resultSub}>
                {money(mealPlan.day.cost)} a day · about {money(mealPlan.avgCostPerMeal)} a meal
              </Text>

              {limit != null && (
                <View style={[styles.status, over ? styles.statusOver : styles.statusOk]}>
                  <Text style={[styles.statusText, { color: over ? colors.warning : colors.successText }]}>
                    {over
                      ? `${money(weekly - limit)} over your ${money(limit)} budget. Even the cheapest meals that hit your calories cost ${money(info?.cheapestPerWeek ?? weekly)}/week.`
                      : `✓ ${money(limit - weekly)} under your ${money(limit)} budget`}
                  </Text>
                </View>
              )}

              {budget.mode !== 'cheapest' && info && info.cheapestPerWeek < weekly - 0.005 && (
                <Text style={styles.note}>The cheapest plan for you would cost {money(info.cheapestPerWeek)}/week.</Text>
              )}
              <Text style={styles.note}>
                Your first shop costs more (about {money(mealPlan.groceryCheckoutTotal)}) because you buy whole packages.
                Pantry items like rice, oats and oil last into the next weeks.
              </Text>

              <Pressable style={styles.btn} onPress={() => router.navigate('/my-meals')} accessibilityRole="button">
                <Text style={styles.btnText}>See your meals →</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 16 },

  result: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  resultLabel: { fontSize: 11, color: colors.textSubtle, fontWeight: '800', letterSpacing: 1 },
  resultValue: { fontSize: 32, color: colors.successText, fontWeight: '800', marginTop: 4 },
  resultUnit: { fontSize: 15, color: colors.textSubtle, fontWeight: '600' },
  resultSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  status: { marginTop: 12, borderRadius: 8, borderWidth: 1, padding: 10 },
  statusOk: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  statusOver: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
  statusText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  note: { fontSize: 12, color: colors.textSubtle, lineHeight: 17, marginTop: 10 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
});
