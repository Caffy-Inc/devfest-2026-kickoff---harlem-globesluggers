import * as Speech from 'expo-speech';

import { signatureFor, type Signature } from '@/data/hype';
import { getClonedVoice, speakWithClonedVoice, stopClonedAudio } from '@/lib/voice-clone';

// Speaks each coach's signature line with a device voice that fits them
// (male/female, closest accent, and their pitch/speed).

let muted = false;

export function setVoiceMuted(value: boolean) {
  muted = value;
  if (value) {
    Speech.stop();
    stopClonedAudio();
  }
}

// Known voices by gender (iOS/macOS, Android Google TTS, Windows/Edge, Chrome).
const MALE = [
  // Apple
  'aaron', 'fred', 'daniel', 'rishi', 'arthur', 'gordon', 'oliver', 'tom', 'alex', 'reed', 'rocko', 'eddy',
  'ralph', 'albert', 'junior', 'evan', 'nathan', 'lee', 'grandpa',
  // Microsoft / Edge
  'david', 'mark', 'guy', 'ryan', 'christopher', 'eric', 'roger', 'steffan', 'thomas', 'george', 'james',
  'andrew', 'brian', 'liam', 'william', 'connor', 'mitchell', 'kenneth', 'prabhat', 'ravi', 'davis', 'tony',
  'jason', 'brandon', 'derek', 'dustin', 'kai', 'luke', 'elliot', 'noah', 'ken',
  // Generic labels (e.g. "Google UK English Male", iOS "siri_male")
  'male', 'man',
  // Android Google TTS
  'en-us-x-tpd', 'en-us-x-iol', 'en-us-x-iom', 'en-gb-x-rjs', 'en-gb-x-gbd', 'en-gb-x-gbb',
  'en-au-x-aub', 'en-au-x-aud', 'en-in-x-ene', 'en-in-x-end',
];
const FEMALE = [
  // Apple
  'samantha', 'karen', 'moira', 'tessa', 'martha', 'catherine', 'nicky', 'kathy', 'flo', 'sandy', 'shelley',
  'victoria', 'fiona', 'zoe', 'allison', 'ava', 'susan', 'serena', 'kate', 'grandma', 'veena',
  // Microsoft / Edge
  'zira', 'aria', 'jenny', 'michelle', 'hazel', 'libby', 'sonia', 'emma', 'ana', 'natasha', 'clara', 'sara',
  'molly', 'neerja', 'heera', 'emily', 'linda', 'nora', 'jane', 'nancy', 'amber', 'ashley', 'cora', 'elizabeth',
  'monica', 'maisie', 'abbi', 'bella', 'hollie', 'olivia',
  // Generic labels
  'female', 'woman', 'google us english',
  // Android Google TTS
  'en-us-x-sfg', 'en-us-x-tpc', 'en-us-x-iob', 'en-us-x-iog', 'en-us-x-tpf',
  'en-gb-x-gba', 'en-gb-x-gbc', 'en-gb-x-gbg', 'en-au-x-aua', 'en-au-x-auc', 'en-in-x-ena', 'en-in-x-enc',
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

const NOVELTY = /novelty|whisper|bells|bubbles|cellos|organ|trinoids|zarvox|bad news|good news|jester|superstar|wobble|boing|deranged|hysterical|bahh/;

/** Higher is better. -Infinity means never use this voice for this coach. */
function score(v: Speech.Voice, sig: Signature): number {
  const lang = (v.language || '').replace('_', '-');
  if (!lang.toLowerCase().startsWith('en')) return -Infinity;
  const t = words(v);
  if (NOVELTY.test(t)) return -Infinity;
  const g = genderOf(v);
  if (g && g !== sig.gender) return -Infinity; // never a male voice for a female coach, or the other way round
  let s = g === sig.gender ? 1000 : 0; // a confirmed match always beats a voice we can't identify
  const nameRank = sig.voices.findIndex((n) => has(t, n.toLowerCase()));
  if (nameRank >= 0) s += 100 - nameRank * 3;
  const langRank = sig.langs.findIndex((l) => l.toLowerCase() === lang.toLowerCase());
  if (langRank >= 0) s += 40 - langRank * 5;
  if (v.quality === Speech.VoiceQuality.Enhanced) s += 10;
  if (/network|online|natural|neural/.test(t)) s += 5; // higher quality on Android/Edge
  return s;
}

type Pick = { voice: Speech.Voice | null; confirmed: boolean };

let voices: Speech.Voice[] = [];
const picked: Record<string, Pick> = {};
let loading: Promise<void> | null = null;

function loadVoices(): Promise<void> {
  if (voices.length) return Promise.resolve();
  if (loading) return loading;
  loading = Speech.getAvailableVoicesAsync()
    .then((list) => {
      voices = list ?? [];
    })
    .catch(() => { })
    .finally(() => {
      loading = null;
    });
  return loading;
}
// Start loading early so the first set already has the right voice.
loadVoices();

function voiceFor(coachId: string, sig: Signature): Pick {
  if (coachId in picked) return picked[coachId];
  if (!voices.length) return { voice: null, confirmed: false }; // not loaded; don't cache
  let best: Speech.Voice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const s = score(v, sig);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  const pick = { voice: best, confirmed: !!best && genderOf(best) === sig.gender };
  picked[coachId] = pick;
  return pick;
}

/**
 * If we couldn't confirm the voice's gender (or have to use the device default,
 * which is often female on iPhone), push the pitch toward the coach's gender.
 */
function pitchFor(sig: Signature, confirmed: boolean): number {
  if (confirmed) return sig.pitch;
  return sig.gender === 'male' ? Math.min(sig.pitch, 0.7) : Math.max(sig.pitch, 1.15);
}

// Don't make the user wait long for the first shout if voices are slow to load.
const withTimeout = (p: Promise<void>, ms: number) =>
  Promise.race([p, new Promise<void>((resolve) => setTimeout(resolve, ms))]);

/** Voice settings shared by signature shouts and animated coach speech. */
export async function coachVoiceOptions(coachId: string) {
  const sig = signatureFor(coachId);
  if (!voices.length) await withTimeout(loadVoices(), 1200);
  const { voice, confirmed } = voiceFor(coachId, sig);
  return {
    pitch: pitchFor(sig, confirmed),
    rate: sig.rate,
    language: voice?.language ?? sig.langs[0] ?? 'en-US',
    ...(voice ? { voice: voice.identifier } : {}),
  };
}

/** Shouts the coach's signature line (text-to-speech). */
export async function shoutSignature(coachId: string) {
  if (muted) return;
  const sig = signatureFor(coachId);
  // A custom voice (Voice Settings) takes priority over device text-to-speech.
  if (getClonedVoice(coachId)) {
    Speech.stop();
    if (await speakWithClonedVoice(coachId, sig.text, { rate: sig.rate })) return;
  }
  if (!voices.length) await withTimeout(loadVoices(), 1200);
  if (muted) return;
  const { voice, confirmed } = voiceFor(coachId, sig);
  try {
    Speech.stop();
    Speech.speak(sig.text, {
      pitch: pitchFor(sig, confirmed),
      rate: sig.rate,
      language: voice?.language ?? sig.langs[0] ?? 'en-US',
      ...(voice ? { voice: voice.identifier } : {}),
    });
  } catch {
    // Speech isn't available on every device/browser; the text still shows on screen.
  }
}
