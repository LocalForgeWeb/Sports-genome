import type { Exercise } from "./exerciseCatalog";
import type { DisplayWeightUnit } from "./weightUnits";
import { loadConventionFor } from "@shared/loadConventions";
import { loggingPolicyFor, type LoggingPolicy } from "@shared/specialization/loggingPolicy";

/**
 * Which boxes a set actually needs, and what each one measures.
 *
 * A box jump has no weight — it has a box height — and asking an athlete for
 * the weight of a bodyweight jump is asking for a number that does not exist.
 * A *weighted* box jump has both: the vest or dumbbells, and the box. The
 * "Exercise signature presentation contract" wants descriptors "chosen for the
 * current task"; on the execution surface the task is recording the set, so
 * each field has to name the thing it records.
 *
 * Classification reads only fields the catalog really carries, and anything not
 * clearly in one of the narrow cases keeps the plain weight box — no exercise
 * gets a unit invented for it.
 *
 * A hold (a dead hang, a farmer hold, a plate pinch) is measured in seconds, not
 * reps. Only the atlas's reviewed variant data says which exercises those are
 * (shared/specialization/loggingPolicy.ts), so the Seconds box appears exactly
 * there and nowhere else; it is stored as the set's `holdSeconds`, and the set
 * has no reps box at all.
 */
export type SetEntryMeasure = "weight" | "height" | "seconds";

export type SetEntryField = {
  measure: SetEntryMeasure;
  /** The visible field label. */
  label: string;
  /** The unit shown inside the box. */
  unit: string;
  /** Whether leaving it empty is the normal case rather than an omission. */
  optional: boolean;
};

const WEIGHT: SetEntryField = { measure: "weight", label: "Weight", unit: "lb", optional: false };
/** One dumbbell's weight: the database scores dumbbell work per implement (EN-07). */
const PER_DUMBBELL: SetEntryField = { measure: "weight", label: "Weight per dumbbell", unit: "lb", optional: false };
const PER_HAND: SetEntryField = { measure: "weight", label: "Weight per hand", unit: "lb", optional: false };
const ADDED_WEIGHT: SetEntryField = { measure: "weight", label: "Added weight", unit: "lb", optional: true };
const BOX_HEIGHT: SetEntryField = { measure: "height", label: "Box height", unit: "in", optional: true };
/** How long the hold lasted. It takes the reps box's place: a hold is never also counted in reps. */
const SECONDS: SetEntryField = { measure: "seconds", label: "Seconds", unit: "sec", optional: false };

/** Jumps onto or off a box: the box's height is the progression variable. */
const BOX_EXERCISES = /\b(box jump|depth jump|step-up)\b/i;

/**
 * Exercises whose load is optional rather than intrinsic — bodyweight work and
 * unloaded plyometrics. An empty box on these means "just me", not "unfinished".
 */
function loadIsOptional(exercise: Pick<Exercise, "category" | "equipment">): boolean {
  return exercise.equipment === "Bodyweight"
    || exercise.equipment === "Plyometric box"
    || exercise.category === "Plyometric";
}

export function setEntryFieldsFor(
  exercise: (Pick<Exercise, "name" | "category" | "equipment"> & { id?: number }) | undefined,
  /** The unit the weight box records in: the session's, which is the profile's when it started. */
  weightUnit: DisplayWeightUnit = "lb",
  /** What the set's dose is entered in. By default the atlas's logging policy for the exercise decides. */
  measure: LoggingPolicy["measure"] = loggingPolicyFor(exercise?.id).measure,
): SetEntryField[] {
  // The box used to say "lb" whatever the profile said, while every screen read the
  // number in the profile's unit: a kg athlete typed next to "lb" and was scored in kg.
  const fields = fieldsFor(exercise).map((field) => field.measure === "weight" ? { ...field, unit: weightUnit } : field);
  return measure === "seconds" ? [...fields, SECONDS] : fields;
}

/** Whether the set's dose is seconds: the entry ends in a Seconds box and has no reps box. */
export function isHoldEntry(fields: readonly SetEntryField[]): boolean {
  return fields.some((field) => field.measure === "seconds");
}

function fieldsFor(exercise: (Pick<Exercise, "name" | "category" | "equipment"> & { id?: number }) | undefined): SetEntryField[] {
  if (!exercise) return [WEIGHT];
  const name = exercise.name.trim();
  const carriesAddedLoad = /\bweighted\b/i.test(name);
  // The scoring policy's convention decides first, where it names one: a chin-up is scored
  // on reps even though the catalog files it under free weights.
  const convention = loadConventionFor(exercise.id);

  const loadField = convention === "per_implement" ? PER_DUMBBELL
    : convention === "per_hand" ? PER_HAND
      : carriesAddedLoad || convention === "bodyweight_reps" || loadIsOptional(exercise) ? ADDED_WEIGHT : WEIGHT;

  if (BOX_EXERCISES.test(name)) {
    // An unloaded box jump records the box alone — that is the whole point of
    // the report. A weighted jump, or a step-up done holding dumbbells or on a
    // cable, records the load as well: dropping its weight box would lose the
    // number that actually drives the exercise.
    if (loadIsOptional(exercise) && !carriesAddedLoad) return [BOX_HEIGHT];
    return [loadField, BOX_HEIGHT];
  }
  return [loadField];
}

/** Whether this exercise records a box height at all. */
export function usesHeight(exercise: Parameters<typeof setEntryFieldsFor>[0]): boolean {
  return setEntryFieldsFor(exercise).some((field) => field.measure === "height");
}
