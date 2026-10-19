/**
 * Stable ids every region shares. A region's own ids (its muscles, its mapping version) are in
 * `regions/<region>/ids.ts`, and joint action ids are with the shared action library
 * (`actions/`), since one action is named by several regions (docs/specialization-atlas/
 * 10-multi-region.md §1.3). These constants are what mappings, the drawings and the database
 * seed refer to, so they never change once shipped.
 */

export const EXPOSURE_RULE_VERSION = "specialization_exposure_v1";

/** Default variant id for a catalog exercise: one shared variant per exercise, `cat-<id>` (variants/). */
export const variantIdFor = (catalogExerciseId: number) => `cat-${catalogExerciseId}`;
