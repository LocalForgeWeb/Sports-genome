import type { Exercise } from "./exerciseCatalog";

export type TrainingSplit = "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body" | "Sport Transfer";

const pushCategories = new Set(["Chest & push", "Arms & push", "Shoulders"]);
const pullCategories = new Set(["Back & pull", "Arms & grip", "Scapular control"]);
const lowerCategories = new Set(["Knee dominant", "Posterior chain", "Hips & glutes", "Lower leg"]);
const sportTransferCategories = new Set(["Medicine ball", "Plyometric", "Conditioning", "Landmine", "Core"]);

function includesMovement(exercise: Exercise, values: string[]) {
  const text = `${exercise.name} ${exercise.movement}`.toLowerCase();
  return values.some((value) => text.includes(value));
}

export function matchesTrainingSplit(exercise: Exercise, split: TrainingSplit) {
  const isPush = pushCategories.has(exercise.category) && !includesMovement(exercise, ["row", "pull", "chin"]);
  const isPull = pullCategories.has(exercise.category) && !includesMovement(exercise, ["press", "dip", "push-up"]);
  const isLower = lowerCategories.has(exercise.category) || exercise.category === "Plyometric" && includesMovement(exercise, ["jump", "bound", "hop"]);
  const isSportTransfer = sportTransferCategories.has(exercise.category)
    || exercise.qualities.some((quality) => ["power", "rotation", "stability", "coordination", "mobility", "conditioning"].includes(quality.toLowerCase()));

  if (split === "Push") return isPush;
  if (split === "Pull") return isPull;
  if (split === "Legs" || split === "Lower") return isLower;
  if (split === "Upper") return isPush || isPull;
  if (split === "Full Body") return isPush || isPull || isLower || isSportTransfer;
  return isSportTransfer;
}

export function getSplitExercisePool(exercises: Exercise[], split: TrainingSplit, sportSeed: Exercise[] = []) {
  const strictPool = exercises.filter((exercise) => matchesTrainingSplit(exercise, split));
  if (split !== "Sport Transfer") return strictPool;

  const sportMatches = sportSeed.filter((exercise) => matchesTrainingSplit(exercise, split));
  const ordered = [...sportMatches, ...strictPool];
  return ordered.filter((exercise, index) => ordered.findIndex((item) => item.id === exercise.id) === index);
}
