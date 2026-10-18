import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import type { DayRecord } from "@/lib/trainingDayPlan";
import { getGoalPrescription } from "@/lib/workoutPlanner";
import { prescriptionOf } from "./planBouts";
import { applyPlanChangeToRecord, insertionIndex } from "./planChange";
import type { SpecializationPlanChange } from "./viewState";

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const day = (): DayRecord => ({
  workout: [byId(132), byId(139)],
  prescriptions: { 132: "3 × 10–12", 139: "4 × 15" },
  settings: { 139: { rest: "60 sec", notes: "slow", completed: false } },
  context: [],
});
// A day whose first exercise has no prescription of its own: it reads as the goal's default for position 0.
const unprescribedFirst = (): DayRecord => ({
  workout: [byId(132), byId(139)],
  prescriptions: { 139: "4 × 15" },
  settings: {},
  context: [],
});
const change = { week: 2, slotIndex: 1, dayKey: "1-Pull", catalogExerciseId: 140 };
const ids = (record: DayRecord) => record.workout.map((exercise) => exercise.id);
/** What every plan reader takes as an entry's prescription. */
const readAs = (record: DayRecord, id: number) => prescriptionOf(record.prescriptions[id], record.workout.findIndex((exercise) => exercise.id === id), "Athleticism");

describe("an add or swap from the specialization page, on one exact day (brief §7)", () => {
  it("adds to the end with the given prescription and touches nothing else", () => {
    const outcome = applyPlanChangeToRecord(day(), { ...change, prescription: "3 × 20" }, byId(140));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(ids(outcome.record)).toEqual([132, 139, 140]);
    expect(outcome.record.prescriptions).toEqual({ 132: "3 × 10–12", 139: "4 × 15", 140: "3 × 20" });
    expect(outcome.record.settings).toEqual(day().settings);
    expect(outcome.index).toBe(2);
  });

  it("pins no prescription on an add that names none, so it reads as the default for its position", () => {
    const first = applyPlanChangeToRecord(day(), { ...change, insertAt: 0 }, byId(140));
    const last = applyPlanChangeToRecord(day(), change, byId(140));
    if (!first.ok || !last.ok) throw new Error("expected both adds to apply");
    expect(first.record.prescriptions).not.toHaveProperty("140");
    expect(last.record.prescriptions).not.toHaveProperty("140");
    expect(readAs(first.record, 140)).toBe(getGoalPrescription("Athleticism", 0));
    expect(readAs(last.record, 140)).toBe(getGoalPrescription("Athleticism", 2));
  });

  it("swaps in place and keeps the replaced exercise's prescription and settings", () => {
    const outcome = applyPlanChangeToRecord(day(), { ...change, replaceEntryId: 139 }, byId(140));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(ids(outcome.record)).toEqual([132, 140]);
    expect(outcome.record.prescriptions).toEqual({ 132: "3 × 10–12", 140: "4 × 15" });
    expect(outcome.record.settings).toEqual({ 140: { rest: "60 sec", notes: "slow", completed: false } });
    expect(outcome.summary).toBe("Swapped Wrist Curl for Reverse Wrist Curl");
    expect(outcome.index).toBe(1);
  });

  it("swaps an unprescribed first exercise without changing its planned sets: the incoming one keeps that position's default", () => {
    const before = unprescribedFirst();
    const outcome = applyPlanChangeToRecord(before, { ...change, replaceEntryId: 132 }, byId(140));
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(ids(outcome.record)).toEqual([140, 139]);
    // No entry is written for it, exactly as Plan's own swap leaves it...
    expect(outcome.record.prescriptions).toEqual({ 139: "4 × 15" });
    expect(outcome.record.settings).toEqual({});
    // ...so it reads as what the outgoing exercise read as, not as the default for the day's last place.
    expect(readAs(outcome.record, 140)).toBe(readAs(before, 132));
    expect(readAs(outcome.record, 140)).toBe(getGoalPrescription("Athleticism", 0));
    expect(readAs(outcome.record, 140)).not.toBe(getGoalPrescription("Athleticism", before.workout.length));
  });

  it("ignores a prescription and a slot sent with a swap: the incoming exercise takes the outgoing one's place and own values only", () => {
    const outcome = applyPlanChangeToRecord(unprescribedFirst(), { ...change, replaceEntryId: 132, insertAt: 2, prescription: "5 × 5" }, byId(140));
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(ids(outcome.record)).toEqual([140, 139]);
    expect(outcome.record.prescriptions).toEqual({ 139: "4 × 15" });
  });

  it("puts an add in the exact slot asked for: first, after an exercise, or at the end", () => {
    const at = (insertAt: number | undefined) => {
      const outcome = applyPlanChangeToRecord(day(), { ...change, ...(insertAt === undefined ? {} : { insertAt }) }, byId(140));
      if (!outcome.ok) throw new Error(outcome.reason);
      return [ids(outcome.record), outcome.index];
    };
    expect(at(0)).toEqual([[140, 132, 139], 0]);
    expect(at(1)).toEqual([[132, 140, 139], 1]);
    expect(at(2)).toEqual([[132, 139, 140], 2]);
    expect(at(undefined)).toEqual([[132, 139, 140], 2]);
  });

  it("clamps a slot outside the day to its nearest end", () => {
    const at = (insertAt: number) => {
      const outcome = applyPlanChangeToRecord(day(), { ...change, insertAt }, byId(140));
      if (!outcome.ok) throw new Error(outcome.reason);
      return ids(outcome.record);
    };
    expect(at(-3)).toEqual([140, 132, 139]);
    expect(at(99)).toEqual([132, 139, 140]);
    expect(at(1.7)).toEqual([132, 140, 139]);
    expect(at(Number.NaN)).toEqual([132, 139, 140]);
    expect(insertionIndex(0, 4)).toBe(0);
    expect(insertionIndex(3, undefined)).toBe(3);
  });

  it("adds into an empty day as its only exercise", () => {
    const outcome = applyPlanChangeToRecord({ workout: [], prescriptions: {}, settings: {}, context: [] }, { ...change, insertAt: 0 }, byId(140));
    if (!outcome.ok) throw new Error(outcome.reason);
    expect(ids(outcome.record)).toEqual([140]);
    expect(outcome.record.prescriptions).toEqual({});
  });

  it("refuses an exercise the day already has, wherever it was asked to go, and a swap whose exercise has gone", () => {
    const duplicate = { ok: false, reason: "Hammer Curl is already in that day." };
    expect(applyPlanChangeToRecord(day(), { ...change, catalogExerciseId: 132 }, byId(132))).toEqual(duplicate);
    expect(applyPlanChangeToRecord(day(), { ...change, catalogExerciseId: 132, insertAt: 0 }, byId(132))).toEqual(duplicate);
    expect(applyPlanChangeToRecord(day(), { ...change, catalogExerciseId: 132, replaceEntryId: 139 }, byId(132))).toEqual(duplicate);
    // A duplicated entry has an id of its own; the catalog id is what makes it the same exercise.
    const withCopy: DayRecord = { ...day(), workout: [byId(132), { ...byId(140), id: 900001, catalogExerciseId: 140 } as DayRecord["workout"][number]] };
    expect(applyPlanChangeToRecord(withCopy, change, byId(140))).toEqual({ ok: false, reason: "Reverse Wrist Curl is already in that day." });
    expect(applyPlanChangeToRecord(day(), { ...change, replaceEntryId: 999 }, byId(140))).toEqual({ ok: false, reason: "The exercise to swap out is no longer in that day." });
  });

  it("never edits the record it was given (the preview reads it before saving)", () => {
    const record = day();
    const snapshot = JSON.stringify(record);
    applyPlanChangeToRecord(record, { ...change, replaceEntryId: 139 }, byId(140));
    applyPlanChangeToRecord(record, { ...change, insertAt: 1, prescription: "3 × 8" }, byId(140));
    expect(JSON.stringify(record)).toBe(snapshot);
  });
});

