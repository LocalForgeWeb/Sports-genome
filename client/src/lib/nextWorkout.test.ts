import { describe, expect, it } from "vitest";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { Exercise } from "@/lib/exerciseCatalog";
import { planDayLabel, resolveNextWorkout, slotOfDayLabel, slotsDoneThisWeek, trainingWeekFor, weekOfDayLabel, type NextWorkoutChoice } from "@/lib/nextWorkout";

const slots = buildDaySlots(["Push", "Pull", "Legs", "Upper", "Sport Transfer"]);
const exercisesOf = (count: number) => Array.from({ length: count }, (_, id) => ({ id: id + 1 }) as unknown as Exercise);
/** The recording's plan: Push, Pull and Legs built, Upper empty, Sport Transfer built. */
function store(counts: Record<string, number>): WeeklyDayStore {
  const next = emptyDayStore();
  for (const slot of slots) next.plan[slot.key] = exercisesOf(counts[slot.day] ?? 0);
  return next;
}
const recorded = store({ Push: 5, Pull: 3, Legs: 3, Upper: 0, "Sport Transfer": 1 });
const base = { ready: true, week: 1, slots, store: recorded, completions: [], choice: null };

describe("resolveNextWorkout", () => {
  it("says nothing it could be wrong about while the plan is loading", () => {
    expect(resolveNextWorkout({ ...base, ready: false })).toEqual({ kind: "loading" });
  });

  it("tells no plan apart from a plan with an empty day", () => {
    expect(resolveNextWorkout({ ...base, store: emptyDayStore() }).kind).toBe("none");
  });

  it("is the first built day, whatever day Plan was last showing", () => {
    // There is no inspected-day input at all: browsing Plan to the empty Upper cannot reach this.
    const result = resolveNextWorkout(base);
    expect(result.kind === "workout" && result.slot.day).toBe("Push");
    expect(result.kind === "workout" && result.exerciseCount).toBe(5);
  });

  it("moves on once a day is finished this week, and passes over a day not built yet", () => {
    const pushDone = resolveNextWorkout({ ...base, completions: [{ dayLabel: "Week 1 · Day 01 · Push", at: "2026-09-28T10:00:00Z" }] });
    expect(pushDone.kind === "workout" && pushDone.slot.day).toBe("Pull");
    const threeDone = resolveNextWorkout({ ...base, completions: ["Push", "Pull", "Legs"].map((day, index) => ({ dayLabel: planDayLabel(1, slots[index]), at: "2026-09-28T10:00:00Z" })) });
    // Upper is empty: not a rest day, a day not built yet, so Sport Transfer is next.
    expect(threeDone.kind === "workout" && threeDone.slot.day).toBe("Sport Transfer");
  });

  it("counts a day done this week whichever plan week the session was started from", () => {
    const result = resolveNextWorkout({ ...base, completions: [{ dayLabel: "Week 2 · Day 01 · Push", at: "2026-09-28T10:00:00Z" }] });
    expect(result.kind === "workout" && result.slot.day).toBe("Pull");
  });

  it("says the week is complete when every built day is done, and still names a day to reopen", () => {
    const done = ["Push", "Pull", "Legs", "Sport Transfer"].map((day) => ({ dayLabel: `Week 1 · ${slots.find((slot) => slot.day === day)!.ordinal} · ${day}`, at: "2026-09-28T10:00:00Z" }));
    const result = resolveNextWorkout({ ...base, completions: done });
    expect(result.kind).toBe("weekComplete");
    expect(result.kind === "weekComplete" && result.slot.day).toBe("Push");
  });

  it("honours an explicit choice to train another day until that day is trained", () => {
    const choice: NextWorkoutChoice = { week: 1, index: 2, day: "Legs", madeAt: "2026-09-28T09:00:00Z" };
    const chosen = resolveNextWorkout({ ...base, choice });
    expect(chosen.kind === "workout" && chosen.slot.day).toBe("Legs");
    expect(chosen.kind === "workout" && chosen.source).toBe("choice");
    const trained = resolveNextWorkout({ ...base, choice, completions: [{ dayLabel: "Week 1 · Day 03 · Legs", at: "2026-09-28T11:00:00Z" }] });
    expect(trained.kind === "workout" && trained.slot.day).toBe("Push");
  });

  it("keeps a choice to repeat a day already done earlier this week", () => {
    const choice: NextWorkoutChoice = { week: 1, index: 0, day: "Push", madeAt: "2026-09-28T12:00:00Z" };
    const result = resolveNextWorkout({ ...base, choice, completions: [{ dayLabel: "Week 1 · Day 01 · Push", at: "2026-09-28T08:00:00Z" }] });
    expect(result.kind === "workout" && result.slot.day).toBe("Push");
  });

  it("ignores a choice of an empty day or of another plan week", () => {
    expect(resolveNextWorkout({ ...base, choice: { week: 1, index: 3, day: "Upper", madeAt: "2026-09-28T09:00:00Z" } }).kind === "workout").toBe(true);
    const empty = resolveNextWorkout({ ...base, choice: { week: 1, index: 3, day: "Upper", madeAt: "2026-09-28T09:00:00Z" } });
    expect(empty.kind === "workout" && empty.slot.day).toBe("Push");
    const otherWeek = resolveNextWorkout({ ...base, choice: { week: 2, index: 2, day: "Legs", madeAt: "2026-09-28T09:00:00Z" } });
    expect(otherWeek.kind === "workout" && otherWeek.slot.day).toBe("Push");
  });

  it("resolves a repeated label by position: a four-day Upper/Lower split", () => {
    const upperLower = buildDaySlots(["Upper", "Lower", "Upper", "Lower"]);
    const split = emptyDayStore();
    for (const slot of upperLower) split.plan[slot.key] = exercisesOf(2);
    const result = resolveNextWorkout({ ...base, slots: upperLower, store: split, completions: [{ dayLabel: "Week 1 · Day 01 · Upper", at: "2026-09-28T10:00:00Z" }, { dayLabel: "Week 1 · Day 02 · Lower", at: "2026-09-28T10:00:00Z" }] });
    expect(result.kind === "workout" && result.slot.ordinal).toBe("Day 03");
  });
});

describe("helpers", () => {
  it("reads the slot and the plan week out of a session label", () => {
    expect(slotOfDayLabel("Week 2 · Day 03 · Legs")).toBe("Day 03 · Legs");
    expect(weekOfDayLabel("Week 2 · Day 03 · Legs")).toBe(2);
    expect(weekOfDayLabel("Push")).toBeNull();
    expect(slotsDoneThisWeek([{ dayLabel: "Week 1 · Day 01 · Push", at: "" }, { dayLabel: "Week 2 · Day 01 · Push", at: "" }]).size).toBe(1);
  });

  it("trains from the chosen week, else the latest session's week, else Week 1", () => {
    expect(trainingWeekFor({ choice: null, latestSessionDayLabel: null, weeks: [1, 2] })).toBe(1);
    expect(trainingWeekFor({ choice: null, latestSessionDayLabel: "Week 2 · Day 01 · Push", weeks: [1, 2] })).toBe(2);
    expect(trainingWeekFor({ choice: null, latestSessionDayLabel: "Week 3 · Day 01 · Push", weeks: [1, 2] })).toBe(1);
    expect(trainingWeekFor({ choice: { week: 1, index: 0, day: "Push", madeAt: "" }, latestSessionDayLabel: "Week 2 · Day 01 · Push", weeks: [1, 2] })).toBe(1);
  });
});
