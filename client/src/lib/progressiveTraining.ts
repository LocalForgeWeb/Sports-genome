export type LoggedPerformanceSet = {
  sessionId: number;
  completedAt: Date | string;
  catalogExerciseId?: number | null;
  exerciseName: string;
  actualWeight?: number | string | null;
  weightUnit: "lb" | "kg";
  actualReps?: number | null;
  actualRpe?: number | string | null;
  completed: boolean;
};

export type ProgressionExercise = {
  id: number;
  name: string;
  targetPrescription: string;
  primaryMuscles: string[];
  bodyWeightKg?: number;
};

export type ProgressionAction = "increase_load" | "add_repetitions" | "repeat" | "hold" | "reduce_load" | "insufficient_data";
export type ProgressionConfidence = "low" | "medium" | "high";

export type ExerciseProgressionRecommendation = {
  exerciseId: number;
  exerciseName: string;
  action: ProgressionAction;
  confidence: ProgressionConfidence;
  targetRange?: { min: number; max: number };
  latestAverageReps?: number;
  recentPerformanceChange?: number;
  relativePerformance?: number;
  comparableSessions: number;
  rationale: string;
  boundary: string;
};

export type MuscleSegmentSignal = {
  muscle: string;
  family: string;
  status: "progressing" | "steady" | "review" | "insufficient_data";
  contributingExercises: string[];
  confidence: ProgressionConfidence;
  rationale: string;
  boundary: string;
};

export type WeeklyProgressBucket = {
  weekStart: string;
  completedSets: number;
  estimatedPerformance: number;
  averageRpe?: number;
};

export type WeeklyProgressReview = {
  latest?: WeeklyProgressBucket;
  previous?: WeeklyProgressBucket;
  performanceChange?: number;
  prompts: string[];
  boundary: string;
};

type ProgressionEntry = { exercise: ProgressionExercise; recommendation: ExerciseProgressionRecommendation };

export function parseTargetRepRange(prescription: string) {
  const range = prescription.match(/(?:×|x)\s*(\d+)\s*(?:–|-|to)\s*(\d+)/i);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = prescription.match(/(?:×|x)\s*(\d+)/i);
  return single ? { min: Number(single[1]), max: Number(single[1]) } : undefined;
}

function canonicalLoad(weight: number | string | null | undefined, unit: "lb" | "kg") {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return unit === "kg" ? numeric : numeric * 0.45359237;
}

function sessionPerformance(sets: LoggedPerformanceSet[]) {
  const completed = sets.filter((set) => set.completed && set.actualReps && canonicalLoad(set.actualWeight, set.weightUnit));
  if (!completed.length) return undefined;
  const averageReps = completed.reduce((total, set) => total + (set.actualReps || 0), 0) / completed.length;
  const estimatedPerformance = completed.reduce((total, set) => {
    const load = canonicalLoad(set.actualWeight, set.weightUnit) || 0;
    return total + load * (1 + (set.actualReps || 0) / 30);
  }, 0) / completed.length;
  const rpeValues = completed.map((set) => Number(set.actualRpe)).filter((value) => Number.isFinite(value) && value > 0);
  const averageRpe = rpeValues.length ? rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length : undefined;
  return { averageReps, estimatedPerformance, averageRpe };
}

function confidenceForSessions(count: number): ProgressionConfidence {
  return count >= 3 ? "high" : count >= 2 ? "medium" : "low";
}

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function weekStart(value: Date | string) {
  const date = new Date(value);
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (normalized.getUTCDay() + 6) % 7;
  normalized.setUTCDate(normalized.getUTCDate() - offset);
  return normalized.toISOString().slice(0, 10);
}

export function getWeeklyProgressReview(exercises: ProgressionExercise[], history: LoggedPerformanceSet[]): WeeklyProgressReview {
  const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
  const names = new Set(exercises.map((exercise) => normalizeExerciseName(exercise.name)));
  const buckets = new Map<string, LoggedPerformanceSet[]>();
  history.filter((set) => set.completed && (exerciseIds.has(set.catalogExerciseId || -1) || names.has(normalizeExerciseName(set.exerciseName)))).forEach((set) => {
    const key = weekStart(set.completedAt);
    buckets.set(key, [...(buckets.get(key) || []), set]);
  });
  const summaries = Array.from(buckets.entries()).map(([weekStart, sets]) => {
    const completedSets = sets.filter((set) => canonicalLoad(set.actualWeight, set.weightUnit) && set.actualReps).length;
    const estimatedPerformance = sets.reduce((total, set) => {
      const load = canonicalLoad(set.actualWeight, set.weightUnit) || 0;
      return total + load * (1 + (set.actualReps || 0) / 30);
    }, 0) / Math.max(1, completedSets);
    const rpeValues = sets.map((set) => Number(set.actualRpe)).filter((value) => Number.isFinite(value) && value > 0);
    return { weekStart, completedSets, estimatedPerformance, averageRpe: rpeValues.length ? rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length : undefined };
  }).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const latest = summaries[0];
  const previous = summaries[1];
  const performanceChange = latest && previous && previous.estimatedPerformance > 0 ? (latest.estimatedPerformance - previous.estimatedPerformance) / previous.estimatedPerformance : undefined;
  const prompts = !latest ? ["Log completed comparable sets to begin a week-by-week review."] : !previous ? ["One calendar week is available. Complete another comparable week before interpreting change."] : performanceChange !== undefined && performanceChange <= -0.1 ? ["Comparable exercise-context performance was lower than the prior week. Review recovery, setup, and load before adding work."] : latest.averageRpe !== undefined && latest.averageRpe >= 9.5 ? ["This week’s recorded effort was very high. Hold progression until the next comparable exposure supports it."] : ["Use this week-over-week signal with the exercise and segment cards below; approve any planner change yourself."];
  return { latest, previous, performanceChange, prompts, boundary: "Weekly buckets summarize completed comparable exercise logs. They do not diagnose readiness, quantify individual muscle strength, or prove that any one session caused the change." };
}

