/**
 * Muscle strength aggregation, on the server (D-016).
 *
 * The muscle ranks used to be aggregated by the database's `aggregate_muscle_strength_v1`.
 * That function is transcribed here step for step - the same clamps, latents, role transfers,
 * weights, redundancy decay, confidence and rounding - and held to its recorded outputs by
 * `muscleAggregation.parity.test.ts` (`server/fixtures/liveMuscleAggregation.ts`). With the
 * `directness` option off, this function *is* that function, to the rounding it reports.
 *
 * One rule is added on top, which the database function does not have:
 *
 *   A lift counts for more the more of its work the muscle does.
 *
 * The database weighs every lift by its role for the muscle, its mapping confidence, its own
 * confidence and the square root of its contribution weight. Nothing in that says how many
 * other muscles share the lift. A bench press reads the sternocostal pec through a lift that
 * five other movers carry with it; a pec deck fly reads it through a lift it does nearly half
 * of on its own. Both were "primary" at 0.95 and 0.98, so the fly and the press weighed the
 * same, and whichever set happened to be the more confident (a heavy triple over a set of
 * twelve, say) spoke first for the chest - with the other decayed to 0.55 (EN-01's cousin,
 * seen on the owner's own chest rank: fly 86th, presses 60th and 67th, chest Regional).
 *
 * Directness is the mapping's contribution weight as a share of the exercise's mover
 * contribution (primary and secondary roles; a stabilizer mapping adds its own weight to that
 * sum so a share never passes 1). It is the database's own numbers in a ratio, not a new
 * coefficient. It multiplies the evidence weight, and it decides who leads within a movement
 * pattern: the most direct, best-supported lift takes redundancy rank 1 and the rest decay.
 *
 * What it does not change:
 * - the percentile each lift brings (the transfer through the role is the database's);
 * - the confidence: that is still the database's reading of how much evidence there is, from
 *   the undirected weights, so no label moves between Low, Moderate and High for this;
 * - a rank drawn from lifts of equal directness (three presses, one fly, one lift): the
 *   factor cancels in the weighted mean and the order within the pattern is unchanged.
 *
 * Every constant below is the database's (EN-17: their sources are unrecorded there too).
 */

export const MUSCLE_AGGREGATION_VERSION = "sg_muscle_aggregate_v2" as const;
export const MUSCLE_AGGREGATION_METHOD = "directness_weighted_latent_evidence_with_redundancy_decay" as const;

/** The database function this transcribes, and the labels it reports for itself. */
export const DATABASE_AGGREGATION = {
  function: "aggregate_muscle_strength_v1",
  scoringVersion: "strength_beta_v1",
  method: "role_and_contribution_attenuated_latent_evidence_with_redundancy_decay",
} as const;

export type ExerciseScoreInput = { exercise_id: string; percentile: number; confidence?: number | null };

/** `exercise_muscle_mappings`, as PostgREST returns it (numerics may arrive as strings). */
export type MappingRow = {
  exercise_id: string;
  muscle_id: string;
  role: string | null;
  contribution_weight: number | string | null;
  confidence_score: number | string | null;
};

export type MuscleRow = { id: string; name: string; canonical_name: string; region?: string | null; muscle_group?: string | null };

export type AggregationExerciseRow = { id: string; name: string; movement_pattern?: string | null };

export type AggregationTables = {
  mappings: readonly MappingRow[];
  muscles: readonly MuscleRow[];
  exercises: readonly AggregationExerciseRow[];
};

export type AggregatedEvidence = {
  exercise_id: string;
  exercise_name: string;
  movement_pattern: string | null;
  role: string | null;
  exercise_percentile: number;
  transferred_percentile: number;
  signal_transfer: number;
  observation_confidence: number;
  contribution_weight: number;
  mapping_confidence: number;
  redundancy_rank: number;
  redundancy_factor: number;
  effective_weight: number;
  /** This muscle's share of the exercise's mover contribution, 0-1 (D-016). */
  directness: number;
  /** This lift's share of the muscle's total evidence weight, 0-1: what it carried of the rank. */
  weight_share: number;
};

