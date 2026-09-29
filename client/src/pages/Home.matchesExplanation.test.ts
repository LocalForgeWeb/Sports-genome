import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const recommendations = source.slice(source.indexOf("function RecommendationRow"), source.indexOf("function Onboarding"));

describe("recommendation explanation depth", () => {
  // "Insight explanation depth contract": "Do not expose raw model attribution
  // as if it were a user explanation" and full "methodology ... live one level
  // deeper".
  //
  // The row used to render a "Hierarchy trace" paragraph of seven bolded field
  // names. Three of them — Demand, Physical quality, Adaptation — were the same
  // priority list restated in three grammatical forms, and Modality, Exercise
  // role and Programming are hardcoded constants in getSportProgrammingContext,
  // identical on every row of every sport.
  it("keeps the internal taxonomy out of the recommendation row", () => {
    ["Hierarchy trace", "hierarchy.modality", "hierarchy.exerciseRole", "hierarchy.programming", "hierarchy.adaptations", "hierarchy.physiologicalDemands"]
      .forEach((token) => expect(recommendations, `${token} is athlete-facing schema`).not.toContain(token));
  });

  it("states what this exercise shares with the action, in a readable line of its own", () => {
    // Intentional change, Sep 28 regression brief §11: the line named the sport's qualities,
    // identical on every row. It now names this row's own matched signals and muscles, after
    // the exercise's own rationale, which was computed and never shown.
    expect(recommendations).toContain('className="recommendation-trace"');
    expect(recommendations).toContain('<p className="recommendation-rationale">{result.rationale}</p>');
    expect(recommendations).toContain("result.matchedSignals.map((signal) => movementSignalLabels[signal])");
    expect(recommendations).toContain("result.matchedMuscles.map(muscleWords)");
    expect(recommendations).toContain("result.hierarchy.movement");
    expect(recommendations).not.toContain("result.hierarchy.physicalQualities");
  });

  it("names the ranking priorities once for the page, not once per row", () => {
    expect(source).toContain('className="matches-lens"');
    // Intentional change, Sep 28 regression brief §11: the list is not ranked on them (the
    // match counts shared movements and muscles), so they are named as the sport's priorities.
    expect(source).not.toContain("Ranking these matches on");
    expect(source).toContain("Your sport's priorities:");
    expect(source).toContain("The match number (50 to 99) counts how many of this action's movements and muscles an exercise shares");
    expect(source).toContain("sportProgrammingContext.priorities.map");
    // The three constant policy sentences are still available, one level deeper.
    expect(source).toContain('className="matches-lens-method"');
    expect(source).toContain("How matching works");
    expect(source).not.toContain("Active sport-program lens");
  });

  it("leaves the scored breakdown as the actual why", () => {
    // The decision-relevant explanation is the per-dimension score grid plus
    // strengths and limits, which the contract's "2-4 decisive drivers" and
    // challenge path call for.
    expect(recommendations).toContain("Why this match?");
    expect(recommendations).toContain("Strengths");
    expect(recommendations).toContain("Limits");
  });

  it("gives the disclosure something to show it is one", () => {
    // Measured on the shipped build: the summary had zero child elements and no
    // icon, `display: flex` suppresses the disclosure marker in Chrome, and the
    // stylesheet also hides the webkit one - so six working controls down the
    // page rendered as bare headings. The stylesheet already laid the summary
    // out `space-between` for a right-hand element the markup never supplied.
    // Each row's summary has its own accessible name (Sep 28 regression brief §11).
    expect(recommendations).toContain('<summary aria-label={`Why ${name} matches`}>Why this match?<ChevronDown');
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(css).toContain(".recommendation-why[open] summary svg { transform: rotate(180deg); }");
  });
});
