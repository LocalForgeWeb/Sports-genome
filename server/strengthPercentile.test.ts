import { describe, expect, it } from "vitest";
import {
  brzyckiOneRepMaxKg,
  epleyOneRepMaxKg,
  estimateOneRepMax,
  maxEffectiveReps,
  placeOnCurve,
  resolveStrengthPercentile,
  strengthScoringVersion,
  type StrengthCurve,
} from "../shared/strengthPercentile";

/** A community relative-1RM curve, the only kind the policy admits for a beta percentile. */
const curve: StrengthCurve = {
  exerciseId: "bench-press",
  sex: "male",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  confidenceCap: 0.82,
  anchors: [
    { percentile: 5, value: 0.5 },
    { percentile: 25, value: 0.75 },
    { percentile: 50, value: 1.0 },
    { percentile: 75, value: 1.25 },
    { percentile: 95, value: 1.6 },
  ],
};

const context = { sex: "male" as const, bodyMassKg: 80 };

describe("e1RM under strength_beta_v1", () => {
  it("passes a measured maximum through untouched", () => {
    const estimate = estimateOneRepMax({ measuredOneRmKg: 140, loadKg: 100, repetitions: 5 });
    expect(estimate).toMatchObject({ valueKg: 140, basis: "measured", confidence: 1 });
  });

  it("averages Epley and Brzycki rather than picking one", () => {
    const estimate = estimateOneRepMax({ loadKg: 100, repetitions: 5 });
    const expected = (epleyOneRepMaxKg(100, 5) + brzyckiOneRepMaxKg(100, 5)) / 2;
    expect(estimate).toMatchObject({ basis: "estimated" });
    expect("valueKg" in estimate ? estimate.valueKg : 0).toBeCloseTo(expected, 2);
    // The two formulas genuinely disagree here, which is why the version averages them.
    expect(epleyOneRepMaxKg(100, 5)).not.toBeCloseTo(brzyckiOneRepMaxKg(100, 5), 2);
  });

  it("counts reps in reserve toward effective reps", () => {
    const threeWithTwoLeft = estimateOneRepMax({ loadKg: 100, repetitions: 3, repsInReserve: 2 });
    const five = estimateOneRepMax({ loadKg: 100, repetitions: 5 });
    expect(threeWithTwoLeft).toEqual(five);
  });

  it("loses confidence as the set gets further from a single rep", () => {
    const one = estimateOneRepMax({ loadKg: 100, repetitions: 1 });
    const five = estimateOneRepMax({ loadKg: 100, repetitions: 5 });
    const ten = estimateOneRepMax({ loadKg: 100, repetitions: 10 });
    const confidence = (value: typeof one) => ("confidence" in value ? value.confidence : NaN);
    expect(confidence(one)).toBe(1);
    expect(confidence(five)).toBeLessThan(confidence(one));
    expect(confidence(ten)).toBeLessThan(confidence(five));
  });

  it("refuses a set too far out to estimate from, counting reserve", () => {
    expect(estimateOneRepMax({ loadKg: 100, repetitions: maxEffectiveReps + 1 })).toEqual({ reason: "repetitions_out_of_range" });
    expect(estimateOneRepMax({ loadKg: 100, repetitions: 11, repsInReserve: 3 })).toEqual({ reason: "repetitions_out_of_range" });
    expect(estimateOneRepMax({ repetitions: 5 })).toEqual({ reason: "load_required" });
  });
});

describe("placing a value on a curve", () => {
  it("interpolates between the anchors either side", () => {
    // Halfway between the 50th (1.0) and 75th (1.25) anchors.
    expect(placeOnCurve(curve.anchors, 1.125)).toEqual({ percentile: 62.5 });
  });

  it("returns an anchor exactly when the value sits on it", () => {
    expect(placeOnCurve(curve.anchors, 1.0)).toEqual({ percentile: 50 });
  });

  it("censors both tails instead of extrapolating past what the curve measured", () => {
    expect(placeOnCurve(curve.anchors, 0.2)).toEqual({ reason: "below_lowest_anchor", censoredAt: 5 });
    expect(placeOnCurve(curve.anchors, 2.4)).toEqual({ reason: "above_highest_anchor", censoredAt: 95 });
  });

  it("will not place a value against a single anchor", () => {
    expect(placeOnCurve([{ percentile: 50, value: 1 }], 1)).toMatchObject({ reason: "insufficient_anchors" });
  });
});

