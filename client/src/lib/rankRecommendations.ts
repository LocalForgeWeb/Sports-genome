import rankable from "@/data/rankableExercises.json";
import { exercises as catalog, type Exercise } from "./exerciseCatalog";
import { exercisePhotoSet } from "./exercisePhotos";
import { muscleCanonicalNameToRegionId } from "@shared/capabilityRank";

/**
 * Which lift to log to get a rank for a muscle group that has none yet: "I want my chest
 * ranking - what do I log?"
 *
 * A muscle group is ranked from the lifts behind it (shared/capabilityRank.ts,
 * regionRanksFromMuscles): a lift ranks a group when the database can score it against a
 * comparison group and it works one of the group's muscles as a primary or secondary mover. A
 * muscle a lift only steadies is never ranked by it. `rankableExercises.json` is that list, read
 * from the scorer itself (scripts/strength/rankable-exercises.sql): 244 of the 400 catalog
 * exercises, each with how it is scored and the muscles it works. So a suggestion here is a lift
 * that will actually produce the rank, not one that merely trains the muscle.
 *
 * Order, best first:
 * 1. The group's muscles are a primary mover, not a helper: a bench press before a dip for chest.
 * 2. Compared with lifters who log this exact lift, before one compared through a related lift.
 * 3. More of the lift's work lands on this group (the share of its working-muscle weight), which is
 *    also what makes a lift count for more in the group's rank (server/muscleAggregation.ts, D-016).
 * Then the list is spread across equipment, so a barbell, a dumbbell and a machine option come
 * before three barbell variations.
 */

type Mapping = [muscle: string, role: string, weight: number];
type Entry = [mode: "load" | "reps", basis: "direct" | "related", mappings: Mapping[]];
const table = (rankable as unknown as { exercises: Record<string, Entry> }).exercises;

export type RankingLift = {
  exercise: Exercise;
  /** How the lift is logged for a rank: a loaded set, or a set of reps with no added load. */
  mode: "load" | "reps";
  /** Compared with this exact lift's data, or through a closely related lift's. */
  basis: "direct" | "related";
  /** The group's muscles are a primary mover in this lift, or a helper. */
  role: "primary" | "secondary";
  /** Share of the lift's working-muscle weight on this group, 0-1. */
  focus: number;
};

const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));

/** Every catalog exercise that can produce a rank for this muscle group, best first. */
export function rankingLiftsForRegion(regionId: string): RankingLift[] {
  const lifts: RankingLift[] = [];
  for (const [id, [mode, basis, mappings]] of Object.entries(table)) {
    const exercise = byId.get(Number(id));
    if (!exercise) continue;
    const total = mappings.reduce((sum, [, , weight]) => sum + weight, 0);
    const here = mappings.filter(([muscle]) => muscleCanonicalNameToRegionId[muscle] === regionId);
    if (!here.length || total <= 0) continue;
    lifts.push({
      exercise,
      mode,
      basis,
      role: here.some(([, role]) => role === "primary") ? "primary" : "secondary",
      focus: here.reduce((sum, [, , weight]) => sum + weight, 0) / total,
    });
  }
  return lifts.sort((a, b) =>
    Number(b.role === "primary") - Number(a.role === "primary")
    || Number(b.basis === "direct") - Number(a.basis === "direct")
    || b.focus - a.focus
    || Number(Boolean(exercisePhotoSet(b.exercise.id))) - Number(Boolean(exercisePhotoSet(a.exercise.id)))
    || a.exercise.name.localeCompare(b.exercise.name));
}

/**
 * The lift most people already know for each group, offered first so the answer to "what do I
 * log for a chest rank?" is a bench press rather than a fly. Each one is checked against the
 * scorer's list by a test: it must be rankable and work the group (rankRecommendations.test.ts).
 * Standing Calf Raise has no comparison data, so calves start from the seated raise.
 */
export const familiarRankingLift: Readonly<Record<string, string>> = {
  chest: "Barbell Bench Press",
  shoulders: "Barbell Overhead Press",
  upper_back: "Seated Cable Row",
  lats: "Lat Pulldown",
  biceps: "Barbell Curl",
  triceps: "Cable Triceps Pushdown",
  forearms_grip: "Wrist Curl",
  abdominals: "Cable Crunch",
  obliques: "Cable Wood Chop",
  spinal_erectors: "Conventional Deadlift",
  glutes: "Barbell Hip Thrust",
  hip_flexors: "Hanging Knee Raise",
  hip_adductors: "Hip Adduction Machine",
  hip_abductors: "Hip Abduction Machine",
  quadriceps: "Back Squat",
  hamstrings: "Romanian Deadlift",
  calves: "Seated Calf Raise",
};

/**
 * A few lifts to suggest: the familiar one first, then the best of the rest spread across
 * equipment, leaving out anything already logged for the group (it is either behind the rank
 * already or named with the reason it was not counted).
 */
export function suggestedRankingLifts(regionId: string, options: { limit?: number; exclude?: ReadonlySet<string> } = {}): RankingLift[] {
  const { limit = 3, exclude = new Set<string>() } = options;
  const pool = rankingLiftsForRegion(regionId).filter((lift) => !exclude.has(lift.exercise.name.toLowerCase()));
  const picked: RankingLift[] = [];
  const equipment = new Set<string>();
  const familiar = pool.find((lift) => lift.exercise.name === familiarRankingLift[regionId]);
  if (familiar && limit > 0) { picked.push(familiar); equipment.add(familiar.exercise.equipment); }
  // First pass: the best lift for each piece of equipment, in order, among the strongest choices
  // (primary movers when there are any). Second pass fills any remaining places in order.
  const strongest = pool.filter((lift) => lift.role === pool[0]?.role);
  for (const lift of strongest) {
    if (picked.length >= limit) break;
    if (picked.includes(lift) || equipment.has(lift.exercise.equipment)) continue;
    picked.push(lift);
    equipment.add(lift.exercise.equipment);
  }
  for (const lift of pool) {
    if (picked.length >= limit) break;
    if (!picked.includes(lift)) picked.push(lift);
  }
  return picked;
}

/** True when no lift in the comparison data can rank this group yet. */
export function regionHasRankingLifts(regionId: string): boolean {
  return rankingLiftsForRegion(regionId).length > 0;
}

/** Why this lift, in a short line: how it works the group, and what it is compared with. */
export function rankingLiftReason(lift: RankingLift, regionLabel: string): string {
  const role = lift.role === "primary" ? "Main mover" : "Helper";
  const compared = lift.basis === "direct" ? "compared on this exact lift" : "compared through a related lift";
  return `${role} for ${regionLabel.toLowerCase()} · ${compared}`;
}

/** What to log, said only where it differs from an ordinary set of weight and reps. */
export function rankingLiftHowTo(lift: RankingLift): string | null {
  return lift.mode === "reps" ? "Log your best set of reps with no added weight." : null;
}
