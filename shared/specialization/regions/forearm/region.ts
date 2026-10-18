import type { SpecializationRegion } from "../../types";
import { FOREARM_REGION_ID, forearmMuscleIds } from "../../ids";

export const forearmRegion: SpecializationRegion = {
  id: FOREARM_REGION_ID,
  label: "Forearms",
  heading: "Forearm specialization",
  sortOrder: 10,
  status: "production",
  bodyMapKeys: ["forearms", "brachioradialis"],
  entryLabel: "Explore forearm coverage",
  nodeForBodyMapKey: { brachioradialis: forearmMuscleIds.brachioradialis },
  wording: {
    externalGroup: "Upper-arm muscles credited here",
    incidentalWork: "grip",
    progressSubtitle: "Circumference and grip, by arm",
  },
  measurementMetrics: ["circumference_cm", "grip_force_n"],
};
