import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const anatomy = readFileSync(new URL("./AnatomyMap.tsx", import.meta.url), "utf8");
const genome = readFileSync(new URL("./ExerciseGenomePanel.tsx", import.meta.url), "utf8");
const stack = readFileSync(new URL("./StackAnalysisPage.tsx", import.meta.url), "utf8");

describe("analysis score semantics", () => {
  it("keeps general Body Lab qualitative while preserving labeled relative exercise and stack analysis", () => {
    expect(anatomy).not.toContain("Relative model index");
    expect(anatomy).toContain("Sporting-action role");
    expect(genome).toContain("Modelled ${entry.contribution}/100 involvement");
    expect(genome).toContain("planning comparison, not a direct performance measurement");
    expect(stack).toContain("${item.involvement}%");
    expect(stack).toContain("{contribution.involvement}/100");
    expect(stack).toContain("Target coverage is calculated from this split’s intended muscles only.");
    expect(stack).toContain("Supporting muscles are not included in the {split.toLowerCase()} target grade");
    expect(stack).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });
});
