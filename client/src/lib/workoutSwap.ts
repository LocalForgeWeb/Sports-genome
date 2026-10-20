import type { Exercise } from "./exerciseCatalog";
import { isCompletedSet, isDraftSet, isDropInProgress, settleDropSet, sideFieldOf, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession, type SetSide } from "./deviceWorkoutLog";
import type { Limb } from "@shared/specialization/types";
import { renderableSetCount } from "./setPrescription";
import { setEntryFieldsFor, type SetDoseMeasure } from "./setEntryFields";
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
 *   discard it, or reuse the reps (never the load) on the new exercise's first set. A hold's
 *   typed seconds carry only to another hold, and reps only to an exercise logged in reps.
 * - A drop set under way: its added stages stay with the original as the set they were.
 * - Every set done: nothing is left to hand on, so the choice is to add the new exercise.
 * - Sets laid out per side (`perArm`, for an athlete tracking per-side totals): a planned set of
 *   an exercise done one arm, or one leg, at a time is two rows, Right then Left, each with its
 *   side on that limb (the arm's in `side`, the leg's in `legSide`). A swap counts in planned
 *   sets, so the plan's work stays the same whichever exercise does it (`swapSets`): two one-side
 *   rows left become one set of a two-sided exercise, a two-sided set left becomes a Right and a
 *   Left row of a one-side exercise, and one-side rows passed to another one-side exercise keep
 *   their sides, moved to the new exercise's limb when it is split on the other one.
 *
 * Load never crosses exercises - 40 lb on a sissy squat says nothing about a barbell squat - and
 * the rest timer is not touched. The new exercise's "last logged" comes from its own history,
 * because carry-forward reads by the session exercise's name.
 */

export type SwapTarget = Pick<Exercise, "name"> & { id?: number };

// The readers the first screens need (catalogIdOf, swapNote) live in workoutSwapRecord.ts, so this
// module loads only with the screens that swap.
export { catalogIdOf, swapNote } from "./workoutSwapRecord";
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
  /** Gives each new set its id at creation (the tracker passes one); without it, new sets have none. */
  newSetId?: () => string;
  /**
   * Whether an exercise is logged in reps or in seconds held (the atlas's logging policy, which
   * the tracker passes); reps when not said. A reused draft carries its dose only between two
   * exercises measured the same way: seconds held never become reps, nor reps seconds.
   */
  measureOf?: (target: SwapTarget) => SetDoseMeasure;
  /**
   * Lay the new exercise's sets out per side, two rows per planned set (the tracker passes it for
   * a one-side exercise when the athlete tracks per-side totals, as it builds a planned one). Off
   * by default: every set is one row, as before.
   */
  perArm?: boolean;
  /**
   * The limb an exercise's rows laid out per side are split on (the atlas's logging policy, which
   * the tracker passes): each row's side is stored on that limb. Null, or not said, is the arm,
   * except for the original's rows, which say their own limb where they can (`rowsLimbOf`).
   */
  sideLimbOf?: (target: SwapTarget) => Limb | null;
  /** The new exercise's planned prescription, as its own measure reads it; the original's text when not given. */
  prescription?: string;
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
/** An empty set, with an id when the caller gives sets ids at creation. */
const newSetWith = (newSetId: (() => string) | undefined) => (): DeviceSetLog => (newSetId ? { id: newSetId(), ...emptySet() } : emptySet());

/**
 * Planned sets as rows per side: Right then Left for each, as the tracker lays out a planned
 * one-side exercise for an athlete tracking per-side totals (`perSideRows`,
 * lib/specialization/loggerGates.ts).
 */
export function perArmRowSides(plannedSets: number): SetSide[] {
  return Array.from({ length: Math.max(0, plannedSets) * 2 }, (_, row) => (row % 2 === 0 ? "right" : "left"));
}

/** A row's recorded sides: the arm's, the leg's, or neither. */
export type RowSides = Pick<DeviceSetLog, "side" | "legSide">;

/** A side on a limb, as a row stores it. */
export const rowSidesOn = (side: SetSide, limb: Limb): RowSides => (limb === "leg" ? { legSide: side } : { side });

/** The sides a row already holds, the arm's and the leg's, copied together. */
const sidesOf = (set: DeviceSetLog): RowSides => ({ ...(set.side ? { side: set.side } : {}), ...(set.legSide ? { legSide: set.legSide } : {}) });

/**
 * The limb an exercise's rows laid out per side were built on, read from the rows: each was built
 * with its side on that limb, and a row may also hold the other limb's side, picked on the card,
 * so it is the limb more of the rows hold a side on. Null for rows not laid out per side, or as
 * many on each. The rows answer before the logging policy does: a workout left open across a
 * release can hold rows built per leg on an exercise this release does not know, or sides on
 * another limb than this release asks about, and their sides must stay on the leg.
 */
export function rowsLimbOf(exercise: Pick<DeviceWorkoutExercise, "perArm" | "sets">): Limb | null {
  if (!exercise.perArm) return null;
  const arm = exercise.sets.filter((set) => set.side).length;
  const leg = exercise.sets.filter((set) => set.legSide).length;
  return leg > arm ? "leg" : arm > leg ? "arm" : null;
}

