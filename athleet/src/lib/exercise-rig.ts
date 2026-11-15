export type Point = { x: number; y: number };
export type Limb = [Point, Point, Point];
export type ExerciseRig = { hip: Point; shoulder: Point; arms: [Limb, Limb]; legs: [Limb, Limb]; cue: string; equipment: 'mat' | 'bench' | 'weights' | 'bar' | 'none' };
const point = (x: number, y: number): Point => ({ x, y });
const polar = (p: Point, length: number, degrees: number) => point(p.x + length * Math.cos(degrees * Math.PI / 180), p.y + length * Math.sin(degrees * Math.PI / 180));
const limb = (root: Point, a: number, b: number, length = 34): Limb => { const joint = polar(root, length, a); return [root, joint, polar(joint, length, b)]; };
/** Solve a two-bone chain with fixed segment lengths and a planted hand/foot. */
function reach(root: Point, target: Point, length: number, bend = 1): Limb {
  const dx = target.x - root.x, dy = target.y - root.y;
  const distance = Math.min(length * 2, Math.max(.001, Math.hypot(dx, dy)));
  const direction = Math.atan2(dy, dx);
  const angle = direction + bend * Math.acos(distance / (2 * length));
  return [root, point(root.x + length * Math.cos(angle), root.y + length * Math.sin(angle)), Math.hypot(dx, dy) <= length * 2 + .00001 ? target : point(root.x + distance * Math.cos(direction), root.y + distance * Math.sin(direction))];
}
const recipes = [
  [/^v[- ]?up/i, 'vup'], [/dead bug/i, 'deadbug'], [/bird dog/i, 'birddog'],
  [/bicycle crunch/i, 'bicycle'], [/reverse crunch|rolling knee tuck/i, 'reverse'],
  [/hanging leg raise/i, 'hanging'], [/lying leg raise|leg raise \+ side sweeps/i, 'legraise'],
  [/pilates hundred/i, 'hundred'], [/side plank/i, 'sideplank'], [/plank row/i, 'plankrow'],
  [/push-up/i, 'pushup'], [/plank|pillar hold/i, 'plank'], [/ab rollout/i, 'rollout'],
  [/hip thrust/i, 'bridge'], [/cable crunch/i, 'crunch'], [/russian twist/i, 'twist'],
  [/lying leg curl/i, 'legcurl'], [/leg extension/i, 'legextension'],
  [/leg press/i, 'legpress'], [/hip abduction/i, 'abduction'],
  [/single-leg romanian/i, 'singlehinge'], [/deadlift|good morning/i, 'hinge'],
  [/lateral lunge|cossack/i, 'sidelunge'], [/split squat|lunge/i, 'lunge'], [/step-up/i, 'step'],
  [/squat/i, 'squat'], [/calf raise/i, 'calf'],
  [/incline .*press/i, 'inclinepress'], [/bench press/i, 'benchpress'],
  [/shoulder press/i, 'overhead'], [/pull-up/i, 'pullup'], [/lat pulldown/i, 'pulldown'],
  [/inverted row/i, 'invertedrow'], [/seated cable row|rowing/i, 'seatedrow'], [/row/i, 'row'],
  [/overhead triceps/i, 'extension'], [/triceps pushdown/i, 'pushdown'], [/dips/i, 'dip'],
  [/curl/i, 'curl'], [/rear delt fly/i, 'rearfly'], [/fly/i, 'fly'], [/lateral raise/i, 'raise'],
  [/kettlebell swing/i, 'swing'], [/front kick/i, 'kick'], [/cable knee drive/i, 'kneedrive'],
  [/bike|spin/i, 'bike'], [/sprints|tempo runs|treadmill walk/i, 'run'],
] as const;
export function exerciseRecipe(name: string): string | null {
  // A circuit or skill sequence cannot truthfully be represented by one unrelated rep.
  if (/circuit|hiit|combo|finisher/i.test(name)) return null;
  return recipes.find(([pattern]) => pattern.test(name))?.[1] ?? null;
}

