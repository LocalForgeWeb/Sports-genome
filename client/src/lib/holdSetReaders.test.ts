// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import type { DeviceSetLog, DeviceWorkoutSession } from "./deviceWorkoutLog";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions } from "./deviceWorkoutLog";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import { dropSetSummary, performedSetLine, setVolume, totalReps } from "./dropSets";
import { correctSet, exerciseHistory, removeSet, sessionRecap, sideLabel, strapsLabel, updateFinishedSession } from "./sessionRecap";
import { isHoldEntry, setEntryFieldsFor } from "./setEntryFields";
import { exercises } from "./exerciseCatalog";
import { applySwap, swapMeasurementNotes, type SwapTarget } from "./workoutSwap";

/**
 * Every reader of a set's reps and load meets holds now: a set with `holdSeconds` and no reps.
 * None of them may turn seconds into reps, an estimated max or volume-load, none may print NaN,
 * and every count of completed sets still counts the hold (02-design.md §3, "Not converted").
 */
const set = (weight: string, reps: string, extra: Partial<DeviceSetLog> = {}): DeviceSetLog => ({ weight, reps, height: "", unit: "lb", completed: true, skipped: false, ...extra });
const hold = (seconds: string, extra: Partial<DeviceSetLog> = {}) => set("", "", { holdSeconds: seconds, ...extra });

const workout = (): DeviceWorkoutSession => ({
  id: "w1", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-16T10:00:00.000Z", completedAt: "2026-10-16T10:45:00.000Z", status: "completed", weightUnit: "lb",
  exercises: [
    { id: "hang", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "3 × 30", sets: [hold("30"), hold("35", { weight: "20" }), hold("40", { side: "both" })], plannedSets: 3, skippedSets: 0 },
    { id: "carry", exerciseName: "Farmer Hold", catalogId: 145, plannedPrescription: "2 × 40", straps: "yes", sets: [hold("40", { weight: "70", side: "left" }), hold("40", { weight: "70", side: "right" })], plannedSets: 2, skippedSets: 0 },
    { id: "row", exerciseName: "Single-Arm Cable Row", catalogId: 56, plannedPrescription: "2 × 10", straps: "no", sets: [set("50", "10", { side: "left", id: "r1" }), set("50", "10", { side: "right", id: "r2" })], plannedSets: 2, skippedSets: 0 },
  ],
});

afterEach(() => localStorage.clear());

describe("strength records skip holds", () => {
  it("makes no estimated max from a hold, and no NaN anywhere", () => {
    const observations = workoutStrengthObservations([workout()]);
    expect(observations.map((item) => item.exerciseName)).toEqual(["Single-Arm Cable Row"]);
    const [row] = observations;
    expect(row.repetitions).toBe(10);
    expect(row.setCount).toBe(2);
    expect(JSON.stringify(observations)).not.toContain("NaN");
    for (const value of Object.values(row)) if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
  });

  it("skips a hold even when reps were stored beside its seconds", () => {
    const odd = workout();
    odd.exercises = [{ ...odd.exercises[0], sets: [hold("30", { weight: "100", reps: "5" })] }];
    expect(workoutStrengthObservations([odd])).toEqual([]);
  });

  it("leaves a warm-up set out of the working set it reads", () => {
    const warm = workout();
    warm.exercises = [{ ...warm.exercises[2], sets: [set("200", "3", { warmup: true }), set("50", "10")] }];
    const [row] = workoutStrengthObservations([warm]);
    expect(row).toMatchObject({ repetitions: 10, setCount: 1 });
  });
});

describe("volume and reps ignore hold seconds", () => {
  it("gives a hold no volume-load and no reps, and prints its seconds", () => {
    const weighted = hold("40", { weight: "70" });
    expect(setVolume(weighted, "lb")).toBeNull();
    expect(setVolume(hold("30"), "lb")).toBeNull();
    expect(totalReps(weighted)).toBe(0);
    expect(performedSetLine(hold("30"), "lb")).toBe("30 s");
    expect(performedSetLine(weighted, "lb")).toBe("70 lb × 40 s");
    expect(performedSetLine(hold("45", { weight: "20" }), "lb", "bodyweight_reps")).toBe("+20 lb × 45 s");
    expect(performedSetLine(hold("30"), "lb", "bodyweight_reps")).toBe("30 s");
    // A load typed in the other unit is shown in the record's unit, as for any set.
    expect(performedSetLine(hold("30", { weight: "20", unit: "kg" }), "kg")).toBe("20 kg × 30 s");
    expect(`${dropSetSummary(weighted)}`).not.toContain("NaN");
  });

  it("still gives an ordinary set its volume and line", () => {
    expect(setVolume(set("100", "5"), "lb")).toEqual({ value: 500, unit: "lb", basis: "total" });
    expect(performedSetLine(set("100", "5"), "lb")).toBe("100 lb × 5");
  });
});

