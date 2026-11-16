import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Appearance, Platform } from 'react-native';

// How the app looks and feels: theme, accent, text size, motion, feedback and personality.
// Saved on the device so the choices survive reloads. The theme module turns these settings
// into the live color palette and scaled styles (see '@/lib/theme').

export type ThemeMode = 'system' | 'light' | 'dark';
export type DarkThemeId = 'midnight' | 'dimmed' | 'oled' | 'high-contrast';
export type LightThemeId = 'daylight' | 'light-high-contrast';
export type AccentId = 'athleet' | 'volt' | 'electric' | 'orange' | 'pink' | 'purple' | 'coach';
export type ColorVision = 'default' | 'red-green' | 'blue-yellow';
export type TextSize = 'small' | 'default' | 'large' | 'xl';
export type Density = 'comfortable' | 'compact';
export type MotionPreference = 'system' | 'on' | 'off';
export type HapticsLevel = 'off' | 'subtle' | 'strong';
export type MascotMode = 'full' | 'minimal' | 'hidden';

export type AppearanceSettings = {
  mode: ThemeMode;
  darkTheme: DarkThemeId;
  lightTheme: LightThemeId;
  accent: AccentId;
  colorVision: ColorVision;
  textSize: TextSize;
  density: Density;
  /** Huge rep counts, timers and buttons on the workout screen. */
  bigWorkout: boolean;
  /** 'on' always reduces motion, 'off' never does, 'system' follows the OS setting. */
  reduceMotion: MotionPreference;
  haptics: HapticsLevel;
  sounds: boolean;
  underlineLinks: boolean;
  mascot: MascotMode;
  headingEmoji: boolean;
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  mode: 'dark',
  darkTheme: 'midnight',
  lightTheme: 'daylight',
  accent: 'athleet',
  colorVision: 'default',
  textSize: 'default',
  density: 'comfortable',
  bigWorkout: false,
  reduceMotion: 'system',
  haptics: 'subtle',
  sounds: true,
  underlineLinks: false,
  mascot: 'full',
  headingEmoji: true,
};

const STORAGE_KEY = 'athleet_appearance_v1';

// Allowed values per setting, used to ignore anything unexpected in storage.
const ALLOWED: { [K in keyof AppearanceSettings]: readonly AppearanceSettings[K][] } = {
  mode: ['system', 'light', 'dark'],
  darkTheme: ['midnight', 'dimmed', 'oled', 'high-contrast'],
  lightTheme: ['daylight', 'light-high-contrast'],
  accent: ['athleet', 'volt', 'electric', 'orange', 'pink', 'purple', 'coach'],
  colorVision: ['default', 'red-green', 'blue-yellow'],
  textSize: ['small', 'default', 'large', 'xl'],
  density: ['comfortable', 'compact'],
  bigWorkout: [true, false],
  reduceMotion: ['system', 'on', 'off'],
  haptics: ['off', 'subtle', 'strong'],
  sounds: [true, false],
  underlineLinks: [true, false],
  mascot: ['full', 'minimal', 'hidden'],
  headingEmoji: [true, false],
};

function sanitize(raw: unknown): AppearanceSettings {
  const next: AppearanceSettings = { ...DEFAULT_APPEARANCE };
  if (!raw || typeof raw !== 'object') return next;
  for (const key of Object.keys(ALLOWED) as (keyof AppearanceSettings)[]) {
    const value = (raw as Record<string, unknown>)[key];
    if ((ALLOWED[key] as readonly unknown[]).includes(value)) (next as Record<string, unknown>)[key] = value;
  }
  return next;
}

// Everyone starts from the defaults (also what the web server renders), then the saved
// settings load from storage right after.
let current: AppearanceSettings = DEFAULT_APPEARANCE;
let changedBeforeLoad = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (!raw || changedBeforeLoad) return;
    current = sanitize(JSON.parse(raw));
    notify();
  })
  .catch(() => {
    // Storage unavailable: settings just won't persist this session.
  });

export function getAppearance(): AppearanceSettings {
  return current;
}

export function setAppearance(changes: Partial<AppearanceSettings>) {
  const next = sanitize({ ...current, ...changes });
  if ((Object.keys(next) as (keyof AppearanceSettings)[]).every((k) => next[k] === current[k])) return;
  current = next;
  changedBeforeLoad = true;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  notify();
}

export function resetAppearance() {
  setAppearance(DEFAULT_APPEARANCE);
}

export function subscribeAppearance(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerSnapshot(): AppearanceSettings {
  return DEFAULT_APPEARANCE;
}

/** Re-renders when any appearance setting changes or finishes loading. */
export function useAppearance(): AppearanceSettings {
  return useSyncExternalStore(subscribeAppearance, getAppearance, getServerSnapshot);
}

// ── System preferences ──
// The OS color scheme and reduce-motion setting, tracked once for the whole app.

let systemScheme: 'light' | 'dark' = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
// Assume reduced motion until the OS answers, so nothing animates that shouldn't.
let systemReduceMotion = true;
const systemListeners = new Set<() => void>();

function notifySystem() {
  systemListeners.forEach((l) => l());
}

Appearance.addChangeListener(({ colorScheme }) => {
  const next = colorScheme === 'light' ? 'light' : 'dark';
  if (next === systemScheme) return;
  systemScheme = next;
  notifySystem();
});

function setSystemReduceMotion(value: boolean) {
  if (value === systemReduceMotion) return;
  systemReduceMotion = value;
  notifySystem();
}

if (Platform.OS === 'web') {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    systemReduceMotion = media.matches;
    media.addEventListener('change', () => setSystemReduceMotion(media.matches));
  }
} else {
  let answered = false;
  AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
    answered = true;
    setSystemReduceMotion(value);
  });
  AccessibilityInfo.isReduceMotionEnabled()
    .then((value) => {
      if (!answered) setSystemReduceMotion(value);
    })
    .catch(() => setSystemReduceMotion(false));
}

export function getSystemScheme(): 'light' | 'dark' {
  return systemScheme;
}

export function subscribeSystem(listener: () => void) {
  systemListeners.add(listener);
  return () => {
    systemListeners.delete(listener);
  };
}

/** Whether animations should be reduced, combining the app setting with the OS setting. */
export function getReduceMotion(): boolean {
  if (current.reduceMotion === 'on') return true;
  if (current.reduceMotion === 'off') return false;
  return systemReduceMotion;
}

function subscribeMotion(listener: () => void) {
  const a = subscribeAppearance(listener);
  const b = subscribeSystem(listener);
  return () => {
    a();
    b();
  };
}

/** Re-renders when the reduce-motion setting or the OS preference changes. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, getReduceMotion, () => true);
}
