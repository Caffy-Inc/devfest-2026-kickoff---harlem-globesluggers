const keyframes = [0, 0.12, 0.23, 0.36, 0.49, 0.62, 0.73, 0.85, 1];

// Sample smooth curves once so the same easing can run on the native Animated driver and on web.
const samplesPerSegment = 10;
const segments = keyframes.slice(0, -1).flatMap((start, index) => {
  const span = keyframes[index + 1] - start;
  return Array.from({ length: samplesPerSegment }, (_, sample) => {
    const t = sample / samplesPerSegment;
    return { index, span, t, time: start + t * span };
  });
});
export const frames = [...segments.map(({ time }) => time), 1];

export function smoothTrack(poses: number[]) {
  const slopes = poses.slice(1).map((pose, i) => (pose - poses[i]) / (keyframes[i + 1] - keyframes[i]));
  const tangents = [0, ...slopes.slice(1).map((next, i) => {
    const previous = slopes[i];
    // Ease to zero at a reversal or hold. Carry speed through poses moving in the same direction.
    return previous * next > 0 ? 2 * previous * next / (previous + next) : 0;
  }), 0];

  return [...segments.map(({ index, span, t }) => {
    const ease = t * t * (3 - 2 * t);
    const remaining = 1 - t;
    return poses[index] * (1 - ease) + poses[index + 1] * ease
      + span * t * remaining * (remaining * tangents[index] - t * tangents[index + 1]);
  }), poses[poses.length - 1]];
}

