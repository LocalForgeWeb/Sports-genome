// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  carriedEntryFor, deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, setWeightKg, stampLegacyWeightUnits, weightInUnit,
  type DeviceWorkoutSession,
} from "./deviceWorkoutLog";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import { setEntryFieldsFor } from "./setEntryFields";

/**
 * A logged weight carries the unit it was typed in (Backend V1 B024, B025, B048, B243;
 * inventory PS-10, EN-08, TR-06). Before this, set weights were stored as bare numbers
 * and every screen read them in the profile's unit of the day: a 225 lb squat became
 * 225 kg the moment the profile switched to kg, and was synced to the account that way.
 */

const session = (overrides: Partial<DeviceWorkoutSession> & Pick<DeviceWorkoutSession, "exercises">): DeviceWorkoutSession => ({
  id: "device-1", title: "Day 01 workout", dayLabel: "Day 01 · Legs", startedAt: "2026-09-01T10:00:00.000Z", completedAt: "2026-09-01T11:00:00.000Z", status: "completed", ...overrides,
});
const squat = (sets: DeviceWorkoutSession["exercises"][number]["sets"]) => [{ id: "1-0", exerciseName: "Barbell Back Squat", plannedPrescription: "3 × 5", sets }];

describe("A set is read in the unit it was typed in", () => {
  it("keeps a 225 lb set at 102.06 kg after the profile switches to kg", () => {
    const logged = session({ weightUnit: "lb", exercises: squat([{ weight: "225", reps: "5", completed: true, unit: "lb" }]) });
    const [asLb] = workoutStrengthObservations([logged], "lb");
    const [afterSwitch] = workoutStrengthObservations([logged], "kg");
    expect(asLb.loadKg).toBeCloseTo(102.0582833, 6);
    expect(afterSwitch.loadKg).toBe(asLb.loadKg);
  });

  it("converts exactly: 100 lb is 45.359237 kg, rounded only for display", () => {
    expect(setWeightKg({ weight: "100", unit: "lb" }, {}, "kg")).toBe(45.359237);
    expect(setWeightKg({ weight: "100", unit: "kg" }, {}, "lb")).toBe(100);
    expect(setWeightKg({ weight: "", unit: "kg" }, {}, "lb")).toBeUndefined();
  });

  it("gives equivalent lb and kg entries the same mass, within 1e-9 kg", () => {
    const inKg = session({ weightUnit: "kg", exercises: squat([{ weight: "100", reps: "5", completed: true, unit: "kg" }]) });
    const inLb = session({ id: "device-2", weightUnit: "lb", exercises: squat([{ weight: "220.46226218487757", reps: "5", completed: true, unit: "lb" }]) });
    const [a] = workoutStrengthObservations([inKg], "lb");
    const [b] = workoutStrengthObservations([inLb], "kg");
    expect(Math.abs(a.loadKg! - b.loadKg!)).toBeLessThan(1e-9);
  });

  it("finds the heaviest set by mass when one session mixed units", () => {
    // 200 lb is 90.7 kg: the 100 kg set is the heavier one, although 200 > 100.
    const mixed = session({ weightUnit: "lb", exercises: squat([
      { weight: "200", reps: "5", completed: true, unit: "lb" },
      { weight: "100", reps: "3", completed: true, unit: "kg" },
    ]) });
    const [observation] = workoutStrengthObservations([mixed], "lb");
    expect(observation.loadKg).toBe(100);
    expect(observation.repetitions).toBe(3);
  });

  it("reports the weight to the account exactly as typed, in its own unit", () => {
    const logged = session({ weightUnit: "lb", exercises: squat([{ weight: "225", reps: "5", completed: true, unit: "lb" }]) });
    const [observation] = workoutStrengthObservations([logged], "kg");
    expect(observation.reportedLoad).toBe(225);
    expect(observation.reportedUnit).toBe("lb");
  });

  it("reads a set with no stamp through its session's unit, then the fallback", () => {
    const stampedSession = session({ weightUnit: "kg", exercises: squat([{ weight: "100", reps: "5", completed: true }]) });
    expect(workoutStrengthObservations([stampedSession], "lb")[0].loadKg).toBe(100);
    const legacy = session({ exercises: squat([{ weight: "100", reps: "5", completed: true }]) });
    // Unchanged from before this change: unstamped history reads in the unit the caller passes.
    expect(workoutStrengthObservations([legacy], "lb")[0].loadKg).toBe(45.359237);
    expect(workoutStrengthObservations([legacy], "kg")[0].loadKg).toBe(100);
  });
});

