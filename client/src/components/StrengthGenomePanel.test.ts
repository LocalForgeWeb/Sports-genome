import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./StrengthGenomePanel.tsx", import.meta.url), "utf8");
const bodyMapSource = readFileSync(new URL("./StrengthGenomeBodyMap.tsx", import.meta.url), "utf8");

describe("Strength Genome panel", () => {
  it("captures dated performance context but withholds an uncalibrated tier", () => {
    expect(source).toContain('type="date"');
    expect(source).toContain("bodyMassKgAtTest");
    expect(source).toContain("new Date(`${observedDate}T12:00:00`)");
    expect(source).toContain("They do not create a body-mass ratio, universal estimate, tier, or population comparison.");
    expect(source).toContain("No regional strength tier is shown until supporting evidence is available.");
    expect(source).toContain("onSelect={setSelectedRegion}");
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
    expect(source).toContain("Review in Training Day");
    expect(source).toContain("This opens planning for your review. It does not automatically change your workout or prescribe a correction.");
    expect(source).toContain("onClick={onOpenTraining}");
  });

  it("uses an interactive body map for regional context without inventing percentile or rank output", () => {
    expect(source).toContain('import { StrengthGenomeBodyMap }');
    expect(source).toContain("<StrengthGenomeBodyMap");
    expect(source).not.toContain('className="group min-h-28 bg-white p-4 text-left');
    expect(bodyMapSource).toContain('aria-label="Interactive strength context body map"');
    expect(bodyMapSource).toContain("Recorded test context");
    expect(bodyMapSource).toContain("Athlete-selected focus");
    expect(bodyMapSource).toContain("No mapped test context");
    expect(bodyMapSource).toContain("It is not muscle activation, a strength rank, or a percentile.");
    expect(bodyMapSource).not.toContain("percentile score");
    expect(source).toContain("resolveStrengthObservationRoute(observation.exerciseName)?.regionIds.includes(region.id)");
    expect(source).toContain("Recorded observation context");
    expect(source).toContain("Reference context unavailable.");
    expect(source).toContain("no percentile or strength rank is shown");
  });
});
