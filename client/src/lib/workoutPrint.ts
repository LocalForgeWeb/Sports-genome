import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { parsePrescription } from "@/lib/setPrescription";

export type PrintableWorkoutRow = { order: number; name: string; prescription: string; rpe: string; rest: string; notes: string; muscleSummary: string; trackingLines: string[] };

/** Whether one set's target is a duration rather than a count of repetitions. */
const isTimedTarget = (target: string) => /\b(?:s|sec|secs|second|seconds|min|mins|minute|minutes)\b/i.test(target);

export function getPrintableTrackingLines(prescription: string) {
  const { sets, varied } = parsePrescription(prescription, "1 × 1");
  /*
   * Decided per set, not once for the whole prescription. A varied plan can mix
   * them - "3 × 30 sec/10/10" is a timed hold followed by two rep sets - and
   * testing the whole string printed "time / quality" lines for the rep sets,
   * with nowhere on the sheet to write the load.
   */
  const anyTimed = isTimedTarget(prescription);
  return sets.map((set, index) => {
    // A sheet carried to the gym has to say what each set asks for. It only
    // needs saying per line when the sets differ; otherwise the row's own
    // prescription already covers all of them.
    const target = varied ? ` (${set.reps})` : "";
    // A set that names its own unit decides for itself; one that names none
    // follows the prescription, which is how "3 × 30/20/10 sec" stays timed.
    const timed = isTimedTarget(set.reps) || (!/\d/.test(set.reps) ? anyTimed : anyTimed && !varied);
    return timed
      ? `Round ${index + 1}${target}: time / quality __________________`
      : `Set ${index + 1}${target}: load / reps __________________`;
  });
}

export function getPrintableWorkoutRows(workout: Exercise[], prescriptions: Record<number, string>, settings: Record<number, ExerciseSettings>) {
  return workout.map((exercise, index): PrintableWorkoutRow => ({
    order: index + 1,
    name: exercise.name,
    prescription: prescriptions[exercise.id] || "3 × 8–12",
    rpe: settings[exercise.id]?.rpe || "RPE 7",
    rest: settings[exercise.id]?.rest || "90 sec",
    notes: settings[exercise.id]?.notes || "",
    muscleSummary: exercise.primaryMuscles.join(", "),
    trackingLines: getPrintableTrackingLines(prescriptions[exercise.id] || "3 × 8–12"),
  }));
}
