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
    // The denominator moved from a per-row string into the group heading and a
    // <small>, but a score is still never shown without the scale it is on.
    expect(stack).toContain("relative contribution, /100");
    expect(stack).toContain("<small>/100</small>");
    expect(stack).toContain("{selected.involvement}%");
    expect(stack).toContain("Target coverage is calculated from this split’s intended muscles only.");
    expect(stack).toContain("Supporting muscles are not included in the {split.toLowerCase()} target grade");
    expect(stack).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });
});
