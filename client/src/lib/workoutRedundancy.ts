import type { Exercise } from "./exerciseCatalog";
import { logicCalibration } from "./evidenceTraceability";

export type WorkoutRedundancyFinding = {
  firstExercise: string;
  secondExercise: string;
  classification: "Likely duplicate" | "Useful reinforcement" | "Complementary";
  reason: string;
  boundary: string;
};

function overlap(left: string[], right: string[]) {
  return left.filter((muscle) => right.includes(muscle));
}

function exerciseIntent(exercise: Exercise) {
  return /fly|raise|curl|extension|pushdown|pullover/i.test(exercise.name) ? "isolation" : "compound";
}

export function analyzeWorkoutRedundancy(workout: Exercise[]): WorkoutRedundancyFinding[] {
  const findings: WorkoutRedundancyFinding[] = [];
  for (let index = 0; index < workout.length; index += 1) {
    for (let comparison = index + 1; comparison < workout.length; comparison += 1) {
      const first = workout[index];
      const second = workout[comparison];
      const sharedPrimary = overlap(first.primaryMuscles, second.primaryMuscles);
      const sameMovement = first.movement === second.movement;
      const sameIntent = exerciseIntent(first) === exerciseIntent(second);
      const classification: WorkoutRedundancyFinding["classification"] = sameMovement && sharedPrimary.length && sameIntent ? "Likely duplicate" : sharedPrimary.length ? "Useful reinforcement" : "Complementary";
      const reason = classification === "Likely duplicate"
        ? `${first.name} and ${second.name} share the ${first.movement.toLowerCase()} pattern and primary exposure. Review whether the second exercise has a distinct planning purpose.`
        : classification === "Useful reinforcement"
          ? `${first.name} and ${second.name} share ${sharedPrimary.map((muscle) => muscle.replace(/_/g, " ")).join(", ")} while using different movement contexts; this can be purposeful reinforcement.`
          : `${first.name} and ${second.name} are complementary movement exposures rather than a direct duplicate.`;
      findings.push({ firstExercise: first.name, secondExercise: second.name, classification, reason, boundary: "This is a planning-overlap estimate from catalog movement and muscle context. It does not measure recovery, individual technique, or the value of an exercise in isolation." });
    }
  }
  const order: Record<WorkoutRedundancyFinding["classification"], number> = {
    "Likely duplicate": logicCalibration.workoutRedundancy.likelyDuplicateDisplayOrder,
    "Useful reinforcement": logicCalibration.workoutRedundancy.usefulReinforcementDisplayOrder,
    Complementary: logicCalibration.workoutRedundancy.complementaryDisplayOrder,
  };
  return findings.sort((left, right) => order[left.classification] - order[right.classification]);
}
