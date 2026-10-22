import type { Exercise } from "@/lib/exerciseCatalog";
import { parseSetCount } from "@/lib/sessionVolume";
import { formatPrescription, maxEditableSets, parsePrescription, withSetCount } from "@/lib/setPrescription";
import { commitDay, loadDay, type DayRecord, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { catalogIdOf } from "@/lib/workoutSwapRecord";
import type { SpecializationPlanBatch, SpecializationPlanBatchChange, SpecializationPlanChange } from "./viewState";

export type PlanChangeOutcome =
  /**
   * `index`: where the incoming exercise stands in the day afterwards (0 = first). `revert`: this
   * change's inverse, for Undo, applied to the day as it stands when Undo is pressed.
   */
  | { ok: true; record: DayRecord; summary: string; index: number; revert: (current: DayRecord) => DayRecord }
  | { ok: false; reason: string };

/** Where an add lands: `insertAt` clamped to the day (0 = first), or the end when it is absent or not a number. */
export function insertionIndex(length: number, insertAt: number | undefined): number {
  if (insertAt === undefined || !Number.isFinite(insertAt)) return length;
  return Math.min(Math.max(Math.trunc(insertAt), 0), length);
}

/**
 * One day's record after an add or a swap asked for from the specialization page.
 *
 * Pure, so the page can preview the planned totals on the record this returns before
 * anything is saved (brief §7, "Preview how the proposed change affects planned totals
 * only"), and Home writes exactly the same record when the athlete confirms.
 *
 * Neither edit writes a prescription the athlete did not set. An entry without one reads as
 * the goal's default for its position, as every plan reader does (planBouts `prescriptionOf`),
 * and Plan's own add and swap leave it that way too:
 * - an add goes where `insertAt` says (clamped; at the end when absent) and carries only the
 *   prescription the change names, if any;
 * - a swap takes the replaced exercise's place and carries over only what that entry had of
 *   its own: its prescription and settings. Without them the incoming exercise has none either,
 *   so its sets stay the default for that position instead of becoming another position's.
 */
export function applyPlanChangeToRecord(record: DayRecord, change: SpecializationPlanChange, incoming: Exercise): PlanChangeOutcome {
  if (record.workout.some((exercise) => catalogIdOf(exercise) === incoming.id)) {
    return { ok: false, reason: `${incoming.name} is already in that day.` };
  }
  // Nothing left over under the incoming id (a record is scoped to its workout, but a stale key would otherwise ride along).
  const { [incoming.id]: _stalePrescription, ...prescriptions } = record.prescriptions;
  const { [incoming.id]: _staleSettings, ...settings } = record.settings;
  if (change.replaceEntryId === undefined) {
    const index = insertionIndex(record.workout.length, change.insertAt);
    return {
      ok: true,
      record: {
        ...record,
        workout: [...record.workout.slice(0, index), incoming, ...record.workout.slice(index)],
        prescriptions: change.prescription ? { ...prescriptions, [incoming.id]: change.prescription } : prescriptions,
        settings,
      },
      summary: `Added ${incoming.name}`,
      index,
      revert: (current) => revertChange(current, incoming, null, record),
    };
  }
  const index = record.workout.findIndex((exercise) => exercise.id === change.replaceEntryId);
  if (index === -1) return { ok: false, reason: "The exercise to swap out is no longer in that day." };
  const outgoing = record.workout[index];
  const { [outgoing.id]: keptPrescription, ...otherPrescriptions } = prescriptions;
  const { [outgoing.id]: keptSettings, ...otherSettings } = settings;
  return {
    ok: true,
    record: {
      ...record,
      workout: record.workout.map((exercise) => (exercise.id === outgoing.id ? incoming : exercise)),
      prescriptions: keptPrescription ? { ...otherPrescriptions, [incoming.id]: keptPrescription } : otherPrescriptions,
      settings: keptSettings ? { ...otherSettings, [incoming.id]: keptSettings } : otherSettings,
    },
    summary: `Swapped ${outgoing.name} for ${incoming.name}`,
    index,
    revert: (current) => revertChange(current, incoming, outgoing, record),
  };
}

/**
 * Takes back one add or swap on the day as it stands now, which may have changed since (Undo
 * can come after other edits). An add comes back out wherever the incoming exercise stands by
 * then, and the rest of the day closes up. A swap puts the outgoing entry back where the
 * incoming one stands, with the prescription and settings it had of its own before. Nothing
 * changes once the incoming exercise has left the day. If the outgoing entry is already back in
 * the day (added again since), the incoming one only comes out, so no entry is ever in a day twice.
 */
function revertChange(current: DayRecord, incoming: Exercise, outgoing: Exercise | null, before: DayRecord): DayRecord {
  if (!current.workout.some((exercise) => exercise.id === incoming.id)) return current;
  const { [incoming.id]: _prescription, ...prescriptions } = current.prescriptions;
  const { [incoming.id]: _settings, ...settings } = current.settings;
  if (!outgoing || current.workout.some((exercise) => exercise.id === outgoing.id)) {
    return { ...current, workout: current.workout.filter((exercise) => exercise.id !== incoming.id), prescriptions, settings };
  }
  return {
    ...current,
    workout: current.workout.map((exercise) => (exercise.id === incoming.id ? outgoing : exercise)),
    prescriptions: before.prescriptions[outgoing.id] ? { ...prescriptions, [outgoing.id]: before.prescriptions[outgoing.id] } : prescriptions,
    settings: before.settings[outgoing.id] ? { ...settings, [outgoing.id]: before.settings[outgoing.id] } : settings,
  };
}

// ---------------------------------------------------------------- batches

/** One touched day of a batch: the day before and after it, and the way back. */
export type PlanBatchDay = {
  slot: DaySlot;
  before: DayRecord;
  record: DayRecord;
  /**
   * This day's changes taken back, newest first, on the day as it stands when Undo is pressed: an
   * add comes out wherever it stands, a removed entry goes back where it was (never into a day that
   * holds it again), a set count goes back only while the entry still has the one this batch wrote,
   * and a moved entry leaves the day it went to and returns to the one it left.
   */
  revert: (current: DayRecord) => DayRecord;
};

/** What a batch did, change by change, in the words its notice uses. `sets` is null where the prescription is not written down. */
export type PlanBatchEffect =
  | { kind: "add"; dayKey: string; name: string; sets: number | null }
  | { kind: "swap"; dayKey: string; name: string; outgoing: string }
  | { kind: "remove"; dayKey: string; name: string; sets: number | null }
  | { kind: "sets"; dayKey: string; name: string; from: number; to: number }
  | { kind: "move"; dayKey: string; toDayKey: string; name: string };

export type PlanBatchOutcome =
  | {
    ok: true;
    /** Every touched day, once, in the order the batch first touched it. */
    days: PlanBatchDay[];
    /** The week after the batch, for a preview of planned totals before anything is saved. */
    store: WeeklyDayStore;
    effects: PlanBatchEffect[];
    /** The notice's words: "Added 11 sets: 11 exercises on Day 01, Day 02, Day 03 of Week 1". */
    message: { title: string; description: string };
  }
  /** Nothing applies: `reason` is the first refused change's, naming its day, and `changeIndex` is that change. */
  | { ok: false; reason: string; changeIndex: number };

type Revert = (current: DayRecord) => DayRecord;
type StepOutcome = { ok: true; record: DayRecord; revert: Revert } | { ok: false; reason: string };

const counted = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** The day's entry with that id, while it is still that catalog exercise. */
function entryIn(record: DayRecord, entryId: number, catalogExerciseId: number): { index: number; entry: Exercise } | null {
  const index = record.workout.findIndex((exercise) => exercise.id === entryId);
  return index === -1 || catalogIdOf(record.workout[index]) !== catalogExerciseId ? null : { index, entry: record.workout[index] };
}

/** The day without one entry and anything kept under its id. */
function withoutEntry(record: DayRecord, entryId: number): DayRecord {
  const { [entryId]: _prescription, ...prescriptions } = record.prescriptions;
  const { [entryId]: _settings, ...settings } = record.settings;
  return { ...record, workout: record.workout.filter((exercise) => exercise.id !== entryId), prescriptions, settings };
}

/**
 * The day with an entry put back at `index` (clamped), with its own prescription and settings,
 * unless the day holds that entry again (added again since: the same id), as the single change's
 * Undo checks. A duplicated entry has an id of its own, so it goes back beside the other entry of
 * its exercise, as it stood before.
 */
function withEntry(record: DayRecord, entry: Exercise, index: number, prescription: string | undefined, settings: DayRecord["settings"][number] | undefined): DayRecord {
  if (record.workout.some((exercise) => exercise.id === entry.id)) return record;
  const cleared = withoutEntry(record, entry.id);
  const at = insertionIndex(cleared.workout.length, index);
  return {
    ...cleared,
    workout: [...cleared.workout.slice(0, at), entry, ...cleared.workout.slice(at)],
    prescriptions: prescription === undefined ? cleared.prescriptions : { ...cleared.prescriptions, [entry.id]: prescription },
    settings: settings === undefined ? cleared.settings : { ...cleared.settings, [entry.id]: settings },
  };
}

/** Takes an entry out; `asWritten` holds it to the prescription of its own it was written with (none when absent). */
function removeStep(record: DayRecord, entryId: number, catalogExerciseId: number, name: string, asWritten: { prescription: string | undefined } | null): StepOutcome {
  const found = entryIn(record, entryId, catalogExerciseId);
  if (!found) return { ok: false, reason: `${name} is no longer in that day.` };
  const prescription = record.prescriptions[entryId];
  if (asWritten && prescription !== asWritten.prescription) return { ok: false, reason: `${name} has changed in that day since, so it is yours now.` };
  const settings = record.settings[entryId];
  return { ok: true, record: withoutEntry(record, entryId), revert: (current) => withEntry(current, found.entry, found.index, prescription, settings) };
}

/** An entry's set count, written into its own prescription (or the one the page reads it as). */
function setsStep(record: DayRecord, change: Extract<SpecializationPlanBatchChange, { kind: "sets" }>, name: string): (StepOutcome & { ok: false }) | (StepOutcome & { ok: true; from: number }) {
  const found = entryIn(record, change.entryId, change.catalogExerciseId);
  if (!found) return { ok: false, reason: `${name} is no longer in that day.` };
  if (!Number.isInteger(change.sets) || change.sets < 1) return { ok: false, reason: `1 set is the fewest for ${name}; take it out instead.` };
  if (change.sets > maxEditableSets) return { ok: false, reason: `${maxEditableSets} sets is the most one exercise can be planned with.` };
  const own: string | undefined = record.prescriptions[change.entryId];
  const base = own ?? change.prescription;
  const from = parseSetCount(base);
  if (from === change.sets) return { ok: false, reason: `${name} already has ${counted(from, "set")} in that day.` };
  const parsed = parsePrescription(base);
  const written = formatPrescription(withSetCount(parsed, change.sets).sets, parsed.varied);
  return {
    ok: true,
    from,
    record: { ...record, prescriptions: { ...record.prescriptions, [change.entryId]: written } },
    revert: (current) => {
      if (!current.workout.some((exercise) => exercise.id === change.entryId) || current.prescriptions[change.entryId] !== written) return current;
      const { [change.entryId]: _written, ...prescriptions } = current.prescriptions;
      return { ...current, prescriptions: own === undefined ? prescriptions : { ...prescriptions, [change.entryId]: own } };
    },
  };
}

/**
 * A batch of changes to one plan week, from the specialization page (the stack design note,
 * docs/specialization-atlas/11, §3.7): the stack's Add, Change the total and Take it out, and the
 * tendon section's −1 set, Move and Take out. Pure, so the page previews the planned totals on `store` before anything is saved, and
 * Home writes exactly the same records.
 *
 * The changes apply in order, each on its day as the changes before it left it, so a day can be
 * touched more than once (take an entry out, then add it back with another prescription). Adds and
 * swaps are `applyPlanChangeToRecord`'s, so a batch never adds an exercise a day already holds and
 * writes no prescription a change does not carry. Either every change applies and every touched day
 * comes back once with its record and its revert, or the whole batch is refused with the first
 * reason, naming its day, and nothing is written. The week given is never edited.
 */
export function applyPlanBatch(store: WeeklyDayStore, batch: SpecializationPlanBatch, context: { slots: readonly DaySlot[]; catalog: readonly Exercise[] }): PlanBatchOutcome {
  if (!batch.changes.length) return { ok: false, reason: "There was nothing to change. Nothing was changed.", changeIndex: -1 };
  type Day = { slot: DaySlot; before: DayRecord; record: DayRecord; reverts: Revert[] };
  const days = new Map<string, Day>();
  const dayFor = (dayKey: string): Day | null => {
    const known = days.get(dayKey);
    if (known) return known;
    const slot = context.slots.find((item) => item.key === dayKey);
    if (!slot) return null;
    const before = loadDay(store, dayKey);
    const day: Day = { slot, before, record: before, reverts: [] };
    days.set(dayKey, day);
    return day;
  };
  const exerciseOf = (catalogExerciseId: number) => context.catalog.find((exercise) => exercise.id === catalogExerciseId) ?? null;
  const effects: PlanBatchEffect[] = [];

  for (let changeIndex = 0; changeIndex < batch.changes.length; changeIndex += 1) {
    const change = batch.changes[changeIndex];
    const refuse = (reason: string, slot?: DaySlot): PlanBatchOutcome => ({ ok: false, reason: `${slot ? `${slot.label}: ` : ""}${reason} Nothing was changed.`, changeIndex });
    const day = dayFor(change.dayKey);
    if (!day) return refuse("That day is no longer in your week. Choose another day.");
    const name = exerciseOf(change.catalogExerciseId)?.name ?? "That exercise";

    if (change.kind === "add") {
      const incoming = exerciseOf(change.catalogExerciseId);
      if (!incoming) return refuse("That exercise is not in the catalog any more.", day.slot);
      const { kind: _kind, ...single } = change;
      const outcome = applyPlanChangeToRecord(day.record, { ...single, week: batch.week, slotIndex: day.slot.index }, incoming);
      if (!outcome.ok) return refuse(outcome.reason, day.slot);
      const outgoing = change.replaceEntryId === undefined ? null : day.record.workout.find((exercise) => exercise.id === change.replaceEntryId) ?? null;
      day.record = outcome.record;
      day.reverts.push(outcome.revert);
      effects.push(outgoing
        ? { kind: "swap", dayKey: change.dayKey, name, outgoing: outgoing.name }
        : { kind: "add", dayKey: change.dayKey, name, sets: change.prescription ? parseSetCount(change.prescription) : null });
      continue;
    }

    if (change.kind === "remove") {
      const own: string | undefined = day.record.prescriptions[change.entryId];
      const outcome = removeStep(day.record, change.entryId, change.catalogExerciseId, name, { prescription: change.prescription });
      if (!outcome.ok) return refuse(outcome.reason, day.slot);
      day.record = outcome.record;
      day.reverts.push(outcome.revert);
      effects.push({ kind: "remove", dayKey: change.dayKey, name, sets: own === undefined ? null : parseSetCount(own) });
      continue;
    }

    if (change.kind === "sets") {
      const outcome = setsStep(day.record, change, name);
      if (!outcome.ok) return refuse(outcome.reason, day.slot);
      day.record = outcome.record;
      day.reverts.push(outcome.revert);
      effects.push({ kind: "sets", dayKey: change.dayKey, name, from: outcome.from, to: change.sets });
      continue;
    }

    // A move: out of its day, as a remove, and into the other, as an add.
    if (change.toDayKey === change.dayKey) return refuse(`${name} is in that day already.`, day.slot);
    const found = entryIn(day.record, change.entryId, change.catalogExerciseId);
    if (!found) return refuse(`${name} is no longer in that day.`, day.slot);
    const target = dayFor(change.toDayKey);
    if (!target) return refuse("The day to move it to is no longer in your week. Choose another day.");
    if (target.record.workout.some((exercise) => exercise.id === found.entry.id || catalogIdOf(exercise) === change.catalogExerciseId)) {
      return refuse(`${name} is already in that day.`, target.slot);
    }
    const prescription: string | undefined = day.record.prescriptions[change.entryId] ?? change.prescription;
    const settings = day.record.settings[change.entryId];
    const leaving = removeStep(day.record, change.entryId, change.catalogExerciseId, name, null);
    if (!leaving.ok) return refuse(leaving.reason, day.slot);
    day.record = leaving.record;
    day.reverts.push(leaving.revert);
    target.record = withEntry(target.record, found.entry, insertionIndex(target.record.workout.length, change.insertAt), prescription, settings);
    target.reverts.push((current) => (current.workout.some((exercise) => exercise.id === found.entry.id) ? withoutEntry(current, found.entry.id) : current));
    effects.push({ kind: "move", dayKey: change.dayKey, toDayKey: change.toDayKey, name });
  }

  const touched: PlanBatchDay[] = Array.from(days.values(), ({ slot, before, record, reverts }) => ({
    slot,
    before,
    record,
    revert: (current: DayRecord) => reverts.reduceRight((day, revert) => revert(day), current),
  }));
  return {
    ok: true,
    days: touched,
    store: touched.reduce((week, day) => commitDay(week, day.slot.key, day.record), store),
    effects,
    message: describePlanBatch(effects, batch.week, context.slots),
  };
}

/**
 * The batch's notice, in the plan's own day names (the stack design note, §3.7): adds alone
 * read "Added 11 sets: 11 exercises on Day 01, Day 02, Day 03 of Week 1" and "Your own exercises are
 * unchanged."; one entry taken out reads "Reverse curl taken out of Day 02 of Week 3". Sets are
 * counted only where every prescription involved is written down; otherwise the exercises are.
 */
export function describePlanBatch(effects: readonly PlanBatchEffect[], week: number, slots: readonly DaySlot[]): { title: string; description: string } {
  const position = new Map(slots.map((slot) => [slot.key, slot.index] as const));
  const ordinal = (dayKey: string) => slots.find((slot) => slot.key === dayKey)?.ordinal ?? dayKey;
  const daysOf = (list: readonly PlanBatchEffect[]) => Array.from(new Set(list.flatMap((effect) => (effect.kind === "move" ? [effect.dayKey, effect.toDayKey] : [effect.dayKey]))))
    .sort((left, right) => (position.get(left) ?? 0) - (position.get(right) ?? 0))
    .map(ordinal)
    .join(", ");
  const of = (kind: PlanBatchEffect["kind"]) => effects.filter((effect) => effect.kind === kind);
  const setsIn = (list: readonly PlanBatchEffect[]) => {
    const each = list.map((effect) => (effect.kind === "add" || effect.kind === "remove" ? effect.sets : null));
    return each.every((sets): sets is number => sets !== null) ? each.reduce((total, sets) => total + sets, 0) : null;
  };
  const amount = (list: readonly PlanBatchEffect[]) => {
    const sets = setsIn(list);
    return sets === null ? counted(list.length, "exercise") : counted(sets, "set");
  };
  const inWeek = `of Week ${week}`;
  const others = "Your other exercises are unchanged.";
  const first = effects[0];
  const only = effects.every((effect) => effect.kind === first?.kind) ? first?.kind : null;

  if (only === "add") {
    const sets = setsIn(effects);
    const added = counted(effects.length, "exercise");
    return { title: sets === null ? `Added ${added} on ${daysOf(effects)} ${inWeek}` : `Added ${counted(sets, "set")}: ${added} on ${daysOf(effects)} ${inWeek}`, description: "Your own exercises are unchanged." };
  }
  if (only === "remove") {
    if (effects.length === 1) return { title: `${first.name} taken out of ${daysOf(effects)} ${inWeek}`, description: others };
    const sets = setsIn(effects);
    const out = counted(effects.length, "exercise");
    return { title: sets === null ? `Took out ${out} from ${daysOf(effects)} ${inWeek}` : `Took out ${counted(sets, "set")}: ${out} from ${daysOf(effects)} ${inWeek}`, description: others };
  }
  if (only === "sets" && first.kind === "sets") {
    if (effects.length === 1) return { title: `${first.name} on ${daysOf(effects)} ${inWeek}: ${first.from} → ${counted(first.to, "set")}`, description: others };
    return { title: `Changed the sets of ${counted(effects.length, "exercise")} on ${daysOf(effects)} ${inWeek}`, description: others };
  }
  if (only === "move" && first.kind === "move") {
    if (effects.length === 1) return { title: `${first.name} moved from ${ordinal(first.dayKey)} to ${ordinal(first.toDayKey)} ${inWeek}`, description: others };
    return { title: `Moved ${counted(effects.length, "exercise")} in Week ${week}`, description: others };
  }
  if (only === "swap" && first.kind === "swap") {
    const title = effects.length === 1 ? `Swapped ${first.outgoing} for ${first.name} on ${daysOf(effects)} ${inWeek}` : `Swapped ${counted(effects.length, "exercise")} on ${daysOf(effects)} ${inWeek}`;
    return { title, description: "Sets you already logged keep the exercise they were logged as." };
  }
  const parts = [
    of("add").length ? `added ${amount(of("add"))}` : "",
    of("swap").length ? `swapped ${counted(of("swap").length, "exercise")}` : "",
    of("remove").length ? `took out ${amount(of("remove"))}` : "",
    of("sets").length ? `changed the sets of ${counted(of("sets").length, "exercise")}` : "",
    of("move").length ? `moved ${counted(of("move").length, "exercise")}` : "",
  ].filter(Boolean);
  return { title: `Changed Week ${week} on ${daysOf(effects)}: ${parts.join(", ")}`, description: others };
}
