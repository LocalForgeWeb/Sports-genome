import type { Exercise } from "./exerciseCatalog";
import { getExerciseGenome } from "./exerciseGenome";

export type StackMuscleContribution = {
  exerciseId: number;
  exerciseName: string;
  movement: string;
  role: "Prime mover" | "Synergist" | "Stabilizer";
  involvement: number;
  mechanicalLoading: number;
  longLengthLoading: number;
  peakContraction: number;
  stabilizationDemand: number;
};

export type StackMuscleAnalysis = {
  muscle: string;
  involvement: number;
  rawInvolvement: number;
  primaryExercises: number;
  supportingExercises: number;
  mechanicalLoading: number;
  longLengthLoading: number;
  peakContraction: number;
  stabilizationDemand: number;
  contributions: StackMuscleContribution[];
};

const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const roleWeight = (role: StackMuscleContribution["role"]) => role === "Prime mover" ? 1 : role === "Synergist" ? 0.65 : 0.4;
const weightedAverage = (contributions: StackMuscleContribution[], metric: keyof Pick<StackMuscleContribution, "mechanicalLoading" | "longLengthLoading" | "peakContraction" | "stabilizationDemand">) => {
  const totalWeight = contributions.reduce((sum, entry) => sum + entry.involvement * roleWeight(entry.role), 0);
  if (!totalWeight) return 0;
  return Math.round(contributions.reduce((sum, entry) => sum + entry[metric] * entry.involvement * roleWeight(entry.role), 0) / totalWeight);
};

export function analyzeWholeStackMuscles(workout: Exercise[]): StackMuscleAnalysis[] {
  const byMuscle = new Map<string, StackMuscleContribution[]>();

  workout.forEach((exercise) => {
    const genome = getExerciseGenome(exercise);
    genome.muscleProfile.forEach((profile) => {
      const contribution: StackMuscleContribution = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        movement: exercise.movement,
        role: profile.role,
        involvement: profile.contribution,
        mechanicalLoading: profile.mechanicalLoading,
        longLengthLoading: profile.longLengthLoading,
        peakContraction: profile.peakContraction,
        stabilizationDemand: profile.stabilizationDemand,
      };
      byMuscle.set(profile.muscle, [...(byMuscle.get(profile.muscle) || []), contribution]);
    });
  });

  const rawAnalysis = Array.from(byMuscle.entries()).map(([muscle, contributions]) => ({
    muscle,
    rawInvolvement: contributions.reduce((sum, entry) => sum + entry.involvement * roleWeight(entry.role), 0),
    primaryExercises: contributions.filter((entry) => entry.role === "Prime mover").length,
    supportingExercises: contributions.filter((entry) => entry.role !== "Prime mover").length,
    mechanicalLoading: weightedAverage(contributions, "mechanicalLoading"),
    longLengthLoading: weightedAverage(contributions, "longLengthLoading"),
    peakContraction: weightedAverage(contributions, "peakContraction"),
    stabilizationDemand: weightedAverage(contributions, "stabilizationDemand"),
    contributions: contributions.sort((first, second) => second.involvement - first.involvement),
  }));
  const highestExposure = Math.max(...rawAnalysis.map((item) => item.rawInvolvement), 1);

  return rawAnalysis.map((item) => ({
    ...item,
    involvement: Math.max(1, Math.round((item.rawInvolvement / highestExposure) * 100)),
  })).sort((first, second) => second.rawInvolvement - first.rawInvolvement || second.primaryExercises - first.primaryExercises);
}
