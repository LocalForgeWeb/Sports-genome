import { getExerciseGenome, getWorkoutGenome } from "@/lib/exerciseGenome";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getGymTimeBudget, timeAdjustedSetBand } from "@/lib/gymTimeBudget";
import { evidenceBoundary, trainingEvidence } from "@/lib/trainingEvidence";
import { logicCalibration } from "@/lib/evidenceTraceability";
import { parseSetCount } from "@/lib/sessionVolume";

export type ExerciseSettings = {
  rpe?: string;
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
  target: ProgrammingTarget;
  gymTimeBudget: ReturnType<typeof getGymTimeBudget>;
};

const defaultSettings: ExerciseSettings = { rpe: `RPE ${logicCalibration.workoutReview.defaultRpe}`, rest: `${logicCalibration.workoutReview.defaultRestSeconds} sec`, notes: "", completed: false };

const programmingTargets: Record<TrainingGoal, ProgrammingTarget> = {
  Athleticism: { goal: "Athleticism", sessionSetBand: [10, 20], workingSetCue: "Use a focused, recoverable number of high-quality work sets rather than chasing fatigue.", repetitionCue: "For ballistic actions, use low-repetition efforts and stop a set when speed or technique falls materially; loaded strength-power work can use low repetitions.", restCue: "Allow generous recovery—often about 2–5 minutes for demanding explosive work—so coordination and intent stay high.", weeklyVolumeCue: "Distribute explosive and demanding lower-body work around practice, competition, and recovery.", evidenceBoundary: "Set and rest ranges are planning anchors. The app does not measure bar velocity, jump contacts, readiness, or an individual power optimum." },
  "Muscle growth": { goal: "Muscle growth", sessionSetBand: [12, 24], workingSetCue: "Use enough technically sound work to accumulate recoverable volume; exercise- and athlete-specific set needs differ.", repetitionCue: `Growth can occur across a broad loading spectrum when effort and technique are appropriate; ${trainingEvidence.hypertrophy.workingRepetitions[0]}–${trainingEvidence.hypertrophy.workingRepetitions[1]} repetitions is one practical option, not a required zone.`, restCue: `Rest for at least about ${trainingEvidence.hypertrophy.restFloorSeconds} seconds and extend it when doing so preserves useful repetitions, load, and technique.`, weeklyVolumeCue: `Approximately ${trainingEvidence.hypertrophy.weeklyHardSetStartingReference} weekly hard sets per muscle can be a starting reference; ${trainingEvidence.hypertrophy.trainedWeeklySetContext[0]}–${trainingEvidence.hypertrophy.trainedWeeklySetContext[1]} is a study context in trained young men, not a personal target. Adjust for performance, fatigue, recovery, and compound-lift contribution.`, evidenceBoundary },
  "Max strength": { goal: "Max strength", sessionSetBand: [9, 18], workingSetCue: "Keep primary work heavy and quality-focused; 2–3 sets per primary exercise is a general starting anchor, not a fixed athlete requirement.", repetitionCue: `Primary work often emphasizes lower-repetition loading, with a ${trainingEvidence.strength.primaryWorkingRepetitions[0]}–${trainingEvidence.strength.primaryWorkingRepetitions[1]} repetition emphasis used in many advanced strength programs; assistance work can extend the practice dose.`, restCue: `About 3–5 minutes can help preserve repeated high-force efforts; ${trainingEvidence.strength.trainedRestFloorSeconds / 60} minutes is a useful trained-athlete floor reference, while exercise complexity, load, and readiness can require a different interval.`, weeklyVolumeCue: "Protect high-quality practice and recoverable exposure rather than adding sets solely to increase a count.", evidenceBoundary },
  Capacity: { goal: "Capacity", sessionSetBand: [12, 22], workingSetCue: "Use progressive, repeatable work sets or timed intervals while preserving position and movement quality.", repetitionCue: "Higher-repetition or timed work can support local endurance; 15+ repetitions with lighter-to-moderate resistance is a traditional reference, not a rule for every exercise.", restCue: "Shorter rests can be useful when quality remains repeatable; use less than 90 seconds as a reference rather than a mandatory limit.", weeklyVolumeCue: "Build repeatability progressively and track comparable performance over time instead of targeting one universal weekly set total.", evidenceBoundary: "Capacity guidance is a planning model. It does not measure aerobic fitness, sport workload, or individual fatigue tolerance." },
};

/** A saved goal is read back from storage, so it is checked against the four goals before it indexes the targets. */
export const isTrainingGoal = (value: unknown): value is TrainingGoal => typeof value === "string" && Object.prototype.hasOwnProperty.call(programmingTargets, value);

