import type { Exercise } from "./exerciseCatalog";

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
 */
export type SetEntryMeasure = "weight" | "height";

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
const ADDED_WEIGHT: SetEntryField = { measure: "weight", label: "Added weight", unit: "lb", optional: true };
const BOX_HEIGHT: SetEntryField = { measure: "height", label: "Box height", unit: "in", optional: true };

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
  exercise: Pick<Exercise, "name" | "category" | "equipment"> | undefined,
): SetEntryField[] {
  if (!exercise) return [WEIGHT];
  const name = exercise.name.trim();
  const carriesAddedLoad = /\bweighted\b/i.test(name);

  const loadField = carriesAddedLoad || loadIsOptional(exercise) ? ADDED_WEIGHT : WEIGHT;

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
