import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HomeLogo } from '@/components/home-logo';
import { OnboardingMascot } from '@/components/onboarding-mascot';
import { useSelectedPlan } from '@/lib/selected-plan';

// Home page — the app's origin route ("/"). The questionnaire lives at /questionnaire.
export default function HomeScreen() {
  const { height, width } = useWindowDimensions();
  // Saved on the device, so returning users can pick up where they left off.
  const selected = useSelectedPlan();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {/* Already home: the logo is a no-op here. */}
          <HomeLogo style={styles.logo} onPress={() => {}} />
          {selected && (
            <Pressable style={styles.myPlanButton} onPress={() => router.push('/my-plan' as any)} accessibilityRole="button">
              <Text style={styles.myPlanButtonText}>My plan</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.welcome}>
          <View style={styles.welcomeBubble}>
            <View style={styles.welcomeBubbleTail} />
            <Text accessibilityRole="header" style={styles.welcomeTitle}>Welcome to Athleet</Text>
          </View>
          <OnboardingMascot size={Math.min(width - 48, height * 0.45, 360)} reaction="welcome" cue="start" />
          <Pressable style={styles.button} onPress={() => router.push('/questionnaire' as any)} accessibilityRole="button">
            <Text style={styles.buttonText}>Start a new plan  →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 108, height: 34 },
  welcome: { flexGrow: 1, justifyContent: 'center', paddingVertical: 32, width: '100%', maxWidth: 400, alignSelf: 'center' },
  welcomeBubble: { alignSelf: 'center', backgroundColor: '#fff3d5', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, marginBottom: -8, zIndex: 1 },
  welcomeBubbleTail: { position: 'absolute', left: '39%', bottom: -6, width: 16, height: 16, backgroundColor: '#fff3d5', transform: [{ rotate: '45deg' }] },
  welcomeTitle: { color: '#24345e', fontSize: 24, fontWeight: '500', textAlign: 'center' },
  button: { backgroundColor: '#f5f5f5', borderRadius: 6, padding: 18, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#0d0d0f', fontWeight: '700', fontSize: 16 },
  myPlanButton: { borderWidth: 1, borderColor: '#3a3a40', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  myPlanButtonText: { color: '#f5f5f5', fontWeight: '600', fontSize: 14 },
});
