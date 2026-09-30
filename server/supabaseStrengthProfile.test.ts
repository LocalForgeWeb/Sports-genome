import { describe, expect, it, vi } from "vitest";
import { findProfileExercise, profileStatus, scoreMuscleProfile, validateMuscle, createSupabaseStrengthProfileClient } from "./supabaseStrengthProfile";
import { liveMuscleAggregation as live } from "./fixtures/liveMuscleAggregation";

/** The database's own rows for the fixture's nine exercises (bench, lat pulldown, preacher curl, pull-up among them). */
const catalog = { exercises: live.exercises, muscles: live.muscles };
const index = live.exercises;
const exerciseId = (canonicalName: string) => index.find((row) => row.canonical_name === canonicalName)!.id;
const BENCH = exerciseId("barbell_bench_press__catalog_1");
const PULL_UP = exerciseId("pull_up__catalog_66");

const communityLabel = "Self-selected Strength Level community lifters (not general population)";

/** Shaped exactly as the live `score_strength_profile_v1` returns an exercise score. */
const exerciseScore = (exerciseId: string, percentile: number, name: string, confidence = 0.8) => ({
  status: "ok",
  scoring_version: "strength_beta_v2",
  exercise_id: exerciseId,
  overall_confidence: confidence,
  percentile: { percentile_estimate: percentile, norm_source: { population_label: communityLabel, source_role: "beta_fallback" } },
  input_observation: { exercise_id: exerciseId, exercise_name: name },
});

function fakeClient(overrides: Partial<Record<"scoreProfile", ReturnType<typeof vi.fn>>> = {}) {
  return {
    getExerciseIndex: vi.fn(),
    getMuscles: vi.fn(),
    getMuscleMappings: vi.fn(async (ids: readonly string[]) => live.mappings.filter((row) => ids.includes(row.exercise_id))),
    scoreProfile: overrides.scoreProfile ?? vi.fn(async (_bw: number, _sex: string, observations: { exercise_id: string; exercise_name: string }[]) => ({
      status: "ok",
      exercise_scores: observations.map((o, i) => exerciseScore(o.exercise_id, [68.75, 55.17, 33.86][i] ?? 50, o.exercise_name)),
      estimated_only: [],
      failures: [],
    })),
    adjustForAge: vi.fn(),
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
    await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Preacher Curl", 126, 84)] });
    expect(client.scoreProfile).toHaveBeenCalledTimes(2);
    expect(client.scoreProfile.mock.calls.map((call) => call[0]).sort()).toEqual([80, 84]);
  });

  it("scores lifts saved at the same weight together", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Lat Pulldown", 57, 80.02)] });
    expect(client.scoreProfile).toHaveBeenCalledTimes(1);
  });

  /** One aggregation over everything: the mappings for every scored exercise are read once, whatever the weight groups. */
  it("aggregates every scored lift once, across weight groups", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Preacher Curl", 126, 84)] });
    expect(client.getMuscleMappings).toHaveBeenCalledTimes(1);
    expect([...(client.getMuscleMappings.mock.calls[0][0] as string[])].sort()).toEqual([BENCH, exerciseId("preacher_curl__catalog_126")].sort());
  });

  it("returns the aggregation's muscles with the group each was compared against", async () => {
    const result = await scoreMuscleProfile(fakeClient(), catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.status).toBe("ok");
    // The lifts' own version, not the aggregation's label (EN-04).
    expect(result.scoringVersion).toBe("strength_beta_v2");
    expect(result.aggregationVersion).toBe("sg_muscle_aggregate_v2:directness_weighted_latent_evidence_with_redundancy_decay");
    expect(result.selectionRule).toBe("best_percentile_per_exercise_v1");
    expect(result.rankSchemeVersion).toBe("sg_capability_rank_v1");
    const pec = result.muscles.find((m) => m.canonicalName === "pectoralis_major_sternocostal");
    // One lift: the database's own 68.5 for bench 68.75 (fixture set_c), directness cannot move it.
    expect(pec?.percentile).toBe(68.5);
    expect(pec?.referenceGroups).toEqual([{ label: communityLabel, sex: "male" }]);
    expect(pec?.evidence[0]).toMatchObject({ exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 68.75, directness: 0.242, weightShare: 1 });
  });

  /** A lift that could not be scored is surfaced, never silently dropped - the manifest's own rule. */
  it("reports a lift it could not match as a failure and marks the profile partial", async () => {
    const result = await scoreMuscleProfile(fakeClient(), catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80), lift("Interpretive Deadlift", null, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.status).toBe("partial");
    expect(result.unranked).toContainEqual({ exerciseName: "Interpretive Deadlift", reason: "exercise_not_recognised" });
  });

  it("asks for body weight rather than scoring a lift against a guess", async () => {
    const result = await scoreMuscleProfile(fakeClient(), catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, null)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.unranked).toContainEqual({ exerciseName: "Barbell Bench Press", reason: "body_mass_required" });
    expect(result.status).toBe("no_scored_observations");
  });

  it("needs a sex to compare against", async () => {
    expect(await scoreMuscleProfile(fakeClient(), catalog, { sex: null, lifts: [lift("Barbell Bench Press", 1, 80)] }))
      .toEqual({ status: "unavailable", reason: "sex_required" });
  });

  /** Estimate-only lifts are listed by name too, but counted apart from failures. */
  it("lists an estimate-only lift without calling it a failure", async () => {
    const scoreProfile = vi.fn(async () => ({ status: "estimates_only", exercise_scores: [], estimated_only: [{ status: "estimated_only", input_observation: { exercise_name: "Preacher Curl" } }], failures: [] }));
    const result = await scoreMuscleProfile(fakeClient({ scoreProfile }), catalog, { sex: "male", lifts: [lift("Preacher Curl", 126, 80)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.status).toBe("estimates_only");
    expect(result.counts).toEqual({ scored: 0, estimatedOnly: 1, failed: 0 });
    expect(result.unranked).toEqual([{ exerciseName: "Preacher Curl", reason: "estimated_only" }]);
    expect(result.muscles).toEqual([]);
  });

  it("does not call the database for nothing", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [lift("Interpretive Deadlift", null, 80)] });
    expect(client.scoreProfile).not.toHaveBeenCalled();
    expect(client.getMuscleMappings).not.toHaveBeenCalled();
  });
});

