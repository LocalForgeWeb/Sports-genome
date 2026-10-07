import type { Exercise } from "@/lib/exerciseCatalog";
import { exercises as catalog } from "@/lib/exerciseCatalog";
import type { DayRecord } from "@/lib/trainingDayPlan";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { getExerciseSettings } from "@/lib/workoutPlanner";
import { nameCandidates, storedPrescription } from "@/lib/planImport";

/**
 * Plan blocks: a named, reusable selection of PLANNED entries - a forearm accessory block, a
 * short pull block - saved from a day and inserted into another.
 *
 * A block is a snapshot of planning content only: which exercises (by catalog id, with the
 * name kept for display if the catalog ever loses one), in order, with each one's planned
 * prescription and its RPE, rest and note. It never holds a completed flag, a logged weight,
 * a training date or anything from a running workout. It is not a completed workout to replay
 * (Progress repeats those) and not a link to share (Share does that).
 *
 * Inserting makes independent copies: new plan entries in the open day, in the block's order,
 * at the place chosen. Editing the block later never changes them, and editing them never
 * changes the block. One insertion can be undone as a unit, removing exactly the entries it
 * created and nothing else.
 */

export const BLOCK_SCHEMA_VERSION = 1 as const;
export type BlockEntry = {
  catalogExerciseId: number;
  /** Shown if the catalog no longer holds the id, so the block never silently shrinks. */
  name: string;
  /** The day's planned prescription exactly as the planner stored it; empty means the plan's default. */
  prescription: string;
  rpe?: string;
  rest?: string;
  notes?: string;
};
export type PlanBlock = { id: string; schema: typeof BLOCK_SCHEMA_VERSION; name: string; description?: string; entries: BlockEntry[]; createdAt: string; updatedAt: string; archivedAt?: string };
export type BlockStore = { version: 1; blocks: PlanBlock[] };

export const BLOCK_STORE = "sg-plan-blocks-v1";
export const emptyBlockStore: BlockStore = { version: 1, blocks: [] };
export const blockLimits = { name: 60, description: 200, entries: 20 } as const;

