import { describe, expect, it } from "vitest";
import { STRENGTH_LEVEL_SOURCE_STUDY_ID, resolveStrengthPercentile, type StrengthCurve } from "../shared/strengthPercentile";
import { estimateOneRepMaxKg } from "../shared/oneRepMaxEstimation";

/**
 * One lift, one answer (Backend V1 EN-03, B017, B056, B057, B075).
 *
 * The single-lift card (this engine) and the muscle ranks (the database) used to estimate and
 * place the same set differently: 180 lb x 3 at 145 lb read 60.8 on the card and 57.74 in the
 * ranks. Every expected value here is what `score_strength_input_v1` returned for the male
 * Barbell Bench Press (591d8565-1053-45e2-bbd0-74cdd0434dbd) at 65.77 kg body mass,
 * recorded 28 September 2026. The database rounds its percentile to 2 decimals.
 */
const bench: StrengthCurve = {
  exerciseId: "591d8565-1053-45e2-bbd0-74cdd0434dbd",
  sourceStudyId: STRENGTH_LEVEL_SOURCE_STUDY_ID,
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
const context = { sex: "male" as const, bodyMassKg: 65.77 };

describe("The card places a lift where the muscle ranks place it", () => {
  it.each([
    // load kg, reps, RIR, database e1RM kg, database observed value, database percentile
    [81.6466266, 1, null, 81.647, 1.2414, 48.97],
    [81.6466266, 3, null, 86.449, 1.31441, 57.73],
    [70, 5, null, 78.75, 1.19735, 43.68],
    [70, 8, null, 86.897, 1.32123, 58.55],
    [70, 9, null, 90.5, 1.37601, 65.12],
    [70, 10, null, 93.333, 1.41908, 70.29],
    [60, 12, null, 84, 1.27718, 53.26],
    [60, 15, null, 90, 1.36841, 64.21],
    [70, 5, 2, 84, 1.27718, 53.26],
    [30, 5, null, 33.75, 0.51315, 5.39],
  ])("%s kg x %s (RIR %s): e1RM %s kg, %s x body mass, percentile %s", (loadKg, repetitions, repsInReserve, e1rmKg, observed, percentile) => {
    const result = resolveStrengthPercentile(bench, { loadKg, repetitions, repsInReserve }, context);
    if (result.status !== "resolved") throw new Error(`expected a placement, got ${JSON.stringify(result)}`);
    expect(result.estimate.valueKg).toBe(e1rmKg);
    expect(result.observedValue).toBeCloseTo(observed, 4);
    expect(Math.abs(result.percentile - percentile)).toBeLessThanOrEqual(0.005);
    expect(result.scoringVersion).toBe("strength_beta_v2");
  });

  it("refuses 16 reps, as the database does", () => {
    expect(resolveStrengthPercentile(bench, { loadKg: 60, repetitions: 16 }, context)).toEqual({ status: "unavailable", reason: "repetitions_out_of_range" });
  });

  /**
   * Past the top anchor the database enters the lift at the 95th with `above_range`; the card
   * reports the same edge as a bound rather than a placement. Both say "at least the 95th".
   */
  it("reads a lift past the top anchor at the same edge the database does", () => {
    expect(resolveStrengthPercentile(bench, { loadKg: 140, repetitions: 1 }, context)).toEqual({ status: "unavailable", reason: "above_highest_anchor", censoredAt: 95 });
  });

  it("gives trends and the declared competition comparison the same e1RM as the card", () => {
    for (const [loadKg, repetitions] of [[70, 5], [70, 9], [60, 12], [81.6466266, 3]] as const) {
      const card = resolveStrengthPercentile(bench, { loadKg, repetitions }, context);
      if (card.status !== "resolved") throw new Error("expected a placement");
      expect(estimateOneRepMaxKg(loadKg, repetitions)).toBe(card.estimate.valueKg);
    }
  });
});
