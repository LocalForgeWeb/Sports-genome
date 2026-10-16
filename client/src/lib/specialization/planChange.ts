import type { Exercise } from "@/lib/exerciseCatalog";
import type { DayRecord } from "@/lib/trainingDayPlan";
import type { SpecializationPlanChange } from "./viewState";

export type PlanChangeOutcome =
  /**
   * `index`: where the incoming exercise stands in the day afterwards (0 = first). `revert`: this
   * change's inverse, for Undo, applied to the day as it stands when Undo is pressed.
   */
  | { ok: true; record: DayRecord; summary: string; index: number; revert: (current: DayRecord) => DayRecord }
  | { ok: false; reason: string };

/** Where an add lands: `insertAt` clamped to the day (0 = first), or the end when it is absent or not a number. */
export function insertionIndex(length: number, insertAt: number | undefined): number {
  if (insertAt === undefined || !Number.isFinite(insertAt)) return length;
  return Math.min(Math.max(Math.trunc(insertAt), 0), length);
}

/**
 * One day's record after an add or a swap asked for from the specialization page.
 *
 * Pure, so the page can preview the planned totals on the record this returns before
 * anything is saved (brief §7, "Preview how the proposed change affects planned totals
 * only"), and Home writes exactly the same record when the athlete confirms.
 *
 * Neither edit writes a prescription the athlete did not set. An entry without one reads as
 * the goal's default for its position, as every plan reader does (planBouts `prescriptionOf`),
 * and Plan's own add and swap leave it that way too:
 * - an add goes where `insertAt` says (clamped; at the end when absent) and carries only the
 *   prescription the change names, if any;
 * - a swap takes the replaced exercise's place and carries over only what that entry had of
 *   its own: its prescription and settings. Without them the incoming exercise has none either,
 *   so its sets stay the default for that position instead of becoming another position's.
 */
export function applyPlanChangeToRecord(record: DayRecord, change: SpecializationPlanChange, incoming: Exercise): PlanChangeOutcome {
  const catalogIdOf = (exercise: Exercise & { catalogExerciseId?: number }) => exercise.catalogExerciseId || exercise.id;
  if (record.workout.some((exercise) => catalogIdOf(exercise) === incoming.id)) {
    return { ok: false, reason: `${incoming.name} is already in that day.` };
  }
  // Nothing left over under the incoming id (a record is scoped to its workout, but a stale key would otherwise ride along).
  const { [incoming.id]: _stalePrescription, ...prescriptions } = record.prescriptions;
  const { [incoming.id]: _staleSettings, ...settings } = record.settings;
  if (change.replaceEntryId === undefined) {
    const index = insertionIndex(record.workout.length, change.insertAt);
    return {
      ok: true,
      record: {
        ...record,
        workout: [...record.workout.slice(0, index), incoming, ...record.workout.slice(index)],
        prescriptions: change.prescription ? { ...prescriptions, [incoming.id]: change.prescription } : prescriptions,
        settings,
      },
      summary: `Added ${incoming.name}`,
      index,
      revert: (current) => revertChange(current, incoming, null, record),
    };
  }
  const index = record.workout.findIndex((exercise) => exercise.id === change.replaceEntryId);
  if (index === -1) return { ok: false, reason: "The exercise to swap out is no longer in that day." };
  const outgoing = record.workout[index];
  const { [outgoing.id]: keptPrescription, ...otherPrescriptions } = prescriptions;
  const { [outgoing.id]: keptSettings, ...otherSettings } = settings;
  return {
    ok: true,
    record: {
      ...record,
      workout: record.workout.map((exercise) => (exercise.id === outgoing.id ? incoming : exercise)),
      prescriptions: keptPrescription ? { ...otherPrescriptions, [incoming.id]: keptPrescription } : otherPrescriptions,
      settings: keptSettings ? { ...otherSettings, [incoming.id]: keptSettings } : otherSettings,
    },
    summary: `Swapped ${outgoing.name} for ${incoming.name}`,
    index,
    revert: (current) => revertChange(current, incoming, outgoing, record),
  };
}

/**
 * Takes back one add or swap on the day as it stands now, which may have changed since (Undo
 * can come after other edits). An add comes back out wherever the incoming exercise stands by
 * then, and the rest of the day closes up. A swap puts the outgoing entry back where the
 * incoming one stands, with the prescription and settings it had of its own before. Nothing
 * changes once the incoming exercise has left the day. If the outgoing entry is already back in
 * the day (added again since), the incoming one only comes out, so no entry is ever in a day twice.
 */
function revertChange(current: DayRecord, incoming: Exercise, outgoing: Exercise | null, before: DayRecord): DayRecord {
  if (!current.workout.some((exercise) => exercise.id === incoming.id)) return current;
  const { [incoming.id]: _prescription, ...prescriptions } = current.prescriptions;
  const { [incoming.id]: _settings, ...settings } = current.settings;
  if (!outgoing || current.workout.some((exercise) => exercise.id === outgoing.id)) {
    return { ...current, workout: current.workout.filter((exercise) => exercise.id !== incoming.id), prescriptions, settings };
  }
  return {
    ...current,
    workout: current.workout.map((exercise) => (exercise.id === incoming.id ? outgoing : exercise)),
    prescriptions: before.prescriptions[outgoing.id] ? { ...prescriptions, [outgoing.id]: before.prescriptions[outgoing.id] } : prescriptions,
    settings: before.settings[outgoing.id] ? { ...settings, [outgoing.id]: before.settings[outgoing.id] } : settings,
  };
}
