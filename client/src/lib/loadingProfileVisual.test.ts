import { describe, expect, it } from "vitest";
import {
  buildProfileBars,
  describeProfileShape,
  profileBiasThreshold,
  profileOrder,
  profileSparkPoints,
  type LoadingMetrics,
} from "@/lib/loadingProfileVisual";

const metrics = (over: Partial<LoadingMetrics> = {}): LoadingMetrics => ({
  mechanicalLoading: 68,
  longLengthLoading: 37,
  peakContraction: 36,
  stabilizationDemand: 31,
  ...over,
});

describe("buildProfileBars", () => {
  it("keeps one fixed order, so the same position means the same measure on every row", () => {
    // Sorting by value would make the shape unreadable across rows.
    const bars = buildProfileBars(metrics({ mechanicalLoading: 1, stabilizationDemand: 99 }));
    expect(bars.map((bar) => bar.key)).toEqual(profileOrder.map((entry) => entry.key));
  });

  it("puts the two ends of the range next to each other, which is the comparison", () => {
    const keys = profileOrder.map((entry) => entry.key);
    expect(keys.indexOf("peakContraction") - keys.indexOf("longLengthLoading")).toBe(1);
  });

  it("carries a short label and the real meaning for each measure", () => {
    for (const bar of buildProfileBars(metrics())) {
      expect(bar.label.length).toBeGreaterThan(0);
      expect(bar.label.length).toBeLessThanOrEqual(10);
      expect(bar.meaning.endsWith(".")).toBe(true);
    }
  });

  it("rounds to whole index points", () => {
    expect(buildProfileBars(metrics({ mechanicalLoading: 68.4 }))[0].value).toBe(68);
  });

  it("clamps a value outside the scale rather than overdrawing the bar", () => {
    expect(buildProfileBars(metrics({ mechanicalLoading: 140 }))[0].value).toBe(100);
    expect(buildProfileBars(metrics({ mechanicalLoading: -5 }))[0].value).toBe(0);
  });
});

describe("describeProfileShape", () => {
  it("names a stretch-loaded exercise", () => {
    // Romanian deadlift shape: long-length high, peak low.
    const shape = describeProfileShape(metrics({ longLengthLoading: 90, peakContraction: 25 }));
    expect(shape.bias).toBe("stretch");
    expect(shape.summary).toContain("near the stretch");
    expect(shape.summary).toContain("65");
  });

  it("names a shortened-loaded exercise", () => {
    // Cable lateral raise shape: peak high, long-length low.
    const shape = describeProfileShape(metrics({ longLengthLoading: 35, peakContraction: 85 }));
    expect(shape.bias).toBe("shortened");
    expect(shape.summary).toContain("near the top");
  });

  it("refuses to read a small gap as a shape", () => {
    // These are authored indices in steps of a few points; a 1-point difference
    // is noise, not a stretch bias.
    const shape = describeProfileShape(metrics({ longLengthLoading: 37, peakContraction: 36 }));
    expect(shape.bias).toBe("even");
    expect(shape.summary).toContain("evenly");
  });

  it("treats the threshold as the boundary it says it is", () => {
    const below = describeProfileShape(metrics({ longLengthLoading: 50 + profileBiasThreshold - 1, peakContraction: 50 }));
    const at = describeProfileShape(metrics({ longLengthLoading: 50 + profileBiasThreshold, peakContraction: 50 }));
    expect(below.bias).toBe("even");
    expect(at.bias).toBe("stretch");
  });

  it("mentions heavy positional control, which the four bars alone do not call out", () => {
    expect(describeProfileShape(metrics({ stabilizationDemand: 70 })).summary).toContain("positional control");
  });

  it("stays quiet about control when it is not high", () => {
    expect(describeProfileShape(metrics({ stabilizationDemand: 20 })).summary).not.toContain("positional control");
  });

  it("reports the spread signed, so the direction is recoverable", () => {
    expect(describeProfileShape(metrics({ longLengthLoading: 80, peakContraction: 20 })).spread).toBe(60);
    expect(describeProfileShape(metrics({ longLengthLoading: 20, peakContraction: 80 })).spread).toBe(-60);
  });

  it("describes the numbers without making a training claim", () => {
    // The evidence boundary holds: these are catalog indices, not outcomes.
    const summary = describeProfileShape(metrics({ longLengthLoading: 90, peakContraction: 25 })).summary;
    for (const claim of ["best", "better", "grow", "hypertrophy", "should", "optimal"]) {
      expect(summary.toLowerCase()).not.toContain(claim);
    }
  });
});

describe("profileSparkPoints", () => {
  it("emits one point per measure", () => {
    expect(profileSparkPoints(metrics()).split(" ")).toHaveLength(profileOrder.length);
  });

  it("spans the full width, so two sparklines are comparable", () => {
    const points = profileSparkPoints(metrics(), 44, 16).split(" ");
    expect(Number(points[0].split(",")[0])).toBe(0);
    expect(Number(points[points.length - 1].split(",")[0])).toBe(44);
  });

  it("puts a high value near the top, not the bottom", () => {
    // SVG y grows downward; a 100 must map to y=0.
    const [first] = profileSparkPoints(metrics({ mechanicalLoading: 100 }), 44, 16).split(" ");
    expect(Number(first.split(",")[1])).toBe(0);
  });

  it("puts a zero on the baseline", () => {
    const [first] = profileSparkPoints(metrics({ mechanicalLoading: 0 }), 44, 16).split(" ");
    expect(Number(first.split(",")[1])).toBe(16);
  });
});
