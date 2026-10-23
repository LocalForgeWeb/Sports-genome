// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { scopedKey } from "@/lib/deviceStorageScope";
import { exercises } from "@/lib/exerciseCatalog";
import { gymAccessProfiles } from "@/lib/equipmentProfile";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore, loadDay, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { repProfileExtras } from "@shared/specialization/regions/forearm/repProfiles";
import { defaultStackSettings, designStack } from "./stack";
import {
  lastChoiceFor,
  loadStackStore,
  parseStackRecord,
  removeStackRecord,
  saveStackChoice,
  saveStackRecord,
  specializationStacksEvent,
  specializationStacksKeyBase,
  stackEntriesState,
  stackForWeek,
  stackRecordFrom,
  storeWithoutEntries,
  useSpecializationStacks,
  type StackRecord,
} from "./stackStore";

/**
 * The stack's device record (11-forearm-research-and-stack.md §3.9): per account, checked on
 * load, entries it cannot read kept and written back, corrupt or refused storage read as nothing,
 * a refused write said.
 */

const byId = new Map(exercises.map((item) => [item.id, item] as const));
const NOW = "2026-10-21T12:00:00.000Z";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const settings = { days: null, perDay: 4, holds: null };
const record = (over: Partial<StackRecord> = {}): Omit<StackRecord, "kind"> => ({
  id: "stack-1",
  regionId: "forearm",
  planWeek: 1,
  mappingVersion: "forearm_mappings_v1",
  total: 14,
  createdAt: NOW,
  settings,
  entries: [{ dayKey: "0-Push", catalogExerciseId: 139, prescription: "1 × 10–25" }],
  ...over,
});

function planA(): { slots: ReturnType<typeof buildDaySlots>; store: WeeklyDayStore } {
  const slots = buildDaySlots(splitDaysForFrequency(3));
  let store = emptyDayStore();
  [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186, 132]].forEach((ids, index) => {
    store = commitDay(store, slots[index].key, { workout: ids.map((id) => byId.get(id)!), prescriptions: {}, settings: {}, context: [] });
  });
  return { slots, store };
}

describe("the stack record on the device", () => {
  it("reads empty, corrupt or foreign storage as nothing", () => {
    expect(loadStackStore()).toEqual({ choices: [], stacks: [] });
    window.localStorage.setItem(specializationStacksKeyBase, "{not json");
    expect(loadStackStore()).toEqual({ choices: [], stacks: [] });
    window.localStorage.setItem(specializationStacksKeyBase, JSON.stringify({ kind: "stack" }));
    expect(loadStackStore()).toEqual({ choices: [], stacks: [] });
  });

  it("keeps a region's last total and settings, replacing its earlier choice, and refuses ones it cannot keep", () => {
    expect(saveStackChoice({ regionId: "forearm", total: 14, settings, updatedAt: NOW })).toEqual({ ok: true });
    expect(saveStackChoice({ regionId: "forearm", total: 18, settings: { ...settings, perDay: 5 }, updatedAt: "2026-10-22T08:00:00.000Z" })).toEqual({ ok: true });
    expect(saveStackChoice({ regionId: "deltoid", total: 3, settings, updatedAt: NOW })).toEqual({ ok: true });
    const state = loadStackStore();
    expect(state.choices).toHaveLength(2);
    expect(lastChoiceFor(state, "forearm")).toMatchObject({ total: 18, settings: { perDay: 5 } });
    expect(saveStackChoice({ regionId: "forearm", total: 61, settings, updatedAt: NOW }).ok).toBe(false);
    expect(saveStackChoice({ regionId: "forearm", total: 10, settings: { ...settings, perDay: 9 }, updatedAt: NOW }).ok).toBe(false);
  });

  it("keeps one stack per region and plan week, and removes exactly the one named", () => {
    saveStackRecord(record());
    saveStackRecord(record({ id: "stack-2", planWeek: 2 }));
    saveStackRecord(record({ id: "stack-3", total: 16 }));
    const state = loadStackStore();
    expect(state.stacks.map((item) => item.id).sort()).toEqual(["stack-2", "stack-3"]);
    expect(stackForWeek(state, "forearm", 1)?.total).toBe(16);
    expect(stackForWeek(state, "forearm", 3)).toBeNull();
    expect(removeStackRecord("stack-3")).toEqual({ ok: true });
    expect(loadStackStore().stacks.map((item) => item.id)).toEqual(["stack-2"]);
    expect(removeStackRecord("not-there")).toEqual({ ok: true });
  });

  it("keeps two accounts on one device apart", () => {
    saveStackRecord(record(), "athlete-a");
    saveStackChoice({ regionId: "forearm", total: 20, settings, updatedAt: NOW }, "athlete-b");
    expect(loadStackStore("athlete-a").stacks).toHaveLength(1);
    expect(loadStackStore("athlete-a").choices).toHaveLength(0);
    expect(loadStackStore("athlete-b").stacks).toHaveLength(0);
    expect(loadStackStore("athlete-b").choices).toHaveLength(1);
    expect(window.localStorage.getItem(scopedKey(specializationStacksKeyBase, "athlete-a"))).toContain("stack-1");
  });

  it("writes back, untouched, the entries this version cannot read", () => {
    const later = { kind: "stack", id: "from-a-later-version", regionId: "forearm", planWeek: 1, side: "both", entries: "something new" };
    const unknown = { kind: "something-else", value: 1 };
    window.localStorage.setItem(specializationStacksKeyBase, JSON.stringify([later, unknown]));
    expect(loadStackStore()).toEqual({ choices: [], stacks: [] });
    saveStackRecord(record());
    const stored = JSON.parse(window.localStorage.getItem(specializationStacksKeyBase)!);
    expect(stored).toContainEqual(later);
    expect(stored).toContainEqual(unknown);
    expect(loadStackStore().stacks).toHaveLength(1);
  });

  it("says a refused write, and reads refused storage as nothing", () => {
    const listener = vi.fn();
    window.addEventListener(specializationStacksEvent, listener);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(saveStackRecord(record())).toEqual({ ok: false, reason: expect.stringMatching(/did not save/) });
    expect(listener).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(loadStackStore()).toEqual({ choices: [], stacks: [] });
    window.removeEventListener(specializationStacksEvent, listener);
  });

  it("holds no side", () => {
    expect(parseStackRecord({ ...record(), kind: "stack" })).not.toHaveProperty("side");
    saveStackRecord(record());
    expect(window.localStorage.getItem(specializationStacksKeyBase)).not.toMatch(/"side"|left|right/);
  });
});

