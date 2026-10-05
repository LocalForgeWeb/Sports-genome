import type { Exercise } from "@/lib/exerciseCatalog";
import { displayPrescription } from "@/lib/setPrescription";
import { SHARE_SCHEMA_VERSION, shareLimits, type ShareSnapshot } from "@shared/workoutShare";

/**
 * The sender's plan, as the composer offers it: every day of the week being shown,
 * each exercise with the prescription its row shows (the one set, or the goal's
 * default, which is marked as such), and its RPE, rest and note.
 */
export type ShareSourceExercise = { exercise: Exercise; prescription: string; prescriptionIsDefault: boolean; rpe?: string; rest?: string; notes?: string };
export type ShareSourceDay = { key: string; index: number; ordinal: string; label: string; exercises: ShareSourceExercise[] };
export type ShareSource = { week: number; sport?: string; goal?: string; activeIndex: number; days: ShareSourceDay[] };
export type ShareScope = "day" | "week";
export type ShareChoices = { scope: ShareScope; title: string; description: string; attribution: string; includeNotes: boolean };

const clip = (value: string | undefined, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export const shareableDays = (source: ShareSource) => source.days.filter((day) => day.exercises.length > 0);
export const activeSourceDay = (source: ShareSource) => source.days.find((day) => day.index === source.activeIndex) ?? source.days[0];

/** "Pull · Week 1" for a day; "Week 1 · Push, Pull, Legs" for a week. */
export function defaultShareTitle(source: ShareSource, scope: ShareScope): string {
  if (scope === "day") return clip(`${activeSourceDay(source)?.label ?? "Workout"} · Week ${source.week}`, shareLimits.title);
  const labels = shareableDays(source).map((day) => day.label);
  return clip(`Week ${source.week} · ${labels.join(", ")}`, shareLimits.title);
}

/** The days a scope takes, in plan order, and what a share of them would hold. */
export function daysForScope(source: ShareSource, scope: ShareScope): ShareSourceDay[] {
  if (scope === "day") { const day = activeSourceDay(source); return day && day.exercises.length ? [day] : []; }
  return shareableDays(source);
}

/** The notes a share would carry if the sender includes them, so the composer can show them first. */
export const notesInScope = (source: ShareSource, scope: ShareScope) => daysForScope(source, scope).flatMap((day) => day.exercises.filter((entry) => entry.notes?.trim()).map((entry) => ({ day: day.label, name: entry.exercise.name, notes: entry.notes!.trim() })));

export function buildShareSnapshot(source: ShareSource, choices: ShareChoices): ShareSnapshot | null {
  const days = daysForScope(source, choices.scope).slice(0, shareLimits.days);
  if (!days.length) return null;
  const description = clip(choices.description, shareLimits.description);
  const attribution = clip(choices.attribution, shareLimits.attribution);
  return {
    schema: SHARE_SCHEMA_VERSION,
    scope: choices.scope,
    title: clip(choices.title, shareLimits.title) || defaultShareTitle(source, choices.scope),
    ...(description ? { description } : {}),
    ...(attribution ? { attribution } : {}),
    week: source.week,
    ...(source.sport ? { sport: clip(source.sport, shareLimits.field) } : {}),
    ...(source.goal ? { goal: clip(source.goal, shareLimits.field) } : {}),
    days: days.map((day, dayIndex) => ({
      order: dayIndex + 1,
      label: clip(day.label, shareLimits.dayLabel) || day.ordinal,
      exercises: day.exercises.slice(0, shareLimits.exercisesPerDay).map((entry, index) => {
        const notes = choices.includeNotes ? clip(entry.notes, shareLimits.notes) : "";
        return {
          order: index + 1,
          catalogId: entry.exercise.id,
          name: clip(entry.exercise.name, shareLimits.exerciseName),
          ...(entry.exercise.movement ? { movement: clip(entry.exercise.movement, shareLimits.field) } : {}),
          ...(entry.exercise.equipment ? { equipment: clip(entry.exercise.equipment, shareLimits.field) } : {}),
          prescription: clip(displayPrescription(entry.prescription), shareLimits.field),
          ...(entry.prescriptionIsDefault ? { prescriptionIsDefault: true } : {}),
          ...(entry.rpe ? { rpe: clip(entry.rpe, shareLimits.field) } : {}),
          ...(entry.rest ? { rest: clip(entry.rest, shareLimits.field) } : {}),
          ...(notes ? { notes } : {}),
        };
      }),
    })),
  };
}
