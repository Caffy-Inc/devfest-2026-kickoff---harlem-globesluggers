import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { PLAN_TABS } from '@/components/plan-tab-bar';
import { useSelectedPlan } from '@/lib/selected-plan';
import { useTheme } from '@/lib/theme';

export default function TabLayout() {
  const selected = useSelectedPlan();
  // The tab navigator stays mounted across theme changes, so it reads the palette reactively.
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
      }}>
      {PLAN_TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Hidden tabs (Coaches) keep their route so /coaches still opens; only the button is hidden.
            // (href: null would drop the route, and expo-router forbids href together with tabBarButton.)
            // Workouts and meals only show up once a plan has been selected.
            ...(tab.hidden
              ? { tabBarButton: () => null, tabBarItemStyle: { display: 'none' as const } }
              : { href: !tab.needsPlan || selected ? (tab.href as any) : null }),
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{tab.icon}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
