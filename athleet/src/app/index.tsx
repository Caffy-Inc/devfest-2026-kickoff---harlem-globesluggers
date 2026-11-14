import { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { CoachAvatar } from '@/components/coach-avatar';
import { COACHES } from '@/data/coaches';
import { rankCoaches } from '@/lib/match';
import { setProfile } from '@/lib/profile-store';
import type { Goal, Level, Sex } from '@/lib/types';

type Step = 'age' | 'gender' | 'height' | 'weight' | 'goal' | 'sport' | 'level' | 'results';
type Units = 'imperial' | 'metric';
type Option<T> = { value: T; label: string; hint?: string };

const GENDERS: Option<Sex>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / prefer not to say' },
];

const GOALS: Option<Goal>[] = [
  { value: 'build_muscle', label: 'Gain muscle', hint: 'Get bigger and stronger' },
  { value: 'lose_fat', label: 'Lose weight', hint: 'Burn fat, get lean' },
  { value: 'bulk', label: 'Gain weight', hint: 'Put on size' },
  { value: 'sport_performance', label: 'Sport-specific', hint: 'Get better at your sport' },
];

const SPORTS: Option<string>[] = [
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'track', label: 'Track & sprinting' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'martial_arts', label: 'Martial arts' },
];

const LEVELS: Option<Level>[] = [
  { value: 'beginner', label: 'Beginner', hint: 'New or under 6 months' },
  { value: 'intermediate', label: 'Intermediate', hint: '6 months to 2 years' },
  { value: 'advanced', label: 'Advanced', hint: '2+ years of serious training' },
];

const ORDER: Step[] = ['age', 'gender', 'height', 'weight', 'goal', 'sport', 'level', 'results'];


