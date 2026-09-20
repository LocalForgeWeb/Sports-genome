import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProgressOverviewPanel.tsx", import.meta.url), "utf8");

describe("Progress overview", () => {
  it("summarizes saved session and observation records, merged with tracker history, without invented performance outcomes", () => {
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).toContain("trpc.strengthGenome.observations.useQuery()");
    expect(source).toContain("trpc.workoutLog.progressionHistory.useQuery()");
    // Account observations, lifts saved on this device, and finished tracker
    // workouts are one record here — counting only the server's rows showed a
    // device athlete zero lifts under a list of completed sessions.
    expect(source).toContain("mergeStrengthHistory(loggedObservations.map(");
    expect(source).toContain("workoutStrengthObservations(deviceSessions)");
    expect(source).toContain("loadDeviceStrengthObservations()");
    expect(source).toContain("{loggedObservations.length}");
    expect(source).toContain("loadDeviceWorkoutSessions()");
    expect(source).toContain("deviceWorkoutHistoryEvent");
    expect(source).toContain('status === "completed"');
    expect(source).toContain("completedSetCount");
    expect(source).toContain("Your completed sessions.");
    expect(source).toContain("b.completedAt.getTime() - a.completedAt.getTime()");
    expect(source).toContain('session.storage === "device" ? "Device" : "Account"');
    expect(source).toContain("No comparable history yet.");
    expect(source).toContain("summarizeWithinAthleteStrengthComparisons(unifiedHistory)");
    expect(source).toContain("Estimated change since your first log");
    expect(source).toContain("tracks you against your own past only — never against anyone else");
    expect(source).toContain("Epley formula");
    expect(source).toContain("outside the validated rep range for estimation");
    expect(source).not.toContain("readiness score");
    expect(source).not.toContain("Personal record");
  });
});
