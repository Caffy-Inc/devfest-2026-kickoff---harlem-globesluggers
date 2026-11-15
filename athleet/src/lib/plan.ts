import { PROGRAMS, type DayTemplate, type ExerciseKind, type TemplateExercise } from '@/data/workouts';
import { computeTargets } from '@/lib/nutrition';
import type { Coach, Goal, Level, PlanDay, PlanExercise, UserProfile, WeeklyPlan } from '@/lib/types';

// Builds a weekly plan from the coach's themed days, scaled to the user.
// Same coach = same style for everyone; the dosage changes with age, level, goal and body size.

const WEEKDAYS: Record<number, string[]> = {
  1: ['Wednesday'],
  2: ['Monday', 'Thursday'],
  3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  5: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  7: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

export const MIN_DAYS = 1;
export const MAX_DAYS = 7;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 300;

const RECOVERY_DAY: DayTemplate = {
  focus: 'Active recovery (keep it light)',
  exercises: [
    { name: 'Easy walk or bike', kind: 'conditioning', reps: '20-30 min easy' },
    { name: 'Mobility flow', kind: 'mobility', reps: '15 min' },
    { name: 'Foam rolling', kind: 'mobility', reps: '10 min' },
  ],
};

export type PlanWarning = { tone: 'low' | 'high'; title: string; text: string };

const GOAL_WORDS: Record<Goal, string> = {
  lose_fat: 'losing weight',
  cut: 'getting lean',
  build_muscle: 'building muscle',
  bulk: 'gaining weight',
  get_stronger: 'getting stronger',
  sport_performance: 'improving at your sport',
  general_fitness: 'getting fit',
};

/** Warnings when days or session length won't reach the goal, or risk too little recovery. */
export function planWarnings(p: Pick<UserProfile, 'age' | 'level' | 'goal' | 'daysPerWeek' | 'sessionMinutes'>): PlanWarning[] {
  const out: PlanWarning[] = [];
  const days = p.daysPerWeek;
  const mins = p.sessionMinutes;
  const goal = GOAL_WORDS[p.goal];
  const weekly = days * mins;
  const needsMore = p.goal !== 'general_fitness';

  if (days === 1) {
    out.push({ tone: 'low', title: 'Only 1 day a week', text: `One session keeps you moving, but it's not enough for real progress at ${goal}. Aim for at least 3 days.` });
  } else if (days === 2 && needsMore) {
    out.push({ tone: 'low', title: '2 days is a start', text: `You'll see progress, but 3+ days gets noticeably faster results for ${goal}.` });
  }
  if (days === 7) {
    out.push({ tone: 'high', title: 'No rest days', text: 'Your body gets stronger while it recovers. Take at least 1 full rest day; we kept day 7 light.' });
  } else if (days >= 6 && (p.level === 'beginner' || p.age >= 50 || p.age < 16)) {
    out.push({ tone: 'high', title: `${days} days is a lot`, text: `For your ${p.age < 16 ? 'age' : p.age >= 50 ? 'age' : 'experience'}, ${recommendedDays(p.level, p.age)} days with more rest will usually get better results and fewer injuries.` });
  }

  if (mins < 20) {
    out.push({ tone: 'low', title: `${mins} min is very short`, text: 'There is only time for a quick warm-up and 1-2 exercises. Try 30+ minutes for a full session.' });
  } else if (mins < 30 && (p.goal === 'build_muscle' || p.goal === 'bulk' || p.goal === 'get_stronger')) {
    out.push({ tone: 'low', title: 'Short sessions', text: `We cut extra exercises to fit ${mins} minutes. 45-60 minutes works better for ${goal}.` });
  }
  if (mins > 120) {
    out.push({ tone: 'high', title: `${mins} min per session`, text: 'Past 2 hours, focus drops and injury and burnout risk climb. 60-90 minutes of hard work is plenty; rest instead.' });
  } else if (mins > 90 && (p.level === 'beginner' || p.age >= 50)) {
    out.push({ tone: 'high', title: 'Long sessions', text: `For ${p.level === 'beginner' ? 'beginners' : 'your age'}, 45-75 minutes recovers better than ${mins}. Quality beats quantity.` });
  }

  if (weekly < 90 && mins >= 20 && days > 1) {
    out.push({ tone: 'low', title: `${weekly} min a week total`, text: `That's under the ~150 minutes a week that most goals need. Add a day or lengthen sessions for ${goal}.` });
  } else if (weekly > 600 && p.level !== 'advanced') {
    out.push({ tone: 'high', title: `${Math.round(weekly / 60)}+ hours a week`, text: 'That much training needs serious recovery. Prioritize sleep, food and at least 1-2 easy days.' });
  }
  return out;
}
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Sensible training days per week from experience and age. */
export function recommendedDays(level: Level, age: number): number {
  let days = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
  if (age >= 60) days = Math.min(days, 3);
  else if (age >= 45) days = Math.min(days, 4);
  if (age < 16) days = Math.min(days, 4);
  return days;
}

type Context = {
  level: Level;
  goal: Goal;
  age: number;
  minor: boolean;
  useEasier: boolean;
  lowImpact: boolean;
  bmi: number;
};

function contextFor(p: UserProfile): Context {
  const bmi = p.weightKg / (p.heightCm / 100) ** 2;
  return {
    level: p.level,
    goal: p.goal,
    age: p.age,
    minor: p.age < 18,
    useEasier: p.level === 'beginner' || p.age < 16 || p.age >= 65,
    lowImpact: p.age >= 60 || bmi >= 32 || (p.age >= 50 && p.level === 'beginner'),
    bmi,
  };
}

const LEVEL_STEP: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const isMuscle = (g: Goal) => g === 'build_muscle' || g === 'bulk';
const isFatLoss = (g: Goal) => g === 'lose_fat' || g === 'cut';

function defaultReps(kind: ExerciseKind, c: Context): string {
  switch (kind) {
    case 'main':
      if (c.minor) return '8-10';
      if (c.goal === 'get_stronger') return c.level === 'beginner' ? '6-8' : '4-6';
      if (c.goal === 'sport_performance') return c.level === 'beginner' ? '6-8' : '4-6';
      if (isMuscle(c.goal)) return c.level === 'beginner' ? '8-10' : '6-10';
      if (isFatLoss(c.goal)) return '8-12';
      return '8-10';
    case 'accessory':
      if (isFatLoss(c.goal)) return '12-15';
      return '10-12';
    case 'power':
      return c.level === 'beginner' ? '5' : '3-5';
    case 'core':
      return '12-15';
    case 'sprint':
      return c.level === 'beginner' ? '4 x 20m' : '6 x 30m';
    case 'conditioning':
      if (isFatLoss(c.goal)) return '20 min';
      if (isMuscle(c.goal)) return '10 min easy';
      return '15 min';
    case 'skill':
      return '10 min';
    case 'mobility':
      return '10 min';
  }
}

function defaultSets(kind: ExerciseKind, c: Context): number {
  const step = LEVEL_STEP[c.level];
  let sets: number;
  switch (kind) {
    case 'main': sets = 3 + step; break;
    case 'accessory': sets = 2 + step; break;
    case 'power': sets = 3 + step; break;
    case 'core': sets = c.level === 'beginner' ? 2 : 3; break;
    default: return 1; // sprint / skill / conditioning / mobility carry their volume in "reps"
  }
  if (c.age >= 50) sets -= 1;
  if (c.age >= 40 && kind === 'power') sets -= 1;
  return Math.max(2, sets);
}

function restFor(kind: ExerciseKind, c: Context): string {
  switch (kind) {
    case 'main': return c.goal === 'get_stronger' || c.goal === 'sport_performance' ? '2-3 min' : '90s-2 min';
    case 'accessory': return isFatLoss(c.goal) ? '45-60s' : '60-90s';
    case 'power': return '90s';
    case 'sprint': return 'Full rest (1-2 min)';
    case 'core': return '45s';
    default: return '—';
  }
}

const KEEP_CUSTOM_WHEN_SWAPPED: ExerciseKind[] = ['core', 'skill', 'mobility'];

function buildExercise(t: TemplateExercise, c: Context): PlanExercise {
  const highImpact = t.kind === 'power' || t.kind === 'sprint' || !!t.lowImpact;
  let name = t.name;
  let swap: 'none' | 'lowImpact' | 'easier' = 'none';
  if (c.lowImpact && highImpact && t.lowImpact) {
    name = t.lowImpact;
    swap = 'lowImpact';
  } else if (c.useEasier && t.easier) {
    name = t.easier;
    swap = 'easier';
  }

  const custom = t.reps ? (typeof t.reps === 'string' ? t.reps : t.reps[c.level]) : undefined;
  let kind: ExerciseKind = t.kind;
  let reps: string;

  if (swap === 'none') {
    reps = custom ?? defaultReps(kind, c);
  } else if (swap === 'lowImpact') {
    // Prescribe the replacement on its own terms.
    if (/bike|rowing|row machine/i.test(name)) reps = c.level === 'beginner' ? '6 x 20s hard' : '8 x 30s hard';
    else if (/sled/i.test(name)) reps = c.level === 'beginner' ? '3 x 20m' : '4 x 20m';
    else if (/circuit|hiit|cardio/i.test(name)) reps = custom ?? defaultReps('conditioning', c);
    else {
      kind = 'accessory';
      reps = defaultReps(kind, c);
    }
  } else {
    reps = custom && KEEP_CUSTOM_WHEN_SWAPPED.includes(kind) ? custom : defaultReps(kind, c);
  }

  // "6 x 30m" style reps already include the number of sets.
  const setsInReps = /^\d+\s*x\s/.test(reps);

  const notes: string[] = [];
  if (t.notes && swap === 'none') notes.push(t.notes);
  if (kind === 'main' && c.minor) notes.push('Technique first, no max lifts');
  if (kind === 'main' && c.age >= 50) notes.push('Leave 2-3 reps in the tank');
  if (kind === 'main' && c.level === 'beginner' && !c.minor) notes.push('Pick a weight you could lift 2-3 more times');

  return {
    name,
    sets: setsInReps ? 1 : defaultSets(kind, c),
    reps,
    rest: restFor(kind, c),
    notes: notes.length ? notes.join('. ') : undefined,
  };
}

/** Removes repeats created by swaps (e.g. two "Sled push" in one day). */
function dedupe(exercises: PlanExercise[]): PlanExercise[] {
  const seen = new Set<string>();
  return exercises.filter((e) => {
    const key = e.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function estimateMinutes(exercises: PlanExercise[], base = 15): number {
  let mins = base; // warm-up + cooldown
  for (const e of exercises) {
    const timed = e.reps.match(/(\d+)\s*min/);
    const rounds = e.reps.match(/^(\d+)\s*x/);
    if (timed && !rounds) mins += Number(timed[1]);
    else if (rounds) mins += Number(rounds[1]) * 1.5;
    else mins += e.sets * 2.5;
  }
  return Math.round(mins / 5) * 5;
}

function whyText(coach: Coach, p: UserProfile, c: Context, days: number): string {
  const program = PROGRAMS[coach.id];
  const parts: string[] = [program.voice];
  const levelWord = p.level === 'beginner' ? 'a beginner' : p.level === 'intermediate' ? 'an intermediate lifter' : 'an advanced athlete';
  const suggested = recommendedDays(p.level, p.age);
  parts.push(`You're ${p.age} and ${levelWord}, training ${days} ${days === 1 ? 'day' : 'days'} a week for ${p.sessionMinutes || 60} minutes.`);
  if (days > suggested) parts.push("That's ambitious for your level, so listen to your body and take an extra rest day if you're sore.");
  else if (days < suggested) parts.push('Fewer days means every session counts, so show up for each one.');

  if (c.minor) parts.push("You're still growing: we focus on technique and skills, never max lifts.");
  else if (p.age >= 50) parts.push('Extra warm-up time, a bit less volume and more recovery keep your joints happy.');
  if (c.lowImpact) parts.push("I've swapped high-impact jumps and sprints for joint-friendly versions.");
  if (c.useEasier && !c.minor && p.age < 65) parts.push('Some lifts start with easier variations until your technique is solid.');

  if (isFatLoss(p.goal)) parts.push('For fat loss, we keep lifting and add conditioning finishers.');
  else if (isMuscle(p.goal)) parts.push('For muscle, we use moderate reps and progressive overload: add a little weight each week.');
  else if (p.goal === 'sport_performance') parts.push('For your sport, we focus on power, speed and skill work.');
  return parts.join(' ');
}

/** Short labels describing how the plan was adapted (shown as pills). */
export function adaptationsFor(profile: UserProfile): string[] {
  const c = contextFor(profile);
  const out: string[] = [];
  if (c.minor) out.push('Youth technique focus');
  if (profile.age >= 45 && profile.age < 60) out.push('40+ extra warm-up');
  if (profile.age >= 60) out.push('60+ joint care');
  if (c.lowImpact) out.push('Low-impact swaps');
  if (c.useEasier && !c.minor) out.push('Easier variations');
  if (isFatLoss(profile.goal)) out.push('Fat-loss finishers');
  if (isMuscle(profile.goal)) out.push('Hypertrophy volume');
  if (profile.goal === 'get_stronger') out.push('Strength focus');
  if (profile.goal === 'sport_performance') out.push('Sport-specific');
  out.push(`${profile.level[0].toUpperCase()}${profile.level.slice(1)} volume`);
  return out;
}

/** Deterministic reorder so "regenerate" gives a fresh-feeling variation. */
function rotate<T>(items: T[], by: number): T[] {
  if (!items.length) return items;
  const k = ((by % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/** Interleave exercises from several themed days into one full-body day. */
function mergeTemplates(templates: DayTemplate[]): DayTemplate {
  const exercises: TemplateExercise[] = [];
  const longest = Math.max(...templates.map((t) => t.exercises.length));
  for (let i = 0; i < longest; i++) {
    for (const t of templates) if (t.exercises[i]) exercises.push(t.exercises[i]);
  }
  return { focus: `Full body: ${templates.map((t) => t.focus.split(/[:(]/)[0].trim()).join(' + ')}`, exercises };
}

/** Day templates for 1-7 training days, keeping the coach's style. */
function dayTemplates(program: (typeof PROGRAMS)[string], days: number, sportPick: boolean, seed: number): DayTemplate[] {
  const pick = (n: 3 | 4 | 5 | 6) => rotate((sportPick && program.sportOrder?.[n]) || program.order[n], seed).map((k) => program.days[k]);
  if (days >= 3 && days <= 6) return pick(days as 3 | 4 | 5 | 6);
  if (days === 7) return [...pick(6), RECOVERY_DAY];
  const base = pick(3);
  if (days === 1) return [mergeTemplates(base)];
  return [mergeTemplates([base[0], base[2]]), mergeTemplates([base[1], base[2]])];
}

/** Minutes of warm-up + cooldown for a given session length. */
function warmupMinutes(minutes: number): number {
  return minutes < 30 ? 7 : 15;
}

/** Trim or extend a day so it fits the session length. */
function fitToTime(exercises: PlanExercise[], minutes: number): PlanExercise[] {
  const base = warmupMinutes(minutes);
  const est = (l: PlanExercise[]) => estimateMinutes(l, base);
  let list = [...exercises];
  while (list.length > 2 && est(list) > minutes) list = list.slice(0, -1);
  if (est(list) > minutes) {
    list = list.map((e) => (e.sets > 2 ? { ...e, sets: e.sets - 1 } : e));
  }
  if (minutes - est(list) >= 25) {
    list = list.map((e) => (e.sets >= 2 && e.sets < 5 ? { ...e, sets: e.sets + 1 } : e));
  }
  return list;
}

export function generatePlan(coach: Coach, profile: UserProfile, seed = 0): WeeklyPlan {
  const program = PROGRAMS[coach.id];
  if (!program) throw new Error(`No program for coach ${coach.id}`);

  const c = contextFor(profile);
  const days = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(profile.daysPerWeek || recommendedDays(profile.level, profile.age))));
  const minutes = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(profile.sessionMinutes || 60)));
  const playsThisSport = profile.goal === 'sport_performance' && profile.sport === coach.sport;
  const templates = dayTemplates(program, days, playsThisSport, seed);
  const weekdays = WEEKDAYS[days];

  const planDays: PlanDay[] = templates.map((template, i) => {
    const isRecovery = days === 7 && i === 6;
    const built = template.exercises.map((t) => buildExercise(t, c));
    // Keep the first (main) exercise first; vary the order of the rest on regenerate.
    let exercises = seed > 0 && built.length > 2 ? [built[0], ...rotate(built.slice(1), seed)] : built;

    // Fat-loss goals: add the coach's conditioning finisher to days without conditioning.
    const hasConditioning = template.exercises.some((t) => t.kind === 'conditioning' || t.kind === 'sprint');
    if (isFatLoss(profile.goal) && !hasConditioning && !isRecovery) {
      exercises.push(buildExercise(program.finisher, c));
    }
    exercises = isRecovery ? dedupe(exercises) : fitToTime(dedupe(exercises), minutes);

    let warmup = profile.age >= 45 ? `${program.warmup} (take an extra 5 min)` : program.warmup;
    if (minutes < 30) warmup = '5-min quick warm-up: easy cardio + a light set of your first exercise';
    return {
      name: weekdays[i],
      focus: template.focus,
      warmup,
      cooldown: minutes < 30 ? '2-3 min stretch' : program.cooldown,
      minutes: isRecovery ? 45 : estimateMinutes(exercises, warmupMinutes(minutes)),
      exercises,
    };
  });

  const targets = computeTargets({ ...profile, daysPerWeek: Math.max(1, days) });
  const summary = targets.showNumbers
    ? `Aim for about ${targets.calories} calories and ${targets.proteinG}g protein a day (${targets.carbsG}g carbs, ${targets.fatG}g fat). ${targets.note}`
    : targets.note;

  return {
    why: whyText(coach, profile, c, days),
    days: planDays,
    restDays: ALL_DAYS.filter((d) => !weekdays.includes(d)),
    warnings: planWarnings({ ...profile, daysPerWeek: days, sessionMinutes: minutes }),
    nutrition: { summary, tips: program.nutritionTips, targets },
  };
}
