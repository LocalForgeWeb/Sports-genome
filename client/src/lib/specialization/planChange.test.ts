import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, commitDay, emptyDayStore, loadDay, type DayRecord, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription } from "@/lib/workoutPlanner";
import { prescriptionOf } from "./planBouts";
import { applyPlanBatch, describePlanBatch, type PlanBatchOutcome } from "./planBatch";
import { applyPlanChangeToRecord, insertionIndex } from "./planChange";
import type { SpecializationPlanBatch, SpecializationPlanBatchChange, SpecializationPlanChange } from "./viewState";

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

// ---------------------------------------------------------------- batches (11-forearm-research-and-stack.md §3.7)

const slots = buildDaySlots(["Push", "Pull", "Legs"]);
const [push, pull, legs] = slots.map((slot) => slot.key);
const context = { slots, catalog: exercises };
/** Day 01: Hammer Curl (no prescription of its own) and Wrist Curl (4 × 15, with settings); Day 02: entry 1; Day 03 empty. */
const weekStore = (): WeeklyDayStore => {
  let store = emptyDayStore();
  store = commitDay(store, push, { workout: [byId(132), byId(139)], prescriptions: { 139: "4 × 15" }, settings: { 139: { rest: "60 sec", notes: "slow", completed: false } }, context: [] });
  store = commitDay(store, pull, { workout: [byId(1)], prescriptions: { 1: "3 × 5" }, settings: {}, context: [] });
  return store;
};
const batchOf = (...changes: SpecializationPlanBatchChange[]): SpecializationPlanBatch => ({ week: 1, changes });
const add = (dayKey: string, catalogExerciseId: number, prescription?: string): SpecializationPlanBatchChange => ({ kind: "add", dayKey, catalogExerciseId, ...(prescription ? { prescription } : {}) });
const applied = (outcome: PlanBatchOutcome) => {
  if (!outcome.ok) throw new Error(outcome.reason);
  return outcome;
};
const recordOf = (outcome: Extract<PlanBatchOutcome, { ok: true }>, dayKey: string) => outcome.days.find((day) => day.slot.key === dayKey)!;
/** Every touched day's revert, newest day first, on a week as it stands then: what Home's one Undo does. */
const undoAll = (outcome: Extract<PlanBatchOutcome, { ok: true }>, week: WeeklyDayStore) =>
  [...outcome.days].reverse().reduce((store, day) => commitDay(store, day.slot.key, day.revert(loadDay(store, day.slot.key))), week);

