import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { clearProfile } from '@/lib/profile-store';
import { clearSelectedPlan } from '@/lib/selected-plan';

export function ResetOnboarding() {
  function reset() {
    clearProfile();
    clearSelectedPlan();
    // Remove the previous questionnaire and coach screens so the demo starts fresh.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Clears your answers and selected plan, then returns to the welcome screen."
        onPress={reset}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
        <Text style={styles.label}>Reset onboarding</Text>
      </Pressable>
      <Text style={styles.hint}>Restart the demo. Clears answers and your selected plan.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginVertical: 16 },
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3a3a40', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 10 },
  label: { color: '#f5f5f5', fontSize: 14, fontWeight: '600' },
  hint: { color: '#8a8a90', fontSize: 12, textAlign: 'center' },
});
