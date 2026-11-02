// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  carriedEntryFor, deviceWorkoutHistoryKey, finalizeSession, isDraftSet, lastCompletedSetFor, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, weightInUnit,
  type DeviceWorkoutExercise, type DeviceWorkoutSession,
} from "./deviceWorkoutLog";
import { exercises } from "./exerciseCatalog";
import { setEntryFieldsFor } from "./setEntryFields";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import { enqueueLifts, type QueuedLift } from "./strengthSyncQueue";

/**
 * What the device store keeps of the Zercher, neck and bench rows' new fields (the owner's handoff
 * of 23 Oct 2026, T09, T10, T13, T15, T20): a set's head direction only where its exercise is done to
 * a side, each arm's load as typed, the exercise's setup as text; all of it through a save, a reload
 * and a second save unchanged, and absent on every record that never had it.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const exercise = (id: number, sets: DeviceWorkoutExercise["sets"], extra: Partial<DeviceWorkoutExercise> = {}): DeviceWorkoutExercise => ({ id: `${id}-0`, exerciseName: byId(id).name, catalogId: id, plannedPrescription: "3 × 8", sets, ...extra });
const session = (exercisesIn: DeviceWorkoutExercise[], extra: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession => ({
  id: "s1", title: "Neck", dayLabel: "Week 1 · Day 01 · Neck", startedAt: "2026-11-02T10:00:00.000Z", completedAt: "2026-11-02T11:00:00.000Z", status: "completed", weightUnit: "kg", exercises: exercisesIn, ...extra,
});
const reload = () => loadDeviceWorkoutSessions();
const raw = (value: unknown) => window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(value));

beforeEach(() => window.localStorage.clear());

describe("a set's head direction", () => {
  it("is kept on a side bend or a rotation, left or right only", () => {
    raw([session([exercise(435, [{ weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true }, { weight: "", reps: "", holdSeconds: "15", headDirection: "left", completed: true }])])]);
    expect(reload()[0].exercises[0].sets.map((set) => set.headDirection)).toEqual(["right", "left"]);
    raw([session([exercise(432, [{ weight: "10", reps: "12", headDirection: "both" as never, completed: true }, { weight: "10", reps: "12", headDirection: "rotation_left" as never, completed: true }])])]);
    expect(reload()[0].exercises[0].sets.map((set) => set.headDirection)).toEqual([undefined, undefined]);
  });

  it("is refused on a flexion row, an extension row and every row that is not done to a side, whatever the payload says (T09)", () => {
    raw([session([
      exercise(425, [{ weight: "20", reps: "12", headDirection: "left", completed: true }]),
      exercise(433, [{ weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true }]),
      exercise(1, [{ weight: "100", reps: "5", headDirection: "left", completed: true }]),
    ])]);
    for (const item of reload()[0].exercises) expect(item.sets[0].headDirection, item.exerciseName).toBeUndefined();
    // Saving goes through the same rule.
    saveDeviceWorkoutSessions([session([exercise(426, [{ weight: "20", reps: "12", headDirection: "right", completed: true }])])]);
    expect(JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!)[0].exercises[0].sets[0].headDirection).toBeUndefined();
  });

  it("stays missing on a set logged without one: never guessed, never dropped with the set (T10)", () => {
    raw([session([exercise(436, [{ weight: "", reps: "", holdSeconds: "20", completed: true }])])]);
    const [set] = reload()[0].exercises[0].sets;
    expect(set).toMatchObject({ holdSeconds: "20", completed: true });
    expect("headDirection" in set).toBe(false);
    expect(set.side).toBeUndefined();
  });

  it("is never written as an arm side, and one set stays one set", () => {
    raw([session([exercise(431, [{ weight: "12", reps: "10", headDirection: "left", completed: true }])])]);
    const [set] = reload()[0].exercises[0].sets;
    expect(reload()[0].exercises[0].sets).toHaveLength(1);
    expect([set.headDirection, set.side, set.legSide]).toEqual(["left", undefined, undefined]);
  });
});

describe("each arm's load (T13)", () => {
  it("keeps 40 left and 50 right as typed, in the set's unit, and never adds them up", () => {
    raw([session([exercise(437, [{ weight: "", reps: "8", leftLoad: "40", rightLoad: "50", unit: "kg", completed: true }])])]);
    const [set] = reload()[0].exercises[0].sets;
    expect(set).toMatchObject({ weight: "", leftLoad: "40", rightLoad: "50", unit: "kg" });
    expect(JSON.stringify(set)).not.toContain("90");
  });

  it("drops an arm's load that is not a number, keeps an empty one being typed, and counts a typed one as a draft", () => {
    raw([session([exercise(437, [{ weight: "", reps: "", leftLoad: "forty", rightLoad: "", completed: false }])], { status: "active", completedAt: undefined })]);
    const [set] = reload()[0].exercises[0].sets;
    expect(set.leftLoad).toBeUndefined();
    expect(set.rightLoad).toBe("");
    expect(isDraftSet({ weight: "", reps: "", leftLoad: "40", completed: false })).toBe(true);
  });

  it("is offered for the next set in this workout's unit, converting kg and lb only", () => {
    const item = exercise(437, [{ weight: "", reps: "8", leftLoad: "40", rightLoad: "50", unit: "kg", completed: true }, { weight: "", reps: "", completed: false }]);
    expect(carriedEntryFor(item, 1, [], "kg")).toMatchObject({ leftLoad: "40", rightLoad: "50", reps: "8", source: "session" });
    expect(carriedEntryFor(item, 1, [], "lb")).toMatchObject({ leftLoad: "88.18", rightLoad: "110.23" });
    expect(weightInUnit("40", "kg", "lb")).toBe("88.18");
    // A finished workout's last set with its arms apart is its last logged set.
    expect(lastCompletedSetFor({ exerciseName: byId(437).name, catalogId: 437 }, [session([item])], "kg")).toMatchObject({ leftLoad: "40", rightLoad: "50" });
  });
});

describe("the exercise's setup", () => {
  it("keeps the values as text, drops what is not a setup value, and drops a setup left empty", () => {
    raw([session([
      exercise(422, [{ weight: "100", reps: "5", completed: true }], { setup: { start_height_cm: "45", bar_type: "Standard", pause_seconds: "two" as never } as never }),
      exercise(440, [{ weight: "40", reps: "5", completed: true }], { setup: { load_convention: "plates_only" } }),
      exercise(441, [{ weight: "80", reps: "5", completed: true }], { setup: { setup_note: "   " } }),
      exercise(442, [{ weight: "80", reps: "5", completed: true }], { setup: "2 s" as never }),
    ])]);
    const [block, smith, floor, paused] = reload()[0].exercises;
    expect(block.setup).toEqual({ start_height_cm: "45", bar_type: "Standard" });
    expect(smith.setup).toEqual({ load_convention: "plates_only" });
    expect("setup" in floor).toBe(false);
    expect("setup" in paused).toBe(false);
  });

  it("is absent on a record that never had one, as before", () => {
    raw([session([exercise(1, [{ weight: "100", reps: "5", completed: true }])])]);
    expect("setup" in reload()[0].exercises[0]).toBe(false);
  });
});

describe("the load box of each new row", () => {
  const fields = (id: number, unit: "kg" | "lb" = "kg", setup?: DeviceWorkoutExercise["setup"]) => setEntryFieldsFor(byId(id), unit, id === 424 || (id >= 433 && id <= 436) ? "seconds" : "reps", setup).map((field) => `${field.label} ${field.unit}`);

  it("names what the number is, by the row's load convention", () => {
    expect(fields(421)).toEqual(["Weight kg"]);
    expect(fields(424)).toEqual(["Weight kg", "Seconds sec"]);
    expect(fields(425)).toEqual(["Machine load kg"]);
    expect(fields(428)).toEqual(["Harness load kg"]);
    expect(fields(429)).toEqual(["Machine load kg"]);
    expect(fields(437)).toEqual(["Plates per arm kg"]);
    expect(fields(438)).toEqual(["Machine load kg"]);
    expect(fields(439)).toEqual(["Plates per arm kg"]);
    expect(fields(442, "lb")).toEqual(["Weight lb"]);
  });

  it("asks a manual hold for its seconds and nothing else: no load box, so no 0 kg (T07)", () => {
    for (const id of [433, 434, 435, 436]) expect(fields(id), `catalog ${id}`).toEqual(["Seconds sec"]);
  });

  it("says plates only on a Smith machine until the athlete says the number includes a bar they know, and adds no bar either way (T15)", () => {
    expect(fields(440)).toEqual(["Plates only kg"]);
    expect(fields(440, "kg", { load_convention: "plates_only" })).toEqual(["Plates only kg"]);
    expect(fields(440, "lb", { load_convention: "total_known_bar" })).toEqual(["Plates + bar lb"]);
  });

  it("leaves every other row's boxes as they were", () => {
    expect(fields(1)).toEqual(["Weight kg"]);
    expect(setEntryFieldsFor(byId(143), "lb", "seconds").map((field) => field.label)).toEqual(["Added weight", "Seconds"]);
  });
});

describe("a finished workout through save, reload, a second save and two syncs (T20)", () => {
  const workout = () => session([
    exercise(435, [{ id: "a", weight: "", reps: "", holdSeconds: "20", headDirection: "right", unit: "kg", completed: true }, { id: "b", weight: "", reps: "", holdSeconds: "15", headDirection: "left", unit: "kg", completed: true }], { setup: { setup_note: "towel" } }),
    exercise(437, [{ id: "c", weight: "", reps: "8", leftLoad: "40", rightLoad: "50", unit: "kg", completed: true }, { id: "d", weight: "45", reps: "8", unit: "kg", completed: true }], { setup: { machine_model: "Hammer Strength", seat_or_bench_setting: "4" } }),
    exercise(442, [{ id: "e", weight: "100", reps: "5", unit: "kg", completed: true }], { setup: { pause_seconds: "2" } }),
  ]);

  it("reads back every value and convention exactly, and a second save changes nothing", () => {
    expect(saveDeviceWorkoutSessions([workout()])).toBe(true);
    const first = reload();
    expect(first).toEqual([{ ...workout(), exercises: workout().exercises.map((item) => ({ ...item, sets: item.sets.map((set) => ({ ...set, height: "", skipped: false })) })) }]);
    saveDeviceWorkoutSessions(first);
    expect(reload()).toEqual(first);
    expect(reload()[0].exercises.reduce((total, item) => total + item.sets.length, 0)).toBe(5);
  });

  it("finishes with the same fields: finishing keeps completed sets as they were", () => {
    const active = { ...workout(), status: "active" as const, completedAt: undefined };
    const { session: finished } = finalizeSession(active, "2026-11-02T11:00:00.000Z");
    expect(finished.exercises.map((item) => item.setup)).toEqual(workout().exercises.map((item) => item.setup));
    expect(finished.exercises[0].sets.map((set) => set.headDirection)).toEqual(["right", "left"]);
    expect(finished.exercises[1].sets[0]).toMatchObject({ leftLoad: "40", rightLoad: "50", weight: "" });
  });

  it("queues each exercise's top set once, under its stable id, however often it syncs; a hold sends nothing", () => {
    saveDeviceWorkoutSessions([workout()]);
    const queued = (sessions: DeviceWorkoutSession[]): QueuedLift[] => workoutStrengthObservations(sessions, "kg").map((observation) => ({ key: observation.id, lift: { catalogExerciseId: observation.catalogExerciseId!, observedAt: observation.observedAt, measurementType: observation.measurementType, reportedLoad: observation.reportedLoad, reportedUnit: observation.reportedUnit, repetitions: observation.repetitions, source: "device" as const } as QueuedLift["lift"], athlete: {} as QueuedLift["athlete"], queuedAt: "2026-11-02T11:05:00.000Z" }));
    const once = enqueueLifts([], [], queued(reload()));
    const twice = enqueueLifts(once, [], queued(reload()));
    expect(twice).toEqual(once);
    expect(once.map((item) => item.key)).toEqual(["workout-s1-437-0", "workout-s1-442-0"]);
    // The press's top set is its single-load set: the one with its arms apart has no one load to send.
    expect(once.map((item) => [item.lift.reportedLoad, item.lift.repetitions])).toEqual([[45, 8], [100, 5]]);
    // Sent already: a third sync sends nothing new.
    expect(enqueueLifts([], once.map((item) => item.key), queued(reload()))).toEqual([]);
  });
});
