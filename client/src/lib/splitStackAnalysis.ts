import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { logicCalibration } from "@/lib/evidenceTraceability";

export type SplitMuscleRequirement = { muscle: string; role: "primary" | "support"; target: number };
export type StackMuscleScore = SplitMuscleRequirement & { score: number; state: "gap" | "ready" | "high" };
export type StackSuggestion = { muscle: string; candidate: Exercise; replaceExercise?: Exercise; swapCue?: string };

/** Fixed catalog-tag weights are used only to compare plan coverage consistently. They are not EMG, force, fatigue, or individual-response measures. */
export const splitStackModelBoundary = `Coverage values are catalog-planning indices: a primary-muscle tag contributes ${logicCalibration.exposure.splitPrimaryTagWeight} points and a supporting-muscle tag contributes ${logicCalibration.exposure.splitSupportTagWeight} points before the display cap. Split targets organize a balanced day; none of these values measure activation, recovery, or an individual optimum.`;

const requirements: Record<TrainingSplit, SplitMuscleRequirement[]> = {
  Push: [{ muscle: "chest", role: "primary", target: 90 }, { muscle: "frontDelts", role: "primary", target: 75 }, { muscle: "triceps", role: "primary", target: 70 }, { muscle: "sideDelts", role: "support", target: 45 }, { muscle: "serratusAnterior", role: "support", target: 35 }],
  Pull: [{ muscle: "lats", role: "primary", target: 85 }, { muscle: "rhomboids", role: "primary", target: 65 }, { muscle: "traps", role: "primary", target: 60 }, { muscle: "rearDelts", role: "support", target: 45 }, { muscle: "biceps", role: "support", target: 55 }, { muscle: "forearms", role: "support", target: 40 }],
  Legs: [{ muscle: "quads", role: "primary", target: 80 }, { muscle: "hamstrings", role: "primary", target: 75 }, { muscle: "glutes", role: "primary", target: 70 }, { muscle: "calves", role: "support", target: 40 }, { muscle: "adductors", role: "support", target: 35 }],
  Upper: [{ muscle: "chest", role: "primary", target: 60 }, { muscle: "lats", role: "primary", target: 60 }, { muscle: "frontDelts", role: "support", target: 45 }, { muscle: "rearDelts", role: "support", target: 45 }, { muscle: "triceps", role: "support", target: 45 }, { muscle: "biceps", role: "support", target: 45 }],
  Lower: [{ muscle: "quads", role: "primary", target: 75 }, { muscle: "hamstrings", role: "primary", target: 75 }, { muscle: "glutes", role: "primary", target: 70 }, { muscle: "calves", role: "support", target: 40 }, { muscle: "tibialis", role: "support", target: 25 }],
  "Full Body": [{ muscle: "chest", role: "primary", target: 45 }, { muscle: "lats", role: "primary", target: 45 }, { muscle: "quads", role: "primary", target: 50 }, { muscle: "hamstrings", role: "primary", target: 45 }, { muscle: "glutes", role: "primary", target: 45 }, { muscle: "abs", role: "support", target: 35 }],
  "Sport Transfer": [{ muscle: "glutes", role: "primary", target: 50 }, { muscle: "abs", role: "primary", target: 45 }, { muscle: "obliques", role: "primary", target: 45 }, { muscle: "traps", role: "support", target: 35 }, { muscle: "rotatorCuff", role: "support", target: 30 }],
};

const involvement = (exercise: Exercise, muscle: string) => exercise.primaryMuscles.includes(muscle) ? logicCalibration.exposure.splitPrimaryTagWeight : exercise.secondaryMuscles.includes(muscle) ? logicCalibration.exposure.splitSupportTagWeight : 0;

export function getSplitRequirements(split: TrainingSplit) { return requirements[split]; }

export function analyzeSplitStack(workout: Exercise[], catalog: Exercise[], split: TrainingSplit) {
  const ratings: StackMuscleScore[] = requirements[split].map((requirement) => {
    const rawScore = workout.reduce((sum, exercise) => sum + involvement(exercise, requirement.muscle), 0);
    const score = Math.min(logicCalibration.exerciseGenome.relativeScaleMaximum, rawScore);
    return { ...requirement, score, state: rawScore < requirement.target * logicCalibration.exposure.splitCoverageGapRatio ? "gap" : rawScore > requirement.target + logicCalibration.exposure.splitCoverageHighOffset ? "high" : "ready" };
  });
  const gaps = ratings.filter((rating) => rating.state === "gap");
  const high = ratings.find((rating) => rating.state === "high");
  const existingIds = new Set(workout.map((exercise) => exercise.id));
  const suggestions: StackSuggestion[] = gaps.slice(0, 2).flatMap((gap) => {
    const candidate = catalog.find((exercise) => !existingIds.has(exercise.id) && involvement(exercise, gap.muscle) > 0);
    const replaceExercise = high ? workout.find((exercise) => involvement(exercise, high.muscle) > 0) : undefined;
    return candidate ? [{ muscle: gap.muscle, candidate, replaceExercise, swapCue: replaceExercise ? `Replace ${replaceExercise.name} if total volume is fixed.` : undefined }] : [];
  });
  const score = ratings.length ? Math.round(ratings.reduce((sum, rating) => sum + Math.min(logicCalibration.exerciseGenome.relativeScaleMaximum, (rating.score / rating.target) * logicCalibration.exerciseGenome.relativeScaleMaximum), 0) / ratings.length) : 0;
  return { score, ratings, gaps, suggestions, boundary: splitStackModelBoundary };
}
