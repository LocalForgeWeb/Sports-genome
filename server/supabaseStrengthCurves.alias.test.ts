import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aliasesFrom, assembleCurve, getStrengthPercentile, isRepCountRequest, resetStrengthCurveCache } from "./supabaseStrengthCurves";

/**
 * The card route for an exercise with no curve of its own (owner, 14 Oct 2026: "applicable to all
 * the exercises"). It is found in the catalog, as the muscle ranks find it, and read on the curve
 * the database's alias names, so the card covers what the ranks score.
 */
const ids = {
  bench: "bench-press",
  skullCrusher: "skull-crusher",
  dumbbellSkullCrusher: "dumbbell-skull-crusher",
  hangingLegRaise: "hanging-leg-raise",
  captainsChair: "captains-chair-leg-raise",
  unlinked: "unlinked-exercise",
};

const anchors = (exerciseId: string, unit: string, method: string, values: number[]) =>
  [5, 20, 50, 80, 95].map((percentile, index) => ({
    exercise_id: exerciseId, sex: "male", normalization_method: method, unit, source_role: "beta_fallback",
    confidence_cap: 0.82, percentile, value: values[index], source_study_id: "485b3c5e-cbe7-4755-b0bd-adb224877193",
  }));

const curves: Record<string, unknown[]> = {
  [ids.bench]: anchors(ids.bench, "x_bodyweight", "direct_community_relative_1rm_percentile", [0.5, 1, 1.25, 1.5, 2]),
  [ids.skullCrusher]: anchors(ids.skullCrusher, "x_bodyweight", "direct_community_relative_1rm_percentile", [0.2, 0.35, 0.55, 0.75, 1]),
  [ids.hangingLegRaise]: anchors(ids.hangingLegRaise, "reps", "direct_community_rep_percentile", [0, 8, 17, 28, 39]),
};

const requests: string[] = [];

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

const fakeFetch = vi.fn(async (input: URL | string) => {
  const url = new URL(String(input));
  const table = url.pathname.split("/").pop()!;
  requests.push(table);
  if (table === "exercises") {
    return json([
      { id: ids.bench, name: "Barbell Bench Press", canonical_name: "barbell_bench_press__catalog_1" },
      { id: ids.dumbbellSkullCrusher, name: "Dumbbell Skull Crusher", canonical_name: "dumbbell_skull_crusher__catalog_149" },
      { id: ids.captainsChair, name: "Captain’s-Chair Leg Raise", canonical_name: "captain_s_chair_leg_raise__catalog_233" },
      { id: ids.unlinked, name: "Unlinked Exercise", canonical_name: "unlinked_exercise__catalog_999" },
    ]);
  }
  if (table === "strength_norm_curve_aliases") {
    return json([{ target_exercise_id: ids.dumbbellSkullCrusher, source_exercise_id: ids.skullCrusher, e1rm_multiplier: "2.0", confidence_modifier: "0.65", is_active: true }]);
  }
  if (table === "strength_rep_curve_aliases") {
    return json([{ target_exercise_id: ids.captainsChair, source_exercise_id: ids.hangingLegRaise, reps_multiplier: "0.85", confidence_modifier: "0.72", is_active: true }]);
  }
  if (url.searchParams.get("select") === "exercise_id,exercise_canonical_name,exercise_name") {
    return json([{ exercise_id: ids.bench, exercise_canonical_name: "barbell_bench_press__catalog_1", exercise_name: "Barbell Bench Press" }]);
  }
  const exerciseId = url.searchParams.get("exercise_id")?.replace(/^eq\./, "") ?? "";
  return json(curves[exerciseId] ?? []);
});

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test-key");
  vi.stubGlobal("fetch", fakeFetch);
  requests.length = 0;
});

