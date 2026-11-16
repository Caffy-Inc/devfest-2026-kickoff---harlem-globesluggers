import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  MAX_WEEKLY_BUDGET,
  MIN_WEEKLY_BUDGET,
  setBudget,
  type BudgetMode,
  type BudgetSetting,
} from '@/lib/budget-store';
import { colors } from '@/lib/theme';

const QUICK_AMOUNTS = [40, 60, 80, 100];

const OPTIONS: { mode: BudgetMode; icon: string; title: string; text: string }[] = [
  {
    mode: 'weekly',
    icon: '💵',
    title: 'Set a weekly budget',
    text: 'Enter what you can spend on food each week. We pick the best meals that fit.',
  },
  {
    mode: 'cheapest',
    icon: '🪙',
    title: 'Cheapest possible',
    text: 'The lowest-cost meals that still hit your calories and dietary needs.',
  },
  {
    mode: 'none',
    icon: '🍽',
    title: 'No budget',
    text: 'Keep the meal plan as your coach built it, without price in mind.',
  },
];

/** One-line description of the current budget, e.g. "$60/week budget". */
export function budgetLabel(b: BudgetSetting): string {
  if (b.mode === 'cheapest') return 'Cheapest possible meals';
  if (b.mode === 'weekly' && b.weeklyLimit) return `$${formatAmount(b.weeklyLimit)}/week budget`;
  return 'No budget set';
}

function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Three-way picker for the food budget: weekly amount, cheapest, or none. */
export function BudgetOptions({ budget }: { budget: BudgetSetting }) {
  const [text, setText] = useState(budget.weeklyLimit ? formatAmount(budget.weeklyLimit) : '');
  const [error, setError] = useState<string | null>(null);

  function choose(mode: BudgetMode) {
    setBudget({ ...budget, mode });
  }

  function onAmount(raw: string) {
    // Digits and one decimal point, at most two decimals.
    const clean = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').replace(/(\.\d{2}).+/, '$1');
    setText(clean);
    const n = Number(clean);
    if (!clean || !Number.isFinite(n) || n < MIN_WEEKLY_BUDGET) {
      setError(clean ? `Enter at least $${MIN_WEEKLY_BUDGET}.` : null);
      setBudget({ mode: 'weekly', weeklyLimit: undefined });
      return;
    }
    if (n > MAX_WEEKLY_BUDGET) {
      setError(`Enter $${MAX_WEEKLY_BUDGET} or less.`);
      return;
    }
    setError(null);
    setBudget({ mode: 'weekly', weeklyLimit: n });
  }

  function quick(n: number) {
    setText(String(n));
    setError(null);
    setBudget({ mode: 'weekly', weeklyLimit: n });
  }

  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const on = budget.mode === o.mode;
        return (
          <View key={o.mode} style={[styles.option, on && styles.optionOn]}>
            <Pressable
              onPress={() => choose(o.mode)}
              style={styles.optionTop}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.title}
              accessibilityHint={o.text}>
              <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>
                  {o.icon} {o.title}
                </Text>
                <Text style={styles.optionText}>{o.text}</Text>
              </View>
            </Pressable>

            {on && o.mode === 'weekly' && (
              <View style={styles.amountBox}>
                <View style={[styles.inputRow, error && styles.inputRowError]}>
                  <Text style={styles.dollar}>$</Text>
                  <TextInput
                    value={text}
                    onChangeText={onAmount}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="60"
                    placeholderTextColor={colors.textFaint}
                    style={styles.input}
                    maxLength={7}
                    accessibilityLabel="Weekly food budget in dollars"
                  />
                  <Text style={styles.perWeek}>per week</Text>
                </View>
                {error && <Text style={styles.error}>{error}</Text>}
                <View style={styles.quickRow}>
                  {QUICK_AMOUNTS.map((n) => {
                    const picked = budget.weeklyLimit === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => quick(n)}
                        style={[styles.quick, picked && styles.quickOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: picked }}
                        accessibilityLabel={`$${n} per week`}>
                        <Text style={[styles.quickText, picked && styles.quickTextOn]}>${n}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: 16 },
  option: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionText: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },

  amountBox: { marginTop: 12, marginLeft: 32 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
  },
  inputRowError: { borderColor: colors.danger },
  dollar: { fontSize: 20, fontWeight: '800', color: colors.text },
  input: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text, paddingVertical: 10, paddingHorizontal: 6 },
  perWeek: { fontSize: 13, color: colors.textSubtle },
  error: { fontSize: 12, color: colors.danger, marginTop: 6 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  quick: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSunken,
  },
  quickOn: { borderColor: colors.accent },
  quickText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  quickTextOn: { color: colors.accent },
});
