import type { ChatMessage, Coach, UserProfile, WeeklyPlan } from '@/lib/types';
import { generateAdaptedPlan } from './baseline-engine';

// Set EXPO_PUBLIC_API_URL in a .env file once the backend is deployed,
// e.g. EXPO_PUBLIC_API_URL=https://athleet-api.vercel.app
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? 'demo';

export interface GeneratePlanRequest {
  coachId: string;
  name?: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  goal: string;
  sport?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek?: number;
  sessionMinutes?: number;
  equipment?: 'full_gym' | 'home_dumbbells' | 'bodyweight' | 'court_or_track';
  injuries?: string;
}

export interface GeneratePlanResponse {
  title?: string;
  coachId: string;
  coachMessage?: string;
  why: string;
  days: {
    name: string;
    focus: string;
    warmUp?: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest: string;
      tempo?: string;
      load?: string;
      muscleGroups?: string[];
      supersetGroup?: string;
      notes?: string;
    }[];
    coolDown?: string;
    estimatedMinutes?: number;
    notes?: string;
  }[];
  nutrition: { summary: string; tips: string[] };
  recovery?: { summary: string; tips: string[] };
  restDays?: string[];
  notes?: string;
}

/**
 * Send chat message to coach (AI endpoint or interactive demo response)
 */
export async function sendChat(
  coach: Coach,
  profile: UserProfile | null,
  messages: ChatMessage[]
): Promise<string> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ coachId: coach.id, profile, messages }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.reply === 'string') return data.reply;
      }
    } catch {
      // fall through to demo reply
    }
  }
  return demoReply(coach, profile, messages);
}

/**
 * Call the workout generation API or serve tailored structured routine with user baseline adaptation.
 */
export async function generatePlan(
  request: GeneratePlanRequest,
  seed: number = 0
): Promise<GeneratePlanResponse> {
  if (API_URL) {
    try {
      const endpoint = `${API_URL}/api/generate-plan`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          ...request,
          experience: request.level,
          seed,
        }),
      });

      if (res.ok) {
        const raw = await res.json();
        return normalizePlanResponse(raw, request);
      }
    } catch (err) {
      console.warn('[api] Backend call failed, using athlete baseline engine:', err);
    }
  }

  // Artificial short delay so the user feels the generation happen on click
  await new Promise((r) => setTimeout(r, 600));

  // Run the baseline adaptation algorithm across all 7 coaches & user parameters
  return generateAdaptedPlan(request, seed);
}

function normalizePlanResponse(raw: any, req: GeneratePlanRequest): GeneratePlanResponse {
  const days = (raw.days || []).map((d: any, idx: number) => ({
    name: d.name || d.day || `Day ${idx + 1}`,
    focus: d.focus || 'Full Body & Core',
    warmUp: d.warmUp || '10 min dynamic mobility & activation',
    exercises: (d.exercises || []).map((e: any) => ({
      name: e.name,
      sets: typeof e.sets === 'number' ? e.sets : 3,
      reps: String(e.reps || '10-12'),
      rest: String(e.rest || '60s'),
      tempo: e.tempo,
      load: e.load,
      notes: e.notes,
    })),
    coolDown: d.coolDown || '5 min stretching & decompression',
    estimatedMinutes: d.estimatedMinutes || req.sessionMinutes || 45,
    notes: d.notes,
  }));

  const nutritionTips = Array.isArray(raw.nutritionTips)
    ? raw.nutritionTips
    : raw.nutrition?.tips || [
        'Hydrate with at least 3L of water daily.',
        'Prioritize 1.6-2.2g of protein per kg of bodyweight.',
      ];

  return {
    title: raw.title,
    coachId: req.coachId,
    coachMessage: raw.coachMessage,
    why: raw.why || 'Designed to build strength, joint resilience, and functional longevity.',
    days,
    nutrition: {
      summary: raw.nutrition?.summary || 'Fuel for high performance and rapid recovery.',
      tips: nutritionTips,
    },
    recovery: raw.recovery || {
      summary: '7-9 hours of restful sleep and mobility on off-days.',
      tips: ['Daily foam rolling', 'Deload when joint soreness lingers'],
    },
    restDays: raw.restDays,
    notes: raw.notes,
  };
}

/**
 * Placeholder replies so the chat works interactively during demos.
 */
async function demoReply(coach: Coach, profile: UserProfile | null, messages: ChatMessage[]) {
  await new Promise((r) => setTimeout(r, 700));
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? '';
  const first = coach.name.split(' ')[0];

  if (/plan|week|routine|program|workout/.test(last)) {
    const days = coach.signature.split;
    const staples = coach.signature.staples.slice(0, 3).join(', ');
    return `Here's how we structure your training: ${days}. Our bread and butter will be ${staples}. Tap 'View Workout Plan' above anytime to see your personalized routine!`;
  }
  if (/eat|food|diet|meal|protein|calorie/.test(last)) {
    return `Nutrition is key. Focus on lean protein at every meal, complex carbs for training fuel, and lots of water. ${coach.signature.recovery[0]}.`;
  }
  const level = profile?.level ? ` for a ${profile.level}` : '';
  return `Love that energy! As your ${first}-style coach${level}, my priority is ${coach.signature.methods[0]}. Ask me for your weekly plan or training advice!`;
}