afterEach(() => {
  resetStrengthCurveCache();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("A lift on an exercise with no curve of its own", () => {
  it("is read on the related exercise's curve, scaled by the alias", async () => {
    const result = await getStrengthPercentile({ catalogExerciseId: 149, exerciseName: "Dumbbell Skull Crusher", sex: "male", bodyMassKg: 80, loadKg: 15, repetitions: 8 });
    expect(result).toMatchObject({ status: "resolved", exerciseId: ids.dumbbellSkullCrusher, aliasOfExerciseId: ids.skullCrusher, borrowedCurve: true });
    if (result.status === "resolved") expect(Math.abs(result.percentile - 37.33)).toBeLessThanOrEqual(0.005);
  });

  it("places a rep count on the related exercise's rep curve", async () => {
    const result = await getStrengthPercentile({ catalogExerciseId: 233, exerciseName: "Captain’s-Chair Leg Raise", sex: "male", bodyMassKg: 80, loadKg: null, repetitions: 10 });
    expect(result).toMatchObject({ status: "resolved", unit: "reps", observedValue: 10, borrowedCurve: true, aliasOfExerciseId: ids.hangingLegRaise });
    if (result.status === "resolved") expect(Math.abs(result.percentile - 23.33)).toBeLessThanOrEqual(0.005);
  });

  it("is found by name when the catalog id is missing", async () => {
    const result = await getStrengthPercentile({ exerciseName: "dumbbell skull crusher", sex: "male", bodyMassKg: 80, loadKg: 15, repetitions: 8 });
    expect(result).toMatchObject({ status: "resolved", borrowedCurve: true });
  });

  it("says plainly when there is no curve and no link", async () => {
    expect(await getStrengthPercentile({ catalogExerciseId: 999, exerciseName: "Unlinked Exercise", sex: "male", bodyMassKg: 80, loadKg: 50, repetitions: 5 }))
      .toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
    expect(await getStrengthPercentile({ catalogExerciseId: 12345, exerciseName: "Interpretive Deadlift", sex: "male", bodyMassKg: 80, loadKg: 50, repetitions: 5 }))
      .toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
  });

  it("does not read a loaded set of a rep-scored movement on its rep link", async () => {
    // The ranks report it as not scored; the card has no load curve to read it on.
    expect(await getStrengthPercentile({ catalogExerciseId: 233, exerciseName: "Captain’s-Chair Leg Raise", sex: "male", bodyMassKg: 80, loadKg: 10, repetitions: 10 }))
      .toEqual({ status: "unavailable", reason: "no_curve_for_exercise" });
  });
});

describe("An exercise with its own curve", () => {
  it("reads nothing more than before: no catalog, no aliases", async () => {
    const result = await getStrengthPercentile({ catalogExerciseId: 1, exerciseName: "Barbell Bench Press", sex: "male", bodyMassKg: 80, loadKg: 100, repetitions: 1 });
    expect(result).toMatchObject({ status: "resolved", borrowedCurve: false, aliasOfExerciseId: null });
    expect(requests).not.toContain("exercises");
    expect(requests.filter(table => table.endsWith("_curve_aliases"))).toEqual([]);
  });
});

describe("The pieces", () => {
  it("keeps only usable, active aliases, the first per exercise", () => {
    const aliases = aliasesFrom([
      { target_exercise_id: "a", source_exercise_id: "b", e1rm_multiplier: "1.5", confidence_modifier: "0.8" },
      { target_exercise_id: "a", source_exercise_id: "c", e1rm_multiplier: "1", confidence_modifier: "0.9" },
      { target_exercise_id: "d", source_exercise_id: "e", e1rm_multiplier: "0", confidence_modifier: "0.8" },
      { target_exercise_id: "f", source_exercise_id: "g", e1rm_multiplier: "1", confidence_modifier: "1.2" },
      { target_exercise_id: "h", source_exercise_id: "h", e1rm_multiplier: "1", confidence_modifier: "0.8" },
      { target_exercise_id: "i", source_exercise_id: "j", e1rm_multiplier: "1", confidence_modifier: "0.8", is_active: false },
    ], "e1rm_multiplier");
    expect(Array.from(aliases.entries())).toEqual([["a", { sourceExerciseId: "b", multiplier: 1.5, confidenceModifier: 0.8 }]]);
  });

  it("asks for a rep count only for a rep-scored movement with no load", () => {
    expect(isRepCountRequest({ catalogExerciseId: 66, loadKg: null, repetitions: 12 }, null)).toBe(true);
    expect(isRepCountRequest({ catalogExerciseId: null, loadKg: 0, repetitions: 12 }, 66)).toBe(true);
    expect(isRepCountRequest({ catalogExerciseId: 66, loadKg: 20, repetitions: 8 }, null)).toBe(false);
    expect(isRepCountRequest({ catalogExerciseId: 66, measuredOneRmKg: 100 }, null)).toBe(false);
    expect(isRepCountRequest({ catalogExerciseId: 66, loadKg: null, repetitions: 0 }, null)).toBe(false);
    expect(isRepCountRequest({ catalogExerciseId: 1, loadKg: null, repetitions: 12 }, null)).toBe(false);
  });

  it("builds a rep curve only from a rep ladder", () => {
    const mixed = [...curves[ids.bench], ...anchors(ids.bench, "reps", "direct_community_rep_percentile", [0, 5, 10, 20, 30])];
    expect(assembleCurve(mixed as never[], ids.bench, "male", "load")?.unit).toBe("x_bodyweight");
    expect(assembleCurve(mixed as never[], ids.bench, "male", "reps")?.unit).toBe("reps");
    expect(assembleCurve(curves[ids.bench] as never[], ids.bench, "male", "reps")).toBeNull();
  });
});
