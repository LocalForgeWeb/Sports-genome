import type { Exercise } from "./exerciseCatalog";
import type { ExerciseActionConnection } from "./movementProgramAnalysis";
import type { MovementSupport, SupportRow } from "./movementSupport";
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

/**
 * "direct" keeps the movement-specific exercises (named in the action's record);
 * "supporting" keeps the related-pattern and muscle-support ones. Both read the
 * movement support tiers through the connection.
 */
export function filterCatalogByActionLink(
  exerciseList: Exercise[],
  actionLink: CatalogFilters["actionLink"],
  connectionForExercise?: (exercise: Exercise) => ExerciseActionConnection,
) {
  if (actionLink === "all" || !connectionForExercise) return exerciseList;
  const keep: ExerciseActionConnection["label"][] = actionLink === "direct" ? ["Movement-specific"] : ["Related pattern", "Muscle support"];
  return exerciseList.filter((exercise) => keep.includes(connectionForExercise(exercise).label));
}

/** The structural refinements, one exercise at a time: category, pattern, equipment, muscle and favorites. */
function passesStructuralFilters(exercise: Exercise, filters: CatalogFilters, favoriteIds: ReadonlySet<number>) {
  return (filters.category === "all" || exercise.category === filters.category)
    && (filters.movement === "all" || exercise.movement === filters.movement)
    && (filters.equipment === "all" || exercise.equipment === filters.equipment)
    && (filters.muscle === "all" || exercise.primaryMuscles.includes(filters.muscle) || exercise.secondaryMuscles.includes(filters.muscle))
    && (!filters.favoritesOnly || favoriteIds.has(exercise.id));
}

/**
 * The structural filters narrow the pool; the query then finds names in it the
 * way an athlete types them (see exerciseSearch), best match first. With no
 * query the catalog keeps its own order.
 */
export function filterCatalogExercises(exerciseList: Exercise[], filters: CatalogFilters, favoriteIds: Set<number>) {
  const pool = exerciseList.filter((exercise) => passesStructuralFilters(exercise, filters, favoriteIds));
  return searchExercises(pool, filters.query);
}

/**
 * The athlete's refinements (equipment and the other filters, the search text,
 * favorites) applied inside each movement support tier. A refinement only ever
 * removes rows: nothing moves between tiers, nothing is added, and each tier keeps
 * its own order (a search does not re-rank a tier). The action-link filter does not
 * apply here; the tiers are that answer. `status` still describes the record, so
 * "every match filtered away" (no rows left, status "ok") stays distinct from "no
 * named matches" in the data.
 */
export function refineMovementSupport(support: MovementSupport, filters: CatalogFilters, favoriteIds: ReadonlySet<number>): MovementSupport {
  const query = filters.query.trim();
  const refine = (rows: SupportRow[]) => {
    const pool = rows.filter((row) => passesStructuralFilters(row.exercise, filters, favoriteIds));
    if (!query) return pool;
    const found = new Set(searchExercises(pool.map((row) => row.exercise), query).map((exercise) => exercise.id));
    return pool.filter((row) => found.has(row.exercise.id));
  };
  return { ...support, specific: refine(support.specific), related: refine(support.related), muscle: refine(support.muscle) };
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