const catalogIdOf = (exercise: Exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id;

export function isBlockStore(value: unknown): value is BlockStore {
  const store = value as BlockStore;
  return Boolean(store && store.version === 1 && Array.isArray(store.blocks) && store.blocks.every((block) => block && typeof block.id === "string" && block.schema === BLOCK_SCHEMA_VERSION && typeof block.name === "string" && Array.isArray(block.entries)
    && block.entries.every((entry) => Number.isInteger(entry.catalogExerciseId) && typeof entry.name === "string" && typeof entry.prescription === "string")));
}

/** The planned fields of one day entry, as a block keeps them. */
function entryFrom(record: DayRecord, entry: Exercise): BlockEntry {
  const settings: Partial<ExerciseSettings> = record.settings[entry.id] ?? {};
  return {
    catalogExerciseId: catalogIdOf(entry),
    name: entry.name,
    prescription: record.prescriptions[entry.id] ?? "",
    ...(settings.rpe ? { rpe: settings.rpe } : {}),
    ...(settings.rest ? { rest: settings.rest } : {}),
    ...(settings.notes ? { notes: settings.notes } : {}),
  };
}

/**
 * A new block from the chosen entries of a day, in the day's order. The day is read, never
 * written: saving a block leaves those entries exactly as they were.
 */
export function blockFromDay(record: DayRecord, entryIds: number[], fields: { name: string; description?: string }, meta: { id: string; now: string }): { ok: true; block: PlanBlock } | { ok: false; message: string } {
  const name = fields.name.replace(/\s+/g, " ").trim().slice(0, blockLimits.name);
  if (!name) return { ok: false, message: "Give the block a name, like Forearm finisher." };
  const chosen = record.workout.filter((entry) => entryIds.includes(entry.id));
  if (!chosen.length) return { ok: false, message: "Choose at least one exercise for the block." };
  if (chosen.length > blockLimits.entries) return { ok: false, message: `A block holds up to ${blockLimits.entries} exercises.` };
  const description = (fields.description ?? "").trim().slice(0, blockLimits.description);
  return { ok: true, block: { id: meta.id, schema: BLOCK_SCHEMA_VERSION, name, ...(description ? { description } : {}), entries: chosen.map((entry) => entryFrom(record, entry)), createdAt: meta.now, updatedAt: meta.now } };
}

/** A prescription a block can hold: empty (the plan's default) or one the planner's own reader accepts. */
export function validBlockPrescription(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || storedPrescription(trimmed) !== "";
}

export type BlockEntryPreview =
  | { index: number; entry: BlockEntry; status: "add"; exercise: Exercise }
  | { index: number; entry: BlockEntry; status: "already-in-day"; exercise: Exercise }
  | { index: number; entry: BlockEntry; status: "missing"; candidates: Exercise[] };

/** What inserting the block into this day would do, entry by entry, before anything changes. */
export function previewBlockInsert(record: DayRecord, block: PlanBlock): BlockEntryPreview[] {
  const present = new Set(record.workout.map(catalogIdOf));
  return block.entries.map((entry, index) => {
    const exercise = catalog.find((item) => item.id === entry.catalogExerciseId);
    if (!exercise) return { index, entry, status: "missing", candidates: nameCandidates(entry.name) };
    // The planner keeps one entry of an exercise per day unless the athlete duplicates it, the
    // same rule a pasted or shared workout follows: one already there is not added again.
    return { index, entry, status: present.has(exercise.id) ? "already-in-day" : "add", exercise };
  });
}

export type BlockResolution = Record<number, number | "omit">;

/** Where a block goes: before one of the day's entries (by entry id), or after the last (null). */
export type BlockAnchor = number | null;

/**
 * The anchor read against the day as it is at the moment of inserting, not as it was when the
 * preview opened: an entry moved since is followed, and one removed since puts the block after
 * the last entry, which the caller says.
 */
export function insertionIndex(record: DayRecord, anchor: BlockAnchor): { index: number; anchorGone: boolean } {
  if (anchor === null) return { index: record.workout.length, anchorGone: false };
  const index = record.workout.findIndex((entry) => entry.id === anchor);
  return index < 0 ? { index: record.workout.length, anchorGone: true } : { index, anchorGone: false };
}
export type BlockInsertResult = { record: DayRecord; insertedIds: number[]; alreadyThere: string[]; omitted: string[]; unresolved: string[] };

/**
 * The block's entries written into a day at `position` (0 = first, the day's length = after the
 * last). Each inserted entry gets its own id: the catalog id for the first of an exercise in
 * the day (the planner's identity rule), and a fresh id from `freshId` for a repeat the block
 * itself holds - a block never reuses an id from the day it was saved from. A missing exercise
 * is inserted only as the athlete resolved it, or left out when they chose that; an
 * unresolved one stops the insertion rather than shrinking the block quietly.
 */
export function insertBlockIntoDay(record: DayRecord, block: PlanBlock, position: number, resolutions: BlockResolution, freshId: () => number): BlockInsertResult {
  const preview = previewBlockInsert(record, block);
  const unresolved = preview.filter((item) => item.status === "missing" && resolutions[item.index] === undefined).map((item) => item.entry.name);
  if (unresolved.length) return { record, insertedIds: [], alreadyThere: [], omitted: [], unresolved };
  const present = new Set(record.workout.map(catalogIdOf));
  const placedThisTime = new Set<number>();
  const added: Exercise[] = [];
  const prescriptions = { ...record.prescriptions };
  const settings = { ...record.settings };
  const alreadyThere: string[] = [];
  const omitted: string[] = [];
  for (const item of preview) {
    let exercise: Exercise | undefined;
    if (item.status === "missing") {
      const choice = resolutions[item.index];
      if (choice === "omit") { omitted.push(item.entry.name); continue; }
      exercise = catalog.find((candidate) => candidate.id === choice);
      if (!exercise) { omitted.push(item.entry.name); continue; }
    } else exercise = item.exercise;
    if (present.has(exercise.id)) { alreadyThere.push(exercise.name); continue; }
    const repeat = placedThisTime.has(exercise.id);
    const entry: Exercise = repeat ? ({ ...exercise, id: freshId(), catalogExerciseId: exercise.id } as Exercise) : exercise;
    placedThisTime.add(exercise.id);
    added.push(entry);
    if (item.entry.prescription.trim()) prescriptions[entry.id] = item.entry.prescription.trim();
    if (item.entry.rpe || item.entry.rest || item.entry.notes) {
      const defaults = getExerciseSettings({}, 0);
      settings[entry.id] = { ...defaults, rpe: item.entry.rpe || defaults.rpe, rest: item.entry.rest || defaults.rest, notes: item.entry.notes || "", completed: false };
    }
  }
  const at = Math.max(0, Math.min(position, record.workout.length));
  return {
    record: { ...record, workout: [...record.workout.slice(0, at), ...added, ...record.workout.slice(at)], prescriptions, settings },
    insertedIds: added.map((entry) => entry.id),
    alreadyThere,
    omitted,
    unresolved: [],
  };
}

/**
 * Undo of one insertion: removes the entries it created, with their prescriptions and
 * settings, wherever they now sit, and leaves every other entry and edit as it is.
 */
export function removeInsertedEntries(record: DayRecord, insertedIds: number[]): DayRecord {
  const ids = new Set(insertedIds);
  const prescriptions = { ...record.prescriptions };
  const settings = { ...record.settings };
  ids.forEach((id) => { delete prescriptions[id]; delete settings[id]; });
  return { ...record, workout: record.workout.filter((entry) => !ids.has(entry.id)), prescriptions, settings };
}

/** "Wrist Curl 3 × 12–15 · Reverse Wrist Curl · …" - the first few entries, for the list. */
export function blockPreviewLine(block: PlanBlock, limit = 3): string {
  const shown = block.entries.slice(0, limit).map((entry) => `${entry.name}${entry.prescription ? ` ${entry.prescription}` : ""}`);
  return block.entries.length > limit ? `${shown.join(" · ")} · +${block.entries.length - limit} more` : shown.join(" · ");
}

export function upsertBlock(store: BlockStore, block: PlanBlock): BlockStore {
  return { ...store, blocks: store.blocks.some((item) => item.id === block.id) ? store.blocks.map((item) => (item.id === block.id ? block : item)) : [...store.blocks, block] };
}

export function renameBlock(store: BlockStore, id: string, fields: { name: string; description?: string }, now: string): { ok: true; store: BlockStore } | { ok: false; message: string } {
  const name = fields.name.replace(/\s+/g, " ").trim().slice(0, blockLimits.name);
  if (!name) return { ok: false, message: "A block needs a name." };
  const description = (fields.description ?? "").trim().slice(0, blockLimits.description);
  return { ok: true, store: { ...store, blocks: store.blocks.map((block) => {
    if (block.id !== id) return block;
    const next: PlanBlock = { ...block, name, updatedAt: now };
    if (description) next.description = description; else delete next.description;
    return next;
  }) } };
}

/** The block's planned content edited: entries removed or reordered, prescriptions changed (validated). */
export function editBlockEntries(store: BlockStore, id: string, entries: BlockEntry[], now: string): { ok: true; store: BlockStore } | { ok: false; message: string } {
  if (!entries.length) return { ok: false, message: "A block needs at least one exercise. Archive it instead." };
  const invalid = entries.find((entry) => !validBlockPrescription(entry.prescription));
  if (invalid) return { ok: false, message: `Write ${invalid.name}'s sets and reps like 3 × 8–12, or leave it empty for the plan's default.` };
  return { ok: true, store: { ...store, blocks: store.blocks.map((block) => (block.id === id ? { ...block, entries: entries.map((entry) => ({ ...entry, prescription: entry.prescription.trim() })), updatedAt: now } : block)) } };
}

export function duplicateBlock(store: BlockStore, id: string, newId: string, now: string): BlockStore {
  const source = store.blocks.find((block) => block.id === id);
  if (!source) return store;
  const copy: PlanBlock = { ...source, id: newId, name: `${source.name} (copy)`.slice(0, blockLimits.name), entries: source.entries.map((entry) => ({ ...entry })), createdAt: now, updatedAt: now };
  delete copy.archivedAt;
  return { ...store, blocks: [...store.blocks, copy] };
}

export function setBlockArchived(store: BlockStore, id: string, archived: boolean, now: string): BlockStore {
  return { ...store, blocks: store.blocks.map((block) => {
    if (block.id !== id) return block;
    const next: PlanBlock = { ...block, updatedAt: now };
    if (archived) next.archivedAt = now; else delete next.archivedAt;
    return next;
  }) };
}

export const activeBlocks = (store: BlockStore) => store.blocks.filter((block) => !block.archivedAt).sort((a, b) => a.name.localeCompare(b.name));
export const archivedBlocks = (store: BlockStore) => store.blocks.filter((block) => block.archivedAt).sort((a, b) => a.name.localeCompare(b.name));