describe("Validating what the aggregation returns", () => {
  const refs = new Map();
  const base = {
    muscle_id: "m-pec", muscle_name: "Pectoralis major — sternocostal head", muscle_canonical_name: "pectoralis_major_sternocostal",
    strength_percentile: 68.5, confidence: 0.592, evidence_count: 1, movement_pattern_count: 1,
    evidence: [{ exercise_id: BENCH, exercise_name: "Barbell Bench Press", role: "primary", exercise_percentile: 68.75, directness: 0.242, weight_share: 1 }],
  };

  it("accepts the aggregation's shape, directness included", () => {
    const muscle = validateMuscle(base, refs);
    expect(muscle?.percentile).toBe(68.5);
    expect(muscle?.evidence[0]).toEqual({ exerciseName: "Barbell Bench Press", role: "primary", exercisePercentile: 68.75, directness: 0.242, weightShare: 1 });
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
  const wired = () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    return { fetchImplementation, client: createSupabaseStrengthProfileClient({ url: "https://x.supabase.co", serviceRoleKey: "sb_secret_abc", fetchImplementation }) };
  };

  /** v1, not v2: v2 feeds heuristic scores into the aggregation, where they cannot be told apart. */
  it("calls the profile function that aggregates percentiles only", async () => {
    const { fetchImplementation, client } = wired();
    await client.scoreProfile(80, "male", []);
    const [target, init] = fetchImplementation.mock.calls[0] as [URL, RequestInit];
    expect(String(target)).toBe("https://x.supabase.co/rest/v1/rpc/score_strength_profile_v1");
    expect(JSON.parse(String(init.body))).toEqual({ p_bodyweight_kg: 80, p_sex: "male", p_observations: [] });
    // An opaque secret key rides in apikey only.
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("reads the movement pattern with the exercise index, and the mappings for the exercises asked", async () => {
    const { fetchImplementation, client } = wired();
    await client.getExerciseIndex();
    await client.getMuscles();
    await client.getMuscleMappings([BENCH, PULL_UP]);
    const targets = fetchImplementation.mock.calls.map((call) => String((call as [URL])[0]));
    expect(targets[0]).toBe("https://x.supabase.co/rest/v1/exercises?select=id%2Cname%2Ccanonical_name%2Cmovement_pattern&canonical_name=like.*__catalog_*");
    expect(targets[1]).toBe("https://x.supabase.co/rest/v1/muscles?select=id%2Cname%2Ccanonical_name%2Cregion%2Cmuscle_group");
    expect(targets[2]).toBe(`https://x.supabase.co/rest/v1/exercise_muscle_mappings?select=exercise_id%2Cmuscle_id%2Crole%2Ccontribution_weight%2Cconfidence_score&exercise_id=in.%28${BENCH}%2C${PULL_UP}%29`);
  });

  it("asks for no mappings when there is no evidence", async () => {
    const { fetchImplementation, client } = wired();
    expect(await client.getMuscleMappings([])).toEqual([]);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});

/**
 * EN-01, recorded live on 28 September 2026 for a male lifter at 80 kg: bench 100 x 10 scores
 * the 85th percentile (confidence 0.76) and 80 x 3 the 27.06th (0.812). Sent together, the
 * database keeps the more confident triple and the chest reads 27.35; sent the best alone, 84.67.
 */
describe("Which observation speaks for an exercise", () => {
  const twoBenchSets = () => fakeClient({
    scoreProfile: vi.fn(async () => ({
      status: "ok",
      exercise_scores: [exerciseScore(BENCH, 85, "Barbell Bench Press", 0.76), exerciseScore(BENCH, 27.06, "Barbell Bench Press", 0.812)],
      estimated_only: [],
      failures: [],
    })),
  });
  const pecOf = (result: Awaited<ReturnType<typeof scoreMuscleProfile>>) => {
    if (result.status === "unavailable") throw new Error("expected a profile");
    return result.muscles.find((m) => m.canonicalName === "pectoralis_major_sternocostal")!;
  };

  it("aggregates the best-placed set, not the most confident one", async () => {
    const result = await scoreMuscleProfile(twoBenchSets(), catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80, 100, 10), lift("Barbell Bench Press", 1, 80, 80, 3)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(pecOf(result).evidence).toHaveLength(1);
    expect(pecOf(result).evidence[0].exercisePercentile).toBe(85);
    // Both lifts were scored; one speaks for the exercise.
    expect(result.counts.scored).toBe(2);
  });

  it("never lowers an exercise's evidence when a weaker set is added", async () => {
    const strongOnly = fakeClient({ scoreProfile: vi.fn(async () => ({ status: "ok", exercise_scores: [exerciseScore(BENCH, 85, "Barbell Bench Press", 0.76)], estimated_only: [], failures: [] })) });
    const alone = await scoreMuscleProfile(strongOnly, catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80, 100, 10)] });
    const withWeaker = await scoreMuscleProfile(twoBenchSets(), catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80, 100, 10), lift("Barbell Bench Press", 1, 80, 80, 3)] });
    expect(pecOf(withWeaker).percentile).toBe(pecOf(alone).percentile);
    expect(pecOf(withWeaker).confidence01).toBe(pecOf(alone).confidence01);
  });
});

