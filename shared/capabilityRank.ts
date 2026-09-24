/**
 * Sports Genome capability ranks: the one definition every surface derives from.
 *
 * A muscle's strength percentile decides three things at once - the colour it takes on the
 * Body Lab map in Strength/Rank mode, the rank it is named, and the emblem that carries that
 * name. Keeping boundaries, names and colours in one versioned table is what stops the map
 * saying Regional while the detail says State for the same number.
 *
 * The bands are product categories, not estimates of how far apart the underlying lifts are.
 * A percentile is an ordering: 60 -> 80 is not "twenty units" of strength, and nothing here
 * should be drawn or narrated as though it were.
 *
 * Rank names are brand metaphors for ascent. None of them is a real title, selection or
 * competition credential, and the interface says so wherever a rank is explained.
 */

export const RANK_SCHEME_VERSION = "sg_capability_rank_v1" as const;

export type RankId = "prospect" | "jv" | "varsity" | "regional" | "state" | "national" | "world_stage";

export type RankDefinition = {
  id: RankId;
  /** Raw percentile, inclusive. */
  minInclusive: number;
  /** Raw percentile, exclusive; null only for the final band, which includes 100. */
  maxExclusive: number | null;
  shortName: string;
  fullName: string;
  /**
   * Candidate map fills from the brief, tuned separately per theme rather than inverted.
   * Components never read these directly: they use the CSS tokens `rankMapFillToken` names,
   * and a test holds the stylesheet to this table.
   */
  mapFill: { dark: string; light: string };
  /**
   * The emblem's colour on a badge, tuned against the badge surface rather than reused from
   * the map: at the brief's map values Prospect measured 2.30:1 and JV 2.94:1 on the detail
   * panel, below the 3:1 a graphical object needs. Same hue family, lightness solved to clear
   * 3:1 on both dark panels (#0b2240, #102f53) and on white, and still ordered.
   */
  badgeAccent: { dark: string; light: string };
  sortOrder: number;
};

export const RANKS: readonly RankDefinition[] = [
  { id: "prospect", minInclusive: 0, maxExclusive: 20, shortName: "Prospect", fullName: "Prospect", mapFill: { dark: "#306A8E", light: "#414487" }, badgeAccent: { dark: "#3D87B4", light: "#3A3D78" }, sortOrder: 0 },
  { id: "jv", minInclusive: 20, maxExclusive: 40, shortName: "JV", fullName: "Junior Varsity", mapFill: { dark: "#27808E", light: "#355F8D" }, badgeAccent: { dark: "#2E97A7", light: "#2C5076" }, sortOrder: 1 },
  { id: "varsity", minInclusive: 40, maxExclusive: 60, shortName: "Varsity", fullName: "Varsity", mapFill: { dark: "#1F958B", light: "#2A788E" }, badgeAccent: { dark: "#23A79B", light: "#226172" }, sortOrder: 2 },
  { id: "regional", minInclusive: 60, maxExclusive: 80, shortName: "Regional", fullName: "Regional Circuit", mapFill: { dark: "#25AB82", light: "#21918C" }, badgeAccent: { dark: "#27B589", light: "#1A716D" }, sortOrder: 3 },
  { id: "state", minInclusive: 80, maxExclusive: 95, shortName: "State", fullName: "State Circuit", mapFill: { dark: "#44BF70", light: "#22A884" }, badgeAccent: { dark: "#4EC378", light: "#1A8064" }, sortOrder: 4 },
  { id: "national", minInclusive: 95, maxExclusive: 99, shortName: "National", fullName: "National Circuit", mapFill: { dark: "#81D34D", light: "#4EC36B" }, badgeAccent: { dark: "#85D553", light: "#319048" }, sortOrder: 5 },
  { id: "world_stage", minInclusive: 99, maxExclusive: null, shortName: "World Stage", fullName: "World Stage", mapFill: { dark: "#ECE51B", light: "#B0DD2F" }, badgeAccent: { dark: "#ECE61F", light: "#7B9E1A" }, sortOrder: 6 },
];

export const rankById: ReadonlyMap<RankId, RankDefinition> = new Map(RANKS.map((rank) => [rank.id, rank]));

/**
 * The rank for a raw percentile on [0, 100], or null.
 *
 * Read on the raw value, before any display rounding: 19.999 is Prospect and 20 is JV, so a
 * "20th" printed from 19.6 still sits in Prospect with its Prospect colour. Anything outside
 * [0, 100], non-finite or not a number is not a rank - it is never clamped into the bottom
 * band, because a missing score drawn as Prospect tells an athlete they are weak when the
 * truth is that nothing was measured.
 */
