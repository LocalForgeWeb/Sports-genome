import { describe, expect, it } from "vitest";
import type { DeviceWorkoutExercise, DeviceWorkoutSession } from "./deviceWorkoutLog";
import { exercises } from "./exerciseCatalog";
import { dynamicWorkText, holdWorkText, neckLineLabel, neckWeekSummary } from "./neckWeek";

/**
 * The neck's week (the owner's handoff of 23 Oct 2026, §4 "Neck weekly view"; T07, T08, T10, T16,
 * T21): four directions, side bend and rotation by the head's direction, dynamic sets and reps
 * apart from holds and seconds, "No logged work" for an empty direction, and an unknown-direction
 * line for a set logged without one.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
let order = 0;
const exercise = (id: number, sets: DeviceWorkoutExercise["sets"]): DeviceWorkoutExercise => ({ id: `${id}-${order++}`, exerciseName: byId(id).name, catalogId: id, plannedPrescription: "3 × 12", sets });
const session = (id: string, at: string, exercisesIn: DeviceWorkoutExercise[], status: DeviceWorkoutSession["status"] = "completed"): DeviceWorkoutSession => ({ id, title: "Neck", dayLabel: "Week 1 · Day 01 · Neck", startedAt: at, completedAt: status === "completed" ? at : undefined, status, weightUnit: "kg", exercises: exercisesIn });
const hold = (seconds: string, headDirection?: "left" | "right") => ({ weight: "", reps: "", holdSeconds: seconds, completed: true, ...(headDirection ? { headDirection } : {}) });
const dynamic = (reps: string, headDirection?: "left" | "right") => ({ weight: "15", reps, unit: "kg" as const, completed: true, ...(headDirection ? { headDirection } : {}) });
// Wednesday 4 November 2026, local time: the week runs from Monday 2 to Sunday 8.
const now = new Date(2026, 10, 4, 12);
const thisWeek = (day: number) => new Date(2026, 10, day, 18).toISOString();

const line = (summary: ReturnType<typeof neckWeekSummary>, label: string) => summary.lines.find((item) => neckLineLabel(item) === label)!;

describe("the neck's week", () => {
  it("is empty, and says so for every direction, with no neck work logged", () => {
    const summary = neckWeekSummary([session("bench", thisWeek(2), [exercise(1, [dynamic("5")])])], now);
    expect(summary.hasWork).toBe(false);
    expect(summary.lines.map(neckLineLabel)).toEqual(["Flexion", "Extension", "Side bend · Left", "Side bend · Right", "Rotation · Left", "Rotation · Right"]);
    expect(summary.lines.every((item) => item.sets.length === 0)).toBe(true);
  });

  it("splits a manual side bend of right 20 s and left 15 s by direction: 35 s in all, as two holds, no load (T07)", () => {
    const summary = neckWeekSummary([session("a", thisWeek(3), [exercise(435, [hold("20", "right"), hold("15", "left")])])], now);
    expect(summary.hasWork).toBe(true);
    expect(line(summary, "Side bend · Right").work).toEqual({ sets: 0, reps: 0, holds: 1, seconds: 20 });
    expect(line(summary, "Side bend · Left").work).toEqual({ sets: 0, reps: 0, holds: 1, seconds: 15 });
    expect(summary.lines.reduce((total, item) => total + item.work.seconds, 0)).toBe(35);
    expect(summary.lines.reduce((total, item) => total + item.sets.length, 0)).toBe(2);
  });

  it("counts a right rotation set as right rotation only (T08)", () => {
    const summary = neckWeekSummary([session("r", thisWeek(3), [exercise(436, [hold("20", "right")])])], now);
    expect(summary.lines.filter((item) => item.sets.length).map(neckLineLabel)).toEqual(["Rotation · Right"]);
    expect(line(summary, "Rotation · Right").work.seconds).toBe(20);
  });

  it("counts a dynamic set of 12 as 12 reps, never 12 seconds (T16)", () => {
    const summary = neckWeekSummary([session("d", thisWeek(2), [exercise(425, [dynamic("12")])])], now);
    expect(line(summary, "Flexion").work).toEqual({ sets: 1, reps: 12, holds: 0, seconds: 0 });
  });

  it("keeps holds and dynamic work in separate columns, with no mixed sum anywhere (T21)", () => {
    const summary = neckWeekSummary([
      session("mon", thisWeek(2), [exercise(426, [dynamic("12"), dynamic("10")]), exercise(434, [hold("30"), hold("25")])]),
      session("thu", thisWeek(5), [exercise(430, [dynamic("15")]), exercise(428, [dynamic("8")])]),
    ], now);
    const extension = line(summary, "Extension");
    expect(extension.work).toEqual({ sets: 4, reps: 45, holds: 2, seconds: 55 });
    expect([dynamicWorkText(extension.work), holdWorkText(extension.work)]).toEqual(["4 sets · 45 reps", "2 holds · 55 s"]);
    expect(extension.sets.map((set) => [set.exerciseName, set.hold, set.reps, set.seconds])).toEqual([
      [byId(426).name, false, 12, null], [byId(426).name, false, 10, null], [byId(434).name, true, 0, 30], [byId(434).name, true, 0, 25], [byId(430).name, false, 15, null], [byId(428).name, false, 8, null],
    ]);
    expect(dynamicWorkText(line(summary, "Flexion").work)).toBeNull();
  });

  it("puts a side-bend or rotation set logged without a direction on its own unknown-direction line, never on Left or Right (T10)", () => {
    const summary = neckWeekSummary([session("u", thisWeek(3), [exercise(431, [dynamic("10")]), exercise(436, [hold("20"), hold("20", "left")])])], now);
    expect(line(summary, "Side bend · Unknown direction").work).toEqual({ sets: 1, reps: 10, holds: 0, seconds: 0 });
    expect(line(summary, "Rotation · Unknown direction").work).toEqual({ sets: 0, reps: 0, holds: 1, seconds: 20 });
    expect(line(summary, "Rotation · Left").work.seconds).toBe(20);
    expect(line(summary, "Side bend · Left").sets).toEqual([]);
    expect(line(summary, "Side bend · Right").sets).toEqual([]);
  });

  it("counts a drop set once with its stages' reps, and leaves out warm-ups, skipped and unlogged sets, other weeks and open workouts", () => {
    const drop = { id: "d", weight: "20", reps: "10", unit: "kg" as const, completed: true, type: "drop" as const, headDirection: "right" as const, stages: [{ id: "d-1", weight: "20", reps: "10" }, { id: "d-2", weight: "15", reps: "8" }] };
    const summary = neckWeekSummary([
      session("w", thisWeek(4), [exercise(427, [drop, { ...dynamic("12", "left"), warmup: true }, { ...dynamic("12", "left"), skipped: true }, { ...dynamic("12", "left"), completed: false }])]),
      session("last", new Date(2026, 10, 1, 18).toISOString(), [exercise(425, [dynamic("12")])]),
      session("next", new Date(2026, 10, 9, 8).toISOString(), [exercise(425, [dynamic("12")])]),
      session("open", thisWeek(4), [exercise(425, [dynamic("12")])], "active"),
    ], now);
    expect(line(summary, "Side bend · Right").work).toEqual({ sets: 1, reps: 18, holds: 0, seconds: 0 });
    expect(line(summary, "Side bend · Left").sets).toEqual([]);
    expect(line(summary, "Flexion").sets).toEqual([]);
    expect([summary.from.getDay(), summary.from.getDate(), summary.to.getDate()]).toEqual([1, 2, 9]);
  });

  it("reads a hold logged without its seconds as a hold, and reps logged on a timed row as reps", () => {
    const summary = neckWeekSummary([session("x", thisWeek(3), [exercise(433, [{ weight: "", reps: "", completed: true }, { weight: "", reps: "10", completed: true }])])], now);
    expect(line(summary, "Flexion").work).toEqual({ sets: 1, reps: 10, holds: 1, seconds: 0 });
    expect(line(summary, "Flexion").sets[0].seconds).toBeNull();
  });
});
