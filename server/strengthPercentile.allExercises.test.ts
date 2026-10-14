import { describe, expect, it } from "vitest";
import { STRENGTH_LEVEL_SOURCE_STUDY_ID, estimateAboveTopAnchor, resolveStrengthPercentile, type StrengthCurve } from "../shared/strengthPercentile";
import { tailEstimateForPlacement } from "./supabaseStrengthProfile";

/**
 * Every exercise the ranks score, on the card too (owner, 14 Oct 2026: "it should be applicable
 * to all the exercises"): a rep count on its rep curve, and an exercise with no curve of its own
 * read on a related exercise's through the database's alias, with the estimated tail past the
 * top anchor in both.
 *
 * Expected values are what `score_strength_input_v1` (and `apply_strengthlevel_age_adjustment_v1`
 * for the age case) returned on 14 Oct 2026 for a man at 80 kg. The database rounds its
 * percentile to 2 decimals.
 */
const context = { sex: "male" as const, bodyMassKg: 80 };

/** Male Hanging Leg Raise, the rep curve Captain's-Chair Leg Raise borrows at x0.85 reps, confidence x0.72. */
const hangingLegRaise: StrengthCurve = {
  exerciseId: "d77a6d41-e740-475a-afc9-0935c3ee0562",
  sex: "male",
  normalizationMethod: "direct_community_rep_percentile",
  unit: "reps",
  sourceRole: "beta_fallback",
  confidenceCap: 0.82,
  anchors: [
    { percentile: 5, value: 0 },
    { percentile: 20, value: 8 },
    { percentile: 50, value: 17 },
    { percentile: 80, value: 28 },
    { percentile: 95, value: 39 },
  ],
};

const captainsChair: StrengthCurve = {
  ...hangingLegRaise,
  exerciseId: "d6fda64b-8b43-45a2-a6bd-e15e726d39aa",
  aliasOfExerciseId: hangingLegRaise.exerciseId,
  alias: { multiplier: 0.85, confidenceModifier: 0.72 },
};

/** Male Skull Crusher, the curve Dumbbell Skull Crusher borrows at x2.0 load, confidence x0.65. */
const skullCrusher: StrengthCurve = {
  exerciseId: "5b53fbdb-71c2-42c3-bc12-79ae0afcb0c0",
  sourceStudyId: STRENGTH_LEVEL_SOURCE_STUDY_ID,
  sex: "male",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  confidenceCap: 0.82,
  anchors: [
    { percentile: 5, value: 0.2 },
    { percentile: 20, value: 0.35 },
    { percentile: 50, value: 0.55 },
    { percentile: 80, value: 0.75 },
    { percentile: 95, value: 1.0 },
  ],
};

const dumbbellSkullCrusher: StrengthCurve = {
  ...skullCrusher,
  exerciseId: "1880e718-5a87-4d59-9486-7c9b0d7eb273",
  aliasOfExerciseId: skullCrusher.exerciseId,
  alias: { multiplier: 2, confidenceModifier: 0.65 },
};

const resolved = (curve: StrengthCurve, input: Parameters<typeof resolveStrengthPercentile>[1], extra: Partial<Parameters<typeof resolveStrengthPercentile>[2]> = {}) => {
  const result = resolveStrengthPercentile(curve, input, { ...context, ...extra });
  if (result.status !== "resolved") throw new Error(`expected a placement, got ${JSON.stringify(result)}`);
  return result;
};

describe("A rep count on its own rep curve", () => {
  it("is placed as counted, with no one-rep max and no age scaling", () => {
    const result = resolved(hangingLegRaise, { repetitions: 20, repsOnly: true }, { ageYears: 16 });
    // 17 reps at the 50th, 28 at the 80th: 20 reps is 50 + 3/11 of 30.
    expect(result.percentile).toBeCloseTo(58.18, 2);
    expect(result.observedValue).toBe(20);
    expect(result.unit).toBe("reps");
    expect(result.estimate).toMatchObject({ valueKg: null, method: "bodyweight_reps", effectiveReps: 20 });
    expect(result.ageAdjustment).toEqual({ status: "not_applied", reason: "rep_count", ageYears: null });
    expect(result.tailEstimate).toBeUndefined();
    expect(result.confidence).toBe(0.82);
  });

  it("is estimated past the top anchor, up to the 99.99th", () => {
    const result = resolved(hangingLegRaise, { repetitions: 50, repsOnly: true });
    expect(result.percentile).toBe(estimateAboveTopAnchor(hangingLegRaise.anchors, 50)!.percentile);
    expect(result.percentile).toBeGreaterThan(95);
    expect(result.tailEstimate).toMatchObject({ aboveAnchorPercentile: 95, capped: false });
    expect(resolved(hangingLegRaise, { repetitions: 400, repsOnly: true })).toMatchObject({ percentile: 99.99, tailEstimate: { capped: true } });
  });

  it("needs at least one rep and a rep curve", () => {
    expect(resolveStrengthPercentile(hangingLegRaise, { repetitions: 0, repsOnly: true }, context)).toEqual({ status: "unavailable", reason: "repetitions_out_of_range" });
    expect(resolveStrengthPercentile(skullCrusher, { repetitions: 12, repsOnly: true }, context)).toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
    // And a load is never placed on a rep curve.
    expect(resolveStrengthPercentile(hangingLegRaise, { loadKg: 20, repetitions: 10 }, context)).toEqual({ status: "unavailable", reason: "curve_is_not_one_rep_max" });
  });
});

