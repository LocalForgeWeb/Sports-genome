import type { Exercise } from "@/lib/exerciseCatalog";
import { displayPrescription } from "@/lib/setPrescription";
import { getTrackingSets, type TrackingSet } from "@/lib/workoutPrint";

/**
 * A training day as it leaves the app: the one model the PDF, the share message
 * and the plain-text summary are all made from (Oct 2 brief §5–14).
 *
 * Built from the same values the Plan row prints, in the same order, so the
 * export can never disagree with the screen: the row's prescription string (the
 * saved one, or the goal's default for that position), shown through
 * displayPrescription, and the row's settings, defaults included. Nothing about
 * the athlete travels with it but the sport and goal the day was built for - no
 * account, no ids, no history.
 */
export type WorkoutExportExercise = {
  order: number;
  name: string;
  /** "4 × 3–6", as the row shows it. */
  prescription: string;
  rpe: string;
  rest: string;
  notes: string;
  movement: string;
  /** Primary muscles, in the catalog's order, as the app names them. */
  muscles: string[];
  tracking: TrackingSet[];
};

export type WorkoutExport = {
  week: number;
  /** "Day 02". */
  dayOrdinal: string;
  /** "Pull". */
  dayName: string;
  sport: string;
  goal: string;
  exercises: WorkoutExportExercise[];
  generatedAt: Date;
};

export type WorkoutExportInput = {
  workout: readonly Exercise[];
  week: number;
  dayOrdinal: string;
  dayName: string;
  sport: string;
  goal: string;
  /** The row's prescription for this exercise at this position (saved, or the goal default). */
  prescriptionFor: (exercise: Exercise, index: number) => string;
  /** The row's settings for this exercise, defaults included. */
  settingsFor: (exercise: Exercise) => { rpe?: string; rest: string; notes: string };
  muscleLabel: (key: string) => string;
  now?: Date;
};

export function buildWorkoutExport(input: WorkoutExportInput): WorkoutExport {
  return {
    week: input.week,
    dayOrdinal: input.dayOrdinal,
    dayName: input.dayName,
    sport: input.sport,
    goal: input.goal,
    generatedAt: input.now ?? new Date(),
    exercises: input.workout.map((exercise, index) => {
      const raw = input.prescriptionFor(exercise, index);
      const settings = input.settingsFor(exercise);
      return {
        order: index + 1,
        name: exercise.name,
        prescription: displayPrescription(raw),
        rpe: settings.rpe ?? "",
        rest: settings.rest ?? "",
        notes: (settings.notes ?? "").trim(),
        movement: exercise.movement,
        muscles: exercise.primaryMuscles.map((key) => input.muscleLabel(key)),
        tracking: getTrackingSets(raw),
      };
    }),
  };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
export const pad2 = (value: number) => String(value).padStart(2, "0");

/** "Week 1 · Day 02 · Pull". */
export function exportDayLine(plan: WorkoutExport): string {
  return `Week ${plan.week} · ${plan.dayOrdinal} · ${plan.dayName}`;
}

/** "Wrestling · Athleticism", leaving out what the athlete has not set. */
export function exportContextLine(plan: WorkoutExport): string {
  return [plan.sport, plan.goal].filter(Boolean).join(" · ");
}

/** "8 exercises". */
export function exportCountLine(plan: WorkoutExport): string {
  return plural(plan.exercises.length, "exercise");
}

/** The document title, used for the PDF's metadata and the share sheet: "Sports Genome · Week 1 · Pull". */
export function exportTitle(plan: WorkoutExport): string {
  return `Sports Genome · Week ${plan.week} · ${plan.dayName}`;
}

/**
 * A filename a person can read in Messages or Files: "Sports Genome - Week 1 Pull.pdf".
 * Characters file systems reject are dropped; nothing random is added.
 */
export function exportFileName(plan: WorkoutExport): string {
  const day = plan.dayName.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || plan.dayOrdinal;
  return `Sports Genome - Week ${plan.week} ${day}.pdf`;
}

/**
 * What goes in the message body when the PDF is attached: two or three short
 * lines, never the workout itself (§6). The recipient opens the PDF for that.
 */
export function shareMessage(plan: WorkoutExport, { attached }: { attached: boolean }): string {
  const lines = [
    `Week ${plan.week} · ${plan.dayName} — Sports Genome`,
    [exportCountLine(plan), exportContextLine(plan)].filter(Boolean).join(" · "),
  ];
  if (attached) lines.push("Full workout attached.");
  return lines.join("\n");
}

/**
 * The plain-text fallback (§14), for Messages, Notes, Discord or a coach's
 * email: predictable line breaks, the app's numbering, and only what a reader
 * needs - no controls, ids or labels from the screen.
 */
export function workoutSummaryText(plan: WorkoutExport): string {
  const head = ["SPORTS GENOME", exportDayLine(plan), exportContextLine(plan)].filter(Boolean);
  const blocks = plan.exercises.map((exercise) => {
    const lines = [`${pad2(exercise.order)} ${exercise.name}`];
    const dose = [exercise.prescription, exercise.rpe, exercise.rest].filter(Boolean).join(" · ");
    if (dose) lines.push(dose);
    if (exercise.muscles.length) lines.push(exercise.muscles.join(" · "));
    if (exercise.notes) lines.push(`Note: ${exercise.notes}`);
    return lines.join("\n");
  });
  return [head.join("\n"), ...blocks].join("\n\n");
}
