import type { Exercise } from "./exerciseCatalog";
import type { DisplayWeightUnit } from "./weightUnits";
import { loadConventionFor } from "@shared/loadConventions";
import type { LoggingPolicy } from "@shared/specialization/loggingPolicy";
import { loggingFactsOf, smithLoadBasisOf, type ExerciseSetup } from "./exerciseLogging";

/** Reps or the seconds of a hold: what a set's last box records. */
export type SetDoseMeasure = LoggingPolicy["measure"];

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
 * reps. Only the atlas says which exercises those are (its logging policy,
 * shared/specialization/loggingPolicy.ts, or the light hold list,
 * holdCatalogIds.ts), and the caller passes that measure in, so the Seconds box
 * appears exactly there and nowhere else; it is stored as the set's
 * `holdSeconds`, and the set has no reps box at all. This module does not read
 * the atlas itself: it is imported by screens that load with the app (through
 * sessionRecap and workoutSwap), and the atlas's logging table should load only
 * with the screens that use it.
 *
 * The rows with an execution record (the Zercher, neck and bench handoff) name their
 * load box by their own convention (exerciseLogging.ts, read from the light facts):
 * the bar and its plates, the machine's displayed load, the plates on one arm, a
 * Smith machine's plates (with or without a bar weight the athlete knows, as they
 * declared it in the exercise's setup, never adding a bar on their behalf), or the
 * load hanging from a head harness. A manually resisted exercise has no load box at
 * all: its force is not measured, so there is no number to ask for, and a hold of it
 * is complete with its seconds alone.
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

/** The rows of the handoff, by their own load convention; the bar and its plates are the plain Weight box. */
const MACHINE_LOAD: SetEntryField = { measure: "weight", label: "Machine load", unit: "lb", optional: false };
const PLATES_PER_ARM: SetEntryField = { measure: "weight", label: "Plates per arm", unit: "lb", optional: false };
const SMITH_PLATES: SetEntryField = { measure: "weight", label: "Plates only", unit: "lb", optional: false };
const SMITH_TOTAL: SetEntryField = { measure: "weight", label: "Plates + bar", unit: "lb", optional: false };
const HARNESS_LOAD: SetEntryField = { measure: "weight", label: "Harness load", unit: "lb", optional: false };

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
  /** What the set's dose is entered in: the atlas's logging policy for the exercise, passed by the caller. */
  measure: SetDoseMeasure = "reps",
  /** The exercise's setup in this workout: a Smith machine's declared load basis names its box. */
  setup?: ExerciseSetup,
): SetEntryField[] {
  // The box used to say "lb" whatever the profile said, while every screen read the
  // number in the profile's unit: a kg athlete typed next to "lb" and was scored in kg.
  const fields = fieldsFor(exercise, setup).map((field) => field.measure === "weight" ? { ...field, unit: weightUnit } : field);
  return measure === "seconds" ? [...fields, SECONDS] : fields;
}

/** Whether the set's dose is seconds: the entry ends in a Seconds box and has no reps box. */
export function isHoldEntry(fields: readonly SetEntryField[]): boolean {
  return fields.some((field) => field.measure === "seconds");
}

function fieldsFor(exercise: (Pick<Exercise, "name" | "category" | "equipment"> & { id?: number }) | undefined, setup?: ExerciseSetup): SetEntryField[] {
  if (!exercise) return [WEIGHT];
  // A row with an execution record says what its one load number means, and nothing else decides.
  const facts = loggingFactsOf(exercise.id);
  if (facts) {
    switch (facts.load) {
      case "manual_unmeasured": return [];
      case "machine_display": return [MACHINE_LOAD];
      case "plates_per_arm": return [PLATES_PER_ARM];
      case "smith_declared": return [smithLoadBasisOf(setup) === "total_known_bar" ? SMITH_TOTAL : SMITH_PLATES];
      case "suspended_external_mass": return [HARNESS_LOAD];
      case "total_bar_mass": return [WEIGHT];
    }
  }
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
