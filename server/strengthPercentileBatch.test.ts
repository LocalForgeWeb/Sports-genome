import { afterEach, describe, expect, it } from "vitest";
import { getStrengthPercentiles, resetStrengthCurveCache } from "./supabaseStrengthCurves";

/**
 * The Progress section places every lift it shows a trend for, in one request. Each lift
 * is answered exactly as it would be alone, in the order asked, and one lift's refusal
 * never stops the others from being read.
 */
describe("placing several lifts in one request", () => {
  afterEach(() => resetStrengthCurveCache());

  it("answers each lift in order, with its own typed reason", async () => {
    const results = await getStrengthPercentiles([
      { exerciseName: "Barbell Bench Press", sex: null, loadKg: 100, repetitions: 5 },
      // No curve client is configured here, so the index is empty and the honest answer
      // is that no curve was found - not an exception that empties the whole list.
      { exerciseName: "Barbell Bench Press", sex: "male", bodyMassKg: 80, loadKg: 100, repetitions: 5 },
      { exerciseName: "Back Squat", sex: "female", bodyMassKg: 70, measuredOneRmKg: 120 },
    ]);
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ status: "unavailable", reason: "sex_required" });
    expect(results[1]).toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
    expect(results[2]).toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
  });

  it("returns nothing for nothing", async () => {
    expect(await getStrengthPercentiles([])).toEqual([]);
  });
});
