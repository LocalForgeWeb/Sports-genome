// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, type DeviceSetLog, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { sourceRevision } from "./specialization/revision";
import { shippedHistoryKey, shippedLoadDeviceWorkoutSessions, shippedSaveDeviceWorkoutSessions, shippedSideOf } from "./__fixtures__/workoutLogReaders.6738eeb";

/**
 * A set records each limb's side in its own field (10-multi-region.md §2.1): `side` stays the arm's,
 * `legSide` holds the leg's. Every save rewrites the whole history through `normalizeSet`, so what it
 * keeps decides what survives. These write the new shapes and read them back through this code's
 * readers and through the readers as shipped on 18 Oct (the 6738eeb copies in __fixtures__), which
 * an older deploy would use: no leg side may ever come back as an arm side.
 */
const session = (sets: unknown[]): DeviceWorkoutSession => ({
  id: "s1", title: "Legs workout", dayLabel: "Week 1 · Day 02 · Legs", startedAt: "2026-10-20T10:00:00.000Z", completedAt: "2026-10-20T10:40:00.000Z", status: "completed", weightUnit: "kg",
  exercises: [{ id: "split", exerciseName: "Bulgarian Split Squat", catalogId: 173, plannedPrescription: "3 × 10", perArm: true, sets: sets as DeviceSetLog[] }],
});
const set = (fields: Record<string, unknown>) => ({ id: `set-${Object.values(fields).join("-")}`, weight: "20", reps: "10", unit: "kg", completed: true, ...fields });

/** The shapes this release can write, and one a later release might add (`tempo`, `bar`). */
const written = [
  set({ legSide: "right" }),
  set({ legSide: "left" }),
  set({ legSide: "both" }),
  set({ side: "left", legSide: "right" }),
  set({ side: "both" }),
  set({ legSide: "left", tempo: "3-1-1", bar: { kind: "safety", kg: 30 } }),
];

beforeEach(() => window.localStorage.clear());

describe("this release's readers", () => {
  it("keep a leg side as written, beside the arm's, through a save and a load", () => {
    expect(saveDeviceWorkoutSessions([session(written)])).toBe(true);
    const sets = loadDeviceWorkoutSessions()[0].exercises[0].sets;
    expect(sets.map((item) => [item.side ?? null, item.legSide ?? null])).toEqual([
      [null, "right"], [null, "left"], [null, "both"], ["left", "right"], ["both", null], [null, "left"],
    ]);
  });

  it("validate a leg side as they do an arm side: anything but left, right or both is dropped", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([session([set({ legSide: "front" }), set({ legSide: "LEFT" }), set({ legSide: 1 }), set({ legSide: null })])]));
    for (const item of loadDeviceWorkoutSessions()[0].exercises[0].sets) expect(item).not.toHaveProperty("legSide");
  });

  it("keep every set field they do not know exactly as stored, through load and save, and still drop a bad known one", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([session([set({ legSide: "left", tempo: "3-1-1", bar: { kind: "safety", kg: 30 }, unit: "stone", side: "middle" })])]));
    saveDeviceWorkoutSessions(loadDeviceWorkoutSessions());
    const [stored] = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!)[0].exercises[0].sets;
    expect(stored).toMatchObject({ legSide: "left", tempo: "3-1-1", bar: { kind: "safety", kg: 30 } });
    // Known fields are still validated: a unit and an arm side the app does not know are dropped.
    expect(stored).not.toHaveProperty("unit");
    expect(stored).not.toHaveProperty("side");
  });

  it("change the summary's source revision when only a leg side changes", () => {
    const before = sourceRevision([session([set({ legSide: "left" })])]);
    expect(sourceRevision([session([set({ legSide: "right" })])])).not.toBe(before);
    expect(sourceRevision([session([set({ legSide: "left" })])])).toBe(before);
  });
});

describe("the readers as shipped on 18 Oct (6738eeb)", () => {
  it("share the history's storage key, so an older deploy reads what this one writes", () => {
    expect(shippedHistoryKey).toBe(deviceWorkoutHistoryKey);
  });

  it("drop the leg side and never read it as an arm side, through a load, a save and a load back here", () => {
    saveDeviceWorkoutSessions([session(written)]);
    // An older deploy opens the app: it loads, and its next checkpoint saves everything back.
    const old = shippedLoadDeviceWorkoutSessions();
    expect(old[0].exercises[0].sets.map((item) => item.side ?? null)).toEqual([null, null, null, "left", "both", null]);
    shippedSaveDeviceWorkoutSessions(old);
    // This release again: the arm sides are the arm sides written, and no leg side is left anywhere.
    const back = loadDeviceWorkoutSessions()[0].exercises[0].sets;
    expect(back.map((item) => item.side ?? null)).toEqual([null, null, null, "left", "both", null]);
    expect(back.every((item) => item.legSide === undefined)).toBe(true);
    expect(back.map((item) => [item.weight, item.reps, item.completed])).toEqual(written.map(() => ["20", "10", true]));
  });

  it("give a set with only a leg side no arm side in the calculator, and an arm side only from `side`", () => {
    saveDeviceWorkoutSessions([session(written)]);
    const sets = shippedLoadDeviceWorkoutSessions()[0].exercises[0].sets;
    // A one-leg exercise is not two-armed by definition, so a set with no arm recorded stays unknown.
    expect(sets.map((item) => shippedSideOf(item, { laterality: "either" }).side)).toEqual(["unknown", "unknown", "unknown", "left", "bilateral", "unknown"]);
    // Read straight from what this release stores, before any old save: the leg side is still not an arm side.
    const stored: Record<string, unknown>[] = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!)[0].exercises[0].sets;
    expect(stored.map((item) => shippedSideOf(item, { laterality: "either" }).side)).toEqual(["unknown", "unknown", "unknown", "left", "bilateral", "unknown"]);
  });

  it("keep the exercise's other fields, the per-side layout among them, as stored", () => {
    saveDeviceWorkoutSessions([session(written)]);
    shippedSaveDeviceWorkoutSessions(shippedLoadDeviceWorkoutSessions());
    expect(loadDeviceWorkoutSessions()[0].exercises[0]).toMatchObject({ perArm: true, catalogId: 173 });
  });
});
