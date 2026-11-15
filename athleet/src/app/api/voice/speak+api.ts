/**
 * GET /api/voice/speak?voiceId=…&text=…&speed=1.0[&key=…]
 * → audio/mpeg, streamed. GET so the app's audio player can load it by URL.
 *
 * GET /api/voice/speak?health=1 → { ok, elevenlabs }
 */
import {
  authorized,
  MAX_TEXT_CHARS,
  modelId,
  textError,
  XI_BASE,
  xiErrorMessage,
  xiKey,
} from '@/server/elevenlabs';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const key = xiKey();

  if (params.has('health')) return Response.json({ ok: true, elevenlabs: !!key });
  if (!authorized(request)) return textError(401, 'Unauthorized');
  if (!key) return textError(500, 'ELEVENLABS_API_KEY is missing. Add it to athleet/.env and restart Expo.');

  const voiceId = params.get('voiceId') ?? '';
  const text = (params.get('text') ?? '').slice(0, MAX_TEXT_CHARS);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(voiceId)) return textError(400, 'Invalid voiceId.');
  if (!text.trim()) return textError(400, 'text is required.');

  const speed = Number(params.get('speed'));
  const voice_settings = {
    stability: 0.45,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true,
    ...(Number.isFinite(speed) && speed > 0 ? { speed: Math.min(1.2, Math.max(0.7, speed)) } : {}),
  };

  const xi = await fetch(`${XI_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: modelId(), voice_settings }),
  });
  if (!xi.ok || !xi.body) return textError(xi.status === 401 ? 502 : xi.status || 502, await xiErrorMessage(xi));

  return new Response(xi.body, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=600' },
  });
}
