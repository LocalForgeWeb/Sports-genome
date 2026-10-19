import type { AnatomyNode } from "../../types";
import { UPPER_ARM_REGION_ID, upperArmMuscleIds } from "./ids";

/**
 * The upper arm's nodes. The biceps and brachialis shipped with the forearm atlas (seed v1) and
 * are frozen there: their ids, region, catalog key and the stored role `external` stay as they
 * are for good (docs/specialization-atlas/10-multi-region.md §1.3). Here they are what they are
 * in their home region, targets, and `storedRole` keeps the value the database holds.
 *
 * Their text is the forearm review's, moved unchanged. The sentences that speak from the
 * forearm's page ("does not add forearm size", "not a forearm target") become caveats of the
 * forearm's membership of them when the upper arm is promoted, and the nodes keep neutral text.
 */
export const upperArmNodes: AnatomyNode[] = [
  {
    id: upperArmMuscleIds.biceps, regionId: UPPER_ARM_REGION_ID, parentId: null, kind: "muscle", role: "target", storedRole: "external",
    name: "Biceps brachii", shortName: "Biceps", aliases: ["biceps"],
    layer: "surface", surfaceVisibility: "clear", status: "reviewed", catalogMuscleKey: "biceps", databaseMuscle: "biceps_brachii", border: null,
    location: "Front of the upper arm, crossing the elbow to the radius.",
    whatItDoes: "Bends your elbow and turns your palm up; with the elbow bent it is the strongest palm-up muscle.",
    shapeNote: "Shapes the front of the upper arm. It is an upper-arm muscle and does not add forearm size.",
    caveats: ["Shown only as another muscle that curls and palm-up turning load; not a forearm target."],
  },
  {
    id: upperArmMuscleIds.brachialis, regionId: UPPER_ARM_REGION_ID, parentId: null, kind: "muscle", role: "target", storedRole: "external",
    name: "Brachialis", shortName: "Brachialis", aliases: ["brachialis"],
    layer: "deep", surfaceVisibility: "partial", status: "reviewed", catalogMuscleKey: "brachialis", databaseMuscle: "brachialis", border: null,
    location: "Front of the lower upper arm, under the biceps, crossing the elbow to the ulna.",
    whatItDoes: "Bends your elbow, whichever way the palm faces. It does not turn the forearm.",
    shapeNote: "Mostly covered by the biceps; may show at the sides of the lower upper arm. It is not a forearm muscle.",
    caveats: ["Shown only as another muscle that curls load; not a forearm target."],
  },
];
