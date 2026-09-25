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

/**
 * The palette, versioned apart from the scheme. Recolouring is cosmetic - bands, ids and every
 * stored percentile are untouched - so it must not read as a new rank scheme, and a stored rank
 * from before it is the same rank in a new colour.
 *
 * v2 is the competitive-progression palette: slate, green, blue, purple, gold, crimson, and
 * obsidian at the top. It replaced v1's blue-to-yellow ramp, and with it the rule that each
 * rank be lighter than the last; identity now comes from hue, with name and emblem alongside.
 */
export const RANK_PALETTE_VERSION = "sg_rank_palette_v2" as const;

export type BadgeMetal = "silver" | "gold";

export type RankDefinition = {
  id: RankId;
  /** Raw percentile, inclusive. */
  minInclusive: number;
  /** Raw percentile, exclusive; null only for the final band, which includes 100. */
  maxExclusive: number | null;
  shortName: string;
  fullName: string;
  /**
   * The rank's one colour: map fill, legend swatch, badge gem and any other rank display. Read
   * through `rankColorToken`, never as a literal, and held to this table by a test.
   */
  color: string;
  /** The hex the palette brief specified. Differs from `color` only where a measurement moved it. */
  specifiedColor: string;
  /**
   * The edge a scored region is drawn with. Every rank takes the dark keyline except World
   * Stage: obsidian measures 1.03:1 against the navy ground and needs a light edge to be seen.
   */
  mapOutline: "keyline" | "silver";
  /** Badge finish: the gem's gradient, the rim's metal, and the colour of the mark on the gem. */
  badge: { plateTop: string; plateBottom: string; rim: BadgeMetal; glyph: string };
  /**
   * The approved badge artwork, as the app serves it: the 384 px runtime file under
   * client/public, with a 128 px sibling at `<name>-128.webp` for compact rows. Both are cut
   * from the untouched master in design/rank-icons/source by design/rank-icons/build.py.
   *
   * Null for a rank whose approved artwork has not been supplied. The app then draws the emblem
   * from rankEmblems.ts for that rank rather than reusing an older design in its place, and a
   * test pins which ranks have artwork so a gap cannot open or close silently.
   */
  iconSrc: string | null;
  sortOrder: number;
};

export const RANKS: readonly RankDefinition[] = [
  { id: "prospect", minInclusive: 0, maxExclusive: 20, shortName: "Prospect", fullName: "Prospect",
    color: "#8290A3", specifiedColor: "#8290A3", mapOutline: "keyline",
    badge: { plateTop: "#A7B2C1", plateBottom: "#5F6B7C", rim: "silver", glyph: "#E9EEF4" },
    iconSrc: "/rank-icons/prospect.webp", sortOrder: 0 },
  { id: "jv", minInclusive: 20, maxExclusive: 40, shortName: "JV", fullName: "Junior Varsity",
    color: "#38B879", specifiedColor: "#38B879", mapOutline: "keyline",
    badge: { plateTop: "#4BC88B", plateBottom: "#2A895A", rim: "silver", glyph: "#06301B" },
    iconSrc: "/rank-icons/jv.webp", sortOrder: 1 },
  /*
   * Varsity and Regional are neighbours, and at the brief's hexes (#4285E8, #A36CE0) they had
   * the same luminance to three places: indistinguishable in grayscale (dL 0.1) and nearly so
   * under protanopia (dE 3.7). The smallest move that separates them - blue a shade darker,
   * purple a shade lighter - takes that to dL 9.5 and protan dE 12.0; both stay blue and purple.
   */
  { id: "varsity", minInclusive: 40, maxExclusive: 60, shortName: "Varsity", fullName: "Varsity",
    color: "#397FE7", specifiedColor: "#4285E8", mapOutline: "keyline",
    badge: { plateTop: "#508EEA", plateBottom: "#175CC1", rim: "silver", glyph: "#FFFFFF" },
    iconSrc: "/rank-icons/varsity.webp", sortOrder: 2 },
  { id: "regional", minInclusive: 60, maxExclusive: 80, shortName: "Regional", fullName: "Regional Circuit",
    color: "#B385E5", specifiedColor: "#A36CE0", mapOutline: "keyline",
    badge: { plateTop: "#C5A2EB", plateBottom: "#8E4AD8", rim: "silver", glyph: "#26104A" },
    iconSrc: "/rank-icons/regional.webp", sortOrder: 3 },
  { id: "state", minInclusive: 80, maxExclusive: 95, shortName: "State", fullName: "State Circuit",
    color: "#DCAF3C", specifiedColor: "#DCAF3C", mapOutline: "keyline",
    badge: { plateTop: "#E1BB5A", plateBottom: "#B18820", rim: "silver", glyph: "#3A2803" },
    iconSrc: "/rank-icons/state.webp", sortOrder: 4 },
  { id: "national", minInclusive: 95, maxExclusive: 99, shortName: "National", fullName: "National Circuit",
    color: "#C93650", specifiedColor: "#C93650", mapOutline: "keyline",
    badge: { plateTop: "#D86E81", plateBottom: "#91273A", rim: "gold", glyph: "#FFFFFF" },
    iconSrc: "/rank-icons/national.webp", sortOrder: 5 },
  { id: "world_stage", minInclusive: 99, maxExclusive: null, shortName: "World Stage", fullName: "World Stage",
    color: "#171B24", specifiedColor: "#171B24", mapOutline: "silver",
    badge: { plateTop: "#333C50", plateBottom: "#08090D", rim: "silver", glyph: "#E8C35E" },
    iconSrc: "/rank-icons/world-stage.webp", sortOrder: 6 },
];

/** The metals a badge rim is drawn in, light to dark; also the World Stage map outline's source. */
export const BADGE_METALS: Record<BadgeMetal, readonly [string, string, string]> = {
  silver: ["#F3F6FA", "#AEB7C4", "#6B7586"],
  gold: ["#FBE7A6", "#D6AA42", "#8A6414"],
};

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

/** The CSS custom property holding a rank's colour, so components never carry a hex. */
export const rankColorToken = (id: RankId) => `--sg-rank-${id.replace("_", "-")}-color`;

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