/**
 * EN-09, recorded live on 28 September 2026: a Pull-Up scored 15.71 at 80 kg for 5 reps with
 * 20 kg added and without - the rep curve cannot see added load. Reps alone score as a rep test
 * (12 reps: the 45th percentile across 12 muscles).
 */
describe("A movement scored on reps", () => {
  it("is sent as reps alone when no weight was added", async () => {
    const client = fakeClient();
    await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [lift("Pull-Up", 66, 80, 0, 12)] });
    expect(client.scoreProfile.mock.calls[0][2]).toEqual([{ exercise_id: PULL_UP, reps: 12, exercise_name: "Pull-Up" }]);
  });

  it("reports a set with added weight as not scored, instead of ranking it as if the weight were not there", async () => {
    const client = fakeClient();
    const result = await scoreMuscleProfile(client, catalog, { sex: "male", lifts: [lift("Pull-Up", 66, 80, 20, 5), lift("Barbell Bench Press", 1, 80)] });
    const sent = client.scoreProfile.mock.calls.flatMap((call) => call[2] as { exercise_name: string }[]);
    expect(sent.map((observation) => observation.exercise_name)).toEqual(["Barbell Bench Press"]);
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.unranked).toContainEqual({ exerciseName: "Pull-Up", reason: "added_load_not_scored" });
    expect(result.status).toBe("partial");
  });

  it("asks for the weight of a loaded exercise sent without one", async () => {
    const result = await scoreMuscleProfile(fakeClient(), catalog, { sex: "male", lifts: [lift("Barbell Bench Press", 1, 80, 0, 5)] });
    if (result.status === "unavailable") throw new Error("expected a profile");
    expect(result.unranked).toEqual([{ exerciseName: "Barbell Bench Press", reason: "load_required" }]);
  });
});
