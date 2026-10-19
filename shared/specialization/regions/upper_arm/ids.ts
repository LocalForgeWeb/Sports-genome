/**
 * Stable ids for the upper arm. The biceps and brachialis ids shipped with the forearm atlas
 * (seed v1) and are frozen; the other muscles of §1.2 (docs/specialization-atlas/
 * 10-multi-region.md) are added here by the wave that promotes the upper arm.
 */

export const UPPER_ARM_REGION_ID = "upper_arm";

export const upperArmMuscleIds = {
  biceps: "upper_arm.biceps",
  brachialis: "upper_arm.brachialis",
} as const;
