import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RESTRICTIONS, type Restriction, type RestrictionId } from '@/data/dietary';
import { setDietaryRestrictions, toggleDietaryRestriction } from '@/lib/dietary-store';
import { colors, emoji, themedStyles } from '@/lib/theme';

type Props = { selected: RestrictionId[] };

const GROUPS: { id: Restriction['group']; title: string }[] = [
  { id: 'diet', title: 'DIET' },
  { id: 'allergy', title: 'ALLERGIES & INTOLERANCES' },
];

/** Collapsible card for picking diets and allergies; the meal plan filters recipes to match. */
export function DietaryRestrictions({ selected }: Props) {
  const [open, setOpen] = useState(false);
  const summary = selected.length
    ? RESTRICTIONS.filter((r) => selected.includes(r.id))
        .map((r) => (r.group === 'allergy' ? `No ${r.label.toLowerCase()}` : r.label))
        .join(' · ')
    : 'None set. Every recipe is on the menu.';

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Dietary restrictions">
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{emoji('🥦')}Dietary restrictions</Text>
          <Text style={styles.summary} numberOfLines={open ? undefined : 2}>
            {summary}
          </Text>
        </View>
        <Text style={styles.edit}>{open ? 'Done ▴' : 'Edit ▾'}</Text>
      </Pressable>

      {open && (
        <View style={styles.body}>
          {GROUPS.map((g) => (
            <View key={g.id} style={styles.group}>
              <Text style={styles.groupTitle}>{g.title}</Text>
              <View style={styles.chips}>
                {RESTRICTIONS.filter((r) => r.group === g.id).map((r) => {
                  const on = selected.includes(r.id);
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => toggleDietaryRestriction(r.id)}
                      style={[styles.chip, on && styles.chipOn]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={g.id === 'allergy' ? `${r.label} allergy` : r.label}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {on ? '✓ ' : ''}
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Text style={styles.disclaimer}>
            Recipes are filtered by ingredient. Always check labels for cross-contact if you have a severe allergy.
          </Text>
          {selected.length > 0 && (
            <Pressable onPress={() => setDietaryRestrictions([])} style={styles.clear} accessibilityRole="button">
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = themedStyles(() => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  summary: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  edit: { fontSize: 13, color: colors.text, fontWeight: '600', paddingVertical: 2 },
  body: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  group: { marginBottom: 12 },
  groupTitle: { fontSize: 11, color: colors.textSubtle, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSunken,
  },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextOn: { color: colors.accent },
  disclaimer: { fontSize: 11, color: colors.textFaint, lineHeight: 15 },
  clear: { alignSelf: 'flex-start', paddingVertical: 8, marginTop: 4 },
  clearText: { fontSize: 13, color: colors.text, fontWeight: '600' },
}));
