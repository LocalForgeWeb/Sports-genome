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

/** One lift's evidence for one muscle, weighed, before the scores are combined. */
type WeighedRow = { item: Mapped; rank: number; factor: number; effective: number };
type WeighedMuscle = { muscleId: string; rows: WeighedRow[]; effectiveTotal: number; confidenceTotal: number };

/**
 * The weighing both aggregations share, exactly as the database does it plus directness:
 * every exercise's mappings, each lift's base weight (mapping confidence × lift confidence ×
 * √contribution × role weight), directness, and the redundancy decay within a movement
 * pattern. `best` holds one score per exercise; `latentOf` gives the latent a row carries
 * (only the database transcription combines latents).
 */
function weighEvidence(best: ReadonlyMap<string, { percentile: number; confidence: number }>, tables: AggregationTables, directness: boolean): WeighedMuscle[] {
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

  const weighed: WeighedMuscle[] = [];
  byMuscle.forEach((items, muscleId) => {
    const directedWeight = (item: Mapped) => item.baseWeight * item.directness;
    const blendRank = rankWithin(items, directedWeight);
    // Confidence reads the evidence as the database does: undirected weights, in their order.
    const confidenceRank = directness ? rankWithin(items, (item) => item.baseWeight) : blendRank;
    let effectiveTotal = 0;
    let confidenceTotal = 0;
    const rows: WeighedRow[] = [];
    for (const item of items) {
      const rank = blendRank.get(item)!;
      const factor = REDUNDANCY_DECAY ** (rank - 1);
      const effective = directedWeight(item) * factor;
      // A weight that is zero, negative or not a number is no evidence: left out of the
      // numerator and the denominator alike, so it can neither pull the score nor dilute it.
      if (!(effective > 0) || !Number.isFinite(effective)) continue;
      rows.push({ item, rank, factor, effective });
      effectiveTotal += effective;
      confidenceTotal += item.baseWeight * REDUNDANCY_DECAY ** (confidenceRank.get(item)! - 1);
    }
    if (rows.length) weighed.push({ muscleId, rows, effectiveTotal, confidenceTotal });
  });
  return weighed;
}

const confidenceOf = (confidenceTotal: number) => Math.min(CONFIDENCE_CAP, 1 - Math.exp(-CONFIDENCE_RATE * confidenceTotal));

/**
 * `aggregate_muscle_strength_v1`, with directness (D-016) unless switched off.
 *
 * Kept as the database's transcription and pinned to its recorded outputs. The app no longer
 * ranks with it (it multiplies each lift's logit by a role transfer below 1 before averaging,
 * so two lifts at the 95th become a 94th, and a lift above its curve is entered at the anchor):
 * see `aggregateMuscleBenchmarkScores`.
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

  const muscles: AggregatedMuscle[] = [];
  for (const { rows, effectiveTotal, confidenceTotal } of weighEvidence(best, tables, directness)) {
    const latentSum = rows.reduce((sum, { item, effective }) => sum + item.latent * item.transfer * effective, 0);
    const combinedLatent = latentSum / effectiveTotal;
    const first = rows[0].item;
    muscles.push({
      muscle_id: first.muscle.id,
      muscle_name: first.muscle.name,
      muscle_canonical_name: first.muscle.canonical_name,
      region: first.muscle.region ?? null,
      muscle_group: first.muscle.muscle_group ?? null,
      strength_percentile: round(latentToPercentile(combinedLatent), 2),
      confidence: round(confidenceOf(confidenceTotal), 3),
      evidence_count: rows.length,
      movement_pattern_count: new Set(rows.map((row) => row.item.key)).size,
      evidence: [...rows]
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
  }

  muscles.sort((a, b) => b.strength_percentile - a.strength_percentile || a.muscle_canonical_name.localeCompare(b.muscle_canonical_name));
  return {
    status: muscles.length === 0 ? "no_evidence" : "ok",
    scoring_version: directness ? MUSCLE_AGGREGATION_VERSION : DATABASE_AGGREGATION.scoringVersion,
    aggregation_method: directness ? MUSCLE_AGGREGATION_METHOD : DATABASE_AGGREGATION.method,
    muscles,
  };
}

/* ------------------------------------------------------------------------------------------
 * v3: the weighted benchmark score, bound-aware (percentile-ceiling brief, 13 October 2026)
 * ---------------------------------------------------------------------------------------- */

export const MUSCLE_BENCHMARK_VERSION = "sg_muscle_benchmark_v3" as const;
export const MUSCLE_BENCHMARK_METHOD = "directness_weighted_benchmark_score_bounded" as const;

/** Where one lift stands against its curve: inside it, or only bounded by an end anchor. */
export type PercentileBound = "exact" | "above" | "below";

