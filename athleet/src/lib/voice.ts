import * as Speech from 'expo-speech';

import { signatureFor, type Signature } from '@/data/hype';

// Speaks each coach's signature line with a device voice that fits them
// (male/female, closest accent, and their pitch/speed).

let muted = false;

export function setVoiceMuted(value: boolean) {
  muted = value;
  if (value) Speech.stop();
}

// Known voices by gender (iOS/macOS, Android, Windows/Chrome). Unknown voices count as neutral.
const MALE = [
  'aaron', 'fred', 'daniel', 'rishi', 'arthur', 'gordon', 'oliver', 'tom', 'alex', 'reed', 'rocko', 'eddy',
  'ralph', 'albert', 'junior', 'lee', 'evan', 'nathan', 'david', 'mark', 'guy', 'ryan', 'christopher', 'eric',
  'roger', 'steffan', 'thomas', 'george', 'james', 'male',
  'en-us-x-tpd', 'en-us-x-iol', 'en-us-x-iom', 'en-gb-x-rjs', 'en-gb-x-gbd', 'en-au-x-aub', 'en-au-x-aud',
];
const FEMALE = [
  'samantha', 'karen', 'moira', 'tessa', 'martha', 'catherine', 'nicky', 'kathy', 'flo', 'sandy', 'shelley',
  'victoria', 'fiona', 'zoe', 'allison', 'ava', 'susan', 'serena', 'kate', 'zira', 'aria', 'jenny', 'michelle',
  'hazel', 'susan', 'libby', 'sonia', 'grandma', 'female', 'google us english',
  'en-us-x-sfg', 'en-us-x-tpc', 'en-us-x-iob', 'en-us-x-iog', 'en-us-x-tpf', 'en-gb-x-gba', 'en-gb-x-gbc', 'en-gb-x-gbg',
];

const words = (v: Speech.Voice) => `${v.name} ${v.identifier}`.toLowerCase();
// Whole-word match, so "male" doesn't match "female".
const has = (text: string, key: string) =>
  new RegExp(`(^|[^a-z])${key.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}([^a-z]|$)`).test(text);
const genderOf = (v: Speech.Voice): 'male' | 'female' | null => {
  const t = words(v);
  if (FEMALE.some((k) => has(t, k))) return 'female';
  if (MALE.some((k) => has(t, k))) return 'male';
  return null;
};

function score(v: Speech.Voice, sig: Signature): number {
  const lang = (v.language || '').replace('_', '-');
  if (!lang.toLowerCase().startsWith('en')) return -1;
  const t = words(v);
  let s = 0;
  const nameRank = sig.voices.findIndex((n) => has(t, n.toLowerCase()));
  if (nameRank >= 0) s += 100 - nameRank * 3;
  const g = genderOf(v);
  if (g === sig.gender) s += 50;
  else if (g) s -= 200; // never give a male coach a female voice, or the other way round
  const langRank = sig.langs.findIndex((l) => l.toLowerCase() === lang.toLowerCase());
  if (langRank >= 0) s += 40 - langRank * 5;
  if (v.quality === Speech.VoiceQuality.Enhanced) s += 10;
  if (/novelty|whisper|bells|bubbles|cellos|organ|trinoids|zarvox|bad news|good news|jester|superstar|wobble/.test(t)) s -= 300;
  return s;
}

let voices: Speech.Voice[] = [];
const picked: Record<string, Speech.Voice | null> = {};
let loading: Promise<void> | null = null;

function loadVoices() {
  if (voices.length || loading) return;
  loading = Speech.getAvailableVoicesAsync()
    .then((list) => {
      voices = list ?? [];
    })
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
}
// Start loading early so the first set already has the right voice.
loadVoices();

function voiceFor(coachId: string, sig: Signature): Speech.Voice | null {
  if (coachId in picked) return picked[coachId];
  if (!voices.length) return null; // not loaded yet; try again next time
  let best: Speech.Voice | null = null;
  let bestScore = 0;
  for (const v of voices) {
    const s = score(v, sig);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  picked[coachId] = best;
  return best;
}

/** Shouts the coach's signature line (text-to-speech). */
export function shoutSignature(coachId: string) {
  if (muted) return;
  const sig = signatureFor(coachId);
  if (!voices.length) loadVoices();
  const voice = voiceFor(coachId, sig);
  try {
    Speech.stop();
    Speech.speak(sig.text, {
      pitch: sig.pitch,
      rate: sig.rate,
      language: voice?.language ?? sig.langs[0] ?? 'en-US',
      ...(voice ? { voice: voice.identifier } : {}),
    });
  } catch {
    // Speech isn't available on every device/browser; the text still shows on screen.
  }
}
