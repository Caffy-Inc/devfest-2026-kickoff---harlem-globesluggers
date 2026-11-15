// Coach hype lines for the workout logger.
// A few are each athlete's well-known public catchphrases; the rest are written in their style.

export type HypeLines = {
  setStart: string[]; // shown when a new set begins
  rest: string[];     // shown when a rest period starts
  finish: string[];   // shown when the workout is done
};

export const HYPE: Record<string, HypeLines> = {
  ronnie: {
    setStart: [
      'Yeah buddy!',
      'Light weight, baby!',
      "Ain't nothin' but a peanut!",
      'Everybody wanna be big. Nobody wanna lift heavy. You do. Go!',
      "Yeah buddy! Let's get this rep train rolling!",
      'Light weight! Light weight! Push it!',
    ],
    rest: ['Breathe, baby. Next set we go heavier.', 'Yeah buddy, catch your breath. We ain\'t done!'],
    finish: ['YEAH BUDDY! That\'s how you build it!', 'Light weight, baby! See you next session!'],
  },
  lebron: {
    setStart: [
      'Strive for greatness. This set, right now.',
      "Lock in. We're playing the long game.",
      'Every rep is an investment in year 20.',
      "Stay locked in. Let's work!",
      'Greatness is a habit. Build it.',
    ],
    rest: ['Recover like a pro. Breathe, hydrate.', 'Rest is part of the work. Reset.'],
    finish: ['That\'s a championship day. Strive for greatness!', 'Long game. You just won today.'],
  },
  bolt: {
    setStart: [
      'To di world! ⚡',
      "Relax and be fast. Let's go!",
      "Quality reps, mon. Make 'em sharp!",
      'Easy breezy, then explode!',
      'Lightning time ⚡ Go!',
    ],
    rest: ['Full rest, no rushing. Fast needs fresh legs.', 'Chill a bit. Stay loose.'],
    finish: ['To di world! ⚡ Great session!', 'Fast day! Now go eat something good.'],
  },
  ronaldo: {
    setStart: [
      'Siuuu! Let\'s go!',
      'Discipline. Every set. Every day.',
      'Hard work beats talent. Show me.',
      'Focus. Make this one perfect.',
      'Siuuu! Again!',
    ],
    rest: ['Breathe. Control. Next set even better.', 'Recovery is training too. Stay focused.'],
    finish: ['SIUUU! Workout complete!', 'That\'s discipline. Same time tomorrow.'],
  },
  serena: {
    setStart: [
      'Champion mindset. This set is yours.',
      "Power you can repeat. Let's go!",
      'Strong legs, strong game. Drive it!',
      "Don't hold back. Own it.",
      'Every point, every rep. Come on!',
    ],
    rest: ['Reset like between points. Breathe.', 'Shake it out. Stay ready.'],
    finish: ['Game, set, match. Great work!', 'That\'s a champion\'s session.'],
  },
  callina: {
    setStart: [
      "Strong legs, strong kicks. Let's go!",
      'I used to skip leg day too. Not anymore!',
      'Drive through the floor!',
      "Level up! You've got this.",
      'One more set, then we kick.',
    ],
    rest: ['Shake out those legs. Stay loose.', 'Quick breather, then back to it!'],
    finish: ['Legs of steel! Great session!', 'GG! That workout is cleared.'],
  },
  patty: {
    setStart: [
      "Simple. Hard. Let's go!",
      'Close to failure. You can do one more.',
      "Don't overthink it. Just lift.",
      'Consistency wins. This set counts.',
      "Let's get it!",
    ],
    rest: ['Breathe, sip water, back at it.', 'Rest up, but not too long!'],
    finish: ['Done! Consistency over perfection!', 'Another one in the bank. Proud of you!'],
  },
};

const FALLBACK: HypeLines = {
  setStart: ["Let's go!", 'You got this!', 'Strong set!'],
  rest: ['Breathe and recover.'],
  finish: ['Great workout!'],
};

/** Picks a line, cycling so it doesn't repeat back-to-back. */
export function hypeLine(coachId: string, kind: keyof HypeLines, n: number): string {
  const lines = (HYPE[coachId] ?? FALLBACK)[kind];
  return lines[n % lines.length];
}
