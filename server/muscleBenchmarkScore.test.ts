import { describe, expect, it } from "vitest";
import { aggregateMuscleBenchmarkScores, betterScore, type BoundedScoreInput, type MappingRow } from "./muscleAggregation";
import { rankForMuscle, rankForPercentile, type MuscleScore } from "../shared/capabilityRank";
import { placeOnCurve, resolveStrengthPercentile, STRENGTH_LEVEL_SOURCE_STUDY_ID, type StrengthCurve } from "../shared/strengthPercentile";
import { percentileBoundOf } from "./supabaseStrengthProfile";
import { latsScreenshots as fx } from "./fixtures/latsScreenshots";

/**
 * The weighted benchmark score (v3) and its bounds, on the production function. Percentile
 * ceiling brief §7 and the §10 regression table.
 */
const { LAT_PULLDOWN: PULLDOWN, MACHINE_LOW_ROW: ROW } = fx.ids;
const tables = { mappings: fx.mappings, muscles: fx.muscles, exercises: fx.exercises };
const LATS = "latissimus_dorsi";
const score = (exercise_id: string, percentile: number, bound: BoundedScoreInput["bound"] = "exact", extra: Partial<BoundedScoreInput> = {}): BoundedScoreInput =>
  ({ exercise_id, percentile, bound, confidence: 0.8, ...extra });
const muscle = (scores: BoundedScoreInput[], canonical = LATS, t = tables) => aggregateMuscleBenchmarkScores(scores, t).muscles.find((m) => m.muscle_canonical_name === canonical)!;
const asScore = (m: ReturnType<typeof muscle>): Pick<MuscleScore, "percentile" | "scoreBound" | "lowerBound" | "upperBound"> =>
  ({ percentile: m.strength_percentile, scoreBound: m.score_bound, lowerBound: m.lower_bound, upperBound: m.upper_bound });

describe("A weighted mean of the lifts' own percentiles", () => {
  it("keeps identical exact lifts at their value: 95 and 95 make 95, not 94", () => {
    for (const value of [95, 60, 12.5, 99]) {
      const lats = muscle([score(PULLDOWN, value), score(ROW, value)]);
      expect(lats.score_bound).toBe("exact");
      expect(lats.strength_percentile).toBe(value);
    }
  });

  it("lies between the lowest and highest lift, as Σ share × percentile", () => {
    const lats = muscle([score(PULLDOWN, 30), score(ROW, 90)]);
    const share = lats.evidence.find((e) => e.exercise_id === PULLDOWN)!.weight_share;
    expect(lats.strength_percentile).toBeCloseTo(30 * share + 90 * (1 - share), 9);
    expect(lats.strength_percentile).toBeGreaterThan(30);
    expect(lats.strength_percentile).toBeLessThan(90);
  });

  it("never falls when a lift's own result rises, with everything else fixed", () => {
    let previous = -Infinity;
    for (const [value, bound] of [[70, "exact"], [80, "exact"], [94.9, "exact"], [95, "exact"], [95, "above"]] as const) {
      const lats = muscle([score(PULLDOWN, 85), score(ROW, value, bound)]);
      expect(lats.lower_bound).toBeGreaterThanOrEqual(previous);
      previous = lats.lower_bound;
    }
  });

  it("counts a lift the muscle only assists nearer the middle, and says how much", () => {
    // The pulldown reads the biceps as a supporting role: its 90 counts for less than 90.
    const biceps = muscle([score(PULLDOWN, 90)], "biceps_brachii");
    const row = biceps.evidence[0];
    expect(row.role).toBe("secondary");
    expect(row.signal_transfer).toBeLessThan(1);
    expect(row.counted_low).toBeLessThan(90);
    expect(biceps.strength_percentile).toBeCloseTo(row.counted_low, 9);
    // A prime mover's lift counts at its own percentile.
    expect(muscle([score(PULLDOWN, 90)]).evidence[0]).toMatchObject({ signal_transfer: 1, counted_low: 90, counted_high: 90 });
  });
});

