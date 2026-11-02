import { describe, expect, it } from "vitest";
import type { DeviceWorkoutExercise, DeviceWorkoutSession } from "./deviceWorkoutLog";
import { exercises } from "./exerciseCatalog";
import { correctSet, exerciseHistory, historyByProtocol, sessionRecap } from "./sessionRecap";
import { getGoalPrescription, prescriptionOf } from "./workoutPlanner";
import { buildWorkoutExport } from "./workoutExport";
import { getPrintableTrackingLines } from "./workoutPrint";
import { catalogMeasureOf } from "@shared/specialization/holdCatalogIds";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";

/**
 * How the Zercher, neck and bench rows read back and are planned (the owner's handoff of 23 Oct
 * 2026, T03-T05, T07, T13, T15, T17-T19): the recap, the session detail and an exercise's history
 * say each set as it was done, with its direction and its setup; workouts with different setups
 * are listed apart; plans give holds seconds and give neck rows no target the athlete did not set.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
let order = 0;
const exercise = (id: number, sets: DeviceWorkoutExercise["sets"], extra: Partial<DeviceWorkoutExercise> = {}): DeviceWorkoutExercise => ({ id: `${id}-${order++}`, exerciseName: byId(id).name, catalogId: id, plannedPrescription: "3 × 5", sets, ...extra });
const session = (id: string, day: string, exercisesIn: DeviceWorkoutExercise[]): DeviceWorkoutSession => ({
  id, title: "Workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: `${day}T10:00:00.000Z`, completedAt: `${day}T11:00:00.000Z`, status: "completed", weightUnit: "kg", exercises: exercisesIn,
});
const reps = (weight: string, count: string) => ({ weight, reps: count, unit: "kg" as const, completed: true });

describe("a recap says each set as it was done", () => {
  it("Zercher Hold, 2 × 20 s at 60 kg: two holds, 40 seconds, no reps (T05)", () => {
    const recap = sessionRecap(session("h", "2026-11-02", [exercise(424, [{ weight: "60", reps: "", holdSeconds: "20", unit: "kg", completed: true }, { weight: "60", reps: "", holdSeconds: "20", unit: "kg", completed: true }])]), "kg");
    const [hold] = recap.exercises;
    expect(hold.sets.map((set) => [set.line, set.hold])).toEqual([["60 kg × 20 s", true], ["60 kg × 20 s", true]]);
    expect(hold.sets.reduce((total, set) => total + Number(set.set.holdSeconds), 0)).toBe(40);
    expect(hold.sets.every((set) => set.set.reps === "")).toBe(true);
    expect(recap.totals.workingSets).toBe(2);
    // No region maps it, so it earns no forearm or upper-arm credit, and nothing asks for an arm.
    expect(loggingPolicyFor(424)).toMatchObject({ measure: "seconds", mappedBy: [], strapsBy: [], sideLimb: null });
  });

  it("a manual side bend, right 20 s and left 15 s: two sets with their directions, no load (T07)", () => {
    const recap = sessionRecap(session("m", "2026-11-02", [exercise(435, [{ weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true }, { weight: "", reps: "", holdSeconds: "15", headDirection: "left", completed: true }])]), "kg");
    const [hold] = recap.exercises;
    expect(hold.sets.map((set) => [set.line, set.direction, set.side])).toEqual([["Right · 20 s", "Right", null], ["Left · 15 s", "Left", null]]);
    expect(hold.setup).toBe("Manual resistance · force not measured");
  });

  it("a directed set logged without a direction says so, rather than passing for a side (T10)", () => {
    const recap = sessionRecap(session("u", "2026-11-02", [exercise(432, [reps("10", "12")])]), "kg");
    expect(recap.exercises[0].sets[0].line).toBe("Direction not recorded · 10 kg × 12");
  });

  it("a plate-loaded press: per-arm plates said as such, unequal arms as two loads (T13)", () => {
    const recap = sessionRecap(session("p", "2026-11-02", [exercise(437, [reps("45", "8"), { weight: "", reps: "8", leftLoad: "40", rightLoad: "50", unit: "kg", completed: true }], { setup: { machine_model: "Hammer Strength" } })]), "kg");
    expect(recap.exercises[0].sets.map((set) => set.line)).toEqual(["45 kg per arm × 8", "Left 40 kg · Right 50 kg × 8"]);
    expect(recap.exercises[0].setup).toBe("Plates per arm · Machine: Hammer Strength · Seat or bench not recorded");
  });

  it("a Smith machine's plates, read as plates only, with no bar added (T15)", () => {
    const recap = sessionRecap(session("s", "2026-11-02", [exercise(440, [reps("40", "5")], { setup: { load_convention: "plates_only" } })]), "kg");
    expect(recap.exercises[0].sets[0].line).toBe("40 kg × 5");
    expect(recap.exercises[0].setup).toBe("Plates only · Machine, seat or bench not recorded");
  });

  it("a paused bench set: one set of 5 with its pause as setup, not five holds and a set (T17)", () => {
    const recap = sessionRecap(session("b", "2026-11-02", [exercise(442, [reps("100", "5")], { setup: { pause_seconds: "2" } })]), "kg");
    expect([recap.totals.workingSets, recap.exercises[0].sets[0].line, recap.exercises[0].sets[0].hold, recap.exercises[0].setup]).toEqual([1, "100 kg × 5", false, "Pause 2 s"]);
  });

  it("a drop set on the selectorized decline press: one set, three stages (T19)", () => {
    const drop = { id: "d", weight: "80", reps: "8", unit: "kg" as const, completed: true, type: "drop" as const, stages: [{ id: "d-1", weight: "80", reps: "8", unit: "kg" as const }, { id: "d-2", weight: "60", reps: "6", unit: "kg" as const }, { id: "d-3", weight: "40", reps: "10", unit: "kg" as const }] };
    const recap = sessionRecap(session("d", "2026-11-02", [exercise(438, [drop])]), "kg");
    expect(recap.totals.workingSets).toBe(1);
    expect(recap.exercises[0].sets[0]).toMatchObject({ line: "Drop set · 80 kg × 8 → 60 kg × 6 → 40 kg × 10", drop: true, detail: "1 drop set · 3 stages · 24 reps · 1,400 kg·reps" });
  });

  it("corrects a set's reps or seconds and keeps its direction, both arms' loads and no invented weight", () => {
    const workout = session("c", "2026-11-02", [
      exercise(437, [{ weight: "", reps: "8", leftLoad: "40", rightLoad: "50", unit: "kg", completed: true }]),
      exercise(435, [{ weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true }]),
    ]);
    const [press, hold] = workout.exercises;
    const pressFixed = correctSet(workout, press.id, 0, { weight: "90", reps: "7" }, "2026-11-02T12:00:00.000Z");
    expect(pressFixed.exercises[0].sets[0]).toMatchObject({ weight: "", leftLoad: "40", rightLoad: "50", reps: "7" });
    const holdFixed = correctSet(workout, hold.id, 0, { weight: "5", holdSeconds: "25" }, "2026-11-02T12:00:00.000Z");
    expect(holdFixed.exercises[1].sets[0]).toMatchObject({ weight: "", holdSeconds: "25", headDirection: "right", reps: "" });
  });

  it("leaves every other exercise's lines exactly as before", () => {
    const recap = sessionRecap(session("o", "2026-11-02", [exercise(1, [reps("100", "5")])]), "kg");
    expect([recap.exercises[0].sets[0].line, recap.exercises[0].sets[0].direction, recap.exercises[0].setup, recap.exercises[0].protocolKey]).toEqual(["100 kg × 5", null, null, null]);
  });
});

describe("an exercise's history keeps different setups apart (T03, T04, T14, T18)", () => {
  const sessions = [
    session("floor", "2026-10-26", [exercise(421, [reps("100", "5"), reps("100", "5"), reps("100", "5")])]),
    session("block30", "2026-10-28", [exercise(422, [reps("100", "5"), reps("100", "5"), reps("100", "5")], { setup: { start_height_cm: "30", bar_type: "Standard" } })]),
    session("block45", "2026-10-30", [exercise(422, [reps("110", "5")], { setup: { start_height_cm: "45", bar_type: "Standard" } })]),
    session("block30b", "2026-11-01", [exercise(422, [reps("105", "5")], { setup: { start_height_cm: "30", bar_type: "standard" } })]),
  ];

  it("gives the floor pull and the block pull separate histories", () => {
    expect(exerciseHistory({ exerciseName: byId(421).name, catalogId: 421 }, sessions, "kg").entries.map((entry) => entry.sessionId)).toEqual(["floor"]);
    expect(exerciseHistory({ exerciseName: byId(422).name, catalogId: 422 }, sessions, "kg").entries.map((entry) => entry.sessionId)).toEqual(["block30b", "block45", "block30"]);
  });

  it("groups block pulls by start height, each group under the setup it shares, the 45 cm pull never with the 30 cm ones", () => {
    const { entries } = exerciseHistory({ exerciseName: byId(422).name, catalogId: 422 }, sessions, "kg");
    expect(entries.map((entry) => entry.setup)).toEqual(["Start height 30 cm · Bar: standard", "Start height 45 cm · Bar: Standard", "Start height 30 cm · Bar: Standard"]);
    const groups = historyByProtocol(entries);
    expect(groups.map((group) => group.entries.map((entry) => entry.sessionId))).toEqual([["block30b", "block30"], ["block45"]]);
  });

  it("splits a plate-loaded press by machine and a Spoto press from a paused bench", () => {
    const presses = [
      session("hs", "2026-10-28", [exercise(437, [reps("40", "8")], { setup: { machine_model: "Hammer Strength", seat_or_bench_setting: "4" } })]),
      session("lf", "2026-10-30", [exercise(437, [reps("40", "8")], { setup: { machine_model: "Life Fitness", seat_or_bench_setting: "4" } })]),
      session("spoto", "2026-10-31", [exercise(443, [reps("90", "5")], { setup: { pause_seconds: "1", hover_distance_cm: "3" } })]),
      session("paused", "2026-11-01", [exercise(442, [reps("90", "5")], { setup: { pause_seconds: "1" } })]),
    ];
    expect(historyByProtocol(exerciseHistory({ exerciseName: byId(437).name, catalogId: 437 }, presses, "kg").entries).map((group) => group.setup)).toEqual(["Plates per arm · Machine: Life Fitness · Seat or bench: 4", "Plates per arm · Machine: Hammer Strength · Seat or bench: 4"]);
    expect(exerciseHistory({ exerciseName: byId(443).name, catalogId: 443 }, presses, "kg").entries.map((entry) => [entry.sessionId, entry.setup])).toEqual([["spoto", "Pause 1 s · Hover 3 cm"]]);
    expect(exerciseHistory({ exerciseName: byId(442).name, catalogId: 442 }, presses, "kg").entries.map((entry) => [entry.sessionId, entry.setup])).toEqual([["paused", "Pause 1 s"]]);
  });

  it("keeps one group for an exercise always done the same way, and for every row without setup fields", () => {
    const bench = [session("x", "2026-10-28", [exercise(1, [reps("100", "5")])]), session("y", "2026-10-30", [exercise(1, [reps("105", "5")])])];
    expect(historyByProtocol(exerciseHistory({ exerciseName: byId(1).name, catalogId: 1 }, bench, "kg").entries)).toHaveLength(1);
  });
});

describe("plans", () => {
  it("prescribe a hold in seconds and keep the athlete's own text exactly, on print and share too", () => {
    expect(prescriptionOf(undefined, 2, "Muscle growth", catalogMeasureOf(424), 424)).toBe("3 × 30 sec");
    expect(prescriptionOf("3 × 20 s", 0, "Muscle growth", catalogMeasureOf(424), 424)).toBe("3 × 20 s");
    expect(prescriptionOf("3 × 20 s", 0, "Muscle growth", catalogMeasureOf(435), 435)).toBe("3 × 20 s");
    const exported = buildWorkoutExport({
      workout: [byId(424), byId(435), byId(425)], week: 1, dayOrdinal: "Day 01", dayName: "Neck", sport: "", goal: "Max strength",
      prescriptionFor: (item, index) => prescriptionOf(({ 424: "3 × 20 s", 435: "2 × 20 s" } as Record<number, string>)[item.id], index, "Max strength", catalogMeasureOf(item.id), item.id),
      settingsFor: () => ({ rest: "90 sec", notes: "" }), muscleLabel: (key) => key, now: new Date("2026-11-02T10:00:00Z"),
    });
    expect(exported.exercises.map((row) => row.prescription)).toEqual(["3 × 20 s", "2 × 20 s", "3 × your reps"]);
    expect(exported.exercises[0].tracking.every((set) => set.timed)).toBe(true);
    expect(exported.exercises[2].tracking.every((set) => !set.timed)).toBe(true);
    expect(getPrintableTrackingLines("3 × 20 s")[0]).toBe("Round 1: time / quality __________________");
    expect(getPrintableTrackingLines("2 × your time")[0]).toBe("Round 1: time / quality __________________");
  });

  it("give a neck row the set count with no target, a pinned goal default included: the athlete sets the reps or the time", () => {
    expect(prescriptionOf(undefined, 0, "Max strength", "reps", 425)).toBe("4 × your reps");
    expect(prescriptionOf(undefined, 3, "Muscle growth", "seconds", 433)).toBe("3 × your time");
    // The planner pins the goal's default on every entry of a day it builds: not a choice the athlete made.
    expect(prescriptionOf(getGoalPrescription("Max strength", 0), 0, "Max strength", "reps", 427)).toBe("4 × your reps");
    expect(prescriptionOf("2 × 12", 0, "Max strength", "reps", 427)).toBe("2 × 12");
    // Every other row keeps the goal's default.
    expect(prescriptionOf(undefined, 0, "Max strength", "reps", 442)).toBe(getGoalPrescription("Max strength", 0));
    expect(prescriptionOf(undefined, 0, "Max strength", "reps")).toBe(getGoalPrescription("Max strength", 0));
  });
});