describe("a stack's entries in the plan week", () => {
  const { slots, store } = planA();
  const input = {
    region: forearmRegionData,
    extras: repProfileExtras,
    catalog: exercises,
    plan: { week: 1, slots, store, goal: "Muscle growth" as const, gymMinutes: 60 },
    goals: [],
    equipment: { gymAccess: "Commercial gym" as const, availableEquipment: gymAccessProfiles["Commercial gym"] },
    exclusions: { catalogExerciseIds: [], equipment: [] },
    settings: defaultStackSettings,
    total: null,
    now: NOW,
  };
  const design = designStack(input);
  const saved = { ...stackRecordFrom(design, "stack-a", NOW, defaultStackSettings), kind: "stack" as const };

  it("records what the design wrote: each change with its day, exercise and prescription", () => {
    expect(saved.entries).toHaveLength(11);
    expect(saved.entries).toEqual(design.changes.map((change) => ({ dayKey: change.dayKey, catalogExerciseId: change.catalogExerciseId, prescription: change.prescription })));
    expect(parseStackRecord(saved)).toEqual(saved);
    expect(saved).toMatchObject({ regionId: "forearm", planWeek: 1, total: 14, mappingVersion: forearmRegionData.mappingVersion.key });
  });

  it("tells entries still as written from ones the athlete changed and ones no longer there", () => {
    let edited = design.storeAfter;
    const [first, second, third] = saved.entries;
    const day = loadDay(edited, first.dayKey);
    edited = commitDay(edited, first.dayKey, { ...day, prescriptions: { ...day.prescriptions, [first.catalogExerciseId]: "3 × 12" } });
    const other = loadDay(edited, second.dayKey);
    edited = commitDay(edited, second.dayKey, { ...other, workout: other.workout.filter((exercise) => exercise.id !== second.catalogExerciseId) });
    const state = stackEntriesState(saved, edited);
    expect(state.changed).toEqual([first]);
    expect(state.missing).toEqual([second]);
    expect(state.asWritten).toContainEqual(third);
    expect(state.asWritten).toHaveLength(9);
  });

  it("gives the plan week without the stack's entries for designing again, everything else kept", () => {
    const without = storeWithoutEntries(design.storeAfter, saved.entries);
    expect(without).toEqual(store);
    const again = designStack({ ...input, plan: { ...input.plan, store: without }, total: 16 });
    expect([again.own, again.total]).toEqual([3, 16]);
  });
});

describe("useSpecializationStacks", () => {
  it("follows writes made through it and elsewhere", () => {
    const { result } = renderHook(() => useSpecializationStacks("athlete-a"));
    expect(result.current.stacks).toEqual([]);
    act(() => { expect(result.current.saveStack(record())).toEqual({ ok: true }); });
    expect(result.current.stacks.map((item) => item.id)).toEqual(["stack-1"]);
    act(() => { saveStackChoice({ regionId: "forearm", total: 12, settings, updatedAt: NOW }, "athlete-a"); });
    expect(result.current.choices).toHaveLength(1);
    act(() => { result.current.remove("stack-1"); });
    expect(result.current.stacks).toEqual([]);
  });
});
