// One color palette for the whole app. Screens should use these tokens instead of raw hex
// values so every tab, the workout flow and the coach chat look like the same product.
//
// The palette is live: it follows the appearance settings (theme, accent, color vision) and
// the OS light/dark mode. `colors` always holds the current values, and stylesheets made with
// `themedStyles` rebuild themselves after a change. Screens wrapped with `themed()` (see
// '@/components/themed-screen') remount when the theme changes, so everything picks up the
// new values. Code that stays mounted (layouts, the settings screen) reads `useTheme()` instead.
//
// Default look: near-black charcoal with white text and the Athleet yellow accent (matches
// the mascot). Green, red and orange are reserved for success, errors and warnings.

import { useMemo, useSyncExternalStore } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { getCoach } from '@/data/coaches';
import {
  getAppearance,
  getSystemScheme,
  subscribeAppearance,
  subscribeSystem,
  type AccentId,
  type AppearanceSettings,
  type ColorVision,
  type DarkThemeId,
  type LightThemeId,
  type TextSize,
} from '@/lib/appearance';
import { getSelectedPlan, subscribeSelectedPlan } from '@/lib/selected-plan';

export type Palette = {
  // Backgrounds
  bg: string;            // screen background, headers, tab bar
  surface: string;       // cards, inputs, list rows
  surfaceSunken: string; // inset panels inside a card
  surfaceRaised: string; // chips, secondary buttons, highlighted rows

  // Lines
  border: string;
  borderStrong: string;

  // Text (brightest to dimmest)
  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  textFaint: string;

  // Brand accent
  accent: string;
  accentDark: string;    // pressed state / button shadow
  accentSoft: string;    // tinted background behind accent content
  accentBorder: string;
  onAccent: string;      // text on an accent-filled button

  // Status
  success: string;
  successText: string;
  successBg: string;
  successBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  warning: string;
  warningBg: string;
  warningBorder: string;

  // Mascot speech bubble on the welcome / questionnaire screens
  bubble: string;
  bubbleText: string;
};

export type ColorToken = keyof Palette;

type Base = Pick<Palette, 'bg' | 'surface' | 'surfaceSunken' | 'surfaceRaised' | 'border' | 'borderStrong' | 'text' | 'textSecondary' | 'textMuted' | 'textSubtle' | 'textFaint'>;
type Status = Pick<Palette, 'success' | 'successText' | 'successBg' | 'successBorder' | 'danger' | 'dangerBg' | 'dangerBorder' | 'warning' | 'warningBg' | 'warningBorder'>;

// ── Themes ──

export const DARK_THEMES: Record<DarkThemeId, { label: string; hint: string; base: Base; highContrast?: boolean }> = {
  midnight: {
    label: 'Midnight',
    hint: 'The original charcoal look',
    base: {
      bg: '#0d0d0f', surface: '#1a1a1d', surfaceSunken: '#141416', surfaceRaised: '#252529',
      border: '#2a2a2e', borderStrong: '#3a3a40',
      text: '#f5f5f5', textSecondary: '#d0d0d5', textMuted: '#a0a0a6', textSubtle: '#8a8a90', textFaint: '#6b6b72',
    },
  },
  dimmed: {
    label: 'Dimmed',
    hint: 'Softer slate grays',
    base: {
      bg: '#22272e', surface: '#2d333b', surfaceSunken: '#262c33', surfaceRaised: '#373e47',
      border: '#444c56', borderStrong: '#545d68',
      text: '#cdd9e5', textSecondary: '#adbac7', textMuted: '#909dab', textSubtle: '#808d9a', textFaint: '#6b7785',
    },
  },
  oled: {
    label: 'OLED Black',
    hint: 'True black, easy on battery',
    base: {
      bg: '#000000', surface: '#0e0e10', surfaceSunken: '#070708', surfaceRaised: '#1a1a1d',
      border: '#1f1f23', borderStrong: '#2e2e33',
      text: '#f5f5f5', textSecondary: '#d0d0d5', textMuted: '#a0a0a6', textSubtle: '#8a8a90', textFaint: '#6b6b72',
    },
  },
  'high-contrast': {
    label: 'High contrast',
    hint: 'Brighter text and borders',
    highContrast: true,
    base: {
      bg: '#000000', surface: '#0a0a0c', surfaceSunken: '#000000', surfaceRaised: '#1c1c20',
      border: '#7a7a85', borderStrong: '#b0b0b8',
      text: '#ffffff', textSecondary: '#f0f0f0', textMuted: '#dcdce0', textSubtle: '#c8c8cc', textFaint: '#b4b4ba',
    },
  },
};

