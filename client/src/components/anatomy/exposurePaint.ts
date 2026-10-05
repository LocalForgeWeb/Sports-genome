/**
 * How a region is painted in exposure encoding (Train → Review's week board): one of five
 * steps on a single sequential ramp, quantised against the week's own maximum so the scale
 * is fixed for the week whatever is sorted or filtered; the unscored hatch for a region the
 * data cannot speak for; nothing for a region with no planned work, which stays the figure's
 * resting muscle. Zero and unknown are different facts and get different paint.
 */
export const EXPOSURE_STEPS = 5;

/** Which of the steps a value sits on against the maximum; 0 for nothing. */
export function exposureStep(value: number, max: number, steps = EXPOSURE_STEPS): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(steps, Math.max(1, Math.ceil((value / max) * steps)));
}

export function exposurePaint(value: number | "unknown" | undefined, max: number, unknownPatternId: string): string | undefined {
  if (value === "unknown") return `url(#${unknownPatternId})`;
  const step = exposureStep(value ?? 0, max);
  return step ? `var(--sg-exposure-${step})` : undefined;
}
