import * as Speech from 'expo-speech';

import { signatureFor } from '@/data/hype';

let muted = false;

export function setVoiceMuted(value: boolean) {
  muted = value;
  if (value) Speech.stop();
}

/** Shouts the coach's signature line (text-to-speech). */
export function shoutSignature(coachId: string) {
  if (muted) return;
  const { text, pitch, rate } = signatureFor(coachId);
  try {
    Speech.stop();
    Speech.speak(text, { pitch, rate, language: 'en-US' });
  } catch {
    // Speech isn't available on every device/browser; the text still shows on screen.
  }
}