const parseNumber = (value: string | undefined, fallback: number) => Number.parseInt(value?.match(/\d+/)?.[0] || "", 10) || fallback;

export const getExerciseSettings = (settings: Record<number, ExerciseSettings>, exerciseId: number) => settings[exerciseId] || defaultSettings;

export const getProgrammingTarget = (goal: TrainingGoal) => programmingTargets[goal];

export function getGoalPrescription(goal: TrainingGoal, index: number) {
  if (goal === "Max strength") return index < 2 ? "4 × 3–5" : "3 × 6–8";
  if (goal === "Muscle growth") return `3 × ${trainingEvidence.hypertrophy.workingRepetitions[0]}–${trainingEvidence.hypertrophy.workingRepetitions[1]}`;
  if (goal === "Capacity") return index < 2 ? "4 × 8–12" : "3 × 12–20";
  return index < 2 ? "4 × 3–6" : "3 × 6–10";
}

/**
 * One reading of a plan entry's prescription for every screen: the Plan editor, the picker,
 * print and share, the review panels, Train (DeviceWorkoutTracker) and the planned atlas
 * (specialization/planBouts). Each passes the exercise's measure: the atlas's for the screens
 * that load it, `catalogMeasureOf` (shared/specialization/holdCatalogIds) for the first screens.
 */
export type PrescriptionMeasure = "reps" | "seconds";

/**
 * A hold's default target. The goal's defaults are rep ranges ("3 × 6–10"), and a rep range on a
 * hold reads as seconds on the set card ("6–10 sec") while meaning nothing the athlete chose; a
 * hold gets a hold's target instead.
 */
export const holdDefaultTarget = "30 sec";
/** A hold's default with no goal to take a set count from. */
export const holdDefaultPrescription = `3 × ${holdDefaultTarget}`;

/**
 * The default for an entry with nothing of its own. A rep exercise takes the goal's default for
 * its position. A hold takes the goal's set count for that position with a hold's target
 * ("4 × 30 sec" where the goal says "4 × 3–6"), so every plan reader that counts sets from the
 * goal's default (the weekly volume map, Today, the week review) still counts the same sets.
 */
function defaultPrescriptionOf(index: number, goal: TrainingGoal | undefined, measure: PrescriptionMeasure | undefined): string | undefined {
  const goalDefault = goal ? getGoalPrescription(goal, index) : undefined;
  if (measure !== "seconds") return goalDefault;
  return goalDefault ? `${parseSetCount(goalDefault)} × ${holdDefaultTarget}` : holdDefaultPrescription;
}

/** Every goal's default for every place in a day: the texts the planner pins on an entry it builds. */
const trainingGoals = ["Athleticism", "Muscle growth", "Max strength", "Capacity"] as const satisfies readonly TrainingGoal[];
// Every goal is listed: a goal added to TrainingGoal and not here fails to compile.
const everyGoalListed: Exclude<TrainingGoal, (typeof trainingGoals)[number]> extends never ? true : never = true;
void everyGoalListed;
const pinnedGoalDefaults: ReadonlySet<string> = new Set(trainingGoals.flatMap((goal) => [0, 1, 2, 3].map((index) => getGoalPrescription(goal, index))));

/**
 * The prescription every plan reader uses for an entry: the saved one, else the default for its
 * position (`defaultPrescriptionOf`), so a hold never gets a rep default.
 *
 * On a hold, a saved prescription that is one of the goals' defaults is read as the default it
 * is, with its own set count: "3 × 6–10" on a hang is "3 × 30 sec". The planner pins that text
 * on every entry when it builds a day or a week, so it says nothing the athlete chose; read
 * literally it would be a rep range taken as seconds. It is matched against every goal's default
 * for every position, not only this entry's: an entry moved within its day, or a goal changed
 * after the week was built, keeps the text it was pinned with. Any other saved text is the
 * athlete's and is kept. The stored text is not rewritten: a rep exercise put in the hold's place
 * reads the goal's reps again.
 */
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal, measure?: PrescriptionMeasure): string;
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal | undefined, measure?: PrescriptionMeasure): string | undefined;
export function prescriptionOf(saved: string | undefined, index: number, goal: TrainingGoal | undefined, measure?: PrescriptionMeasure): string | undefined {
  if (saved && measure === "seconds" && pinnedGoalDefaults.has(saved.trim())) return `${parseSetCount(saved)} × ${holdDefaultTarget}`;
  if (saved) return saved;
  return defaultPrescriptionOf(index, goal, measure);
}

