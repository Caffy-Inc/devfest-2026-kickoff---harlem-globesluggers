const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: name => load(path.resolve(path.dirname(file), `${name}.ts`)) };
  vm.runInNewContext(code, context);
  return context.exports;
}
const { coachPose, easeInOut } = load(path.resolve(__dirname, '../src/lib/lebron-motion.ts'));
const quiet = { open: 0, width: 1, emphasis: 0, smile: 0, brow: 0, round: 0 };
test('all five motion states loop continuously with finite transforms', () => {
  for (const state of ['idle', 'thinking', 'talking', 'exercise', 'celebrate']) {
    for (let t = 0; t < 10; t += .02) assert.ok(Object.values(coachPose(t, state, false, quiet)).every(Number.isFinite));
    const before = coachPose(3.1 - .00001, state, false, quiet);
    const after = coachPose(3.1, state, false, quiet);
    for (const key of ['body', 'head', 'left', 'right', 'knee']) assert.ok(Math.abs(before[key] - after[key]) < .01, `${state} ${key}`);
  }
});
test('squat lowers the body and lifts both arms', () => {
  const pose = coachPose(3.1 * .49, 'exercise', false, quiet);
  assert.ok(pose.body > 20 && pose.knee > 50);
  assert.ok(pose.left > 60 && pose.right < -60);
});
test('speech mouth and brow shapes stop when talking ends', () => {
  const speech = { ...quiet, open: .85, width: .65, brow: .8, emphasis: 1 };
  const pose = coachPose(1, 'talking', false, speech);
  assert.ok(pose.mouth > .8 && pose.brow < 0);
  assert.equal(pose.width, .65);
  assert.equal(coachPose(1, 'idle', false, speech).mouth, .14);
});
test('reduced motion holds body poses while retaining speech feedback', () => {
  for (const state of ['idle', 'thinking', 'exercise', 'celebrate']) assert.deepEqual(coachPose(0, state, true, quiet), coachPose(2.8, state, true, quiet));
  assert.ok(coachPose(1, 'talking', true, { ...quiet, open: 1 }).mouth > .9);
});
test('transitions ease to rest at both endpoints', () => {
  assert.equal(easeInOut(0), 0); assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(.5), .5);
  assert.ok(easeInOut(.01) < .001 && 1 - easeInOut(.99) < .001);
});