export type BoundedScoreInput = {
  exercise_id: string;
  /** The interpolated percentile, or the anchor percentile the lift is beyond (`bound`). */
  percentile: number;
  bound: PercentileBound;
  confidence?: number | null;
  /** The lift as placed on the curve, and the anchor value it was compared with. */
  observed_value?: number | null;
  benchmark_value?: number | null;
  value_unit?: string | null;
  /** True when `observed_value` was scaled for age before it was placed (the lift itself was not). */
  age_scaled?: boolean;
  /** The load and reps that produced this score, so the sheet can name the lift. */
  load_kg?: number | null;
  repetitions?: number | null;
};

export type BenchmarkEvidence = {
  exercise_id: string;
  exercise_name: string;
  movement_pattern: string | null;
  role: string | null;
  exercise_percentile: number;
  bound: PercentileBound;
  /** What the lift counts as for this muscle, low and high; equal when exact. */
  counted_low: number;
  counted_high: number;
  /** 1 for a prime mover; the database's role transfer for a supporting role. */
  signal_transfer: number;
  observed_value: number | null;
  benchmark_value: number | null;
  value_unit: string | null;
  age_scaled: boolean;
  load_kg: number | null;
  repetitions: number | null;
  observation_confidence: number;
  contribution_weight: number;
  mapping_confidence: number;
  redundancy_rank: number;
  redundancy_factor: number;
  effective_weight: number;
  directness: number;
  /** This lift's share of the muscle's total evidence weight, unrounded: the score's weights. */
  weight_share: number;
};

export type ScoreBound = "exact" | "at_least" | "at_most" | "range";

export type BenchmarkMuscle = {
  muscle_id: string;
  muscle_name: string;
  muscle_canonical_name: string;
  region: string | null;
  muscle_group: string | null;
  /** The score when exact; its lower bound when not. The rank is read from this. */
  strength_percentile: number;
  score_bound: ScoreBound;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  evidence_count: number;
  movement_pattern_count: number;
  evidence: BenchmarkEvidence[];
};

export type BenchmarkResult = {
  status: "ok" | "no_evidence";
  scoring_version: typeof MUSCLE_BENCHMARK_VERSION;
  aggregation_method: typeof MUSCLE_BENCHMARK_METHOD;
  muscles: BenchmarkMuscle[];
};

const BOUND_ORDER: Record<PercentileBound, number> = { below: -1, exact: 0, above: 1 };

/**
 * Which of two scores for one exercise speaks for it: the better placed. A lift above the top
 * anchor outranks an exact one at that anchor, and of two lifts both above it the one placed
 * further past it wins - they are not a tie at 95. Then the more confident, as before.
 */
export function betterScore(a: Pick<BoundedScoreInput, "percentile" | "bound" | "observed_value" | "confidence">, b: Pick<BoundedScoreInput, "percentile" | "bound" | "observed_value" | "confidence">): boolean {
  if (a.percentile !== b.percentile) return a.percentile > b.percentile;
  if (a.bound !== b.bound) return BOUND_ORDER[a.bound] > BOUND_ORDER[b.bound];
  const observedA = numberOf(a.observed_value) ?? -Infinity;
  const observedB = numberOf(b.observed_value) ?? -Infinity;
  if (observedA !== observedB) return observedA > observedB;
  return (numberOf(a.confidence) ?? 0) > (numberOf(b.confidence) ?? 0);
}

/** What a percentile counts as through a supporting role: the database's latent transfer. */
const transferred = (percentile: number, transfer: number) => transfer >= 1 ? percentile : latentToPercentile(percentileToLatent(percentile) * transfer);

/**
 * Each muscle's weighted benchmark score.
 *
 *   score = Σ wᵢ · cᵢ / Σ wᵢ
 *
 * - wᵢ is the lift's evidence weight, the same weight v2 used (mapping confidence × lift
 *   confidence × √contribution × role weight × directness × redundancy decay), normalised
 *   over the lifts actually included: an excluded or zero-weight lift is in neither sum.
 * - cᵢ is what the lift counts as for this muscle. A prime mover's lift counts at its own
 *   percentile - it is the measurement. A lift the muscle only assists counts through the
 *   database's role transfer (unchanged, and shown on the sheet): its logit is scaled by the
 *   transfer, which pulls it toward the 50th, so a row cannot hand the biceps the row's rank.
 *
 * So the score is a plain weighted mean of numbers the sheet shows: two prime-mover lifts at
 * the 95th give 95, and the score always lies between the lowest and highest counted values.
 *
 * Bounds: a lift above its highest anchor counts as anywhere in (anchor, 100]; below its
 * lowest, in [0, anchor). The weights are fixed and non-negative, so the score's bounds are
 * the same weighted means of the ends - an exact score where every lift is exact, otherwise
 * `lower_bound`..`upper_bound`. Nothing is extrapolated past an anchor.
 *
 * Confidence is v2's, from the undirected weights; it never moves the score.
 */
