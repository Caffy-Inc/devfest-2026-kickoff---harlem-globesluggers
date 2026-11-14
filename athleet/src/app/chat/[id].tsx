import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachAvatar } from '@/components/coach-avatar';
import { getCoach } from '@/data/coaches';
import { sendChat } from '@/lib/api';
import { getProfile } from '@/lib/profile-store';
import type { ChatMessage } from '@/lib/types';

const QUICK_PROMPTS = ['Make my weekly plan', 'What should I eat?', 'How do I start?'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const coach = getCoach(String(id));
  const profile = getProfile();

  const [messages, setMessages] = useState<ChatMessage[]>(
    coach ? [{ role: 'assistant', content: coach.greeting }] : []
  );
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  if (!coach) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Coach not found.</Text>
      </View>
    );
  }

  function openPlan() {
    router.push({
      pathname: '/plan',
      params: {
        coachId: coach?.id,
        age: String(profile?.age || 26),
        goal: profile?.goal || 'build_muscle',
        level: profile?.level || 'intermediate',
        sex: profile?.sex || 'male',
      },
    });
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || typing || !coach) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setTyping(true);
    try {
      const reply = await sendChat(coach, profile, next);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <CoachAvatar coach={coach} size={30} />
              <View>
                <Text style={styles.headerName}>{coach.name}</Text>
                <Text style={styles.headerSub}>{coach.category} coach</Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <Pressable
              onPress={openPlan}
              style={styles.headerPlanBtn}
              accessibilityRole="button"
              accessibilityLabel="View workout plan"
            >
              <Text style={styles.headerPlanBtnText}>📋 Plan</Text>
            </Pressable>
          ),
          headerStyle: { backgroundColor: '#0d0d0f' },
          headerTintColor: '#f5f5f5',
          headerBackTitle: 'Back',
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) =>
            item.role === 'assistant' ? (
              <View style={styles.coachRow}>
                <CoachAvatar coach={coach} size={28} />
                <View style={[styles.bubble, styles.coachBubble]}>
                  <Text style={styles.coachText}>{item.content}</Text>
                  {/plan|routine|program|structure/.test(item.content.toLowerCase()) && (
                    <Pressable
                      style={styles.inlinePlanBtn}
                      onPress={openPlan}
                      accessibilityRole="button"
                    >
                      <Text style={styles.inlinePlanText}>⚡ View Full Workout Routine →</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.userText}>{item.content}</Text>
              </View>
            )
          }
          ListFooterComponent={
            typing ? <Text style={styles.typing}>{coach.name.split(' ')[0]} is typing…</Text> : undefined
          }
        />

        {messages.length <= 1 && (
          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map((q) => (
              <Pressable key={q} style={styles.quick} onPress={() => send(q)} accessibilityRole="button">
                <Text style={styles.quickText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${coach.name.split(' ')[0]}…`}
            placeholderTextColor="#6b6b72"
            keyboardAppearance="dark"
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.send, (!input.trim() || typing) && styles.sendOff]}
            onPress={() => send(input)}
            accessibilityRole="button"
            accessibilityLabel="Send">
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0d0d0f' },
  flex: { flex: 1 },
  missing: { color: '#f5f5f5', padding: 24 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { color: '#f5f5f5', fontWeight: '700', fontSize: 16 },
  headerSub: { color: '#8a8a90', fontSize: 12 },
  headerPlanBtn: {
    backgroundColor: '#2a2a2e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 4,
  },
  headerPlanBtnText: {
    color: '#f5f5f5',
    fontSize: 13,
    fontWeight: '700',
  },
  list: { padding: 16, gap: 12 },
  coachRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  bubble: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  coachBubble: { backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#2a2a2e', borderBottomLeftRadius: 4, flexShrink: 1 },
  userBubble: { backgroundColor: '#f5f5f5', alignSelf: 'flex-end', maxWidth: '80%', borderBottomRightRadius: 4 },
  coachText: { color: '#f5f5f5', fontSize: 15, lineHeight: 21 },
  inlinePlanBtn: {
    marginTop: 10,
    backgroundColor: '#2a2a2e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  inlinePlanText: { color: '#f5f5f5', fontSize: 13, fontWeight: '700' },
  userText: { color: '#0d0d0f', fontSize: 15, lineHeight: 21 },
  typing: { color: '#8a8a90', fontSize: 13, marginTop: 4, marginLeft: 36 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  quick: { borderWidth: 1, borderColor: '#3a3a40', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 },
  quickText: { color: '#d0d0d5', fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#2a2a2e' },
  input: { flex: 1, height: 46, borderRadius: 23, backgroundColor: '#1a1a1d', borderWidth: 1, borderColor: '#3a3a40', paddingHorizontal: 16, color: '#f5f5f5', fontSize: 15 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  sendOff: { opacity: 0.4 },
  sendText: { color: '#0d0d0f', fontSize: 20, fontWeight: '800' },
});
