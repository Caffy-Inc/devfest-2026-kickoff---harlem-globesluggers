/**
 * GET /api/voice/coaches
 * Clones any new/changed audio in athleet/voices/<coachId>/, then returns every
 * coach's shared voice: { voices: { [coachId]: SharedVoice }, problems: [...] }
 */
import { authorized, textError } from '@/server/elevenlabs';
import { syncVoiceFolders } from '@/server/voice-registry';

export async function GET(request: Request) {
  if (!authorized(request)) return textError(401, 'Unauthorized');
  try {
    return Response.json(await syncVoiceFolders());
  } catch (err: any) {
    return textError(500, err?.message ?? 'Could not load voices.');
  }
}
