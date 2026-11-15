import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { PLAN_TABS, TAB_COLORS } from '@/components/plan-tab-bar';
import { useSelectedPlan } from '@/lib/selected-plan';

export default function TabLayout() {
  const selected = useSelectedPlan();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: TAB_COLORS.background },
        tabBarStyle: { backgroundColor: TAB_COLORS.background, borderTopColor: TAB_COLORS.border },
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
      }}>
      {PLAN_TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Plan, workouts and meals only show up once a plan has been selected.
            href: !tab.needsPlan || selected ? (tab.href as any) : null,
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{tab.icon}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
