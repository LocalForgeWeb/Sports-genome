import type { Exercise } from "./exerciseCatalog";
import type { DeviceWorkoutExercise } from "./deviceWorkoutLog";

/**
 * The two readers of a swap that the app's first screens need: an exercise's catalog identity
 * and the "Switched from ..." line. They live apart from `workoutSwap.ts`, which holds the swap
 * itself (assess, apply, undo, add, the sheet's notes and suggestions), so that only the screens
 * that swap - the live tracker and its sheet, both loaded lazily - download it. Home, the recap
 * and an exercise's history read these two and nothing else. `workoutSwap.ts` re-exports both.
 */

/** A plan entry's catalog exercise: a duplicated entry has an id of its own and names its catalog exercise separately. */
export const catalogIdOf = (exercise: Exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id;

/** "Switched from Sissy Squat after 2 sets" / "Switched to Barbell Squat after 2 sets". */
export function swapNote(exercise: DeviceWorkoutExercise): string | null {
  const count = (record: { afterSets: number }) => (record.afterSets === 0 ? "before any sets" : `after ${record.afterSets} ${record.afterSets === 1 ? "set" : "sets"}`);
  if (exercise.swappedFrom) return `Switched from ${exercise.swappedFrom.exerciseName} ${count(exercise.swappedFrom)}`;
  if (exercise.replacedBy) return `Switched to ${exercise.replacedBy.exerciseName} ${count(exercise.replacedBy)}`;
  if (exercise.addedDuringWorkout) return `Added after ${exercise.addedDuringWorkout.afterExerciseName}`;
  return null;
}
