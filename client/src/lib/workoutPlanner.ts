import { getExerciseGenome, getWorkoutGenome } from "@/lib/exerciseGenome";
import type { Exercise } from "@/lib/exerciseCatalog";

export type ExerciseSettings = {
  rpe: string;
  rest: string;
  notes: string;
  completed: boolean;
};

export type WorkoutDiagnostics = {
  totalSets: number;
  estimatedMinutes: number;
  fatigueExposure: number;
  sessionLoad: number;
  redundancy: number;
  dominantPatterns: [string, number][];
  dominantMuscles: [string, number][];
  gaps: string[];
  prompts: string[];
};

const defaultSettings: ExerciseSettings = { rpe: "RPE 7", rest: "90 sec", notes: "", completed: false };

const parseNumber = (value: string, fallback: number) => Number.parseInt(value.match(/\d+/)?.[0] || "", 10) || fallback;

export const getExerciseSettings = (settings: Record<number, ExerciseSettings>, exerciseId: number) => settings[exerciseId] || defaultSettings;

export function getWorkoutDiagnostics(workout: Exercise[], prescriptions: Record<number, string>, settings: Record<number, ExerciseSettings>): WorkoutDiagnostics {
  const genome = getWorkoutGenome(workout);
  const totalSets = workout.reduce((total, exercise) => total + parseNumber(prescriptions[exercise.id] || "3 × 8–12", 3), 0);
  const averageRest = workout.length ? workout.reduce((total, exercise) => total + parseNumber(getExerciseSettings(settings, exercise.id).rest, 90), 0) / workout.length : 0;
  const fatigueExposure = workout.length ? Math.round(workout.reduce((total, exercise) => total + getExerciseGenome(exercise).fatigue.systemic, 0) / workout.length) : 0;
  const averageRpe = workout.length ? workout.reduce((total, exercise) => total + parseNumber(getExerciseSettings(settings, exercise.id).rpe, 7), 0) / workout.length : 0;
  const estimatedMinutes = Math.max(0, Math.round(totalSets * (1.05 + averageRest / 60)));
  const sessionLoad = Math.round(totalSets * averageRpe);
  const prompts: string[] = [];
  if (!workout.length) prompts.push("Add a first exercise or load a smart draft to calculate session balance.");
  if (genome.redundancy >= 62) prompts.push("Review overlapping exercises before adding more sets; variation may improve marginal value.");
  if (fatigueExposure >= 72) prompts.push("This stack has a higher fatigue cost. Keep high-skill work early and leave recovery between hard sessions.");
  if (genome.gaps.length >= 4) prompts.push(`The session has limited pattern variety. Consider whether ${genome.gaps.slice(0, 2).join(" and ")} are useful for this day’s purpose.`);
  if (!prompts.length) prompts.push("The active stack has workable variety for a single training session. Use the movement gaps as context, not a requirement to add everything.");
  return { totalSets, estimatedMinutes, fatigueExposure, sessionLoad, redundancy: genome.redundancy, dominantPatterns: genome.dominantPatterns, dominantMuscles: genome.dominantMuscles, gaps: genome.gaps, prompts };
}
