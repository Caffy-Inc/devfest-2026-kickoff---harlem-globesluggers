/**
 * Server-only helpers for the in-app voice API routes (src/app/api/voice/*).
 * These run in Expo's server runtime (`npx expo start` in dev, EAS Hosting in
 * production), never in the app bundle, so ELEVENLABS_API_KEY stays private.
 *
 * Only clone voices of people who have agreed to it (e.g. your own team).
 */

const XI = 'https://api.elevenlabs.io/v1';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 5;
export const MAX_TEXT_CHARS = 1500;
const AUDIO_EXT = /\.(mp3|m4a|mp4|aac|wav|webm|ogg)$/i;

export function xiKey(): string {
  return process.env.ELEVENLABS_API_KEY ?? '';
}

export function modelId(): string {
  return process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
}

export function textError(status: number, message: string): Response {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/** Optional shared secret (VOICE_API_KEY). Accepts a Bearer header or ?key=. */
export function authorized(request: Request): boolean {
  const expected = process.env.VOICE_API_KEY;
  if (!expected) return true;
  const header = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const query = new URL(request.url).searchParams.get('key') ?? '';
  return header === expected || query === expected;
}

export function isAudio(file: Blob & { name?: string }): boolean {
  return file.type.startsWith('audio/') || AUDIO_EXT.test(file.name ?? '');
}

export async function xiErrorMessage(res: Response): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const j = JSON.parse(body);
    const d = j?.detail;
    const msg = d?.message ?? d?.status ?? d ?? j?.message;
    if (msg) return `ElevenLabs: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`;
  } catch {}
  return `ElevenLabs: ${body || res.statusText || res.status}`;
}

export const XI_BASE = XI;

// ─── Shared ElevenLabs calls ────────────────────────────────────────────────

export type NamedAudio = Blob & { name: string };

export class VoiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Create an Instant Voice Clone. Returns the new voice id. */
export async function cloneOnElevenLabs(files: NamedAudio[], label: string, coachId: string): Promise<string> {
  const key = xiKey();
  if (!key) throw new VoiceError(500, 'ELEVENLABS_API_KEY is missing. Add it to athleet/.env and restart Expo.');
  const out = new FormData() as unknown as {
    append(name: string, value: string | Blob, fileName?: string): void;
  };
  out.append('name', label.slice(0, 100));
  out.append('description', `Athleet coach voice (${coachId})`);
  out.append('remove_background_noise', 'true');
  for (const f of files) out.append('files', f, f.name || 'sample.mp3');

  const xi = await fetch(`${XI}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': key },
    body: out as unknown as BodyInit,
  });
  if (!xi.ok) throw new VoiceError(xi.status === 401 ? 502 : xi.status, await xiErrorMessage(xi));
  const data = (await xi.json()) as { voice_id?: string };
  if (!data.voice_id) throw new VoiceError(502, 'ElevenLabs did not return a voice id.');
  return data.voice_id;
}

/** Best-effort delete of a voice we created (frees a voice slot). */
export async function deleteOnElevenLabs(voiceId: string): Promise<void> {
  const key = xiKey();
  if (!key || !voiceId) return;
  try {
    await fetch(`${XI}/voices/${encodeURIComponent(voiceId)}`, { method: 'DELETE', headers: { 'xi-api-key': key } });
  } catch {}
}