describe("the beta percentile route end to end", () => {
  it("resolves a working set into a percentile with its version and provenance", () => {
    // 100kg x 5 averages to ~112.6kg, which at 80kg bodyweight is ~1.41 relative.
    const result = resolveStrengthPercentile(curve, { loadKg: 100, repetitions: 5 }, context);
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.percentile).toBeGreaterThan(75);
    expect(result.percentile).toBeLessThan(95);
    expect(result.scoringVersion).toBe(strengthScoringVersion);
    expect(result.route).toBe("beta_community_curve");
    expect(result.estimate.basis).toBe("estimated");
  });

  it("holds confidence under the source's cap without touching the percentile", () => {
    // The measured input is the estimate's own value, so the two really are the same lift -
    // any other number would be comparing two different placements on the curve.
    const sameValue = estimateOneRepMax({ loadKg: 100, repetitions: 5 });
    expect("valueKg" in sameValue).toBe(true);
    if (!("valueKg" in sameValue)) return;
    const measured = resolveStrengthPercentile(curve, { measuredOneRmKg: sameValue.valueKg }, context);
    const estimated = resolveStrengthPercentile(curve, { loadKg: 100, repetitions: 5 }, context);
    expect(measured.status).toBe("resolved");
    expect(estimated.status).toBe("resolved");
    if (measured.status !== "resolved" || estimated.status !== "resolved") return;
    // A direct 1RM is fully confident in itself, but the community source caps what we claim.
    expect(measured.estimate.confidence).toBe(1);
    expect(measured.confidence).toBe(0.82);
    expect(estimated.confidence).toBeLessThan(0.82);
    // Same underlying number, so the same percentile regardless of how sure we are.
    expect(estimated.percentile).toBe(measured.percentile);
  });

  // The policy admits exactly one source role. Competitive powerlifting curves are excluded at
  // source, and a validation-only source is not a stand-in for a missing community curve.
  it("refuses every source role but the permitted one", () => {
    for (const role of ["excluded", "validation_only"] as const) {
      expect(resolveStrengthPercentile({ ...curve, sourceRole: role }, { loadKg: 100, repetitions: 5 }, context))
        .toEqual({ status: "unavailable", reason: "source_role_not_permitted" });
    }
  });

  it("names the input it is missing rather than failing blankly", () => {
    expect(resolveStrengthPercentile(curve, { loadKg: 100, repetitions: 5 }, { sex: null, bodyMassKg: 80 }))
      .toEqual({ status: "unavailable", reason: "sex_required" });
    expect(resolveStrengthPercentile(curve, { loadKg: 100, repetitions: 5 }, { sex: "male", bodyMassKg: null }))
      .toEqual({ status: "unavailable", reason: "body_mass_required" });
    expect(resolveStrengthPercentile(null, { loadKg: 100, repetitions: 5 }, context))
      .toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
  });

  it("does not compare an athlete against the other sex's curve", () => {
    expect(resolveStrengthPercentile({ ...curve, sex: "female" }, { loadKg: 100, repetitions: 5 }, context))
      .toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
  });

  it("uses absolute load when the curve is not bodyweight-relative", () => {
    const absolute: StrengthCurve = {
      ...curve,
      normalizationMethod: "direct_community_1rm_percentile",
      unit: "kg",
      anchors: [{ percentile: 25, value: 60 }, { percentile: 50, value: 100 }, { percentile: 75, value: 140 }],
    };
    const result = resolveStrengthPercentile(absolute, { measuredOneRmKg: 100 }, { sex: "male", bodyMassKg: null });
    expect(result).toMatchObject({ status: "resolved", percentile: 50, observedValue: 100 });
  });

  /**
   * The stored absolute curves are in pounds, and the athlete's lift is in kilograms. Placing
   * one on the other unconverted reads a 100kg bench as a 100lb bench and lands it near the
   * bottom of the curve - a wrong answer that looks exactly like a right one.
   */
  it("converts into the curve's own unit before placing a lift on it", () => {
    const pounds: StrengthCurve = {
      ...curve,
      normalizationMethod: "direct_community_1rm_percentile",
      unit: "lb_1rm",
      anchors: [{ percentile: 25, value: 135 }, { percentile: 50, value: 220.462 }, { percentile: 75, value: 315 }],
    };
    const result = resolveStrengthPercentile(pounds, { measuredOneRmKg: 100 }, { sex: "male", bodyMassKg: 80 });
    expect(result).toMatchObject({ status: "resolved", percentile: 50 });
    if (result.status !== "resolved") return;
    expect(result.observedValue).toBeCloseTo(220.46, 1);
  });

  /**
   * A rep curve ranks how many reps people get, not how much they lift. Placing an estimated
   * one-rep max on it would compare kilograms against repetitions and return a number.
   */
  it("refuses a curve that does not rank one-rep maxima at all", () => {
    const reps: StrengthCurve = {
      ...curve,
      normalizationMethod: "direct_community_rep_percentile",
      unit: "reps",
      anchors: [{ percentile: 25, value: 8 }, { percentile: 50, value: 20 }, { percentile: 75, value: 32 }],
    };
    expect(resolveStrengthPercentile(reps, { measuredOneRmKg: 100 }, context))
      .toEqual({ status: "unavailable", reason: "curve_is_not_one_rep_max" });
  });

  it("says which end of the curve a lift fell off", () => {
    const tiny = resolveStrengthPercentile(curve, { measuredOneRmKg: 10 }, context);
    expect(tiny).toEqual({ status: "unavailable", reason: "below_lowest_anchor", censoredAt: 5 });
  });

  it("reports when the curve was borrowed from a variant", () => {
    const borrowed = resolveStrengthPercentile({ ...curve, aliasOfExerciseId: "barbell-bench-press" }, { measuredOneRmKg: 80 }, context);
    expect(borrowed).toMatchObject({ status: "resolved", borrowedCurve: true, aliasOfExerciseId: "barbell-bench-press" });
  });
});

