export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Sex = 'male' | 'female' | 'other';
export type Goal =
  | 'lose_fat' | 'cut' | 'build_muscle' | 'bulk'
  | 'get_stronger' | 'sport_performance' | 'general_fitness';
export type Equipment = 'full_gym' | 'home_dumbbells' | 'bodyweight' | 'court_or_track';

export type UserProfile = {
  name?: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  sport: string;
  level: Level;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment;
  injuries: string;
};

export type Coach = {
  id: string;
  name: string;
  sport: string;
  category: string;
  trainingTypes: string[];
  goals: string[];
  levels: string[];
  ageFit: number[];
  intensity: number;
  tagline: string;
  bio: string;
  bestFor: string[];
  signature: { split: string; staples: string[]; methods: string[]; recovery: string[] };
  avatar: string;
};

export type PlanExercise = { name: string; sets: number; reps: string; rest: string; notes?: string };
export type WeeklyPlan = {
  why: string;
  days: { name: string; focus: string; exercises: PlanExercise[] }[];
  nutrition: { summary: string; tips: string[] };
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
