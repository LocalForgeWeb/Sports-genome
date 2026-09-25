import { describe, expect, it } from "vitest";
import {
  MUSCLE_CONFIDENCE_THRESHOLDS,
  RANKS,
  RANK_PALETTE_VERSION,
  RANK_SCHEME_VERSION,
  muscleCanonicalNameToRegionId,
  muscleConfidenceLevel,
  rankForPercentile,
  rankRangeLabel,
  regionRanksFromMuscles,
  type MuscleScore,
} from "@shared/capabilityRank";
import { strengthRegionDefinitions } from "@shared/strengthGenomeDefinitions";

const rankId = (value: unknown) => rankForPercentile(value)?.id ?? null;

describe("The rank table", () => {
  it("is versioned and has exactly the seven bands of the brief, in order", () => {
    expect(RANK_SCHEME_VERSION).toBe("sg_capability_rank_v1");
    expect(RANKS.map((rank) => rank.id)).toEqual(["prospect", "jv", "varsity", "regional", "state", "national", "world_stage"]);
    expect(RANKS.map((rank) => rank.sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  /** No gap and no overlap: each band starts exactly where the one below it stops. */
  it("tiles 0 to 100 with no gaps and no overlaps", () => {
    expect(RANKS[0].minInclusive).toBe(0);
    for (let i = 1; i < RANKS.length; i += 1) expect(RANKS[i].minInclusive).toBe(RANKS[i - 1].maxExclusive);
    expect(RANKS.at(-1)?.maxExclusive).toBeNull();
  });

  it("labels each band's range for the legend", () => {
    expect(RANKS.map(rankRangeLabel)).toEqual(["0–19", "20–39", "40–59", "60–79", "80–94", "95–98", "99–100"]);
  });

  /**
   * Palette v2, exactly: the brief's colours in the brief's order, with the two measured
   * adjustments recorded against the hex it specified. Lightness no longer has to rise - hue
   * carries the rank now - so what is pinned is identity and order.
   */
  it("uses the competitive-progression palette, in order", () => {
    expect(RANKS.map((rank) => rank.color)).toEqual(["#8290A3", "#38B879", "#397FE7", "#B385E5", "#DCAF3C", "#C93650", "#171B24"]);
    expect(RANKS.map((rank) => rank.specifiedColor)).toEqual(["#8290A3", "#38B879", "#4285E8", "#A36CE0", "#DCAF3C", "#C93650", "#171B24"]);
    expect(RANK_PALETTE_VERSION).toBe("sg_rank_palette_v2");
  });

  /** Only World Stage's obsidian needs a light edge to be seen on navy. */
  it("outlines World Stage in silver and every other rank with the keyline", () => {
    expect(RANKS.filter((rank) => rank.mapOutline === "silver").map((rank) => rank.id)).toEqual(["world_stage"]);
  });
});

describe("Reading a rank off a raw percentile", () => {
  /** The acceptance matrix: one rank each side of every boundary, with no rounding-induced early switch. */
  it.each([
    [19.999, "prospect", 20, "jv"],
    [39.999, "jv", 40, "varsity"],
    [59.999, "varsity", 60, "regional"],
    [79.999, "regional", 80, "state"],
    [94.999, "state", 95, "national"],
    [98.999, "national", 99, "world_stage"],
  ])("%s is %s and %s is %s", (below, belowRank, at, atRank) => {
    expect(rankId(below)).toBe(belowRank);
    expect(rankId(at)).toBe(atRank);
  });

  it("maps the valid endpoints", () => {
    expect(rankId(0)).toBe("prospect");
    expect(rankId(100)).toBe("world_stage");
  });

  /** Nothing is clamped into a band: an unmeasured muscle drawn as Prospect would call the athlete weak. */
  it.each([[-1], [101], [Number.NaN], [Number.POSITIVE_INFINITY], [null], [undefined], ["54"], [{}]])("gives %s no rank", (value) => {
    expect(rankForPercentile(value)).toBeNull();
  });
});

describe("Confidence stays its own channel", () => {
  it("uses the adopted wording, never a number", () => {
    expect(muscleConfidenceLevel(0.3)).toBe("low");
    expect(muscleConfidenceLevel(0.6)).toBe("moderate");
    expect(muscleConfidenceLevel(0.85)).toBe("high");
  });

  it("switches exactly at the thresholds", () => {
    expect(muscleConfidenceLevel(MUSCLE_CONFIDENCE_THRESHOLDS.moderate - 0.0001)).toBe("low");
    expect(muscleConfidenceLevel(MUSCLE_CONFIDENCE_THRESHOLDS.moderate)).toBe("moderate");
    expect(muscleConfidenceLevel(MUSCLE_CONFIDENCE_THRESHOLDS.high)).toBe("high");
  });

  /** The 0-1 confidence is not a 0-100 percentile, and a percentile passed here is refused rather than read. */
  it("refuses anything outside 0-1", () => {
    expect(muscleConfidenceLevel(54)).toBeNull();
    expect(muscleConfidenceLevel(-0.1)).toBeNull();
    expect(muscleConfidenceLevel(Number.NaN)).toBeNull();
  });

  /**
   * Measured on the live aggregation across all 3,118 mappings: one exercise tops out at 0.631,
   * so High can only be reached by at least two independent sources.
   */
  it("keeps High out of reach of any single exercise", () => {
    expect(muscleConfidenceLevel(0.631)).not.toBe("high");
    // And every single supporting-role reading (max 0.458) stays Low.
    expect(muscleConfidenceLevel(0.458)).toBe("low");
  });
});

describe("Database muscles to Body Lab regions", () => {
  /** Recorded from `muscles.canonical_name` in the canonical project on 23 September 2026. */
  const liveMuscles = [
    "adductor_brevis", "adductor_longus", "adductor_magnus", "anterior_deltoid", "biceps_brachii",
    "biceps_femoris_long_head", "biceps_femoris_short_head", "brachialis", "brachioradialis", "erector_spinae",
    "external_oblique", "fibularis_brevis", "fibularis_longus", "flexor_digitorum_longus", "flexor_hallucis_longus",
    "forearm_extensors", "forearm_flexors", "gastrocnemius", "gluteus_maximus", "gluteus_medius", "gluteus_minimus",
    "gracilis", "iliopsoas", "infraspinatus", "internal_oblique", "latissimus_dorsi", "lower_trapezius",
    "middle_deltoid", "middle_trapezius", "multifidus", "pectoralis_major_clavicular", "pectoralis_major_sternocostal",
    "pectoralis_minor", "posterior_deltoid", "quadratus_lumborum", "rectus_abdominis", "rectus_femoris",
    "rhomboid_major", "rhomboid_minor", "sartorius", "semimembranosus", "semitendinosus", "serratus_anterior",
    "soleus", "subscapularis", "supraspinatus", "tensor_fasciae_latae", "teres_major", "teres_minor",
    "tibialis_anterior", "tibialis_posterior", "transversus_abdominis", "triceps_brachii_lateral_head",
    "triceps_brachii_long_head", "triceps_brachii_medial_head", "upper_trapezius", "vastus_intermedius",
    "vastus_lateralis", "vastus_medialis",
  ];

  it("makes a decision for every muscle the database defines", () => {
    expect(Object.keys(muscleCanonicalNameToRegionId).sort()).toEqual([...liveMuscles].sort());
  });

  it("only ever names regions the body map draws", () => {
    const regions = new Set(strengthRegionDefinitions.map((region) => region.id));
    for (const [muscle, region] of Object.entries(muscleCanonicalNameToRegionId)) {
      if (region !== null) expect(regions.has(region), `${muscle} -> ${region}`).toBe(true);
    }
  });

  it("gives every region at least one muscle", () => {
    const covered = new Set(Object.values(muscleCanonicalNameToRegionId).filter(Boolean));
    for (const region of strengthRegionDefinitions) expect(covered.has(region.id), region.id).toBe(true);
  });
});

const muscle = (canonicalName: string, percentile: number, confidence01: number, evidenceCount = 1): MuscleScore => ({
  muscleId: `id-${canonicalName}`, canonicalName, name: canonicalName, percentile, confidence01, evidenceCount, movementPatternCount: evidenceCount, evidence: [], referenceGroups: [],
});

describe("Drawing a region from its muscles", () => {
  /** Real output: bench 100x5, lat pulldown 70x8 and preacher curl 30x8, male, 80 kg. */
  const live = [
    muscle("pectoralis_major_sternocostal", 68.5, 0.601),
    muscle("pectoralis_major_clavicular", 67.72, 0.562),
    muscle("serratus_anterior", 52.91, 0.134),
    muscle("biceps_brachii", 41.16, 0.758, 2),
    muscle("brachialis", 41.33, 0.722, 2),
    muscle("latissimus_dorsi", 55.09, 0.6),
    muscle("teres_major", 52.79, 0.354),
  ];

  it("draws each region with its best-evidenced muscle, not a blend", () => {
    const regions = regionRanksFromMuscles(live);
    expect(regions.get("chest")?.representative.canonicalName).toBe("pectoralis_major_sternocostal");
    expect(regions.get("chest")?.rank.id).toBe("regional");
    // Biceps brachii has more confidence than brachialis though a fractionally lower score.
    expect(regions.get("biceps")?.representative.canonicalName).toBe("biceps_brachii");
    expect(regions.get("biceps")?.rank.id).toBe("varsity");
    expect(regions.get("lats")?.rank.id).toBe("varsity");
  });

  it("keeps every muscle in the region for the detail, strongest evidence first", () => {
    expect(regionRanksFromMuscles(live).get("chest")?.muscles.map((m) => m.canonicalName))
      .toEqual(["pectoralis_major_sternocostal", "pectoralis_major_clavicular", "serratus_anterior"]);
  });

  it("carries the representative's confidence as its own level", () => {
    const regions = regionRanksFromMuscles(live);
    expect(regions.get("biceps")?.confidence).toBe("moderate");
  });

  /** A region no scored muscle reaches is absent - the map draws it unavailable, not Prospect. */
  it("leaves a region with no scored muscle out entirely", () => {
    expect(regionRanksFromMuscles(live).has("quadriceps")).toBe(false);
  });

  it("drops a muscle with an invalid percentile or no region rather than guessing", () => {
    const regions = regionRanksFromMuscles([muscle("rectus_femoris", 101, 0.6), muscle("tibialis_posterior", 50, 0.6)]);
    expect(regions.size).toBe(0);
  });
});
