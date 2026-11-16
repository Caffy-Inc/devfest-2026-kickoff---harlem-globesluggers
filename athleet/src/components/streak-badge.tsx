import { StyleSheet, Text, View } from 'react-native';

import { useStreak } from '@/lib/workout-log';
import { colors } from '@/lib/theme';

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
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginTop: 12 },
  cardAtRisk: { borderColor: colors.warningBorder, backgroundColor: colors.warningBg },
  flame: { fontSize: 30 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  pill: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: colors.surface },
  pillOn: { borderColor: colors.warningBorder, backgroundColor: colors.warningBg },
  pillText: { color: colors.text, fontSize: 14, fontWeight: '800' },
});
