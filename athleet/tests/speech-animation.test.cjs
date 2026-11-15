const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../src/lib/speech-animation.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { speechWords, sampleSpeech, emptySpeechAnimation } = context.exports;
const speaking = text => ({ ...emptySpeechAnimation(), words: speechWords(text), active: true, startedAt: 1000 });

test('mouth remains shut before start and immediately after stop', () => {
  assert.equal(sampleSpeech(emptySpeechAnimation(), 1200).open, 0);
  const state = speaking('aaaa');
  assert.ok(sampleSpeech(state, 1100).open > 0);
  state.active = false;
  assert.equal(sampleSpeech(state, 1100).open, 0);
});
test('word boundaries override estimated timing and settle during pauses', () => {
  const state = speaking('mmmm aaaa');
  assert.equal(sampleSpeech(state, 1100).open, 0);
  state.wordIndex = 1; state.boundaryAt = 4000;
  assert.ok(sampleSpeech(state, 4100).open > .5);
  assert.equal(sampleSpeech(state, 4400).open, 0);
});
test('rounded vowels differ from wide vowels and closed consonants', () => {
  const round = sampleSpeech(speaking('oooo'), 1100);
  const wide = sampleSpeech(speaking('eeee'), 1100);
  assert.ok(round.width < wide.width);
  assert.equal(sampleSpeech(speaking('bbbb'), 1100).open, 0);
});
test('punctuation creates silence and questions lift eyebrows', () => {
  const state = speaking('Ready? Go!');
  assert.equal(state.words[1].index, 7);
  assert.ok(sampleSpeech(state, 1100).brow > 0);
  assert.equal(sampleSpeech(state, 1000 + state.words[0].duration + 80).open, 0);
});