describe("the recap and session detail show holds, arms and straps", () => {
  it("shows a hold in seconds, the arm where recorded, and straps where recorded", () => {
    const recap = sessionRecap(workout(), "lb");
    const [hang, carry, row] = recap.exercises;
    expect(hang.sets.map((item) => item.line)).toEqual(["30 s", "20 lb × 35 s", "40 s · Both arms"]);
    expect(hang.sets.map((item) => item.hold)).toEqual([true, true, true]);
    expect(hang.straps).toBeNull();
    expect(carry.sets.map((item) => item.line)).toEqual(["70 lb × 40 s · Left", "70 lb × 40 s · Right"]);
    expect(carry.straps).toBe("Straps used");
    expect(row.sets.map((item) => [item.line, item.side, item.hold])).toEqual([["50 lb × 10 · Left", "Left", false], ["50 lb × 10 · Right", "Right", false]]);
    expect(row.straps).toBe("Straps not used");
  });

  it("counts every hold as a completed working set", () => {
    const recap = sessionRecap(workout(), "lb");
    expect(recap.totals).toEqual({ exercises: 3, workingSets: 7 });
    expect(recap.exercises[0].completed).toBe(3);
  });

  it("names sides and straps plainly, and says nothing where nothing was recorded", () => {
    expect([sideLabel("left"), sideLabel("right"), sideLabel("both"), sideLabel(undefined)]).toEqual(["Left", "Right", "Both arms", null]);
    expect([strapsLabel("yes"), strapsLabel("no"), strapsLabel(undefined)]).toEqual(["Straps used", "Straps not used", null]);
  });

  it("shows holds and arms in an exercise's history too", () => {
    const { entries } = exerciseHistory({ exerciseName: "Farmer Hold", catalogId: 145 }, [workout()], "lb");
    expect(entries[0].sets.map((item) => item.line)).toEqual(["70 lb × 40 s · Left", "70 lb × 40 s · Right"]);
  });
});

describe("corrections keep what they do not change", () => {
  it("corrects a hold in seconds and keeps its arm, id and the exercise's straps", () => {
    const fixed = correctSet(workout(), "carry", 0, { weight: "75", holdSeconds: "42" }, "2026-10-16T12:00:00.000Z");
    expect(fixed.exercises[1].sets[0]).toMatchObject({ weight: "75", holdSeconds: "42", reps: "", side: "left" });
    expect(fixed.exercises[1].straps).toBe("yes");
    expect(fixed.correctedAt).toBe("2026-10-16T12:00:00.000Z");
  });

  it("refuses seconds that are not a whole number of at least 1, and reps on a hold", () => {
    const before = workout();
    expect(correctSet(before, "carry", 0, { weight: "75", holdSeconds: "0" })).toBe(before);
    expect(correctSet(before, "carry", 0, { weight: "75", holdSeconds: "4.5" })).toBe(before);
    expect(correctSet(before, "carry", 0, { weight: "75", reps: "8" })).toBe(before);
  });

  it("corrects an ordinary set in reps and keeps its arm and id", () => {
    const fixed = correctSet(workout(), "row", 1, { weight: "55", reps: "9" });
    expect(fixed.exercises[2].sets[1]).toMatchObject({ id: "r2", weight: "55", reps: "9", side: "right" });
    expect(fixed.exercises[2].straps).toBe("no");
  });

  it("keeps the other sets' fields when one set is removed, and the stored record keeps them too", () => {
    localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([workout()]));
    const result = updateFinishedSession("w1", (current) => removeSet(current, "carry", 0));
    expect(result).not.toBeNull();
    const stored = loadDeviceWorkoutSessions()[0];
    expect(stored.exercises[1]).toMatchObject({ straps: "yes", sets: [{ holdSeconds: "40", side: "right", weight: "70" }] });
  });
});

