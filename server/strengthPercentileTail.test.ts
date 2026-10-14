import { describe, expect, it } from "vitest";
import { estimateAboveTopAnchor, normalCdf, normalQuantile, tailEstimateCapPercentile } from "../shared/strengthPercentile";
import { tailEstimateForPlacement } from "./supabaseStrengthProfile";

/**
 * Past the top anchor (owner decision, 14 Oct 2026): the curve's shape from its 50th, 80th and
 * 95th points is carried on, capped at the 99.99th, and always marked as an estimate - for every
 * kind of curve, rep counts included.
 */

/** The live male Barbell Bench Press anchors, relative to body weight. */
const bench = [
  { percentile: 5, value: 0.5 },
  { percentile: 20, value: 1.0 },
  { percentile: 50, value: 1.25 },
  { percentile: 80, value: 1.5 },
  { percentile: 95, value: 2.0 },
];

describe("The normal distribution the tail is read on", () => {
  it("matches the standard values", () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 8);
    expect(normalQuantile(0.8)).toBeCloseTo(0.8416212, 6);
    expect(normalQuantile(0.95)).toBeCloseTo(1.6448536, 6);
    expect(normalQuantile(0.99)).toBeCloseTo(2.3263479, 6);
    expect(normalCdf(1.6448536)).toBeCloseTo(0.95, 6);
    expect(normalCdf(-1.6448536)).toBeCloseTo(0.05, 6);
    expect(normalQuantile(0)).toBeNaN();
    expect(normalQuantile(1)).toBeNaN();
  });
});

describe("Estimating past the top anchor", () => {
  it("starts exactly where the measured curve ends and climbs smoothly", () => {
    expect(estimateAboveTopAnchor(bench, 2.00001)?.percentile).toBeCloseTo(95, 2);
    const values = [2.05, 2.1, 2.2, 2.3, 2.4];
    const percentiles = values.map((value) => estimateAboveTopAnchor(bench, value)!.percentile);
    percentiles.forEach((percentile, index) => {
      expect(percentile).toBeGreaterThan(95);
      if (index > 0) expect(percentile).toBeGreaterThan(percentiles[index - 1]);
    });
    expect(percentiles[1]).toBeCloseTo(96.531, 3);
    expect(percentiles[3]).toBeCloseTo(98.362, 3);
  });

  it("climbs past the 99th to the 99.99th and says when it stopped there", () => {
    expect(tailEstimateCapPercentile).toBe(99.99);
    expect(estimateAboveTopAnchor(bench, 2.5)?.percentile).toBeCloseTo(99.239, 3);
    expect(estimateAboveTopAnchor(bench, 3.0)?.percentile).toBeCloseTo(99.892, 3);
    expect(estimateAboveTopAnchor(bench, 3.5)?.percentile).toBeCloseTo(99.985, 3);
    expect(estimateAboveTopAnchor(bench, 3.5)?.tail.capped).toBe(false);
    const capped = estimateAboveTopAnchor(bench, 4);
    expect(capped).toEqual({ percentile: tailEstimateCapPercentile, tail: { version: "lognormal_upper_tail_v1", aboveAnchorPercentile: 95, capped: true } });
    expect(estimateAboveTopAnchor(bench, 40)?.percentile).toBe(99.99);
  });

  /** The live male Ab-Wheel Rollout rep curve: 0 reps at the 5th, 55 at the 95th. */
  it("reads a rep curve the same way", () => {
    const abWheel = [{ percentile: 5, value: 0 }, { percentile: 20, value: 7 }, { percentile: 50, value: 20 }, { percentile: 80, value: 37 }, { percentile: 95, value: 55 }];
    expect(estimateAboveTopAnchor(abWheel, 60)?.percentile).toBeCloseTo(96.296, 3);
    expect(estimateAboveTopAnchor(abWheel, 80)?.percentile).toBeCloseTo(98.788, 3);
    expect(estimateAboveTopAnchor(abWheel, 120)?.percentile).toBeCloseTo(99.82, 2);
    expect(estimateAboveTopAnchor(abWheel, 200)).toMatchObject({ percentile: 99.99, tail: { capped: true } });
  });

  it("reads the shape from the 50th and above only", () => {
    // Moving the lower anchors changes nothing past the top.
    const lowerMoved = bench.map((anchor) => anchor.percentile < 50 ? { ...anchor, value: anchor.value * 0.5 } : anchor);
    expect(estimateAboveTopAnchor(lowerMoved, 2.2)?.percentile).toBe(estimateAboveTopAnchor(bench, 2.2)?.percentile);
    // A steeper upper curve (values spreading faster) reads the same lift lower.
    const spread = bench.map((anchor) => anchor.percentile === 50 ? { ...anchor, value: 1.0 } : anchor);
    expect(estimateAboveTopAnchor(spread, 2.2)!.percentile).toBeLessThan(estimateAboveTopAnchor(bench, 2.2)!.percentile);
  });

  it("gives no estimate where there is nothing to estimate from", () => {
    expect(estimateAboveTopAnchor(bench, 2.0)).toBeNull(); // on the top anchor: a measured placement
    expect(estimateAboveTopAnchor(bench, 1.4)).toBeNull(); // inside the curve
    expect(estimateAboveTopAnchor(bench, Number.NaN)).toBeNull();
    expect(estimateAboveTopAnchor(bench.filter((anchor) => anchor.percentile !== 80), 2.2)).toBeNull(); // two upper points: no shape
    expect(estimateAboveTopAnchor(bench.map((anchor) => anchor.percentile === 80 ? { ...anchor, value: 2.0 } : anchor), 2.2)).toBeNull(); // flat top
    expect(estimateAboveTopAnchor([...bench, { percentile: 80, value: 1.6 }], 2.2)).toBeNull(); // two values at one percentile
    expect(estimateAboveTopAnchor([...bench, { percentile: 99.99, value: 3 }], 3.2)).toBeNull(); // the curve already reaches the cap
  });

  it("reads the database's own types, numbers as strings included", () => {
    const fromDatabase = bench.map((anchor) => ({ percentile: String(anchor.percentile), value: String(anchor.value) }));
    expect(estimateAboveTopAnchor(fromDatabase, 2.2)?.percentile).toBe(estimateAboveTopAnchor(bench, 2.2)?.percentile);
  });
});

describe("The muscle ranks' reading of a database placement", () => {
  const placement = (status: string, observed: number, extra: Record<string, unknown> = {}) => ({
    status, censored: status !== "ok", percentile_estimate: status === "above_range" ? 95 : 60, observed_norm_value: observed, curve: bench, ...extra,
  });

  it("estimates only what the database held at the top anchor", () => {
    expect(tailEstimateForPlacement(placement("above_range", 2.2))?.percentile).toBe(estimateAboveTopAnchor(bench, 2.2)?.percentile);
    expect(tailEstimateForPlacement(placement("ok", 1.4))).toBeNull();
    expect(tailEstimateForPlacement(placement("below_range", 0.3))).toBeNull();
  });

  it("leaves a placement without its curve or value as the database scored it", () => {
    expect(tailEstimateForPlacement(placement("above_range", 2.2, { curve: undefined }))).toBeNull();
    expect(tailEstimateForPlacement(placement("above_range", 2.2, { observed_norm_value: null }))).toBeNull();
    expect(tailEstimateForPlacement(null)).toBeNull();
    expect(tailEstimateForPlacement("above_range")).toBeNull();
  });
});