export const LIGHT_THEMES: Record<LightThemeId, { label: string; hint: string; base: Base; highContrast?: boolean }> = {
  daylight: {
    label: 'Daylight',
    hint: 'Warm off-white',
    base: {
      bg: '#f6f6f3', surface: '#ffffff', surfaceSunken: '#efefeb', surfaceRaised: '#e9e9e4',
      border: '#dddcd5', borderStrong: '#c3c2ba',
      text: '#121214', textSecondary: '#2f2f35', textMuted: '#53535b', textSubtle: '#63636b', textFaint: '#77777f',
    },
  },
  'light-high-contrast': {
    label: 'Light high contrast',
    hint: 'Pure white, black text',
    highContrast: true,
    base: {
      bg: '#ffffff', surface: '#ffffff', surfaceSunken: '#f2f2f2', surfaceRaised: '#e6e6e6',
      border: '#5c5c66', borderStrong: '#2e2e33',
      text: '#000000', textSecondary: '#0e0e10', textMuted: '#26262b', textSubtle: '#3a3a40', textFaint: '#4d4d55',
    },
  },
};

// ── Accents ── (base hues; they are lightened or darkened to stay readable on each theme)

export const ACCENTS: Record<Exclude<AccentId, 'coach'>, { label: string; color: string }> = {
  athleet: { label: 'Athleet yellow', color: '#ffda62' },
  volt: { label: 'Volt green', color: '#c6f432' },
  electric: { label: 'Electric blue', color: '#4da3ff' },
  orange: { label: 'Orange', color: '#ff8a3d' },
  pink: { label: 'Pink', color: '#ff6fae' },
  purple: { label: 'Purple', color: '#b48cff' },
};

// ── Status colors, with colorblind-friendly sets ──

const STATUS: Record<ColorVision, { dark: Status; light: Status }> = {
  default: {
    dark: {
      success: '#4ade80', successText: '#b8f0c6', successBg: '#1f3a26', successBorder: '#3d7a4e',
      danger: '#ff6666', dangerBg: '#2e1616', dangerBorder: '#7a2e2e',
      warning: '#ffb547', warningBg: '#2a1d10', warningBorder: '#b5651d',
    },
    light: {
      success: '#1a7f37', successText: '#116329', successBg: '#dafbe1', successBorder: '#4ac26b',
      danger: '#cf222e', dangerBg: '#ffebe9', dangerBorder: '#ff8182',
      warning: '#9a6700', warningBg: '#fff8c5', warningBorder: '#d4a72c',
    },
  },
  // Protanopia / deuteranopia: blue for good, orange for bad, yellow for warnings.
  'red-green': {
    dark: {
      success: '#58a6ff', successText: '#b6d8ff', successBg: '#132a45', successBorder: '#2f6db0',
      danger: '#ff9f43', dangerBg: '#2e1d0c', dangerBorder: '#8a5520',
      warning: '#f0e442', warningBg: '#2a2810', warningBorder: '#8a8220',
    },
    light: {
      success: '#0969da', successText: '#0550ae', successBg: '#ddf4ff', successBorder: '#54aeff',
      danger: '#bc4c00', dangerBg: '#fff1e5', dangerBorder: '#fb8f44',
      warning: '#7d6b00', warningBg: '#fffbdd', warningBorder: '#d4c400',
    },
  },
  // Tritanopia: teal for good, pink-red for bad, orange for warnings.
  'blue-yellow': {
    dark: {
      success: '#2dd4bf', successText: '#b2f5ea', successBg: '#0f2e2b', successBorder: '#1f7a70',
      danger: '#ff5c8a', dangerBg: '#2e1220', dangerBorder: '#8a2a4a',
      warning: '#ff9f43', warningBg: '#2e1d0c', warningBorder: '#8a5520',
    },
    light: {
      success: '#0f766e', successText: '#115e59', successBg: '#ccfbf1', successBorder: '#5eead4',
      danger: '#be123c', dangerBg: '#ffe4e6', dangerBorder: '#fda4af',
      warning: '#c2410c', warningBg: '#ffedd5', warningBorder: '#fdba74',
    },
  },
};