/** What the session review says when it has nothing else to say. */
export const NOTHING_TO_REVIEW_PROMPT = "The active stack has workable variety for a single training session. Use the movement gaps as context, not a requirement to add everything.";

export function getWorkoutDiagnostics(workout: Exercise[], prescriptions: Record<number, string>, settings: Record<number, ExerciseSettings>, goal: TrainingGoal = "Athleticism", gymMinutes = 60): WorkoutDiagnostics {
  const genome = getWorkoutGenome(workout);
  const baseTarget = getProgrammingTarget(goal);
  const gymTimeBudget = getGymTimeBudget(gymMinutes);
  const target = { ...baseTarget, sessionSetBand: timeAdjustedSetBand(goal, baseTarget.sessionSetBand, gymMinutes), restCue: `${baseTarget.restCue} ${gymTimeBudget.restGuidance}` };
  const totalSets = workout.reduce((total, exercise, index) => total + parseNumber(prescriptions[exercise.id] || getGoalPrescription(goal, index), logicCalibration.workoutReview.defaultPrescriptionSets), 0);
  const averageRest = workout.length ? workout.reduce((total, exercise) => total + parseNumber(getExerciseSettings(settings, exercise.id).rest, logicCalibration.workoutReview.defaultRestSeconds), 0) / workout.length : 0;
  const fatigueExposure = workout.length ? Math.round(workout.reduce((total, exercise) => total + getExerciseGenome(exercise).fatigue.systemic, 0) / workout.length) : 0;
  const averageRpe = workout.length ? workout.reduce((total, exercise) => total + parseNumber(getExerciseSettings(settings, exercise.id).rpe, logicCalibration.workoutReview.defaultRpe), 0) / workout.length : 0;
  const estimatedMinutes = Math.max(0, Math.round(totalSets * (1.05 + averageRest / 60)));
  const sessionLoad = Math.round(totalSets * averageRpe);
  const prompts: string[] = [];
  if (!workout.length) prompts.push("Add a first exercise or load a smart draft to calculate session balance.");
  if (genome.redundancy >= logicCalibration.workoutReview.highRedundancyReview) prompts.push("Review overlapping exercises before adding more sets; variation may improve marginal value.");
  if (fatigueExposure >= logicCalibration.workoutReview.highFatigueReview) prompts.push("This stack has a higher fatigue cost. Keep high-skill work early and leave recovery between hard sessions.");
  if (totalSets > target.sessionSetBand[1]) prompts.push(`${totalSets} planned work sets is above this goal’s current ${target.sessionSetBand[0]}–${target.sessionSetBand[1]} planning band. Confirm that the added volume has a clear purpose and remains recoverable.`);
  if (workout.length >= 3 && totalSets < target.sessionSetBand[0]) prompts.push(`${totalSets} planned work sets is below this goal’s current ${target.sessionSetBand[0]}–${target.sessionSetBand[1]} planning band. That can be appropriate for a lighter day, skill emphasis, or a dense training week.`);
  if (goal === "Max strength" && averageRest < logicCalibration.workoutReview.shortStrengthRestSeconds) prompts.push("Strength emphasis is paired with relatively short rest. Consider whether longer rest would preserve load and technique for the primary sets.");
  if (goal === "Athleticism" && averageRpe >= logicCalibration.workoutReview.highAthleticismRpe) prompts.push("Athleticism work is showing a high average RPE. Confirm that explosive and technical repetitions stay crisp rather than accumulating fatigue.");
  if (estimatedMinutes > gymTimeBudget.minutes) prompts.push(`The current estimate is about ${estimatedMinutes} minutes, above your ${gymTimeBudget.label} gym window. Reduce accessories, work sets, or avoid rushing priority-lift rest.`);
  if (estimatedMinutes <= gymTimeBudget.minutes - logicCalibration.workoutReview.unusedTimeMinutes && workout.length && gymTimeBudget.minutes >= 60) prompts.push(`This stack leaves meaningful room in your ${gymTimeBudget.label} window. Add work only if it fills a specific movement, muscle, or skill need.`);
  if (genome.gaps.length >= logicCalibration.workoutReview.broadPatternGapCount) prompts.push(`The session has limited pattern variety. Consider whether ${genome.gaps.slice(0, 2).join(" and ")} are useful for this day’s purpose.`);
  if (!prompts.length) prompts.push(NOTHING_TO_REVIEW_PROMPT);
  return { totalSets, estimatedMinutes, fatigueExposure, sessionLoad, redundancy: genome.redundancy, dominantPatterns: genome.dominantPatterns, dominantMuscles: genome.dominantMuscles, gaps: genome.gaps, prompts, target, gymTimeBudget };
}
