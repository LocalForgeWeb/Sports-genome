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
    expect(component).toContain('<GradeStamp grade={entry.tier} label="Muscle involvement tier" compact />');
    expect(component).toContain("Estimated ${entry.contribution}/100 involvement");
    // Sep 30 decisions: no number for relevance. The sport-action 0-100 came from another engine and contradicted the movement support tier, so it is gone.
    expect(component).not.toContain("sportActionMatch");
    expect(component).not.toContain("How closely this matches your sport action");
    expect(component).toContain("it is not a rating of your skill, performance, or strength");
    expect(component).toContain("planning comparison, not a direct performance measurement");
  });
});
