import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";

export type PrintableWorkoutRow = { order: number; name: string; prescription: string; rpe: string; rest: string; notes: string; muscleSummary: string; trackingLines: string[] };

export function getPrintableTrackingLines(prescription: string) {
  const setCount = Math.max(1, Math.min(12, Number(prescription.match(/(\d+)\s*(?:x|×)/i)?.[1] || 1)));
  const isTimed = /\b(?:sec|second|minute|min)\b/i.test(prescription);
  return Array.from({ length: setCount }, (_, index) => isTimed ? `Round ${index + 1}: time / quality __________________` : `Set ${index + 1}: load / reps __________________`);
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
