import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panel = readFileSync(new URL("./StrengthGenomePanel.tsx", import.meta.url), "utf8");
const map = readFileSync(new URL("./StrengthGenomeBodyMap.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("Strength Genome rank-first presentation", () => {
  it("passes saved baseline weight into Strength Genome and uses it as the initial test context", () => {
    expect(home).toContain("baselineBodyWeight={athleteBaseline.bodyWeight}");
    expect(panel).toContain("baselineBodyWeight?: number");
    expect(panel).toContain("useState(() => baselineBodyWeight != null ? String(baselineBodyWeight) : \"\")");
    expect(panel).toContain("Use saved weight");
  });

  it("places an exact source-sample rank ahead of optional recorded ratio detail", () => {
    const rankPosition = panel.indexOf("Source-sample rank range");
    const measurementPosition = panel.indexOf("Recorded measurement");
    expect(rankPosition).toBeGreaterThan(-1);
    expect(measurementPosition).toBeGreaterThan(rankPosition);
    expect(panel).toContain("Rank unavailable for this test.");
    expect(panel).toContain("Supporting context only—not a rank.");
  });

  it("removes record-context color legend language and keeps the map as a test selector", () => {
    expect(map).toContain("Test regions");
    expect(map).toContain("Use the map to choose a test area. It is not a muscle ranking or percentile.");
    expect(map).not.toContain("strength-body-map-legend");
    expect(map).not.toContain("Athlete-selected focus");
  });
});
