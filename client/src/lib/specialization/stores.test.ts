// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { goalsForBothArms } from "@shared/specialization/goals";
import type { SpecializationGoal, SpecializationMeasurement } from "@shared/specialization/types";
import {
  hasActiveGoalForRegion,
  loadSpecializationGoals,
  loadSpecializationMeasurements,
  parseStoredGoal,
  parseStoredMeasurement,
  saveSpecializationGoals,
  saveSpecializationMeasurements,
  specializationGoalsEvent,
  specializationGoalsKeyBase,
  specializationMeasurementsKeyBase,
  upsertGoal,
  useSpecializationGoals,
  useSpecializationMeasurements,
} from "./stores";

/**
 * Targets and measurements on the device (design §5). What comes back from storage has to
 * be usable whatever storage holds: corrupt or foreign values read as nothing, entries that
 * are not targets or measurements are dropped, each account reads only its own, and a write
 * the device refused is reported as refused rather than announced.
 */

const goal = (over: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id: "g1",
  regionId: "forearm",
  nodeId: "forearm.fcr",
  actionId: null,
  side: "left",
  metric: "direct_dynamic_bouts",
  target: 20,
  period: "calendar_week",
  startsOn: "2026-10-12",
  endsOn: null,
  timezone: "Europe/London",
  createdAt: "2026-10-12T08:00:00.000Z",
  updatedAt: "2026-10-12T08:00:00.000Z",
  ...over,
});