export type AggregatedMuscle = {
  muscle_id: string;
  muscle_name: string;
  muscle_canonical_name: string;
  region: string | null;
  muscle_group: string | null;
  strength_percentile: number;
  confidence: number;
  evidence_count: number;
  movement_pattern_count: number;
  evidence: AggregatedEvidence[];
};

export type AggregationResult = {
  status: "ok" | "no_evidence";
  scoring_version: string;
  aggregation_method: string;
  muscles: AggregatedMuscle[];
};

/* ------------------------------------------------------------------------------------------ */

const LATENT_SCALE = 1.702;
const REDUNDANCY_DECAY = 0.55;
const CONFIDENCE_RATE = 1.25;
const CONFIDENCE_CAP = 0.98;
const DEFAULT_OBSERVATION_CONFIDENCE = 0.65;
const DEFAULT_MAPPING_CONFIDENCE = 0.65;
const DEFAULT_CONTRIBUTION = { primary: 0.75, secondary: 0.4, other: 0.2 } as const;
const ROLE_WEIGHT = { primary: 1.0, secondary: 0.75, other: 0.35 } as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** `sg_percentile_to_latent_v1`: the logit of the percentile, clamped to [1, 99], over 1.702. */
export function percentileToLatent(percentile: number): number {
  const p = clamp(percentile, 1, 99) / 100;
  return Math.log(p / (1 - p)) / LATENT_SCALE;
}

/** `sg_latent_to_percentile_v1`. */
export function latentToPercentile(latent: number): number {
  return 100 / (1 + Math.exp(-LATENT_SCALE * latent));
}

/**
 * The key two exercises share when their movement patterns match, exactly as the database
 * builds it: non-alphanumerics to "_" *before* lower-casing, so "Horizontal push" keys as
 * "_orizontal_push". Kept verbatim: the key is only ever compared with itself, and matching
 * the database's grouping matters more than a tidy string. No pattern: the exercise's own id.
 */
export function movementKey(exercise: AggregationExerciseRow): string {
  const pattern = exercise.movement_pattern ?? "";
  const key = pattern.replace(/[^a-z0-9]+/g, "_").toLowerCase();
  return key === "" ? exercise.id : key;
}

const numberOf = (value: unknown): number | null => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};

type RoleKind = "primary" | "secondary" | "other";
const roleKind = (role: string | null): RoleKind => (role === "primary" || role === "secondary" ? role : "other");

/** The database reads a score above 1 as a percentage. */
function mappingConfidenceOf(raw: unknown): number {
  const value = numberOf(raw);
  if (value === null) return DEFAULT_MAPPING_CONFIDENCE;
  return value > 1 ? value / 100 : value;
}

function contributionOf(raw: unknown, kind: RoleKind): number {
  return numberOf(raw) ?? DEFAULT_CONTRIBUTION[kind];
}

function signalTransfer(rawContribution: unknown, kind: RoleKind): number {
  const cw = numberOf(rawContribution);
  if (kind === "primary") return Math.min(1.0, 0.70 + 0.30 * (cw ?? 0.75));
  if (kind === "secondary") return Math.min(0.80, 0.25 + 0.60 * (cw ?? 0.40));
  return Math.min(0.35, 0.05 + 0.35 * (cw ?? 0.20));
}

const round = (value: number, places: number) => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};

/**
 * How directly an exercise reads one of its muscles: that mapping's contribution weight as a
 * share of the exercise's mover contribution. Primary and secondary mappings are the movers;
 * a stabilizer's own weight is added to the sum for its share, so every share is in (0, 1].
 * An exercise mapped to one mover alone reads it at 1.
 */
