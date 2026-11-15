import { Tabs, router } from 'expo-router';
import { Text } from 'react-native';

import { useSelectedPlan } from '@/lib/selected-plan';

export default function TabLayout() {
  const selected = useSelectedPlan();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#0d0d0f' },
        tabBarStyle: { backgroundColor: '#0d0d0f', borderTopColor: '#2a2a2e' },
        tabBarActiveTintColor: '#f5f5f5',
        tabBarInactiveTintColor: '#6b6b72',
      }}>
      <Tabs.Screen
        name="coaches"
        options={{
          title: 'Coaches',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="my-plan"
        listeners={{ tabPress: event => {
          if (!selected) return;
          event.preventDefault();
          router.navigate({ pathname: '/chat/[id]', params: { id: selected.coachId, view: 'plan' } });
        } }}
        options={{
          title: 'Your Plan',
          // Only shows up once a plan has been selected.
          href: selected ? '/my-plan' : null,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          title: 'Workout Plan',
          href: selected ? ('/recap' as any) : null,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="my-meals"
        options={{
          title: 'Your Meals',
          // Meals come with the plan, so this also waits for a selection.
          href: selected ? ('/my-meals' as any) : null,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🥗</Text>,
        }}
      />
    </Tabs>
  );
}
