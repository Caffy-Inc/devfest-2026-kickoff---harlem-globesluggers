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
              placeholderTextColor="#999999"
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
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#dddddd', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 27, fontWeight: '800', color: '#222222', letterSpacing: -1 },
  logoDot: { color: '#222222' },
  intro: { flex: 1, justifyContent: 'center',