export function aggregateMuscleBenchmarkScores(scores: readonly BoundedScoreInput[], tables: AggregationTables, options: { directness?: boolean } = {}): BenchmarkResult {
  const directness = options.directness ?? true;

  // One score per exercise: the better placed. Invalid scores are left out, never clamped in.
  const chosen = new Map<string, BoundedScoreInput & { confidence: number }>();
  for (const score of scores) {
    const percentile = numberOf(score?.percentile);
    if (typeof score?.exercise_id !== "string" || percentile === null || percentile < 0 || percentile > 100) continue;
    if (score.bound !== "exact" && score.bound !== "above" && score.bound !== "below") continue;
    const entry = { ...score, percentile, confidence: clamp(numberOf(score.confidence) ?? DEFAULT_OBSERVATION_CONFIDENCE, 0, 1) };
    const current = chosen.get(score.exercise_id);
    if (!current || betterScore(entry, current)) chosen.set(score.exercise_id, entry);
  }
  const best = new Map(Array.from(chosen.entries()).map(([id, score]) => [id, { percentile: score.percentile, confidence: score.confidence }]));

  const muscles: BenchmarkMuscle[] = [];
  for (const { rows, effectiveTotal, confidenceTotal } of weighEvidence(best, tables, directness)) {
    const evidence: BenchmarkEvidence[] = rows.map(({ item, rank, factor, effective }) => {
      const source = chosen.get(item.exercise.id)!;
      // A prime mover's lift is the measurement; a supporting role keeps the database's transfer.
      const transfer = roleKind(item.role) === "primary" ? 1 : item.transfer;
      const [rawLow, rawHigh] = source.bound === "above" ? [source.percentile, 100] : source.bound === "below" ? [0, source.percentile] : [source.percentile, source.percentile];
      return {
        exercise_id: item.exercise.id,
        exercise_name: item.exercise.name,
        movement_pattern: item.exercise.movement_pattern ?? null,
        role: item.role,
        exercise_percentile: source.percentile,
        bound: source.bound,
        counted_low: transferred(rawLow, transfer),
        counted_high: transferred(rawHigh, transfer),
        signal_transfer: transfer,
        observed_value: numberOf(source.observed_value),
        benchmark_value: numberOf(source.benchmark_value),
        value_unit: typeof source.value_unit === "string" ? source.value_unit : null,
        age_scaled: source.age_scaled === true,
        load_kg: numberOf(source.load_kg),
        repetitions: numberOf(source.repetitions),
        observation_confidence: item.observationConfidence,
        contribution_weight: item.contribution,
        mapping_confidence: item.mappingConfidence,
        redundancy_rank: rank,
        redundancy_factor: factor,
        effective_weight: effective,
        directness: item.directness,
        weight_share: effective / effectiveTotal,
      };
    });
    // A weighted mean lies between its smallest and largest term; holding it there keeps float
    // error from carrying identical lifts at 95 down to 94.99999999999999, and into State.
    const weightedMean = (values: number[]) => clamp(
      evidence.reduce((sum, row, index) => sum + row.effective_weight * values[index], 0) / effectiveTotal,
      Math.min(...values), Math.max(...values),
    );
    const lower = weightedMean(evidence.map((row) => row.counted_low));
    const upper = weightedMean(evidence.map((row) => row.counted_high));
    const bounds = new Set(evidence.map((row) => row.bound));
    const scoreBound: ScoreBound = bounds.size === 1 && bounds.has("exact") ? "exact"
      : bounds.size === 1 && bounds.has("above") ? "at_least"
        : bounds.size === 1 && bounds.has("below") ? "at_most"
          : "range";
    // Floating error must not open a gap in an exact score, or close one in a bound.
    const exactValue = scoreBound === "exact" ? lower : null;
    const first = rows[0].item;
    muscles.push({
      muscle_id: first.muscle.id,
      muscle_name: first.muscle.name,
      muscle_canonical_name: first.muscle.canonical_name,
      region: first.muscle.region ?? null,
      muscle_group: first.muscle.muscle_group ?? null,
      strength_percentile: exactValue ?? lower,
      score_bound: scoreBound,
      lower_bound: exactValue ?? lower,
      upper_bound: exactValue ?? Math.max(lower, upper),
      confidence: round(confidenceOf(confidenceTotal), 3),
      evidence_count: rows.length,
      movement_pattern_count: new Set(rows.map((row) => row.item.key)).size,
      evidence: evidence.sort((a, b) => b.effective_weight - a.effective_weight || a.exercise_id.localeCompare(b.exercise_id)),
    });
  }

  muscles.sort((a, b) => b.strength_percentile - a.strength_percentile || a.muscle_canonical_name.localeCompare(b.muscle_canonical_name));
  return { status: muscles.length === 0 ? "no_evidence" : "ok", scoring_version: MUSCLE_BENCHMARK_VERSION, aggregation_method: MUSCLE_BENCHMARK_METHOD, muscles };
}
