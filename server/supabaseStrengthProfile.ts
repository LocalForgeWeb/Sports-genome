import { supabaseServiceHeaders } from "./supabaseServiceHeaders";
import {
  MUSCLE_CONFIDENCE_CALIBRATION_VERSION,
  RANK_SCHEME_VERSION,
  type MuscleEvidence,
  type MuscleScore,
} from "../shared/capabilityRank";

/**
 * Per-muscle strength percentiles for Body Lab's Strength/Rank mode.
 *
 * The canonical path is `score_strength_profile_v1`, which scores each lift and hands the
 * results to `aggregate_muscle_strength_v1`. That function takes one body weight for every
 * lift, and the app's rule is that a lift is read against the weight saved with it - change
 * your weight today and last month's bench does not move. So lifts are grouped by that saved
 * weight, each group is scored by the profile function exactly as written, and the scored
 * exercises from every group are aggregated once. The scoring and the aggregation are both the
 * database's; only the body weight is threaded per lift.
 *
 * `score_strength_profile_v2` is deliberately not used. It feeds heuristic
 * `strength_genome_score` values into the same aggregation as though they were percentiles,
 * and the aggregation's per-muscle evidence carries no evidence type - so a muscle drawn from
 * nothing but a heuristic would arrive indistinguishable from a measured one, and take a rank
 * colour it has no percentile to justify.
 */

export type MuscleProfileLift = {
  catalogExerciseId?: number | null;
  exerciseName: string;
  loadKg: number;
  repetitions: number;
  /** The body weight saved with this lift, not today's. */
  bodyMassKg: number | null;
};

export type MuscleProfileRequest = { sex: "male" | "female" | null; lifts: readonly MuscleProfileLift[] };

/** Mirrors `score_strength_profile_v1`'s own statuses; they stay visible rather than collapsing to ok. */
export type ProfileStatus = "ok" | "partial" | "estimates_only" | "no_scored_observations";

export type ProfileFailure = { exerciseName: string; reason: string };

export type ReferenceGroup = { label: string; sex: "male" | "female" };

export type MuscleProfileResult =
  | { status: "unavailable"; reason: "sex_required" | "no_lifts" | "not_configured" | "service_error" }
  | {
      status: ProfileStatus;
      scoringVersion: string;
      rankSchemeVersion: typeof RANK_SCHEME_VERSION;
      confidenceCalibrationVersion: typeof MUSCLE_CONFIDENCE_CALIBRATION_VERSION;
      muscles: MuscleScore[];
      counts: { scored: number; estimatedOnly: number; failed: number };
      /**
       * Every lift that is not behind any rank, by name and reason - failures and estimate-only
       * results alike - so a partial profile can be inspected rather than silently thinned.
       */
      unranked: ProfileFailure[];
      /** Muscles the aggregation returned that failed validation and were not drawn. */
      rejectedMuscles: number;
    };

type ExerciseRow = { id: string; name: string; canonical_name: string };

function comparableName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function catalogIdOf(canonicalName: string): number | null {
  const match = /__catalog_(\d+)$/.exec(canonicalName.trim());
  return match ? Number(match[1]) : null;
}

/** Catalog id first, because it cannot be wrong; the display name only as a fallback. */
export function findProfileExercise(index: readonly ExerciseRow[], lift: Pick<MuscleProfileLift, "catalogExerciseId" | "exerciseName">): ExerciseRow | null {
  if (lift.catalogExerciseId) {
    const byId = index.find((row) => catalogIdOf(row.canonical_name) === lift.catalogExerciseId);
    if (byId) return byId;
  }
  const wanted = comparableName(lift.exerciseName);
  return wanted ? index.find((row) => comparableName(row.name) === wanted) ?? null : null;
}

const isFiniteIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const numberOf = (value: unknown): number | null => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};

/**
 * One muscle from the aggregation, or null if it is not safe to draw.
 *
 * The scale is checked, not assumed: a percentile outside 0-100 or a confidence outside 0-1
 * is refused rather than clamped, since either is a sign the contract moved underneath.
 */
