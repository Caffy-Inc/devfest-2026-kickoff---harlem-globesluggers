import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BudgetOptions, budgetLabel } from '@/components/budget-options';
import type { BudgetSetting } from '@/lib/budget-store';
import type { MealPlan } from '@/lib/meal-plan';
import { defaultWeek } from '@/lib/meal-week';
import { colors } from '@/lib/theme';

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Food budget, shown inside "Your Meals": a summary pill that expands into the
 * budget picker and what the meal plan costs against it.
 */
export function BudgetPanel({ budget, mealPlan }: { budget: BudgetSetting; mealPlan: MealPlan | null | undefined }) {
  const [open, setOpen] = useState(false);

  const week = mealPlan ? defaultWeek(mealPlan) : null;
  const weekly = week?.cost ?? 0;
  const info = mealPlan?.budget;
  const limit = budget.mode === 'weekly' ? budget.weeklyLimit : undefined;
  const over = !!limit && weekly > limit + 0.005;

  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <Pressable
        style={styles.pill}
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Budget: ${budgetLabel(budget)}. ${open ? 'Hide' : 'Change'} budget`}>
        <Text style={styles.pillText}>💵 {budgetLabel(budget)}</Text>
        <Text style={styles.pillEdit}>{open ? 'Done ˄' : 'Change ›'}</Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
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
                {money(weekly / 7)} a day · about {money(week?.avgCostPerMeal ?? 0)} a meal
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
                Your first shop costs more (about {money(week?.checkout ?? 0)}) because you buy whole packages.
                Pantry items like rice, oats and oil last into the next weeks.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardOpen: { borderColor: colors.borderStrong },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  pillText: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1 },
  pillEdit: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  result: {
    marginTop: 16,
    backgroundColor: colors.bg,
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
});
