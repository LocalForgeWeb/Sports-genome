import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./StrengthGenomePanel.tsx", import.meta.url), "utf8");

describe("Strength Genome panel", () => {
  it("captures dated performance context but withholds an uncalibrated tier", () => {
    expect(source).toContain('type="date"');
    expect(source).toContain("bodyMassKgAtTest");
    expect(source).toContain("new Date(`${observedDate}T12:00:00`)");
    expect(source).toContain("They do not create a body-mass ratio, universal estimate, tier, or population comparison.");
    expect(source).toContain("No regional strength tier is shown until supporting evidence is available.");
    expect(source).toContain("setSelectedRegion(region)");
    expect(source).toContain("Regional detail / no score yet");
    expect(source).toContain("Sports Genome has not assigned a regional strength rank");
    expect(source).toContain("does not claim direct regional muscle-force measurement");
    expect(source).toContain("Athlete-confirmed training focus");
    expect(source).toContain("It is your stated focus, not an inferred weakness, score, or diagnosis.");
    expect(source).toContain('active: !activePriorityIds.has(selectedRegion.id)');
    expect(source).toContain("Range or test standard");
    expect(source).toContain("Variation / technique");
    expect(source).toContain("Assistance / support");
    expect(source).toContain("These fields preserve test context for your own future comparison.");
    expect(source).toContain("They do not create a body-mass ratio, universal estimate, tier, or population comparison.");
  });
});
