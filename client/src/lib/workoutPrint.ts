import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { parsePrescription } from "@/lib/setPrescription";

export type PrintableWorkoutRow = { order: number; name: string; prescription: string; rpe: string; rest: string; notes: string; muscleSummary: string; trackingLines: string[] };

export function getPrintableTrackingLines(prescription: string) {
  const { sets, varied } = parsePrescription(prescription, "1 × 1");
  const isTimed = /\b(?:sec|second|minute|min)\b/i.test(prescription);
  return sets.map((set, index) => {
    // A sheet carried to the gym has to say what each set asks for. It only
    // needs saying per line when the sets differ; otherwise the row's own
    // prescription already covers all of them.
    const target = varied ? ` (${set.reps})` : "";
    return isTimed
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
