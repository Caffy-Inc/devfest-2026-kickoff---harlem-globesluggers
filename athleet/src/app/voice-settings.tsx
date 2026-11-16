import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachAvatar } from '@/components/coach-avatar';
import { COACHES, getCoach } from '@/data/coaches';
import {
  cloneVoiceFromAudio,
  getAllClonedVoices,
  getVoiceProblems,
  refreshSharedVoices,
  isVoiceCloningAvailable,
  removeClonedVoice,
  subscribeClonedVoices,
  type AudioSample,
  type ClonedVoice,
  type CloneStatus,
} from '@/lib/voice-clone';
import { shoutSignature } from '@/lib/voice';
import { colors } from '@/lib/theme';

// ─── Voice Settings Screen ──────────────────────────────────────────────────

export default function VoiceSettingsScreen() {
  const [cloned, setCloned] = useState<Record<string, ClonedVoice>>(getAllClonedVoices);
  const [problems, setProblems] = useState(getVoiceProblems);
  const [refreshing, setRefreshing] = useState(false);
  const cloningAvailable = isVoiceCloningAvailable();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { setProblems(await refreshSharedVoices()); } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeClonedVoices(() => {
      setCloned(getAllClonedVoices());
      setProblems(getVoiceProblems());
    });
    refresh(); // also picks up new files in athleet/voices/
    return unsubscribe;
  }, [refresh]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Voice Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Explanation */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎤 Coach Voices (shared)</Text>
          <Text style={styles.infoText}>
            Voices set here are used by everyone who opens the app. Add one by dropping audio
            plus a CONSENT.txt into <Text style={styles.mono}>athleet/voices/&lt;coach&gt;/</Text>{' '}
            (see voices/README.md) and tapping Refresh, or upload clips below. Use 1–2 minutes
            of clean speech from someone who agreed to voice the coach.
          </Text>
          <Pressable
            style={[styles.refreshBtn, refreshing && styles.btnDisabled]}
            onPress={refresh}
            disabled={refreshing}
            accessibilityRole="button"
          >
            {refreshing ? (
              <View style={styles.busyRow}>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={styles.refreshText}>Checking voices folder…</Text>
              </View>
            ) : (
              <Text style={styles.refreshText}>↻ Refresh voices</Text>
            )}
          </Pressable>
          {problems.map((p, i) => (
            <Text key={i} style={styles.problemText}>⚠️ {p.message}</Text>
          ))}
          <Text style={[styles.infoText, { marginTop: 8 }]}>
            Setup: add <Text style={styles.mono}>ELEVENLABS_API_KEY</Text> to{' '}
            <Text style={styles.mono}>athleet/.env</Text> and restart Expo.
          </Text>
        </View>

        {/* Coach list */}
        {COACHES.map((coach) => (
          <CoachVoiceRow
            key={coach.id}
            coachId={coach.id}
            clonedVoice={cloned[coach.id] ?? null}
            cloningAvailable={cloningAvailable}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Per-coach row ──────────────────────────────────────────────────────────

function CoachVoiceRow({
  coachId,
  clonedVoice,
  cloningAvailable,
}: {
  coachId: string;
  clonedVoice: ClonedVoice | null;
  cloningAvailable: boolean;
}) {
  const coach = getCoach(coachId);
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<CloneStatus>({ state: 'idle' });

  const handlePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setSamples(result.assets.slice(0, 5).map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        file: (a as any).file,
      })));
      setStatus({ state: 'idle' });
    } catch (err: any) {
      Alert.alert('Could not open files', err?.message || 'Something went wrong.');
    }
  }, []);

  const handleClone = useCallback(async () => {
    if (!samples.length) {
      Alert.alert('No audio', 'Pick at least one audio file first.');
      return;
    }
    if (!consent) {
      Alert.alert('Consent needed', 'Confirm the speaker agreed to have their voice used for this coach.');
      return;
    }
    try {
      await cloneVoiceFromAudio(coachId, samples, { consent, label: coach?.name }, setStatus);
      setSamples([]);
      setConsent(false);
    } catch (err: any) {
      setStatus({ state: 'error', message: err?.message || 'Failed' });
    }
  }, [coachId, samples, consent, coach?.name]);

  const handleRemove = useCallback(async () => {
    try {
      await removeClonedVoice(coachId);
    } catch (err: any) {
      setStatus({ state: 'error', message: err?.message || 'Could not remove voice.' });
      return;
    }
    setSamples([]);
    setConsent(false);
    setStatus({ state: 'idle' });
  }, [coachId]);

  const handlePreview = useCallback(() => {
    shoutSignature(coachId);
  }, [coachId]);

  if (!coach) return null;

  const busy = status.state === 'uploading';

  return (
    <View style={styles.coachRow}>
      {/* Coach identity */}
      <View style={styles.coachHeader}>
        <CoachAvatar coach={coach} size={44} />
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>{coach.name}</Text>
          <Text style={styles.voiceLabel}>
            {clonedVoice ? '🎤 Custom voice' : '🔊 Device voice'}
          </Text>
        </View>
        <Pressable
          style={styles.previewBtn}
          onPress={handlePreview}
          accessibilityRole="button"
          accessibilityLabel={`Preview ${coach.name} voice`}
          hitSlop={8}
        >
          <Text style={styles.previewText}>▶ Preview</Text>
        </Pressable>
      </View>

      {clonedVoice ? (
        <View style={styles.actionRow}>
          <View style={styles.clonedBadge}>
            <Text style={styles.clonedBadgeText}>
              ✓ {clonedVoice.source === 'folder' ? 'From voices folder' : 'Uploaded'}
            </Text>
          </View>
          <Text style={styles.sampleNames} numberOfLines={1}>
            {clonedVoice.speaker ? `${clonedVoice.speaker} · ` : ''}{clonedVoice.sampleNames?.join(', ')}
          </Text>
          <Pressable style={styles.removeBtn} onPress={handleRemove} disabled={busy} accessibilityRole="button">
            <Text style={styles.removeText}>✕ Remove</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            style={[styles.pickBtn, busy && styles.btnDisabled]}
            onPress={handlePick}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.pickText}>
              {samples.length
                ? `🎵 ${samples.length} file${samples.length > 1 ? 's' : ''}: ${samples.map((s) => s.name).join(', ')}`
                : '🎵 Choose audio files (mp3, m4a, wav)'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.consentRow}
            onPress={() => setConsent((c) => !c)}
            disabled={busy}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
          >
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>
              {consent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              The person speaking in these clips agreed to have their voice used for this coach.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.cloneBtn, (!cloningAvailable || busy || !samples.length || !consent) && styles.btnDisabled]}
            onPress={handleClone}
            disabled={busy || !cloningAvailable || !samples.length || !consent}
            accessibilityRole="button"
          >
            {busy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={styles.cloneBtnText}>Building voice…</Text>
              </View>
            ) : (
              <Text style={styles.cloneBtnText}>🎤 Create voice</Text>
            )}
          </Pressable>
        </>
      )}

      {/* Status message */}
      {status.state === 'error' && (
        <Text style={styles.errorText}>❌ {status.message}</Text>
      )}
      {status.state === 'done' && (
        <Text style={styles.successText}>✅ Voice ready! Tap Preview to hear it.</Text>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, gap: 16 },

  // Info card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  infoText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  warningBox: {
    marginTop: 12,
    backgroundColor: colors.warningBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  warningText: { color: colors.warning, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: 'monospace', fontSize: 12 },

  // Coach row
  coachRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachInfo: { flex: 1, gap: 2 },
  coachName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  voiceLabel: { color: colors.textSubtle, fontSize: 12 },

  previewBtn: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  previewText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  // File picker & consent
  pickBtn: {
    borderRadius: 8,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  pickText: { color: colors.textSecondary, fontSize: 14 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.onAccent, fontSize: 13, fontWeight: '800' },
  consentText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  sampleNames: { flex: 1, color: colors.textSubtle, fontSize: 12 },
  refreshBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  problemText: { color: colors.warning, fontSize: 13, lineHeight: 18, marginTop: 8 },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  cloneBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  cloneBtnText: { color: colors.onAccent, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  busyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  clonedBadge: {
    backgroundColor: colors.successBg,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  clonedBadgeText: { color: colors.success, fontSize: 13, fontWeight: '600' },

  recloneBtn: {
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  recloneText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  removeBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '600' },

  // Status
  errorText: { color: colors.danger, fontSize: 13 },
  successText: { color: colors.success, fontSize: 13 },
});
