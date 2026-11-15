import type { UserProfile } from '@/lib/types';

// In-memory for now; resets when the app reloads.
let current: UserProfile | null = null;

export function setProfile(p: UserProfile) {
  current = p;
}

export function getProfile(): UserProfile | null {
  return current;
}

/** Merge changes into the saved profile (no-op if onboarding wasn't finished). */
export function updateProfile(changes: Partial<UserProfile>) {
  if (current) current = { ...current, ...changes };
}
