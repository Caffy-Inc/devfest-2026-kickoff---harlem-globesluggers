import type { ChatMessage, Coach, UserProfile } from '@/lib/types';

// Set EXPO_PUBLIC_API_URL in a .env file once the backend is deployed,
// e.g. EXPO_PUBLIC_API_URL=https://athleet-api.vercel.app
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function sendChat(
  coach: Coach,
  profile: UserProfile | null,
  messages: ChatMessage[]
): Promise<string> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

// Placeholder replies so the chat works before the AI backend exists.
async function demoReply(coach: Coach, profile: UserProfile | null, messages: ChatMessage[]) {
  await new Promise((r) => setTimeout(r, 900));
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? '';
  const first = coach.name.split(' ')[0];

  if (/plan|week|routine|program|workout/.test(last)) {
    const days = coach.signature.split;
    const staples = coach.signature.staples.slice(0, 3).join(', ');
    return `Here's how we'll structure it: ${days}. Expect staples like ${staples}. Full personalized plans unlock once the AI coach is connected.`;
  }
  if (/eat|food|diet|meal|protein|calorie/.test(last)) {
    return `Food matters as much as training. Protein at every meal, plenty of fruit and veg, and water all day. ${coach.signature.recovery[0]}.`;
  }
  const level = profile?.level ? ` for a ${profile.level}` : '';
  return `Love that energy. As your ${first}-style coach${level}, I'd focus on ${coach.signature.methods[0]}. Ask me for your weekly plan or what to eat.`;
}
