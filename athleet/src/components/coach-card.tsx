import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoachAvatar } from '@/components/coach-avatar';
import type { Match } from '@/lib/match';

export function CoachCard({
  match, highlight, onPress,
}: { match: Match; highlight?: boolean; onPress: (id: string) => void }) {
  const { coach, fitsAge, reasons } = match;
  return (
    <Pressable
      style={({ pressed }) => [styles.section, pressed && styles.pressed]}
      onPress={() => onPress(coach.id)}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${coach.name}`}>
      <View style={[styles.card, highlight && styles.cardHighlight, !fitsAge && styles.cardDim]}>
        <CoachAvatar coach={coach} size={highlight ? 72 : 60} />
        <View style={styles.cardText}>
          <Text style={styles.category}>{coach.category}</Text>
          <Text style={styles.name}>{coach.name}</Text>
          <Text style={styles.tagline}>{coach.tagline}</Text>
          {reasons.length > 0 && <Text style={styles.tags}>{reasons.join(' · ')}</Text>}
          {!fitsAge && <Text style={styles.tags}>Not ideal for your age</Text>}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  pressed: { opacity: 0.7 },
  card: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 6, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardHighlight: { borderColor: '#f5f5f5', borderWidth: 2, padding: 18 },
  cardDim: { opacity: 0.5 },
  cardText: { flex: 1, minWidth: 0, gap: 2 },
  chevron: { color: '#6b6b72', fontSize: 28, fontWeight: '300' },
  category: { fontSize: 12, fontWeight: '700', color: '#8a8a90', textTransform: 'uppercase' },
  name: { fontSize: 18, fontWeight: '700', color: '#f5f5f5' },
  tagline: { fontSize: 14, color: '#a0a0a6' },
  tags: { fontSize: 12, color: '#8a8a90', marginTop: 2 },
});