describe("a batch of changes to one plan week: every change or none", () => {
  it("adds over two days, every touched day once and in the order first touched, and leaves the week given as it was", () => {
    const store = weekStore();
    const snapshot = JSON.stringify(store);
    const outcome = applied(applyPlanBatch(store, batchOf(add(push, 140, "1 × 10–25"), add(pull, 139, "2 × 10–25"), add(push, 121, "1 × 8–12")), context));
    expect(outcome.days.map((day) => day.slot.key)).toEqual([push, pull]);
    expect(ids(recordOf(outcome, push).record)).toEqual([132, 139, 140, 121]);
    expect(recordOf(outcome, push).record.prescriptions).toEqual({ 139: "4 × 15", 140: "1 × 10–25", 121: "1 × 8–12" });
    expect(recordOf(outcome, push).record.settings).toEqual({ 139: { rest: "60 sec", notes: "slow", completed: false } });
    expect(ids(recordOf(outcome, pull).record)).toEqual([1, 139]);
    expect(recordOf(outcome, push).before).toEqual(loadDay(store, push));
    // The week after, for the page's preview, is exactly what Home writes day by day.
    expect(outcome.store).toEqual(outcome.days.reduce((week, day) => commitDay(week, day.slot.key, day.record), store));
    expect(loadDay(outcome.store, legs)).toEqual(loadDay(store, legs));
    expect(JSON.stringify(store)).toBe(snapshot);
    expect(outcome.message).toEqual({ title: "Added 4 sets: 3 exercises on Day 01, Day 02 of Week 1", description: "Your own exercises are unchanged." });
  });

  it("refuses the whole batch at the first change that cannot apply, naming its day, and gives back no day to write", () => {
    const store = weekStore();
    const snapshot = JSON.stringify(store);
    const outcome = applyPlanBatch(store, batchOf(add(pull, 139, "1 × 10–25"), add(legs, 140, "1 × 10–25"), add(push, 132, "1 × 10–25"), add(legs, 999999)), context);
    expect(outcome).toEqual({ ok: false, reason: "Day 01 · Push: Hammer Curl is already in that day. Nothing was changed.", changeIndex: 2 });
    expect(outcome).not.toHaveProperty("days");
    expect(JSON.stringify(store)).toBe(snapshot);
    expect(applyPlanBatch(store, batchOf(add(pull, 139), add("9-Nowhere", 140)), context)).toEqual({ ok: false, reason: "That day is no longer in your week. Choose another day. Nothing was changed.", changeIndex: 1 });
    expect(applyPlanBatch(store, batchOf(add(legs, 999999)), context)).toEqual({ ok: false, reason: "Day 03 · Legs: That exercise is not in the catalog any more. Nothing was changed.", changeIndex: 0 });
    expect(applyPlanBatch(store, batchOf(), context)).toEqual({ ok: false, reason: "There was nothing to change. Nothing was changed.", changeIndex: -1 });
  });

  it("never adds an exercise a day already holds, even one the same batch put there", () => {
    expect(applyPlanBatch(weekStore(), batchOf(add(legs, 140, "1 × 10–25"), add(legs, 140, "2 × 10–25")), context)).toEqual({ ok: false, reason: "Day 03 · Legs: Reverse Wrist Curl is already in that day. Nothing was changed.", changeIndex: 1 });
  });

  it("applies each change to its day as the changes before it left it: out as written, then back with another prescription", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf({ kind: "remove", dayKey: push, entryId: 139, catalogExerciseId: 139, prescription: "4 × 15" }, add(push, 139, "2 × 10–25")), context));
    expect(outcome.days).toHaveLength(1);
    expect(ids(outcome.days[0].record)).toEqual([132, 139]);
    expect(outcome.days[0].record.prescriptions).toEqual({ 139: "2 × 10–25" });
    expect(outcome.message.title).toBe("Changed Week 1 on Day 01: added 2 sets, took out 4 sets");
    // One revert for the day takes both back, newest first.
    expect(outcome.days[0].revert(outcome.days[0].record)).toEqual(loadDay(store, push));
  });

  it("swaps as a single change does, inside a batch", () => {
    const outcome = applied(applyPlanBatch(weekStore(), batchOf({ kind: "add", dayKey: push, catalogExerciseId: 140, replaceEntryId: 139 }), context));
    expect(ids(outcome.days[0].record)).toEqual([132, 140]);
    expect(outcome.days[0].record.prescriptions).toEqual({ 140: "4 × 15" });
    expect(outcome.message).toEqual({ title: "Swapped Wrist Curl for Reverse Wrist Curl on Day 01 of Week 1", description: "Sets you already logged keep the exercise they were logged as." });
  });
});

describe("Undo of a batch: every day's revert, newest day first, on the days as they stand then", () => {
  it("restores every day exactly when nothing changed since", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf(add(push, 140, "1 × 10–25"), add(pull, 139, "1 × 10–25"), add(legs, 121, "1 × 8–12")), context));
    const undone = undoAll(outcome, outcome.store);
    for (const key of [push, pull, legs]) expect(loadDay(undone, key), key).toEqual(loadDay(store, key));
  });

  it("takes back only the batch's own changes on days edited since, and keeps the athlete's later edits", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf(add(push, 140, "1 × 10–25"), { kind: "remove", dayKey: push, entryId: 132, catalogExerciseId: 132 }, add(pull, 139, "1 × 10–25")), context));
    // Since: on Day 01 the athlete put entry 2 first and changed Wrist Curl's sets; on Day 02 they changed the added entry's sets.
    let since = commitDay(outcome.store, push, { ...loadDay(outcome.store, push), workout: [byId(2), byId(139), byId(140)], prescriptions: { 2: "3 × 6", 139: "5 × 15", 140: "1 × 10–25" } });
    since = commitDay(since, pull, { ...loadDay(since, pull), prescriptions: { 1: "3 × 5", 139: "3 × 10–25" } });
    const undone = undoAll(outcome, since);
    // The add comes out wherever it stands, the removed entry goes back where it was, and the athlete's own edits stay.
    expect(ids(loadDay(undone, push))).toEqual([132, 2, 139]);
    expect(loadDay(undone, push).prescriptions).toEqual({ 2: "3 × 6", 139: "5 × 15" });
    expect(loadDay(undone, push).settings).toEqual({ 139: { rest: "60 sec", notes: "slow", completed: false } });
    expect(ids(loadDay(undone, pull))).toEqual([1]);
    expect(loadDay(undone, pull).prescriptions).toEqual({ 1: "3 × 5" });
  });

  it("never puts a removed entry back into a day that holds its exercise again", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf({ kind: "remove", dayKey: push, entryId: 139, catalogExerciseId: 139, prescription: "4 × 15" }), context));
    const since = commitDay(outcome.store, push, { ...loadDay(outcome.store, push), workout: [byId(139), byId(132)], prescriptions: { 139: "2 × 20" } });
    const day = loadDay(undoAll(outcome, since), push);
    expect(ids(day)).toEqual([139, 132]);
    expect(day.prescriptions).toEqual({ 139: "2 × 20" });
  });
});