/** The original's sets that stay with it, the ones that move on, and a typed set to reuse. */
function partitionSets(original: DeviceWorkoutExercise, draft: DraftChoice, partialDrop: PartialDropChoice) {
  const kept: DeviceSetLog[] = [];
  const moved: DeviceSetLog[] = [];
  let reusable: DeviceSetLog | null = null;
  for (const set of original.sets) {
    if (isCompletedSet(set)) { kept.push(set); continue; }
    if (isDropInProgress(set)) { if (partialDrop === "keep") kept.push(settleDropSet(set)); else moved.push(set); continue; }
    if (isDraftSet(set)) {
      if (draft === "keep") { kept.push(set); continue; }
      if (draft === "reuse" && !reusable) reusable = set;
    }
    moved.push(set);
  }
  return { kept, moved, reusable };
}

/**
 * The sides of each row the new exercise gets for the rows that move on, counted in planned sets:
 * - one-side rows to a one-side exercise laid out per side: the same rows, each with its side
 *   (the arm's and the leg's copied together; to an exercise split on the other limb, the side
 *   moves to that limb);
 * - one-side rows to anything else: one set for each two rows (an odd one left rounds up);
 * - sets of anything else to a one-side exercise laid out per side: a Right and a Left row each;
 * - otherwise one set for each, as before.
 * A swap always leaves something to do: with no row moving, the new exercise gets one planned set.
 */
function movedRowSides(original: DeviceWorkoutExercise, moved: readonly DeviceSetLog[], toPerArm: boolean, fromLimb: Limb = "arm", toLimb: Limb = "arm"): RowSides[] {
  const fromPerArm = Boolean(original.perArm);
  if (!moved.length) return toPerArm ? perArmRowSides(1).map((side) => rowSidesOn(side, toLimb)) : [{}];
  if (fromPerArm && toPerArm) {
    return moved.map((set) => {
      if (fromLimb === toLimb) return sidesOf(set);
      const side = set[sideFieldOf(fromLimb)];
      return side ? rowSidesOn(side, toLimb) : {};
    });
  }
  if (fromPerArm) return Array.from({ length: Math.ceil(moved.length / 2) }, () => ({}));
  if (toPerArm) return perArmRowSides(moved.length).map((side) => rowSidesOn(side, toLimb));
  return moved.map(() => ({}));
}

/** What a swap gives the new exercise, for the sheet to say before the confirm: the very count `applySwap` makes. */
export type SwapSets = {
  /** Rows of the original that move on: neither logged nor kept with it. */
  moving: number;
  /** Rows the new exercise gets. */
  sets: number;
  /** The planned sets those rows are: half of them when laid out per side. */
  plannedSets: number;
  /** The new exercise's rows are laid out per side. */
  perArm: boolean;
};

export function swapSets(original: DeviceWorkoutExercise, options: { draft?: DraftChoice; partialDrop?: PartialDropChoice; perArm?: boolean } = {}): SwapSets {
  const { moved } = partitionSets(original, options.draft ?? "keep", options.partialDrop ?? "keep");
  const perArm = Boolean(options.perArm);
  const sides = movedRowSides(original, moved, perArm);
  return { moving: moved.length, sets: sides.length, plannedSets: perArm ? Math.ceil(sides.length / 2) : sides.length, perArm };
}

