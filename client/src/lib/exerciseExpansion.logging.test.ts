// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { carriedEntryFor, finalizeSession, isDraftSet, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, type DeviceSetLog, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { dropSetSummary, performedSetLine, setVolume, totalReps, volumeText } from "./dropSets";
import { setCountFieldFor, setEntryFieldsFor } from "./setEntryFields";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import { applySwap, swapMeasurementNotes } from "./workoutSwap";
import { loadConventionFor } from "@shared/loadConventions";

const byName = (name: string) => { const found = exercises.find((exercise) => exercise.name === name); if (!found) throw new Error(`no exercise ${name}`); return found; };
const neckHold = byName("Isometric Neck Lateral Flexion");
const suitcase = byName("Suitcase Carry");
const assistedPullUp = byName("Assisted Pull-Up Machine");
const sideBend = byName("Dumbbell Side Bend");
const gripper = byName("Hand Gripper Close");
const zercher = byName("Zercher Deadlift");
const backSquat = byName("Back Squat");
const safetyBar = byName("Safety-Bar Squat");

function session(entries: { exercise: typeof neckHold; sets: DeviceSetLog[]; prescription?: string }[], extra: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession {
  return {
    id: "s-expansion", title: "Expansion", dayLabel: "Week 1 · Upper", startedAt: "2026-10-06T10:00:00.000Z", status: "completed", completedAt: "2026-10-06T11:00:00.000Z", weightUnit: "lb",
    exercises: entries.map(({ exercise, sets, prescription }, index) => ({ id: `${exercise.id}-${index}`, exerciseName: exercise.name, catalogId: exercise.id, plannedPrescription: prescription ?? "3 × 10", sets })),
    ...extra,
  };
}

beforeEach(() => window.localStorage.clear());

describe("what each new exercise asks for at entry time (brief §8)", () => {
  it("asks a hold for seconds, a carry for distance, everything else for reps", () => {
    expect(setCountFieldFor(neckHold)).toMatchObject({ measure: "seconds", label: "Hold", unit: "s" });
    expect(setCountFieldFor(suitcase)).toMatchObject({ measure: "distance", label: "Distance", unit: "m" });
    expect(setCountFieldFor(zercher)).toMatchObject({ measure: "reps" });
  });

  it("names the load as what it is: nothing for a hold, assistance, one dumbbell, a setting", () => {
    expect(setEntryFieldsFor(neckHold)).toEqual([]);
    expect(setEntryFieldsFor(assistedPullUp, "kg")).toEqual([expect.objectContaining({ measure: "weight", label: "Assistance", unit: "kg", optional: false })]);
    expect(setEntryFieldsFor(sideBend)).toEqual([expect.objectContaining({ label: "Weight per dumbbell" })]);
    expect(setEntryFieldsFor(suitcase)).toEqual([expect.objectContaining({ label: "Weight per hand" })]);
    expect(setEntryFieldsFor(gripper)).toEqual([expect.objectContaining({ measure: "setting", label: "Gripper", optional: false })]);
    expect(setEntryFieldsFor(byName("Band-Resisted Neck Flexion"))).toEqual([expect.objectContaining({ measure: "setting", label: "Band", optional: true })]);
    expect(setEntryFieldsFor(byName("Hub Grip Lift")).map((field) => field.measure)).toEqual(["weight", "setting"]);
  });
});

describe("timed, distance, assisted and setting sets survive the record (brief §12 session fixtures)", () => {
  it("keeps a timed set timed through save and reload, and never turns seconds into reps", () => {
    const hold: DeviceSetLog = { weight: "", reps: "", seconds: "20", side: "left", completed: true };
    saveDeviceWorkoutSessions([session([{ exercise: neckHold, sets: [hold, { ...hold, side: "right" }], prescription: "2 × 20 s" }])]);
    const [loaded] = loadDeviceWorkoutSessions();
    expect(loaded.exercises[0].sets).toEqual([{ weight: "", reps: "", height: "", seconds: "20", side: "left", completed: true, skipped: false }, { weight: "", reps: "", height: "", seconds: "20", side: "right", completed: true, skipped: false }]);
    expect(performedSetLine(loaded.exercises[0].sets[0], "lb", loadConventionFor(neckHold.id))).toBe("20 s hold · left");
    expect(workoutStrengthObservations([loaded])).toEqual([]);
    expect(isDraftSet({ weight: "", reps: "", seconds: "15", completed: false })).toBe(true);
  });

  it("keeps a carry as load over distance, per hand, with its side", () => {
    const carry: DeviceSetLog = { weight: "24", unit: "kg", reps: "", distance: "30", distanceUnit: "m", side: "left", completed: true };
    saveDeviceWorkoutSessions([session([{ exercise: suitcase, sets: [carry], prescription: "1 × 30 m" }], { weightUnit: "kg" })]);
    const [loaded] = loadDeviceWorkoutSessions();
    expect(loaded.exercises[0].sets[0]).toMatchObject({ weight: "24", unit: "kg", distance: "30", distanceUnit: "m", side: "left" });
    expect(performedSetLine(loaded.exercises[0].sets[0], "kg", loadConventionFor(suitcase.id))).toBe("24 kg per hand · 30 m · left");
    // In pounds, the physical load is converted exactly and the stored number is untouched.
    expect(performedSetLine(loaded.exercises[0].sets[0], "lb", loadConventionFor(suitcase.id))).toBe("52.91 lb per hand · 30 m · left");
    expect(setVolume(loaded.exercises[0].sets[0], "kg", loadConventionFor(suitcase.id))).toBeNull();
    expect(workoutStrengthObservations([loaded])).toEqual([]);
  });

  it("reads an assisted set as assistance, with no volume and no strength estimate", () => {
    const assisted: DeviceSetLog = { weight: "40", unit: "lb", reps: "8", completed: true };
    const recorded = session([{ exercise: assistedPullUp, sets: [assisted, { ...assisted, weight: "30" }] }]);
    expect(performedSetLine(assisted, "lb", loadConventionFor(assistedPullUp.id))).toBe("40 lb assist × 8");
    expect(setVolume(assisted, "lb", loadConventionFor(assistedPullUp.id))).toBeNull();
    expect(workoutStrengthObservations([recorded])).toEqual([]);
  });

  it("reads a gripper set by its setting, never as a weight", () => {
    expect(performedSetLine({ weight: "", reps: "5", setting: "CoC #1", side: "right", completed: true }, "lb", loadConventionFor(gripper.id))).toBe("CoC #1 × 5 · right");
  });

  it("keeps one dumbbell as one dumbbell in the strength record", () => {
    const [observation] = workoutStrengthObservations([session([{ exercise: sideBend, sets: [{ weight: "50", unit: "lb", reps: "12", side: "left", completed: true }] }])]);
    expect(observation).toMatchObject({ exerciseName: "Dumbbell Side Bend", loadSemantics: "per_implement", reportedLoad: 50, repetitions: 12 });
  });

  it("offers the last hold's seconds for the next set, but not its side", () => {
    const current = session([{ exercise: neckHold, sets: [{ weight: "", reps: "", seconds: "25", side: "left", completed: true }, { weight: "", reps: "", completed: false }] }], { status: "active" });
    const carried = carriedEntryFor(current.exercises[0], 1, []);
    expect(carried).toMatchObject({ seconds: "25", source: "session" });
    expect(carried).not.toHaveProperty("side");
  });

  it("loads a session saved before these fields existed exactly as it was", () => {
    const old = session([{ exercise: backSquat, sets: [{ weight: "225", reps: "5", unit: "lb", completed: true }] }]);
    window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify([old]));
    const [loaded] = loadDeviceWorkoutSessions();
    expect(loaded.exercises[0].sets[0]).toEqual({ weight: "225", reps: "5", unit: "lb", height: "", completed: true, skipped: false });
  });
});