describe("remove: only an entry still as written", () => {
  const remove = (prescription?: string, entryId = 139, catalogExerciseId = 139): SpecializationPlanBatchChange => ({ kind: "remove", dayKey: push, entryId, catalogExerciseId, ...(prescription === undefined ? {} : { prescription }) });

  it("takes out the named entry with its prescription and settings, and nothing else", () => {
    const outcome = applied(applyPlanBatch(weekStore(), batchOf(remove("4 × 15")), context));
    expect(ids(outcome.days[0].record)).toEqual([132]);
    expect(outcome.days[0].record.prescriptions).toEqual({});
    expect(outcome.days[0].record.settings).toEqual({});
    expect(outcome.message).toEqual({ title: "Wrist Curl taken out of Day 01 of Week 1", description: "Your other exercises are unchanged." });
    // An entry with no prescription of its own is as written when the change names none.
    expect(ids(applied(applyPlanBatch(weekStore(), batchOf(remove(undefined, 132, 132)), context)).days[0].record)).toEqual([139]);
  });

  it("refuses an entry changed since, gone, or another exercise by now", () => {
    expect(applyPlanBatch(weekStore(), batchOf(remove("1 × 10–25")), context)).toEqual({ ok: false, reason: "Day 01 · Push: Wrist Curl has changed in that day since, so it is yours now. Nothing was changed.", changeIndex: 0 });
    expect(applyPlanBatch(weekStore(), batchOf(remove()), context)).toMatchObject({ ok: false, reason: "Day 01 · Push: Wrist Curl has changed in that day since, so it is yours now. Nothing was changed." });
    expect(applyPlanBatch(weekStore(), batchOf(remove("2 × 10", 132, 132)), context)).toMatchObject({ ok: false, reason: "Day 01 · Push: Hammer Curl has changed in that day since, so it is yours now. Nothing was changed." });
    expect(applyPlanBatch(weekStore(), batchOf(remove("4 × 15", 140, 140)), context)).toMatchObject({ ok: false, reason: "Day 01 · Push: Reverse Wrist Curl is no longer in that day. Nothing was changed." });
    expect(applyPlanBatch(weekStore(), batchOf(remove("4 × 15", 139, 140)), context)).toMatchObject({ ok: false, reason: "Day 01 · Push: Reverse Wrist Curl is no longer in that day. Nothing was changed." });
  });

  it("acts on a duplicated entry by its own id, leaving the other entry of that exercise", () => {
    const copy = { ...byId(139), id: -1700000000001, catalogExerciseId: 139 } as DayRecord["workout"][number];
    const store = commitDay(weekStore(), legs, { workout: [byId(139), copy], prescriptions: { [copy.id]: "2 × 20" }, settings: {}, context: [] });
    const outcome = applied(applyPlanBatch(store, batchOf({ kind: "remove", dayKey: legs, entryId: copy.id, catalogExerciseId: 139, prescription: "2 × 20" }), context));
    expect(ids(outcome.days[0].record)).toEqual([139]);
    expect(outcome.days[0].revert(outcome.days[0].record)).toEqual(loadDay(store, legs));
  });

  it("counts what it took out by sets where every prescription is written down", () => {
    const store = commitDay(weekStore(), pull, { workout: [byId(1), byId(140)], prescriptions: { 1: "3 × 5", 140: "2 × 10–25" }, settings: {}, context: [] });
    const outcome = applied(applyPlanBatch(store, { week: 2, changes: [remove("4 × 15"), { kind: "remove", dayKey: pull, entryId: 140, catalogExerciseId: 140, prescription: "2 × 10–25" }] }, context));
    expect(outcome.message.title).toBe("Took out 6 sets: 2 exercises from Day 01, Day 02 of Week 2");
  });
});