const BUBBLE = { bubble: '#fff3d5', bubbleText: '#24345e' };

// ── Color math ──

function toRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

/** Blend `a` toward `b` by `t` (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Lighten (on dark backgrounds) or darken (on light ones) until the color is readable. */
function readableOn(color: string, bg: string, min: number, dark: boolean): string {
  const target = dark ? '#ffffff' : '#000000';
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = mix(color, target, t);
    if (contrast(candidate, bg) >= min) return candidate;
  }
  return target;
}

// ── Resolving the current theme ──

export const TEXT_SCALE: Record<TextSize, number> = { small: 0.9, default: 1, large: 1.15, xl: 1.3 };
const COMPACT_SPACING = 0.7;

type ThemeState = {
  version: number;
  dark: boolean;
  colors: Palette;
  settings: AppearanceSettings;
};

/** The accent base color the settings ask for (the coach's color needs a selected plan). */
export function accentBase(settings: AppearanceSettings): string {
  if (settings.accent === 'coach') {
    const plan = getSelectedPlan();
    const coach = plan ? getCoach(plan.coachId) : undefined;
    return coach?.color ?? ACCENTS.athleet.color;
  }
  return ACCENTS[settings.accent].color;
}

/** Builds a full palette for one theme. Also used by the settings screen to draw previews. */
export function buildPalette(dark: boolean, themeId: DarkThemeId | LightThemeId, settings: AppearanceSettings): Palette {
  const theme = dark ? DARK_THEMES[themeId as DarkThemeId] : LIGHT_THEMES[themeId as LightThemeId];
  const base = theme.base;
  const accent = readableOn(accentBase(settings), base.bg, theme.highContrast ? 7 : 4.5, dark);
  const onAccent = contrast(accent, '#0d0d0f') >= contrast(accent, '#ffffff') ? '#0d0d0f' : '#ffffff';
  return {
    ...base,
    accent,
    accentDark: mix(accent, '#000000', 0.3),
    accentSoft: mix(base.bg, accent, dark ? 0.14 : 0.12),
    accentBorder: mix(base.bg, accent, 0.45),
    onAccent,
    ...STATUS[settings.colorVision][dark ? 'dark' : 'light'],
    ...BUBBLE,
  };
}

function resolve(version: number): ThemeState {
  const settings = getAppearance();
  const dark = settings.mode === 'system' ? getSystemScheme() === 'dark' : settings.mode === 'dark';
  return {
    version,
    dark,
    colors: buildPalette(dark, dark ? settings.darkTheme : settings.lightTheme, settings),
    settings,
  };
}

/** Everything that changes how screens are drawn. Other settings (haptics etc.) don't remount. */
function visualSignature(state: ThemeState) {
  const s = state.settings;
  return JSON.stringify([state.dark, state.colors, s.textSize, s.density, s.bigWorkout, s.underlineLinks, s.headingEmoji]);
}

let state = resolve(0);
let signature = visualSignature(state);
const initialState = state;

/** The current palette. Always up to date; read it during render or in `themedStyles`. */
export const colors: Palette = { ...state.colors };

const listeners = new Set<() => void>();

function recompute() {
  const next = resolve(state.version + 1);
  const nextSignature = visualSignature(next);
  if (nextSignature === signature) {
    // Keep the latest settings around (e.g. haptics) without remounting anything.
    state = { ...state, settings: next.settings };
    return;
  }
  signature = nextSignature;
  state = next;
  Object.assign(colors, next.colors);
  listeners.forEach((l) => l());
}

subscribeAppearance(recompute);
subscribeSystem(recompute);
subscribeSelectedPlan(recompute);

