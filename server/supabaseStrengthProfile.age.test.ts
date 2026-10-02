import { describe, expect, it, vi } from "vitest";
import { createSupabaseStrengthProfileClient, scoreMuscleProfile } from "./supabaseStrengthProfile";
import { liveMuscleAggregation as live } from "./fixtures/liveMuscleAggregation";

const index = [
  { id: "03c880ed-4138-4217-92c2-28fff50845d1", name: "Barbell Bench Press", canonical_name: "barbell_bench_press__catalog_1" },
  { id: "1c710af1-7799-4cab-a79c-4cbac4048ba4", name: "Preacher Curl", canonical_name: "preacher_curl__catalog_126" },
];
/** The aggregation runs in-process since D-016, over the database's own mapping rows. */
const catalog = { exercises: index, muscles: live.muscles };

const exerciseScore = (exerciseId: string, percentile: number, name: string) => ({
  status: "ok",
  exercise_id: exerciseId,
  overall_confidence: 0.82,
  percentile: { percentile_estimate: percentile, norm_source: { population_label: "Strength Level community lifters", source_role: "beta_fallback" } },
  input_observation: { exercise_id: exerciseId, exercise_name: name },
});

/**
 * What `apply_strengthlevel_age_adjustment_v1` returned for a 180 lb bench at 145 lb body
 * weight: 48.97 unadjusted, 69.60 at 16, and no adjustment at 14.
 */
const databaseAdjustment = async (_exerciseId: string, _bw: number, _sex: string, ageYears: number, score: any) => {
  if (ageYears < 15) return { ...score, age_adjustment: { status: "outside_published_age_range", applied: false, age_years: ageYears } };
  return {
    ...score,
    percentile: { ...score.percentile, percentile_estimate: 69.6 },
    overall_confidence: 0.82,
    age_adjustment: { status: "ok", applied: true, factor: 0.8784, age_years: ageYears },
  };
};

function fakeClient() {
  return {
    getExerciseIndex: vi.fn(),
    scoreProfile: vi.fn(async (_bw: number, _sex: string, observations: { exercise_id: string; exercise_name: string }[]) => ({
      status: "ok",
      exercise_scores: observations.map((o) => exerciseScore(o.exercise_id, 48.97, o.exercise_name)),
      estimated_only: [],
      failures: [],
    })),
    getMuscles: vi.fn(),
    getMuscleMappings: vi.fn(async (ids: readonly string[]) => live.mappings.filter((row) => ids.includes(row.exercise_id))),
    adjustForAge: vi.fn(databaseAdjustment),
  };
}

/** What the sternocostal pec's one lift entered the aggregation at. */
const aggregatedBench = (result: Awaited<ReturnType<typeof scoreMuscleProfile>>) => {
  if (result.status === "unavailable") throw new Error("expected a profile");
  return result.muscles.find((m) => m.canonicalName === "pectoralis_major_sternocostal")?.evidence[0];
};

const bench = (ageYears: number | null, bodyMassKg = 65.77) => ({ exerciseName: "Barbell Bench Press", catalogExerciseId: 1, bodyMassKg, loadKg: 81.65, repetitions: 1, ageYears });

describe("Muscle ranks read each lift at the age it was lifted at", () => {
  it("sends the database's own age adjustment the lift's age, and aggregates what comes back", async () => {
    const client = fakeClient();
    const result = await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [bench(16)] });
    expect(client.adjustForAge).toHaveBeenCalledWith(index[0].id, 65.8, "male", 16, expect.objectContaining({ exercise_id: index[0].id }));
    expect(client.getMuscleMappings).toHaveBeenCalledWith([index[0].id]);
    expect(aggregatedBench(result)).toMatchObject({ exerciseName: "Barbell Bench Press", exercisePercentile: 69.6 });
    expect(result.status !== "unavailable" && result.ageAdjustment).toEqual({ applied: 1, outsideTable: 0, noAge: 0 });
  });

  /** Before a birth year is given nothing is scaled, and nothing extra is asked of the database. */
  it("leaves a lift with no age exactly as scored", async () => {
    const client = fakeClient();
    const result = await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [bench(null)] });
    expect(client.adjustForAge).not.toHaveBeenCalled();
    expect(aggregatedBench(result)).toMatchObject({ exercisePercentile: 48.97 });
    expect(result.status !== "unavailable" && result.ageAdjustment).toEqual({ applied: 0, outsideTable: 0, noAge: 1 });
  });

  it("counts a lift made before 15 as outside the table and keeps its unadjusted score", async () => {
    const client = fakeClient();
    const result = await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [bench(14)] });
    expect(aggregatedBench(result)).toMatchObject({ exercisePercentile: 48.97 });
    expect(result.status !== "unavailable" && result.ageAdjustment).toEqual({ applied: 0, outsideTable: 1, noAge: 0 });
  });

  /** One call scores one weight at one age, so a birthday between two lifts splits them. */
  it("scores lifts at different ages separately even at the same body weight", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [bench(15), bench(16), bench(16)] });
    expect(client.scoreProfile).toHaveBeenCalledTimes(2);
    expect(client.adjustForAge.mock.calls.map((call) => call[3]).sort()).toEqual([15, 16, 16]);
  });

  it("calls the adjustment by name with the database's own parameters", async () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    const wire = createSupabaseStrengthProfileClient({ url: "https://x.supabase.co", serviceRoleKey: "sb_secret_abc", fetchImplementation });
    await wire.adjustForAge("ex-1", 65.8, "male", 16, { exercise_id: "ex-1" });
    const [target, init] = fetchImplementation.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(target)).toBe("https://x.supabase.co/rest/v1/rpc/apply_strengthlevel_age_adjustment_v1");
    expect(JSON.parse(String(init.body))).toEqual({ p_exercise_id: "ex-1", p_bodyweight_kg: 65.8, p_sex: "male", p_age_years: 16, p_score: { exercise_id: "ex-1" } });
  });
});
