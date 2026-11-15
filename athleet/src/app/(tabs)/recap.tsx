import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeLogo } from '@/components/home-logo';
import { WeeklyRecapView } from '@/components/weekly-recap';
import { useSelectedPlan } from '@/lib/selected-plan';

export default function RecapScreen() {
  const selected = useSelectedPlan();

  if (!selected) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.title}>No active plan yet</Text>
          <Text style={styles.text}>Choose a celebrity coach and select a plan to unlock your workout plan and weekly calendar.</Text>
          <Pressable style={styles.btn} onPress={() => router.navigate('/coaches')} accessibilityRole="button">
            <Text style={styles.btnText}>Browse coaches</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <HomeLogo />
          <Text style={styles.headerTitle}>Workout Plan</Text>
        </View>
        <WeeklyRecapView
          coachId={selected.coachId}
          plan={selected.plan}
          daysPerWeek={selected.daysPerWeek}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f5f5f5' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  text: { color: '#a0a0a6', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  btn: { backgroundColor: '#f5f5f5', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8 },
  btnText: { color: '#0d0d0f', fontWeight: '700', fontSize: 15 },
});
