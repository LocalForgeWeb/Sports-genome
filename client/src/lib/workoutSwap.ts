import type { Exercise } from "./exerciseCatalog";
import { isCompletedSet, isDraftSet, isDropInProgress, settleDropSet, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { renderableSetCount } from "./setPrescription";
import { setEntryFieldsFor } from "./setEntryFields";
import { loadConventionFor, type LoadConvention } from "@shared/loadConventions";

/**
 * Swapping an exercise during a workout (Oct 6 brief §3): Sissy Squat out, Barbell Squat in,
 * and carry on tracking - without touching anything already done.
 *
 * What a swap does depends on where the exercise stands:
 * - Nothing logged: the new exercise takes its place, with the same sets to do.
 * - Some sets logged: those sets stay with the exercise they were done on, under its name; the
 *   remaining sets go to the new exercise, placed straight after it. The total is unchanged.
 * - Typed but not logged: the athlete chooses - keep it with the original (still unlogged),
 *   discard it, or reuse the reps (never the load) on the new exercise's first set.
 * - A drop set under way: its added stages stay with the original as the set they were.
 * - Every set done: nothing is left to hand on, so the choice is to add the new exercise.
 *
 * Load never crosses exercises - 40 lb on a sissy squat says nothing about a barbell squat - and
 * the rest timer is not touched. The new exercise's "last logged" comes from its own history,
 * because carry-forward reads by the session exercise's name.
 */

export type SwapTarget = Pick<Exercise, "name"> & { id?: number };

/** A plan entry's catalog exercise: a duplicated entry has an id of its own and names its catalog exercise separately. */
export const catalogIdOf = (exercise: Exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id;
export type DraftChoice = "keep" | "discard" | "reuse";
export type PartialDropChoice = "keep" | "discard";

export type SwapAssessment = {
  kind: "replace" | "split" | "nothing_left";
  /** Sets of the original already logged. */
  completedSets: number;
  /** Sets not yet logged: what the new exercise takes on by default. */
  openSets: number;
  /** Sets typed into but not logged (not counting a drop set under way). */
  draftSets: number;
  /** A drop set with stages added but not finished, and how many stages. */
  partialDrop: { setIndex: number; stages: number } | null;
};

export function assessSwap(exercise: DeviceWorkoutExercise): SwapAssessment {
  const completedSets = exercise.sets.filter(isCompletedSet).length;
  const partialIndex = exercise.sets.findIndex(isDropInProgress);
  const draftSets = exercise.sets.filter((set) => isDraftSet(set) && !isDropInProgress(set)).length;
  const openSets = exercise.sets.length - completedSets;
  return {
    kind: openSets === 0 ? "nothing_left" : completedSets === 0 && partialIndex < 0 ? "replace" : "split",
    completedSets,
    openSets,
    draftSets,
    partialDrop: partialIndex < 0 ? null : { setIndex: partialIndex, stages: exercise.sets[partialIndex].stages?.length ?? 0 },
  };
}

export type SwapOptions = {
  swapId: string;
  /** The new session exercise's id. */
  newExerciseId: string;
  at: string;
  draft?: DraftChoice;
  partialDrop?: PartialDropChoice;
};

/** Everything needed to take a swap back while no new work has been logged on it. */
export type SwapReceipt = {
  swapId: string;
  /** The original exercise exactly as it was before the swap. */
  before: DeviceWorkoutExercise;
  /** The new exercise as the swap wrote it. */
  replacement: DeviceWorkoutExercise;
  /** The original as the swap left it, when it kept work of its own. */
  original: DeviceWorkoutExercise | null;
};

const emptySet = (): DeviceSetLog => ({ weight: "", reps: "", completed: false });

/** True when both exercises record a box height, so a typed height means the same on each. */
function bothUseHeight(from: SwapTarget | undefined, to: SwapTarget | undefined, catalog: readonly Exercise[]) {
  const entry = (target: SwapTarget | undefined) => catalog.find((item) => (target?.id !== undefined ? item.id === target.id : item.name === target?.name));
  const has = (target: SwapTarget | undefined) => setEntryFieldsFor(entry(target)).some((field) => field.measure === "height");
  return has(from) && has(to);
}

/**
 * The session with the swap applied, and the receipt to undo it - or the session unchanged and
 * no receipt when this swap was already applied (a second tap, a retried write) or the exercise
 * is not there or was already swapped out.
 */
export function applySwap(session: DeviceWorkoutSession, exerciseId: string, target: SwapTarget, options: SwapOptions, catalog: readonly Exercise[] = []): { session: DeviceWorkoutSession; receipt: SwapReceipt | null } {
  if (session.exercises.some((exercise) => exercise.swappedFrom?.swapId === options.swapId)) return { session, receipt: null };
  const index = session.exercises.findIndex((exercise) => exercise.id === exerciseId);
  if (index < 0) return { session, receipt: null };
  const original = session.exercises[index];
  if (original.replacedBy) return { session, receipt: null };

  const kept: DeviceSetLog[] = [];
  let reused: Pick<DeviceSetLog, "reps" | "height"> | null = null;
  for (const set of original.sets) {
    if (isCompletedSet(set)) { kept.push(set); continue; }
    if (isDropInProgress(set)) { if ((options.partialDrop ?? "keep") === "keep") kept.push(settleDropSet(set)); continue; }
    if (isDraftSet(set)) {
      const choice = options.draft ?? "keep";
      if (choice === "keep") kept.push(set);
      else if (choice === "reuse" && !reused) reused = { reps: set.reps, height: bothUseHeight({ name: original.exerciseName, id: original.catalogId }, target, catalog) ? set.height : "" };
    }
  }
  const completedOnOriginal = kept.filter(isCompletedSet).length;
  // Every slot not kept by the original moves on; a swap always leaves something to do.
  const moved = Math.max(1, original.sets.length - kept.length);
  const sets = Array.from({ length: moved }, emptySet);
  if (reused) sets[0] = { ...sets[0], reps: reused.reps, ...(reused.height ? { height: reused.height } : {}) };
  const replacement: DeviceWorkoutExercise = {
    id: options.newExerciseId,
    exerciseName: target.name,
    ...(target.id !== undefined ? { catalogId: target.id } : {}),
    plannedPrescription: original.plannedPrescription,
    sets,
    swappedFrom: { swapId: options.swapId, exerciseName: original.exerciseName, ...(original.catalogId !== undefined ? { catalogId: original.catalogId } : {}), afterSets: completedOnOriginal, at: options.at },
  };
  const exercises = [...session.exercises];
  let keptOriginal: DeviceWorkoutExercise | null = null;
  if (kept.length === 0) {
    exercises.splice(index, 1, replacement);
  } else {
    keptOriginal = { ...original, sets: kept, replacedBy: { swapId: options.swapId, exerciseName: target.name, ...(target.id !== undefined ? { catalogId: target.id } : {}), afterSets: completedOnOriginal, at: options.at } };
    exercises.splice(index, 1, keptOriginal, replacement);
  }
  return { session: { ...session, exercises }, receipt: { swapId: options.swapId, before: original, replacement, original: keptOriginal } };
}

/**
 * Adds an exercise straight after one whose planned sets are all done - the "nothing left to
 * swap" case - with that exercise's prescription as its starting point.
 */
export function addAfter(session: DeviceWorkoutSession, exerciseId: string, target: SwapTarget, options: { newExerciseId: string; at: string }): DeviceWorkoutSession {
  if (session.exercises.some((exercise) => exercise.id === options.newExerciseId)) return session;
  const index = session.exercises.findIndex((exercise) => exercise.id === exerciseId);
  if (index < 0) return session;
  const anchor = session.exercises[index];
  const added: DeviceWorkoutExercise = {
    id: options.newExerciseId,
    exerciseName: target.name,
    ...(target.id !== undefined ? { catalogId: target.id } : {}),
    plannedPrescription: anchor.plannedPrescription,
    sets: Array.from({ length: renderableSetCount(anchor.plannedPrescription) }, emptySet),
    addedDuringWorkout: { at: options.at, afterExerciseName: anchor.exerciseName },
  };
  const exercises = [...session.exercises];
  exercises.splice(index + 1, 0, added);
  return { ...session, exercises };
}

/**
 * What an exercise holds, as work: storage fills in defaults (an empty height, skipped: false),
 * so the comparison is of what was typed, logged or skipped - never of how the record is laid out.
 */
const workOf = (exercise: DeviceWorkoutExercise) => JSON.stringify([exercise.exerciseName, exercise.sets.map((set) => [Boolean(set.completed), Boolean(set.skipped), set.weight || "", set.reps || "", set.height || "", set.type ?? "", (set.stages ?? []).map((stage) => [stage.weight, stage.reps])])]);
const same = (a: DeviceWorkoutExercise, b: DeviceWorkoutExercise) => workOf(a) === workOf(b);

/** A swap can be taken back until anything is logged or typed on either side of it. */
export function canUndoSwap(session: DeviceWorkoutSession, receipt: SwapReceipt): boolean {
  const replacement = session.exercises.find((exercise) => exercise.id === receipt.replacement.id);
  if (!replacement || !same(replacement, receipt.replacement)) return false;
  if (!receipt.original) return true;
  const original = session.exercises.find((exercise) => exercise.id === receipt.original!.id);
  return Boolean(original && same(original, receipt.original));
}

/** The session as it was before the swap; unchanged when the swap can no longer be undone. */
export function undoSwap(session: DeviceWorkoutSession, receipt: SwapReceipt): DeviceWorkoutSession {
  if (!canUndoSwap(session, receipt)) return session;
  const exercises = session.exercises
    .filter((exercise) => exercise.id !== receipt.replacement.id)
    .map((exercise) => (exercise.id === receipt.before.id ? receipt.before : exercise));
  // Replaced in place: the original's slot is the replacement's.
  if (!receipt.original) {
    const at = session.exercises.findIndex((exercise) => exercise.id === receipt.replacement.id);
    exercises.splice(at, 0, receipt.before);
  }
  return { ...session, exercises };
}

/** "Switched from Sissy Squat after 2 sets" / "Switched to Barbell Squat after 2 sets". */
export function swapNote(exercise: DeviceWorkoutExercise): string | null {
  const count = (record: { afterSets: number }) => (record.afterSets === 0 ? "before any sets" : `after ${record.afterSets} ${record.afterSets === 1 ? "set" : "sets"}`);
  if (exercise.swappedFrom) return `Switched from ${exercise.swappedFrom.exerciseName} ${count(exercise.swappedFrom)}`;
  if (exercise.replacedBy) return `Switched to ${exercise.replacedBy.exerciseName} ${count(exercise.replacedBy)}`;
  if (exercise.addedDuringWorkout) return `Added after ${exercise.addedDuringWorkout.afterExerciseName}`;
  return null;
}

const conventionWords: Record<LoadConvention, string> = {
  total_external_load: "the whole load (bar and plates, or the bell)",
  per_implement: "the weight of one dumbbell",
  machine_displayed_load: "the number on the stack or dial",
  bodyweight_reps: "reps, with any weight added to the body",
  per_hand: "the weight in each hand",
};

/**
 * What the athlete should know before confirming: how each exercise is logged when that differs,
 * that no load comes across, and where the plan's target does not fit the new exercise.
 */
export function swapMeasurementNotes(from: Exercise | undefined, to: Exercise | undefined, prescription: string): string[] {
  const notes: string[] = [];
  const fromName = from?.name ?? "the current exercise";
  const toName = to?.name ?? "the new exercise";
  const fromConvention = loadConventionFor(from?.id);
  const toConvention = loadConventionFor(to?.id);
  if (fromConvention !== toConvention) notes.push(`${fromName} is logged as ${conventionWords[fromConvention]}; ${toName} as ${conventionWords[toConvention]}.`);
  const fromHeight = setEntryFieldsFor(from).some((field) => field.measure === "height");
  const toHeight = setEntryFieldsFor(to).some((field) => field.measure === "height");
  if (fromHeight !== toHeight) notes.push(toHeight ? `${toName} records a box height as well as reps.` : `${toName} has no box height to record.`);
  if (/\d\s*(s|sec|secs|seconds|min|mins|minutes)\b/i.test(prescription)) notes.push(`The plan's target (${prescription}) is a time; sets here are logged in reps, so set the reps as you go.`);
  return notes;
}

/**
 * Exercises worth offering first: the same movement pattern, then the most shared primary
 * muscles, then the same equipment. Never the exercise being replaced or one already in the
 * workout.
 */
export function swapSuggestions(from: Exercise | undefined, catalog: readonly Exercise[], excludeNames: ReadonlySet<string>, limit = 6): Exercise[] {
  if (!from) return [];
  const primary = new Set(from.primaryMuscles);
  return catalog
    .filter((item) => item.id !== from.id && !excludeNames.has(item.name))
    .map((item) => ({ item, movement: item.movement === from.movement ? 1 : 0, shared: item.primaryMuscles.filter((muscle) => primary.has(muscle)).length, equipment: item.equipment === from.equipment ? 1 : 0 }))
    .filter((entry) => entry.movement || entry.shared > 0)
    .sort((a, b) => b.movement - a.movement || b.shared - a.shared || b.equipment - a.equipment || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map((entry) => entry.item);
}
