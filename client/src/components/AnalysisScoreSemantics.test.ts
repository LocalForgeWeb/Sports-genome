import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const anatomy = readFileSync(new URL("./AnatomyMap.tsx", import.meta.url), "utf8");
const genome = readFileSync(new URL("./ExerciseGenomePanel.tsx", import.meta.url), "utf8");
const stack = readFileSync(new URL("./StackAnalysisPage.tsx", import.meta.url), "utf8");

describe("analysis score semantics", () => {
  it("keeps general Body Lab qualitative while preserving labeled relative exercise and stack analysis", () => {
    expect(anatomy).not.toContain("Relative model index");
    // The three repeated per-block caveats collapsed into one line at the end
    // of the panel. What has to survive is the claim, not where it sat.
    expect(anatomy).toContain("a qualitative role in this action, not measured activation, force");
    expect(genome).toContain("Estimated ${entry.contribution}/100 involvement");
    expect(genome).toContain("planning comparison, not a direct performance measurement");
    // A score is still never shown without the scale it is on. Intentional change, Sep 28
    // regression brief §8: the contribution index no longer borrows the coverage badge's
    // "/100", each percentage names its denominator, and the methodology is said once.
    expect(stack).toContain("contribution index, 0–100");
    expect(stack).toContain("<small>/100</small><em>coverage index</em>");
    expect(stack).toContain("{selected.involvement}% of the day's most-worked muscle");
    expect(stack).toContain("How coverage is calculated");
    expect(stack).toContain("Not {split.toLowerCase()} targets, so not in the coverage index.");
    expect(stack).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });
});
