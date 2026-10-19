import type { SpecializationRegion } from "../../types";
import { FOREARM_REGION_ID, forearmMuscleIds } from "./ids";

export const forearmRegion: SpecializationRegion = {
  id: FOREARM_REGION_ID,
  label: "Forearms",
  heading: "Forearm specialization",
  sortOrder: 10,
  status: "production",
  sides: { model: "paired", limb: "arm" },
  bodyMapKeys: ["forearms", "brachioradialis"],
  // What the target nodes' catalog keys gave before catalog keys were written out.
  catalogKeys: ["forearms"],
  // As shipped: primary and secondary tags (docs/specialization-atlas/10-multi-region.md §1.1).
  regionOnlyTagScope: "any",
  entryLabel: "Explore forearm coverage",
  nodeForBodyMapKey: { brachioradialis: forearmMuscleIds.brachioradialis },
  wording: {
    externalGroup: "Upper-arm muscles credited here",
    externalHeading: "Forearm muscles credited here",
    incidentalWork: "grip",
    progressSubtitle: "Circumference and grip, by arm",
    sideWord: "arm",
    sideWordPlural: "arms",
    onSideTemplate: "your {side} forearm",
  },
  measurementMetrics: ["circumference_cm", "grip_force_n"],
  measurementDefaults: {
    circumference_cm: { landmark: "Thickest point", posture: "arm_relaxed_hanging" },
    grip_force_n: { landmark: "Dynamometer grip", posture: "elbow_90_supported" },
  },
};
