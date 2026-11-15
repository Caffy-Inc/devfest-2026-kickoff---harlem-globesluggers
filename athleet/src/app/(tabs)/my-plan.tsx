import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanView } from '@/components/plan-view';
import { useSelectedPlan } from '@/lib/selected-plan';

export default function MyPlanScreen() {
  const selected = useSelectedPlan();
  if (!selected) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.title}>No plan yet</Text>
          <Text style={styles.text}>Open a coach, tap Plan, then “Select this plan”.</Text>
          <Pressable style={styles.btn} onPress={() => router.navigate('/coaches')} accessibilityRole="button">
            <Text style={styles.btnText}>Browse coaches</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  // key: rebuild the view when a different plan is selected from another screen.
  return <PlanView key={`${selected.coachId}`} mode="saved" />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  text: { color: '#a0a0a6', fontSize: 15, textAlign: 'center' },
  btn: { backgroundColor: '#f5f5f5', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: '#0d0d0f', fontWeight: '700', fontSize: 15 },
});
