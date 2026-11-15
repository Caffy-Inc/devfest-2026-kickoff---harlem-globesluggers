import type { Coach, Goal, Level } from '@/lib/types';

export type MatchInput = { age: number; goal: Goal; sport: string; level: Level };
export type Match = { coach: Coach; score: number; fitsAge: boolean; reasons: string[] };

// Simple, explainable scoring. Highest score = recommended coach.
export function rankCoaches(input: MatchInput, coaches: Coach[]): Match[] {
  return coaches
    .map((coach) => {
      let score = 0;
      const reasons: string[] = [];

      // Training for a sport always gets that sport's athlete, at any age.
      // The plan itself is made easier for young or older athletes.
      const sportMatch = input.goal === 'sport_performance' && coach.sport === input.sport;
      const inAgeRange = input.age >= coach.ageFit[0] && input.age <= coach.ageFit[1];
      const fitsAge = inAgeRange || sportMatch;
      if (inAgeRange) score += 2;
      else if (!sportMatch) score -= 5;

      if (sportMatch) {
        score += 100;
        reasons.push(`${coach.category} specialist`);
        if (!inAgeRange) reasons.push(input.age < coach.ageFit[0] ? 'adapted for young athletes' : 'adapted for your age');
      } else if (input.goal !== 'sport_performance' && coach.goals.includes(input.goal)) {
        score += 4;
        reasons.push(GOAL_REASON[input.goal]);
      }

      // Bonus when the coach's main training style fits the goal.
      const style = GOAL_STYLE[input.goal];
      if (style) {
        if (coach.trainingTypes[0] === style) score += 2;
        else if (coach.trainingTypes.includes(style)) score += 1;
      }

      if (coach.levels.includes(input.level)) score += 1;
      if (input.level === 'beginner' && coach.intensity <= 4) score += 1;
      if (input.age >= 40 && coach.bestFor.some((b) => /older|longevity|joint/.test(b))) {
        score += 2;
        reasons.push('great for longevity');
      }

      return { coach, score, fitsAge, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

const GOAL_STYLE: Partial<Record<Goal, string>> = {
  build_muscle: 'hypertrophy',
  bulk: 'hypertrophy',
  lose_fat: 'conditioning',
  cut: 'conditioning',
  get_stronger: 'strength',
};

const GOAL_REASON: Record<Goal, string> = {
  build_muscle: 'built for gaining muscle',
  bulk: 'built for gaining weight',
  lose_fat: 'built for losing weight',
  cut: 'built for getting lean',
  get_stronger: 'built for strength',
  sport_performance: 'sport-specific training',
  general_fitness: 'well-rounded fitness',
};
