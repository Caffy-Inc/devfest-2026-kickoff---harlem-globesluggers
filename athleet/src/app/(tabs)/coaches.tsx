import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { wordmarkImage } from '@/components/athleet-wordmark';
import { CoachCard } from '@/components/coach-card';
import { COACHES } from '@/data/coaches';
import { rankCoaches } from '@/lib/match';
import { getProfile } from '@/lib/profile-store';

// The chatbot section: every coach, best matches first.
export default function CoachesScreen() {
  const profile = getProfile();
  const matches = useMemo(
    () =>
      rankCoaches(
        {
          age: profile?.age ?? 25,
          goal: profile?.goal ?? 'general_fitness',
          sport: profile?.sport ?? 'general',
          level: profile?.level ?? 'beginner',
        },
        COACHES
      ),
    [profile]
  );

  function openChat(id: string) {
    router.push({ pathname: '/chat/[id]', params: { id } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={wordmarkImage} style={styles.logo} accessible accessibilityLabel="Athleet" contentFit="contain" />
          <Pressable onPress={() => router.replace('/')} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Edit my answers</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Your coach</Text>
        <Text style={styles.subtle}>Tap any coach to start chatting.</Text>
        <CoachCard match={matches[0]} highlight onPress={openChat} />

        <Text style={[styles.label, styles.spaced]}>Also a good fit</Text>
        {matches.slice(1, 3).map((m) => <CoachCard key={m.coach.id} match={m} onPress={openChat} />)}

        <Text style={[styles.label, styles.spaced]}>All coaches</Text>
        {matches.slice(3).map((m) => <CoachCard key={m.coach.id} match={m} onPress={openChat} />)}

        {profile && (
          <Text style={styles.summary}>
            {profile.age} yrs · {profile.heightCm} cm · {profile.weightKg} kg · {profile.sex} ·{' '}
            {profile.daysPerWeek} {profile.daysPerWeek === 1 ? 'day' : 'days'}/wk · {profile.sessionMinutes} min
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 32 },
  header: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  logo: { width: 108, height: 34 },
  link: { color: '#a0a0a6', fontSize: 14, textDecorationLine: 'underline' },
  label: { fontSize: 13, fontWeight: '700', color: '#8a8a90', textTransform: 'uppercase', letterSpacing: 1 },
  subtle: { color: '#8a8a90', fontSize: 13, marginTop: 4 },
  spaced: { marginTop: 32 },
  summary: { fontSize: 13, color: '#8a8a90', marginTop: 32 },
});
