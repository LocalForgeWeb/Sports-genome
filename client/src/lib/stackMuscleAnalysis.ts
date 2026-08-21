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
  primaryExercises: number;
  supportingExercises: number;
  mechanicalLoading: number;
  longLengthLoading: number;
  peakContraction: number;
  stabilizationDemand: number;
  contributions: StackMuscleContribution[];
};

const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

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

  return Array.from(byMuscle.entries()).map(([muscle, contributions]) => ({
    muscle,
    involvement: Math.min(100, contributions.reduce((sum, entry) => sum + entry.involvement, 0)),
    primaryExercises: contributions.filter((entry) => entry.role === "Prime mover").length,
    supportingExercises: contributions.filter((entry) => entry.role !== "Prime mover").length,
    mechanicalLoading: average(contributions.map((entry) => entry.mechanicalLoading)),
    longLengthLoading: average(contributions.map((entry) => entry.longLengthLoading)),
    peakContraction: average(contributions.map((entry) => entry.peakContraction)),
    stabilizationDemand: average(contributions.map((entry) => entry.stabilizationDemand)),
    contributions: contributions.sort((first, second) => second.involvement - first.involvement),
  })).sort((first, second) => second.involvement - first.involvement || second.primaryExercises - first.primaryExercises);
}
