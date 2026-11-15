/** Word timing comes from TTS boundaries; letter shapes approximate visemes, not phoneme alignment. */
export type SpeechWord = { text: string; index: number; start: number; duration: number; expression: 'warm' | 'question' | 'focused' };
export type SpeechAnimation = { words: SpeechWord[]; startedAt: number; boundaryAt: number; wordIndex: number; active: boolean };
export const emptySpeechAnimation = (): SpeechAnimation => ({ words: [], startedAt: 0, boundaryAt: 0, wordIndex: -1, active: false });

export function speechWords(text: string): SpeechWord[] {
  let start = 0;
  return Array.from(text.matchAll(/\S+/g), match => {
    const word = match[0];
    const duration = Math.max(170, Math.min(620, word.replace(/[^a-z]/gi, '').length * 57));
    const sentence = text.slice(match.index, text.indexOf('.', match.index) < 0 ? undefined : text.indexOf('.', match.index) + 1);
    const expression = /\?/.test(sentence) ? 'question' : /great|win|love|ready|let’s|let's|good|progress/i.test(word) ? 'warm' : 'focused';
    const result: SpeechWord = { text: word, index: match.index, start, duration, expression };
    start += duration + (/[.!?]$/.test(word) ? 260 : /[,;:]$/.test(word) ? 140 : 45);
    return result;
  });
}

export function sampleSpeech(animation: SpeechAnimation, now: number) {
  const rest = { open: 0, width: 1, round: 0, emphasis: 0, smile: 0, brow: 0 };
  if (!animation.active) return rest;
  const elapsed = now - animation.startedAt;
  const word = animation.wordIndex >= 0 ? animation.words[animation.wordIndex] : animation.words.find(w => elapsed >= w.start && elapsed < w.start + w.duration);
  if (!word) return rest;
  const local = animation.wordIndex >= 0 ? now - animation.boundaryAt : elapsed - word.start;
  if (local < 0 || local >= word.duration) return rest;
  const letters = word.text.toLowerCase().replace(/[^a-z]/g, '');
  const progress = local / word.duration;
  const letter = letters[Math.min(letters.length - 1, Math.floor(progress * letters.length))] ?? '';
  const envelope = Math.min(1, local / 45, (word.duration - local) / 65);
  const closed = /[bmp]/.test(letter);
  const round = /[ouwq]/.test(letter) ? 1 : 0;
  return {
    open: (closed ? 0 : /[ae]/.test(letter) ? .85 : round ? .65 : .3) * envelope,
    width: closed ? 1 : /[ei]/.test(letter) ? 1.25 : round ? .65 : 1.05,
    round, emphasis: Math.sin(progress * Math.PI) * envelope,
    smile: word.expression === 'warm' ? .8 : .1,
    brow: word.expression === 'question' ? .8 : word.expression === 'warm' ? .35 : -.1,
  };
}