describe("sets: the named entry's set count only", () => {
  const sets = (count: number, prescription: string, entryId = 139, dayKey = push): SpecializationPlanBatchChange => ({ kind: "sets", dayKey, entryId, catalogExerciseId: entryId, sets: count, prescription });

  it("writes the count into the entry's own prescription and touches nothing else", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf(sets(3, "4 × 15")), context));
    expect(outcome.days[0].record).toEqual({ ...loadDay(store, push), prescriptions: { 139: "3 × 15" } });
    expect(outcome.message).toEqual({ title: "Wrist Curl on Day 01 of Week 1: 4 → 3 sets", description: "Your other exercises are unchanged." });
    expect(outcome.days[0].revert(outcome.days[0].record)).toEqual(loadDay(store, push));
  });

  it("acts on the entry's own prescription as it stands, not an older reading", () => {
    const outcome = applied(applyPlanBatch(weekStore(), batchOf(sets(2, "3 × 10–25")), context));
    expect(outcome.days[0].record.prescriptions).toEqual({ 139: "2 × 15" });
  });

  it("gives an entry with no prescription of its own the page's reading at the new count, and Undo takes it away again", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf(sets(2, "3 × 8–12", 132)), context));
    expect(outcome.days[0].record.prescriptions).toEqual({ 132: "2 × 8–12", 139: "4 × 15" });
    const undone = outcome.days[0].revert(outcome.days[0].record);
    expect(undone.prescriptions).not.toHaveProperty("132");
    expect(undone).toEqual(loadDay(store, push));
  });

  it("leaves a count the athlete changed since when Undo is pressed", () => {
    const outcome = applied(applyPlanBatch(weekStore(), batchOf(sets(3, "4 × 15")), context));
    const since: DayRecord = { ...outcome.days[0].record, prescriptions: { 139: "5 × 15" } };
    expect(outcome.days[0].revert(since)).toBe(since);
  });

  it("refuses no sets, the count it has, more than the plan holds, and an entry no longer there", () => {
    const reason = (change: SpecializationPlanBatchChange) => (applyPlanBatch(weekStore(), batchOf(change), context) as { reason: string }).reason;
    expect(reason(sets(0, "4 × 15"))).toBe("Day 01 · Push: 1 set is the fewest for Wrist Curl; take it out instead. Nothing was changed.");
    expect(reason(sets(4, "4 × 15"))).toBe("Day 01 · Push: Wrist Curl already has 4 sets in that day. Nothing was changed.");
    expect(reason(sets(13, "4 × 15"))).toBe("Day 01 · Push: 12 sets is the most one exercise can be planned with. Nothing was changed.");
    expect(reason(sets(1.5, "4 × 15"))).toBe("Day 01 · Push: 1 set is the fewest for Wrist Curl; take it out instead. Nothing was changed.");
    expect(reason(sets(2, "4 × 15", 139, pull))).toBe("Day 02 · Pull: Wrist Curl is no longer in that day. Nothing was changed.");
  });
});