describe("Undo of an add or swap from the specialization page: that one change, on the day as it stands then", () => {
  const applied = (record: DayRecord, extra: Partial<SpecializationPlanChange>) => {
    const outcome = applyPlanChangeToRecord(record, { ...change, ...extra }, byId(140));
    if (!outcome.ok) throw new Error(outcome.reason);
    return outcome;
  };

  it("takes an add back out of the slot it was given, and the day closes up as it was", () => {
    const before = unprescribedFirst();
    const outcome = applied(before, { insertAt: 0 });
    expect(outcome.revert(outcome.record)).toEqual(before);
  });

  it("takes out only that add after other edits to the day, wherever it stands by then", () => {
    const outcome = applied(day(), { insertAt: 1 });
    // Since: the add moved to the end and another exercise was added first.
    const since: DayRecord = { ...outcome.record, workout: [byId(1), byId(132), byId(139), byId(140)], prescriptions: { ...outcome.record.prescriptions, 1: "2 × 5", 140: "5 × 5" } };
    const undone = outcome.revert(since);
    expect(ids(undone)).toEqual([1, 132, 139]);
    expect(undone.prescriptions).toEqual({ 1: "2 × 5", 132: "3 × 10–12", 139: "4 × 15" });
  });

  it("puts a swapped-out exercise back in the incoming one's place, with only what it had of its own", () => {
    const prescribed = applied(day(), { replaceEntryId: 139 });
    expect(prescribed.revert(prescribed.record)).toEqual(day());
    const unprescribed = applied(unprescribedFirst(), { replaceEntryId: 132 });
    const undone = unprescribed.revert(unprescribed.record);
    expect(undone).toEqual(unprescribedFirst());
    expect(undone.prescriptions).not.toHaveProperty("132");
  });

  it("puts back a duplicated entry (its own negative id) that was swapped out", () => {
    const copy = { ...byId(132), id: -1700000000001, catalogExerciseId: 132 } as DayRecord["workout"][number];
    const before: DayRecord = { workout: [byId(132), copy], prescriptions: { [copy.id]: "2 × 20" }, settings: { [copy.id]: { rest: "45 sec", notes: "", completed: false } }, context: [] };
    const outcome = applied(before, { replaceEntryId: copy.id });
    expect(ids(outcome.record)).toEqual([132, 140]);
    expect(outcome.record.prescriptions).toEqual({ 140: "2 × 20" });
    expect(outcome.revert(outcome.record)).toEqual(before);
  });

  it("never puts an exercise into a day twice: when the swapped-out one is back already, only the incoming one comes out", () => {
    const outcome = applied(day(), { replaceEntryId: 139 });
    // Since: the athlete added Wrist Curl to the day again, at the end.
    const since: DayRecord = { ...outcome.record, workout: [...outcome.record.workout, byId(139)] };
    const undone = outcome.revert(since);
    expect(ids(undone)).toEqual([132, 139]);
    expect(new Set(ids(undone)).size).toBe(undone.workout.length);
    expect(undone.prescriptions).not.toHaveProperty("140");
  });

  it("changes nothing once the incoming exercise has left the day", () => {
    const outcome = applied(day(), { replaceEntryId: 139 });
    const since: DayRecord = { ...outcome.record, workout: [byId(132)] };
    expect(outcome.revert(since)).toBe(since);
  });
});
