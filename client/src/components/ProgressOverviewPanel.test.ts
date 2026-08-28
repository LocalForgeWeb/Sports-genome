import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProgressOverviewPanel.tsx", import.meta.url), "utf8");

describe("Progress overview", () => {
  it("summarizes only saved session and observation records without invented performance outcomes", () => {
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).toContain("trpc.strengthGenome.observations.useQuery()");
    expect(source).toContain("loadDeviceWorkoutSessions()");
    expect(source).toContain("deviceWorkoutHistoryEvent");
    expect(source).toContain('status === "completed"');
    expect(source).toContain("completedSetCount");
    expect(source).toContain("Your completed sessions.");
    expect(source).toContain("b.completedAt.getTime() - a.completedAt.getTime()");
    expect(source).toContain('session.storage === "device" ? "Device" : "Account"');
    expect(source).toContain("Sports Genome will not create a progress story from missing data.");
    expect(source).toContain("summarizeWithinAthleteStrengthComparisons(observations.data || [])");
    expect(source).toContain("Recorded load change");
    expect(source).toContain("not an estimated strength change or population comparison");
    expect(source).toContain("Comparison withheld");
    expect(source).toContain("No load-change card is shown until the same setup is repeated.");
    expect(source).not.toContain("readiness score");
    expect(source).not.toContain("Personal record");
  });
});