export function directnessOf(mapping: MappingRow, exerciseMappings: readonly MappingRow[]): number {
  const kind = roleKind(mapping.role);
  const own = contributionOf(mapping.contribution_weight, kind);
  let movers = 0;
  for (const other of exerciseMappings) {
    const otherKind = roleKind(other.role);
    if (otherKind !== "other") movers += contributionOf(other.contribution_weight, otherKind);
  }
  const total = kind === "other" ? movers + own : movers;
  return total > 0 ? clamp(own / total, 0, 1) : 1;
}

/* ------------------------------------------------------------------------------------------ */

type Mapped = {
  muscle: MuscleRow;
  exercise: AggregationExerciseRow;
  key: string;
  role: string | null;
  percentile: number;
  observationConfidence: number;
  contribution: number;
  mappingConfidence: number;
  latent: number;
  transfer: number;
  baseWeight: number;
  directness: number;
};

/**
 * `aggregate_muscle_strength_v1`, with directness (D-016) unless switched off.
 *
 * `scores` are one per exercise as the server sends them; should two arrive for one exercise,
 * the database's own rule applies (the more confident, then the better placed), so the
 * transcription is complete.
 */
export function aggregateMuscleStrength(scores: readonly ExerciseScoreInput[], tables: AggregationTables, options: { directness?: boolean } = {}): AggregationResult {
  const directness = options.directness ?? true;

  // raw + dedup
  const best = new Map<string, { percentile: number; confidence: number }>();
  for (const score of scores) {
    const percentile = numberOf(score?.percentile);
    if (typeof score?.exercise_id !== "string" || percentile === null) continue;
    const entry = { percentile: clamp(percentile, 1, 99), confidence: clamp(numberOf(score.confidence) ?? DEFAULT_OBSERVATION_CONFIDENCE, 0, 1) };
    const current = best.get(score.exercise_id);
    if (!current || entry.confidence > current.confidence || (entry.confidence === current.confidence && entry.percentile > current.percentile)) best.set(score.exercise_id, entry);
  }

  const muscleById = new Map(tables.muscles.map((muscle) => [muscle.id, muscle]));
  const exerciseById = new Map(tables.exercises.map((exercise) => [exercise.id, exercise]));
  const mappingsByExercise = new Map<string, MappingRow[]>();
  for (const mapping of tables.mappings) mappingsByExercise.set(mapping.exercise_id, [...(mappingsByExercise.get(mapping.exercise_id) ?? []), mapping]);

  // mapped + transferred
  const mapped: Mapped[] = [];
  best.forEach((score, exerciseId) => {
    const exercise = exerciseById.get(exerciseId);
    const exerciseMappings = mappingsByExercise.get(exerciseId) ?? [];
    if (!exercise) return;
    for (const mapping of exerciseMappings) {
      const muscle = muscleById.get(mapping.muscle_id);
      if (!muscle) continue;
      const kind = roleKind(mapping.role);
      const contribution = contributionOf(mapping.contribution_weight, kind);
      const mappingConfidence = mappingConfidenceOf(mapping.confidence_score);
      mapped.push({
        muscle, exercise, key: movementKey(exercise), role: mapping.role,
        percentile: score.percentile, observationConfidence: score.confidence,
        contribution, mappingConfidence,
        latent: percentileToLatent(score.percentile),
        transfer: signalTransfer(mapping.contribution_weight, kind),
        baseWeight: mappingConfidence * score.confidence * Math.sqrt(Math.max(0.05, contribution)) * ROLE_WEIGHT[kind],
        directness: directness ? directnessOf(mapping, exerciseMappings) : 1,
      });
    }
  });

  // ranked + weighted: within one muscle and movement pattern, the heaviest weight leads and
  // the rest decay. The database orders by base weight, then exercise id; with directness on,
  // the weight ordered by is the directed one.
  const rankWithin = (items: Mapped[], weightOf: (item: Mapped) => number) => {
    const groups = new Map<string, Mapped[]>();
    for (const item of items) groups.set(item.key, [...(groups.get(item.key) ?? []), item]);
    const rank = new Map<Mapped, number>();
    groups.forEach((group) => {
      [...group].sort((a, b) => weightOf(b) - weightOf(a) || a.exercise.id.localeCompare(b.exercise.id)).forEach((item, index) => rank.set(item, index + 1));
    });
    return rank;
  };

  const byMuscle = new Map<string, Mapped[]>();
  for (const item of mapped) byMuscle.set(item.muscle.id, [...(byMuscle.get(item.muscle.id) ?? []), item]);

  const muscles: AggregatedMuscle[] = [];
  byMuscle.forEach((items, muscleId) => {
    const directedWeight = (item: Mapped) => item.baseWeight * item.directness;
    const blendRank = rankWithin(items, directedWeight);
    // Confidence reads the evidence as the database does: undirected weights, in their order.
    const confidenceRank = directness ? rankWithin(items, (item) => item.baseWeight) : blendRank;

    let latentSum = 0;
    let effectiveTotal = 0;
    let confidenceTotal = 0;
    const rows: { item: Mapped; rank: number; factor: number; effective: number }[] = [];
    for (const item of items) {
      const rank = blendRank.get(item)!;
      const factor = REDUNDANCY_DECAY ** (rank - 1);
      const effective = directedWeight(item) * factor;
      if (!(effective > 0)) continue;
      rows.push({ item, rank, factor, effective });
      latentSum += item.latent * item.transfer * effective;
      effectiveTotal += effective;
      confidenceTotal += item.baseWeight * REDUNDANCY_DECAY ** (confidenceRank.get(item)! - 1);
    }
    if (rows.length === 0) return;
    const combinedLatent = latentSum / effectiveTotal;
    const first = rows[0].item;
    muscles.push({
      muscle_id: muscleId,
      muscle_name: first.muscle.name,
      muscle_canonical_name: first.muscle.canonical_name,
      region: first.muscle.region ?? null,
      muscle_group: first.muscle.muscle_group ?? null,
      strength_percentile: round(latentToPercentile(combinedLatent), 2),
      confidence: round(Math.min(CONFIDENCE_CAP, 1 - Math.exp(-CONFIDENCE_RATE * confidenceTotal)), 3),
      evidence_count: rows.length,
      movement_pattern_count: new Set(rows.map((row) => row.item.key)).size,
      evidence: rows
        .sort((a, b) => b.effective - a.effective || a.item.exercise.id.localeCompare(b.item.exercise.id))
        .map(({ item, rank, factor, effective }) => ({
          exercise_id: item.exercise.id,
          exercise_name: item.exercise.name,
          movement_pattern: item.exercise.movement_pattern ?? null,
          role: item.role,
          exercise_percentile: round(item.percentile, 2),
          transferred_percentile: round(latentToPercentile(item.latent * item.transfer), 2),
          signal_transfer: round(item.transfer, 3),
          observation_confidence: round(item.observationConfidence, 3),
          contribution_weight: round(item.contribution, 3),
          mapping_confidence: round(item.mappingConfidence, 3),
          redundancy_rank: rank,
          redundancy_factor: round(factor, 3),
          effective_weight: round(effective, 4),
          directness: round(item.directness, 3),
          weight_share: round(effective / effectiveTotal, 3),
        })),
    });
  });

  muscles.sort((a, b) => b.strength_percentile - a.strength_percentile || a.muscle_canonical_name.localeCompare(b.muscle_canonical_name));
  return {
    status: muscles.length === 0 ? "no_evidence" : "ok",
    scoring_version: directness ? MUSCLE_AGGREGATION_VERSION : DATABASE_AGGREGATION.scoringVersion,
    aggregation_method: directness ? MUSCLE_AGGREGATION_METHOD : DATABASE_AGGREGATION.method,
    muscles,
  };
}
