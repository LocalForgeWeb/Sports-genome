// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { regionRanksFromMuscles, type MuscleEvidence, type MuscleScore } from "@shared/capabilityRank";
import { RankCard, countedText, liftResultText, muscleScoreValue, rankScoreText, scoreArithmeticText } from "./CapabilityRank";

/**
 * The rank card for the two lats screenshots (13 October 2026), with the route's own answer
 * after the fix (server/rankScreenshots.test.ts produces these numbers). Percentile-ceiling
 * brief §8: the default view, the bound, and "How this is calculated".
 */
afterEach(cleanup);

const community = { label: "Self-selected Strength Level community lifters (not general population)", sex: "male" as const };
const share = 0.6807872113141071;
const pulldown = (exercisePercentile: number, bound: MuscleEvidence["bound"]): MuscleEvidence => ({
  exerciseName: "Lat Pulldown", role: "primary", exercisePercentile, bound, countedLow: exercisePercentile, countedHigh: bound === "above" ? 100 : exercisePercentile,
  observedValue: bound === "above" ? 2.67249 : 1.65818, benchmarkValue: bound === "above" ? 1.75 : null, valueUnit: "x_bodyweight", directness: 0.219, weightShare: share,
});
const row: MuscleEvidence = {
  exerciseName: "Machine Low Row", role: "primary", exercisePercentile: 95, bound: "above", countedLow: 95, countedHigh: 100,
  observedValue: 6.41397, benchmarkValue: 1.75, valueUnit: "x_bodyweight", directness: 0.154, weightShare: 1 - share,
};
const lats = (patch: Partial<MuscleScore>): MuscleScore => ({
  muscleId: "lats", canonicalName: "latissimus_dorsi", name: "Latissimus dorsi", percentile: 0, confidence01: 0.783, evidenceCount: 2, movementPatternCount: 2,
  evidence: [], referenceGroups: [community], ...patch,
});

const screenshotA = lats({ percentile: 91.24886246565927, scoreBound: "range", lowerBound: 91.24886246565927, upperBound: 89.49 * share + 100 * (1 - share), evidence: [pulldown(89.49, "exact"), row] });
const screenshotB = lats({ percentile: 95, scoreBound: "at_least", lowerBound: 95, upperBound: 100, evidence: [pulldown(95, "above"), { ...row, observedValue: 3.08062 }] });
const regionOf = (muscle: MuscleScore) => regionRanksFromMuscles([muscle]).get("lats")!;

describe("Screenshot A: 89th and above 95", () => {
  it("is State Circuit with a score range, not a single number from a bound", () => {
    render(React.createElement(RankCard, { regionRank: regionOf(screenshotA) }));
    expect(screen.getByText("State Circuit")).toBeTruthy();
    expect(screen.getByText("Benchmark score 91–92")).toBeTruthy();
    expect(screen.queryByText("Minimum rank")).toBeNull();
    expect(screen.getByText("Moderate confidence")).toBeTruthy();
  });

  it("shows each lift's own result and the arithmetic the score comes from", () => {
    const { container } = render(React.createElement(RankCard, { regionRank: regionOf(screenshotA) }));
    const lifts = within(screen.getByRole("list", { name: "Lifts behind this rank" })).getAllByRole("listitem").map((item) => item.textContent);
    expect(lifts).toEqual([
      "Lat Pulldown · primary · 89th percentile on its own · 68% of this rank",
      "Machine Low Row · primary · above the 95th-percentile benchmark · 32% of this rank",
    ]);
    expect(container.querySelector("[data-rank-arithmetic]")?.textContent).toBe("89.4 × 68% + above 95 × 32% = 91.2 to 92.8");
    expect(container.querySelector("[data-rank-beyond]")?.textContent).toBe("Machine Low Row is above the highest benchmark this comparison publishes, the 95th percentile. A more precise percentile is not available.");
    expect(container.textContent).toContain("It is a score on the percentile scale, not a percentile of latissimus dorsi strength");
  });
});

describe("Screenshot B: two lifts above 95", () => {
  it("is National Circuit at least, with no 94 and no progress-to-next line", () => {
    const { container } = render(React.createElement(RankCard, { regionRank: regionOf(screenshotB) }));
    expect(screen.getByText("National Circuit")).toBeTruthy();
    expect(screen.getByText("Benchmark score above 95")).toBeTruthy();
    expect(screen.getByText("Minimum rank")).toBeTruthy();
    expect(screen.getByRole("region", { name: "National Circuit rank, at least" })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\b94\b|95th percentile on its own|World Stage|Next:/);
    expect(container.querySelector("[data-rank-beyond]")?.textContent).toContain("2 lifts are above the highest benchmark");
    expect(container.querySelector("[data-rank-arithmetic]")?.textContent).toBe("above 95 × 68% + above 95 × 32% = above 95");
  });
});

describe("Score and lift wording", () => {
  it.each([
    [{ percentile: 91.6, scoreBound: "exact" as const, lowerBound: 91.6, upperBound: 91.6 }, "91"],
    [{ percentile: 91.25, scoreBound: "range" as const, lowerBound: 91.25, upperBound: 92.84 }, "91–92"],
    [{ percentile: 91.25, scoreBound: "range" as const, lowerBound: 91.25, upperBound: 91.9 }, "91"],
    [{ percentile: 95, scoreBound: "at_least" as const, lowerBound: 95, upperBound: 100 }, "above 95"],
    [{ percentile: 0, scoreBound: "at_most" as const, lowerBound: 0, upperBound: 5 }, "below 5"],
    // A result from before bounds were carried reads as exact.
    [{ percentile: 41.16 }, "41"],
  ])("%o reads %s", (score, text) => {
    expect(muscleScoreValue(score)).toBe(text);
  });

  it("hedges an exact score on thin evidence, never a bound", () => {
    expect(rankScoreText({ representative: lats({ percentile: 41.2 }), confidence: "low" })).toBe("Benchmark score about 41");
    expect(rankScoreText({ representative: screenshotB, confidence: "low" })).toBe("Benchmark score above 95");
  });

  it("says what a lift in a supporting role counts as, and nothing for a prime mover", () => {
    expect(countedText({ exercisePercentile: 90, bound: "exact", countedLow: 86.3, countedHigh: 86.3 })).toBe("counts as 86 here");
    expect(countedText({ exercisePercentile: 95, bound: "above", countedLow: 91.4, countedHigh: 97.5 })).toBe("counts as above 91 here");
    expect(countedText({ exercisePercentile: 90, bound: "exact", countedLow: 90, countedHigh: 90 })).toBeNull();
    expect(liftResultText({ exercisePercentile: 5, bound: "below" })).toBe("below the 5th-percentile benchmark");
  });

  it("gives no arithmetic for a single lift: the lift is the score", () => {
    expect(scoreArithmeticText(lats({ percentile: 80, evidence: [pulldown(80, "exact")] }))).toBeNull();
  });
});
