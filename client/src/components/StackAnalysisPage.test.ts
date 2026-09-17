import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { StackAnalysisPage, resolveStackMuscleSelection } from "./StackAnalysisPage";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const workout = ["Barbell Bench Press", "Seated Barbell Overhead Press", "Dumbbell Lateral Raise"]
  .map((name) => exercises.find((exercise) => exercise.name === name))
  .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise));

/** The surface as an athlete sees it, which is what these properties are about. */
const markup = renderToStaticMarkup(
  createElement(StackAnalysisPage, {
    workout,
    split: "Push" as const,
    dayLabel: "Active Training Day",
    targetIndex: analyzeSplitStack(workout, exercises, "Push").score,
    suggestions: analyzeSplitStack(workout, exercises, "Push").suggestions,
    onAddSuggestion: () => undefined,
    onClose: () => undefined,
    onInspectExercise: () => undefined,
  })
);

const component = readFileSync(new URL("./StackAnalysisPage.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../stack-analysis.css", import.meta.url), "utf8");

describe("Stack Analysis selected muscle", () => {
  it("keeps a valid selected muscle and resets to the leading current muscle when the workout changes", () => {
    expect(resolveStackMuscleSelection("chest", ["chest", "triceps"])).toBe("chest");
    expect(resolveStackMuscleSelection("chest", ["hamstrings", "glutes"])).toBe("hamstrings");
    expect(resolveStackMuscleSelection("chest", [])).toBe("");
  });

  it("keeps the default analysis target-first while retaining optional non-target involvement as supporting context", () => {
    expect(component).toContain('import { getSplitRequirements, type StackSuggestion } from "@/lib/splitStackAnalysis"');
    expect(component).toContain("const targetAnalysis = useMemo(() => wholeStackAnalysis.filter");
    expect(component).toContain("const supportingAnalysis = useMemo(() => wholeStackAnalysis.filter");
    expect(component).toContain("Target coverage is calculated from this split’s intended muscles only.");
    expect(component).toContain("Supporting involvement");
    expect(component).toContain("Supporting muscles are not included in the {split.toLowerCase()} target grade");
    expect(component).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });

  it("never shows a bare score without the scale it is measured on", () => {
    // Asserted against the rendered surface rather than the source spelling, so
    // a rewrite of the markup cannot quietly drop the denominator.
    expect(markup).toContain("relative contribution, /100");
    expect(markup).toContain("/100");
    expect(markup).toMatch(/\d+% coverage/);
    expect(markup).toContain("Target coverage is calculated from this split");
    expect(markup).toContain("does not diagnose, measure electromyography, or guarantee an individual response");
  });

  it("shows each target against the split's own target, not as a bare fill", () => {
    // A coverage fill on its own says "49" without saying 49 of what.
    expect(markup).toContain("stack-analysis-row-target");
    expect(markup).toContain("stack-analysis-row-fill");
  });

  it("draws the four demand indices on one shared axis", () => {
    // They were four bordered tiles, which hid the only thing they are for:
    // these measures mean something relative to each other.
    expect(markup).toContain("loading-profile-plot");
    expect(markup).toContain("Loading profile");
    for (const label of ["Tension", "Stretched", "Shortened", "Control"]) {
      expect(markup).toContain(label);
    }
    expect(markup).not.toContain("stack-analysis-metric ");
  });

  it("states what the profile's shape is, which four bare numbers do not", () => {
    expect(markup).toMatch(/Loaded (most near the stretch|most near the top|evenly across the range)/);
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
