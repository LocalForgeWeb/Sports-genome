import { describe, expect, it } from "vitest";
import { scoreMuscleProfile } from "./supabaseStrengthProfile";
import { latsScreenshots as fx, screenshotLifts as L } from "./fixtures/latsScreenshots";
import { regionRanksFromMuscles } from "../shared/capabilityRank";

/**
 * The two lats screenshots of 13 October 2026, through the real route: `scoreMuscleProfile`
 * with the database's own answers for those four lifts (recorded the same day) and its own
 * mapping rows, then the shared region ranking. Percentile-ceiling brief §2 and §10.
 */
const key = (o: { load?: number; reps: number }) => `${o.load}x${o.reps}`;
const client = {
  getExerciseIndex: async () => [],
  getMuscles: async () => [],
  getMuscleMappings: async (ids: readonly string[]) => fx.mappings.filter((m) => ids.includes(m.exercise_id)),
  scoreProfile: async (_bw: number, _sex: string, observations: { load?: number; reps: number }[]) => ({ status: "ok", exercise_scores: observations.map((o) => fx.scores[key(o)]), estimated_only: [], failures: [] }),
  adjustForAge: async (_id: string, _bw: number, _sex: string, _age: number, score: unknown) => score,
};
const catalog = { exercises: fx.exercises, muscles: fx.muscles };
const at145lb = (lift: (typeof L)[keyof typeof L]) => ({ ...lift, bodyMassKg: 65.77, ageYears: 17 });

async function lats(...lifts: (typeof L)[keyof typeof L][]) {
  const result = await scoreMuscleProfile(client as never, catalog, { sex: "male", lifts: lifts.map(at145lb) });
  if (result.status === "unavailable") throw new Error("expected a profile");
  const muscle = result.muscles.find((m) => m.canonicalName === "latissimus_dorsi");
  if (!muscle) throw new Error("no lats");
  return { result, muscle, region: regionRanksFromMuscles(result.muscles).get("lats")! };
}

describe("Screenshot A: Lat Pulldown 187 × 6 and Machine Low Row 600 × 12", () => {
  it("keeps the row's result as above the 95th-percentile benchmark, not an exact 95", async () => {
    const { muscle } = await lats(L.latPulldown187x6, L.machineLowRow600x12);
    const pulldown = muscle.evidence.find((e) => e.exerciseName === "Lat Pulldown")!;
    const row = muscle.evidence.find((e) => e.exerciseName === "Machine Low Row")!;
    expect(pulldown).toMatchObject({ bound: "exact", exercisePercentile: 89.49 });
    expect(row).toMatchObject({ bound: "above", exercisePercentile: 95, observedValue: 6.41397, benchmarkValue: 1.75 });
    // The weights the sheet shows, unrounded: 68% and 32%.
    expect(pulldown.weightShare! + row.weightShare!).toBeCloseTo(1, 6);
    expect(pulldown.weightShare).toBeCloseTo(0.681, 3);
  });

  it("is the weighted score of the two, a range because one is a bound: 89.49 × w + (95, 100] × (1 − w)", async () => {
    const { muscle, region } = await lats(L.latPulldown187x6, L.machineLowRow600x12);
    const w = muscle.evidence.find((e) => e.exerciseName === "Lat Pulldown")!.weightShare!;
    expect(muscle.scoreBound).toBe("range");
    expect(muscle.lowerBound).toBeCloseTo(89.49 * w + 95 * (1 - w), 6);
    expect(muscle.upperBound).toBeCloseTo(89.49 * w + 100 * (1 - w), 6);
    // Both ends sit in State (80 to under 95), so the rank is State, not a minimum.
    expect(region.rank.id).toBe("state");
    expect(region.rankIsMinimum).toBe(false);
  });
});

describe("Screenshot B: Lat Pulldown 350 × 1 and Machine Low Row 325 × 8", () => {
  it("never turns two lifts above the 95th benchmark into a 94", async () => {
    const { muscle, region } = await lats(L.latPulldown350x1, L.machineLowRow325x8);
    expect(muscle.evidence.every((e) => e.bound === "above" && e.exercisePercentile === 95)).toBe(true);
    expect(muscle.scoreBound).toBe("at_least");
    expect(muscle.lowerBound).toBeCloseTo(95, 9);
    expect(muscle.percentile).toBeGreaterThanOrEqual(95);
    // Above 95 under the existing scheme is National at least - never World Stage from a bound.
    expect(region.rank.id).toBe("national");
    expect(region.rankIsMinimum).toBe(true);
  });

  it("keeps the stronger of two lifts that are both above the benchmark (600 × 12 over 325 × 8)", async () => {
    const { muscle } = await lats(L.latPulldown350x1, L.machineLowRow325x8, L.machineLowRow600x12);
    const row = muscle.evidence.find((e) => e.exerciseName === "Machine Low Row")!;
    expect(row.observedValue).toBe(6.41397);
  });
});

describe("What the route sends survives the wire", () => {
  /** tRPC carries the result as JSON: every bound and kind must arrive as sent. */
  it("keeps every result kind and bound through JSON", async () => {
    const { result } = await lats(L.latPulldown187x6, L.machineLowRow600x12);
    const wire = JSON.parse(JSON.stringify(result));
    expect(wire).toEqual(result);
    const muscle = wire.muscles.find((m: { canonicalName: string }) => m.canonicalName === "latissimus_dorsi");
    expect(muscle.scoreBound).toBe("range");
    expect(muscle.evidence.map((e: { bound: string }) => e.bound).sort()).toEqual(["above", "exact"]);
    expect(wire.scoreKind).toBe("weighted_benchmark_score");
    expect(wire.aggregationVersion).toBe("sg_muscle_benchmark_v3:directness_weighted_benchmark_score_bounded");
  });

  it("names which lift was kept for each exercise", async () => {
    const { muscle } = await lats(L.latPulldown350x1, L.machineLowRow325x8, L.machineLowRow600x12);
    expect(muscle.evidence.find((e) => e.exerciseName === "Machine Low Row")?.selectedLift).toEqual({ loadKg: 272.155, repetitions: 12 });
  });

  /** Edit or delete the kept lift: the next request scores what is left, and the rank follows. */
  it("re-selects when the kept lift is gone", async () => {
    const { muscle } = await lats(L.latPulldown350x1, L.machineLowRow325x8);
    expect(muscle.evidence.find((e) => e.exerciseName === "Machine Low Row")?.selectedLift).toEqual({ loadKg: 147.418, repetitions: 8 });
  });
});