describe("Against the real barbell bench press curve", () => {
  /**
   * The live anchors for barbell_bench_press__catalog_1, male, bodyweight-relative, read from
   * app_strength_beta_curves_v1 on 2026-09-21. Pinned here so the engine is exercised on the
   * shape the data actually has - unevenly spaced percentiles - rather than a tidy invention.
   */
  const benchPress: StrengthCurve = {
    exerciseId: "barbell_bench_press__catalog_1",
    sex: "male",
    normalizationMethod: "direct_community_relative_1rm_percentile",
    unit: "x_bodyweight",
    sourceRole: "beta_fallback",
    confidenceCap: 0.82,
    anchors: [
      { percentile: 5, value: 0.5 },
      { percentile: 20, value: 1.0 },
      { percentile: 50, value: 1.25 },
      { percentile: 80, value: 1.5 },
      { percentile: 95, value: 2.0 },
    ],
  };

  it("places an 80kg lifter's 100kg x 5 a little above the middle", () => {
    const result = resolveStrengthPercentile(benchPress, { loadKg: 100, repetitions: 5 }, { sex: "male", bodyMassKg: 80 });
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    // 114.58kg estimated, 1.432 x bodyweight, between the 50th (1.25) and 80th (1.5) anchors.
    expect(result.observedValue).toBeCloseTo(1.432, 3);
    expect(result.percentile).toBeGreaterThan(50);
    expect(result.percentile).toBeLessThan(80);
    expect(result.confidence).toBeLessThanOrEqual(0.82);
  });

  it("handles the uneven anchor spacing without drifting toward the wider gap", () => {
    // 1.375 is the midpoint of a 30-percentile-wide band, not of the whole curve.
    const midBand = resolveStrengthPercentile(benchPress, { measuredOneRmKg: 110 }, { sex: "male", bodyMassKg: 80 });
    expect(midBand).toMatchObject({ status: "resolved", percentile: 65 });
  });

  it("censors a lift stronger than the 95th anchor rather than inventing a 99th", () => {
    const veryStrong = resolveStrengthPercentile(benchPress, { measuredOneRmKg: 200 }, { sex: "male", bodyMassKg: 80 });
    expect(veryStrong).toEqual({ status: "unavailable", reason: "above_highest_anchor", censoredAt: 95 });
  });
});
