import { describe, expect, it } from "vitest";
import { estimateOneRepMaxKg } from "@shared/oneRepMaxEstimation";
import { estimateOneRepMax } from "@shared/strengthPercentile";

/**
 * The app's one e1RM for trends, the heaviest-set choice and the competition comparison. A set
 * it cannot read comes back null, and callers fall back (to raw weight, or to nothing) on that.
 */
describe("estimateOneRepMaxKg", () => {
  it.each([
    [0, 5],
    [-5, 5],
    [Number.NaN, 5],
    [Number.POSITIVE_INFINITY, 5],
    [100, 0],
    [100, 16],
    [100, 4.6],
  ])("refuses %s kg x %s reps", (loadKg, reps) => {
    expect(estimateOneRepMaxKg(loadKg, reps)).toBeNull();
  });

  it("reads a single rep as the lift itself (Brzycki)", () => {
    expect(estimateOneRepMaxKg(100, 1)).toBe(100);
  });

  it("reads a 5-rep set with Brzycki", () => {
    expect(estimateOneRepMaxKg(100, 5)).toBe(112.5);
  });

  it("still reads a set at the 15-rep ceiling (Epley)", () => {
    expect(estimateOneRepMaxKg(100, 15)).toBe(150);
  });

  // Nobody has recorded this as a choice; it pins what the two do today. If either side
  // changes, this fails and whoever changed it decides on purpose which one should move.
  it("refuses fractional reps even though the curve engine rounds them", () => {
    expect(estimateOneRepMaxKg(100, 4.6)).toBeNull();
    const engine = estimateOneRepMax({ loadKg: 100, repetitions: 4.6 });
    expect("valueKg" in engine && engine.valueKg).toBe(112.5);
  });
});
