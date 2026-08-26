/** Kinetic Field Manual: saved-plan volume estimates that distinguish direct work sets from indirect supporting exposure. */
import type { Exercise } from "@/lib/exerciseCatalog";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import { logicCalibration } from "@/lib/evidenceTraceability";

export type WeeklyPlan = Record<string, Exercise[]>;
export type WeeklyPrescriptionStore = Record<string, Record<number, string>>;

export type MuscleVolume = {
  muscle: string;
  label: string;
  directSets: number;
  supportSets: number;
  equivalentSets: number;
  daySets: Record<string, number>;
};

const displayNames: Record<string, string> = {
  chest: "Pectoralis major", frontDelts: "Anterior deltoids", sideDelts: "Middle deltoids", rearDelts: "Posterior deltoids", shoulders: "Deltoids",
  triceps: "Triceps brachii", biceps: "Biceps brachii", brachialis: "Brachialis", forearms: "Forearms", abs: "Rectus abdominis", obliques: "External obliques",
  quads: "Quadriceps", glutes: "Gluteal muscles", hamstrings: "Hamstrings", calves: "Calves", tibialis: "Tibialis anterior", abductors: "Hip abductors", adductors: "Hip adductors",
  lats: "Latissimus dorsi", upperBack: "Upper back", traps: "Trapezius", lowerBack: "Erector spinae", rotatorCuff: "Rotator cuff",
};

function parseSets(value: string, fallback: number) {
  return Number.parseInt(value.match(/^\s*(\d+)/)?.[1] || "", 10) || fallback;
}

export function getWeeklyMuscleVolume(plan: WeeklyPlan, weeklyPrescriptions: WeeklyPrescriptionStore, goal: TrainingGoal): MuscleVolume[] {
  const volumes = new Map<string, MuscleVolume>();
  Object.entries(plan).forEach(([dayKey, workout]) => {
    workout.forEach((exercise, index) => {
      const sets = parseSets(weeklyPrescriptions[dayKey]?.[exercise.id] || getGoalPrescription(goal, index), 3);
      const direct = new Set(exercise.primaryMuscles);
      const support = new Set(exercise.secondaryMuscles.filter((muscle) => !direct.has(muscle)));
      direct.forEach((muscle) => {
        const current = volumes.get(muscle) || { muscle, label: displayNames[muscle] || muscle, directSets: 0, supportSets: 0, equivalentSets: 0, daySets: {} };
        current.directSets += sets;
        current.daySets[dayKey] = (current.daySets[dayKey] || 0) + sets;
        volumes.set(muscle, current);
      });
      support.forEach((muscle) => {
        const current = volumes.get(muscle) || { muscle, label: displayNames[muscle] || muscle, directSets: 0, supportSets: 0, equivalentSets: 0, daySets: {} };
        const contribution = Number((sets * logicCalibration.exposure.secondarySetConvention).toFixed(1));
        current.supportSets += contribution;
        current.daySets[dayKey] = Number(((current.daySets[dayKey] || 0) + contribution).toFixed(1));
        volumes.set(muscle, current);
      });
    });
  });
  return Array.from(volumes.values()).map((entry) => ({ ...entry, directSets: Number(entry.directSets.toFixed(1)), supportSets: Number(entry.supportSets.toFixed(1)), equivalentSets: Number((entry.directSets + entry.supportSets).toFixed(1)) })).sort((a, b) => b.equivalentSets - a.equivalentSets || a.label.localeCompare(b.label));
}

export function getVolumeStatus(volume: MuscleVolume) {
  if (!volume.equivalentSets) return { label: "Not planned", tone: "empty" as const };
  if (volume.directSets >= logicCalibration.exposure.highDirectSetBand) return { label: "High exposure", tone: "high" as const };
  if (volume.directSets >= logicCalibration.exposure.lowDirectSetBand) return { label: "Established", tone: "established" as const };
  return { label: "Building", tone: "building" as const };
}
