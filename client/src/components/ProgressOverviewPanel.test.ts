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
    expect(source).toContain("No comparable change yet.");
    expect(source).toContain("summarizeWithinAthleteStrengthComparisons(observations.data || [])");
    expect(source).toContain("Recorded change");
    expect(source).toContain("not a population comparison or estimated strength score");
    expect(source).toContain("comparison");
    expect(source).toContain("withheld because the recorded setup differs");
    expect(source).not.toContain("readiness score");
    expect(source).not.toContain("Personal record");
  });
});
