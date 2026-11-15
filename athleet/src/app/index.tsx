import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HomeLogo } from '@/components/home-logo';
import { OnboardingMascot } from '@/components/onboarding-mascot';
import { MAX_MINUTES, recommendedDays } from '@/lib/plan';
import { setProfile } from '@/lib/profile-store';
import type { Goal, Level, Sex } from '@/lib/types';

type Step = 'start' | 'age' | 'gender' | 'height' | 'weight' | 'goal' | 'sport' | 'level' | 'days' | 'time';
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

const ORDER: Step[] = ['age', 'gender', 'height', 'weight', 'goal', 'sport', 'level', 'days', 'time'];

const DAY_HINTS: Record<string, string> = {
  '1': 'Bare minimum',
  '2': 'Light schedule',
  '3': 'Full recovery between sessions',
  '4': 'Balanced training and rest',
  '5': 'Serious training',
  '6': 'All in, one rest day',
  '7': 'Every day',
};

const QUICK_MINUTES = [30, 45, 60, 90];


export default function HomeScreen() {
  const { height, width } = useWindowDimensions();
  const heroSize = Math.min(width - 48, height * 0.32, 280);
  const mascotSize = Math.min(180, height * 0.23);
  const [step, setStep] = useState<Step>('start');
  const [error, setError] = useState('');
  const [units, setUnits] = useState<Units>('imperial');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const isNumericStep = step === 'age' || step === 'height' || step === 'weight' || step === 'time';
  const isEditingNumber = isNumericStep && keyboardVisible;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);


  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [cm, setCm] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sport, setSport] = useState('general');
  const [level, setLevel] = useState<Level | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [minutes, setMinutes] = useState('');

  const heightCm =
    units === 'imperial' ? (Number(feet) * 12 + Number(inches || 0)) * 2.54 : Number(cm);
  const weightKg = units === 'imperial' ? Number(weight) * 0.4536 : Number(weight);

  function finish(sessionMinutes: number) {
    if (!sex || !goal || !level) return;
    setProfile({
      age: Number(age), sex, heightCm: Math.round(heightCm), weightKg: Math.round(weightKg),
      goal, sport, level,
      daysPerWeek: days ?? recommendedDays(level, Number(age)),
      sessionMinutes,
      equipment: 'full_gym', injuries: 'none',
    });
    Keyboard.dismiss();
    router.replace('/coaches');
  }

  function go(next: Step) {
    setError('');
    Keyboard.dismiss();
    setStep(next);
  }

  // Logo tap on the home screen itself: jump back to the welcome step.
  function goHome() {
    Keyboard.dismiss();
    setError('');
    setStep('start');
  }

  function back() {
    let i = ORDER.indexOf(step) - 1;
    if (ORDER[i] === 'sport' && goal !== 'sport_performance') i -= 1;
    go(ORDER[i] ?? 'start');
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

  function submitTime() {
    const n = Number(minutes);
    if (!/^\d+$/.test(minutes) || n < 1 || n > MAX_MINUTES) {
      return setError(`Please enter minutes between 1 and ${MAX_MINUTES}.`);
    }
    finish(n);
  }

  // Lets the keyboard's Next key on the feet box jump to inches.
  const inchesRef = useRef<ComponentRef<typeof TextInput>>(null);

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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, isNumericStep && styles.numericContent]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={isNumericStep ? 'none' : 'on-drag'}
        >
          <View style={styles.header}>
            <HomeLogo style={styles.logo} onPress={goHome} />
            {step !== 'start' && (
              <Pressable onPress={back} accessibilityRole="button">
                <Text style={styles.backText}>← Back</Text>
              </Pressable>
            )}
          </View>

          {step === 'start' ? (
            <View style={[styles.intro, styles.welcome]}>
              <View style={styles.welcomeBubble}>
                <View style={styles.welcomeBubbleTail} />
                <Text accessibilityRole="header" style={styles.welcomeTitle}>Welcome to Athleet</Text>
              </View>
              <OnboardingMascot size={Math.min(width - 48, height * 0.45, 360)} reaction="welcome" cue="start" />
              <PrimaryButton label="Get started  →" onPress={() => go('age')} />
            </View>
          ) : (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          )}

          {step === 'age' && (
            <View style={[styles.intro, isEditingNumber && styles.editingIntro]}>
              <OnboardingMascot size={isEditingNumber ? 64 : heroSize} reaction={error ? 'retry' : 'welcome'} cue={step} />
              <Text style={styles.question}>How old are you?</Text>
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
                returnKeyType="next"
                onSubmitEditing={submitAge}
              />
              <ErrorText text={error} />
              <PrimaryButton label="Continue  →" onPress={submitAge} />
            </View>
          )}

          {step === 'gender' && (
            <View style={styles.intro}>
              <OnboardingMascot size={mascotSize} reaction={error ? 'retry' : 'encourage'} cue={step} />
              <Text style={styles.question}>What&apos;s your gender?</Text>
              <Text style={styles.subtle}>Used to estimate your calorie needs.</Text>
              <Choices options={GENDERS} selected={sex} onPick={(v) => { setSex(v); go('height'); }} />
            </View>
          )}

          {step === 'height' && (
            <View style={[styles.intro, isEditingNumber && styles.editingIntro]}>
              <OnboardingMascot size={isEditingNumber ? 64 : mascotSize} reaction={error ? 'retry' : 'encourage'} cue={step} />
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
                    returnKeyType="next"
                    onSubmitEditing={() => inchesRef.current?.focus()}
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
                    ref={inchesRef}
                    returnKeyType="next"
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
                  returnKeyType="next"
                  onSubmitEditing={submitHeight}
                />
              )}
              <ErrorText text={error} />
              <PrimaryButton label="Continue  →" onPress={submitHeight} />
            </View>
          )}

          {step === 'weight' && (
            <View style={[styles.intro, isEditingNumber && styles.editingIntro]}>
              <OnboardingMascot size={isEditingNumber ? 64 : mascotSize} reaction={error ? 'retry' : 'encourage'} cue={step} />
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
                returnKeyType="next"
                onSubmitEditing={submitWeight}
              />
              <ErrorText text={error} />
              <PrimaryButton label="Continue  →" onPress={submitWeight} />
            </View>
          )}

          {step === 'goal' && (
            <View style={styles.intro}>
              <OnboardingMascot size={mascotSize} reaction={error ? 'retry' : 'encourage'} cue={step} />
              <Text style={styles.question}>What&apos;s your main goal?</Text>
              <Choices options={GOALS} selected={goal} onPick={pickGoal} />
            </View>
          )}

          {step === 'sport' && (
            <View style={styles.intro}>
              <OnboardingMascot size={mascotSize} reaction={error ? 'retry' : 'encourage'} cue={step} />
              <Text style={styles.question}>Which sport?</Text>
              <Choices options={SPORTS} selected={sport} onPick={(v) => { setSport(v); go('level'); }} />
            </View>
          )}

          {step === 'level' && (
            <View style={styles.intro}>
              <OnboardingMascot size={mascotSize} reaction={error ? 'retry' : 'encourage'} cue={step} />
              <Text style={styles.question}>How experienced are you?</Text>
              <Choices options={LEVELS} selected={level} onPick={(v) => { setLevel(v); go('days'); }} />
            </View>
          )}

          {step === 'days' && level && (
            <View style={styles.intro}>
              <OnboardingMascot size={mascotSize} reaction="encourage" cue="level" />
              <Text style={styles.question}>How many days a week do you want to train?</Text>
              <Text style={styles.subtle}>
                Most people at your level do {recommendedDays(level, Number(age))}. Pick what fits your life.
              </Text>
              <Choices
                options={['1', '2', '3', '4', '5', '6', '7'].map((d) => ({
                  value: d,
                  label: `${d} ${d === '1' ? 'day' : 'days'}`,
                  hint: DAY_HINTS[d],
                }))}
                selected={days ? String(days) : null}
                onPick={(v) => { setDays(Number(v)); go('time'); }}
              />
            </View>
          )}

          {step === 'time' && (
            <View style={[styles.intro, isEditingNumber && styles.editingIntro]}>
              <OnboardingMascot size={isEditingNumber ? 64 : mascotSize} reaction={error ? 'retry' : 'celebrate'} cue="results" />
              <Text style={styles.question}>How long do you want each session to be?</Text>
              <Text style={styles.subtle}>In minutes.</Text>
              <TextInput
                accessibilityLabel="Minutes per session"
                style={styles.input}
                value={minutes}
                onChangeText={(v) => { setMinutes(v.replace(/[^0-9]/g, '')); setError(''); }}
                placeholder="minutes"
                placeholderTextColor="#6b6b72"
                keyboardAppearance="dark"
                keyboardType="number-pad"
                maxLength={3}
                returnKeyType="done"
                onSubmitEditing={submitTime}
              />
              <View style={styles.quickRow}>
                {QUICK_MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => { setMinutes(String(m)); setError(''); }}
                    style={[styles.quickChip, minutes === String(m) && styles.quickChipOn]}
                    accessibilityRole="button">
                    <Text style={[styles.quickChipText, minutes === String(m) && styles.quickChipTextOn]}>{m} min</Text>
                  </Pressable>
                ))}
              </View>
              <ErrorText text={error} />
              <PrimaryButton label="Meet my coaches  →" onPress={submitTime} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 },
  quickChip: { borderWidth: 1, borderColor: '#3a3a40', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#1a1a1d' },
  quickChipOn: { backgroundColor: '#f5f5f5', borderColor: '#f5f5f5' },
  quickChipText: { color: '#d0d0d5', fontSize: 14, fontWeight: '600' },
  quickChipTextOn: { color: '#0d0d0f' },
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 108, height: 34 },
  backText: { color: '#a0a0a6', fontSize: 15 },
  progressTrack: { height: 4, backgroundColor: '#2a2a2e', borderRadius: 2, marginTop: 16 },
  progressFill: { height: 4, backgroundColor: '#f5f5f5', borderRadius: 2 },
  numericContent: { paddingBottom: 72 },
  editingIntro: { paddingVertical: 12 },
  intro: { flexGrow: 1, justifyContent: 'center', paddingVertical: 32 },
  welcome: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  welcomeBubble: { alignSelf: 'center', backgroundColor: '#fff3d5', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, marginBottom: -8, zIndex: 1 },
  welcomeBubbleTail: { position: 'absolute', left: '39%', bottom: -6, width: 16, height: 16, backgroundColor: '#fff3d5', transform: [{ rotate: '45deg' }] },
  welcomeTitle: { color: '#24345e', fontSize: 24, fontWeight: '500', textAlign: 'center' },
  question: { color: '#f5f5f5', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtle: { color: '#8a8a90', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
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
  cardText: { flex: 1, minWidth: 0, gap: 2 },
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
