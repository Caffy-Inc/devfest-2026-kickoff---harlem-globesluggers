import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, StyleSheet, View } from 'react-native';

import { mascotArt, type MascotPose } from './mascot-art';

type Reaction = 'welcome' | 'encourage' | 'retry' | 'celebrate';
const frames = [0, 0.2, 0.4, 0.6, 0.8, 1];
const still = [0, 0, 0, 0, 0, 0];
// A quiet beat at the end gives every gesture a natural pause before repeating.
const gestures = {
  age: { body: [0, -3, 0, -2, 0, 0], head: [0, -5, 2, -3, 0, 0], left: still, right: [0, 18, -12, 18, 0, 0], prop: still },
  gender: { body: [0, -2, -2, 0, 0, 0], head: [0, 6, -4, 0, 0, 0], left: [0, 12, 0, 0, 0, 0], right: [0, -12, 0, 0, 0, 0], prop: still },
  height: { body: [0, -9, -9, -3, 0, 0], head: [0, -6, -6, 0, 0, 0], left: still, right: [0, -8, -8, 0, 0, 0], prop: still },
  weight: { body: [0, 3, 0, 3, 0, 0], head: [0, -4, 4, 0, 0, 0], left: [0, -10, 10, 0, 0, 0], right: [0, -10, 10, 0, 0, 0], prop: still },
  goal: { body: [0, -4, 0, 0, 0, 0], head: [0, -7, -7, 0, 0, 0], left: still, right: [0, -12, -4, -12, 0, 0], prop: [0, -8, 0, -8, 0, 0] },
  sport: { body: [0, 5, 0, 5, 0, 0], head: [0, 4, 0, 4, 0, 0], left: [0, -8, 0, -8, 0, 0], right: [0, 10, 0, 10, 0, 0], prop: [0, 47, 0, 47, 0, 0] },
  level: { body: [0, -3, 0, -3, 0, 0], head: [0, -3, 3, 0, 0, 0], left: [0, 18, 10, 18, 0, 0], right: [0, -18, -10, -18, 0, 0], prop: still },
  results: { body: [0, -20, 0, -12, 0, 0], head: [0, -6, 6, 0, 0, 0], left: [0, 15, -6, 15, 0, 0], right: [0, -15, 6, -15, 0, 0], prop: [0, -12, 5, -8, 0, 0] },
};

export function OnboardingMascot({
  size, reaction, cue,
}: { size: number; reaction: Reaction; cue: MascotPose }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const syncPreference = () => setReduceMotion(preference.matches);
      preference.addEventListener('change', syncPreference);
      syncPreference();
      return () => preference.removeEventListener('change', syncPreference);
    }

    let active = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      preferenceChanged = true;
      setReduceMotion(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !preferenceChanged) setReduceMotion(enabled);
    }).catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    progress.setValue(0);
    if (reduceMotion || !foreground) return;

    const animation = Animated.loop(Animated.timing(progress, {
      toValue: 1,
      duration: cue === 'sport' ? 2600 : 3400,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [cue, progress, reaction, reduceMotion, foreground]);

  const art = mascotArt[cue];
  const gesture = gestures[cue];
  const translate = (values: number[]) => progress.interpolate({ inputRange: frames, outputRange: values.map(v => v * size / 320) });
  const rotate = (values: number[]) => progress.interpolate({ inputRange: frames, outputRange: values.map(v => `${v}deg`) });
  const retry = reaction === 'retry';

  return (
    <View
      aria-hidden={true}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.stage, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, {
        transform: [{ translateY: translate(retry ? still : gesture.body) }],
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: '36% 57%', transform: [{ rotate: rotate(retry ? still : gesture.left) }],
        }]}>
          <Image source={art.left} style={styles.image} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: '63% 57%', transform: [{ rotate: rotate(retry ? still : gesture.right) }],
        }]}>
          <Image source={art.right} style={styles.image} contentFit="contain" />
        </Animated.View>
        <Image source={art.body} style={styles.image} contentFit="contain" />
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: '50% 55%',
          transform: [{ rotate: rotate(retry ? [0, -6, 6, -4, 0, 0] : gesture.head) }],
        }]}>
          <Image source={art.face} style={styles.image} contentFit="contain" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, {
        transform: [{ translateY: translate(retry ? still : gesture.prop) }],
      }]}>
        <Image source={art.prop} style={styles.image} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignSelf: 'center', marginBottom: 14 },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
