import { describe, expect, it } from "vitest";
import {
  STRENGTH_LEVEL_SOURCE_STUDY_ID,
  resolveStrengthPercentile,
  strengthLevelAgeFactor,
  type StrengthCurve,
} from "../shared/strengthPercentile";

/**
 * The live male Barbell Bench Press curve, as `app_strength_beta_curves_v1` serves it
 * (recorded 27 September 2026): relative 1RM, Strength Level, capped at 0.82.
 */
const bench: StrengthCurve = {
  exerciseId: "barbell_bench_press",
  sourceStudyId: STRENGTH_LEVEL_SOURCE_STUDY_ID,
  sex: "male",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  confidenceCap: 0.82,
  anchors: [
    { percentile: 5, value: 0.5 },
    { percentile: 20, value: 1.0 },
    { percentile: 50, value: 1.25 },
    { percentile: 80, value: 1.5 },
    { percentile: 95, value: 2.0 },
  ],
};

/** The athlete's example: a 180 lb bench, for one, at 145 lb body weight. */
const lift = { measuredOneRmKg: 81.65 };
const at = (ageYears: number | null) => ({ sex: "male" as const, bodyMassKg: 65.77, ageYears });
const place = (ageYears: number | null, curve: StrengthCurve = bench) => {
  const result = resolveStrengthPercentile(curve, lift, at(ageYears));
  if (result.status !== "resolved") throw new Error(`expected a placement, got ${JSON.stringify(result)}`);
  return result;
};

describe("The published age table, as the database holds it", () => {
  /** Every value here is what `strengthlevel_age_factor_v1` returned for the same age. */
  it.each([
    [15, 0.854], [16, 0.8784], [18, 0.9272], [20, 0.976], [25, 1], [30, 1], [40, 1], [50, 0.887], [65, 0.675], [90, 0.392],
  ])("age %s scales the comparison by %s", (age, factor) => {
    expect(strengthLevelAgeFactor(age)).toMatchObject({ status: "ok", factor });
  });

  it("is sure of the adult baseline and a little less of the interpolated ages", () => {
    expect(strengthLevelAgeFactor(30)).toMatchObject({ confidence: 0.96 });
    expect(strengthLevelAgeFactor(16)).toMatchObject({ confidence: 0.93 });
  });

  /** Nothing is invented past either end of the table, exactly as the database refuses. */
  it.each([[14], [14.9], [90.1], [120]])("gives no factor at age %s", (age) => {
    expect(strengthLevelAgeFactor(age)).toEqual({ status: "outside_published_age_range" });
  });

  it.each([[null], [undefined], [Number.NaN], ["sixteen"]])("reads %s as no age", (age) => {
    expect(strengthLevelAgeFactor(age)).toEqual({ status: "age_missing" });
  });
});

/**
 * "If I had a bench at 180 with no age entered and got the 50th percentile, then entered a
 * birth year, it should rise to the right ranking for my age." Each expected value is what the
 * database's own `apply_strengthlevel_age_adjustment_v1` gave for this lift at that age.
 */
describe("A lift re-read at the age it was lifted at", () => {
  it("places the lift unadjusted when there is no birth year", () => {
    const result = place(null);
    expect(result.percentile).toBeCloseTo(48.97, 0);
    expect(result.ageAdjustment).toEqual({ status: "not_applied", reason: "age_missing", ageYears: null });
  });

  it.each([
    [15, 74.44], [16, 69.60], [18, 60.67], [20, 52.64], [30, 48.97], [50, 67.95], [65, 90.18],
  ])("at age %s it reaches the %sth percentile, as the database gives it", (age, databasePercentile) => {
    const result = place(age);
    expect(Math.abs(result.percentile - databasePercentile)).toBeLessThanOrEqual(0.1);
    expect(result.ageAdjustment).toMatchObject({ status: "applied", ageYears: age, version: "strengthlevel_age_factor_v1" });
  });

  it("never changes the recorded lift, only what it is compared as", () => {
    const young = place(16);
    expect(young.observedValue).toBe(place(null).observedValue);
    expect(young.observedValue).toBeCloseTo(1.2414, 4);
    expect(young.ageAdjustment.status === "applied" && young.ageAdjustment.placedValue).toBeCloseTo(1.4133, 3);
  });

  /** The athlete's own example year: 2012 makes them 14 at a lift this year. */
  it("leaves a lift made at 14 unadjusted, and says why", () => {
    const result = place(14);
    expect(result.percentile).toBe(place(null).percentile);
    expect(result.ageAdjustment).toEqual({ status: "not_applied", reason: "outside_published_age_range", ageYears: 14 });
  });

  it("adjusts only a curve whose source publishes an age table", () => {
    const other = place(16, { ...bench, sourceStudyId: "some-other-study" });
    expect(other.percentile).toBe(place(null).percentile);
    expect(other.ageAdjustment).toEqual({ status: "not_applied", reason: "not_age_scalable_source", ageYears: 16 });
    expect(place(16, { ...bench, sourceStudyId: null }).ageAdjustment).toMatchObject({ reason: "not_age_scalable_source" });
  });

  /** The database takes the least of the lift's, the source's and the age table's confidence. */
  it("holds confidence under the age table's own", () => {
    const uncapped = { ...bench, confidenceCap: null };
    expect(place(16, uncapped).confidence).toBe(0.93);
    expect(place(30, uncapped).confidence).toBe(0.96);
    expect(place(null, uncapped).confidence).toBe(1);
    expect(place(16).confidence).toBe(0.82);
  });

  /** A scaled lift past the top anchor is censored there, never extrapolated to a 99th. */
  it("censors a scaled lift that leaves the curve rather than extrapolating", () => {
    const strong = resolveStrengthPercentile(bench, { measuredOneRmKg: 120 }, at(15));
    expect(strong).toEqual({ status: "unavailable", reason: "above_highest_anchor", censoredAt: 95 });
  });

  it("scales an absolute curve the same way, in its own unit", () => {
    const pounds: StrengthCurve = { ...bench, normalizationMethod: "direct_community_1rm_percentile", unit: "lb", anchors: [
      { percentile: 5, value: 95 }, { percentile: 50, value: 185 }, { percentile: 95, value: 315 },
    ] };
    const adult = place(null, pounds);
    const junior = place(16, pounds);
    expect(junior.observedValue).toBe(adult.observedValue);
    expect(junior.percentile).toBeGreaterThan(adult.percentile);
    expect(junior.ageAdjustment.status === "applied" && junior.ageAdjustment.placedValue).toBeCloseTo(180.0 / 0.8784, 0);
  });
});
