import type { Exercise } from "@/lib/exerciseCatalog";
import type { DayRecord } from "@/lib/trainingDayPlan";
import type { SpecializationPlanChange } from "./viewState";

export type PlanChangeOutcome =
  | { ok: true; record: DayRecord; summary: string }
  | { ok: false; reason: string };

/**
 * One day's record after an add or a swap asked for from the specialization page.
 *
 * Pure, so the page can preview the planned totals on the record this returns before
 * anything is saved (brief §7, "Preview how the proposed change affects planned totals
 * only"), and Home writes exactly the same record when the athlete confirms. A swap
 * keeps the replaced exercise's prescription and settings, as Plan's own swap does.
 */
export function applyPlanChangeToRecord(record: DayRecord, change: SpecializationPlanChange, incoming: Exercise, defaultPrescription: string): PlanChangeOutcome {
  const catalogIdOf = (exercise: Exercise & { catalogExerciseId?: number }) => exercise.catalogExerciseId || exercise.id;
  if (record.workout.some((exercise) => catalogIdOf(exercise) === incoming.id)) {
    return { ok: false, reason: `${incoming.name} is already in that day.` };
  }
  if (change.replaceEntryId === undefined) {
    return {
      ok: true,
      record: {
        ...record,
        workout: [...record.workout, incoming],
        prescriptions: { ...record.prescriptions, [incoming.id]: change.prescription || defaultPrescription },
      },
      summary: `Added ${incoming.name}`,
    };
  }
  const outgoing = record.workout.find((exercise) => exercise.id === change.replaceEntryId);
  if (!outgoing) return { ok: false, reason: "The exercise to swap out is no longer in that day." };
  const { [outgoing.id]: keptPrescription, ...otherPrescriptions } = record.prescriptions;
  const { [outgoing.id]: keptSettings, ...otherSettings } = record.settings;
  return {
    ok: true,
    record: {
      ...record,
      workout: record.workout.map((exercise) => (exercise.id === outgoing.id ? incoming : exercise)),
      prescriptions: { ...otherPrescriptions, [incoming.id]: keptPrescription || change.prescription || defaultPrescription },
      settings: keptSettings ? { ...otherSettings, [incoming.id]: keptSettings } : otherSettings,
    },
    summary: `Swapped ${outgoing.name} for ${incoming.name}`,
  };
}
