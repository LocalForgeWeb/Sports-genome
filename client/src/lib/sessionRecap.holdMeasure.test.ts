import { describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";
import { correctSet, exerciseHistory, sessionRecap, type MeasureOf } from "./sessionRecap";
import { workoutStrengthObservations } from "./workoutStrengthRecord";

/**
 * A hold logged before its seconds were required holds no seconds and no reps. Read by what it
 * holds, it looked like a rep set: the editor asked for Reps, and the "reps" typed (the seconds)
 * became a Dead Hang rep observation bound for the account (R2). Read with the exercise's measure,
 * it is a hold: corrected in seconds, and a reps patch is refused.
 */
const measureOf: MeasureOf = (id) => (id === 143 ? "seconds" : "reps");
const workout = (sets: DeviceWorkoutSession["exercises"][number]["sets"]): DeviceWorkoutSession => ({
  id: "w1", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-16T10:00:00.000Z", completedAt: "2026-10-16T10:45:00.000Z", status: "completed", weightUnit: "lb",
  exercises: [
    { id: "e1", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "3 × 30 sec", sets },
    { id: "e2", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "1 × 8", sets: [{ id: "b1", weight: "135", reps: "8", unit: "lb", completed: true }] },
  ],
});
const emptyHold = workout([{ id: "h1", weight: "", reps: "", completed: true }]);

describe("a hold with no seconds, on an exercise measured in seconds", () => {
  it("reads as a hold whose seconds were not recorded", () => {
    const set = sessionRecap(emptyHold, "lb", measureOf).exercises[0].sets[0];
    expect(set).toMatchObject({ hold: true, line: "Seconds not recorded" });
    const loaded = sessionRecap(workout([{ id: "h1", weight: "20", reps: "", unit: "lb", completed: true, side: "left" }]), "lb", measureOf).exercises[0].sets[0];
    expect(loaded.line).toBe("20 lb · seconds not recorded · Left");
  });

  it("is corrected in seconds, and a reps patch is refused rather than stored as reps", () => {
    expect(correctSet(emptyHold, "e1", 0, { weight: "", reps: "30" }, "2026-10-17T00:00:00.000Z", measureOf)).toBe(emptyHold);
    const corrected = correctSet(emptyHold, "e1", 0, { weight: "", holdSeconds: "30" }, "2026-10-17T00:00:00.000Z", measureOf);
    expect(corrected.exercises[0].sets[0]).toMatchObject({ id: "h1", reps: "", holdSeconds: "30" });
    // Seconds never become a rep observation.
    expect(workoutStrengthObservations([corrected], "lb").filter((observation) => observation.exerciseName === "Dead Hang")).toEqual([]);
  });

  it("keeps a set logged in reps before the exercise was measured in seconds as reps", () => {
    const old = workout([{ id: "h1", weight: "", reps: "40", completed: true }]);
    expect(sessionRecap(old, "lb", measureOf).exercises[0].sets[0]).toMatchObject({ hold: false, line: "40 reps" });
    // Worded as the live card words it, so 40 reps never reads as 40 seconds.
    expect(sessionRecap(workout([{ id: "h1", weight: "70", reps: "1", unit: "lb", completed: true }]), "lb", measureOf).exercises[0].sets[0].line).toBe("70 lb · 1 rep");
    expect(correctSet(old, "e1", 0, { weight: "", reps: "35" }, "2026-10-17T00:00:00.000Z", measureOf).exercises[0].sets[0]).toMatchObject({ reps: "35" });
  });

  it("leaves every rep exercise as before, and reads a set by what it holds when told every exercise is reps", () => {
    expect(sessionRecap(emptyHold, "lb", measureOf).exercises[1].sets[0]).toMatchObject({ hold: false, line: "135 lb × 8" });
    expect(sessionRecap(emptyHold, "lb", () => "reps").exercises[0].sets[0].hold).toBe(false);
    expect(correctSet(emptyHold, "e2", 0, { weight: "135", reps: "7" }, "2026-10-17T00:00:00.000Z", measureOf).exercises[1].sets[0].reps).toBe("7");
  });

  it("reads the light list of holds when no measure is passed, so every reader agrees by default", () => {
    // Dead Hang (143) is measured in seconds in the atlas; holdCatalogIds says the same.
    expect(sessionRecap(emptyHold, "lb").exercises[0].sets[0]).toMatchObject({ hold: true, line: "Seconds not recorded" });
    expect(correctSet(emptyHold, "e1", 0, { weight: "", reps: "30" })).toBe(emptyHold);
    expect(correctSet(emptyHold, "e1", 0, { weight: "", holdSeconds: "30" }).exercises[0].sets[0]).toMatchObject({ reps: "", holdSeconds: "30" });
  });
});

/**
 * An exercise's earlier workouts (sessionRecap `exerciseHistory`, shown by ExerciseHistoryList
 * between sets and in the exercise detail) read each set as the recap does: a hold in seconds, a
 * hold logged without its seconds as "Seconds not recorded", never "— lb × —".
 */
describe("an exercise's history", () => {
  const hang = (sets: DeviceWorkoutSession["exercises"][number]["sets"], id = "w1", completedAt = "2026-10-16T10:45:00.000Z") => ({ ...workout(sets), id, completedAt });
  const lines = (sessions: DeviceWorkoutSession[], measure?: MeasureOf) =>
    exerciseHistory({ exerciseName: "Dead Hang", catalogId: 143 }, sessions, "lb", 5, measure).entries.map((entry) => entry.sets.map((set) => set.line));

  it("reads a hold logged without seconds as seconds not recorded, and one with seconds in seconds", () => {
    const sessions = [
      hang([{ id: "h1", weight: "", reps: "", completed: true }, { id: "h2", weight: "20", reps: "", unit: "lb", completed: true, side: "left" }], "old", "2026-10-10T10:45:00.000Z"),
      hang([{ id: "h3", weight: "", reps: "", holdSeconds: "30", completed: true }, { id: "h4", weight: "25", reps: "", holdSeconds: "40", unit: "lb", completed: true }], "new", "2026-10-16T10:45:00.000Z"),
    ];
    expect(lines(sessions)).toEqual([["30 s", "25 lb × 40 s"], ["Seconds not recorded", "20 lb · seconds not recorded · Left"]]);
    expect(lines(sessions).flat().join(" ")).not.toContain("—");
  });

  it("reads the history exactly as the session detail does", () => {
    const session = hang([{ id: "h1", weight: "", reps: "", completed: true }, { id: "h2", weight: "", reps: "", holdSeconds: "35", completed: true }]);
    expect(lines([session])[0]).toEqual(sessionRecap(session, "lb").exercises[0].sets.map((set) => set.line));
  });

  it("keeps a set logged in reps before the exercise was measured in seconds as reps", () => {
    expect(lines([hang([{ id: "h1", weight: "", reps: "40", completed: true }])])).toEqual([["40 reps"]]);
  });

  it("takes an injected measure, as the recap does", () => {
    expect(lines([hang([{ id: "h1", weight: "", reps: "", completed: true }])], () => "reps")[0][0]).not.toBe("Seconds not recorded");
  });
});
