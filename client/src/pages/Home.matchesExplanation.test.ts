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

  it("states what the exercise was matched to, once, in a readable line", () => {
    expect(recommendations).toContain('className="recommendation-trace"');
    expect(recommendations).toContain("Matched to");
    expect(recommendations).toContain("to build");
    // The sport action and the qualities are the two facts worth carrying.
    expect(recommendations).toContain("result.hierarchy.movement");
    expect(recommendations).toContain("result.hierarchy.physicalQualities.slice(0, 2)");
  });

  it("names the ranking priorities once for the page, not once per row", () => {
    expect(source).toContain('className="matches-lens"');
    expect(source).toContain("Ranking these matches on");
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
    expect(recommendations).toContain('<summary>Why this match?<ChevronDown');
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(css).toContain(".recommendation-why[open] summary svg { transform: rotate(180deg); }");
  });
});