export default function HomeScreen() {
  const [step, setStep] = useState<Step>('age');
  const [error, setError] = useState('');
  const [units, setUnits] = useState<Units>('imperial');

  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [cm, setCm] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sport, setSport] = useState('general');
  const [level, setLevel] = useState<Level | null>(null);

  const heightCm =
    units === 'imperial' ? (Number(feet) * 12 + Number(inches || 0)) * 2.54 : Number(cm);
  const weightKg = units === 'imperial' ? Number(weight) * 0.4536 : Number(weight);

  const matches = useMemo(
    () =>
      goal && level
        ? rankCoaches({ age: Number(age), goal, sport, level }, COACHES)
        : [],
    [age, goal, sport, level]
  );

  function openChat(coachId: string) {
    if (sex && goal && level) {
      setProfile({
        age: Number(age), sex, heightCm: Math.round(heightCm), weightKg: Math.round(weightKg),
        goal, sport, level, daysPerWeek: 4, sessionMinutes: 60, equipment: 'full_gym', injuries: 'none',
      });
    }
    router.push({ pathname: '/chat/[id]', params: { id: coachId } });
  }

  function go(next: Step) {
    setError('');
    Keyboard.dismiss();
    setStep(next);
  }

  function back() {
    let i = ORDER.indexOf(step) - 1;
    if (ORDER[i] === 'sport' && goal !== 'sport_performance') i -= 1;
    go(ORDER[Math.max(0, i)]);
  }

  function submitAge() {
    const n = Number(age);
    if (!/^\d+$/.test(age) || n < 10 || n > 100) return setError('Please enter an age between 10 and 100.');
    go('gender');
  }

  function submitHeight() {
    if (!heightCm || heightCm < 120 || heightCm > 230) return setError('Please enter a valid height.');
    go('weight');
  }

  function submitWeight() {
    if (!weightKg || weightKg < 25 || weightKg > 300) return setError('Please enter a valid weight.');
    go('goal');
  }

  function pickGoal(g: Goal) {
    setGoal(g);
    if (g === 'sport_performance') go('sport');
    else {
      setSport('general');
      go('level');
    }
  }

  const progress = (ORDER.indexOf(step) + 1) / ORDER.length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>athleet<Text style={styles.logoDot}>.</Text></Text>
          {step !== 'age' && (
            <Pressable onPress={back} accessibilityRole="button">
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          )}
        </View>

        {step !== 'results' && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        {step === 'age' && (
          <View style={styles.intro}>
            <Image source={require('@/assets/images/swag.jpg')} style={styles.heroLogo} contentFit="contain" />
            <Text style={styles.description}>How old are you?</Text>
            <TextInput
              accessibilityLabel="Your age"
              style={styles.input}
              value={age}
              onChangeText={(v) => { setAge(v); setError(''); }}
              placeholder="Enter your age"
              placeholderTextColor="#6b6b72"
                  keyboardAppearance="dark"
              keyboardType="number-pad"
              maxLength={3}
              onSubmitEditing={submitAge}
            />
            <ErrorText text={error} />
            <PrimaryButton label="Continue  →" onPress={submitAge} />
          </View>
        )}

        {step === 'gender' && (
          <View style={styles.intro}>
            <Text style={styles.question}>What's your gender?</Text>
            <Text style={styles.subtle}>Used to estimate your calorie needs.</Text>
            <Choices options={GENDERS} selected={sex} onPick={(v) => { setSex(v); go('height'); }} />
          </View>
        )}

        {step === 'height' && (
          <View style={styles.intro}>
            <Text style={styles.question}>How tall are you?</Text>
            <UnitToggle units={units} onChange={setUnits} />
            {units === 'imperial' ? (
              <View style={styles.row}>
                <TextInput
                  accessibilityLabel="Feet"
                  style={[styles.input, styles.flex]}
                  value={feet}
                  onChangeText={(v) => { setFeet(v); setError(''); }}
                  placeholder="ft"
                  placeholderTextColor="#6b6b72"
                  keyboardAppearance="dark"
                  keyboardType="number-pad"
                  maxLength={1}
                />
                <TextInput
                  accessibilityLabel="Inches"
                  style={[styles.input, styles.flex]}
                  value={inches}
                  onChangeText={(v) => { setInches(v); setError(''); }}
                  placeholder="in"
                  placeholderTextColor="#6b6b72"
                  keyboardAppearance="dark"
                  keyboardType="number-pad"
                  maxLength={2}
                  onSubmitEditing={submitHeight}
                />
              </View>
            ) : (
              <TextInput
                accessibilityLabel="Height in centimeters"
                style={styles.input}
                value={cm}
                onChangeText={(v) => { setCm(v); setError(''); }}
                placeholder="cm"
                placeholderTextColor="#6b6b72"
                  keyboardAppearance="dark"
                keyboardType="number-pad"
                maxLength={3}
                onSubmitEditing={submitHeight}
              />
            )}
            <ErrorText text={error} />
            <PrimaryButton label="Continue  →" onPress={submitHeight} />
          </View>
        )}

        {step === 'weight' && (
          <View style={styles.intro}>
            <Text style={styles.question}>How much do you weigh?</Text>
            <UnitToggle units={units} onChange={setUnits} />
            <TextInput
              accessibilityLabel="Your weight"
              style={styles.input}
              value={weight}
              onChangeText={(v) => { setWeight(v); setError(''); }}
              placeholder={units === 'imperial' ? 'lbs' : 'kg'}
              placeholderTextColor="#6b6b72"
                  keyboardAppearance="dark"
              keyboardType="decimal-pad"
              maxLength={5}
              onSubmitEditing={submitWeight}
            />
            <ErrorText text={error} />
            <PrimaryButton label="Continue  →" onPress={submitWeight} />
          </View>
        )}

        {step === 'goal' && (
          <View style={styles.intro}>
            <Text style={styles.question}>What's your main goal?</Text>
            <Choices options={GOALS} selected={goal} onPick={pickGoal} />
          </View>
        )}

        {step === 'sport' && (
          <View style={styles.intro}>
            <Text style={styles.question}>Which sport?</Text>
            <Choices options={SPORTS} selected={sport} onPick={(v) => { setSport(v); go('level'); }} />
          </View>
        )}

        {step === 'level' && (
          <View style={styles.intro}>
            <Text style={styles.question}>How experienced are you?</Text>
            <Choices options={LEVELS} selected={level} onPick={(v) => { setLevel(v); go('results'); }} />
          </View>
        )}

        {step === 'results' && matches.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.resultsLabel}>Your coach</Text>
            <Text style={styles.subtleLeft}>Tap any coach to start chatting.</Text>
            <CoachCard match={matches[0]} highlight onPress={openChat} />

            <Text style={[styles.resultsLabel, styles.spaced]}>Also a good fit</Text>
            {matches.slice(1, 3).map((m) => <CoachCard key={m.coach.id} match={m} onPress={openChat} />)}

            <Text style={[styles.resultsLabel, styles.spaced]}>All coaches</Text>
            {matches.slice(3).map((m) => <CoachCard key={m.coach.id} match={m} onPress={openChat} />)}

            <Text style={styles.summary}>
              {age} yrs · {Math.round(heightCm)} cm · {Math.round(weightKg)} kg · {sex}
            </Text>
            <Pressable onPress={() => go('age')} accessibilityRole="button" style={styles.editAge}>
              <Text style={styles.editAgeText}>Start over</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Choices<T extends string>({
  options, selected, onPick,
}: { options: Option<T>[]; selected: T | null; onPick: (v: T) => void }) {
  return (
    <View style={styles.choices}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onPick(o.value)}
          accessibilityRole="button"
          style={[styles.choice, selected === o.value && styles.choiceSelected]}>
          <Text style={[styles.choiceLabel, selected === o.value && styles.choiceLabelSelected]}>{o.label}</Text>
          {o.hint && <Text style={[styles.choiceHint, selected === o.value && styles.choiceHintSelected]}>{o.hint}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function UnitToggle({ units, onChange }: { units: Units; onChange: (u: Units) => void }) {
  return (
    <View style={styles.toggle}>
      {(['imperial', 'metric'] as Units[]).map((u) => (
        <Pressable
          key={u}
          onPress={() => onChange(u)}
          accessibilityRole="button"
          style={[styles.toggleBtn, units === u && styles.toggleBtnOn]}>
          <Text style={[styles.toggleText, units === u && styles.toggleTextOn]}>
            {u === 'imperial' ? 'ft / lbs' : 'cm / kg'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress} accessibilityRole="button">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function ErrorText({ text }: { text: string }) {
  return text ? <Text style={styles.error}>{text}</Text> : null;
}

function CoachCard({
  match, highlight, onPress,
}: { match: ReturnType<typeof rankCoaches>[number]; highlight?: boolean; onPress: (id: string) => void }) {
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
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 27, fontWeight: '800', color: '#f5f5f5', letterSpacing: -1 },
  logoDot: { color: '#f5f5f5' },
  backText: { color: '#a0a0a6', fontSize: 15 },
  progressTrack: { height: 4, backgroundColor: '#2a2a2e', borderRadius: 2, marginTop: 16 },
  progressFill: { height: 4, backgroundColor: '#f5f5f5', borderRadius: 2 },
  intro: { flex: 1, justifyContent: 'flex-start', paddingTop: 0, paddingBottom: 64 },
  heroLogo: { width: '100%', maxWidth: 480, aspectRatio: 1, alignSelf: 'center', marginTop: 0, marginBottom: -24 },
  description: { color: '#b0b0b5', fontSize: 18, marginTop: 0, marginBottom: 24, textAlign: 'center' },
  question: { color: '#f5f5f5', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtle: { color: '#8a8a90', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  input: { height: 58, borderWidth: 1, borderColor: '#3a3a40', borderRadius: 6, paddingHorizontal: 16, backgroundColor: '#1a1a1d', fontSize: 17, color: '#f5f5f5', textAlign: 'center', marginTop: 16 },
  error: { color: '#d0d0d5', fontSize: 13, marginTop: 8, textAlign: 'center' },
  button: { backgroundColor: '#f5f5f5', borderRadius: 6, padding: 18, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#0d0d0f', fontWeight: '700', fontSize: 16 },
  choices: { gap: 10, marginTop: 16 },
  choice: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 6, padding: 16 },
  choiceSelected: { backgroundColor: '#f5f5f5', borderColor: '#f5f5f5' },
  choiceLabel: { fontSize: 17, fontWeight: '700', color: '#f5f5f5' },
  choiceLabelSelected: { color: '#0d0d0f' },
  choiceHint: { fontSize: 13, color: '#8a8a90', marginTop: 2 },
  choiceHintSelected: { color: '#3a3a40' },
  toggle: { flexDirection: 'row', backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 6, padding: 3, alignSelf: 'center', marginTop: 8 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 4 },
  toggleBtnOn: { backgroundColor: '#f5f5f5' },
  toggleText: { fontSize: 13, color: '#8a8a90' },
  toggleTextOn: { color: '#0d0d0f', fontWeight: '700' },
  list: { paddingTop: 32 },
  resultsLabel: { fontSize: 13, fontWeight: '700', color: '#8a8a90', textTransform: 'uppercase', letterSpacing: 1 },
  spaced: { marginTop: 32 },
  section: { marginTop: 12 },
  card: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 6, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardHighlight: { borderColor: '#f5f5f5', borderWidth: 2, padding: 18 },
  cardDim: { opacity: 0.5 },
  cardText: { flex: 1, gap: 2 },
  chevron: { color: '#6b6b72', fontSize: 28, fontWeight: '300' },
  pressed: { opacity: 0.7 },
  subtleLeft: { color: '#8a8a90', fontSize: 13, marginTop: 4 },
  category: { fontSize: 12, fontWeight: '700', color: '#8a8a90', textTransform: 'uppercase' },
  name: { fontSize: 18, fontWeight: '700', color: '#f5f5f5' },
  tagline: { fontSize: 14, color: '#a0a0a6' },
  tags: { fontSize: 12, color: '#8a8a90', marginTop: 2 },
  summary: { fontSize: 13, color: '#8a8a90', marginTop: 32 },
  editAge: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 8 },
  editAgeText: { color: '#a0a0a6', fontSize: 14, textDecorationLine: 'underline' },
});
