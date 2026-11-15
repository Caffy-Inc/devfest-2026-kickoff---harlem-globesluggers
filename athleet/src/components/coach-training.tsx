import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoachAvatar } from '@/components/coach-avatar';
import { LeBronCoach } from '@/components/lebron-coach';
import { PlanView, type PlanParams } from '@/components/plan-view';
import { CoachWorkout } from '@/components/coach-workout';
import { useCoachSpeech } from '@/hooks/use-coach-speech';
import { sendChat } from '@/lib/api';
import { getProfile } from '@/lib/profile-store';
import { useSelectedPlan } from '@/lib/selected-plan';
import type { ChatMessage, Coach } from '@/lib/types';

export function CoachTraining({ coach, parameters, newPlan = false, initialDay, voiceEnabled = false }: {
  coach: Coach; parameters: PlanParams; newPlan?: boolean; initialDay?: number; voiceEnabled?: boolean;
}) {
  const selected = useSelectedPlan();
  const [mode, setMode] = useState<'saved' | 'preview'>(!newPlan && selected?.coachId === coach.id ? 'saved' : 'preview');
  const [day, setDay] = useState<number | null>(initialDay !== undefined && selected?.plan.days[initialDay] ? initialDay : null);
  const [workout, setWorkout] = useState(day !== null);
  const [workoutKey, setWorkoutKey] = useState(0);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('Your plan and your training, right here with me. Choose a day and we’ll take it one set at a time.');
  const [asking, setAsking] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const request = useRef(0);
  const speech = useCoachSpeech(voiceEnabled, coach.id);
  const { enabled, speak, stop } = speech;
  useFocusEffect(useCallback(() => () => { stop(); request.current++; }, [stop]));
  const cue = useCallback((text: string, finished: boolean) => {
    if (!workout) return;
    request.current++; setBusy(false); setMessage(text); setComplete(finished);
    if (enabled) void speak(text);
  }, [enabled, speak, workout]);
  const resetWorkout = useCallback(() => { setDay(null); setWorkout(false); setComplete(false); }, []);
  function showPlan() {
    stop(); request.current++; setBusy(false); setWorkout(false);
    setMessage('Let’s look at your week. Your current workout stays here if you want to resume it.');
  }
  function startWorkout(index: number) {
    if (day !== null && day !== index && !complete) { setMessage('You have a workout in progress. Resume it and save your sets before starting another day.'); return; }
    stop(); request.current++; setBusy(false); setAsking(false);
    if (day !== index || complete) { setWorkoutKey(key => key + 1); setComplete(false); }
    setDay(index); setWorkout(true);
  }
  async function ask() {
    if (!input.trim() || busy) return;
    const token = ++request.current;
    const next: ChatMessage[] = [...history, { role: 'user', content: input.trim() }];
    setInput(''); setBusy(true); stop();
    try {
      const reply = await sendChat(coach, getProfile(), [
        { role: 'user', content: `We are in my training session. ${message} My plan: ${JSON.stringify(selected?.plan.days[day ?? 0] ?? {})}. Keep the next answer short and relevant to my current exercise.` }, ...next,
      ]);
      if (token !== request.current) return;
      setHistory([...next, { role: 'assistant', content: reply }]); setMessage(reply);
      if (enabled) void speak(reply);
    } catch { if (token === request.current) setMessage('I couldn’t answer just now. Try again; your workout is still here.'); }
    finally { if (token === request.current) setBusy(false); }
  }
  return <SafeAreaView style={styles.screen} edges={['bottom']}>
    <Stack.Screen options={{ headerShown: true, title: `${coach.name.split(' ')[0]} · Train together`, headerStyle: { backgroundColor: '#14130f' }, headerTintColor: '#ffda62', headerBackTitle: 'Coaches' }} />
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {coach.id === 'lebron' ? <LeBronCoach compact motion={speech.speaking ? 'talking' : busy ? 'thinking' : complete && workout ? 'celebrate' : 'idle'} speechAnimation={speech.animation} /> : <View style={styles.avatar}><CoachAvatar coach={coach} size={64} /></View>}
      <View style={styles.coachBar}>
        <Text style={styles.message} accessibilityLiveRegion="polite" numberOfLines={asking ? undefined : 3}>{busy ? 'Coach is thinking…' : message}</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => { if (enabled) stop(); else void speak(message); speech.setEnabled(!enabled); }}><Text style={styles.link}>{enabled ? 'Voice on' : 'Voice off'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => speech.speaking ? stop() : void speak(message)}><Text style={styles.link}>{speech.speaking ? 'Stop audio' : 'Listen'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setAsking(!asking)}><Text style={styles.link}>{asking ? 'Close question' : 'Ask coach'}</Text></Pressable>
          {workout && <Pressable accessibilityRole="button" onPress={showPlan}><Text style={styles.link}>Your plan</Text></Pressable>}
        </View>
        {!!speech.error && <Text style={styles.message}>{speech.error}</Text>}
        {asking && <View style={styles.row}><TextInput accessibilityLabel="Question for your coach" style={styles.input} placeholder="Ask about this exercise…" placeholderTextColor="#a69a77" value={input} onChangeText={setInput} onSubmitEditing={ask} /><Pressable disabled={busy || !input.trim()} accessibilityRole="button" onPress={ask}><Text style={styles.link}>Send</Text></Pressable></View>}
      </View>
      {!workout && day !== null && !complete && <Pressable accessibilityRole="button" style={styles.resume} onPress={() => setWorkout(true)}><Text style={styles.link}>Resume workout with {coach.name.split(' ')[0]} →</Text></Pressable>}
      <View style={[styles.panel, workout && styles.hidden]}>
        <PlanView key={mode} embedded parameters={parameters} mode={mode} onSelected={() => { setMode('saved'); setMessage('Your plan is saved. Choose a day below and let’s train together.'); }} onStartWorkout={startWorkout} onPlanChanged={resetWorkout} workoutInProgress={day !== null && !complete} />
      </View>
      {day !== null && <View style={[styles.panel, !workout && styles.hidden]}><CoachWorkout key={`${day}:${workoutKey}`} dayIndex={day} onExit={showPlan} onCancelEmpty={() => { stop(); resetWorkout(); }} onCue={cue} /></View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#14130f' }, shell: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  panel: { flex: 1, minHeight: 0 }, hidden: { display: 'none' }, avatar: { alignItems: 'center', padding: 12 },
  coachBar: { paddingHorizontal: 18, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#393222' },
  message: { color: '#eee8d7', fontSize: 14, lineHeight: 20 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 18 },
  link: { color: '#ffda62', fontWeight: '700', fontSize: 12, paddingVertical: 12 }, input: { flex: 1, minWidth: 130, color: '#fffbed', backgroundColor: '#29251b', padding: 12, borderRadius: 8, marginBottom: 8 },
  resume: { paddingHorizontal: 20, backgroundColor: '#302911' },
});
