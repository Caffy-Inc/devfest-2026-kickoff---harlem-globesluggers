import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COACHES } from '@/data/coaches';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function HomeScreen() {
  const [age, setAge] = useState('');
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  function continueToAthletes() {
    const number = Number(age);
    if (!/^\d+$/.test(age) || number < 1 || number > 120) {
      setError(true);
      return;
    }
    setError(false);
    Keyboard.dismiss();
    setStarted(true);
  }

  const userAge = Number(age);
  // Coaches whose age range fits the user come first.
  const coaches = [...COACHES].sort((a, b) => {
    const fitA = userAge >= a.ageFit[0] && userAge <= a.ageFit[1] ? 0 : 1;
    const fitB = userAge >= b.ageFit[0] && userAge <= b.ageFit[1] ? 0 : 1;
    return fitA - fitB;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>athleet<Text style={styles.logoDot}>.</Text></Text>
        </View>

        {!started ? (
          <View style={styles.intro}>
            <Text style={styles.description}>How old are you?</Text>
            <TextInput
              accessibilityLabel="Your age"
              style={styles.input}
              value={age}
              onChangeText={(value) => { setAge(value); setError(false); }}
              placeholder="Enter your age"
              placeholderTextColor="#6b6b72"
              keyboardAppearance="dark"
              keyboardType="number-pad"
              maxLength={3}
              onSubmitEditing={continueToAthletes}
            />
            {error && <Text style={styles.error}>Please enter an age between 1 and 120.</Text>}
            <Pressable style={styles.button} onPress={continueToAthletes} accessibilityRole="button">
              <Text style={styles.buttonText}>Continue  →</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {coaches.map((coach) => {
              const fits = userAge >= coach.ageFit[0] && userAge <= coach.ageFit[1];
              return (
                <View key={coach.id} style={styles.section}>
                  <View style={styles.sectionHeading}>
                    <Text style={styles.sport}>{coach.category}</Text>
                    {!fits && <Text style={styles.fitNote}>Not ideal for your age</Text>}
                  </View>
                  <View style={[styles.card, !fits && styles.cardDim]}>
                    <View style={styles.avatar}>
                      <Text style={styles.initials}>{initials(coach.name)}</Text>
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.name}>{coach.name}</Text>
                      <Text style={styles.tagline}>{coach.tagline}</Text>
                      <Text style={styles.tags}>{coach.trainingTypes.join(' · ')}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            <Pressable onPress={() => setStarted(false)} accessibilityRole="button" style={styles.editAge}>
              <Text style={styles.editAgeText}>Change age</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 27, fontWeight: '800', color: '#f5f5f5', letterSpacing: -1 },
  logoDot: { color: '#f5f5f5' },
  intro: { flex: 1, justifyContent: 'center', paddingVertical: 64 },
  description: { color: '#b0b0b5', fontSize: 18, marginTop: 12, marginBottom: 40, textAlign: 'center' },
  input: { height: 58, borderWidth: 1, borderColor: '#3a3a40', borderRadius: 6, paddingHorizontal: 16, backgroundColor: '#1a1a1d', fontSize: 17, color: '#f5f5f5', textAlign: 'center' },
  error: { color: '#d0d0d5', fontSize: 13, marginTop: 8, textAlign: 'center' },
  button: { backgroundColor: '#f5f5f5', borderRadius: 6, padding: 18, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#0d0d0f', fontWeight: '700', fontSize: 16 },
  list: { paddingTop: 48 },
  section: { marginTop: 24 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sport: { fontSize: 19, fontWeight: '700', color: '#f5f5f5' },
  fitNote: { fontSize: 12, color: '#8a8a90' },
  card: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 6, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardDim: { opacity: 0.5 },
  cardText: { flex: 1, gap: 2 },
  avatar: { backgroundColor: '#2a2a2e', width: 64, height: 64, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#d0d0d5', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: '#f5f5f5' },
  tagline: { fontSize: 14, color: '#a0a0a6' },
  tags: { fontSize: 12, color: '#8a8a90', marginTop: 2, textTransform: 'capitalize' },
  editAge: { alignSelf: 'flex-start', marginTop: 32, paddingVertical: 8 },
  editAgeText: { color: '#a0a0a6', fontSize: 14, textDecorationLine: 'underline' },
});