import { describe, expect, it } from "vitest";
import type { StackMuscleScore } from "@/lib/splitStackAnalysis";
import {
  bandForCoverage,
  buildCoverageBars,
  coverageBandCopy,
  coverageScaleMaximum,
  dialGeometry,
  scoreBand,
  summarizeCoverage,
} from "@/lib/stackCoverageVisual";

const rating = (over: Partial<StackMuscleScore> = {}): StackMuscleScore => ({
  muscle: "chest",
  role: "primary",
  target: 90,
  score: 56,
  state: "gap",
  ...over,
});

const name = (muscle: string) => muscle.toUpperCase();

describe("coverageScaleMaximum", () => {
  it("never scales below the full display range", () => {
    // Otherwise a light split's bars would read as fuller than a heavy one's.
    expect(coverageScaleMaximum([rating({ target: 30, score: 12 })])).toBe(100);
  });

  it("leaves headroom above the widest value, so a maxed bar still reads as a value", () => {
    expect(coverageScaleMaximum([rating({ target: 90, score: 100 })])).toBeGreaterThan(100);
  });

  it("uses one scale for every bar in the split", () => {
    const ratings = [rating({ target: 90 }), rating({ muscle: "triceps", target: 70 })];
    const bars = buildCoverageBars(ratings);
    // 90 and 70 against a shared scale keep their real proportions.
    expect(bars[0].targetPercent).toBeGreaterThan(bars[1].targetPercent);
  });
});

describe("buildCoverageBars", () => {
  it("places the fill and the target mark on the same scale", () => {
    const [bar] = buildCoverageBars([rating({ target: 90, score: 56 })]);
    expect(bar.fillPercent).toBeLessThan(bar.targetPercent);
  });

  it("reports the shortfall in coverage points, signed", () => {
    const [bar] = buildCoverageBars([rating({ target: 90, score: 56 })]);
    expect(bar.deltaToTarget).toBe(-34);
  });

  it("reports an overshoot as positive", () => {
    const [bar] = buildCoverageBars([rating({ target: 45, score: 100, state: "high" })]);
    expect(bar.deltaToTarget).toBe(55);
  });

  it("carries the role through, so primary targets can outrank support", () => {
    const bars = buildCoverageBars([rating(), rating({ muscle: "sideDelts", role: "support" })]);
    expect(bars.map((bar) => bar.role)).toEqual(["primary", "support"]);
  });

  it("keeps a fill inside the track when the score exceeds the scale", () => {
    const [bar] = buildCoverageBars([rating({ target: 20, score: 100 })]);
    expect(bar.fillPercent).toBeLessThanOrEqual(100);
  });
});

describe("summarizeCoverage", () => {
  it("names the single gap and how far short it is", () => {
    const bars = buildCoverageBars([
      rating({ muscle: "triceps", target: 70, score: 56 }),
      rating({ muscle: "chest", target: 90, score: 112 }),
    ]);
    expect(summarizeCoverage(bars, name).headline).toBe("TRICEPS is the one gap, 14 points short.");
  });

  it("leads with the worst shortfall when there are several", () => {
    const bars = buildCoverageBars([
      rating({ muscle: "triceps", target: 70, score: 56 }),
      rating({ muscle: "chest", target: 90, score: 24 }),
    ]);
    const summary = summarizeCoverage(bars, name);
    expect(summary.headline).toContain("2 targets under");
    expect(summary.headline).toContain("CHEST");
    expect(summary.shortfalls[0].muscle).toBe("chest");
  });

  it("counts a target that is close but under as a shortfall, not as covered", () => {
    // The old surface labelled these "Covered" while showing a negative number.
    const bars = buildCoverageBars([rating({ target: 80, score: 56 })]);
    expect(bars[0].band).toBe("near");
    expect(summarizeCoverage(bars, name).shortfalls).toHaveLength(1);
  });

  it("says so plainly when nothing is short", () => {
    const bars = buildCoverageBars([rating({ target: 90, score: 92 })]);
    expect(summarizeCoverage(bars, name).headline).toBe("Every target in this split is covered.");
  });

  it("still flags heavy volume when no target is short", () => {
    const bars = buildCoverageBars([
      rating({ target: 90, score: 92 }),
      rating({ muscle: "triceps", target: 45, score: 100 }),
    ]);
    expect(summarizeCoverage(bars, name).headline).toBe("All targets covered; 1 carrying heavy volume.");
  });

  it("counts each band", () => {
    const bars = buildCoverageBars([
      rating({ target: 90, score: 24 }),
      rating({ muscle: "triceps", target: 90, score: 70 }),
      rating({ muscle: "sideDelts", target: 45, score: 48 }),
      rating({ muscle: "traps", target: 45, score: 100 }),
    ]);
    expect(summarizeCoverage(bars, name)).toMatchObject({ short: 1, near: 1, covered: 1, heavy: 1 });
  });

  it("has something to say about an empty split rather than rendering a blank", () => {
    expect(summarizeCoverage([], name).headline).toBe("No split targets to measure.");
  });
});