describe("move: one entry to another day, as a remove and an add in one", () => {
  const move = (toDayKey: string, extra: Partial<Extract<SpecializationPlanBatchChange, { kind: "move" }>> = {}): SpecializationPlanBatchChange => ({ kind: "move", dayKey: push, entryId: 139, catalogExerciseId: 139, toDayKey, ...extra });

  it("moves the named entry with its prescription and settings to the place asked for, and nothing else", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf(move(pull, { insertAt: 0 })), context));
    expect(outcome.days.map((day) => day.slot.key)).toEqual([push, pull]);
    expect(recordOf(outcome, push).record).toEqual({ ...loadDay(store, push), workout: [byId(132)], prescriptions: {}, settings: {} });
    expect(ids(recordOf(outcome, pull).record)).toEqual([139, 1]);
    expect(recordOf(outcome, pull).record.prescriptions).toEqual({ 1: "3 × 5", 139: "4 × 15" });
    expect(recordOf(outcome, pull).record.settings).toEqual({ 139: { rest: "60 sec", notes: "slow", completed: false } });
    expect(outcome.message).toEqual({ title: "Wrist Curl moved from Day 01 to Day 02 of Week 1", description: "Your other exercises are unchanged." });
    const undone = undoAll(outcome, outcome.store);
    for (const key of [push, pull]) expect(loadDay(undone, key), key).toEqual(loadDay(store, key));
  });

  it("keeps an unprescribed entry's sets through the change's prescription, so they do not change with its place", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf({ kind: "move", dayKey: push, entryId: 132, catalogExerciseId: 132, toDayKey: legs, prescription: "4 × 6–8" }), context));
    expect(recordOf(outcome, legs).record.prescriptions).toEqual({ 132: "4 × 6–8" });
    // Undo puts it back with no prescription of its own, as it was.
    expect(loadDay(undoAll(outcome, outcome.store), push)).toEqual(loadDay(store, push));
  });

  it("refuses a day that holds the exercise, its own day, and a day not in the week", () => {
    const store = commitDay(weekStore(), legs, { workout: [byId(139)], prescriptions: {}, settings: {}, context: [] });
    expect(applyPlanBatch(store, batchOf(move(legs)), context)).toEqual({ ok: false, reason: "Day 03 · Legs: Wrist Curl is already in that day. Nothing was changed.", changeIndex: 0 });
    expect(applyPlanBatch(store, batchOf(move(push)), context)).toMatchObject({ ok: false, reason: "Day 01 · Push: Wrist Curl is in that day already. Nothing was changed." });
    expect(applyPlanBatch(store, batchOf(move("9-Nowhere")), context)).toMatchObject({ ok: false, reason: "The day to move it to is no longer in your week. Choose another day. Nothing was changed." });
    expect(applyPlanBatch(store, batchOf({ ...move(pull), entryId: 140, catalogExerciseId: 140 } as SpecializationPlanBatchChange), context)).toMatchObject({ ok: false, reason: "Day 01 · Push: Reverse Wrist Curl is no longer in that day. Nothing was changed." });
  });

  it("on Undo, leaves the day it went to and returns to the one it left, even after edits to both", () => {
    const store = weekStore();
    const outcome = applied(applyPlanBatch(store, batchOf(move(pull)), context));
    // Since: entry 2 was added to the day it left, and the moved entry was put first in the day it went to.
    let since = commitDay(outcome.store, push, { ...loadDay(outcome.store, push), workout: [byId(132), byId(2)], prescriptions: { 2: "3 × 6" } });
    since = commitDay(since, pull, { ...loadDay(since, pull), workout: [byId(139), byId(1)] });
    const undone = undoAll(outcome, since);
    // Back in the place it left (second), with what it had of its own.
    expect(ids(loadDay(undone, push))).toEqual([132, 139, 2]);
    expect(loadDay(undone, push).prescriptions).toEqual({ 2: "3 × 6", 139: "4 × 15" });
    expect(loadDay(undone, push).settings).toEqual({ 139: { rest: "60 sec", notes: "slow", completed: false } });
    expect(ids(loadDay(undone, pull))).toEqual([1]);
    expect(loadDay(undone, pull).prescriptions).toEqual({ 1: "3 × 5" });
  });
});

describe("the batch's notice", () => {
  const notice = (changes: SpecializationPlanBatchChange[], week = 1) => applied(applyPlanBatch(weekStore(), { week, changes }, context)).message;

  it("says the stack's Add in the design's words: sets, exercises and days, and that the athlete's own entries are unchanged", () => {
    const changes = [add(push, 140, "1 × 10–25"), add(pull, 140, "1 × 10–25"), add(legs, 140, "1 × 10–25"), add(legs, 121, "1 × 10–25")];
    expect(notice(changes)).toEqual({ title: "Added 4 sets: 4 exercises on Day 01, Day 02, Day 03 of Week 1", description: "Your own exercises are unchanged." });
    expect(notice([add(legs, 140, "3 × 10–25")], 2).title).toBe("Added 3 sets: 1 exercise on Day 03 of Week 2");
    expect(notice([add(legs, 140, "1 × 10–25")]).title).toBe("Added 1 set: 1 exercise on Day 03 of Week 1");
  });

  it("counts exercises, not sets, when an add's prescription is not written down", () => {
    expect(notice([add(legs, 140), add(pull, 140, "1 × 10–25")]).title).toBe("Added 2 exercises on Day 02, Day 03 of Week 1");
  });

  it("names the days in the week's order, whatever order the changes came in", () => {
    expect(notice([add(legs, 140, "1 × 10–25"), add(push, 140, "1 × 10–25")]).title).toBe("Added 2 sets: 2 exercises on Day 01, Day 03 of Week 1");
    expect(describePlanBatch([{ kind: "move", dayKey: legs, toDayKey: push, name: "Wrist Curl" }, { kind: "move", dayKey: pull, toDayKey: legs, name: "Hammer Curl" }], 3, slots).title).toBe("Moved 2 exercises in Week 3");
  });

  it("says a mixed batch part by part", () => {
    const changes: SpecializationPlanBatchChange[] = [add(legs, 140, "1 × 10–25"), { kind: "sets", dayKey: pull, entryId: 1, catalogExerciseId: 1, sets: 2, prescription: "3 × 5" }, { kind: "move", dayKey: push, entryId: 132, catalogExerciseId: 132, toDayKey: legs }];
    expect(notice(changes)).toEqual({ title: "Changed Week 1 on Day 01, Day 02, Day 03: added 1 set, changed the sets of 1 exercise, moved 1 exercise", description: "Your other exercises are unchanged." });
  });
});
