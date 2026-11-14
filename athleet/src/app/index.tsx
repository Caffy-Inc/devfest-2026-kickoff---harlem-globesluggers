import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const athletes = [
  { sport: 'Football', name: 'Tom Brady', initials: 'TB' },
  { sport: 'Soccer', name: 'Lionel Messi', initials: 'LM' },
  { sport: 'Basketball', name: 'LeBron James', initials: 'LJ' },
];

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
            {athletes.map((athlete) => (
              <View key={athlete.sport} style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sport}>{athlete.sport}</Text>
                </View>
                <View style={styles.card}>
                  <View style={styles.avatar}>
                    <Text style={styles.initials}>{athlete.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.name}>{athlete.name}</Text>
                  </View>
                </View>
              </View>
            ))}
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
  intro: { flex: 1, justifyContent: 'center', paddingVertical: 64 },
  description: { color: '#444444', fontSize: 18, marginTop: 12, marginBottom: 40 },
  input: { height: 58, borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, paddingHorizontal: 16, backgroundColor: '#fff', fontSize: 17, color: '#222222' },
  error: { color: '#444444', fontSize: 13, marginTop: 8 },
  button: { backgroundColor: '#222222', borderRadius: 6, padding: 18, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  list: { paddingTop: 48 },
  section: { marginTop: 24 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  sport: { fontSize: 19, fontWeight: '700', color: '#222222' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dddddd', borderRadius: 6, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { backgroundColor: '#eeeeee', width: 64, height: 64, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#444444', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: '#222222' },
  editAge: { alignSelf: 'flex-start', marginTop: 32, paddingVertical: 8 },
  editAgeText: { color: '#555555', fontSize: 14, textDecorationLine: 'underline' },
});
