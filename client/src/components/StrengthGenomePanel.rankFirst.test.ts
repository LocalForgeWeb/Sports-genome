import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panel = readFileSync(new URL("./StrengthGenomePanel.tsx", import.meta.url), "utf8");
const map = readFileSync(new URL("./StrengthGenomeBodyMap.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("Strength Genome rank-first presentation", () => {
  it("passes saved baseline weight into Strength Genome and uses it as the initial test context", () => {
    expect(home).toContain("baselineBodyWeight={athleteBaseline.bodyWeight}");
    expect(panel).toContain("baselineBodyWeight?: number");
    // The profile weight is now a fallback, not the prefill. The body-mass field
    // offers what the athlete weighed on the lift's own day, read from the dated
    // weight log, and falls back to the profile only when the log cannot answer.
    expect(panel).toContain("bodyWeightKgAt(bodyWeightHistory, latestRecord.observedAt)");
    expect(panel).toContain("weightOnRecordDay ?? (baselineBodyWeight != null ? displayWeightToKilograms(baselineBodyWeight, weightUnit) : undefined)");
    expect(panel).toContain("Save this body weight");
  });

  // Reordered on purpose (Sep 30 §6): the lift's comparison rank comes first in its own row,
  // personal progress is a separate row and never called a rating, the ratio is its own fact,
  // and the body-weight correction sits in the one About this data disclosure.
  it("lists the lift's comparison rank, then its progress, then its ratio, then About this data", () => {
    const comparisonPosition = panel.indexOf("<dt>Comparison rank for this lift</dt>");
    const studyPosition = panel.indexOf("Source-sample rank range");
    const progressPosition = panel.indexOf("<dt>Your progress on this lift</dt>");
    const ratioPosition = panel.indexOf("<dt>Body-weight ratio</dt>");
    const aboutPosition = panel.indexOf("<summary>About this data</summary>");
    expect(comparisonPosition).toBeGreaterThan(-1);
    expect(studyPosition).toBeGreaterThan(comparisonPosition);
    expect(progressPosition).toBeGreaterThan(studyPosition);
    expect(ratioPosition).toBeGreaterThan(progressPosition);
    expect(aboutPosition).toBeGreaterThan(ratioPosition);
    expect(panel).toContain("No comparison rank available for this lift");
    expect(panel).toContain("for your own context, not a rank.");
    expect(panel).not.toContain("Your rating on this lift");
    expect(panel).not.toContain("Confirmed change");
  });

  it("removes record-context color legend language and keeps the map as a test selector", () => {
    expect(map).toContain("Your body");
    expect(map).toContain("Highlighting shows where you have lifts on record, not how strong you are.");
    expect(map).not.toContain("strength-body-map-legend");
    expect(map).not.toContain("Athlete-selected focus");
  });
});
