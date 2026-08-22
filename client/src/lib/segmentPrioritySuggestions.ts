import type { MuscleSegmentSignal } from "./progressiveTraining";

export type SegmentPriorityExerciseCandidate = {
  id: number;
  name: string;
  equipment: string;
  primaryMuscles: string[];
};

export type SegmentPrioritySuggestion = {
  targetMuscle: string;
  exerciseId: number;
  exerciseName: string;
  equipment: string;
  rationale: string;
  boundary: string;
};

function normalizedSegment(muscle: string) {
  if (muscle === "frontDelts") return "deltoid_anterior";
  if (muscle === "sideDelts") return "deltoid_lateral";
  if (muscle === "rearDelts") return "deltoid_posterior";
  return muscle;
}

function normalizedEquipment(equipment: string) {
  return equipment.trim().toLowerCase().replace(/s$/, "");
}

export function getSegmentPrioritySuggestions(
  signal: MuscleSegmentSignal,
  activeExerciseIds: number[],
  catalog: SegmentPriorityExerciseCandidate[],
  availableEquipment: string[] = [],
): SegmentPrioritySuggestion[] {
  if (signal.status !== "review") return [];
  const target = normalizedSegment(signal.muscle);
  const active = new Set(activeExerciseIds);
  const permittedEquipment = new Set(availableEquipment.map(normalizedEquipment));
  return catalog
    .filter((exercise) => !active.has(exercise.id))
    .filter((exercise) => exercise.primaryMuscles.map(normalizedSegment).includes(target))
    .filter((exercise) => !permittedEquipment.size || permittedEquipment.has(normalizedEquipment(exercise.equipment)))
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((exercise) => ({
      targetMuscle: target,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      equipment: exercise.equipment,
      rationale: `${exercise.name} is a directly tagged catalog option for the reviewed ${target.replace(/_/g, " ")} segment and is not already in this Training Day.`,
      boundary: "This is an optional catalog suggestion from direct exercise tags, current-day coverage, and the selected equipment filter. It is not a prescription or a direct measurement of muscle strength.",
    }));
}
