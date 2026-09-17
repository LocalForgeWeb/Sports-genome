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
    catalog: exercises,
    sportId: "baseball",
    prescriptions: Object.fromEntries(workout.map((exercise, index) => [exercise.id, `${index + 3} x 8`])),
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

  it("reads the stack against the sport's own demand register", () => {
    // Catalog `qualities` tags and SportDemandKeys both existed and had never
    // been joined, so a Push day for baseball could not show a missing demand.
    expect(markup).toContain("Sport demands");
    expect(markup).toContain("Trunk bracing");
    expect(markup).toMatch(/\d+% of push/);
  });

  it("gives an absent demand the split's own catalog share as context", () => {
    // A demand this split cannot serve is not the stack's failure.
    expect(markup).toContain("quality-row-absent");
    expect(markup).toContain("quality-row-share");
  });

  it("says whether each muscle is getting too little or too much work", () => {
    expect(markup).toContain("Session volume");
    expect(markup).toContain("session-volume-direct");
    expect(markup).toContain("session-volume-support");
    expect(markup).toMatch(/Light|Solid|Heavy|Indirect only/);
  });

  it("separates direct sets from supporting work rather than showing one total", () => {
    expect(markup).toContain("supporting, at a half set each");
  });

  it("carries the figure each tip fired on, so it can be checked against the bars", () => {
    const tips = markup.match(/stack-tip stack-tip-\w+/g) || [];
    if (tips.length) expect(markup).toMatch(/\d+ points under target|direct sets|supporting set|% of this split/);
  });

  it("never claims a sport demand the register does not list", () => {
    // getSportDemandModel scores all 24 keys; most are model-estimated filler.
    expect(markup).not.toContain("Aerobic capacity");
  });
});