export function buildApprovedProgressionNote(recommendation: { action: string; rationale: string }, existingNotes?: string) {
  const next = `Approved progression: ${recommendation.action.replace(/_/g, " ")}. ${recommendation.rationale}`;
  return [existingNotes, next].filter(Boolean).join("\n");
}

export function buildApprovedSegmentPriorityNote(signal: Pick<MuscleSegmentSignal, "muscle" | "rationale">, existingNotes?: string) {
  const next = `Approved segment focus: ${signal.muscle.replace(/_/g, " ")}. ${signal.rationale}`;
  return [existingNotes, next].filter(Boolean).join("\n");
}

export function getExerciseProgressionRecommendation(exercise: ProgressionExercise, history: LoggedPerformanceSet[]): ExerciseProgressionRecommendation {
  const matching = history.filter((set) => set.completed && (set.catalogExerciseId === exercise.id || (!set.catalogExerciseId && normalizeExerciseName(set.exerciseName) === normalizeExerciseName(exercise.name))));
  const bySession = new Map<number, LoggedPerformanceSet[]>();
  matching.forEach((set) => bySession.set(set.sessionId, [...(bySession.get(set.sessionId) || []), set]));
  const sessions = Array.from(bySession.entries())
    .map(([sessionId, sets]) => ({ sessionId, completedAt: new Date(sets[0]?.completedAt || 0), performance: sessionPerformance(sets) }))
    .filter((entry): entry is { sessionId: number; completedAt: Date; performance: NonNullable<ReturnType<typeof sessionPerformance>> } => Boolean(entry.performance))
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const targetRange = parseTargetRepRange(exercise.targetPrescription);
  const latest = sessions[0]?.performance;
  const previous = sessions[1]?.performance;
  const comparableSessions = sessions.length;
  const confidence = confidenceForSessions(comparableSessions);
  const boundary = "This is an exercise-context progression recommendation from comparable logged sets. It is not a direct muscle-strength measurement, a readiness diagnosis, or a mandatory plan change.";

  if (!targetRange || !latest) return { exerciseId: exercise.id, exerciseName: exercise.name, action: "insufficient_data", confidence: "low", comparableSessions, rationale: "Log completed load and repetition data against a recognizable prescription before the planner can compare this exercise.", boundary };

  const recentPerformanceChange = previous ? (latest.estimatedPerformance - previous.estimatedPerformance) / previous.estimatedPerformance : undefined;
  const relativePerformance = exercise.bodyWeightKg && exercise.bodyWeightKg > 0 ? latest.estimatedPerformance / exercise.bodyWeightKg : undefined;
  if (comparableSessions < 2) return { exerciseId: exercise.id, exerciseName: exercise.name, action: "insufficient_data", confidence, targetRange, latestAverageReps: latest.averageReps, relativePerformance, comparableSessions, rationale: `One comparable session is logged. Repeat ${targetRange.min}–${targetRange.max} reps to establish a trend before changing load.`, boundary };

  const materialDrop = recentPerformanceChange !== undefined && recentPerformanceChange <= -0.1;
  if (latest.averageRpe !== undefined && latest.averageRpe >= 9.5) return { exerciseId: exercise.id, exerciseName: exercise.name, action: "hold", confidence, targetRange, latestAverageReps: latest.averageReps, recentPerformanceChange, relativePerformance, comparableSessions, rationale: `Recorded effort averaged RPE ${latest.averageRpe.toFixed(1)}. Hold the current load or review recovery and technique before progressing.`, boundary };
  const highEffort = latest.averageRpe !== undefined && latest.averageRpe >= 9;
  const moderateEffort = latest.averageRpe !== undefined && latest.averageRpe > 8.5;
  if (latest.averageReps < targetRange.min && (materialDrop || comparableSessions >= 3 || highEffort)) return { exerciseId: exercise.id, exerciseName: exercise.name, action: "reduce_load", confidence, targetRange, latestAverageReps: latest.averageReps, recentPerformanceChange, relativePerformance, comparableSessions, rationale: `Recent completed work averaged below the ${targetRange.min}-rep floor${highEffort ? ` at RPE ${latest.averageRpe?.toFixed(1)}` : materialDrop ? " with a meaningful exercise-context performance drop" : " across multiple comparable sessions"}. Consider a lighter next available increment or confirm recovery and setup first.`, boundary };
  if (latest.averageReps >= targetRange.max && !moderateEffort && (recentPerformanceChange === undefined || recentPerformanceChange >= -0.03)) return { exerciseId: exercise.id, exerciseName: exercise.name, action: "increase_load", confidence, targetRange, latestAverageReps: latest.averageReps, recentPerformanceChange, relativePerformance, comparableSessions, rationale: `Recent completed work reached the ${targetRange.max}-rep ceiling${latest.averageRpe !== undefined ? ` at RPE ${latest.averageRpe.toFixed(1)}` : ""}. Consider the next available load increment, then return to the lower end of the range.`, boundary };
  if (latest.averageReps >= targetRange.min && !moderateEffort) return { exerciseId: exercise.id, exerciseName: exercise.name, action: "add_repetitions", confidence, targetRange, latestAverageReps: latest.averageReps, recentPerformanceChange, relativePerformance, comparableSessions, rationale: `Recent completed work is inside the ${targetRange.min}–${targetRange.max} range${latest.averageRpe !== undefined ? ` at RPE ${latest.averageRpe.toFixed(1)}` : ""}. Keep load steady and add repetitions before increasing load.`, boundary };
  return { exerciseId: exercise.id, exerciseName: exercise.name, action: "repeat", confidence, targetRange, latestAverageReps: latest.averageReps, recentPerformanceChange, relativePerformance, comparableSessions, rationale: `Repeat the current load${moderateEffort ? ` because recorded effort reached RPE ${latest.averageRpe?.toFixed(1)}` : ""} and aim for the ${targetRange.min}-rep floor before progressing.`, boundary };
}