describe("drop sets and swaps on a new exercise (brief §8)", () => {
  it("keeps 100 × 5 → 70 × 6 → 50 × 10 one parent set: 3 stages, 21 reps, 1,420 lb·reps, estimated from stage 1 only", () => {
    const drop: DeviceSetLog = { id: "set-1", type: "drop", weight: "100", reps: "5", unit: "lb", completed: true, stages: [
      { id: "set-1-stage-1", weight: "100", reps: "5", unit: "lb" }, { id: "set-1-stage-2", weight: "70", reps: "6", unit: "lb" }, { id: "set-1-stage-3", weight: "50", reps: "10", unit: "lb" },
    ] };
    const recorded = finalizeSession(session([{ exercise: zercher, sets: [drop] }], { status: "active" }), "2026-10-06T11:00:00.000Z").session;
    expect(recorded.exercises[0].sets).toHaveLength(1);
    expect(totalReps(recorded.exercises[0].sets[0])).toBe(21);
    expect(dropSetSummary(recorded.exercises[0].sets[0])).toBe("1 drop set · 3 stages · 21 reps");
    expect(volumeText(setVolume(recorded.exercises[0].sets[0], "lb", loadConventionFor(zercher.id))!)).toBe("1,420 lb·reps");
    const [observation] = workoutStrengthObservations([recorded]);
    expect(observation).toMatchObject({ reportedLoad: 100, repetitions: 5, setCount: 1 });
  });

  it("swaps Back Squat for the Safety-Bar Squat mid-session without touching the completed sets", () => {
    const done: DeviceSetLog = { weight: "225", reps: "5", unit: "lb", completed: true };
    const open: DeviceSetLog = { weight: "", reps: "", completed: false };
    const before = session([{ exercise: backSquat, sets: [done, done, open, open], prescription: "4 × 5" }], { status: "active" });
    const { session: after } = applySwap(before, before.exercises[0].id, { name: safetyBar.name, id: safetyBar.id }, { swapId: "swap-ssb", newExerciseId: "ssb-1", at: "2026-10-06T10:30:00.000Z" }, exercises);
    expect(after.exercises.map((exercise) => [exercise.exerciseName, exercise.catalogId, exercise.sets.length])).toEqual([["Back Squat", backSquat.id, 2], ["Safety-Bar Squat", safetyBar.id, 2]]);
    expect(after.exercises[0].sets).toEqual([done, done]);
  });

  it("says when a swap changes what a set counts", () => {
    expect(swapMeasurementNotes(backSquat, suitcase, "4 × 5")).toEqual(expect.arrayContaining([
      "Suitcase Carry is logged in distance covered, not reps.",
      "The plan's target (4 × 5) is reps; Suitcase Carry is logged in distance covered, so set them as you go.",
    ]));
    expect(swapMeasurementNotes(byName("Isometric Neck Rotation"), neckHold, "3 × 20 s")).toEqual([]);
  });
});
