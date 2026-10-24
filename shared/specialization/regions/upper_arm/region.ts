import type { SpecializationRegion } from "../../types";
import { UPPER_ARM_REGION_ID, upperArmMuscleIds } from "./ids";

/**
 * The upper arm, promoted from reference to production by wave A (docs/specialization-atlas/
 * 10-multi-region.md §1.1, §1.3, §9.1): its page, its label "Upper arms", its words and keys as §1.1
 * gives them, and limb circumference as its measure (§4.4; §11, decision 8), with no side in the
 * Progress subtitle (appendix "Both sides as one"). It stays the home of the biceps and brachialis
 * the forearm lists, and credits them there through its own published version (§4.2).
 *
 * Its database row was written by seed v1 as a reference row (label "Upper arm", no heading, sort
 * order 0, no keys, no measures; schema v2's columns from seed v2). Seed v3 writes the promotion,
 * the one change §5.2 allows to an existing region row's schema v1 columns, before it publishes
 * `upper_arm_mappings_v1` (rule 13: a version's region must have a page).
 */
export const upperArmRegion: SpecializationRegion = {
  id: UPPER_ARM_REGION_ID,
  label: "Upper arms",
  heading: "Upper-arm specialization",
  sortOrder: 8,
  status: "production",
  sides: { model: "paired", limb: "arm" },
  bodyMapKeys: ["biceps", "brachialis", "triceps"],
  catalogKeys: ["biceps", "brachialis", "triceps"],
  regionOnlyTagScope: "primary",
  entryLabel: "Explore upper-arm coverage",
  nodeForBodyMapKey: { biceps: upperArmMuscleIds.biceps, brachialis: upperArmMuscleIds.brachialis },
  wording: {
    externalGroup: "Forearm muscles credited here",
    externalHeading: "Upper-arm muscles credited here",
    incidentalWork: "steadying",
    progressSubtitle: "Arm circumference",
    sideWord: "arm",
    sideWordPlural: "arms",
    onSideTemplate: "your {side} upper arm",
  },
  measurementMetrics: ["circumference_cm"],
  measurementDefaults: {
    circumference_cm: { landmark: "Middle of the upper arm", posture: "arm_relaxed_hanging" },
  },
};
