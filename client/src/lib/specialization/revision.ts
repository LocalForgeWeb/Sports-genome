import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { planFingerprint } from "@/lib/planSyncDecision";
import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";

/**
 * Revisions for the summary's cache key (brief §9: "Cache keys include … plan revision,
 * source revision"). Each is the FNV-1a fingerprint the plan sync already uses
 * (`planFingerprint`), taken over only the fields exposure reads, in a fixed order. So a
 * logged, edited, removed or swapped set changes the revision, while a rest timer ticking in
 * the live workout or a note typed on a recap does not force a recalculation.
 */

/** JSON with object keys sorted, so the same content always prints the same way. */
export function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

const SET_FIELDS = ["id", "weight", "reps", "unit", "completed", "skipped", "type", "stages", "effort", "side", "legSide", "holdSeconds", "warmup"] as const;

/** What of the workout log a summary depends on. Sessions are read in id order. */
export function sourceRevision(sessions: readonly DeviceWorkoutSession[]): string {
  const projection = [...sessions]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((session) => ({
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? null,
      dayLabel: session.dayLabel,
      title: session.title,
      weightUnit: session.weightUnit ?? null,
      notPerformed: session.notPerformed ?? null,
      exercises: session.exercises.map((exercise) => ({
        id: exercise.id,
        exerciseName: exercise.exerciseName,
        catalogId: exercise.catalogId ?? null,
        straps: (exercise as { straps?: unknown }).straps ?? null,
        skippedSets: exercise.skippedSets ?? null,
        sets: exercise.sets.map((set) => Object.fromEntries(SET_FIELDS.map((field) => [field, (set as Record<string, unknown>)[field] ?? null]))),
      })),
    }));
  return `src-${planFingerprint(stableStringify(projection))}`;
}

/**
 * What of a plan week a planned summary depends on: its days, their exercises and
 * prescriptions, and the training goal that fills in a prescription that was never saved.
 */
export function planRevision(store: WeeklyDayStore, slots?: readonly DaySlot[], week?: number, goal?: TrainingGoal): string {
  const keys = slots ? slots.map((slot) => slot.key) : Object.keys(store.plan).sort();
  const projection = {
    week: week ?? null,
    goal: goal ?? null,
    days: keys.map((key) => ({
      key,
      label: slots?.find((slot) => slot.key === key)?.label ?? null,
      entries: (store.plan[key] ?? []).map((entry) => ({ id: entry.id, catalogExerciseId: catalogIdOf(entry), name: entry.name, prescription: store.prescriptions[key]?.[entry.id] ?? null })),
    })),
  };
  return `plan-${planFingerprint(stableStringify(projection))}`;
}
