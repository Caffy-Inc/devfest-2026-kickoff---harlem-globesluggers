import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSelectedPlan } from '@/lib/selected-plan';
import { colors } from '@/lib/theme';

// The bottom tabs, defined once so the real tab navigator and the persistent bar below match.
export const PLAN_TABS = [
  { name: 'coaches', href: '/coaches', title: 'Coaches', icon: '💬', needsPlan: false },
  { name: 'my-plan', href: '/my-plan', title: 'Your Plan', icon: '📋', needsPlan: true },
  { name: 'recap', href: '/recap', title: 'Workout Plan', icon: '📅', needsPlan: true },
  { name: 'my-meals', href: '/my-meals', title: 'Your Meals', icon: '🥗', needsPlan: true },
] as const;

export const TAB_COLORS = {
  background: colors.bg,
  border: colors.border,
  active: colors.accent,
  inactive: colors.textFaint,
};

/**
 * Keeps the bottom tabs on screen outside the (tabs) group (home, questionnaire, coach
 * chat/workout) once a plan has been selected. Inside (tabs) the real tab bar already shows.
 */
export function PlanTabBar() {
  const selected = useSelectedPlan();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!selected || segments[0] === '(tabs)') return null;

  // A coach session belongs to the Coaches tab; other screens have no active tab.
  const active = segments[0] === 'chat' ? 'coaches' : null;

  function go(href: string) {
    // Pop back to the root so tab screens don't pile up on top of the stack.
    if (router.canDismiss()) router.dismissAll();
    router.navigate(href as any);
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]} accessibilityRole="tablist">
      {PLAN_TABS.map(tab => {
        const focused = tab.name === active;
        const color = focused ? TAB_COLORS.active : TAB_COLORS.inactive;
        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => go(tab.href)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.title}>
            <Text style={[styles.icon, { color }]}>{tab.icon}</Text>
            <Text style={[styles.label, { color }]} numberOfLines={1}>{tab.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: TAB_COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TAB_COLORS.border,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 44 },
  icon: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: '500' },
});
