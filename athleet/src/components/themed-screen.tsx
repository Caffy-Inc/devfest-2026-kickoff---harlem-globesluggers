import type { ComponentType } from 'react';

import { useTheme } from '@/lib/theme';

/**
 * Wraps a route screen so it redraws with the new colors, text size and density when the
 * appearance changes. The screen remounts (its own local state resets) but the navigation
 * stack stays where it is.
 *
 * Why remount instead of re-render: the React Compiler caches JSX that only reads module
 * values like `colors` and `styles`, so a plain re-render would keep the old look.
 *
 * Screens that hold progress the user would lose (the coach session with an active workout,
 * the questionnaire) are left unwrapped: they keep the look they opened with and pick up the
 * new one next time.
 */
export function themed<P extends object>(Screen: ComponentType<P>) {
  function ThemedScreen(props: P) {
    const { version } = useTheme();
    return <Screen key={version} {...props} />;
  }
  ThemedScreen.displayName = `Themed(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return ThemedScreen;
}
