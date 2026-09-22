import { describe, expect, it } from "vitest";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";
import type { ComparableStrengthObservation, WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import { liftsToPlace, percentileSexFor, summarizeProgressPercentiles, trendKey } from "./progressPercentiles";

const point = (id: string | number, estimatedOneRmKg = 100) => ({ id, observedAt: new Date("2026-09-10T10:00:00Z"), estimatedOneRmKg, repetitions: 5 });

const change = (exerciseName: string, latestId: string | number, laterality = "BILATERAL"): WithinAthleteStrengthChange => ({
  exerciseName, laterality, changeState: "stable", observationCount: 3,
  firstPoint: point("first"), latestPoint: point(latestId), relativeChangePercent: 4, estimationMethod: "epley" as never,
});

const observation = (id: string | number, exerciseName: string, over: Partial<ComparableStrengthObservation> = {}): ComparableStrengthObservation => ({
  id, exerciseName, measurementType: "MULTI_REP", observedAt: "2026-09-10T10:00:00Z", loadKg: 100, repetitions: 5, laterality: "BILATERAL", ...over,
});

const resolved = (percentile: number): StrengthPercentileResult => ({
  status: "resolved", percentile, observedValue: 1.25,
  estimate: { valueKg: 112, basis: "estimated", confidence: 0.8, effectiveReps: 5 },
  confidence: 0.8, scoringVersion: "strength_beta_v1", route: "beta_community_curve",
  normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback",
  exerciseId: "curve", aliasOfExerciseId: null, borrowedCurve: false,
});

describe("turning a trend into the request the record sheet makes", () => {
  it("traces the latest point back to the raw log, so the route gets what was lifted", () => {
    const lifts = liftsToPlace(
      [change("Barbell Bench Press", "obs-2")],
      [observation("obs-1", "Barbell Bench Press", { loadKg: 90 }), observation("obs-2", "Barbell Bench Press", { loadKg: 100, repetitions: 5 })],
      new Map([["obs-2", 80]]),
      { sex: "male" },
    );
    expect(lifts).toHaveLength(1);
    expect(lifts[0].request).toMatchObject({ exerciseName: "Barbell Bench Press", sex: "male", bodyMassKg: 80, loadKg: 100, repetitions: 5, measuredOneRmKg: null });
    expect(lifts[0].request.catalogExerciseId).toEqual(expect.any(Number));
    expect(lifts[0].bodyMassSource).toBe("recorded");
  });

  it("passes a measured maximum through as one, not as a set to estimate from", () => {
    const [lift] = liftsToPlace([change("Back Squat", 7)], [observation(7, "Back Squat", { measurementType: "MEASURED_1RM", loadKg: 180, repetitions: 1 })], new Map(), { sex: "female", fallbackBodyMassKg: 70 });
    expect(lift.request).toMatchObject({ measuredOneRmKg: 180, loadKg: null, repetitions: null, bodyMassKg: 70 });
    expect(lift.bodyMassSource).toBe("profile");
  });

  it("leaves out a trend whose latest log has nothing to place", () => {
    const lifts = liftsToPlace(
      [change("Plank", "p1"), change("Ghost", "missing")],
      [observation("p1", "Plank", { loadKg: null, repetitions: 30 })],
      new Map(), { sex: "male" },
    );
    expect(lifts).toEqual([]);
  });

  it("reads sex the way the curves are split, and nothing else", () => {
    expect(percentileSexFor("male")).toBe("male");
    expect(percentileSexFor("female")).toBe("female");
    expect(percentileSexFor("intersex")).toBeNull();
    expect(percentileSexFor("unspecified")).toBeNull();
    expect(percentileSexFor(undefined)).toBeNull();
  });
});

describe("summarising the placements for the section", () => {
  const lifts = liftsToPlace(
    [change("Barbell Bench Press", "b"), change("Back Squat", "s")],
    [observation("b", "Barbell Bench Press"), observation("s", "Back Squat", { loadKg: 140 })],
    new Map([["b", 80], ["s", 80]]), { sex: "male" },
  );

  it("keys each card to its trend and names the strongest placement", () => {
    const summary = summarizeProgressPercentiles(lifts, [resolved(63), resolved(78)], "male");
    expect(summary.placed).toBe(2);
    expect(summary.cards.get(trendKey(change("Back Squat", "s")))?.headline).toBe("78th percentile");
    expect(summary.cards.get(trendKey(change("Barbell Bench Press", "b")))?.headline).toBe("63rd percentile");
    expect(summary.best).toMatchObject({ exerciseName: "Back Squat", percentile: 78 });
    expect(summary.gap).toBeNull();
  });

  it("asks for the one input that would unlock placements, only when none were made", () => {
    const none = summarizeProgressPercentiles(lifts, [{ status: "unavailable", reason: "sex_required" }, { status: "unavailable", reason: "sex_required" }], null);
    expect(none.placed).toBe(0);
    expect(none.gap).toMatch(/Add the sex to compare against/);
    // Sex outranks body weight: it unlocks every lift, body weight only the relative ones.
    const mixed = summarizeProgressPercentiles(lifts, [{ status: "unavailable", reason: "body_mass_required" }, { status: "unavailable", reason: "sex_required" }], null);
    expect(mixed.gap).toMatch(/Add the sex/);
    const weight = summarizeProgressPercentiles(lifts, [{ status: "unavailable", reason: "body_mass_required" }, { status: "unavailable", reason: "no_curve_for_exercise" }], "male");
    expect(weight.gap).toMatch(/Add your body weight/);
  });

  it("says nothing about a gap once any lift is placed, and nothing for a gap nobody can act on", () => {
    const one = summarizeProgressPercentiles(lifts, [resolved(40), { status: "unavailable", reason: "body_mass_required" }], "male");
    expect(one.placed).toBe(1);
    expect(one.gap).toBeNull();
    const dead = summarizeProgressPercentiles(lifts, [{ status: "unavailable", reason: "no_curve_for_exercise" }, { status: "unavailable", reason: "above_highest_anchor", censoredAt: 95 }], "male");
    expect(dead.gap).toBeNull();
    expect(dead.best).toBeNull();
  });

  it("tolerates results that have not arrived", () => {
    const pending = summarizeProgressPercentiles(lifts, undefined, "male");
    expect(pending.placed).toBe(0);
    expect(pending.gap).toBeNull();
  });
});
