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
    // Asked only when an account is the source (intentional change, D-015): on the device
    // stores the refusal raised a false "sign-in has expired".
    expect(source).toContain("trpc.workoutLog.list.useQuery(undefined, { enabled: !directAccess })");
    expect(source).not.toContain("Session readiness");
    expect(source).not.toContain("coach-set planning marker");
  });

  /**
   * Your week is one fraction whose two numbers share a scope; the lifetime record
   * beside it is labelled as lifetime. None is a readiness score.
   */
  it("keeps the week fraction and the lifetime record on their own, stated scopes", () => {
    // The fraction counts plan days done this week, the same slots the strip checks, so the number
    // always equals the checked entries; sessions beyond them are said separately (intentional
    // change, Sep 28 regression brief §5). It is plain text, read as written, not an aria-label.
    expect(source).toContain("planned {plan.slots.length === 1 ? \"workout\" : \"workouts\"} done this week");
    expect(source).toContain("const plannedDone = planDays.filter((day) => doneSlots.has(day.key)).length;");
    expect(source).toContain("const moreThisWeek = Math.max(0, record.completedThisWeek - plannedDone);");
    expect(source).toContain("<small>all time</small>");
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

  it("makes Open next workout and Edit plan refer to the same day", () => {
    // Both open the day Home resolved: the primary action the Workout prestart (it never starts
    // a workout), Edit that day in Plan.
    expect(source).toContain('onClick={() => onOpenWorkout(next.week, next.slot.index, "tracker")} className="today-action-cta">Open next workout');
    expect(source).toContain('onClick={() => onOpenWorkout(next.week, next.slot.index, "day-plan")} className="today-action-secondary">Edit plan');
    expect(home).toContain("onOpenWorkout={openPlannedWorkout}");
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
  });

  /**
   * The next workout is Home's own (nextWorkout.ts), so there is no "empty selected day" state:
   * viewing an empty day in Plan cannot become Home's next workout (Sep 28 regression brief §4).
   */
  it("tells loading, no plan and a plan apart, and has no empty-selected-day state", () => {
    expect(source).not.toContain("Choose your next workout");
    expect(source).toContain('aria-label="Loading your plan"');
    expect(source).toContain("Build training around your goals");
    expect(source).toContain("Build your first workout");
    expect(source).toContain("resolveNextWorkout({ ready: plan.ready, week: trainingWeek, slots: plan.slots, store: weekStore, completions: record.completionsThisWeek, choice: plan.choice })");
    expect(home).not.toContain("activeDayIndex={activeSlot.index} onChooseDay");
  });

  it("mounts at Home with direct Training plan, Strength Genome and Exercises actions", () => {
    expect(home).toContain("<TodayActionPanel plan={homePlan}");
    expect(home).toContain('onOpenTraining={() => navigateWorkspace("day-plan")}');
    expect(home).toContain('onOpenStrength={() => navigateWorkspace("strength")}');
    expect(home).toContain('onOpenCatalog={() => navigateWorkspace("catalog")}');
    expect(home).toContain("athleteName={athleteBaseline.preferredName}");
  });
});
