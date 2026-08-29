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

  it("keeps the default analysis target-first while retaining optional non-target involvement as supporting context", () => {
	    expect(component).toContain("${item.involvement}%");
	    expect(component).toContain("{contribution.involvement}/100");
	    expect(component).toContain('import { getSplitRequirements, type StackSuggestion } from "@/lib/splitStackAnalysis"');
	    expect(component).toContain("const targetAnalysis = useMemo(() => wholeStackAnalysis.filter");
	    expect(component).toContain("const supportingAnalysis = useMemo(() => wholeStackAnalysis.filter");
	    expect(component).toContain("Only {split.toLowerCase()} target muscles are shown and compared by default.");
	    expect(component).toContain("Supporting involvement");
	    expect(component).toContain("not used in the {split.toLowerCase()} target grade or default body map");
	    expect(component).toContain("Relative catalog muscle-role contribution");
	    expect(component).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });
});
