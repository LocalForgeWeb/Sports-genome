import type { Exercise } from "./exerciseCatalog";
import type { ExerciseActionConnection } from "./movementProgramAnalysis";
import { searchExercises } from "./exerciseSearch";

export type CatalogFilters = {
  query: string;
  category: string;
  movement: string;
  equipment: string;
  muscle: string;
  actionLink: "all" | "direct" | "supporting";
  favoritesOnly: boolean;
};

export const defaultCatalogFilters: CatalogFilters = {
  query: "",
  category: "all",
  movement: "all",
  equipment: "all",
  muscle: "all",
  actionLink: "all",
  favoritesOnly: false,
};

export function filterCatalogByActionLink(
  exerciseList: Exercise[],
  actionLink: CatalogFilters["actionLink"],
  connectionForExercise?: (exercise: Exercise) => ExerciseActionConnection,
) {
  if (actionLink === "all" || !connectionForExercise) return exerciseList;
  const requiredLabel = actionLink === "direct" ? "Direct support" : "Supporting link";
  return exerciseList.filter((exercise) => connectionForExercise(exercise).label === requiredLabel);
}

/**
 * The structural filters narrow the pool; the query then finds names in it the
 * way an athlete types them (see exerciseSearch), best match first. With no
 * query the catalog keeps its own order.
 */
export function filterCatalogExercises(exerciseList: Exercise[], filters: CatalogFilters, favoriteIds: Set<number>) {
  const pool = exerciseList.filter((exercise) =>
    (filters.category === "all" || exercise.category === filters.category)
      && (filters.movement === "all" || exercise.movement === filters.movement)
      && (filters.equipment === "all" || exercise.equipment === filters.equipment)
      && (filters.muscle === "all" || exercise.primaryMuscles.includes(filters.muscle) || exercise.secondaryMuscles.includes(filters.muscle))
      && (!filters.favoritesOnly || favoriteIds.has(exercise.id)));
  return searchExercises(pool, filters.query);
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
