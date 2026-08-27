import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveStackMuscleSelection } from "./StackAnalysisPage";

const component = readFileSync(new URL("./StackAnalysisPage.tsx", import.meta.url), "utf8");

describe("Stack Analysis selected muscle", () => {
  it("keeps a valid selected muscle and resets to the leading current muscle when the workout changes", () => {
    expect(resolveStackMuscleSelection("chest", ["chest", "triceps"])).toBe("chest");
    expect(resolveStackMuscleSelection("chest", ["hamstrings", "glutes"])).toBe("hamstrings");
    expect(resolveStackMuscleSelection("chest", [])).toBe("");
  });

  it("retains whole-stack relative involvement and contribution scores with a non-measurement boundary", () => {
    expect(component).toContain("${item.involvement}%");
    expect(component).toContain("{contribution.involvement}/100");
    expect(component).toContain("not a direct measurement of individual muscle activation");
    expect(component).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });
});
