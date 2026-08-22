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

/**
 * Plain-text rendering of a training day, for the native share sheet.
 *
 * `window.print()` does nothing useful inside a webview, so on iOS the same
 * sheet is handed to the system share sheet instead — AirDrop, Notes, Messages,
 * or the printer the user actually owns.
 *
 * Kept as a pure function so the layout is testable without a device, and so
 * the print sheet and the shared text cannot drift apart: both are built from
 * `getPrintableWorkoutRows`.
 */
export function buildWorkoutShareText(
  rows: PrintableWorkoutRow[],
  context: { dayLabel: string; goal: string; sport: string }
): string {
  const header = [
    context.dayLabel,
    `Goal: ${context.goal}  ·  Sport: ${context.sport}`,
    "",
  ];

  const body = rows.flatMap(row => {
    const title = `${String(row.order).padStart(2, "0")}. ${row.name}`;
    const detail = `    ${row.prescription} · ${row.rpe} · ${row.rest} rest`;
    const muscles = row.muscleSummary ? [`    ${row.muscleSummary}`] : [];
    const notes = row.notes ? [`    Note: ${row.notes}`] : [];
    // The blank tracking lines are the point of the printed sheet — someone is
    // going to write loads into them — so they survive into the shared text.
    const tracking = row.trackingLines.map(line => `    ${line}`);

    return [title, detail, ...muscles, ...notes, ...tracking, ""];
  });

  return [...header, ...body].join("\n").trimEnd();
}