describe("A rep count read on a related exercise's curve", () => {
  it.each([
    // reps logged, equivalent on the source curve, database percentile
    [7, 6, 16.25],
    [10, 9, 23.33], // 8.5 rounds half away from zero, as Postgres rounds it
    [40, 34, 88.18],
  ])("%s reps place as %s on the source curve: %s", (reps, _equivalent, percentile) => {
    const result = resolved(captainsChair, { repetitions: reps, repsOnly: true });
    expect(Math.abs(result.percentile - percentile)).toBeLessThanOrEqual(0.005);
    expect(result.observedValue).toBe(reps);
    expect(result).toMatchObject({ exerciseId: captainsChair.exerciseId, aliasOfExerciseId: hangingLegRaise.exerciseId, borrowedCurve: true });
  });

  it("is trusted less, by the alias's modifier", () => {
    expect(resolved(captainsChair, { repetitions: 10, repsOnly: true }).confidence).toBeCloseTo(0.82 * 0.72, 4);
  });

  it("is estimated past the top the same way the ranks estimate it", () => {
    const card = resolved(captainsChair, { repetitions: 60, repsOnly: true });
    // 60 x 0.85 = 51 reps on the Hanging Leg Raise curve, past its 39 at the 95th.
    expect(card.percentile).toBe(estimateAboveTopAnchor(hangingLegRaise.anchors, 51)!.percentile);
    const ranks = tailEstimateForPlacement({ status: "above_range", reps: 60, equivalent_source_reps: 51, percentile_estimate: 95, curve: hangingLegRaise.anchors });
    expect(ranks?.percentile).toBe(card.percentile);
    expect(card.tailEstimate).toEqual(ranks?.tail);
  });

  it("reaches the top anchor exactly, without an estimate", () => {
    const pullUp = { ...hangingLegRaise, anchors: [{ percentile: 5, value: 0 }, { percentile: 20, value: 7 }, { percentile: 50, value: 13 }, { percentile: 80, value: 21 }, { percentile: 95, value: 30 }] };
    // Wide-Grip Pull-Up borrows Pull-Up at x1.0: the database answered 95 for 30 reps.
    const result = resolved({ ...pullUp, aliasOfExerciseId: "pull-up", alias: { multiplier: 1, confidenceModifier: 0.9 } }, { repetitions: 30, repsOnly: true });
    expect(result.percentile).toBe(95);
    expect(result.tailEstimate).toBeUndefined();
  });
});

describe("A load read on a related exercise's curve", () => {
  it("places the one-rep max scaled by the alias, and reports the lift as logged", () => {
    const result = resolved(dumbbellSkullCrusher, { loadKg: 15, repetitions: 8 });
    // e1RM 18.621 kg; x2.0 on the Skull Crusher curve is 0.46553 x body weight: the 37.33rd.
    expect(result.estimate.valueKg).toBe(18.621);
    expect(Math.abs(result.percentile - 37.33)).toBeLessThanOrEqual(0.005);
    expect(result.observedValue).toBeCloseTo(18.621 / 80, 5);
    expect(result).toMatchObject({ exerciseId: dumbbellSkullCrusher.exerciseId, aliasOfExerciseId: skullCrusher.exerciseId, borrowedCurve: true });
  });

  it("is trusted less, by the alias's modifier", () => {
    const own = resolved({ ...dumbbellSkullCrusher, alias: null }, { loadKg: 15, repetitions: 8 });
    const borrowed = resolved(dumbbellSkullCrusher, { loadKg: 15, repetitions: 8 });
    expect(borrowed.confidence).toBeCloseTo(own.confidence * 0.65, 4);
  });

  it("scales for age on the borrowed curve as the database does", () => {
    // 30 kg x 3 at 16: the database placed 0.90406 x body weight, the 89.24th.
    const result = resolved(dumbbellSkullCrusher, { loadKg: 30, repetitions: 3 }, { ageYears: 16 });
    expect(result.ageAdjustment).toMatchObject({ status: "applied" });
    if (result.ageAdjustment.status === "applied") expect(result.ageAdjustment.placedValue).toBeCloseTo(0.90406, 4);
    expect(Math.abs(result.percentile - 89.24)).toBeLessThanOrEqual(0.005);
  });

  it("is estimated past the top the same way the ranks estimate it", () => {
    // 40 kg x 5: e1RM 45 kg, placed as 1.125 x body weight, past the curve's 1.0 at the 95th.
    const card = resolved(dumbbellSkullCrusher, { loadKg: 40, repetitions: 5 });
    const ranks = tailEstimateForPlacement({ status: "above_range", observed_norm_value: 1.125, percentile_estimate: 95, curve: skullCrusher.anchors });
    expect(card.percentile).toBe(ranks?.percentile);
    expect(card.percentile).toBeGreaterThan(95);
    expect(card.tailEstimate).toEqual(ranks?.tail);
  });
});
