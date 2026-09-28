import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./TodayActionPanel.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("Today action panel", () => {
  it("reads every count through the one athlete-record selector, never a fabricated readiness metric", () => {
    expect(source).toContain('import { useAthleteRecord } from "@/lib/athleteRecord"');
    expect(source).toContain("useAthleteRecord({ directAccess, weightUnit, accountObservations, accountSessions })");
    // The account branch no longer counts typed lifts only (Backend V1 B155, B265).
    expect(source).not.toContain("overview.data?.observationCount");
    expect(source).toContain("trpc.workoutLog.list.useQuery()");
    expect(source).not.toContain("Session readiness");
    expect(source).not.toContain("coach-set planning marker");
  });

  /**
   * Your week is one fraction whose two numbers share a scope; the lifetime record
   * beside it is labelled as lifetime. None is a readiness score.
   */
  it("keeps the week fraction and the lifetime record on their own, stated scopes", () => {
    expect(source).toContain('aria-label={`${completedThisWeek} of ${trainingDays} planned ${trainingDays === 1 ? "workout" : "workouts"} completed this week`}');
    expect(source).toContain("<small>all time</small>");
    // The week count is the record's, the same one Progress reads, on the device and the account alike.
    expect(source).toContain("const completedThisWeek = record.completedThisWeek;");
    expect(source).not.toContain("today-rhythm-planned");
  });

  it("puts the workout under way first, and never a first-lift prompt above it", () => {
    expect(source.indexOf('className="home-head"')).toBeLessThan(source.indexOf("today-action-live"));
    expect(source.indexOf("today-action-live")).toBeLessThan(source.indexOf('className="home-week"'));
    expect(source.indexOf('className="home-week"')).toBeLessThan(source.indexOf('className="today-action-priority"'));
    expect(source).toContain("Resume {splitDayLabel(live.dayLabel).name} workout");
    expect(source).toContain("View workout details");
    expect(source).not.toContain("Log your first lift");
    expect(source).toContain('const recordPrompt = priority.id.startsWith("gate:") ? priority : null;');
  });

  it("makes Review workout and Edit plan refer to the same day", () => {
    // Both read the one active day label; Review opens the Workout prestart and
    // never starts a workout, Edit opens Plan.
    expect(source).toContain('className="today-action-cta">Review workout');
    expect(source).toContain('onClick={onOpenTraining} className="today-action-secondary">Edit plan');
    expect(home).toContain('onOpenTracker={() => navigateWorkspace("tracker")}');
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
  });

  it("tells an empty selected day apart from no plan at all", () => {
    expect(source).toContain("Choose your next workout");
    expect(source).toContain("Open training plan");
    expect(source).toContain("Build training around your goals");
    expect(source).toContain("Create your plan");
    expect(home).toContain("planHasDays={daySlots.some((slot) => dayExerciseCount(dayStore, slot.key) > 0)}");
  });

  it("mounts at Home with direct Training plan, Strength Genome and Exercises actions", () => {
    expect(home).toContain("<TodayActionPanel stagedExerciseCount={customWorkout.length}");
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
    expect(home).toContain('onOpenStrength={() => navigateWorkspace("strength")}');
    expect(home).toContain('onOpenCatalog={() => navigateWorkspace("catalog")}');
    expect(home).toContain("athleteName={athleteBaseline.preferredName}");
  });
});
