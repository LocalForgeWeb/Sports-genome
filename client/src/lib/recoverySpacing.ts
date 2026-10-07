import type { Exercise } from "@/lib/exerciseCatalog";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import { displayNames, type WeeklyPlan, type WeeklyPrescriptionStore } from "@/lib/weeklyVolume";
import { logicCalibration } from "@/lib/evidenceTraceability";

export type RecoverySpacingAlert = {
  previousDay: string;
  nextDay: string;
  /** The later day's plan key, so "Open" can select that exact slot. */
  nextKey: string;
  severity: "watch" | "priority";
  sharedMuscles: { muscle: string; label: string; previousSets: number; nextSets: number }[];
};

/**
 * The same names the volume map beside it uses. This had its own list, which lacked upperBack,
 * brachialis and others (a row read "upperBack · Pull 17 / Legs 17") and called the middle
 * deltoids "Lateral" on the same page (Sep 28 regression brief §9).
 */
const labels = displayNames;

const parseSets = (value: string, fallback: number) => Number.parseInt(value.match(/^\s*(\d+)/)?.[1] || "", 10) || fallback;
const dayIndex = (key: string) => Number.parseInt(key.split("-")[0] || "", 10);
const dayLabel = (key: string) => key.split("-").slice(1).join("-") || key;

function getDayExposure(workout: Exercise[], prescriptions: Record<number, string> | undefined, goal: TrainingGoal) {
  const exposure = new Map<string, number>();
  workout.forEach((exercise, index) => {
    const sets = parseSets(prescriptions?.[exercise.id] || getGoalPrescription(goal, index, exercise), 3);
    const primary = new Set(exercise.primaryMuscles);
    primary.forEach((muscle) => exposure.set(muscle, (exposure.get(muscle) || 0) + sets));
    exercise.secondaryMuscles.filter((muscle) => !primary.has(muscle)).forEach((muscle) => exposure.set(muscle, Number(((exposure.get(muscle) || 0) + sets * logicCalibration.exposure.secondarySetConvention).toFixed(1))));
  });
  return exposure;
}

export function getRecoverySpacingAlerts(plan: WeeklyPlan, weeklyPrescriptions: WeeklyPrescriptionStore, goal: TrainingGoal): RecoverySpacingAlert[] {
  const savedDays = Object.entries(plan).filter(([, workout]) => workout.length).sort(([a], [b]) => dayIndex(a) - dayIndex(b));
  return savedDays.flatMap(([previousKey, previousWorkout], index) => {
    const next = savedDays[index + 1];
    if (!next || dayIndex(next[0]) - dayIndex(previousKey) !== 1) return [];
    const previous = getDayExposure(previousWorkout, weeklyPrescriptions[previousKey], goal);
    const following = getDayExposure(next[1], weeklyPrescriptions[next[0]], goal);
    const sharedMuscles = Array.from(previous.entries()).flatMap(([muscle, previousSets]) => {
      const nextSets = following.get(muscle) || 0;
      return previousSets >= logicCalibration.exposure.consecutiveDayMinimumSets && nextSets >= logicCalibration.exposure.consecutiveDayMinimumSets ? [{ muscle, label: labels[muscle] || muscle, previousSets, nextSets }] : [];
    }).sort((a, b) => Math.min(b.previousSets, b.nextSets) - Math.min(a.previousSets, a.nextSets));
    if (!sharedMuscles.length) return [];
    const sharedExposure = sharedMuscles.reduce((sum, item) => sum + Math.min(item.previousSets, item.nextSets), 0);
    return [{ previousDay: dayLabel(previousKey), nextDay: dayLabel(next[0]), nextKey: next[0], severity: sharedExposure >= logicCalibration.exposure.consecutiveDayPriorityExposure ? "priority" : "watch", sharedMuscles }];
  });
}

/**
 * Which neighbouring saved days the check compared, and which saved neighbours it did not
 * because an empty day sits between them in plan order. The panel said "clear" for the whole
 * plan while silently skipping those pairs (Sep 28 regression brief §9). Same rule as above.
 */
export function getRecoverySpacingCoverage(plan: WeeklyPlan) {
  const savedDays = Object.entries(plan).filter(([, workout]) => workout.length).map(([key]) => key).sort((a, b) => dayIndex(a) - dayIndex(b));
  const compared: [string, string][] = [];
  const skipped: [string, string][] = [];
  savedDays.forEach((key, index) => {
    const next = savedDays[index + 1];
    if (!next) return;
    (dayIndex(next) - dayIndex(key) === 1 ? compared : skipped).push([dayLabel(key), dayLabel(next)]);
  });
  return { compared, skipped };
}
