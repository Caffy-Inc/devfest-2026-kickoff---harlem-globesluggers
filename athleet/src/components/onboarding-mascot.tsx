import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Platform, StyleSheet, View } from 'react-native';

import { mascotArt, spinBallCenter, spinBallSeam, type MascotPose } from './mascot-art';

type Reaction = 'welcome' | 'encourage' | 'retry' | 'celebrate';
const keyframes = [0, 0.12, 0.23, 0.36, 0.49, 0.62, 0.73, 0.85, 1];
const still = keyframes.map(() => 0);

// Sample smooth curves once so the same easing can run on the native Animated driver and on web.
const samplesPerSegment = 10;
const segments = keyframes.slice(0, -1).flatMap((start, index) => {
  const span = keyframes[index + 1] - start;
  return Array.from({ length: samplesPerSegment }, (_, sample) => {
    const t = sample / samplesPerSegment;
    return { index, span, t, time: start + t * span };
  });
});
const frames = [...segments.map(({ time }) => time), 1];

const spinFrames = Array.from({ length: 65 }, (_, i) => i / 64);
// Project the front half of each meridian onto the ball. At the rim it
// disappears into the outline before its opposite side comes into view.
const spinSeams = [0.125, 0.375, 0.625, 0.875].map(offset => {
  const angles = spinFrames.map(time => (time + offset) * 2 * Math.PI);
  return {
    scaleX: angles.map(angle => Math.sin(angle)),
    opacity: angles.map(angle => Math.max(0, Math.min(1, Math.cos(angle) * 5))),
  };
});

function smoothTrack(poses: number[]) {
  const slopes = poses.slice(1).map((pose, i) => (pose - poses[i]) / (keyframes[i + 1] - keyframes[i]));
  const tangents = [0, ...slopes.slice(1).map((next, i) => {
    const previous = slopes[i];
    // Ease to zero at a reversal or hold. Carry speed through poses moving in the same direction.
    return previous * next > 0 ? 2 * previous * next / (previous + next) : 0;
  }), 0];

  return [...segments.map(({ index, span, t }) => {
    const ease = t * t * (3 - 2 * t);
    const remaining = 1 - t;
    return poses[index] * (1 - ease) + poses[index + 1] * ease
      + span * t * remaining * (remaining * tangents[index] - t * tangents[index + 1]);
  }), poses[poses.length - 1]];
}

// Let the body lead, with arms, head, and props following at their own pace.
const gestures = {
  start: {
    body: still, stretch: still, left: still, right: still, prop: still,
    head: [0, -2, -4, -3, 0, 2, 3, 1, 0],
  },
  age: {
    body: [0, 2, -4, -3, -2, -3, 1, 0, 0], stretch: [0, -3, 2, 1, 0, 1, -1, 0, 0],
    head: [0, 2, -6, -5, 1, -4, -1, 0, 0],
    left: [0, 0, 3, 5, 3, 4, -2, 0, 0], right: [0, -6, 24, -14, 20, -8, 5, 0, 0], prop: still,
  },
  gender: {
    body: [0, 2, -2, -4, -2, 1, 0, 0, 0], stretch: [0, -2, 1, 2, 1, -1, 0, 0, 0],
    head: [0, -3, 7, 9, 3, -4, -1, 0, 0],
    left: [0, -3, 13, 16, 11, -3, -1, 0, 0], right: [0, 2, -6, -15, -12, 3, 1, 0, 0], prop: still,
  },
  height: {
    body: [0, 3, -5, -10, -10, -5, 2, 0, 0], stretch: [0, -4, 2, 5, 5, 2, -2, 0, 0],
    head: [0, 2, -3, -8, -7, -3, 2, 0, 0],
    left: [0, 1, 3, 4, 2, 1, -2, 0, 0], right: [0, 4, -3, -10, -10, -5, 3, 0, 0], prop: still,
  },
  weight: {
    body: [0, 5, -3, 4, -2, 2, -1, 0, 0], stretch: [0, -5, 3, -4, 2, -2, 1, 0, 0],
    head: [0, -2, 6, 2, -6, -2, 1, 0, 0],
    left: [0, -3, -14, 3, 9, 3, -2, 0, 0], right: [0, 3, 7, 13, -5, -7, 2, 0, 0], prop: still,
  },
  goal: {
    body: [0, 3, -4, -5, -2, -3, 1, 0, 0], stretch: [0, -3, 3, 2, 0, 1, -1, 0, 0],
    head: [0, -2, 6, 9, 5, 7, -2, 0, 0],
    left: [0, 2, -3, -5, -3, -4, 1, 0, 0], right: [0, 7, -19, -11, -6, -14, 4, 0, 0],
    prop: [0, 0, -3, -12, -8, -11, -3, 0, 0],
  },
  sport: {
    body: [0, 2, 5, -3, 1, 4, -2, 0, 0], stretch: [0, -2, -4, 3, -1, -3, 2, 0, 0],
    head: [0, -2, 5, 1, -4, 4, -1, 0, 0],
    left: [0, 2, -9, -3, 2, -7, -2, 0, 0], right: [0, -6, 18, -4, -7, 15, -4, 0, 0],
    prop: [0, -7, 48, 0, -8, 38, 1, 0, 0],
  },
  level: {
    body: [0, 2, -5, -3, -1, -4, 1, 0, 0], stretch: [0, -3, 3, 2, 0, 2, -2, 0, 0],
    head: [0, 3, -4, -6, 4, -2, 2, 0, 0],
    left: [0, -4, 22, 15, 11, 19, -4, 0, 0], right: [0, 3, -13, -23, -12, -19, 5, 0, 0], prop: still,
  },
  results: {
    body: [0, 6, -23, -12, 5, -13, 2, 0, 0], stretch: [0, -5, 5, 2, -5, 3, -2, 0, 0],
    head: [0, 3, -4, -8, 6, -5, 3, 0, 0],
    left: [0, -7, 18, 23, -5, 15, 4, 0, 0], right: [0, 6, -22, -15, 5, -16, -2, 0, 0],
    prop: [0, 0, -9, -16, -6, -11, -4, 0, 0],
  },
  retry: {
    body: [0, 1, 2, 1, 2, 1, 0, 0, 0], stretch: [0, -1, -2, -1, -2, -1, 0, 0, 0],
    head: [0, 2, -8, 7, -5, 2, -1, 0, 0],
    left: still, right: still, prop: still,
  },
};

