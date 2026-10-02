/**
 * Two vocabularies, one athlete.
 *
 * The split register names what a day should train - a Pull day wants
 * "rhomboids". The catalog tags what an exercise trains, and it has no
 * `rhomboids` key at all: the forty-five rows, pulls and rear-delt flys that
 * train them are tagged `upperBack`. Nothing bridged the two, so all three
 * places the name travelled to were broken at once:
 *
 *   - `involvement()` asked the catalog for a key it does not have, so a Pull
 *     day's rhomboid coverage scored 0 whatever was added to it. The shortfall
 *     could never close.
 *   - the shortfall chip that produced set the picker's muscle filter to
 *     `rhomboids`, which matched no exercise, so the one-tap fix for the gap
 *     returned an empty list.
 *   - the muscle filter never offered it, because its options were built from
 *     catalog primaries.
 *
 * One resolver, used by the analysis and by the picker, so that a muscle the
 * app can name is a muscle the app can find work for.
 *
 * It is a synonym map rather than a rename of either side. Both names are
 * correct for what they describe: "rhomboids" is the muscle a Pull day is short
 * of, and `upperBack` is the region the catalog tags, which covers the
 * rhomboids and the mid traps together. Collapsing them would lose that.
 *
 * The filter list carries the catalog's name once, and finds it by either:
 * offering both would be two rows returning the same exercises.
 */

/** Catalog keys that train a muscle the rest of the app can name. */
export const catalogKeysByMuscle: Record<string, readonly string[]> = {
  rhomboids: ["upperBack"],
};

/** The catalog keys to search for a muscle - itself, unless it has a synonym. */
export function catalogKeysFor(muscle: string): readonly string[] {
  return catalogKeysByMuscle[muscle] ?? [muscle];
}

/**
 * The single key the muscle filter should hold for a muscle.
 *
 * A gap chip reports the register's name, and setting that as the filter value
 * left the control displaying a muscle that was not among its options.
 */
export function muscleFilterKey(muscle: string): string {
  return catalogKeysFor(muscle)[0] ?? muscle;
}

/** The other names an option answers to, so typing either one finds it. */
export function searchAliasesFor(catalogKey: string): string[] {
  return Object.entries(catalogKeysByMuscle)
    .filter(([, keys]) => keys.includes(catalogKey))
    .map(([muscle]) => muscle);
}

type Tagged = { primaryMuscles: readonly string[]; secondaryMuscles: readonly string[] };

/** How an exercise trains a muscle, through whichever catalog key carries it. */
export function trainsMuscle(exercise: Tagged, muscle: string): "primary" | "secondary" | null {
  const keys = catalogKeysFor(muscle);
  if (keys.some((key) => exercise.primaryMuscles.includes(key))) return "primary";
  if (keys.some((key) => exercise.secondaryMuscles.includes(key))) return "secondary";
  return null;
}

/**
 * Every muscle worth offering as a filter, in the order the athlete reads them.
 *
 * Primaries and supporting tags both, because the filter matches both. Offering
 * only primaries left four muscles that exercises really do train - the rotator
 * cuff, the spinal erectors, the hip flexors, the feet - unselectable.
 *
 * Sorted by the label, not by the key. Sorting the keys put "Hip abductors,
 * Rectus abdominis, Hip adductors, Biceps brachii" at the top of the list,
 * which is `abductors, abs, adductors, biceps` - alphabetical to the code and
 * arbitrary to everyone else.
 */
export function selectableMuscles(
  exercises: readonly Tagged[],
  labelFor: (muscle: string) => string,
): string[] {
  const offered = new Set<string>();
  exercises.forEach((exercise) => {
    exercise.primaryMuscles.forEach((key) => offered.add(key));
    exercise.secondaryMuscles.forEach((key) => offered.add(key));
  });
  return Array.from(offered).sort((a, b) => labelFor(a).localeCompare(labelFor(b), undefined, { sensitivity: "base" }));
}