describe("Bounds, carried rather than flattened", () => {
  it("one lift above its benchmark: a range from the anchor to 100 at that lift's share", () => {
    const lats = muscle([score(PULLDOWN, 89.49), score(ROW, 95, "above")]);
    const w = lats.evidence.find((e) => e.exercise_id === PULLDOWN)!.weight_share;
    expect(lats.score_bound).toBe("range");
    expect(lats.lower_bound).toBeCloseTo(89.49 * w + 95 * (1 - w), 9);
    expect(lats.upper_bound).toBeCloseTo(89.49 * w + 100 * (1 - w), 9);
    expect(lats.strength_percentile).toBe(lats.lower_bound);
  });

  it("every lift above: at least the weighted anchors, never a fabricated exact number", () => {
    const lats = muscle([score(PULLDOWN, 95, "above"), score(ROW, 95, "above")]);
    expect(lats).toMatchObject({ score_bound: "at_least", lower_bound: 95, upper_bound: 100 });
  });

  it("every lift below: at most the weighted anchors", () => {
    const lats = muscle([score(PULLDOWN, 5, "below"), score(ROW, 5, "below")]);
    expect(lats).toMatchObject({ score_bound: "at_most", lower_bound: 0, upper_bound: 5 });
    expect(rankForMuscle(asScore(lats))).toMatchObject({ rank: { id: "prospect" }, isMinimum: false });
  });

  it("one above and one below: a range, with the rank no more than the low end allows", () => {
    const lats = muscle([score(PULLDOWN, 95, "above"), score(ROW, 5, "below")]);
    expect(lats.score_bound).toBe("range");
    expect(lats.lower_bound).toBeLessThan(lats.upper_bound);
    const ranked = rankForMuscle(asScore(lats))!;
    expect(ranked.rank.id).toBe(rankForPercentile(lats.lower_bound)!.id);
    expect(ranked.isMinimum).toBe(true);
  });

  it("an exact lift on the top anchor is exact; one past it is a bound", () => {
    expect(muscle([score(PULLDOWN, 95)]).score_bound).toBe("exact");
    expect(muscle([score(PULLDOWN, 95, "above")]).score_bound).toBe("at_least");
  });
});

describe("Which evidence counts, and once", () => {
  it("keeps one score per exercise: duplicates never count as corroboration", () => {
    const once = muscle([score(PULLDOWN, 80), score(ROW, 60)]);
    const twice = muscle([score(PULLDOWN, 80), score(PULLDOWN, 80), score(ROW, 60)]);
    expect(twice.evidence).toHaveLength(2);
    expect(twice.strength_percentile).toBe(once.strength_percentile);
  });

  it("of two lifts both past the anchor, keeps the one further past it, whatever their confidence", () => {
    const strong = score(ROW, 95, "above", { observed_value: 6.41, confidence: 0.5 });
    const lighter = score(ROW, 95, "above", { observed_value: 3.08, confidence: 0.9 });
    expect(betterScore(strong, lighter)).toBe(true);
    expect(muscle([lighter, strong]).evidence[0].observed_value).toBe(6.41);
    // Past the anchor beats on it; a higher exact beats a lower bound.
    expect(betterScore(score(ROW, 95, "above"), score(ROW, 95))).toBe(true);
    expect(betterScore(score(ROW, 96), score(ROW, 95, "above"))).toBe(true);
  });

  it("leaves out zero, negative and non-numeric weights: no numerator, no denominator", () => {
    const zeroed: MappingRow[] = fx.mappings.map((m) => (m.exercise_id === ROW && m.role === "primary" && m.muscle_id === fx.muscles[0].id ? { ...m, confidence_score: "0" } : m));
    const lats = muscle([score(PULLDOWN, 80), score(ROW, 20)], LATS, { ...tables, mappings: zeroed });
    expect(lats.evidence.map((e) => e.exercise_id)).toEqual([PULLDOWN]);
    expect(lats.strength_percentile).toBe(80);
    // A lift with no confidence reads as no evidence too.
    expect(muscle([score(PULLDOWN, 80), score(ROW, 20, "exact", { confidence: 0 })]).strength_percentile).toBe(80);
  });

  it("refuses a percentile off the scale or a bound it does not know, rather than clamping it in", () => {
    expect(muscle([score(PULLDOWN, 80), score(ROW, 140)]).strength_percentile).toBe(80);
    expect(muscle([score(PULLDOWN, 80), score(ROW, Number.NaN)]).strength_percentile).toBe(80);
    expect(muscle([score(PULLDOWN, 80), { exercise_id: ROW, percentile: 50, bound: "censored" as never }]).strength_percentile).toBe(80);
  });
});

describe("Rank boundaries, read on the raw value", () => {
  it.each([
    [94.999, "state"], [95, "national"], [98.999, "national"], [99, "world_stage"], [100, "world_stage"],
  ])("%s is %s", (value, id) => {
    const lats = muscle([score(PULLDOWN, value), score(ROW, value)]);
    expect(rankForMuscle(asScore(lats))).toMatchObject({ rank: { id }, isMinimum: false });
  });

  it("a bound above 95 is National at least, never World Stage", () => {
    const lats = muscle([score(PULLDOWN, 95, "above"), score(ROW, 95, "above")]);
    expect(rankForMuscle(asScore(lats))).toMatchObject({ rank: { id: "national" }, isMinimum: true });
  });
});

