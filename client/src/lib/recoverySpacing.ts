import type { Exercise } from "@/lib/exerciseCatalog";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import type { WeeklyPlan, WeeklyPrescriptionStore } from "@/lib/weeklyVolume";

export type RecoverySpacingAlert = {
  previousDay: string;
  nextDay: string;
  severity: "watch" | "priority";
  sharedMuscles: { muscle: string; label: string; previousSets: number; nextSets: number }[];
};

const labels: Record<string, string> = {
  chest: "Pectoralis major", frontDelts: "Anterior deltoids", sideDelts: "Lateral deltoids", rearDelts: "Posterior deltoids", triceps: "Triceps brachii", biceps: "Biceps brachii", forearms: "Forearms", abs: "Rectus abdominis", obliques: "External obliques", quads: "Quadriceps", glutes: "Gluteal muscles", hamstrings: "Hamstrings", calves: "Calves", lats: "Latissimus dorsi", traps: "Trapezius", lowerBack: "Erector spinae", rotatorCuff: "Rotator cuff",
};

const parseSets = (value: string, fallback: number) => Number.parseInt(value.match(/^\s*(\d+)/)?.[1] || "", 10) || fallback;
const dayIndex = (key: string) => Number.parseInt(key.split("-")[0] || "", 10);
const dayLabel = (key: string) => key.split("-").slice(1).join("-") || key;

function getDayExposure(workout: Exercise[], prescriptions: Record<number, string> | undefined, goal: TrainingGoal) {
  const exposure = new Map<string, number>();
  workout.forEach((exercise, index) => {
    const sets = parseSets(prescriptions?.[exercise.id] || getGoalPrescription(goal, index), 3);
    const primary = new Set(exercise.primaryMuscles);
    primary.forEach((muscle) => exposure.set(muscle, (exposure.get(muscle) || 0) + sets));
    exercise.secondaryMuscles.filter((muscle) => !primary.has(muscle)).forEach((muscle) => exposure.set(muscle, Number(((exposure.get(muscle) || 0) + sets * .5).toFixed(1))));
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
      return previousSets >= 3 && nextSets >= 3 ? [{ muscle, label: labels[muscle] || muscle, previousSets, nextSets }] : [];
    }).sort((a, b) => Math.min(b.previousSets, b.nextSets) - Math.min(a.previousSets, a.nextSets));
    if (!sharedMuscles.length) return [];
    const sharedExposure = sharedMuscles.reduce((sum, item) => sum + Math.min(item.previousSets, item.nextSets), 0);
    return [{ previousDay: dayLabel(previousKey), nextDay: dayLabel(next[0]), severity: sharedExposure >= 8 ? "priority" : "watch", sharedMuscles }];
  });
}
