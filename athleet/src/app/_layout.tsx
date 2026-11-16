import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { View } from 'react-native';

import { PlanTabBar } from '@/components/plan-tab-bar';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
          <Stack.Screen name="plan" options={{ headerShown: false }} />
          <Stack.Screen name="voice-settings" options={{ headerShown: false }} />
          <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
        {/* Once a plan is selected, the bottom tabs stay visible on every screen. */}
        <PlanTabBar />
      </View>
    </ThemeProvider>
  );
}