const measurement = (over: Partial<SpecializationMeasurement> = {}): SpecializationMeasurement => ({
  id: "m1",
  regionId: "forearm",
  side: "right",
  measuredAt: "2026-10-12T07:30:00.000Z",
  metric: "circumference_cm",
  value: 33.5,
  protocol: { landmark: "Thickest point of the forearm", distanceFromLandmarkCm: null, posture: "arm_relaxed_hanging", condition: "unpumped", device: "Tape", timeOfDay: "07:30" },
  notes: null,
  ...over,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("the goals store survives what storage hands back", () => {
  it("reads nothing, corrupt JSON and a non-list as no targets", () => {
    expect(loadSpecializationGoals("a")).toEqual([]);
    localStorage.setItem(`${specializationGoalsKeyBase}::a`, "{not json");
    expect(() => loadSpecializationGoals("a")).not.toThrow();
    expect(loadSpecializationGoals("a")).toEqual([]);
    localStorage.setItem(`${specializationGoalsKeyBase}::a`, '{"id":"g1"}');
    expect(loadSpecializationGoals("a")).toEqual([]);
  });

  it("keeps the usable entries and drops the rest", () => {
    localStorage.setItem(`${specializationGoalsKeyBase}::a`, JSON.stringify([
      goal({ id: "ok" }),
      { ...goal({ id: "no-dates" }), createdAt: undefined, updatedAt: undefined },
      goal({ id: "both", actionId: "wrist.flexion" }),
      goal({ id: "neither", nodeId: null }),
      goal({ id: "zero", target: 0 }),
      { ...goal({ id: "text" }), target: "20" },
      goal({ id: "zone", timezone: "Nowhere/Zone" }),
      goal({ id: "date", startsOn: "2026-02-30" }),
      goal({ id: "side", side: "both" as never }),
      null,
      7,
    ]));
    expect(loadSpecializationGoals("a").map((item) => [item.id, item.createdAt])).toEqual([["ok", "2026-10-12T08:00:00.000Z"], ["no-dates", ""]]);
    expect(parseStoredGoal(goal())).toEqual(goal());
  });

  it("keeps each account's targets apart", () => {
    expect(saveSpecializationGoals([goal()], "a")).toBe(true);
    expect(loadSpecializationGoals("b")).toEqual([]);
    expect(loadSpecializationGoals("a")).toEqual([goal()]);
    expect(localStorage.getItem(`${specializationGoalsKeyBase}::a`)).not.toBeNull();
  });

  it("announces a write once, and reports a refused write as false without announcing it", () => {
    const listener = vi.fn();
    window.addEventListener(specializationGoalsEvent, listener);
    try {
      expect(saveSpecializationGoals([goal()], "a")).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
      expect(saveSpecializationGoals([goal({ id: "g2" })], "a")).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(specializationGoalsEvent, listener);
    }
  });

  it("reads as empty and refuses writes when storage itself is turned off", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(loadSpecializationGoals("a")).toEqual([]);
    expect(saveSpecializationGoals([goal()], "a")).toBe(false);
    expect(hasActiveGoalForRegion("forearm", "a")).toBe(false);
  });
});

describe("goal writes and the region check", () => {
  it("adds, replaces by id, and refuses an overlap with the reason", () => {
    const first = upsertGoal([], goal());
    expect(first.ok).toBe(true);
    const goals = first.ok ? first.goals : [];
    const edited = upsertGoal(goals, goal({ target: 25 }));
    expect(edited.ok && edited.goals.map((item) => item.target)).toEqual([25]);
    const clash = upsertGoal(goals, goal({ id: "g2", startsOn: "2026-10-20" }));
    expect(clash.ok).toBe(false);
    if (!clash.ok) expect(clash.reason).toMatch(/^You already have a left-arm target of 20/);
  });

  it("knows whether a region has an active target right now", () => {
    const now = "2026-10-16T12:00:00.000Z";
    expect(hasActiveGoalForRegion("forearm", "a", now)).toBe(false);
    saveSpecializationGoals([goal({ endsOn: "2026-10-15" })], "a");
    expect(hasActiveGoalForRegion("forearm", "a", now)).toBe(false);
    saveSpecializationGoals([goal()], "a");
    expect(hasActiveGoalForRegion("forearm", "a", now)).toBe(true);
    expect(hasActiveGoalForRegion("deltoid", "a", now)).toBe(false);
    expect(hasActiveGoalForRegion("forearm", "b", now)).toBe(false);
  });
});

describe("useSpecializationGoals", () => {
  it("saves both arms as two goals, refuses an overlap, removes, and keeps every reader current", () => {
    const writer = renderHook(() => useSpecializationGoals("a"));
    const reader = renderHook(() => useSpecializationGoals("a"));
    const { side: _side, ...draft } = goal({ id: "pair" });
    act(() => { expect(writer.result.current.save(goalsForBothArms(draft))).toEqual({ ok: true }); });
    expect(reader.result.current.goals.map((item) => item.id)).toEqual(["pair:left", "pair:right"]);
    act(() => { expect(writer.result.current.save(goal({ id: "again", startsOn: "2026-10-30" })).ok).toBe(false); });
    act(() => { expect(writer.result.current.remove("pair:left")).toEqual({ ok: true }); });
    expect(reader.result.current.goals.map((item) => item.id)).toEqual(["pair:right"]);
  });

  it("picks up a change written in another tab", () => {
    const { result } = renderHook(() => useSpecializationGoals("a"));
    act(() => {
      localStorage.setItem(`${specializationGoalsKeyBase}::a`, JSON.stringify([goal()]));
      window.dispatchEvent(new StorageEvent("storage", { key: `${specializationGoalsKeyBase}::a` }));
    });
    expect(result.current.goals).toEqual([goal()]);
  });

  it("keeps the same list when a write changed nothing it shows", () => {
    saveSpecializationGoals([goal()], "a");
    const { result } = renderHook(() => useSpecializationGoals("a"));
    const before = result.current.goals;
    act(() => { saveSpecializationGoals([goal()], "a"); });
    expect(result.current.goals).toBe(before);
  });
});

describe("measurements", () => {
  it("keeps valid measurements in time order and drops entries it cannot read", () => {
    localStorage.setItem(`${specializationMeasurementsKeyBase}::a`, JSON.stringify([
      measurement({ id: "later", measuredAt: "2026-10-14T07:30:00.000Z" }),
      measurement({ id: "earlier" }),
      { ...measurement({ id: "absent-optional" }), notes: undefined, protocol: { landmark: "Elbow crease", posture: "elbow_90_supported", condition: "unknown" } },
      measurement({ id: "zero", value: 0 }),
      { ...measurement({ id: "metric" }), metric: "biceps_cm" },
      { ...measurement({ id: "landmark" }), protocol: { ...measurement().protocol, landmark: "" } },
      { ...measurement({ id: "posture" }), protocol: { ...measurement().protocol, posture: "standing" } },
      { ...measurement({ id: "time" }), protocol: { ...measurement().protocol, timeOfDay: "25:00" } },
      { ...measurement({ id: "notes" }), notes: 5 },
      { ...measurement({ id: "when" }), measuredAt: "yesterday" },
    ]));
    const loaded = loadSpecializationMeasurements("a");
    // Same moment: the id breaks the tie, so the order never depends on how storage listed them.
    expect(loaded.map((item) => item.id)).toEqual(["absent-optional", "earlier", "later"]);
    expect(loaded[0]).toMatchObject({ notes: null, protocol: { distanceFromLandmarkCm: null, device: null, timeOfDay: null } });
    expect(parseStoredMeasurement(measurement())).toEqual(measurement());
  });

  it("saves through the hook only what it could read back, and removes by id", () => {
    const { result } = renderHook(() => useSpecializationMeasurements("a"));
    act(() => { expect(result.current.save(measurement({ value: -1 })).ok).toBe(false); });
    act(() => { expect(result.current.save(measurement())).toEqual({ ok: true }); });
    act(() => { expect(result.current.save(measurement({ id: "m2", metric: "grip_force_n", value: 410 }))).toEqual({ ok: true }); });
    expect(result.current.measurements.map((item) => item.id)).toEqual(["m1", "m2"]);
    act(() => { expect(result.current.remove("m1")).toEqual({ ok: true }); });
    expect(result.current.measurements.map((item) => item.id)).toEqual(["m2"]);
    expect(saveSpecializationMeasurements([measurement()], "b")).toBe(true);
    expect(loadSpecializationMeasurements("a").map((item) => item.id)).toEqual(["m2"]);
  });
});

describe("what a later version writes survives this one (10-multi-region.md §2.1)", () => {
  const stored = (base: string) => JSON.parse(localStorage.getItem(`${base}::a`) ?? "[]") as unknown[];
  // Shapes this version cannot read: a later version's, and plain damage.
  const unreadGoals = [{ ...goal({ id: "future" }), metric: "girth_targets" }, { ...goal({ id: "both" }), side: "both" }, null, 7, "text"];

  it("reads a midline target, and keeps every stored target it cannot read, written back untouched by every save and removal", () => {
    localStorage.setItem(`${specializationGoalsKeyBase}::a`, JSON.stringify([goal({ id: "kept" }), goal({ id: "core", regionId: "core", nodeId: "core.rectus_abdominis", side: "midline" }), ...unreadGoals]));
    expect(loadSpecializationGoals("a").map((item) => [item.id, item.side])).toEqual([["kept", "left"], ["core", "midline"]]);
    expect(saveSpecializationGoals([...loadSpecializationGoals("a"), goal({ id: "added", side: "right" })], "a")).toBe(true);
    expect(stored(specializationGoalsKeyBase)).toEqual([goal({ id: "kept" }), goal({ id: "core", regionId: "core", nodeId: "core.rectus_abdominis", side: "midline" }), goal({ id: "added", side: "right" }), ...unreadGoals]);
    const { result } = renderHook(() => useSpecializationGoals("a"));
    act(() => { expect(result.current.remove("kept")).toEqual({ ok: true }); });
    act(() => { expect(result.current.save(goal({ id: "fcu", nodeId: "forearm.fcu" }))).toEqual({ ok: true }); });
    expect(stored(specializationGoalsKeyBase).slice(-unreadGoals.length)).toEqual(unreadGoals);
    expect(result.current.goals.map((item) => item.id)).toEqual(["core", "added", "fcu"]);
  });

  it("holds a new muscle target to the page's targets when the page passes its scope", () => {
    const scope = { region: { id: "forearm", sides: { model: "paired" as const, limb: "arm" as const }, wording: { externalGroup: "", externalHeading: "", incidentalWork: "grip", progressSubtitle: "", sideWord: "arm", sideWordPlural: "arms", onSideTemplate: "your {side} forearm" } }, targetNodeIds: new Set(["forearm.fcr"]) };
    expect(upsertGoal([], goal(), scope).ok).toBe(true);
    expect(upsertGoal([], goal({ nodeId: "upper_arm.biceps" }), scope)).toEqual({ ok: false, reason: "Targets are for this region's target muscles. You can end or remove this one." });
    const { result } = renderHook(() => useSpecializationGoals("a"));
    act(() => { expect(result.current.save(goal({ nodeId: "forearm.anconeus" }), scope).ok).toBe(false); });
    expect(result.current.goals).toEqual([]);
  });

  it("reads a girth around the trunk on the midline, and keeps measurements it cannot read", () => {
    const girth = measurement({ id: "girth", regionId: "chest", side: "midline", metric: "girth_cm", value: 104, protocol: { ...measurement().protocol, landmark: "Under the arms", posture: "standing_relaxed" } });
    const flexed = measurement({ id: "flexed", protocol: { ...measurement().protocol, posture: "arm_flexed" } });
    const unread = [{ ...measurement({ id: "limb-midline" }), side: "midline" }, { ...girth, id: "girth-left", side: "left" }, { ...measurement({ id: "skinfold" }), metric: "skinfold_mm" }];
    localStorage.setItem(`${specializationMeasurementsKeyBase}::a`, JSON.stringify([girth, flexed, ...unread]));
    expect(loadSpecializationMeasurements("a").map((item) => item.id)).toEqual(["flexed", "girth"]);
    expect(parseStoredMeasurement(girth)).toEqual(girth);
    expect(saveSpecializationMeasurements([girth], "a")).toBe(true);
    expect(stored(specializationMeasurementsKeyBase)).toEqual([girth, ...unread]);
    const { result } = renderHook(() => useSpecializationMeasurements("a"));
    act(() => { expect(result.current.save(measurement({ id: "m3" }))).toEqual({ ok: true }); });
    expect(stored(specializationMeasurementsKeyBase).slice(-unread.length)).toEqual(unread);
  });
});
