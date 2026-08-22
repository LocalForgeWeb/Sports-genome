import { getExerciseGenome, getWorkoutGenome } from "@/lib/exerciseGenome";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getGymTimeBudget, timeAdjustedSetBand } from "@/lib/gymTimeBudget";
import { evidenceBoundary, trainingEvidence } from "@/lib/trainingEvidence";
import { analyzeWorkoutRedundancy, type WorkoutRedundancyFinding } from "@/lib/workoutRedundancy";

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
  evidenceBoundary: string;
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
  redundancyFindings: WorkoutRedundancyFinding[];
  target: ProgrammingTarget;
  gymTimeBudget: ReturnType<typeof getGymTimeBudget>;
};

const defaultSettings: ExerciseSettings = { rpe: "RPE 7", rest: "90 sec", notes: "", completed: false };

const programmingTargets: Record<TrainingGoal, ProgrammingTarget> = {
  Athleticism: { goal: "Athleticism", sessionSetBand: [10, 20], workingSetCue: "Use a focused, recoverable number of high-quality work sets rather than chasing fatigue.", repetitionCue: "For ballistic actions, use low-repetition efforts and stop a set when speed or technique falls materially; loaded strength-power work can use low repetitions.", restCue: "Allow generous recovery—often about 2–5 minutes for demanding explosive work—so coordination and intent stay high.", weeklyVolumeCue: "Distribute explosive and demanding lower-body work around practice, competition, and recovery.", evidenceBoundary: "Set and rest ranges are planning anchors. The app does not measure bar velocity, jump contacts, readiness, or an individual power optimum." },
  "Muscle growth": { goal: "Muscle growth", sessionSetBand: [12, 24], workingSetCue: "Use enough technically sound work to accumulate recoverable volume; exercise- and athlete-specific set needs differ.", repetitionCue: `Growth can occur across a broad loading spectrum when effort and technique are appropriate; ${trainingEvidence.hypertrophy.workingRepetitions[0]}–${trainingEvidence.hypertrophy.workingRepetitions[1]} repetitions is one practical option, not a required zone.`, restCue: `Rest for at least about ${trainingEvidence.hypertrophy.restFloorSeconds} seconds and extend it when doing so preserves useful repetitions, load, and technique.`, weeklyVolumeCue: `Approximately ${trainingEvidence.hypertrophy.weeklyHardSetStartingReference} weekly hard sets per muscle can be a starting reference; ${trainingEvidence.hypertrophy.trainedWeeklySetContext[0]}–${trainingEvidence.hypertrophy.trainedWeeklySetContext[1]} is a study context in trained young men, not a personal target. Adjust for performance, fatigue, recovery, and compound-lift contribution.`, evidenceBoundary },
  "Max strength": { goal: "Max strength", sessionSetBand: [9, 18], workingSetCue: "Keep primary work heavy and quality-focused; 2–3 sets per primary exercise is a general starting anchor, not a fixed athlete requirement.", repetitionCue: `Primary work often emphasizes lower-repetition loading, with a ${trainingEvidence.strength.primaryWorkingRepetitions[0]}–${trainingEvidence.strength.primaryWorkingRepetitions[1]} repetition emphasis used in many advanced strength programs; assistance work can extend the practice dose.`, restCue: `About 3–5 minutes can help preserve repeated high-force efforts; ${trainingEvidence.strength.trainedRestFloorSeconds / 60} minutes is a useful trained-athlete floor reference, while exercise complexity, load, and readiness can require a different interval.`, weeklyVolumeCue: "Protect high-quality practice and recoverable exposure rather than adding sets solely to increase a count.", evidenceBoundary },
  Capacity: { goal: "Capacity", sessionSetBand: [12, 22], workingSetCue: "Use progressive, repeatable work sets or timed intervals while preserving position and movement quality.", repetitionCue: "Higher-repetition or timed work can support local endurance; 15+ repetitions with lighter-to-moderate resistance is a traditional reference, not a rule for every exercise.", restCue: "Shorter rests can be useful when quality remains repeatable; use less than 90 seconds as a reference rather than a mandatory limit.", weeklyVolumeCue: "Build repeatability progressively and track comparable performance over time instead of targeting one universal weekly set total.", evidenceBoundary: "Capacity guidance is a planning model. It does not measure aerobic fitness, sport workload, or individual fatigue tolerance." },
};

