// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { countCompletedSets, finalizeSession, isDraftSet, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, settleDropSet, type DeviceSetLog, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { dropSetLine, dropSetSummary, isDropSet, performedSetLine, setVolume, stageNote, stageProblem, totalReps, volumeText } from "./dropSets";
import { workoutStrengthObservations } from "./workoutStrengthRecord";

beforeEach(() => window.localStorage.clear());

/** The owner's example: 5 at 100 lb, 6 at 70 lb, 10 at 50 lb - one set, three stages. */
const ownerDrop: DeviceSetLog = {
  id: "set-a", type: "drop", completed: true, weight: "100", reps: "5", unit: "lb",
  stages: [
    { id: "set-a-stage-1", weight: "100", reps: "5", unit: "lb" },
    { id: "set-a-stage-2", weight: "70", reps: "6", unit: "lb" },
    { id: "set-a-stage-3", weight: "50", reps: "10", unit: "lb" },
  ],
};
const curl = exercises.find((exercise) => exercise.name === "Barbell Curl")!;

function finished(sets: DeviceSetLog[], name = curl.name, catalogId: number | undefined = curl.id): DeviceWorkoutSession {
  return {
    id: "s", title: "Arms", dayLabel: "Arms", startedAt: "2026-10-06T10:00:00.000Z", completedAt: "2026-10-06T11:00:00.000Z", status: "completed", weightUnit: "lb",
    exercises: [{ id: "e", exerciseName: name, catalogId, plannedPrescription: "3 × 10", sets }],
  };
}

