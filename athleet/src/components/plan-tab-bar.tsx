import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSelectedPlan } from '@/lib/selected-plan';
import { colors } from '@/lib/theme';

// The bottom tabs, defined once so the real tab navigator and the persistent bar below match.
// Coaches stays a route (reached from "Browse coaches" on Your Plan) but is hidden from the bar.
export const PLAN_TABS = [
  { name: 'coaches', href: '/coaches', title: 'Coaches', icon: '💬', needsPlan: false, hidden: true },
  { name: 'my-plan', href: '/my-plan', title: 'Your Plan', icon: '📋', needsPlan: false, hidden: false },
  { name: 'recap', href: '/recap', title: 'Workout Plan', icon: '📅', needsPlan: true, hidden: false },
  { name: 'my-meals', href: '/my-meals', title: 'Your Meals', icon: '🥗', needsPlan: true, hidden: false },
] as const;

export const TAB_COLORS = {
  background: colors.bg,
  border: colors.border,
  active: colors.accent,
  inactive: colors.textFaint,
};

/**
 * Keeps the bottom tabs on screen outside the (tabs) group (coach chat/workout, plan, etc.)
 * once a plan has been selected. Not shown on the home page or questionnaire. Inside (tabs)
 * the real tab bar already shows.
 */
export function PlanTabBar() {
  const selected = useSelectedPlan();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Hidden on the home page (no segments) and the questionnaire, and inside (tabs) where the real bar shows.
  const route = segments[0];
  if (!selected || route === undefined || route === 'index' || route === 'questionnaire' || route === '(tabs)') return null;

  // A coach session belongs to Your Plan (coaches are reached from there); other screens have no active tab.
  const active = segments[0] === 'chat' ? 'my-plan' : null;

  function go(href: string) {
    // Pop back to the root so tab screens don't pile up on top of the stack.
    if (router.canDismiss()) router.dismissAll();
    router.navigate(href as any);
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]} accessibilityRole="tablist">
      {PLAN_TABS.filter(tab => !tab.hidden).map(tab => {
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
