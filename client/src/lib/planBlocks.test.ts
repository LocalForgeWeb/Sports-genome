import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import type { DayRecord } from "./trainingDayPlan";
import { activeBlocks, archivedBlocks, blockFromDay, blockPreviewLine, duplicateBlock, editBlockEntries, emptyBlockStore, insertBlockIntoDay, insertionIndex, isBlockStore, previewBlockInsert, removeInsertedEntries, renameBlock, setBlockArchived, upsertBlock, validBlockPrescription, type PlanBlock } from "./planBlocks";

const byName = (name: string) => { const found = exercises.find((exercise) => exercise.name === name); if (!found) throw new Error(name); return found; };
const wristCurl = byName("Wrist Curl");
const reverseCurl = byName("Reverse Wrist Curl");
const pronation = byName("Dumbbell Forearm Pronation");
const bench = byName("Barbell Bench Press");
const row = byName("Seated Cable Row");
const settings = (rest: string, notes = "") => ({ rpe: "RPE 8", rest, notes, completed: true });

/** A Pull day with a duplicated wrist curl (the planner's Duplicate gives the repeat its own id). */
function sourceDay(): DayRecord {
  const repeat = { ...wristCurl, id: -101, catalogExerciseId: wristCurl.id } as typeof wristCurl;
  return {
    workout: [row, wristCurl, repeat, reverseCurl],
    prescriptions: { [row.id]: "4 × 8–10", [wristCurl.id]: "3 × 12–15", [-101]: "2 × 20", [reverseCurl.id]: "3 × 15" },
    settings: { [wristCurl.id]: settings("60 sec", "Slow lowering") },
    context: [],
  };
}
function save(day: DayRecord, ids: number[], name = "Forearm finisher"): PlanBlock {
  const result = blockFromDay(day, ids, { name, description: "After pulls" }, { id: "b1", now: "2026-10-07T10:00:00Z" });
  if (!result.ok) throw new Error(result.message);
  return result.block;
}
let fresh = -500;
const freshId = () => --fresh;

