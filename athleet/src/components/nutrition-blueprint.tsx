import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dayTotals, groceryList, type MealPlan, type PlannedMeal } from '@/lib/meal-plan';
import type { NutritionTargets } from '@/lib/types';

type Props = {
  summary: string;
  tips: string[];
  targets?: NutritionTargets;
  mealPlan?: MealPlan;
};

const money = (n: number) => `$${n.toFixed(2)}`;
const SLOT_ICON: Record<string, string> = { breakfast: '🌅', lunch: '🥙', snack: '⚡', dinner: '🍽' };
const TAG_LABEL: Record<string, string> = {
  quick: 'Quick',
  no_cook: 'No-cook',
  meal_prep: 'Meal prep',
  budget: 'Budget',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pre_workout: 'Pre-workout',
  post_workout: 'Post-workout',
};

/**
 * Nutrition Blueprint: daily targets, a recipe for every meal with its
 * average grocery cost, swappable alternatives and a weekly shopping list.
 */
export function NutritionBlueprint({ summary, tips, targets, mealPlan }: Props) {
  const [picks, setPicks] = useState<number[]>(() => (mealPlan ? mealPlan.slots.map(() => 0) : []));
  const [openMeal, setOpenMeal] = useState<number | null>(null);
  const [showGroceries, setShowGroceries] = useState(false);

  // A new plan (regenerate, new coach, new settings) resets swaps.
  const [seenPlan, setSeenPlan] = useState(mealPlan);
  if (seenPlan !== mealPlan) {
    setSeenPlan(mealPlan);
    setPicks(mealPlan ? mealPlan.slots.map(() => 0) : []);
    setOpenMeal(null);
  }

  const chosen: PlannedMeal[] = useMemo(
    () => (mealPlan ? mealPlan.slots.map((s, i) => s.options[picks[i] ?? 0] ?? s.options[0]) : []),
    [mealPlan, picks]
  );
  const totals = useMemo(() => dayTotals(chosen), [chosen]);
  const groceries = useMemo(() => groceryList(chosen), [chosen]);
  const checkout = groceries.reduce((s, g) => s + g.checkoutCost, 0);

  // Older plans without recipes: keep the simple tip list.
  if (!mealPlan) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>🥗 Nutrition Blueprint</Text>
        <Text style={styles.summary}>{summary}</Text>
        {tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  }

  const showNumbers = mealPlan.showNumbers;
  const avgPerMeal = totals.cost / Math.max(1, chosen.length);

  function swap(slotIndex: number) {
    const count = mealPlan!.slots[slotIndex].options.length;
    // Build from the slots, not the old picks, so a missing entry can't swallow the tap.
    setPicks((p) => mealPlan!.slots.map((_, i) => (i === slotIndex ? ((p[i] ?? 0) + 1) % count : p[i] ?? 0)));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🥗 Nutrition Blueprint</Text>
      <Text style={styles.summary}>{summary}</Text>

      {/* Daily numbers */}
      <View style={styles.statRow}>
        {showNumbers && targets?.calories != null && (
          <Stat label="Daily target" value={`${targets.calories.toLocaleString()}`} unit="kcal" />
        )}
        {showNumbers && targets?.proteinG != null && <Stat label="Protein" value={`${targets.proteinG}`} unit="g" />}
        <Stat label="Food / day" value={money(totals.cost)} />
        <Stat label="Avg / meal" value={money(avgPerMeal)} />
      </View>
      {showNumbers && (
        <Text style={styles.totalsLine}>
          {"Today's menu: "}{totals.kcal.toLocaleString()} kcal · {totals.protein}g protein · {totals.carbs}g carbs ·{' '}
          {totals.fat}g fat
        </Text>
      )}

      {/* Meals */}
      {mealPlan.slots.map((slot, i) => {
        const meal = chosen[i];
        const open = openMeal === i;
        const swaps = slot.options.length - 1;
        return (
          <View key={slot.slot} style={styles.meal}>
            <View style={styles.mealTop}>
              <Text style={styles.slotLabel}>
                {SLOT_ICON[slot.slot]} {slot.label.toUpperCase()}
              </Text>
              <Text style={styles.mealCost}>{money(meal.cost)}</Text>
            </View>
            <Text style={styles.slotTiming}>{slot.timing}</Text>
            <Text style={styles.mealName}>{meal.name}</Text>

            <View style={styles.chips}>
              <Chip text={`⏱ ${meal.minutes} min`} />
              {meal.servings !== 1 && <Chip text={`× ${meal.servings} serving`} />}
              {meal.coachPick && <Chip text="★ Coach pick" accent />}
              {meal.tags.slice(0, 2).map((t) => (
                <Chip key={t} text={TAG_LABEL[t] ?? t} />
              ))}
            </View>

            {showNumbers && (
              <Text style={styles.macros}>
                {meal.kcal} kcal · {meal.protein}P / {meal.carbs}C / {meal.fat}F
              </Text>
            )}

            {open && (
              <View style={styles.recipe}>
                <Text style={styles.recipeHeading}>INGREDIENTS</Text>
                {meal.ingredients.map((ing, k) => (
                  <View key={k} style={styles.ingRow}>
                    <Text style={styles.ingAmount}>{ing.amount}</Text>
                    <Text style={styles.ingName}>
                      {ing.name}
                      {ing.note ? <Text style={styles.ingNote}>, {ing.note}</Text> : null}
                    </Text>
                    <Text style={styles.ingCost}>{money(ing.cost)}</Text>
                  </View>
                ))}
                <View style={styles.ingRow}>
                  <Text style={styles.ingAmount} />
                  <Text style={[styles.ingName, styles.ingNote]}>Spices, salt, garlic, oil spray</Text>
                  <Text style={styles.ingCost}>{money(0.15 * meal.servings)}</Text>
                </View>

                <Text style={[styles.recipeHeading, { marginTop: 12 }]}>STEPS</Text>
                {meal.steps.map((step, k) => (
                  <View key={k} style={styles.stepRow}>
                    <Text style={styles.stepNum}>{k + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.mealActions}>
              <Pressable
                onPress={() => setOpenMeal(open ? null : i)}
                style={styles.linkBtn}
                accessibilityRole="button"
                accessibilityLabel={`${open ? 'Hide' : 'Show'} recipe for ${meal.name}`}>
                <Text style={styles.linkText}>{open ? 'Hide recipe ▴' : 'View recipe ▾'}</Text>
              </Pressable>
              {swaps > 0 && (
                <Pressable
                  onPress={() => swap(i)}
                  style={styles.linkBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Swap ${slot.label}`}>
                  <Text style={styles.linkText}>↻ Swap ({swaps} more)</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      {/* Weekly cost + groceries */}
      <View style={styles.weekBox}>
        <View style={styles.mealTop}>
          <Text style={styles.weekTitle}>🛒 Weekly grocery list</Text>
          <Text style={styles.mealCost}>{money(totals.cost * 7)}/wk</Text>
        </View>
        <Text style={styles.weekSub}>
          Eating this menu every day. The first shop runs about {money(checkout)} at checkout because you buy whole
          packages; pantry leftovers (oil, oats, rice, spices) carry into the next weeks.
        </Text>
        {showGroceries &&
          groceries.map((g, i) => (
            <View key={i} style={styles.ingRow}>
              <Text style={styles.ingAmount}>{g.weeklyAmount}</Text>
              <Text style={styles.ingName}>
                {g.name}
                <Text style={styles.ingNote}>
                  {'  '}
                  {g.packages}× {g.packageLabel}
                </Text>
              </Text>
              <Text style={styles.ingCost}>{money(g.checkoutCost)}</Text>
            </View>
          ))}
        <Pressable
          onPress={() => setShowGroceries((v) => !v)}
          style={styles.linkBtn}
          accessibilityRole="button">
          <Text style={styles.linkText}>
            {showGroceries ? 'Hide list ▴' : `Show ${groceries.length} items ▾`}
          </Text>
        </Pressable>
      </View>

      {/* Tips */}
      <Text style={[styles.recipeHeading, { marginTop: 14 }]}>COACH NOTES</Text>
      {mealPlan.tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}

      <Text style={styles.priceNote}>{mealPlan.priceNote}</Text>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function Chip({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Text style={[styles.chipText, accent && styles.chipTextAccent]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    padding: 16,
    marginTop: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#f5f5f5', marginBottom: 8 },
  summary: { fontSize: 14, color: '#a0a0a6', lineHeight: 20, marginBottom: 12 },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    backgroundColor: '#0d0d0f',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: '#8a8a90', fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 17, color: '#f5f5f5', fontWeight: '800' },
  statUnit: { fontSize: 11, color: '#8a8a90', fontWeight: '600' },
  totalsLine: { fontSize: 12, color: '#8a8a90', marginTop: 8, textAlign: 'center' },

  meal: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#26262a',
  },
  mealTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotLabel: { fontSize: 11, color: '#8a8a90', fontWeight: '800', letterSpacing: 1 },
  slotTiming: { fontSize: 11, color: '#5e5e64', marginTop: 2 },
  mealCost: { fontSize: 15, color: '#b8f0c6', fontWeight: '800' },
  mealName: { fontSize: 16, color: '#f5f5f5', fontWeight: '700', marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  chip: { backgroundColor: '#2a2a2e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  chipAccent: { backgroundColor: '#2a2410' },
  chipText: { fontSize: 11, color: '#b0b0b5' },
  chipTextAccent: { color: '#f0d98a' },
  macros: { fontSize: 13, color: '#c0c0c5', marginTop: 8 },

  recipe: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#26262a' },
  recipeHeading: { fontSize: 11, color: '#8a8a90', fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  ingRow: { flexDirection: 'row', gap: 8, paddingVertical: 3, alignItems: 'flex-start' },
  ingAmount: { width: 104, fontSize: 13, color: '#f5f5f5', fontWeight: '600' },
  ingName: { flex: 1, fontSize: 13, color: '#c0c0c5' },
  ingNote: { color: '#6b6b72' },
  ingCost: { fontSize: 13, color: '#8a8a90', minWidth: 44, textAlign: 'right' },
  stepRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2a2a2e',
    color: '#f5f5f5',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  stepText: { flex: 1, fontSize: 13, color: '#c0c0c5', lineHeight: 19 },

  mealActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  linkBtn: { paddingVertical: 6 },
  linkText: { fontSize: 13, color: '#f5f5f5', fontWeight: '600' },

  weekBox: { marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: '#121214', borderWidth: 1, borderColor: '#26262a' },
  weekTitle: { fontSize: 14, color: '#f5f5f5', fontWeight: '700' },
  weekSub: { fontSize: 12, color: '#8a8a90', lineHeight: 17, marginTop: 4, marginBottom: 4 },

  tipRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tipBullet: { fontSize: 14, color: '#6b6b72' },
  tipText: { fontSize: 14, color: '#c0c0c5', flex: 1, lineHeight: 20 },
  priceNote: { fontSize: 11, color: '#5e5e64', marginTop: 12, lineHeight: 15 },
});