export function rankForPercentile(value: unknown): RankDefinition | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) return null;
  return RANKS.find((rank) => value >= rank.minInclusive && (rank.maxExclusive === null || value < rank.maxExclusive)) ?? null;
}

/** CSS custom properties, one name per rank and purpose, so components never carry a hex. */
export const rankMapFillToken = (id: RankId) => `--sg-rank-${id.replace("_", "-")}-map-fill`;
export const rankBadgeAccentToken = (id: RankId) => `--sg-rank-${id.replace("_", "-")}-badge-accent`;

/** "0-19", "95-98", "99-100": the legend's labelled ranges, read off the same table. */
export function rankRangeLabel(rank: RankDefinition): string {
  return rank.maxExclusive === null ? `${rank.minInclusive}–100` : `${rank.minInclusive}–${rank.maxExclusive - 1}`;
}

/* -------------------------------------------------------------------------------------------
 * Confidence, as its own channel
 * ---------------------------------------------------------------------------------------- */

export const MUSCLE_CONFIDENCE_CALIBRATION_VERSION = "muscle_aggregate_structural_v1" as const;

export type ConfidenceLevel = "low" | "moderate" | "high";

export const confidenceLabel: Record<ConfidenceLevel, string> = {
  low: "Low confidence",
  moderate: "Moderate confidence",
  high: "High confidence",
};

/**
 * Thresholds on `aggregate_muscle_strength_v1`'s `confidence` (0-1), for that output family
 * only. The adopted confidence contract forbids one universal cut, so these are read off the
 * aggregation's own weight structure, measured across all 3,118 exercise-muscle mappings at
 * the highest observation confidence the scorer emits (0.84):
 *
 *   single exercise, supporting role  max 0.458
 *   single exercise, primary role     median 0.571, max 0.631
 *
 * Below 0.50 the muscle is being read only through supporting roles or a weak mapping: another
 * lift could plausibly move it a band. 0.80 is unreachable from any single exercise, so High
 * means at least two independent movement patterns agree - the smallest evidence that a
 * rank is not an artefact of one test.
 *
 * PROVISIONAL. This is structural, not a held-out measure of rank stability, which is what
 * the contract ultimately asks for. The version string exists so a calibrated replacement is
 * a visible change rather than a silent one.
 */
export const MUSCLE_CONFIDENCE_THRESHOLDS = { moderate: 0.5, high: 0.8 } as const;

/** `confidence01` is the aggregation's 0-1 weight, never a percentile - hence the name. */
export function muscleConfidenceLevel(confidence01: unknown): ConfidenceLevel | null {
  if (typeof confidence01 !== "number" || !Number.isFinite(confidence01) || confidence01 < 0 || confidence01 > 1) return null;
  if (confidence01 >= MUSCLE_CONFIDENCE_THRESHOLDS.high) return "high";
  if (confidence01 >= MUSCLE_CONFIDENCE_THRESHOLDS.moderate) return "moderate";
  return "low";
}

/* -------------------------------------------------------------------------------------------
 * Database muscles -> Body Lab regions
 * ---------------------------------------------------------------------------------------- */

/**
 * `muscles.canonical_name` in the canonical project -> the Body Lab region that draws it.
 *
 * Keyed on the canonical name, never the display name, and never on array position. Written
 * out in full so every one of the 58 muscles is a visible decision: the decisions follow the
 * app's existing catalog vocabulary map (`catalogMuscleRegionIds`) - rotator cuff to
 * shoulders, serratus to chest, trapezius to upper back, brachialis to biceps - and the
 * database's own `muscle_group` where the catalog is silent.
 *
 * `null` is deliberate: the deep posterior leg, the fibularis pair and quadratus lumborum
 * have no region of their own, and painting the calves with a tibialis-posterior score, or
 * the spinal erectors with a lateral trunk stabiliser, would claim a measurement the region
 * does not have. They still appear in a region's detail if the source ever maps them.
 */
