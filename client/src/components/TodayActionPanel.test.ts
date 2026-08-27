import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./TodayActionPanel.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("Today action panel", () => {
  it("uses saved workout and observation records rather than a fabricated readiness metric", () => {
    expect(source).toContain("trpc.strengthGenome.overview.useQuery()");
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).toContain("athlete-selected weekly rhythm");
    expect(source).not.toContain("Session readiness");
    expect(source).not.toContain("coach-set planning marker");
    expect(source).toContain("Weekly plan rhythm");
    expect(source).toContain("not a completion or readiness score");
    expect(source).toContain("today-rhythm-planned");
  });

  it("mounts at Home with direct Training Day and Strength Genome actions", () => {
    expect(home).toContain("<TodayActionPanel stagedExerciseCount={customWorkout.length}");
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
    expect(home).toContain('onOpenStrength={() => navigateWorkspace("strength")}');
  });
});
