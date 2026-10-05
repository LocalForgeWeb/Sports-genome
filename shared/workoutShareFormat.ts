import type { ShareExercise, ShareSnapshot } from "./workoutShare";

/**
 * How a shared workout reads as text: its scope line, an exercise's dose, and the
 * paste-ready copy. Kept apart from the schema (./workoutShare.ts) so the browser can
 * format and read shared text without loading the validator.
 */
/** Days and exercises in their stated order, whatever order the JSON arrived in. */
export function orderedSnapshot(snapshot: ShareSnapshot): ShareSnapshot {
  return { ...snapshot, days: [...snapshot.days].sort((a, b) => a.order - b.order).map((day) => ({ ...day, exercises: [...day.exercises].sort((a, b) => a.order - b.order) })) };
}

export const shareExerciseCount = (snapshot: Pick<ShareSnapshot, "days">) => snapshot.days.reduce((sum, day) => sum + day.exercises.length, 0);

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** "Workout · 6 exercises", "Week · 4 days · 22 exercises". */
export function shareScopeLine(snapshot: Pick<ShareSnapshot, "scope" | "days">): string {
  const exercises = plural(shareExerciseCount(snapshot), "exercise");
  return snapshot.scope === "day" ? `Workout · ${exercises}` : `Week · ${plural(snapshot.days.length, "day")} · ${exercises}`;
}

/** "4 × 3–6 · RPE 8 · Rest 120 sec": the dose on one line, rest named so it cannot be read as reps. */
export function shareDoseLine(exercise: Pick<ShareExercise, "prescription" | "rpe" | "rest">): string {
  const rest = exercise.rest ? (/^rest\b/i.test(exercise.rest) ? exercise.rest : `Rest ${exercise.rest}`) : "";
  return [exercise.prescription, exercise.rpe, rest].filter(Boolean).join(" · ");
}

/** The text that marks a paste as one of ours, so the importer can read it exactly. */
export const SHARE_TEXT_MARKER = "Shared from Sports Genome";

/**
 * The workout as plain text that pastes straight back into a plan.
 *
 *   Push · Week 1
 *   Shared from Sports Genome · 5 exercises
 *
 *   Day 1 · Push
 *   1. Barbell Bench Press — 4 × 3–6 · RPE 8 · Rest 120 sec
 *   2. Cable Lateral Raise — 3 × 12–15 · Note: lead with the elbow
 *
 * One line per exercise with its whole prescription on it: readable in a message,
 * and exactly what Sports Genome's "Paste a workout" reads back - the name, the sets
 * and reps, RPE, rest and note, in order, under their day. The copied summary used
 * to put the prescription on the line below the name and the muscles below that, so
 * a paste lost every prescription and turned muscle names into extra days.
 */
export function shareSnapshotText(snapshot: ShareSnapshot, link?: string): string {
  const ordered = orderedSnapshot(snapshot);
  const head = [ordered.title, `${SHARE_TEXT_MARKER} · ${shareScopeLine(ordered).replace(/^Workout · |^Week · /, "")}`];
  if (ordered.attribution) head.push(`By ${ordered.attribution}`);
  if (ordered.description) head.push(ordered.description.replace(/\s*\n\s*/g, " "));
  const days = ordered.days.map((day, index) => [
    `Day ${index + 1} · ${day.label}`,
    ...day.exercises.map((exercise, position) => {
      const dose = shareDoseLine(exercise);
      const note = exercise.notes ? `Note: ${exercise.notes.replace(/\s*\n\s*/g, " ")}` : "";
      const tail = [dose, note].filter(Boolean).join(" · ");
      return `${position + 1}. ${exercise.name}${tail ? ` — ${tail}` : ""}`;
    }),
  ].join("\n"));
  return [head.join("\n"), ...days, ...(link ? [`Open it or save a copy: ${link}`] : [])].join("\n\n");
}
