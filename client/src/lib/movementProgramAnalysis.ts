/** Gym Optimizer: deterministic movement coverage and redundancy analysis. */
import type { Exercise } from "@/lib/exerciseCatalog";
import { getMovementRecommendations } from "@/lib/movementRecommendations";
import { getEnrichedMovement, type EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { logicCalibration } from "@/lib/evidenceTraceability";
import { catalogKeysForRecordMuscle } from "@/lib/recordMuscleKeys";
import { catalogSupportForRecord, classifyExerciseForMovement, supportTierLabel } from "@/lib/movementSupport";

// The movement support model lives in movementSupport; it is re-exported here so
// this stays the one place the app asks how an exercise relates to a sport movement.
export * from "@/lib/movementSupport";

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
    const catalogTags = catalogKeysForRecordMuscle(name);
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

/**
 * Gym support for an action: its movement-specific exercises (the ones its record
 * names, from movementSupport) first, then the Matches engine's list to fill the rest.
 */
export function getMovementAssistance(movement: EnrichedSportMovement, fallback: SportMovementProfile, limit: number = logicCalibration.recommendation.assistanceLimit): MovementAssistance[] {
  const direct = catalogSupportForRecord(movement).specific.map((row) => ({ exercise: row.exercise, rationale: `${row.reason}.`, source: "Movement record" as const }));
  const catalog = getMovementRecommendations(fallback, logicCalibration.recommendation.assistanceFallbackLimit).map((result) => ({ exercise: result.exercise, rationale: result.rationale, source: "Catalog match" as const }));
  return [...direct, ...catalog].filter((entry, index, list) => list.findIndex((candidate) => candidate.exercise.id === entry.exercise.id) === index).slice(0, limit);
}

export function lookupEnrichedMovement(sportId: string, movementId: string) {
  return getEnrichedMovement(sportId, movementId);
}

export type ExerciseActionConnection = {
  label: "Movement-specific" | "Related pattern" | "Muscle support" | "Not mapped";
  detail: string;
};

/**
 * The same connection, stated once for a whole list instead of on every row.
 *
 * The genome selector printed this label on all 24 visible rows, and measured
 * across the default view and three searches it held ONE value in three of
 * those four states - twenty-four identical badges in the accent colour, each
 * repeating what the one above it said. A label earns its place on a row by
 * differing from its neighbours; when it does not, the fact is still true, just
 * true of the list, so it belongs in the list's own header.
 */
export function sharedConnectionSummary(label: ExerciseActionConnection["label"], count: number): string {
  const subject = count === 1 ? "This one" : `All ${count}`;
  if (label === "Movement-specific") return `${subject} ${count === 1 ? "is" : "are"} named in its movement record.`;
  if (label === "Related pattern") return `${subject} share${count === 1 ? "s" : ""} a pattern with an exercise its record names.`;
  if (label === "Muscle support") return `${subject} train${count === 1 ? "s" : ""} one of its prime movers, without a movement-specific link.`;
  return `${count === 1 ? "It has" : `None of the ${count} has`} a mapped link to it.`;
}

/**
 * How one exercise relates to the selected action, read from the movement support
 * tiers so the catalog rows, the exercise details and the genome panel say what the
 * movement-mode list says. Sharing only an assisting or stabilizing muscle is no
 * longer a link: it covered most of the catalog and told the athlete nothing.
 */
export function getExerciseActionConnection(exercise: Exercise, movement?: EnrichedSportMovement): ExerciseActionConnection {
  if (!movement) return { label: "Not mapped", detail: "No enriched record is available for the selected action." };
  const row = classifyExerciseForMovement(exercise, movement);
  if (!row) return { label: "Not mapped", detail: "Not named in the action's movement record, and it trains none of the action's prime movers." };
  return { label: supportTierLabel[row.tier], detail: row.reason.endsWith(".") ? row.reason : `${row.reason}.` };
}

/**
 * The same connection, worked out once per exercise for one selected action.
 *
 * The catalog asks for it on every search keystroke and filter change, and the
 * action-link filter asks for all 400 exercises at once. The answer depends only
 * on the exercise and the action, so one lookup per action can keep it.
 */
export function createActionConnectionLookup(movement?: EnrichedSportMovement): (exercise: Exercise) => ExerciseActionConnection {
  const cache = new Map<number, ExerciseActionConnection>();
  return (exercise) => {
    const cached = cache.get(exercise.id);
    if (cached) return cached;
    const connection = getExerciseActionConnection(exercise, movement);
    cache.set(exercise.id, connection);
    return connection;
  };
}
