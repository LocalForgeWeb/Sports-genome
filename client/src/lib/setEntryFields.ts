import type { Exercise } from "./exerciseCatalog";
import type { DisplayWeightUnit } from "./weightUnits";
import { loadConventionFor } from "@shared/loadConventions";
import { doseMeasureFor, measurementFor, type DoseMeasure } from "@shared/exerciseMeasurement";

/** Reps, the seconds of a hold, or the distance of a carry: what a set's last box records. */
export type SetDoseMeasure = DoseMeasure;

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
 * A hold (a dead hang, a farmer hold, a plate pinch, a neck hold) is measured in
 * seconds, not reps, and a carry or sled in distance. The atlas's variant data
 * says which of its exercises are holds (shared/specialization/loggingPolicy.ts)
 * and the caller passes that measure in; the 50-exercise expansion's reviewed
 * modes say the rest (shared/exerciseMeasurement.ts, `doseMeasureFor`). The
 * Seconds or Distance box is the set's last box, where Reps would be: seconds are
 * stored as the set's `holdSeconds`, distance as `distance`, and neither set has
 * a reps box. This module does not read the atlas itself: it is imported by
 * screens that load with the app (through sessionRecap and workoutSwap), and the
 * atlas's region data should load only with the screens that use it.
 *
 * The expansion also brings boxes that are not a load: an assisted machine's
 * assistance, and a setting (a band colour, a hub) that is a label, never kilograms.
 */
export type SetEntryMeasure = "weight" | "height" | "setting" | "seconds" | "distance";

export type SetEntryField = {
  measure: SetEntryMeasure;
  /** The visible field label. */
  label: string;
  /** The unit shown inside the box. */
  unit: string;
  /** Whether leaving it empty is the normal case rather than an omission. */
  optional: boolean;
  /** What to type, where the label alone does not say ("colour or rating"). */
  placeholder?: string;
};

/**
 * The box that says how much was done, on its own: reps for most exercises, seconds for a hold,
 * distance for a carry or sled (50-exercise brief §8). The same answer as the last box of
 * `setEntryFieldsFor`, for readers that want only the count.
 */
export type SetCountMeasure = "reps" | "seconds" | "distance";
export type SetCountField = { measure: SetCountMeasure; label: string; unit: string; inputMode: "numeric" | "decimal" };

const REPS: SetCountField = { measure: "reps", label: "Reps", unit: "", inputMode: "numeric" };
const HOLD: SetCountField = { measure: "seconds", label: "Seconds", unit: "sec", inputMode: "numeric" };
const COVERED: SetCountField = { measure: "distance", label: "Distance", unit: "m", inputMode: "decimal" };

/** What a set of this exercise counts; `measure` is the atlas's, where the caller has it. */
export function setCountFieldFor(exercise: { id?: number } | undefined, measure: SetDoseMeasure = doseMeasureFor(exercise?.id)): SetCountField {
  return measure === "seconds" ? HOLD : measure === "distance" ? COVERED : REPS;
}

const WEIGHT: SetEntryField = { measure: "weight", label: "Weight", unit: "lb", optional: false };
/** One dumbbell's weight: the database scores dumbbell work per implement (EN-07). */
const PER_DUMBBELL: SetEntryField = { measure: "weight", label: "Weight per dumbbell", unit: "lb", optional: false };
const PER_HAND: SetEntryField = { measure: "weight", label: "Weight per hand", unit: "lb", optional: false };
const ADDED_WEIGHT: SetEntryField = { measure: "weight", label: "Added weight", unit: "lb", optional: true };
/** An assisted machine's number is help, not load: more of it is an easier set. */
const ASSISTANCE: SetEntryField = { measure: "weight", label: "Assistance", unit: "lb", optional: false, placeholder: "stack help" };
const settingField = (label: string, optional: boolean): SetEntryField => ({
  measure: "setting", label, unit: "", optional,
  placeholder: label === "Gripper" ? "model or rating" : label === "Hub" ? "which hub" : "colour or rating",
});
const BOX_HEIGHT: SetEntryField = { measure: "height", label: "Box height", unit: "in", optional: true };
/** How long the hold lasted. It takes the reps box's place: a hold is never also counted in reps. */
const SECONDS: SetEntryField = { measure: "seconds", label: "Seconds", unit: "sec", optional: false };
/** How far a carry or sled went, in metres. It takes the reps box's place too. */
const DISTANCE: SetEntryField = { measure: "distance", label: "Distance", unit: "m", optional: false };

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
  /**
   * What the set's dose is entered in: the atlas's logging policy for the exercise where the caller
   * has it (`doseMeasureFor(id, policy.measure)`), else the catalog's own reviewed measurement.
   */
  measure: SetDoseMeasure = doseMeasureFor(exercise?.id),
): SetEntryField[] {
  // The box used to say "lb" whatever the profile said, while every screen read the
  // number in the profile's unit: a kg athlete typed next to "lb" and was scored in kg.
  const fields = fieldsFor(exercise).map((field) => field.measure === "weight" ? { ...field, unit: weightUnit } : field);
  return measure === "seconds" ? [...fields, SECONDS] : measure === "distance" ? [...fields, DISTANCE] : fields;
}

/** Whether the set's dose is seconds: the entry ends in a Seconds box and has no reps box. */
export function isHoldEntry(fields: readonly SetEntryField[]): boolean {
  return fields.some((field) => field.measure === "seconds");
}

/** Whether the set's dose is a distance: the entry ends in a Distance box and has no reps box. */
export function isDistanceEntry(fields: readonly SetEntryField[]): boolean {
  return fields.some((field) => field.measure === "distance");
}

/** The boxes before the dose box: the load, a setting and, on a box jump, the height. */
export const loadFieldsOf = (fields: readonly SetEntryField[]) => fields.filter((field) => field.measure !== "seconds" && field.measure !== "distance");

function fieldsFor(exercise: (Pick<Exercise, "name" | "category" | "equipment"> & { id?: number }) | undefined): SetEntryField[] {
  if (!exercise) return [WEIGHT];
  const name = exercise.name.trim();
  const carriesAddedLoad = /\bweighted\b/i.test(name);
  // The scoring policy's convention decides first, where it names one: a chin-up is scored
  // on reps even though the catalog files it under free weights.
  const convention = loadConventionFor(exercise.id);
  const measurement = measurementFor(exercise.id);

  const loadField = convention === "per_implement" ? PER_DUMBBELL
    : convention === "per_hand" ? PER_HAND
      : carriesAddedLoad || convention === "bodyweight_reps" || loadIsOptional(exercise) ? ADDED_WEIGHT : WEIGHT;

  // The expansion's reviewed measurement modes (shared/exerciseMeasurement.ts).
  if (measurement.explicit) {
    switch (measurement.mode) {
      case "duration": return [];
      case "setting_reps": return [settingField(measurement.settingLabel ?? "Setting", measurement.settingLabel !== "Gripper")];
      case "assisted_reps": return [ASSISTANCE];
      case "load_duration": return [loadField, settingField(measurement.settingLabel ?? "Setting", false)];
      default: break;
    }
  }

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
