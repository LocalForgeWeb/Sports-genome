/**
 * Stable ids for the upper arm (docs/specialization-atlas/10-multi-region.md §1.2). The biceps and
 * brachialis ids shipped with the forearm atlas (seed v1) and are frozen; the rest are §1.2's, fixed
 * for wave A so its anatomy, mapping and drawing lanes can work from them in parallel. These
 * constants are what mappings, the drawing and the database seed refer to, so they never change
 * once shipped. A muscle that is renamed keeps its id.
 */

export const UPPER_ARM_REGION_ID = "upper_arm";

/** The upper arm's target muscles, in §1.2's order: the two frozen ids, then the triceps heads. */
export const upperArmMuscleIds = {
  biceps: "upper_arm.biceps",
  brachialis: "upper_arm.brachialis",
  tricepsLong: "upper_arm.triceps_long",
  tricepsLateral: "upper_arm.triceps_lateral",
  tricepsMedial: "upper_arm.triceps_medial",
} as const;

export type UpperArmMuscleId = (typeof upperArmMuscleIds)[keyof typeof upperArmMuscleIds];

/** Every target of the upper arm, in §1.2's order. */
export const upperArmTargetIds: readonly UpperArmMuscleId[] = Object.values(upperArmMuscleIds);

/**
 * The triceps as a whole: the parent of its three heads, kind `muscle`, role `group`. Neither drawn
 * nor selectable (§1.2, §7.3); it holds the `triceps` body-map key and groups the heads.
 */
export const upperArmGroupIds = {
  triceps: "upper_arm.triceps",
} as const;

/** Beside the targets, explained but never targeted. */
export const upperArmAdjacentIds = {
  coracobrachialis: "upper_arm.coracobrachialis",
} as const;

/**
 * The other regions' muscles the upper arm lists (§1.2): the forearm's brachioradialis, short name
 * `BR`. Written out rather than imported, because regions/forearm/ids.ts imports this file; equal
 * to `forearmMuscleIds.brachioradialis` (client/src/lib/specialization/upper_armAnatomy.test.ts).
 */
export const upperArmExternalIds = {
  brachioradialis: "forearm.br",
} as const;

/** The upper arm's first mapping version (§4.1), published by wave A. */
export const UPPER_ARM_MAPPING_VERSION = "upper_arm_mappings_v1";
