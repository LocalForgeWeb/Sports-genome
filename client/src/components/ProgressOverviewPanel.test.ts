import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProgressOverviewPanel.tsx", import.meta.url), "utf8");

describe("Progress overview", () => {
  it("summarizes only saved session and observation records without invented performance outcomes", () => {
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).toContain("trpc.strengthGenome.observations.useQuery()");
    expect(source).toContain("Sports Genome will not create a progress story from missing data.");
    expect(source).toContain("findWithinAthleteStrengthChanges(observations.data || [])");
    expect(source).toContain("Recorded load change");
    expect(source).toContain("not an estimated strength change or population comparison");
    expect(source).not.toContain("readiness score");
    expect(source).not.toContain("Personal record");
  });
});