/** Utility brief §5 (BL02-BL13, BL16). */
describe("plan blocks", () => {
  it("saves the chosen entries in order with their planned prescriptions and settings, and leaves the day as it was", () => {
    const day = sourceDay();
    const before = JSON.stringify(day);
    const block = save(day, [wristCurl.id, -101, reverseCurl.id]);
    expect(JSON.stringify(day)).toBe(before);
    expect(block).toMatchObject({ schema: 1, name: "Forearm finisher", description: "After pulls" });
    expect(block.entries).toEqual([
      { catalogExerciseId: wristCurl.id, name: "Wrist Curl", prescription: "3 × 12–15", rpe: "RPE 8", rest: "60 sec", notes: "Slow lowering" },
      { catalogExerciseId: wristCurl.id, name: "Wrist Curl", prescription: "2 × 20" },
      { catalogExerciseId: reverseCurl.id, name: "Reverse Wrist Curl", prescription: "3 × 15" },
    ]);
    // Never a completed flag, a logged weight, a date of training or an entry id.
    expect(JSON.stringify(block)).not.toMatch(/completed|weight|entryId|-101/);
  });

  it("needs a name and at least one exercise", () => {
    expect(blockFromDay(sourceDay(), [row.id], { name: "  " }, { id: "x", now: "n" })).toEqual({ ok: false, message: "Give the block a name, like Forearm finisher." });
    expect(blockFromDay(sourceDay(), [], { name: "Empty" }, { id: "x", now: "n" })).toEqual({ ok: false, message: "Choose at least one exercise for the block." });
  });

  it("inserts independent copies with new ids, in order, at the chosen place, and keeps a repeat as its own entry", () => {
    const block = save(sourceDay(), [wristCurl.id, -101, reverseCurl.id]);
    const push: DayRecord = { workout: [bench], prescriptions: { [bench.id]: "5 × 5" }, settings: {}, context: [] };
    const result = insertBlockIntoDay(push, block, 0, {}, freshId);
    expect(result.unresolved).toEqual([]);
    expect(result.record.workout.map((entry) => entry.name)).toEqual(["Wrist Curl", "Wrist Curl", "Reverse Wrist Curl", "Barbell Bench Press"]);
    const [first, repeat] = result.record.workout;
    expect(first.id).toBe(wristCurl.id);
    expect(repeat.id).toBeLessThan(0);
    expect(repeat.id).not.toBe(-101);
    expect(result.record.prescriptions).toMatchObject({ [first.id]: "3 × 12–15", [repeat.id]: "2 × 20", [reverseCurl.id]: "3 × 15", [bench.id]: "5 × 5" });
    expect(result.record.settings[first.id]).toMatchObject({ rpe: "RPE 8", rest: "60 sec", notes: "Slow lowering", completed: false });
    expect(result.insertedIds).toEqual([first.id, repeat.id, reverseCurl.id]);
  });

  it("save → edit the source day → insert → edit the block: every copy keeps its own content", () => {
    const day = sourceDay();
    const block = save(day, [wristCurl.id, reverseCurl.id]);
    // The source day changes after saving: the block does not.
    day.prescriptions[wristCurl.id] = "5 × 5";
    expect(block.entries[0].prescription).toBe("3 × 12–15");
    const inserted = insertBlockIntoDay({ workout: [], prescriptions: {}, settings: {}, context: [] }, block, 0, {}, freshId).record;
    // The block changes after inserting: the inserted copy does not.
    const store = upsertBlock(emptyBlockStore, block);
    const edited = editBlockEntries(store, block.id, [{ ...block.entries[0], prescription: "4 × 10" }], "2026-10-07T11:00:00Z");
    if (!edited.ok) throw new Error(edited.message);
    expect(edited.store.blocks[0].entries).toEqual([{ ...block.entries[0], prescription: "4 × 10" }]);
    expect(inserted.prescriptions[wristCurl.id]).toBe("3 × 12–15");
    expect(inserted.workout.map((entry) => entry.name)).toEqual(["Wrist Curl", "Reverse Wrist Curl"]);
    expect(day.prescriptions[wristCurl.id]).toBe("5 × 5");
  });

  it("shows what an exercise already in the day means, and does not add it twice", () => {
    const block = save(sourceDay(), [wristCurl.id, reverseCurl.id]);
    const day: DayRecord = { workout: [reverseCurl], prescriptions: { [reverseCurl.id]: "2 × 25" }, settings: {}, context: [] };
    expect(previewBlockInsert(day, block).map((item) => item.status)).toEqual(["add", "already-in-day"]);
    const result = insertBlockIntoDay(day, block, day.workout.length, {}, freshId);
    expect(result.alreadyThere).toEqual(["Reverse Wrist Curl"]);
    expect(result.record.prescriptions[reverseCurl.id]).toBe("2 × 25");
    expect(result.record.workout.map((entry) => entry.name)).toEqual(["Reverse Wrist Curl", "Wrist Curl"]);
  });

  it("stops at an exercise the catalog no longer holds until it is resolved or left out", () => {
    const block: PlanBlock = { ...save(sourceDay(), [wristCurl.id]), entries: [{ catalogExerciseId: 999999, name: "Old Forearm Roller", prescription: "3 × 30 sec" }, { catalogExerciseId: pronation.id, name: pronation.name, prescription: "3 × 12" }] };
    const empty: DayRecord = { workout: [], prescriptions: {}, settings: {}, context: [] };
    const preview = previewBlockInsert(empty, block);
    expect(preview[0]).toMatchObject({ status: "missing" });
    expect(insertBlockIntoDay(empty, block, 0, {}, freshId)).toMatchObject({ unresolved: ["Old Forearm Roller"], insertedIds: [] });
    const omitted = insertBlockIntoDay(empty, block, 0, { 0: "omit" }, freshId);
    expect(omitted.omitted).toEqual(["Old Forearm Roller"]);
    expect(omitted.record.workout.map((entry) => entry.name)).toEqual([pronation.name]);
    const resolved = insertBlockIntoDay(empty, block, 0, { 0: byName("Wrist Roller").id }, freshId);
    expect(resolved.record.workout.map((entry) => entry.name)).toEqual(["Wrist Roller", pronation.name]);
    expect(resolved.record.prescriptions[byName("Wrist Roller").id]).toBe("3 × 30 sec");
  });

  it("undoes one insertion exactly: its entries go, later edits elsewhere stay", () => {
    const block = save(sourceDay(), [wristCurl.id, -101]);
    const day: DayRecord = { workout: [bench], prescriptions: { [bench.id]: "5 × 5" }, settings: {}, context: [] };
    const inserted = insertBlockIntoDay(day, block, 1, {}, freshId);
    // An edit made after the insertion, to an entry that was already there.
    const later: DayRecord = { ...inserted.record, prescriptions: { ...inserted.record.prescriptions, [bench.id]: "3 × 3" } };
    const undone = removeInsertedEntries(later, inserted.insertedIds);
    expect(undone.workout.map((entry) => entry.name)).toEqual(["Barbell Bench Press"]);
    expect(undone.prescriptions).toEqual({ [bench.id]: "3 × 3" });
  });

  it("keeps the chosen place when the day changes while the preview is open (BL12)", () => {
    const day: DayRecord = { workout: [bench, row], prescriptions: {}, settings: {}, context: [] };
    // "Before Seated Cable Row" was chosen; since then an exercise was added at the top.
    const edited: DayRecord = { ...day, workout: [wristCurl, bench, row] };
    expect(insertionIndex(edited, row.id)).toEqual({ index: 2, anchorGone: false });
    const block = save(sourceDay(), [reverseCurl.id]);
    const inserted = insertBlockIntoDay(edited, block, insertionIndex(edited, row.id).index, {}, freshId);
    expect(inserted.record.workout.map((entry) => entry.name)).toEqual(["Wrist Curl", "Barbell Bench Press", "Reverse Wrist Curl", "Seated Cable Row"]);
    // The chosen exercise was removed since: after the last entry, and the caller is told.
    expect(insertionIndex({ ...day, workout: [bench] }, row.id)).toEqual({ index: 1, anchorGone: true });
    expect(insertionIndex(day, null)).toEqual({ index: 2, anchorGone: false });
  });

  it("validates a block's prescriptions with the planner's own reader, never replacing them", () => {
    expect(validBlockPrescription("3 × 8–12")).toBe(true);
    expect(validBlockPrescription("4 × 20 s")).toBe(true);
    expect(validBlockPrescription("")).toBe(true);
    expect(validBlockPrescription("lots")).toBe(false);
    const block = save(sourceDay(), [wristCurl.id]);
    const store = upsertBlock(emptyBlockStore, block);
    expect(editBlockEntries(store, block.id, [{ ...block.entries[0], prescription: "lots" }], "n")).toEqual({ ok: false, message: "Write Wrist Curl's sets and reps like 3 × 8–12, or leave it empty for the plan's default." });
    expect(editBlockEntries(store, block.id, [], "n").ok).toBe(false);
  });

  it("renames, duplicates, archives and restores", () => {
    let store = upsertBlock(emptyBlockStore, save(sourceDay(), [wristCurl.id, reverseCurl.id]));
    const renamed = renameBlock(store, "b1", { name: "Grip finisher" }, "n1");
    if (!renamed.ok) throw new Error(renamed.message);
    store = duplicateBlock(renamed.store, "b1", "b2", "n2");
    expect(activeBlocks(store).map((block) => block.name)).toEqual(["Grip finisher", "Grip finisher (copy)"]);
    store = setBlockArchived(store, "b1", true, "n3");
    expect(activeBlocks(store).map((block) => block.id)).toEqual(["b2"]);
    expect(archivedBlocks(store).map((block) => block.id)).toEqual(["b1"]);
    store = setBlockArchived(store, "b1", false, "n4");
    expect(activeBlocks(store)).toHaveLength(2);
    expect(isBlockStore(JSON.parse(JSON.stringify(store)))).toBe(true);
    expect(blockPreviewLine(store.blocks[0])).toBe("Wrist Curl 3 × 12–15 · Reverse Wrist Curl 3 × 15");
  });
});
