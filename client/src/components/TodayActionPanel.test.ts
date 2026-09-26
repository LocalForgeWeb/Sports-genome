import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./TodayActionPanel.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("Today action panel", () => {
  it("uses saved workout and observation records rather than a fabricated readiness metric", () => {
    expect(source).toContain("trpc.strengthGenome.overview.useQuery()");
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).not.toContain("Session readiness");
    expect(source).not.toContain("coach-set planning marker");
  });

  /**
   * Three facts, three scopes. Planned days are the days the athlete chose; completed
   * this week is counted from saved sessions since Monday, in the app's own week;
   * lifts logged is the lifetime record count. None is a readiness score.
   */
  it("keeps the three quiet metrics on their own scopes", () => {
    expect(source).toContain("summarizeTrainingWeek((sessions.data || []) as TrainingSession[], trainingDays).completedThisWeek");
    expect(source).toContain("<strong>Planned days</strong>");
    expect(source).toContain("<strong>Completed this week</strong>");
    expect(source).toContain("<strong>Lifts logged</strong>");
    expect(source).not.toContain("today-rhythm-planned");
  });

  it("makes Review session and Edit plan refer to the same day", () => {
    // Both read the one active day label; Review opens the Session prestart and
    // never starts a workout, Edit opens Plan.
    expect(source).toContain('className="today-action-cta">Review session');
    expect(source).toContain('onClick={onOpenTraining} className="today-action-secondary">Edit plan');
    expect(home).toContain('onOpenTracker={() => navigateWorkspace("tracker")}');
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
  });

  it("offers to build the plan when there is no session to review", () => {
    expect(source).toContain("No session built yet");
    expect(source).toContain("Create your plan");
  });

  it("mounts at Home with direct Training Day and Strength Genome actions", () => {
    expect(home).toContain("<TodayActionPanel stagedExerciseCount={customWorkout.length}");
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
    expect(home).toContain('onOpenStrength={() => navigateWorkspace("strength")}');
  });
});
