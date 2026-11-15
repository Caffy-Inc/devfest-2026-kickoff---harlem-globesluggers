import type { ComponentProps } from 'react';
import { AnimatedCoach } from './animated-coach';
import { COACHES } from '@/data/coaches';

export function LeBronCoach(props: Omit<ComponentProps<typeof AnimatedCoach>, 'coach'>) {
  return <AnimatedCoach {...props} coach={COACHES[0]} />;
}
