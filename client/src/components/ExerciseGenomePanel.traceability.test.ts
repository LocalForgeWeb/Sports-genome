import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(process.cwd(), "client/src/components/ExerciseGenomePanel.tsx"), "utf8");

describe("Exercise Genome evidence-to-logic disclosure", () => {
  it("keeps source-backed anchors and relative model estimates visible behind one methodology disclosure", () => {
    expect(component).toContain("Published research, planning estimates, app limits, and your own logged lifts are kept apart");
    expect(component).toContain("These sources explain how the movement generally works and where the estimates are uncertain.");
    expect(component).toContain("evidenceTraceability.filter");
    expect(component).toContain("A number never gets presented as a measurement just because it looks precise.");
  });

  it("retains relative exercise-specific contribution, grade, and contextual score displays", () => {
    expect(component).toContain("<GradeStamp grade={entry.tier} compact />");
    expect(component).toContain("Estimated ${entry.contribution}/100 involvement");
    expect(component).toContain("How closely this matches your sport action: {analysis.signals.sportActionMatch}/100");
    expect(component).toContain("it is not a rating of your skill, performance, or strength");
    expect(component).not.toContain("Sport-action match: {analysis.signals.sportActionMatch}/100");
    expect(component).toContain("planning comparison, not a direct performance measurement");
  });
});