const parseNumber = (value: string, fallback: number) => Number.parseInt(value.match(/\d+/)?.[0] || "", 10) || fallback;

export const getExerciseSettings = (settings: Record<number, ExerciseSettings>, exerciseId: number) => settings[exerciseId] || defaultSettings;

export const getProgrammingTarget = (goal: TrainingGoal) => programmingTargets[goal];

export function getGoalPrescription(goal: TrainingGoal, index: number) {
  if (goal === "Max strength") return index < 2 ? "4 × 3–5" : "3 × 6–8";
  if (goal === "Muscle growth") return `3 × ${trainingEvidence.hypertrophy.workingRepetitions[0]}–${trainingEvidence.hypertrophy.workingRepetitions[1]}`;
  if (goal === "Capacity") return index < 2 ? "4 × 8–12" : "3 × 12–20";
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
  const redundancyFindings = analyzeWorkoutRedundancy(workout);
  const likelyDuplicates = redundancyFindings.filter((finding) => finding.classification === "Likely duplicate");
  if (!workout.length) prompts.push("Add a first exercise or load a smart draft to calculate session balance.");
  if (genome.redundancy >= 62) prompts.push("Review overlapping exercises before adding more sets; variation may improve marginal value.");
  if (likelyDuplicates.length) prompts.push(`${likelyDuplicates.length} exercise pair${likelyDuplicates.length === 1 ? " is" : "s are"} flagged as a likely duplicate by the session model. Keep both only when they have distinct execution, sequencing, or programming purposes.`);
  if (fatigueExposure >= 72) prompts.push("This stack has a higher fatigue cost. Keep high-skill work early and leave recovery between hard sessions.");
  if (totalSets > target.sessionSetBand[1]) prompts.push(`${totalSets} planned work sets is above this goal’s current ${target.sessionSetBand[0]}–${target.sessionSetBand[1]} planning band. Confirm that the added volume has a clear purpose and remains recoverable.`);
  if (workout.length >= 3 && totalSets < target.sessionSetBand[0]) prompts.push(`${totalSets} planned work sets is below this goal’s current ${target.sessionSetBand[0]}–${target.sessionSetBand[1]} planning band. That can be appropriate for a lighter day, skill emphasis, or a dense training week.`);
  if (goal === "Max strength" && averageRest < 150) prompts.push("Strength emphasis is paired with relatively short rest. Consider whether longer rest would preserve load and technique for the primary sets.");
  if (goal === "Athleticism" && averageRpe >= 9) prompts.push("Athleticism work is showing a high average RPE. Confirm that explosive and technical repetitions stay crisp rather than accumulating fatigue.");
  if (estimatedMinutes > gymTimeBudget.minutes) prompts.push(`The current estimate is about ${estimatedMinutes} minutes, above your ${gymTimeBudget.label} gym window. Reduce accessories, work sets, or avoid rushing priority-lift rest.`);
  if (estimatedMinutes <= gymTimeBudget.minutes - 18 && workout.length && gymTimeBudget.minutes >= 60) prompts.push(`This stack leaves meaningful room in your ${gymTimeBudget.label} window. Add work only if it fills a specific movement, muscle, or skill need.`);
  if (genome.gaps.length >= 4) prompts.push(`The session has limited pattern variety. Consider whether ${genome.gaps.slice(0, 2).join(" and ")} are useful for this day’s purpose.`);
  if (!prompts.length) prompts.push("The active stack has workable variety for a single training session. Use the movement gaps as context, not a requirement to add everything.");
  return { totalSets, estimatedMinutes, fatigueExposure, sessionLoad, redundancy: genome.redundancy, dominantPatterns: genome.dominantPatterns, dominantMuscles: genome.dominantMuscles, gaps: genome.gaps, prompts, redundancyFindings, target, gymTimeBudget };
}