describe("History logged before units were stored", () => {
  it("is given the profile's unit once, marked as inferred, and never re-stamped", () => {
    const legacy = session({ exercises: squat([{ weight: "225", reps: "5", completed: true }]) });
    const stamped = session({ id: "device-2", weightUnit: "kg", exercises: squat([{ weight: "100", reps: "5", completed: true, unit: "kg" }]) });
    const first = stampLegacyWeightUnits([legacy, stamped], "lb");
    expect(first.stamped).toBe(1);
    expect(first.sessions[0]).toMatchObject({ weightUnit: "lb", weightUnitInferred: true });
    expect(first.sessions[1]).toBe(stamped);
    // A later unit change finds nothing left to stamp, so 225 stays 225 lb.
    const again = stampLegacyWeightUnits(first.sessions, "kg");
    expect(again.stamped).toBe(0);
    expect(workoutStrengthObservations(again.sessions, "kg").find((o) => o.sessionId === "device-1")!.loadKg).toBeCloseTo(102.0583, 4);
  });
});

describe("Storage keeps the unit", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a set's unit and the session's, and drops a unit it does not know", () => {
    saveDeviceWorkoutSessions([session({ weightUnit: "kg", weightUnitInferred: true, exercises: squat([
      { weight: "100", reps: "5", completed: true, unit: "kg" },
      { weight: "90", reps: "5", completed: true, unit: "stone" as never },
    ]) })]);
    const [loaded] = loadDeviceWorkoutSessions();
    expect(loaded.weightUnit).toBe("kg");
    expect(loaded.weightUnitInferred).toBe(true);
    expect(loaded.exercises[0].sets[0].unit).toBe("kg");
    expect(loaded.exercises[0].sets[1].unit).toBeUndefined();
    expect(JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!)[0].exercises[0].sets[1]).not.toHaveProperty("unit");
  });
});

describe("A stored history with an entry that holds nothing", () => {
  beforeEach(() => window.localStorage.clear());

  const valid = session({ id: "kept", weightUnit: "kg", exercises: squat([{ weight: "100", reps: "5", completed: true, unit: "kg" }]) });
  const store = (history: unknown[]) => window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(history));

  it("skips the empty entries and keeps the workout next to them", () => {
    store([null, valid, "junk", 42]);
    const loaded = loadDeviceWorkoutSessions();
    expect(loaded.map((item) => item.id)).toEqual(["kept"]);
    expect(loaded[0].exercises[0].sets).toMatchObject([{ weight: "100", reps: "5", completed: true, unit: "kg" }]);
  });

  it("skips an empty exercise or set inside a workout, keeping the rest", () => {
    const [exercise] = squat([{ weight: "100", reps: "5", completed: true, unit: "kg" }]);
    store([{ ...valid, exercises: [null, { ...exercise, sets: [null, ...exercise.sets] }] }]);
    const [loaded] = loadDeviceWorkoutSessions();
    expect(loaded.exercises).toHaveLength(1);
    expect(loaded.exercises[0].sets).toHaveLength(1);
    expect(loaded.exercises[0].sets[0].weight).toBe("100");
  });

  it("keeps the earlier workouts when the next checkpoint is saved", () => {
    store([null, valid, "junk", 42]);
    const next = session({ id: "new", status: "active", completedAt: undefined, exercises: squat([]) });
    saveDeviceWorkoutSessions([next, ...loadDeviceWorkoutSessions()]);
    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!) as { id: string }[];
    expect(stored.map((item) => item.id)).toEqual(["new", "kept"]);
  });

  it("keeps a workout whose status it does not know, so a save cannot erase it", () => {
    store([{ ...valid, id: "odd", status: "bogus" }]);
    const loaded = loadDeviceWorkoutSessions();
    expect(loaded.map((item) => item.id)).toEqual(["odd"]);
    saveDeviceWorkoutSessions(loaded);
    expect(loadDeviceWorkoutSessions().map((item) => [item.id, item.status])).toEqual([["odd", "bogus"]]);
  });
});

describe("The tracker offers last time's weight in this session's unit", () => {
  it("converts a set logged in lb when today's session records in kg", () => {
    const history = [session({ weightUnit: "lb", exercises: squat([{ weight: "225", reps: "5", completed: true, unit: "lb" }]) })];
    const today = squat([{ weight: "", reps: "", completed: false }])[0];
    expect(carriedEntryFor(today, 0, history, "kg")).toMatchObject({ weight: "102.06", reps: "5", source: "history" });
    expect(carriedEntryFor(today, 0, history, "lb")).toMatchObject({ weight: "225", source: "history" });
  });

  it("leaves a weight alone when the units match, and converts 0.01-rounded otherwise", () => {
    expect(weightInUnit("100", "kg", "kg")).toBe("100");
    expect(weightInUnit("100", "kg", "lb")).toBe("220.46");
    expect(weightInUnit("", "kg", "lb")).toBe("");
  });

  it("labels the weight box with the session's unit, and leaves box height in inches", () => {
    expect(setEntryFieldsFor({ name: "Barbell Back Squat", category: "Strength", equipment: "Barbell" }, "kg")[0].unit).toBe("kg");
    expect(setEntryFieldsFor({ name: "Barbell Back Squat", category: "Strength", equipment: "Barbell" })[0].unit).toBe("lb");
    const boxJump = setEntryFieldsFor({ name: "Weighted Box Jump", category: "Plyometric", equipment: "Plyometric box" }, "kg");
    expect(boxJump.map((field) => field.unit)).toEqual(["kg", "in"]);
  });
});