describe("the entry boxes for a hold", () => {
  const byName = (name: string) => exercises.find((exercise) => exercise.name === name);
  const shape = (name: string, measure: "reps" | "seconds") => setEntryFieldsFor(byName(name), "lb", measure).map((field) => `${field.label} (${field.unit})${field.optional ? " optional" : ""}`);

  it("asks the load, optional for a bodyweight hang, then seconds", () => {
    expect(shape("Dead Hang", "seconds")).toEqual(["Added weight (lb) optional", "Seconds (sec)"]);
    expect(shape("Farmer Hold", "seconds")).toEqual(["Weight (lb)", "Seconds (sec)"]);
    expect(isHoldEntry(setEntryFieldsFor(byName("Dead Hang"), "lb", "seconds"))).toBe(true);
  });

  it("is unchanged where the measure is reps, which is the default", () => {
    expect(shape("Dead Hang", "reps")).toEqual(["Added weight (lb) optional"]);
    expect(setEntryFieldsFor(byName("Dead Hang"))).toEqual(setEntryFieldsFor(byName("Dead Hang"), "lb", "reps"));
    expect(isHoldEntry(setEntryFieldsFor(byName("Barbell Bench Press"), "lb", "reps"))).toBe(false);
  });
});

describe("the swap sheet's notes on how each exercise is logged", () => {
  const byName = (name: string) => exercises.find((exercise) => exercise.name === name);
  const seconds = (exercise: { id: number } | undefined) => (exercise?.id === 143 ? "seconds" as const : "reps" as const);

  it("says when the new exercise is logged in seconds, and drops the 'logged in reps' note for a hold", () => {
    const notes = swapMeasurementNotes(byName("Pull-Up"), byName("Dead Hang"), "3 × 30 s", seconds);
    expect(notes).toContain("Dead Hang is logged in seconds held, not reps.");
    expect(notes.some((note) => note.includes("logged in reps, so set the reps"))).toBe(false);
    expect(swapMeasurementNotes(byName("Dead Hang"), byName("Pull-Up"), "3 × 8", seconds)).toContain("Pull-Up is logged in reps, not seconds.");
  });

  it("says nothing new when no measure is given", () => {
    expect(swapMeasurementNotes(byName("Pull-Up"), byName("Dead Hang"), "3 × 30 s").some((note) => note.includes("seconds held"))).toBe(false);
  });
});

describe("a typed-but-unlogged set reused on a swapped-in exercise", () => {
  // Dead Hang (143) and Farmer Hold (145) are holds here; everything else is logged in reps.
  const measureOf = (target: SwapTarget) => (target.id === 143 || target.id === 145 ? "seconds" as const : "reps" as const);
  const running = (exercise: { name: string; id: number }, typed: DeviceSetLog): DeviceWorkoutSession => ({
    ...workout(), status: "active", completedAt: undefined,
    exercises: [{ id: "from", exerciseName: exercise.name, catalogId: exercise.id, plannedPrescription: "2 × 30", sets: [typed, { weight: "", reps: "", completed: false }] }],
  });
  const swap = (before: DeviceWorkoutSession, target: SwapTarget) =>
    applySwap(before, "from", target, { swapId: "w", newExerciseId: "to", at: "2026-10-16T10:30:00.000Z", draft: "reuse", measureOf }, exercises).session.exercises[0].sets[0];

  it("carries a hold's seconds to another hold, never the load", () => {
    expect(swap(running({ name: "Dead Hang", id: 143 }, { weight: "20", reps: "", holdSeconds: "35", completed: false }), { name: "Farmer Hold", id: 145 }))
      .toEqual({ weight: "", reps: "", holdSeconds: "35", completed: false });
  });

  it("carries nothing between a hold and an exercise logged in reps: seconds never become reps, nor reps seconds", () => {
    expect(swap(running({ name: "Dead Hang", id: 143 }, { weight: "", reps: "", holdSeconds: "35", completed: false }), { name: "Pull-Up", id: 66 }))
      .toEqual({ weight: "", reps: "", completed: false });
    expect(swap(running({ name: "Pull-Up", id: 66 }, { weight: "", reps: "8", completed: false }), { name: "Dead Hang", id: 143 }))
      .toEqual({ weight: "", reps: "", completed: false });
  });

  it("still carries reps between two exercises logged in reps", () => {
    expect(swap(running({ name: "Pull-Up", id: 66 }, { weight: "", reps: "8", completed: false }), { name: "Chin-Up", id: 67 }))
      .toEqual({ weight: "", reps: "8", completed: false });
  });
});
