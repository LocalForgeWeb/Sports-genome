import { describe, expect, it, vi } from "vitest";
import { findProfileExercise, profileStatus, scoreMuscleProfile, validateMuscle, createSupabaseStrengthProfileClient } from "./supabaseStrengthProfile";

const index = [
  { id: "03c880ed-4138-4217-92c2-28fff50845d1", name: "Barbell Bench Press", canonical_name: "barbell_bench_press__catalog_1" },
  { id: "8a5a495f-dbaa-4536-8bf7-f9582d6c43c3", name: "Lat Pulldown", canonical_name: "lat_pulldown__catalog_57" },
  { id: "1c710af1-7799-4cab-a79c-4cbac4048ba4", name: "Preacher Curl", canonical_name: "preacher_curl__catalog_126" },
];

const communityLabel = "Self-selected Strength Level community lifters (not general population)";

/** Shaped exactly as the live `score_strength_profile_v1` returns an exercise score. */
const exerciseScore = (exerciseId: string, percentile: number, name: string) => ({
  status: "ok",
  exercise_id: exerciseId,
  overall_confidence: 0.8,
  percentile: { percentile_estimate: percentile, norm_source: { population_label: communityLabel, source_role: "beta_fallback" } },
  input_observation: { exercise_id: exerciseId, exercise_name: name },
});

/** Recorded from the live aggregation for bench 100x5, lat pulldown 70x8, preacher curl 30x8 (male, 80 kg). */
const liveAggregate = {
  status: "ok",
  scoring_version: "strength_beta_v1",
  muscles: [
    { muscle_id: "m-pec", muscle_name: "Pectoralis major — sternocostal head", muscle_canonical_name: "pectoralis_major_sternocostal", strength_percentile: 68.5, confidence: 0.601, evidence_count: 1, movement_pattern_count: 1, evidence: [{ exercise_id: index[0].id, exercise_name: "Barbell Bench Press", role: "primary", exercise_percentile: 68.75 }] },
    { muscle_id: "m-bic", muscle_name: "Biceps brachii", muscle_canonical_name: "biceps_brachii", strength_percentile: 41.16, confidence: 0.758, evidence_count: 2, movement_pattern_count: 2, evidence: [
      { exercise_id: index[2].id, exercise_name: "Preacher Curl", role: "primary", exercise_percentile: 33.86 },
      { exercise_id: index[1].id, exercise_name: "Lat Pulldown", role: "secondary", exercise_percentile: 55.17 },
    ] },
  ],
};

function fakeClient(overrides: Partial<Record<"scoreProfile" | "aggregate", ReturnType<typeof vi.fn>>> = {}) {
  return {
    getExerciseIndex: vi.fn(),
    scoreProfile: overrides.scoreProfile ?? vi.fn(async (_bw: number, _sex: string, observations: { exercise_id: string; exercise_name: string }[]) => ({
      status: "ok",
      exercise_scores: observations.map((o, i) => exerciseScore(o.exercise_id, [68.75, 55.17, 33.86][i] ?? 50, o.exercise_name)),
      estimated_only: [],
      failures: [],
    })),
    aggregate: overrides.aggregate ?? vi.fn(async () => liveAggregate),
  };
}

const lift = (exerciseName: string, catalogExerciseId: number | null, bodyMassKg: number | null, loadKg = 100, repetitions = 5) =>
  ({ exerciseName, catalogExerciseId, bodyMassKg, loadKg, repetitions });