describe("The database's placement, read in its own words", () => {
  it("reads above_range as a bound at the top anchor, with how far past it", () => {
    expect(percentileBoundOf(fx.scores["158.757x1"].percentile)).toEqual({ bound: "above", percentile: 95, observedValue: 2.67249, benchmarkValue: 1.75, unit: "x_bodyweight" });
    expect(percentileBoundOf(fx.scores["84.822x6"].percentile)).toMatchObject({ bound: "exact", percentile: 89.49 });
    expect(percentileBoundOf({ status: "below_range", percentile_estimate: 5, censored: true, supported_percentile_min: 5, lower_anchor: { value: 0.5, percentile: 5 }, observed_norm_value: 0.31 })).toMatchObject({ bound: "below", percentile: 5, benchmarkValue: 0.5 });
  });

  it("refuses a placement it cannot read: an unknown status, or censored with no status", () => {
    expect(percentileBoundOf({ status: "clamped", percentile_estimate: 95 })).toBeNull();
    expect(percentileBoundOf({ censored: true, percentile_estimate: 95 })).toBeNull();
    expect(percentileBoundOf({ status: "ok", percentile_estimate: 104 })).toBeNull();
  });

  /** Server/local parity: the card's engine and the database answer the same lifts the same way. */
  it("agrees with the shared engine on the screenshot lifts: 89.49 exact, and past the 95th anchor", () => {
    const curve: StrengthCurve = { exerciseId: PULLDOWN, sourceStudyId: STRENGTH_LEVEL_SOURCE_STUDY_ID, sex: "male", normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback", confidenceCap: 0.82, anchors: [{ percentile: 5, value: 0.5 }, { percentile: 20, value: 0.75 }, { percentile: 50, value: 1 }, { percentile: 80, value: 1.5 }, { percentile: 95, value: 1.75 }] };
    const context = { sex: "male" as const, bodyMassKg: 65.8, ageYears: 17 };
    const ordinary = resolveStrengthPercentile(curve, { loadKg: 84.822, repetitions: 6 }, context);
    expect(ordinary.status === "resolved" && ordinary.percentile).toBeCloseTo(89.49, 2);
    expect(resolveStrengthPercentile(curve, { loadKg: 158.757, repetitions: 1 }, context)).toEqual({ status: "unavailable", reason: "above_highest_anchor", censoredAt: 95 });
    // Equivalent lb and kg inputs place identically (the route always sends kg).
    const inPounds = resolveStrengthPercentile(curve, { loadKg: 187 * 0.45359237, repetitions: 6 }, context);
    expect(inPounds.status === "resolved" && inPounds.percentile).toBeCloseTo(89.49, 2);
  });
});

/**
 * SYNTHETIC. No production curve has an anchor above the 95th (docs/percentile-ceiling). This
 * proves the engine and the ranks can carry one when a legitimate source supplies it - it is not
 * evidence that any exercise supports a percentile above 95 today.
 */
describe("Synthetic upper-tail curve (97th and 99th anchors)", () => {
  const anchors = [{ percentile: 5, value: 0.5 }, { percentile: 50, value: 1 }, { percentile: 95, value: 1.75 }, { percentile: 97, value: 1.9 }, { percentile: 99, value: 2.2 }];

  it("interpolates between the new anchors and still refuses past the last one", () => {
    expect(placeOnCurve(anchors, 1.75)).toEqual({ percentile: 95 });
    expect((placeOnCurve(anchors, 2.05) as { percentile: number }).percentile).toBeCloseTo(98, 9);
    expect(placeOnCurve(anchors, 2.5)).toEqual({ reason: "above_highest_anchor", censoredAt: 99 });
  });

  it("reaches National and World Stage as exact ranks when the lifts are placed there", () => {
    const national = muscle([score(PULLDOWN, 98), score(ROW, 98)]);
    expect(rankForMuscle(asScore(national))).toMatchObject({ rank: { id: "national" }, isMinimum: false });
    const worldStage = muscle([score(PULLDOWN, 99.5), score(ROW, 99.2)]);
    expect(rankForMuscle(asScore(worldStage))).toMatchObject({ rank: { id: "world_stage" }, isMinimum: false });
    // Past a 99th anchor the bound is World Stage outright: the band above 99 is the last.
    expect(rankForMuscle(asScore(muscle([score(PULLDOWN, 99, "above"), score(ROW, 99, "above")])))).toMatchObject({ rank: { id: "world_stage" }, isMinimum: false });
  });
});
