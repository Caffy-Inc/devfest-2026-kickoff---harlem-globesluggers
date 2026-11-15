import { StyleSheet, Text, View } from 'react-native';

import { useStreak } from '@/lib/workout-log';

/** "🔥 3-day streak" with a nudge to keep it alive. */
export function StreakBadge({ compact }: { compact?: boolean }) {
  const { current, best, doneToday } = useStreak();

  const title = current > 0 ? `${current}-day streak` : 'No streak yet';
  const sub =
    current === 0
      ? 'Log a workout today to start one.'
      : doneToday
        ? `Done for today. Best: ${best} ${best === 1 ? 'day' : 'days'}.`
        : 'Work out today to keep it going!';

  if (compact) {
    return (
      <View style={[styles.pill, current > 0 && styles.pillOn]} accessibilityLabel={`${title}. ${sub}`}>
        <Text style={styles.pillText}>🔥 {current}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, current > 0 && !doneToday && styles.cardAtRisk]} accessible accessibilityLabel={`${title}. ${sub}`}>
      <Text style={styles.flame}>{current > 0 ? '🔥' : '🌱'}</Text>
      <View style={styles.flex}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, padding: 14, marginTop: 12 },
  cardAtRisk: { borderColor: '#b5651d', backgroundColor: '#2a1d10' },
  flame: { fontSize: 30 },
  title: { color: '#f5f5f5', fontSize: 17, fontWeight: '800' },
  sub: { color: '#a0a0a6', fontSize: 13, marginTop: 2 },
  pill: { borderWidth: 1, borderColor: '#3a3a40', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#1a1a1d' },
  pillOn: { borderColor: '#b5651d', backgroundColor: '#2a1d10' },
  pillText: { color: '#f5f5f5', fontSize: 14, fontWeight: '800' },
});
