import type { Exercise, Grade } from "./exerciseCatalog";

export type CatalogFilters = {
  query: string;
  category: string;
  movement: string;
  equipment: string;
  muscle: string;
  sportTier: "all" | "A" | "S";
  favoritesOnly: boolean;
};

export const defaultCatalogFilters: CatalogFilters = {
  query: "",
  category: "all",
  movement: "all",
  equipment: "all",
  muscle: "all",
  sportTier: "all",
  favoritesOnly: false,
};

const gradeScore: Record<Grade, number> = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5, SS: 6 };

export function bestSportScore(exercise: Exercise) {
  return Math.max(...Object.values(exercise.sportFit).map((fit) => gradeScore[fit.grade]));
}

export function filterCatalogExercises(exerciseList: Exercise[], filters: CatalogFilters, favoriteIds: Set<number>) {
  const query = filters.query.trim().toLowerCase();
  const tierFloor = filters.sportTier === "S" ? gradeScore.S : filters.sportTier === "A" ? gradeScore.A : 0;

  return exerciseList.filter((exercise) => {
    const searchable = [
      exercise.name,
      exercise.category,
      exercise.movement,
      exercise.equipment,
      ...exercise.primaryMuscles,
      ...exercise.secondaryMuscles,
      ...exercise.qualities,
    ].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (filters.category === "all" || exercise.category === filters.category)
      && (filters.movement === "all" || exercise.movement === filters.movement)
      && (filters.equipment === "all" || exercise.equipment === filters.equipment)
      && (filters.muscle === "all" || exercise.primaryMuscles.includes(filters.muscle) || exercise.secondaryMuscles.includes(filters.muscle))
      && (!tierFloor || bestSportScore(exercise) >= tierFloor)
      && (!filters.favoritesOnly || favoriteIds.has(exercise.id));
  });
}

export function catalogFilterOptions(exerciseList: Exercise[]) {
  const unique = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  return {
    categories: unique(exerciseList.map((exercise) => exercise.category)),
    movements: unique(exerciseList.map((exercise) => exercise.movement)),
    equipment: unique(exerciseList.map((exercise) => exercise.equipment)),
    muscles: unique(exerciseList.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles])),
  };
}