describe("Scoring a muscle profile", () => {
  /**
   * The app's rule, applied to the database's function: a lift is read against the weight saved
   * with it. The profile function takes one weight, so each distinct weight is its own call.
   */
  it("scores each lift at the body weight saved with it", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Preacher Curl", 126, 84)] });
    expect(client.scoreProfile).toHaveBeenCalledTimes(2);
    expect(client.scoreProfile.mock.calls.map((call) => call[0]).sort()).toEqual([80, 84]);
  });

  it("scores lifts saved at the same weight together", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Lat Pulldown", 57, 80.02)] });
    expect(client.scoreProfile).toHaveBeenCalledTimes(1);
  });

  /** One aggregation over everything: muscles must be combined across weights, not per group. */
  it("aggregates every scored lift once, across weight groups", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Preacher Curl", 126, 84)] });
    expect(client.aggregate).toHaveBeenCalledTimes(1);
    expect((client.aggregate.mock.calls[0][0] as unknown[]).length).toBe(2);
  });

  it("returns the aggregation's muscles with the group each was compared against", async () => {
    const result = await scoreMuscleProfile(fakeClient(), index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.status).toBe("ok");
    expect(result.scoringVersion).toBe("strength_beta_v1");
    expect(result.rankSchemeVersion).toBe("sg_capability_rank_v1");
    const pec = result.muscles.find((m) => m.canonicalName === "pectoralis_major_sternocostal");
    expect(pec?.percentile).toBe(68.5);
    expect(pec?.referenceGroups).toEqual([{ label: communityLabel, sex: "male" }]);
  });

  /** A lift that could not be scored is surfaced, never silently dropped - the manifest's own rule. */
  it("reports a lift it could not match as a failure and marks the profile partial", async () => {
    const result = await scoreMuscleProfile(fakeClient(), index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Interpretive Deadlift", null, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.status).toBe("partial");
    expect(result.unranked).toContainEqual({ exerciseName: "Interpretive Deadlift", reason: "exercise_not_recognised" });
  });

  it("asks for body weight rather than scoring a lift against a guess", async () => {
    const result = await scoreMuscleProfile(fakeClient(), index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, null)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.unranked).toContainEqual({ exerciseName: "Barbell Bench Press", reason: "body_mass_required" });
    expect(result.status).toBe("no_scored_observations");
  });

  it("needs a sex to compare against", async () => {
    expect(await scoreMuscleProfile(fakeClient(), index, { sex: null, lifts: [lift("Barbell Bench Press", 1, 80)] }))
      .toEqual({ status: "unavailable", reason: "sex_required" });
  });

  /** Estimate-only lifts are listed by name too, but counted apart from failures. */
  it("lists an estimate-only lift without calling it a failure", async () => {
    const scoreProfile = vi.fn(async () => ({ status: "estimates_only", exercise_scores: [], estimated_only: [{ status: "estimated_only", input_observation: { exercise_name: "Preacher Curl" } }], failures: [] }));
    const result = await scoreMuscleProfile(fakeClient({ scoreProfile }), index, { sex: "male", lifts: [lift("Preacher Curl", 126, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.status).toBe("estimates_only");
    expect(result.counts).toEqual({ scored: 0, estimatedOnly: 1, failed: 0 });
    expect(result.unranked).toEqual([{ exerciseName: "Preacher Curl", reason: "estimated_only" }]);
  });

  it("does not call the database for nothing", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, index, { sex: "male", lifts: [lift("Interpretive Deadlift", null, 80)] });
    expect(client.aggregate).not.toHaveBeenCalled();
  });
});

describe("Validating what the aggregation returns", () => {
  const refs = new Map();
  const base = liveAggregate.muscles[0];

  it("accepts the live shape", () => {
    expect(validateMuscle(base, refs)?.percentile).toBe(68.5);
  });

  /** Refused, not clamped: an out-of-scale value means the contract moved, and a clamp would hide it. */
  it.each([
    ["a percentile above 100", { strength_percentile: 101 }],
    ["a negative percentile", { strength_percentile: -3 }],
    ["a confidence above 1", { confidence: 72 }],
    ["no evidence", { evidence_count: 0 }],
    ["no identity", { muscle_canonical_name: undefined }],
  ])("refuses %s", (_label, patch) => {
    expect(validateMuscle({ ...base, ...patch }, refs)).toBeNull();
  });

  it("counts the muscles it refused", async () => {
    const aggregate = vi.fn(async () => ({ ...liveAggregate, muscles: [...liveAggregate.muscles, { ...base, strength_percentile: 140 }] }));
    const result = await scoreMuscleProfile(fakeClient({ aggregate }), index, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.rejectedMuscles).toBe(1);
    expect(result.muscles).toHaveLength(2);
  });
});

describe("The profile status, as score_strength_profile_v1 states it", () => {
  it.each([
    [2, 0, 0, "ok"],
    [2, 1, 0, "partial"],
    [2, 0, 1, "partial"],
    [0, 2, 0, "estimates_only"],
    [0, 2, 1, "partial"],
    [0, 0, 3, "no_scored_observations"],
    [0, 0, 0, "no_scored_observations"],
  ])("scored %i, estimated %i, failed %i -> %s", (scored, estimated, failed, expected) => {
    expect(profileStatus(scored, estimated, failed)).toBe(expected);
  });
});

describe("Finding the database exercise for a logged lift", () => {
  it("joins on the catalog id the canonical name carries", () => {
    expect(findProfileExercise(index, { catalogExerciseId: 126, exerciseName: "anything" })?.name).toBe("Preacher Curl");
  });
  it("falls back to the name", () => {
    expect(findProfileExercise(index, { catalogExerciseId: null, exerciseName: "lat  pulldown" })?.name).toBe("Lat Pulldown");
  });
});

describe("The wire calls", () => {
  /** v1, not v2: v2 feeds heuristic scores into the aggregation, where they cannot be told apart. */
  it("calls the profile function that aggregates percentiles only", async () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    const client = createSupabaseStrengthProfileClient({ url: "https://x.supabase.co", serviceRoleKey: "sb_secret_abc", fetchImplementation });
    await client.scoreProfile(80, "male", []);
    const [target, init] = fetchImplementation.mock.calls[0] as [URL, RequestInit];
    expect(String(target)).toBe("https://x.supabase.co/rest/v1/rpc/score_strength_profile_v1");
    expect(JSON.parse(String(init.body))).toEqual({ p_bodyweight_kg: 80, p_sex: "male", p_observations: [] });
    // An opaque secret key rides in apikey only.
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
