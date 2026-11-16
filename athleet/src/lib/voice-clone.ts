/**
 * voice-clone.ts — Shared custom coach voices, served by the app's own API routes.
 *
 * Voices are server-wide: every user hears the same coach voice.
 *   - Folder: athleet/voices/<coachId>/*.mp3 + CONSENT.txt (see voices/README.md)
 *   - Upload: Voice Settings screen (consent checkbox)
 * The server clones them with ElevenLabs once and keeps the ids in
 * voices/registry.json. The app fetches that list (/api/voice/coaches), caches
 * it on-device for fast startup, and streams /api/voice/speak with expo-audio.
 * If anything fails, callers fall back to expo-speech.
 *
 * The ElevenLabs key lives in athleet/.env as ELEVENLABS_API_KEY (server-only).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Where the API routes live ──────────────────────────────────────────────

/**
 * In development the API routes are served by the same `npx expo start`
 * server the app loads from, so we derive the URL from it. For a production
 * build, deploy with EAS Hosting and set EXPO_PUBLIC_VOICE_API_URL.
 */
function apiBase(): string {
  const configured = process.env.EXPO_PUBLIC_VOICE_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  // Static hosting (GitHub Pages) has no API routes: skip the server and use device voices.
  if (process.env.EXPO_PUBLIC_STATIC_SITE === '1') return '';
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  const host = Constants.expoConfig?.hostUri?.split('/')[0];
  return host ? `http://${host}` : '';
}

const VOICE_API_KEY = process.env.EXPO_PUBLIC_VOICE_API_KEY ?? '';
const STORAGE_KEY = 'athleet_shared_voices_v1';
const START_TIMEOUT_MS = 8000;

// ─── Types ──────────────────────────────────────────────────────────────────

/** An audio file picked by the user (shape matches expo-document-picker assets). */
export type AudioSample = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  /** Web only: the underlying File object. */
  file?: File;
};

export type ClonedVoice = {
  coachId: string;
  voiceId: string;
  source: 'folder' | 'upload';
  sampleNames: string[];
  /** From CONSENT.txt for folder voices. */
  speaker?: string;
  label?: string;
  createdAt: string;
};

export type VoiceProblem = { coachId?: string; message: string };

export type CloneStatus =
  | { state: 'idle' }
  | { state: 'uploading'; message: string }
  | { state: 'done'; voice: ClonedVoice }
  | { state: 'error'; message: string };

let serverReady: boolean | null = null;

// ─── Shared store (mirrors the server's registry) ───────────────────────────

let clonedVoices: Record<string, ClonedVoice> = {};
let problems: VoiceProblem[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeClonedVoices(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function authHeaders(): Record<string, string> {
  return VOICE_API_KEY ? { Authorization: `Bearer ${VOICE_API_KEY}` } : {};
}

function apply(voices: Record<string, Omit<ClonedVoice, 'coachId'>>) {
  clonedVoices = Object.fromEntries(
    Object.entries(voices ?? {}).map(([coachId, v]) => [coachId, { ...v, coachId }]),
  );
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clonedVoices)).catch(() => {});
  notify();
}

let refreshing: Promise<VoiceProblem[]> | null = null;

/**
 * Fetch the shared voices from the server. This also makes the server clone
 * any new audio dropped into athleet/voices/, so it can take a few seconds.
 * Returns setup problems (missing key, missing CONSENT.txt, …).
 */
export function refreshSharedVoices(): Promise<VoiceProblem[]> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const base = apiBase();
    if (!base) return problems;
    try {
      const res = await fetch(`${base}/api/voice/coaches`, { headers: authHeaders() });
      if (!res.ok) {
        problems = [{ message: (await res.text().catch(() => '')) || `Voice server returned ${res.status}` }];
      } else {
        const data = await res.json();
        problems = Array.isArray(data.problems) ? data.problems : [];
        apply(data.voices ?? {});
        serverReady = !problems.some((p) => !p.coachId && /ELEVENLABS_API_KEY/.test(p.message));
      }
    } catch {
      problems = [{ message: `Can't reach the app server at ${base}.` }];
    }
    notify();
    return problems;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

export function getVoiceProblems(): VoiceProblem[] {
  return problems;
}

// Show cached voices instantly, then sync with the server.
(async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Object.keys(clonedVoices).length) {
        clonedVoices = parsed;
        notify();
      }
    }
  } catch {}
  refreshSharedVoices();
})();

// ─── Public API ─────────────────────────────────────────────────────────────

export function isVoiceCloningAvailable(): boolean {
  return !!apiBase();
}

export function getClonedVoice(coachId: string): ClonedVoice | null {
  return clonedVoices[coachId] ?? null;
}

export function getAllClonedVoices(): Record<string, ClonedVoice> {
  return { ...clonedVoices };
}

function guessMime(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'aac') return 'audio/aac';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'ogg') return 'audio/ogg';
  return 'audio/mpeg';
}

/**
 * Create a custom voice for a coach from audio files.
 * `consent` must be true: the speaker agreed to have their voice cloned.
 */