describe("bandForCoverage", () => {
  it("never labels a target covered while the number is negative", () => {
    // The contradiction this whole band scheme exists to remove.
    for (const [score, target] of [[24, 90], [56, 80], [70, 90], [1, 45]] as const) {
      expect(["short", "near"]).toContain(bandForCoverage(score, target));
    }
  });

  it("reads reaching the mark exactly as covered", () => {
    expect(bandForCoverage(90, 90)).toBe("covered");
  });

  it("separates well past target from just past it", () => {
    expect(bandForCoverage(95, 90)).toBe("covered");
    expect(bandForCoverage(100, 45)).toBe("heavy");
  });

  it("separates far below target from close to it", () => {
    expect(bandForCoverage(24, 90)).toBe("short");
    expect(bandForCoverage(70, 90)).toBe("near");
  });
});

describe("coverageBandCopy", () => {
  it("gives every band a word and a glyph, so colour is never the only cue", () => {
    for (const band of ["short", "near", "covered", "heavy"] as const) {
      expect(coverageBandCopy[band].label.length).toBeGreaterThan(0);
      expect(coverageBandCopy[band].glyph.length).toBeGreaterThan(0);
    }
  });

  it("keeps the four labels distinct", () => {
    const labels = Object.values(coverageBandCopy).map((entry) => entry.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("keeps the four glyphs distinct, for a reader who cannot separate the hues", () => {
    const glyphs = Object.values(coverageBandCopy).map((entry) => entry.glyph);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});

describe("scoreBand", () => {
  it("reads a low overall score as short", () => {
    expect(scoreBand(48)).toBe("short");
  });

  it("reads a middling score as close", () => {
    expect(scoreBand(70)).toBe("near");
  });

  it("reads a score at target as covered", () => {
    expect(scoreBand(92)).toBe("covered");
  });

  it("never reads heavy, because the overall score caps each target at its own ratio", () => {
    for (const score of [0, 50, 85, 100]) {
      expect(scoreBand(score)).not.toBe("heavy");
    }
  });
});

describe("dialGeometry", () => {
  it("draws a half circle, so the gauge reads as a gauge", () => {
    const dial = dialGeometry(100, 50);
    expect(dial.length).toBeCloseTo(Math.PI * 50);
  });

  it("leaves the arc fully drawn at 100", () => {
    expect(dialGeometry(100).offset).toBeCloseTo(0);
  });

  it("leaves the arc undrawn at 0", () => {
    const dial = dialGeometry(0);
    expect(dial.offset).toBeCloseTo(dial.length);
  });

  it("draws half the arc at 50", () => {
    const dial = dialGeometry(50);
    expect(dial.offset).toBeCloseTo(dial.length / 2);
  });

  it("clamps a score past 100 instead of overdrawing the arc", () => {
    expect(dialGeometry(150).offset).toBeCloseTo(0);
  });

  it("clamps a negative score instead of drawing backwards", () => {
    const dial = dialGeometry(-20);
    expect(dial.offset).toBeCloseTo(dial.length);
  });

  it("sizes the viewBox to hold the stroke, so the arc is not clipped", () => {
    const stroke = 9;
    const radius = 52;
    const dial = dialGeometry(50, radius, stroke);
    const [, , width, height] = dial.viewBox.split(" ").map(Number);
    expect(width).toBeGreaterThan(radius * 2);
    expect(height).toBeGreaterThan(radius);
  });
});
