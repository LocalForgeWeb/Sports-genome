/** Gym Optimizer: deterministic movement coverage and redundancy analysis. */
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { getMovementRecommendations } from "@/lib/movementRecommendations";
import { getEnrichedMovement, type EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { logicCalibration } from "@/lib/evidenceTraceability";

const muscleAliases: Record<string, string[]> = {
  chest: ["pectoralis major", "pectoralis minor"],
  frontDelts: ["anterior deltoid"],
  sideDelts: ["middle deltoid", "lateral deltoid"],
  rearDelts: ["posterior deltoid"],
  shoulders: ["deltoid"],
  triceps: ["triceps brachii"],
  biceps: ["biceps brachii"],
  brachialis: ["brachialis"],
  forearms: ["forearm", "finger flexor", "finger extensor", "wrist flexor", "wrist extensor"],
  abs: ["rectus abdominis", "transversus abdominis"],
  obliques: ["oblique"],
  quads: ["quadriceps", "rectus femoris", "vastus"],
  glutes: ["gluteus maximus", "gluteus medius", "gluteus minimus"],
  hamstrings: ["hamstring", "biceps femoris", "semitendinosus", "semimembranosus"],
  calves: ["gastrocnemius", "soleus", "plantar flexor"],
  tibialis: ["tibialis anterior", "tibialis posterior"],
  adductors: ["adductor", "gracilis", "pectineus"],
  abductors: ["abductor", "gluteus medius", "gluteus minimus"],
  lats: ["latissimus dorsi"],
  upperBack: ["rhomboid", "middle trapezius", "lower trapezius", "upper trapezius", "scapular stabilizer"],
  traps: ["trapezius"],
  lowerBack: ["erector spinae", "multifidus", "spinal erector"],
  rotatorCuff: ["rotator cuff", "infraspinatus", "teres minor", "subscapularis", "supraspinatus"],
};

const muscleTagsFor = (name: string) => {
  const lower = name.toLowerCase();
  return Object.entries(muscleAliases)
    .filter(([, aliases]) => aliases.some((alias) => lower.includes(alias)))
    .map(([tag]) => tag);
};

const overlap = (left: string[], right: string[]) => {
  const a = new Set(left);
  const b = new Set(right);
  const shared = Array.from(a).filter((value) => b.has(value)).length;
  const total = new Set([...left, ...right]).size || logicCalibration.movementProgramAnalysis.nonZeroCoverageDenominator;
  return shared / total;
};

export type MuscleCoverage = {
  name: string;
  role: "Prime mover" | "Assisting muscle" | "Stabilizer";
  catalogTags: string[];
  coveredBy: Exercise[];
};

export type RedundancyFlag = {
  left: Exercise;
  right: Exercise;
  level: "Review overlap" | "Purposeful overlap";
  rationale: string;
};

export type WorkoutMovementAnalysis = {
  primeMovers: MuscleCoverage[];
  assistingMuscles: MuscleCoverage[];
  stabilizers: MuscleCoverage[];
  coverage: { covered: number; total: number; percent: number; label: string; strengths: string[]; priorities: string[] };
  redundancyFlags: RedundancyFlag[];
};

function roleCoverage(names: string[], role: MuscleCoverage["role"], workout: Exercise[]): MuscleCoverage[] {
  return names.map((name) => {
    const catalogTags = muscleTagsFor(name);
    const coveredBy = workout.filter((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((muscle) => catalogTags.includes(muscle)));
    return { name, role, catalogTags, coveredBy };
  });
}

export function analyzeWorkoutForMovement(movement: EnrichedSportMovement, workout: Exercise[]): WorkoutMovementAnalysis {
  const primeMovers = roleCoverage(movement.primeMovers, "Prime mover", workout);
  const assistingMuscles = roleCoverage(movement.assistingMuscles, "Assisting muscle", workout);
  const stabilizers = roleCoverage(movement.stabilizers, "Stabilizer", workout);
  const all = [...primeMovers, ...assistingMuscles, ...stabilizers];
  const covered = all.filter((item) => item.coveredBy.length).length;
  const percent = Math.round((covered / Math.max(logicCalibration.movementProgramAnalysis.nonZeroCoverageDenominator, all.length)) * logicCalibration.movementProgramAnalysis.displayScaleMaximum);
  const strengths = [
    ...primeMovers.filter((item) => item.coveredBy.length),
    ...assistingMuscles.filter((item) => item.coveredBy.length),
    ...stabilizers.filter((item) => item.coveredBy.length),
  ].map((item) => item.name).slice(0, logicCalibration.movementProgramAnalysis.displayedStrengthLimit);
  const priorities = [
    ...primeMovers.filter((item) => !item.coveredBy.length),
    ...stabilizers.filter((item) => !item.coveredBy.length),
    ...assistingMuscles.filter((item) => !item.coveredBy.length),
  ].map((item) => item.name).slice(0, logicCalibration.movementProgramAnalysis.displayedPriorityLimit);
  const redundancyFlags: RedundancyFlag[] = [];
  workout.forEach((left, index) => workout.slice(index + 1).forEach((right) => {
    const leftMuscles = [...left.primaryMuscles, ...left.secondaryMuscles];
    const rightMuscles = [...right.primaryMuscles, ...right.secondaryMuscles];
    const muscleOverlap = overlap(leftMuscles, rightMuscles);
    const qualityOverlap = overlap(left.qualities, right.qualities);
    const sameMovement = left.movement.toLowerCase() === right.movement.toLowerCase();
    const closelySimilar = muscleOverlap >= logicCalibration.movementProgramAnalysis.closelySimilarMuscleOverlap && qualityOverlap >= logicCalibration.movementProgramAnalysis.closelySimilarQualityOverlap;
    if ((sameMovement && muscleOverlap >= logicCalibration.movementProgramAnalysis.sameMovementMuscleOverlap) || closelySimilar) {
      const level = qualityOverlap >= logicCalibration.movementProgramAnalysis.reviewQualityOverlap ? "Review overlap" : "Purposeful overlap";
      const rationale = sameMovement
        ? (qualityOverlap >= logicCalibration.movementProgramAnalysis.reviewQualityOverlap ? `Both use a ${left.movement.toLowerCase()} pattern with substantial target-muscle and quality overlap.` : `Both share a ${left.movement.toLowerCase()} pattern, but their quality emphasis differs enough to review rather than automatically remove either.`)
        : `Their movement labels differ, but target-muscle and quality overlap are high enough to review the combined session dose.`;
      redundancyFlags.push({ left, right, level, rationale });
    }
  }));
  return {
    primeMovers,
    assistingMuscles,
    stabilizers,
    coverage: { covered, total: all.length, percent, label: `${percent}% training coverage`, strengths, priorities },
    redundancyFlags,
  };
}

export type MovementAssistance = { exercise: Exercise; rationale: string; source: "Movement record" | "Catalog match" };

const nameMatches = (exercise: Exercise, phrase: string) => {
  const words = phrase.toLowerCase().split(/[^a-z]+/).filter((word) => word.length >= logicCalibration.movementProgramAnalysis.minimumMatchWordLength);
  const name = exercise.name.toLowerCase();
  const matched = words.filter((word) => name.includes(word));
  return words.length >= logicCalibration.movementProgramAnalysis.minimumMatchWords && matched.length >= logicCalibration.movementProgramAnalysis.minimumMatchWords;
};

export function getMovementAssistance(movement: EnrichedSportMovement, fallback: SportMovementProfile, limit: number = logicCalibration.recommendation.assistanceLimit): MovementAssistance[] {
  const direct = exercises.filter((exercise) => movement.recommendedExercises.some((name) => nameMatches(exercise, name))).map((exercise) => ({ exercise, rationale: `Listed for ${movement.recommendedExercisePatterns.join(" · ")} support.`, source: "Movement record" as const }));
  const catalog = getMovementRecommendations(fallback, logicCalibration.recommendation.assistanceFallbackLimit).map((result) => ({ exercise: result.exercise, rationale: result.rationale, source: "Catalog match" as const }));
  return [...direct, ...catalog].filter((entry, index, list) => list.findIndex((candidate) => candidate.exercise.id === entry.exercise.id) === index).slice(0, limit);
}

export function lookupEnrichedMovement(sportId: string, movementId: string) {
  return getEnrichedMovement(sportId, movementId);
}
