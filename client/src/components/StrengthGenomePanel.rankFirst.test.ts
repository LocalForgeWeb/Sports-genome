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

  it("places an exact source-sample rank ahead of the optional manual body-weight entry, and a within-athlete rating ahead of both", () => {
    const ratingPosition = panel.indexOf("Your rating on this lift");
    const rankPosition = panel.indexOf("Source-sample rank range");
    const measurementPosition = panel.indexOf('className="strength-recorded-measurement"');
    expect(ratingPosition).toBeGreaterThan(-1);
    expect(rankPosition).toBeGreaterThan(ratingPosition);
    expect(measurementPosition).toBeGreaterThan(rankPosition);
    expect(panel).toContain("Why no comparison to other people?");
    expect(panel).toContain("for your own context, not a rank.");
  });

  it("removes record-context color legend language and keeps the map as a test selector", () => {
    expect(map).toContain("Your body");
    expect(map).toContain("Highlighting shows where you have lifts on record, not how strong you are.");
    expect(map).not.toContain("strength-body-map-legend");
    expect(map).not.toContain("Athlete-selected focus");
  });
});
