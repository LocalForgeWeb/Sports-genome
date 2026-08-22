import type { Exercise } from "@/lib/exerciseCatalog";
import { getExerciseGenome } from "@/lib/exerciseGenome";

export type RedundancyClassification = "Likely duplicate" | "Useful reinforcement" | "Complementary";

export type WorkoutRedundancyFinding = {
  first: Exercise;
  second: Exercise;
  classification: RedundancyClassification;
  overlapScore: number;
  reason: string;
};

const overlap = (first: string[], second: string[]) => {
  const union = new Set([...first, ...second]);
  if (!union.size) return 0;
  return first.filter((item) => second.includes(item)).length / union.size;
};

/**
 * A planning heuristic for identifying pairs that may add little new exposure.
 * It does not measure individual fatigue, technique, recovery, or adaptation.
 */
export function analyzeWorkoutRedundancy(workout: Exercise[]): WorkoutRedundancyFinding[] {
  const findings: WorkoutRedundancyFinding[] = [];
  workout.forEach((first, index) => workout.slice(index + 1).forEach((second) => {
    const firstGenome = getExerciseGenome(first);
    const secondGenome = getExerciseGenome(second);
    const primaryOverlap = overlap(first.primaryMuscles, second.primaryMuscles);
    const patternOverlap = overlap(firstGenome.movementPatterns, secondGenome.movementPatterns);
    const sharedSecondary = overlap(first.secondaryMuscles, second.secondaryMuscles);
    const sameResistanceBias = firstGenome.resistanceProfile.bias === secondGenome.resistanceProfile.bias;
    const score = Math.round(Math.min(100, primaryOverlap * 54 + patternOverlap * 28 + sharedSecondary * 8 + (sameResistanceBias ? 10 : 0)));
    const biasContrast = !sameResistanceBias && primaryOverlap >= .35;
    const classification: RedundancyClassification = score >= 68
      ? "Likely duplicate"
      : biasContrast || (primaryOverlap >= .35 && patternOverlap < .5)
        ? "Useful reinforcement"
        : "Complementary";
    const reason = classification === "Likely duplicate"
      ? `Similar primary-muscle, movement-pattern, and ${firstGenome.resistanceProfile.bias.toLowerCase()}-bias signals make this pair a candidate to consolidate unless each has a separate programmed purpose.`
      : classification === "Useful reinforcement"
        ? `This pair overlaps on target tissue but differs in movement or resistance-profile emphasis, which can be a useful reinforcement when the session has a clear dose and sequence.`
        : `This pair has limited direct pattern and primary-target overlap, so it is treated as complementary rather than duplicate work.`;
    findings.push({ first, second, classification, overlapScore: score, reason });
  }));
  return findings.sort((first, second) => second.overlapScore - first.overlapScore);
}
