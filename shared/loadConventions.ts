/**
 * What a logged weight means for each catalog exercise (Backend V1 EN-07, EN-09; B025, B049,
 * B050, B051, B052).
 *
 * Copied from `strength_exercise_scoring_policy.load_semantics` for the catalog exercises
 * (`exercises.canonical_name` ending `__catalog_<id>`), read 28 September 2026. The database
 * scores by these conventions, so the app has to enter and send weights by them too:
 * - `per_implement`: the weight of ONE dumbbell. Entering the pair's total doubled the load
 *   the database read (the bench trace went from 43.10 to 95.00).
 * - `bodyweight_reps`: scored on reps alone. Any weight entered is added load, which the
 *   database's rep curves do not read (Pull-Up +20 kg x 5 scored the same as bodyweight x 5).
 * - `machine_displayed_load`: the number on the stack or dial.
 * - `per_hand`: the implement in each hand (loaded carries).
 * - `total_external_load`: everything else - the bar and its plates, a kettlebell, a sandbag.
 *
 * Three more arrived with the 50-exercise expansion (6 Oct 2026 brief §7), for exercises whose
 * typed number is not a load at all:
 * - `assistance`: the counterweight an assisted machine gives back. More of it is an easier set.
 * - `resistance_setting`: a band colour or a gripper model - a label, never kilograms.
 * - `no_external_load`: a self-resisted hold; nothing is typed but the time.
 *
 * `server/loadConventions.test.ts` pins every id to the client catalog. If the policy table
 * changes, regenerate this list from it.
 */
export type LoadConvention = "total_external_load" | "per_implement" | "machine_displayed_load" | "bodyweight_reps" | "per_hand" | "assistance" | "resistance_setting" | "no_external_load";

const ids = (list: string) => list.split(",").map(Number);

const BY_CONVENTION: Record<Exclude<LoadConvention, "total_external_load" | "assistance" | "resistance_setting" | "no_external_load">, readonly number[]> = {
  per_implement: ids("4,5,6,7,8,9,10,22,23,24,46,47,65,82,86,90,91,96,97,98,103,104,105,108,111,116,117,123,124,125,131,132,133,136,149,155,156,165,189,224"),
  bodyweight_reps: ids("26,27,28,29,30,31,32,33,34,35,36,38,39,40,66,67,68,69,72,73,74,75,76,77,78,120,138,158,159,175,178,182,184,192,199,201,210,211,225,231,232,233,234,237,238,241,242,243,272,293"),
  machine_displayed_load: ids("11,12,13,14,16,17,18,19,20,21,52,53,54,55,56,58,59,60,62,63,64,84,85,87,88,89,92,93,95,106,112,113,114,115,118,127,128,129,134,150,151,152,153,154,157,166,167,168,169,170,171,172,194,195,196,202,212,213,214,215,218,219,222,239,240,250,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,377,378,379"),
  per_hand: ids("299"),
};

const conventionById = new Map<number, LoadConvention>();
for (const [convention, list] of Object.entries(BY_CONVENTION) as [LoadConvention, readonly number[]][]) {
  for (const id of list) conventionById.set(id, convention);
}

/**
 * Catalog ids 401-450, the 50-exercise expansion, every one classified on purpose - including the
 * ones whose answer is the default - so no new exercise reaches `total_external_load` by falling
 * through (brief §5). The prepared migration writes the same semantics into the database policy
 * (docs/exercise-expansion-v1/migrations), and `shared/exerciseMeasurement.ts` says how each one is
 * logged.
 */
const EXPANSION_V1: Readonly<Record<number, LoadConvention>> = {
  401: "machine_displayed_load", 402: "machine_displayed_load", 403: "machine_displayed_load",
  404: "total_external_load", 405: "resistance_setting", 406: "resistance_setting",
  407: "no_external_load", 408: "no_external_load",
  409: "per_implement", 410: "per_implement", 411: "per_implement", 412: "per_implement",
  413: "machine_displayed_load", 414: "total_external_load", 415: "total_external_load",
  416: "resistance_setting", 417: "resistance_setting", 418: "total_external_load",
  419: "machine_displayed_load", 420: "assistance", 421: "assistance",
  422: "machine_displayed_load", 423: "machine_displayed_load", 424: "machine_displayed_load",
  425: "machine_displayed_load", 426: "machine_displayed_load", 427: "machine_displayed_load",
  428: "machine_displayed_load", 429: "machine_displayed_load", 430: "machine_displayed_load",
  431: "total_external_load", 432: "total_external_load", 433: "total_external_load",
  434: "total_external_load", 435: "total_external_load", 436: "bodyweight_reps",
  437: "per_implement", 438: "machine_displayed_load", 439: "machine_displayed_load",
  440: "per_implement", 441: "per_hand", 442: "per_hand", 443: "per_hand",
  444: "total_external_load", 445: "total_external_load", 446: "total_external_load",
  447: "total_external_load", 448: "machine_displayed_load", 449: "per_implement",
  450: "machine_displayed_load",
};

/** The convention for a catalog exercise; total external load when the policy names none. */
export function loadConventionFor(catalogExerciseId: number | null | undefined): LoadConvention {
  if (catalogExerciseId == null) return "total_external_load";
  return conventionById.get(catalogExerciseId) ?? EXPANSION_V1[catalogExerciseId] ?? "total_external_load";
}

/** Every catalog id the policy classifies, for the test that pins them to the catalog. */
export function classifiedCatalogIds(): Map<number, LoadConvention> {
  return new Map(conventionById);
}

/** Every expansion id and its reviewed convention, for the validator and the migration parity check. */
export function expansionLoadConventions(): Map<number, LoadConvention> {
  return new Map(Object.entries(EXPANSION_V1).map(([id, convention]) => [Number(id), convention]));
}

/** True when the convention says the typed number is not load lifted, so it has no external volume. */
export const conventionCarriesNoLoad = (convention: LoadConvention) =>
  convention === "bodyweight_reps" || convention === "assistance" || convention === "resistance_setting" || convention === "no_external_load";