export function validateMuscle(raw: unknown, referenceByExerciseId: ReadonlyMap<string, ReferenceGroup>): MuscleScore | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const percentile = numberOf(row.strength_percentile);
  const confidence01 = numberOf(row.confidence);
  const evidenceCount = numberOf(row.evidence_count);
  if (typeof row.muscle_id !== "string" || typeof row.muscle_canonical_name !== "string") return null;
  if (!isFiniteIn(percentile, 0, 100) || !isFiniteIn(confidence01, 0, 1)) return null;
  if (evidenceCount === null || evidenceCount < 1) return null;
  const evidenceRows = Array.isArray(row.evidence) ? row.evidence as Record<string, unknown>[] : [];
  const evidence: MuscleEvidence[] = evidenceRows.map((item) => ({
    exerciseName: typeof item.exercise_name === "string" ? item.exercise_name : "Logged lift",
    role: typeof item.role === "string" ? item.role : null,
    exercisePercentile: numberOf(item.exercise_percentile),
  }));
  const groups = new Map<string, ReferenceGroup>();
  evidenceRows.forEach((item) => {
    const group = typeof item.exercise_id === "string" ? referenceByExerciseId.get(item.exercise_id) : undefined;
    if (group) groups.set(`${group.sex}|${group.label}`, group);
  });
  return {
    muscleId: row.muscle_id,
    canonicalName: row.muscle_canonical_name,
    name: typeof row.muscle_name === "string" ? row.muscle_name : row.muscle_canonical_name,
    percentile,
    confidence01,
    evidenceCount,
    movementPatternCount: numberOf(row.movement_pattern_count) ?? evidenceCount,
    evidence,
    referenceGroups: Array.from(groups.values()),
  };
}

/** `score_strength_profile_v1`'s status rule, over the counts summed across body-weight groups. */
export function profileStatus(scored: number, estimatedOnly: number, failed: number): ProfileStatus {
  if (scored > 0 && (estimatedOnly > 0 || failed > 0)) return "partial";
  if (scored > 0) return "ok";
  if (estimatedOnly > 0 && failed === 0) return "estimates_only";
  if (estimatedOnly > 0) return "partial";
  return "no_scored_observations";
}