export function exerciseRig(time: number, name: string): ExerciseRig | null {
  const kind = exerciseRecipe(name);
  if (!kind) return null;
  const p = (1 - Math.cos(time * Math.PI / 2)) / 2;
  const alternate = (1 - Math.cos(time * Math.PI)) / 2;
  let hip = point(180, 115), shoulder = point(180, 57);
  let arms: [Limb, Limb] = [limb(shoulder, 85, 85, 28), limb(shoulder, 95, 95, 28)];
  let legs: [Limb, Limb] = [limb(hip, 80, 90), limb(hip, 100, 90)];
  let cue = '', equipment: ExerciseRig['equipment'] = 'none';
  const bothArms = (a: number, b = a) => { arms = [limb(shoulder, a, b, 28), limb(shoulder, a, b, 28)]; };
  const bothLegs = (a: number, b = a) => { legs = [limb(hip, a, b), limb(hip, a, b)]; };
  const supine = () => { hip = point(185, 170); shoulder = point(127, 170); equipment = 'mat'; };
  const prone = (height = 130) => {
    const foot = point(268, 184);
    shoulder = point(foot.x - Math.sqrt(126 ** 2 - (foot.y - height) ** 2), height);
    hip = point(shoulder.x + (foot.x - shoulder.x) * 58 / 126, shoulder.y + (foot.y - shoulder.y) * 58 / 126);
    legs = [reach(hip, foot, 34, -1), reach(hip, foot, 34, -1)]; equipment = 'mat';
  };
  switch (kind) {
    case 'vup': {
      supine();
      // One hip pivot: straight legs rise together while the trunk folds toward them.
      shoulder = polar(hip, 58, 180 + p * 60);
      bothLegs(-p * 60);
      bothArms(180 + p * 170);
      cue = p < .2 ? 'Extend long on the mat' : p > .8 ? 'Reach toward your toes' : 'Lift torso and straight legs together';
      break;
    }
    case 'legraise': case 'hanging': {
      if (kind === 'hanging') { hip = point(180, 110); shoulder = point(180, 52); bothArms(-90); equipment = 'bar'; bothLegs(90 - p * 90); }
      else { supine(); bothArms(0); bothLegs(-5 - p * 80); }
      cue = 'Keep legs together; lift and lower under control'; break;
    }
    case 'deadbug': case 'bicycle': {
      supine();
      const a = alternate, b = 1 - a;
      legs = [limb(hip, -90 + a * 80, -a * 10), limb(hip, -90 + b * 80, -b * 10)];
      arms = [limb(shoulder, -90 - b * 90, -90 - b * 90, 28), limb(shoulder, -90 - a * 90, -90 - a * 90, 28)];
      if (kind === 'bicycle') { shoulder = point(135, 145); bothArms(-120, 0); }
      cue = kind === 'deadbug' ? 'Extend opposite arm and leg; keep your back down' : 'Alternate knee toward the opposite elbow'; break;
    }
    case 'reverse': supine(); hip = point(185 - p * 10, 170 - p * 15); bothLegs(-75 - p * 40, -p * 40); bothArms(0); cue = 'Curl your pelvis up; bring knees toward chest'; break;
    case 'hundred': supine(); shoulder = point(132, 150); bothLegs(-25); bothArms(10 + Math.sin(time * 12) * 5); cue = 'Hold legs long; pulse arms beside your hips'; break;
    case 'pushup': case 'plank': case 'plankrow': case 'rollout': {
      const height = kind === 'pushup' ? 120 + p * 32 : 120;
      prone(height);
      arms = [reach(shoulder, point(140, 184), 34, -1), reach(shoulder, point(140, 184), 34, -1)];
      if (kind === 'plankrow') arms[1] = limb(shoulder, 50 + p * 60, 90, 28);
      if (kind === 'rollout') { shoulder = point(150 - p * 25, 120 + p * 25); arms = [reach(shoulder, point(120 - p * 30, 184), 34, -1), reach(shoulder, point(120 - p * 30, 184), 34, -1)]; }
      cue = kind === 'pushup' ? 'Lower and press as one straight line' : kind === 'plank' ? 'Hold a straight line; keep hips steady' : kind === 'rollout' ? 'Reach forward without dropping your hips' : 'Keep your trunk steady as you row'; break;
    }
    case 'sideplank': prone(110); arms = [reach(shoulder, point(150, 178), 34), limb(shoulder, -90, -90, 28)]; cue = 'Stack feet and shoulders; hold your hips up'; break;
    case 'birddog': prone(120); legs = [limb(hip, 90, 0), limb(hip, 90 - p * 90, 0)]; arms = [limb(shoulder, 90, 90, 28), limb(shoulder, 90 + p * 90, 90 + p * 90, 28)]; cue = 'Reach opposite arm and leg; keep your back level'; break;
    case 'bridge': hip = point(195, 165 - p * 36); shoulder = point(140, 135); legs = [reach(hip, point(248, 183), 34, -1), reach(hip, point(248, 183), 34, -1)]; bothArms(30); equipment = 'bench'; cue = 'Drive hips up; keep feet planted'; break;
    case 'crunch': hip = point(190, 132); shoulder = polar(hip, 58, -90 - p * 40); bothLegs(90, 0); bothArms(-110, 30); cue = 'Round your upper trunk toward your knees'; break;
    case 'twist': supine(); shoulder = polar(hip, 58, 230); bothLegs(-35, 35); bothArms(-20 + (alternate - .5) * 60); cue = 'Rotate your shoulders side to side'; break;
    case 'legcurl': hip = point(195, 140); shoulder = point(137, 140); bothLegs(0, -p * 100); bothArms(80); equipment = 'bench'; cue = 'Keep thighs down; curl heels toward glutes'; break;
    case 'legextension': hip = point(170, 120); shoulder = point(170, 62); bothLegs(0, 90 - p * 90); bothArms(90); equipment = 'bench'; cue = 'Keep thighs still; straighten at the knees'; break;
    case 'legpress': hip = point(160, 145); shoulder = point(120, 103); bothLegs(-60 + p * 25, 20 - p * 55); bothArms(70); equipment = 'bench'; cue = 'Press through both feet; bend knees on the return'; break;
    case 'abduction': hip = point(180, 120); shoulder = point(180, 62); legs = [limb(hip, 35 + p * 35, 90), limb(hip, 145 - p * 35, 90)]; bothArms(90); equipment = 'bench'; cue = 'Open knees outward with your trunk still'; break;
    case 'squat': case 'lunge': case 'sidelunge': case 'step': {
      hip = point(180 - p * 22, 115 + p * 30); shoulder = polar(hip, 58, -90 + p * 15);
      const split = kind === 'squat' ? 12 : 42;
      legs = [reach(hip, point(180 + split, 183), 38, -1), reach(hip, point(180 - split, 183), 38, -1)];
      if (kind === 'step') { hip = point(180 + p * 20, 115 - p * 22); shoulder = polar(hip, 58, -90); legs = [reach(hip, point(215, 158), 38, -1), reach(hip, point(165 + p * 35, 183 - p * 25), 38, -1)]; }
      bothArms(-15, -15); cue = kind === 'squat' ? 'Sit hips back and down; keep feet planted' : kind === 'step' ? 'Drive through the foot on the step' : 'Lower through the front knee; rise under control'; break;
    }
    case 'hinge': case 'singlehinge': case 'swing': {
      hip = point(180 - p * 14, 115 + p * 5); shoulder = polar(hip, 58, -90 + p * 65);
      legs = [reach(hip, point(190, 183), 36, -1), reach(hip, point(180, 183), 36, -1)];
      if (kind === 'singlehinge') legs[1] = limb(hip, 90 + p * 85, 90 + p * 85);
      bothArms(kind === 'swing' ? 10 + p * 80 : 90); equipment = 'weights'; cue = 'Hinge at the hips; keep your back long'; break;
    }
    case 'benchpress': case 'inclinepress': case 'fly': {
      hip = point(190, 135); shoulder = polar(hip, 58, kind === 'inclinepress' ? 210 : 180); bothLegs(20, 90);
      arms = [limb(shoulder, 20 - p * 110, -90, 28), limb(shoulder, 160 - p * 250, -90, 28)];
      if (kind === 'fly') arms = [limb(shoulder, -15 - p * 75, -30 - p * 60, 28), limb(shoulder, -165 + p * 75, -150 + p * 60, 28)];
      equipment = 'bench'; cue = kind === 'fly' ? 'Bring hands together above your chest' : 'Press above the chest; lower with elbows bent'; break;
    }
    case 'overhead': case 'pulldown': case 'pullup': {
      const lift = kind === 'pulldown' ? 1 - p : p;
      if (kind === 'pullup') { hip.y -= p * 30; shoulder.y -= p * 30; legs = [limb(hip, 90, 60), limb(hip, 90, 60)]; }
      arms = [limb(shoulder, 0 - lift * 90, -90, 28), limb(shoulder, 180 + lift * 90, -90, 28)];
      if (kind === 'pullup') arms = [reach(shoulder, point(160, 15), 28, -1), reach(shoulder, point(200, 15), 28, 1)];
      equipment = kind === 'overhead' ? 'weights' : 'bar'; cue = kind === 'overhead' ? 'Press overhead; lower to shoulder height' : 'Pull elbows down toward your sides'; break;
    }
    case 'row': case 'seatedrow': case 'invertedrow': case 'rearfly': {
      if (kind === 'row' || kind === 'rearfly') shoulder = polar(hip, 58, -35);
      if (kind === 'seatedrow') { hip = point(175, 125); shoulder = point(175, 67); bothLegs(20, 20); }
      if (kind === 'invertedrow') { hip = point(210, 145 - p * 20); shoulder = point(155, 130 - p * 20); bothLegs(20); }
      bothArms(80 + p * 50, 90 - p * 80); equipment = 'weights'; cue = 'Pull elbows back; return without swinging'; break;
    }
    case 'curl': bothArms(90, 90 - p * 140); equipment = 'weights'; cue = 'Keep upper arms still; bend only at the elbows'; break;
    case 'pushdown': bothArms(90, -15 + p * 105); cue = 'Keep elbows by your sides; straighten your arms'; break;
    case 'extension': bothArms(-90, 70 - p * 160); equipment = 'weights'; cue = 'Keep upper arms overhead; extend your elbows'; break;
    case 'dip': hip.y += p * 25; shoulder.y += p * 25; arms = [reach(shoulder, point(155, 110), 30), reach(shoulder, point(205, 110), 30)]; bothLegs(75, 130); equipment = 'bar'; cue = 'Bend elbows to lower; press back up'; break;
    case 'raise': arms = [limb(shoulder, 90 - p * 90, 90 - p * 90, 28), limb(shoulder, 90 + p * 90, 90 + p * 90, 28)]; equipment = 'weights'; cue = 'Lift out to shoulder height with soft elbows'; break;
    case 'calf': hip.y -= p * 9; shoulder.y -= p * 9; bothLegs(90); bothArms(90); cue = 'Rise onto toes; lower your heels slowly'; break;
    case 'kick': case 'kneedrive': legs[0] = limb(hip, 90 - p * 150, kind === 'kick' ? 90 - p * 150 : 90); bothArms(-50, -100); cue = 'Lift the knee, extend, then return to stance'; break;
    case 'run': case 'bike': {
      const s = Math.sin(time * Math.PI * 2);
      legs = [limb(hip, 90 + s * 40, 90 - s * 50), limb(hip, 90 - s * 40, 90 + s * 50)];
      arms = [limb(shoulder, 90 - s * 35, -s * 35, 28), limb(shoulder, 90 + s * 35, s * 35, 28)];
      if (kind === 'bike') { shoulder = point(205, 65); bothArms(30, 60); }
      cue = kind === 'bike' ? 'Alternate smooth pedal strokes' : 'Opposite arm and leg move together'; break;
    }
  }
  return { hip, shoulder, arms, legs, cue, equipment };
}
