import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { coachPortraits } from './coach-art';
import { AVATAR_IMAGES } from '@/data/avatars';
import type { Coach } from '@/lib/types';

export function CoachAvatar({ coach, size = 64 }: { coach: Coach; size?: number }) {
  const image = coachPortraits[coach.id] ?? AVATAR_IMAGES[coach.id];
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (image) {
    return <Image source={image} style={box} contentFit="cover" />;
  }
  return (
    <View style={[styles.circle, box, { backgroundColor: coach.color }]}>
      <Text style={{ fontSize: size * 0.48 }}>{coach.icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
});
