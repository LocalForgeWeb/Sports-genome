import type { SpecializationRegion } from "../../types";
import { UPPER_ARM_REGION_ID, upperArmMuscleIds } from "./ids";

/**
 * The upper arm, a reference region until the wave that promotes it (docs/specialization-atlas/
 * 10-multi-region.md §1.3, §9.1): registered as the home of the biceps and brachialis the forearm
 * lists, with no page. Its words are §1.1's, so other pages can name it ("Upper-arm muscles
 * credited here"). The label is the reference row's, as seed v1 wrote it; the promotion sets
 * "Upper arms" with the status.
 *
 * Its database row keeps seed v1's columns as seed v1 wrote them until that promotion (§5.2): the
 * label and status, no heading, entry label or words, sort order 0, no keys and no measures. Only
 * the columns schema v2 added come from this record before then, so the promotion is the one
 * change that writes the heading, sort order, keys, words and measures below
 * (client/src/lib/specialization/regionContent.test.ts holds the emitted row to seed v1's).
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
