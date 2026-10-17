/**
 * The catalog exercises the atlas measures in seconds held, by catalog id: the one fact about an
 * exercise that the app's first screens need from the atlas (07-logger.md, "One reading of a
 * hold's prescription").
 *
 * Home's Plan editor, its picker, print and share, and the workout history load with the first
 * screen, so they must not import the atlas's region data (`loggingPolicy.ts` reads every
 * region's variants and mappings; `registry.ts` carries the drawing, claims and sources too).
 * This list is that measure and nothing else, a few bytes in the main bundle. It imports
 * nothing.
 *
 * It is a copy, kept equal to the variants by a test
 * (client/src/lib/specialization/holdCatalogIds.test.ts): a variant whose `measure` changes, or a
 * region added with holds of its own, fails that test until the id is added or removed here.
 *
 * 142 Plate Pinch, 143 Dead Hang, 144 Towel Dead Hang, 145 Farmer Hold, 299 Farmer's Walk,
 * 300 Zercher Carry, 400 Battle Rope Alternating Waves, 403 Gripper Hold, 409 Suitcase Carry.
 */
export const holdCatalogIds: ReadonlySet<number> = new Set([142, 143, 144, 145, 299, 300, 400, 403, 409]);

/** What a catalog exercise's sets are measured in: seconds for a hold, else reps (also for no id). */
export function catalogMeasureOf(catalogExerciseId: number | null | undefined): "reps" | "seconds" {
  return catalogExerciseId !== null && catalogExerciseId !== undefined && holdCatalogIds.has(catalogExerciseId) ? "seconds" : "reps";
}