/** What an add gives the new exercise: one row per planned set of the prescription, two when laid out per side. */
export function addSets(prescription: string, perArm = false): { sets: number; plannedSets: number; perArm: boolean } {
  const plannedSets = renderableSetCount(prescription);
  return { sets: perArm ? plannedSets * 2 : plannedSets, plannedSets, perArm };
}

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

  const from: SwapTarget = { name: original.exerciseName, id: original.catalogId };
  const measureOf = options.measureOf ?? (() => "reps" as const);
  const dose = measureOf(from) === measureOf(target) ? measureOf(target) : null;
  const { kept, moved, reusable } = partitionSets(original, options.draft ?? "keep", options.partialDrop ?? "keep");
  const reused: Pick<DeviceSetLog, "reps" | "height" | "holdSeconds"> | null = reusable && {
    // The typed reps, or a hold's typed seconds, only where the new exercise takes the same dose.
    reps: dose === "reps" ? reusable.reps : "",
    ...(dose === "seconds" && reusable.holdSeconds ? { holdSeconds: reusable.holdSeconds } : {}),
    height: bothUseHeight(from, target, catalog) ? reusable.height : "",
  };
  const completedOnOriginal = kept.filter(isCompletedSet).length;
  // Every slot not kept by the original moves on, counted in planned sets (`movedRowSides`).
  const newSet = newSetWith(options.newSetId);
  const sideLimbOf = options.sideLimbOf ?? (() => null);
  const fromLimb = rowsLimbOf(original) ?? sideLimbOf(from) ?? "arm";
  const sets = movedRowSides(original, moved, Boolean(options.perArm), fromLimb, sideLimbOf(target) ?? "arm").map((sides) => ({ ...newSet(), ...sides }));
  if (reused) sets[0] = { ...sets[0], reps: reused.reps, ...(reused.holdSeconds ? { holdSeconds: reused.holdSeconds } : {}), ...(reused.height ? { height: reused.height } : {}) };
  const replacement: DeviceWorkoutExercise = {
    id: options.newExerciseId,
    exerciseName: target.name,
    ...(target.id !== undefined ? { catalogId: target.id } : {}),
    plannedPrescription: options.prescription ?? original.plannedPrescription,
    ...(options.perArm ? { perArm: true } : {}),
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
 * Adds an exercise straight after another - Add exercise, or the "nothing left to swap" case -
 * with that exercise's prescription as its starting point: one row per planned set, or a Right
 * and a Left row per planned set when `perArm` lays a one-side exercise out per side (each row's
 * side on `sideLimb`, the arm when not said), exactly as a planned one is built. An anchor laid
 * out per side passes on its planned sets, not its rows.
 */
export function addAfter(session: DeviceWorkoutSession, exerciseId: string, target: SwapTarget, options: { newExerciseId: string; at: string; newSetId?: () => string; perArm?: boolean; sideLimb?: Limb; prescription?: string }): DeviceWorkoutSession {
  if (session.exercises.some((exercise) => exercise.id === options.newExerciseId)) return session;
  const index = session.exercises.findIndex((exercise) => exercise.id === exerciseId);
  if (index < 0) return session;
  const anchor = session.exercises[index];
  const plannedPrescription = options.prescription ?? anchor.plannedPrescription;
  const newSet = newSetWith(options.newSetId);
  const { plannedSets } = addSets(plannedPrescription);
  const added: DeviceWorkoutExercise = {
    id: options.newExerciseId,
    exerciseName: target.name,
    ...(target.id !== undefined ? { catalogId: target.id } : {}),
    plannedPrescription,
    ...(options.perArm ? { perArm: true } : {}),
    sets: options.perArm ? perArmRowSides(plannedSets).map((side) => ({ ...newSet(), ...rowSidesOn(side, options.sideLimb ?? "arm") })) : Array.from({ length: plannedSets }, newSet),
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
const workOf = (exercise: DeviceWorkoutExercise) => JSON.stringify([exercise.exerciseName, exercise.sets.map((set) => [Boolean(set.completed), Boolean(set.skipped), set.weight || "", set.reps || "", set.height || "", set.holdSeconds || "", set.type ?? "", (set.stages ?? []).map((stage) => [stage.weight, stage.reps])])]);
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
export function swapMeasurementNotes(
  from: Exercise | undefined,
  to: Exercise | undefined,
  prescription: string,
  /** Whether an exercise is logged in reps or in seconds held (the atlas's logging policy); reps when not said. */
  measureOf: (exercise: Exercise | undefined) => SetDoseMeasure = () => "reps",
  /** The prescription the new exercise starts from, as its own measure reads it; the plan's when not said. */
  incomingPrescription: string = prescription,
): string[] {
  const notes: string[] = [];
  const fromName = from?.name ?? "the current exercise";
  const toName = to?.name ?? "the new exercise";
  const fromConvention = loadConventionFor(from?.id);
  const toConvention = loadConventionFor(to?.id);
  if (fromConvention !== toConvention) notes.push(`${fromName} is logged as ${conventionWords[fromConvention]}; ${toName} as ${conventionWords[toConvention]}.`);
  const fromHeight = setEntryFieldsFor(from).some((field) => field.measure === "height");
  const toHeight = setEntryFieldsFor(to).some((field) => field.measure === "height");
  if (fromHeight !== toHeight) notes.push(toHeight ? `${toName} records a box height as well as reps.` : `${toName} has no box height to record.`);
  // A hold is logged in seconds (the atlas's logging policy); everything else in reps.
  const fromSeconds = measureOf(from) === "seconds";
  const toSeconds = measureOf(to) === "seconds";
  if (fromSeconds !== toSeconds) notes.push(toSeconds ? `${toName} is logged in seconds held, not reps.` : `${toName} is logged in reps, not seconds.`);
  // A hold's default meeting a rep exercise: the plan entry's reps are read again, not "30 sec" as reps.
  if (!toSeconds && fromSeconds && incomingPrescription !== prescription) notes.push(`${prescription} is ${fromName}'s default as a hold, so ${toName} starts from the goal's: ${incomingPrescription}.`);
  else if (!toSeconds && /\d\s*(s|sec|secs|seconds|min|mins|minutes)\b/i.test(incomingPrescription)) notes.push(`The plan's target (${incomingPrescription}) is a time; sets here are logged in reps, so set the reps as you go.`);
  // A rep target meeting a hold: the goal's rep default is read as a hold's, and a bare number as seconds.
  if (toSeconds && !fromSeconds && incomingPrescription !== prescription) notes.push(`The plan's ${prescription} is the goal's rep default, so ${toName} starts from a hold's: ${incomingPrescription}.`);
  else if (toSeconds && !fromSeconds && /^\s*\d+\s*(?:×|x)\s*\d[\d\s–—/-]*$/i.test(prescription)) notes.push(`The plan's target (${prescription}) gives no unit; on ${toName} its numbers are seconds.`);
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
