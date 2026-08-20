import { getExerciseGenome, getWorkoutGenome } from "@/lib/exerciseGenome";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getGymTimeBudget, timeAdjustedSetBand } from "@/lib/gymTimeBudget";

export type ExerciseSettings = {
  rpe: string;
  rest: string;
  notes: string;
  completed: boolean;
};

export type TrainingGoal = "Athleticism" | "Muscle growth" | "Max strength" | "Capacity";

export type ProgrammingTarget = {
  goal: TrainingGoal;
  sessionSetBand: [number, number];
  workingSetCue: string;
  repetitionCue: string;
  restCue: string;
  weeklyVolumeCue: string;
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
  target: ProgrammingTarget;
  gymTimeBudget: ReturnType<typeof getGymTimeBudget>;
};

const defaultSettings: ExerciseSettings = { rpe: "RPE 7", rest: "90 sec", notes: "", completed: false };

const programmingTargets: Record<TrainingGoal, ProgrammingTarget> = {
  Athleticism: { goal: "Athleticism", sessionSetBand: [10, 20], workingSetCue: "2–4 focused work sets per lift", repetitionCue: "Prefer crisp 3–8 rep strength/power work; stop before speed changes markedly.", restCue: "Usually 2–3 min for high-output or complex lifts.", weeklyVolumeCue: "Distribute hard lower-body and high-speed work around sport practice and recovery." },
  "Muscle growth": { goal: "Muscle growth", sessionSetBand: [12, 24], workingSetCue: "2–4 work sets per exercise", repetitionCue: "Use a broad 6–15 rep range with controlled technique and sufficient effort.", restCue: "Usually 1–2 min; extend rest when it preserves useful volume.", weeklyVolumeCue: "Use roughly 10 weekly hard sets per target muscle as a starting reference, then individualize." },
  "Max strength": { goal: "Max strength", sessionSetBand: [9, 18], workingSetCue: "2–5 work sets with fewer high-intensity priorities", repetitionCue: "Keep primary work mostly in the 1–6 rep range; use assistance work for additional practice.", restCue: "Usually 3–5 min for heavy primary sets.", weeklyVolumeCue: "Protect high-quality practice and avoid adding fatigue just to increase set count." },
  Capacity: { goal: "Capacity", sessionSetBand: [12, 22], workingSetCue: "2–4 work sets per exercise", repetitionCue: "Use repeatable 8–20 rep or timed intervals while preserving position.", restCue: "Usually 45–90 sec unless skill or load quality requires longer.", weeklyVolumeCue: "Build repeatability progressively; session density should not erase movement quality." },
};

const parseNumber = (value: string, fallback: number) => Number.parseInt(value.match(/\d+/)?.[0] || "", 10) || fallback;

export const getExerciseSettings = (settings: Record<number, ExerciseSettings>, exerciseId: number) => settings[exerciseId] || defaultSettings;

export const getProgrammingTarget = (goal: TrainingGoal) => programmingTargets[goal];

export function getGoalPrescription(goal: TrainingGoal, index: number) {
  if (goal === "Max strength") return index < 2 ? "4 × 3–5" : "3 × 6–8";
  if (goal === "Muscle growth") return "3 × 8–12";
  if (goal === "Capacity") return index < 2 ? "4 × 8–12" : "3 × 12–15";
  return index < 2 ? "4 × 3–6" : "3 × 6–10";
}

export function getWorkoutDiagnostics(workout: Exercise[], prescriptions: Record<number, string>, settings: Record<number, ExerciseSettings>, goal: TrainingGoal = "Athleticism", gymMinutes = 60): WorkoutDiagnostics {
  const genome = getWorkoutGenome(workout);
  const baseTarget = getProgrammingTarget(goal);
  const gymTimeBudget = getGymTimeBudget(gymMinutes);
  const target = { ...baseTarget, sessionSetBand: timeAdjustedSetBand(goal, baseTarget.sessionSetBand, gymMinutes), restCue: `${baseTarget.restCue} ${gymTimeBudget.restGuidance}` };
  const totalSets = workout.reduce((total, exercise, index) => total + parseNumber(prescriptions[exercise.id] || getGoalPrescription(goal, index), 3), 0);
  const averageRest = workout.length ? workout.reduce((total, exercise) => total + parseNumber(getExerciseSettings(settings, exercise.id).rest, 90), 0) / workout.length : 0;
  const fatigueExposure = workout.length ? Math.round(workout.reduce((total, exercise) => total + getExerciseGenome(exercise).fatigue.systemic, 0) / workout.length) : 0;
  const averageRpe = workout.length ? workout.reduce((total, exercise) => total + parseNumber(getExerciseSettings(settings, exercise.id).rpe, 7), 0) / workout.length : 0;
  const estimatedMinutes = Math.max(0, Math.round(totalSets * (1.05 + averageRest / 60)));
  const sessionLoad = Math.round(totalSets * averageRpe);
  const prompts: string[] = [];
  if (!workout.length) prompts.push("Add a first exercise or load a smart draft to calculate session balance.");
  if (genome.redundancy >= 62) prompts.push("Review overlapping exercises before adding more sets; variation may improve marginal value.");
  if (fatigueExposure >= 72) prompts.push("This stack has a higher fatigue cost. Keep high-skill work early and leave recovery between hard sessions.");
  if (totalSets > target.sessionSetBand[1]) prompts.push(`${totalSets} planned work sets exceeds this goal’s typical ${target.sessionSetBand[0]}–${target.sessionSetBand[1]} set session band. Confirm that the added volume has a clear purpose.`);
  if (workout.length >= 3 && totalSets < target.sessionSetBand[0]) prompts.push(`${totalSets} planned work sets sits below this goal’s typical ${target.sessionSetBand[0]}–${target.sessionSetBand[1]} set session band. That can be appropriate for a lighter day, skill emphasis, or a dense training week.`);
  if (goal === "Max strength" && averageRest < 150) prompts.push("Strength emphasis is paired with relatively short rest. Consider whether longer rest would preserve load and technique for the primary sets.");
  if (goal === "Athleticism" && averageRpe >= 9) prompts.push("Athleticism work is showing a high average RPE. Confirm that explosive and technical repetitions stay crisp rather than accumulating fatigue.");
  if (estimatedMinutes > gymTimeBudget.minutes) prompts.push(`The current estimate is about ${estimatedMinutes} minutes, above your ${gymTimeBudget.label} gym window. Reduce accessories, work sets, or avoid rushing priority-lift rest.`);
  if (estimatedMinutes <= gymTimeBudget.minutes - 18 && workout.length && gymTimeBudget.minutes >= 60) prompts.push(`This stack leaves meaningful room in your ${gymTimeBudget.label} window. Add work only if it fills a specific movement, muscle, or skill need.`);
  if (genome.gaps.length >= 4) prompts.push(`The session has limited pattern variety. Consider whether ${genome.gaps.slice(0, 2).join(" and ")} are useful for this day’s purpose.`);
  if (!prompts.length) prompts.push("The active stack has workable variety for a single training session. Use the movement gaps as context, not a requirement to add everything.");
  return { totalSets, estimatedMinutes, fatigueExposure, sessionLoad, redundancy: genome.redundancy, dominantPatterns: genome.dominantPatterns, dominantMuscles: genome.dominantMuscles, gaps: genome.gaps, prompts, target, gymTimeBudget };
}