describe("a drop set is one set of ordered stages (Oct 6 brief §4, §5)", () => {
  it("reads the owner's example as one drop set: three stages, 21 reps, 1,420 lb·reps", () => {
    expect(isDropSet(ownerDrop)).toBe(true);
    expect(dropSetLine(ownerDrop, "lb")).toBe("Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10");
    expect(performedSetLine(ownerDrop, "lb")).toBe("Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10");
    expect(dropSetSummary(ownerDrop)).toBe("1 drop set · 3 stages · 21 reps");
    expect(totalReps(ownerDrop)).toBe(21);
    const volume = setVolume(ownerDrop, "lb")!;
    expect(volume.value).toBe(100 * 5 + 70 * 6 + 50 * 10);
    expect(volumeText(volume)).toBe("1,420 lb·reps");
  });

  it("counts once wherever sets are counted", () => {
    const session = finished([ownerDrop, { weight: "60", reps: "10", unit: "lb", completed: true }]);
    expect(countCompletedSets(session)).toBe(2);
  });

  it("never builds a strength estimate from stages added together: stage 1 alone, the set counted once", () => {
    const [observation] = workoutStrengthObservations([finished([ownerDrop])], "lb");
    expect(observation).toMatchObject({ reportedLoad: 100, repetitions: 5, setCount: 1 });
    // Even if the mirrored fields were edited, the estimate reads the first stage.
    const [again] = workoutStrengthObservations([finished([{ ...ownerDrop, weight: "50", reps: "21" }])], "lb");
    expect(again).toMatchObject({ reportedLoad: 100, repetitions: 5 });
  });

  it("works in kilograms, with decimals, as typed", () => {
    const kg: DeviceSetLog = { ...ownerDrop, unit: "kg", weight: "42.5", reps: "6", stages: [
      { id: "1", weight: "42.5", reps: "6", unit: "kg" }, { id: "2", weight: "30", reps: "8", unit: "kg" }, { id: "3", weight: "17.5", reps: "12", unit: "kg" },
    ] };
    expect(dropSetLine(kg, "kg")).toBe("Drop set · 42.5 kg × 6 → 30 kg × 8 → 17.5 kg × 12");
    expect(setVolume(kg, "kg")!.value).toBe(42.5 * 6 + 30 * 8 + 17.5 * 12);
    expect(volumeText(setVolume(kg, "kg")!)).toBe("705 kg·reps");
    // Read in the other unit, each stage converts exactly from the unit it was typed in.
    expect(dropSetLine(kg, "lb")).toBe("Drop set · 93.7 lb × 6 → 66.14 lb × 8 → 38.58 lb × 12");
  });

  it("shows a bodyweight drop as added load down to the body alone, with no external volume", () => {
    const dips: DeviceSetLog = { id: "b", type: "drop", completed: true, weight: "45", reps: "6", unit: "lb", stages: [
      { id: "1", weight: "45", reps: "6", unit: "lb" }, { id: "2", weight: "", reps: "8", unit: "lb" },
    ] };
    expect(dropSetLine(dips, "lb", "bodyweight_reps")).toBe("Drop set · +45 lb × 6 → bodyweight × 8");
    expect(setVolume(dips, "lb", "bodyweight_reps")).toBeNull();
    expect(dropSetSummary(dips)).toBe("1 drop set · 2 stages · 14 reps");
  });

  it("states per-dumbbell volume as per dumbbell, rather than doubling a number nobody typed", () => {
    expect(volumeText(setVolume(ownerDrop, "lb", "per_implement")!)).toBe("1,420 lb·reps per dumbbell");
  });

  it("blocks only what cannot be recorded: whole reps, a numeric load, a load where the exercise has one", () => {
    const options = { loadOptional: false, unit: "lb" as const };
    expect(stageProblem({ weight: "70", reps: "" }, { weight: "100", unit: "lb" }, options)).toBe("Enter the reps for this stage.");
    expect(stageProblem({ weight: "70", reps: "2.5" }, { weight: "100", unit: "lb" }, options)).toBe("Enter the reps for this stage.");
    expect(stageProblem({ weight: "", reps: "6" }, undefined, options)).toBe("Enter the load for this stage.");
    expect(stageProblem({ weight: "1e999", reps: "6" }, undefined, options)).toBe("Enter the load as a number.");
    expect(stageProblem({ weight: "70", reps: "6" }, { weight: "100", unit: "lb" }, options)).toBeNull();
    expect(stageProblem({ weight: "52.5", reps: "8" }, { weight: "60", unit: "lb" }, options)).toBeNull();
    // A heavier or equal stage is not refused: an assisted movement drops by adding assistance.
    expect(stageProblem({ weight: "110", reps: "6" }, { weight: "100", unit: "lb" }, options)).toBeNull();
    // Bodyweight: added load may drop to none.
    expect(stageProblem({ weight: "", reps: "8" }, { weight: "45", unit: "lb" }, { loadOptional: true, unit: "lb" })).toBeNull();
  });

  it("notes, without blocking, a stage that is not lighter than the one before", () => {
    expect(stageNote({ weight: "70" }, { weight: "100", unit: "lb" }, "lb")).toBeNull();
    expect(stageNote({ weight: "100" }, { weight: "100", unit: "lb" }, "lb")).toContain("isn't lighter than the one before (100 lb). It's kept");
    expect(stageNote({ weight: "110" }, { weight: "100", unit: "lb" }, "lb")).toContain("isn't lighter");
    // Compared in one unit: 45 kg is 99.21 lb.
    expect(stageNote({ weight: "95" }, { weight: "45", unit: "kg" }, "lb")).toBeNull();
    expect(stageNote({ weight: "100" }, { weight: "45", unit: "kg" }, "lb")).toContain("99.21 lb");
    expect(stageNote({ weight: "" }, { weight: "45", unit: "lb" }, "lb")).toBeNull();
    expect(stageNote({ weight: "70" }, undefined, "lb")).toBeNull();
  });

  it("closes a drop set left open with the stages that were done: two make a drop set, one an ordinary set", () => {
    const open: DeviceSetLog = { id: "o", type: "drop", completed: false, weight: "40", reps: "", unit: "lb", stages: ownerDrop.stages!.slice(0, 2) };
    expect(settleDropSet(open)).toMatchObject({ type: "drop", completed: true, weight: "100", reps: "5" });
    const single: DeviceSetLog = { ...open, weight: "", stages: ownerDrop.stages!.slice(0, 1) };
    const settled = settleDropSet(single);
    expect(settled).toMatchObject({ completed: true, weight: "100", reps: "5" });
    expect(settled.type).toBeUndefined();
    const active: DeviceWorkoutSession = { ...finished([open, single, { weight: "", reps: "", completed: false }]), status: "active", completedAt: undefined };
    const result = finalizeSession(active, "2026-10-06T11:00:00.000Z");
    expect(result.settledDropSets).toBe(2);
    expect(result.session.exercises[0].sets.map((set) => [set.type ?? "standard", set.stages?.length ?? 0])).toEqual([["drop", 2], ["standard", 0]]);
    // The typed 40 of a next stage was never added, so it is reported as left out.
    expect(result.excludedDrafts).toBe(1);
    expect(isDraftSet(open)).toBe(true);
  });

  it("keeps stages, their ids and their order through storage, and drops anything stored there that is not a stage", () => {
    const stored = finished([{ ...ownerDrop, stages: [...ownerDrop.stages!, null as never, "junk" as never] }]);
    expect(saveDeviceWorkoutSessions([stored])).toBe(true);
    const set = loadDeviceWorkoutSessions()[0].exercises[0].sets[0];
    expect(set.type).toBe("drop");
    expect(set.stages).toEqual(ownerDrop.stages);
    expect(set.id).toBe("set-a");
  });
});