export const muscleCanonicalNameToRegionId: Readonly<Record<string, string | null>> = {
  // Back
  latissimus_dorsi: "lats",
  teres_major: "lats",
  erector_spinae: "spinal_erectors",
  multifidus: "spinal_erectors",
  // Chest
  pectoralis_major_clavicular: "chest",
  pectoralis_major_sternocostal: "chest",
  pectoralis_minor: "chest",
  serratus_anterior: "chest",
  // Shoulder
  anterior_deltoid: "shoulders",
  middle_deltoid: "shoulders",
  posterior_deltoid: "shoulders",
  infraspinatus: "shoulders",
  subscapularis: "shoulders",
  supraspinatus: "shoulders",
  teres_minor: "shoulders",
  // Upper back
  rhomboid_major: "upper_back",
  rhomboid_minor: "upper_back",
  upper_trapezius: "upper_back",
  middle_trapezius: "upper_back",
  lower_trapezius: "upper_back",
  // Upper arm
  biceps_brachii: "biceps",
  brachialis: "biceps",
  triceps_brachii_lateral_head: "triceps",
  triceps_brachii_long_head: "triceps",
  triceps_brachii_medial_head: "triceps",
  // Forearm
  brachioradialis: "forearms_grip",
  forearm_flexors: "forearms_grip",
  forearm_extensors: "forearms_grip",
  // Trunk
  rectus_abdominis: "abdominals",
  transversus_abdominis: "abdominals",
  external_oblique: "obliques",
  internal_oblique: "obliques",
  quadratus_lumborum: null,
  // Hip
  gluteus_maximus: "glutes",
  gluteus_medius: "glutes",
  gluteus_minimus: "glutes",
  tensor_fasciae_latae: "hip_abductors",
  iliopsoas: "hip_flexors",
  sartorius: "hip_flexors",
  // Thigh
  rectus_femoris: "quadriceps",
  vastus_lateralis: "quadriceps",
  vastus_medialis: "quadriceps",
  vastus_intermedius: "quadriceps",
  biceps_femoris_long_head: "hamstrings",
  biceps_femoris_short_head: "hamstrings",
  semimembranosus: "hamstrings",
  semitendinosus: "hamstrings",
  adductor_magnus: "hip_adductors",
  adductor_longus: "hip_adductors",
  adductor_brevis: "hip_adductors",
  gracilis: "hip_adductors",
  // Lower leg
  gastrocnemius: "calves",
  soleus: "calves",
  tibialis_anterior: "tibialis_anterior",
  tibialis_posterior: null,
  flexor_digitorum_longus: null,
  flexor_hallucis_longus: null,
  fibularis_longus: null,
  fibularis_brevis: null,
};

/* -------------------------------------------------------------------------------------------
 * The view a region is drawn from
 * ---------------------------------------------------------------------------------------- */

export type MuscleEvidence = {
  exerciseName: string;
  role: string | null;
  exercisePercentile: number | null;
};

/** One scored muscle, as the aggregation returned it, validated. */
export type MuscleScore = {
  muscleId: string;
  canonicalName: string;
  name: string;
  /** 0-100. */
  percentile: number;
  /** 0-1 aggregation weight. Not a probability and not shown as a number. */
  confidence01: number;
  evidenceCount: number;
  movementPatternCount: number;
  evidence: MuscleEvidence[];
  /**
   * Who the contributing lifts were compared against, as the norm source names them. More than
   * one when a muscle draws on exercises normed against different groups - which the detail
   * has to say, rather than naming one group for a number that blends several.
   */
  referenceGroups: { label: string; sex: "male" | "female" }[];
};

export type RegionRank = {
  regionId: string;
  /** The muscle whose score the region is drawn with. */
  representative: MuscleScore;
  rank: RankDefinition;
  confidence: ConfidenceLevel;
  /** Every scored muscle in the region, strongest evidence first, representative included. */
  muscles: MuscleScore[];
};

/**
 * One region, many muscles: the quadriceps polygon has four database muscles behind it.
 *
 * The region is drawn with the one muscle best supported by evidence - highest aggregation
 * confidence, then more evidence, then name for a stable order. It is a selection, never a
 * blend: averaging four muscle percentiles would print a number no model produced, and the
 * brief rules out re-aggregating in the client. The detail lists every muscle with its own
 * rank, so the choice is visible rather than hidden.
 */
export function regionRanksFromMuscles(muscles: readonly MuscleScore[]): Map<string, RegionRank> {
  const byRegion = new Map<string, MuscleScore[]>();
  for (const muscle of muscles) {
    const regionId = muscleCanonicalNameToRegionId[muscle.canonicalName];
    if (!regionId || !rankForPercentile(muscle.percentile)) continue;
    byRegion.set(regionId, [...(byRegion.get(regionId) ?? []), muscle]);
  }
  const result = new Map<string, RegionRank>();
  byRegion.forEach((group, regionId) => {
    const ordered = [...group].sort((a, b) =>
      b.confidence01 - a.confidence01
      || b.evidenceCount - a.evidenceCount
      || a.canonicalName.localeCompare(b.canonicalName));
    const representative = ordered[0];
    const rank = rankForPercentile(representative.percentile);
    const confidence = muscleConfidenceLevel(representative.confidence01);
    if (!rank || !confidence) return;
    result.set(regionId, { regionId, representative, rank, confidence, muscles: ordered });
  });
  return result;
}
