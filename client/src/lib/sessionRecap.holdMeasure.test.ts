import { describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";
import { correctSet, sessionRecap, type MeasureOf } from "./sessionRecap";
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
    expect(sessionRecap(old, "lb", measureOf).exercises[0].sets[0].hold).toBe(false);
    expect(correctSet(old, "e1", 0, { weight: "", reps: "35" }, "2026-10-17T00:00:00.000Z", measureOf).exercises[0].sets[0]).toMatchObject({ reps: "35" });
  });

  it("leaves every rep exercise, and every reader that passes no measure, as before", () => {
    expect(sessionRecap(emptyHold, "lb", measureOf).exercises[1].sets[0]).toMatchObject({ hold: false, line: "135 lb × 8" });
    expect(sessionRecap(emptyHold, "lb").exercises[0].sets[0].hold).toBe(false);
    expect(correctSet(emptyHold, "e2", 0, { weight: "135", reps: "7" }, "2026-10-17T00:00:00.000Z", measureOf).exercises[1].sets[0].reps).toBe("7");
  });
});