export async function cloneVoiceFromAudio(
  coachId: string,
  samples: AudioSample[],
  options: { consent: boolean; label?: string },
  onStatus?: (status: CloneStatus) => void,
): Promise<ClonedVoice> {
  const base = apiBase();
  const fail = (message: string): never => {
    onStatus?.({ state: 'error', message });
    throw new Error(message);
  };

  if (!base) fail('Could not find the app server. Start the app with `npx expo start`.');
  if (!options.consent) fail('Please confirm the speaker agreed to have their voice cloned.');
  if (!samples.length) fail('Pick at least one audio file.');

  onStatus?.({ state: 'uploading', message: 'Uploading audio & building voice…' });

  const form = new FormData();
  form.append('coachId', coachId);
  form.append('label', options.label || coachId);
  form.append('consent', 'true');
  for (const s of samples.slice(0, 5)) {
    if (Platform.OS === 'web' && s.file) {
      form.append('files', s.file, s.name);
    } else {
      // React Native's FormData accepts { uri, name, type } for file parts.
      form.append('files', { uri: s.uri, name: s.name, type: s.mimeType || guessMime(s.name) } as any);
    }
  }

  let res: Response | undefined;
  try {
    res = await fetch(`${base}/api/voice/clone`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
  } catch {
    fail(`Can't reach the app server at ${base}. Is \`npx expo start\` still running?`);
  }
  if (!res!.ok) fail((await res!.text().catch(() => '')) || `Server returned ${res!.status}`);

  const data = await res!.json();
  const voiceId: string | undefined = data.voiceId ?? data.voice_id;
  if (!voiceId) fail('Server did not return a voice id.');

  const voice: ClonedVoice = {
    coachId,
    voiceId: voiceId!,
    source: 'upload',
    sampleNames: samples.map((s) => s.name),
    label: options.label,
    createdAt: new Date().toISOString(),
    ...(data.voice ?? {}),
  };

  clonedVoices = { ...clonedVoices, [coachId]: voice };
  notify();
  serverReady = true;
  refreshSharedVoices();

  onStatus?.({ state: 'done', voice });
  return voice;
}

/** Remove a coach's shared voice for everyone, reverting to built-in TTS. */
export async function removeClonedVoice(coachId: string): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('Could not find the app server.');
  const res = await fetch(`${base}/api/voice/clone?coachId=${encodeURIComponent(coachId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `Server returned ${res.status}`);
  const { [coachId]: _removed, ...rest } = clonedVoices;
  clonedVoices = rest;
  notify();
  await refreshSharedVoices();
}

// ─── Playback ───────────────────────────────────────────────────────────────

let current: AudioPlayer | null = null;
let audioModeSet = false;

/** One quick check per session so a missing key falls back instantly. */
async function checkServer(base: string): Promise<boolean> {
  if (serverReady !== null) return serverReady;
  try {
    const res = await fetch(`${base}/api/voice/speak?health=1`);
    const data = await res.json();
    serverReady = !!data?.elevenlabs;
  } catch {
    serverReady = false;
  }
  if (!serverReady) console.warn('[voice-clone] Voice API not ready (is ELEVENLABS_API_KEY in athleet/.env?). Using device voices.');
  return serverReady;
}

/**
 * Speak text in the coach's custom voice.
 * Resolves true once audio actually starts, false if there is no custom voice
 * or it could not play (the caller should then use expo-speech).
 * `onDone` fires when playback ends or is stopped.
 */
export async function speakWithClonedVoice(
  coachId: string,
  text: string,
  opts: { rate?: number; onStart?: () => void; onDone?: () => void } = {},
): Promise<boolean> {
  const voice = getClonedVoice(coachId);
  const base = apiBase();
  if (!voice || !base || !text.trim()) return false;
  if (!(await checkServer(base))) return false;

  stopClonedAudio();
  if (!audioModeSet) {
    audioModeSet = true;
    try { await setAudioModeAsync({ playsInSilentMode: true }); } catch {}
  }

  const params = new URLSearchParams({ voiceId: voice.voiceId, text, speed: String(opts.rate ?? 1) });
  if (VOICE_API_KEY) params.set('key', VOICE_API_KEY);

  return new Promise<boolean>((resolve) => {
    let started = false;
    let ended = false;
    let player: AudioPlayer;
    try {
      player = createAudioPlayer({ uri: `${base}/api/voice/speak?${params}` });
    } catch {
      resolve(false);
      return;
    }
    current = player;

    const end = () => {
      if (ended) return;
      ended = true;
      sub.remove();
      clearTimeout(timer);
      try { player.remove(); } catch {}
      if (current === player) current = null;
      if (started) opts.onDone?.();
      else resolve(false);
    };

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (!started && status.playing) {
        started = true;
        clearTimeout(timer);
        opts.onStart?.();
        resolve(true);
      }
      if (status.didJustFinish) end();
    });

    // If audio hasn't started in time (server error, bad network), give up.
    const timer = setTimeout(() => { if (!started) end(); }, START_TIMEOUT_MS);
    (player as any).__end = end;
    player.play();
  });
}

/** Stop any custom-voice audio that is playing. */
export function stopClonedAudio(): void {
  const player = current;
  current = null;
  if (!player) return;
  const end = (player as any).__end as (() => void) | undefined;
  try { player.pause(); } catch {}
  if (end) end();
  else try { player.remove(); } catch {}
}
