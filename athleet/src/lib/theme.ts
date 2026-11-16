// One color palette for the whole app. Screens should use these tokens instead of raw hex
// values so every tab, the workout flow and the coach chat look like the same product.
//
// Base: near-black charcoal with white text. Accent: Athleet yellow (matches the mascot).
// Green, red and orange are reserved for success, errors and warnings.

export const colors = {
  // Backgrounds
  bg: '#0d0d0f',            // screen background, headers, tab bar
  surface: '#1a1a1d',       // cards, inputs, list rows
  surfaceSunken: '#141416', // inset panels inside a card
  surfaceRaised: '#252529', // chips, secondary buttons, highlighted rows

  // Lines
  border: '#2a2a2e',
  borderStrong: '#3a3a40',

  // Text (brightest to dimmest)
  text: '#f5f5f5',
  textSecondary: '#d0d0d5',
  textMuted: '#a0a0a6',
  textSubtle: '#8a8a90',
  textFaint: '#6b6b72',

  // Brand accent
  accent: '#ffda62',
  accentDark: '#b48818',    // pressed state / button shadow
  accentSoft: '#2a2410',    // tinted background behind accent content
  accentBorder: '#6b5a1e',
  onAccent: '#0d0d0f',      // text on an accent-filled button

  // Status
  success: '#4ade80',
  successText: '#b8f0c6',
  successBg: '#1f3a26',
  successBorder: '#3d7a4e',
  danger: '#ff6666',
  dangerBg: '#2e1616',
  dangerBorder: '#7a2e2e',
  warning: '#ffb547',
  warningBg: '#2a1d10',
  warningBorder: '#b5651d',

  // Mascot speech bubble on the welcome / questionnaire screens
  bubble: '#fff3d5',
  bubbleText: '#24345e',
} as const;

export type ColorToken = keyof typeof colors;
