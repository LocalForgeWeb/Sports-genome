import type { SpecializationRegion } from "../../types";
import { UPPER_ARM_REGION_ID, upperArmMuscleIds } from "./ids";

/**
 * The upper arm, a reference region until the wave that promotes it (docs/specialization-atlas/
 * 10-multi-region.md §1.3, §9.1): registered as the home of the biceps and brachialis the forearm
 * lists, with no page. Its words are §1.1's, so other pages can name it ("Upper-arm muscles
 * credited here"). The label is the reference row's, as seed v1 wrote it; the promotion sets
 * "Upper arms" with the status.
 */
export const upperArmRegion: SpecializationRegion = {
  id: UPPER_ARM_REGION_ID,
  label: "Upper arm",
  heading: "Upper-arm specialization",
  sortOrder: 8,
  status: "reference",
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
    progressSubtitle: "Arm circumference, by arm",
    sideWord: "arm",
    sideWordPlural: "arms",
    onSideTemplate: "your {side} upper arm",
  },
  measurementMetrics: ["circumference_cm"],
  measurementDefaults: {
    circumference_cm: { landmark: "Middle of the upper arm", posture: "arm_relaxed_hanging" },
  },
};