export function createSupabaseStrengthProfileClient({ url, serviceRoleKey, fetchImplementation = fetch }: { url: string; serviceRoleKey: string; fetchImplementation?: typeof fetch }) {
  const baseUrl = url.replace(/\/+$/, "");
  const rpc = async (name: string, body: unknown) => {
    const response = await fetchImplementation(new URL(`/rest/v1/rpc/${name}`, baseUrl), {
      method: "POST",
      headers: supabaseServiceHeaders(serviceRoleKey, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Supabase ${name} failed (${response.status})`);
    return response.json() as Promise<unknown>;
  };

  return {
    async getExerciseIndex(): Promise<ExerciseRow[]> {
      const requestUrl = new URL("/rest/v1/exercises", baseUrl);
      requestUrl.searchParams.set("select", "id,name,canonical_name");
      requestUrl.searchParams.set("canonical_name", "like.*__catalog_*");
      const response = await fetchImplementation(requestUrl, { headers: supabaseServiceHeaders(serviceRoleKey) });
      if (!response.ok) throw new Error(`Supabase exercise index failed (${response.status})`);
      const rows = await response.json() as unknown;
      return Array.isArray(rows) ? rows.filter((row): row is ExerciseRow => typeof row?.id === "string" && typeof row?.canonical_name === "string") : [];
    },
    scoreProfile: (bodyweightKg: number, sex: "male" | "female", observations: unknown[]) =>
      rpc("score_strength_profile_v1", { p_bodyweight_kg: bodyweightKg, p_sex: sex, p_observations: observations }),
    aggregate: (compact: unknown[]) => rpc("aggregate_muscle_strength_v1", { p_exercise_scores: compact }),
  };
}

type ProfileClient = ReturnType<typeof createSupabaseStrengthProfileClient>;

/** The whole route, with the client injected so it can be exercised without a network. */
export async function scoreMuscleProfile(client: ProfileClient, index: readonly ExerciseRow[], request: MuscleProfileRequest): Promise<MuscleProfileResult> {
  if (!request.sex) return { status: "unavailable", reason: "sex_required" };
  if (request.lifts.length === 0) return { status: "unavailable", reason: "no_lifts" };
  const sex = request.sex;

  const failures: ProfileFailure[] = [];
  // Grouped to the tenth of a kilogram, which is finer than any scale an athlete reads.
  const groups = new Map<number, { exercise_id: string; load: number; unit: "kg"; reps: number; exercise_name: string }[]>();
  for (const lift of request.lifts) {
    const exercise = findProfileExercise(index, lift);
    if (!exercise) { failures.push({ exerciseName: lift.exerciseName, reason: "exercise_not_recognised" }); continue; }
    if (!lift.bodyMassKg || lift.bodyMassKg <= 0) { failures.push({ exerciseName: lift.exerciseName, reason: "body_mass_required" }); continue; }
    const key = Math.round(lift.bodyMassKg * 10) / 10;
    groups.set(key, [...(groups.get(key) ?? []), { exercise_id: exercise.id, load: lift.loadKg, unit: "kg", reps: lift.repetitions, exercise_name: exercise.name }]);
  }

  let scored = 0;
  let estimatedOnly = 0;
  let failed = failures.length;
  const compact: { exercise_id: string; percentile: number; confidence: number }[] = [];
  const referenceByExerciseId = new Map<string, ReferenceGroup>();

  const responses = await Promise.all(Array.from(groups.entries()).map(([bodyweightKg, observations]) =>
    client.scoreProfile(bodyweightKg, sex, observations).then((profile) => ({ profile, observations }))));

  for (const { profile, observations } of responses) {
    const body = (profile ?? {}) as Record<string, unknown>;
    if (body.status === "invalid_input") {
      observations.forEach((observation) => failures.push({ exerciseName: observation.exercise_name, reason: "invalid_input" }));
      failed += observations.length;
      continue;
    }
    const scores = Array.isArray(body.exercise_scores) ? body.exercise_scores as Record<string, any>[] : [];
    for (const score of scores) {
      const percentile = numberOf(score?.percentile?.percentile_estimate);
      const exerciseId = typeof score?.exercise_id === "string" ? score.exercise_id : score?.input_observation?.exercise_id;
      if (typeof exerciseId !== "string" || !isFiniteIn(percentile, 0, 100)) continue;
      compact.push({ exercise_id: exerciseId, percentile, confidence: numberOf(score?.overall_confidence) ?? 0.5 });
      const label = score?.percentile?.norm_source?.population_label;
      if (typeof label === "string" && label.trim()) referenceByExerciseId.set(exerciseId, { label: label.trim(), sex });
      scored += 1;
    }
    const estimates = Array.isArray(body.estimated_only) ? body.estimated_only as Record<string, any>[] : [];
    estimates.forEach((estimate) => failures.push({ exerciseName: estimate?.input_observation?.exercise_name ?? "Logged lift", reason: "estimated_only" }));
    estimatedOnly += estimates.length;
    const groupFailures = Array.isArray(body.failures) ? body.failures as Record<string, any>[] : [];
    groupFailures.forEach((failure) => failures.push({
      exerciseName: failure?.input_observation?.exercise_name ?? "Logged lift",
      reason: typeof failure?.reason === "string" ? failure.reason : "scoring_error",
    }));
    failed += groupFailures.length;
  }

  const aggregate = compact.length ? await client.aggregate(compact) as Record<string, unknown> : { status: "no_evidence", scoring_version: "strength_beta_v1", muscles: [] };
  const rawMuscles = Array.isArray(aggregate?.muscles) ? aggregate.muscles : [];
  const muscles = rawMuscles.map((raw) => validateMuscle(raw, referenceByExerciseId)).filter((m): m is NonNullable<typeof m> => m !== null);

  return {
    status: profileStatus(scored, estimatedOnly, failed),
    scoringVersion: typeof aggregate?.scoring_version === "string" ? aggregate.scoring_version : "unknown",
    rankSchemeVersion: RANK_SCHEME_VERSION,
    confidenceCalibrationVersion: MUSCLE_CONFIDENCE_CALIBRATION_VERSION,
    muscles,
    counts: { scored, estimatedOnly, failed },
    unranked: failures,
    rejectedMuscles: rawMuscles.length - muscles.length,
  };
}

const INDEX_TTL_MS = 5 * 60 * 1000;
const indexCache: { expiresAt: number; value: ExerciseRow[] } = { expiresAt: 0, value: [] };

function runtimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && serviceRoleKey ? createSupabaseStrengthProfileClient({ url, serviceRoleKey }) : null;
}

export async function getMuscleProfile(request: MuscleProfileRequest): Promise<MuscleProfileResult> {
  const client = runtimeClient();
  if (!client) return { status: "unavailable", reason: "not_configured" };
  try {
    if (indexCache.expiresAt <= Date.now()) {
      indexCache.value = await client.getExerciseIndex();
      indexCache.expiresAt = Date.now() + INDEX_TTL_MS;
    }
    return await scoreMuscleProfile(client, indexCache.value, request);
  } catch (error) {
    console.warn("[Supabase strength profile] unavailable", { message: error instanceof Error ? error.message : "Unknown error" });
    return { status: "unavailable", reason: "service_error" };
  }
}

/** Test seam. */
export function resetStrengthProfileCache() { indexCache.expiresAt = 0; indexCache.value = []; }