const motionTracks = Object.fromEntries(Object.entries(gestures).map(([pose, gesture]) => [pose, {
  body: smoothTrack(gesture.body),
  stretch: smoothTrack(gesture.stretch).map(value => 1 + value / 100),
  head: smoothTrack(gesture.head).map(value => `${value}deg`),
  left: smoothTrack(gesture.left).map(value => `${value}deg`),
  right: smoothTrack(gesture.right).map(value => `${value}deg`),
  prop: smoothTrack(gesture.prop),
}]));

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
      duration: cue === 'start' ? 1550 : reaction === 'retry' ? 2200 : cue === 'sport' ? 2500 : 3100,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [cue, progress, reaction, reduceMotion, foreground]);

  const art = mascotArt[cue];
  const motion = motionTracks[reaction === 'retry' ? 'retry' : cue];
  const interpolate = <T extends number | string,>(outputRange: T[]) => progress.interpolate({ inputRange: frames, outputRange });
  const translate = (values: number[]) => interpolate(values.map(value => value * size / 320));

  return (
    <View
      aria-hidden={true}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.stage, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, {
        transformOrigin: '50% 91%',
        transform: [{ translateY: translate(motion.body) }, { scaleY: interpolate(motion.stretch) }],
      }]}>
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: '36% 57%', transform: [{ rotate: interpolate(motion.left) }],
        }]}>
          <Image source={art.left} style={styles.image} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: '63% 57%', transform: [{ rotate: interpolate(motion.right) }],
        }]}>
          <Image source={art.right} style={styles.image} contentFit="contain" />
        </Animated.View>
        <Image source={art.body} style={styles.image} contentFit="contain" />
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: '50% 55%',
          transform: [{ rotate: interpolate(motion.head) }],
        }]}>
          <Image source={art.face} style={styles.image} contentFit="contain" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, {
        transform: [{ translateY: translate(motion.prop) }],
      }]}>
        <Image source={art.prop} style={styles.image} contentFit="contain" />
      </Animated.View>
      {cue === 'start' && spinSeams.map(({ scaleX, opacity }, index) => (
        <Animated.View key={index} style={[StyleSheet.absoluteFill, {
          opacity: progress.interpolate({ inputRange: spinFrames, outputRange: opacity }),
          transformOrigin: [size * spinBallCenter.x / 320, size * spinBallCenter.y / 320, 0],
          transform: [{ scaleX: progress.interpolate({ inputRange: spinFrames, outputRange: scaleX }) }],
        }]}>
          <Image source={spinBallSeam} style={styles.image} contentFit="contain" />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignSelf: 'center', marginBottom: 14 },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