function muscleFamily(muscle: string) {
  if (muscle.startsWith("deltoid_")) return "Deltoid";
  if (muscle.startsWith("trapezius_")) return "Trapezius";
  if (muscle.startsWith("pectoralis_")) return "Pectoralis";
  if (muscle.startsWith("quadriceps_")) return "Quadriceps";
  if (muscle.startsWith("hamstrings_")) return "Hamstrings";
  return muscle.replace(/_/g, " ");
}

function normalizeMuscleSegment(muscle: string) {
  if (muscle === "frontDelts") return "deltoid_anterior";
  if (muscle === "sideDelts") return "deltoid_lateral";
  if (muscle === "rearDelts") return "deltoid_posterior";
  return muscle;
}

const actionScore: Record<ProgressionAction, number> = { increase_load: 2, add_repetitions: 1, repeat: 0, hold: -1, reduce_load: -2, insufficient_data: 0 };

export function getMuscleSegmentSignals(exercises: ProgressionExercise[], history: LoggedPerformanceSet[]): MuscleSegmentSignal[] {
  const recommendations: ProgressionEntry[] = exercises.map((exercise) => ({ exercise, recommendation: getExerciseProgressionRecommendation(exercise, history) }));
  const byMuscle = new Map<string, ProgressionEntry[]>();
  recommendations.forEach((item) => item.exercise.primaryMuscles.forEach((rawMuscle) => {
    const muscle = normalizeMuscleSegment(rawMuscle);
    byMuscle.set(muscle, [...(byMuscle.get(muscle) || []), item]);
  }));

  return Array.from(byMuscle.entries()).map(([muscle, entries]: [string, ProgressionEntry[]]) => {
    const actionable: ProgressionEntry[] = entries.filter((entry: ProgressionEntry) => entry.recommendation.action !== "insufficient_data");
    const averageScore = actionable.length ? actionable.reduce((total: number, entry: ProgressionEntry) => total + actionScore[entry.recommendation.action], 0) / actionable.length : 0;
    const comparableSessions = actionable.reduce((total: number, entry: ProgressionEntry) => total + entry.recommendation.comparableSessions, 0);
    const confidence = confidenceForSessions(Math.round(comparableSessions / Math.max(1, actionable.length)));
    const status: MuscleSegmentSignal["status"] = !actionable.length ? "insufficient_data" : averageScore >= 0.75 ? "progressing" : averageScore <= -0.75 ? "review" : "steady";
    return {
      muscle,
      family: muscleFamily(muscle),
      status,
      contributingExercises: entries.map((entry: ProgressionEntry) => entry.exercise.name),
      confidence,
      rationale: status === "review" ? `Comparable exercise-context trends for this segment warrant a programming review before adding more work.` : status === "progressing" ? `Comparable exercise-context trends are moving within the planned progression model.` : status === "insufficient_data" ? `More completed, comparable logs are needed before this segment can be reviewed.` : `Comparable exercise-context trends are currently mixed or stable.`,
      boundary: "Segment status aggregates exercise-context progression signals. It does not directly measure the strength of an individual muscle head or establish a clinical imbalance.",
    };
  });
}