function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Re-renders whenever the theme changes. `version` goes up by one each time. */
export function useTheme(): { version: number; dark: boolean; colors: Palette } {
  return useSyncExternalStore(subscribeTheme, () => state, () => initialState);
}

export function isDarkTheme(): boolean {
  return state.dark;
}

/** For TextInput's `keyboardAppearance`, matching the current theme. */
export function keyboardAppearance(): 'dark' | 'light' {
  return state.dark ? 'dark' : 'light';
}

/**
 * A decorative emoji for a heading or button, or nothing when the user turned them off.
 * `emoji('🔥')` gives "🔥 " (put it before the text); `emoji('🎉', 'after')` gives " 🎉".
 */
export function emoji(symbol: string, position: 'before' | 'after' = 'before'): string {
  if (!state.settings.headingEmoji) return '';
  return position === 'before' ? `${symbol} ` : ` ${symbol}`;
}

// ── Stylesheets that follow the theme ──

// React Native's newer generated types no longer export `StyleSheet.NamedStyles`, so this is
// the same shape defined locally: an object of named view, text or image styles.
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export type StyleContext = {
  /** Same object as `colors`, handy for destructuring. */
  colors: Palette;
  dark: boolean;
  /** "Big workout mode": larger numbers and controls on the workout screen. */
  big: boolean;
};

const SPACING_KEYS = new Set([
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical', 'paddingStart', 'paddingEnd',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'gap', 'rowGap', 'columnGap',
]);

// Style names that read as links (e.g. `link`, `backLinkText`, `restSkip`).
const LINK_NAME = /link|skip/i;

/** Applies text size, layout density and link underlines to a set of raw styles. */
function adjust(raw: Record<string, unknown>, s: AppearanceSettings): Record<string, unknown> {
  const fontScale = TEXT_SCALE[s.textSize];
  const space = s.density === 'compact' ? COMPACT_SPACING : 1;
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      out[name] = value;
      continue;
    }
    const style: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    for (const [prop, v] of Object.entries(style)) {
      if (typeof v !== 'number') continue;
      if (fontScale !== 1 && (prop === 'fontSize' || prop === 'lineHeight')) style[prop] = Math.round(v * fontScale);
      else if (space !== 1 && SPACING_KEYS.has(prop)) style[prop] = Math.round(v * space);
    }
    if (s.underlineLinks && LINK_NAME.test(name) && 'color' in style && !style.textDecorationLine) {
      style.textDecorationLine = 'underline';
    }
    out[name] = style;
  }
  return out;
}

/** Builds styles for one theme state (the current one, or the one a hook re-rendered with). */
function build<T>(factory: (ctx: StyleContext) => T, theme: ThemeState): T {
  const raw = factory({ colors, dark: theme.dark, big: theme.settings.bigWorkout }) as Record<string, unknown>;
  return StyleSheet.create(adjust(raw, theme.settings) as any) as T;
}

/**
 * Like `StyleSheet.create`, but the styles follow the theme: they are rebuilt from `factory`
 * with the current colors, text size and density whenever the theme changes.
 *
 *   const styles = themedStyles(({ big }) => ({ title: { color: colors.text, fontSize: big ? 30 : 18 } }));
 */
export function themedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (ctx: StyleContext) => T & NamedStyles<any>
): T {
  let builtFor = -1;
  let cache = {} as T;
  const current = (): T => {
    if (builtFor !== state.version) {
      cache = build(factory, state);
      builtFor = state.version;
    }
    return cache;
  };
  return new Proxy({} as T & object, {
    get: (_target, key) => (current() as Record<string | symbol, unknown>)[key],
    has: (_target, key) => key in (current() as object),
    ownKeys: () => Reflect.ownKeys(current() as object),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Object.getOwnPropertyDescriptor(current() as object, key);
      if (descriptor) descriptor.configurable = true;
      return descriptor;
    },
  }) as T;
}

/** Hook version of `themedStyles` for components that stay mounted across theme changes. */
export function useThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (ctx: StyleContext) => T & NamedStyles<any>
): T {
  const theme = useSyncExternalStore(subscribeTheme, () => state, () => initialState);
  return useMemo(() => build(factory, theme), [factory, theme]);
}
