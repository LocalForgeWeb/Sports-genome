import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveStackMuscleSelection } from "./StackAnalysisPage";

const component = readFileSync(new URL("./StackAnalysisPage.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../stack-analysis.css", import.meta.url), "utf8");

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
    expect(component).toContain("Target coverage is calculated from this split’s intended muscles only.");
	    expect(component).toContain("Supporting involvement");
    expect(component).toContain("Supporting muscles are not included in the {split.toLowerCase()} target grade");
	    expect(component).toContain("Relative catalog muscle-role contribution");
    expect(component).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });

  it("uses a compact full-width target list and keeps the visual map behind an explicit disclosure", () => {
    expect(component).toContain('className="stack-analysis-map-disclosure"');
    expect(component).toContain("View split target map");
    expect(component).toContain('className="stack-analysis-row-copy"');
    expect(component).toContain('className="stack-analysis-row-score"');
    expect(styles).toContain(".stack-analysis-row { display: grid;");
    expect(styles).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto");
    expect(styles).toContain(".stack-analysis-row-copy { min-width: 0;");
  });

  it("places direct split-compatible target additions ahead of detailed target rows", () => {
    expect(component).toContain('className="stack-analysis-next-picks"');
    expect(component.indexOf('className="stack-analysis-next-picks"')).toBeLessThan(component.indexOf('className="stack-analysis-list"'));
    expect(component).toContain("Best next picks");
  });
});
