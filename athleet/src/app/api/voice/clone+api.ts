/**
 * POST /api/voice/clone
 *   multipart/form-data: files (1–5 audio files), coachId, label, consent=true
 *   → { voiceId, coachId, voice } — saved as the coach's shared voice for all users.
 *
 * DELETE /api/voice/clone?coachId=…  → removes the coach's shared voice.
 */
import { authorized, cloneOnElevenLabs, isAudio, MAX_FILE_BYTES, MAX_FILES, textError, VoiceError } from '@/server/elevenlabs';
import { COACH_ID, removeSharedVoice, setUploadedVoice } from '@/server/voice-registry';

// React Native's global FormData typings don't describe the server runtime's
// FormData, so describe the bits we use.
type UploadFile = Blob & { name: string };
type ServerForm = { get(name: string): unknown; getAll(name: string): unknown[] };
const isFile = (v: unknown): v is UploadFile =>
  typeof v === 'object' && v !== null && typeof (v as Blob).arrayBuffer === 'function';

export async function POST(request: Request) {
  if (!authorized(request)) return textError(401, 'Unauthorized');

  let form: ServerForm;
  try {
    form = (await request.formData()) as unknown as ServerForm;
  } catch {
    return textError(400, 'Expected a multipart upload.');
  }

  if (String(form.get('consent')) !== 'true') {
    return textError(400, 'Consent is required: confirm the speaker in these recordings agreed to have their voice cloned.');
  }
  const coachId = String(form.get('coachId') ?? '');
  if (!COACH_ID.test(coachId)) return textError(400, 'Invalid coachId.');

  const files = form.getAll('files').filter(isFile);
  if (!files.length) return textError(400, 'Upload at least one audio file.');
  if (files.length > MAX_FILES) return textError(400, `Upload at most ${MAX_FILES} files.`);
  for (const f of files) {
    if (!isAudio(f)) return textError(400, `Not an audio file: ${f.name}`);
    if (f.size > MAX_FILE_BYTES) return textError(400, `${f.name} is over 10 MB.`);
  }

  const label = String(form.get('label') ?? coachId);
  try {
    const voiceId = await cloneOnElevenLabs(files, label, coachId);
    const voice = await setUploadedVoice(coachId, { voiceId, sampleNames: files.map((f) => f.name), label });
    return Response.json({ voiceId, coachId, voice });
  } catch (err: any) {
    return textError(err instanceof VoiceError ? err.status : 500, err?.message ?? 'Voice creation failed.');
  }
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return textError(401, 'Unauthorized');
  const coachId = new URL(request.url).searchParams.get('coachId') ?? '';
  if (!COACH_ID.test(coachId)) return textError(400, 'Invalid coachId.');
  try {
    return Response.json({ removed: await removeSharedVoice(coachId) });
  } catch (err: any) {
    return textError(500, err?.message ?? 'Could not remove voice.');
  }
}
