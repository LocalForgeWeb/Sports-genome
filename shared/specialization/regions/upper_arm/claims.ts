import type { Claim } from "../../types";
import { LOCATION_ONLY, SEARCH_EXCERPT, fn, look, src } from "../forearm/review";
import { upperArmMuscleIds as ua } from "./ids";

/**
 * The forearm's four claims on the biceps and brachialis, kept beside the nodes they are about.
 * They belong to the forearm (`ownerRegionId: "forearm"`, from its review of 16 Oct 2026) and
 * keep their keys for good: `forearm:biceps.function`, `forearm:biceps.appearance`,
 * `forearm:brachialis.function`, `forearm:brachialis.appearance` (docs/specialization-atlas/
 * 10-multi-region.md §1.3). The upper arm's own claims, when it is promoted, are its own, with ids
 * of the full node id and the kind (`upper_arm.biceps.appearance`).
 */
export const upperArmClaims: Claim[] = [
  fn({
    nodeId: ua.biceps,
    statement: "Biceps brachii bends the elbow and turns the forearm palm-up; with the elbow bent it is the forearm's most powerful palm-up muscle.",
    sources: [src("A50", "Introduction", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: ua.biceps,
    statement: "Biceps shapes the front of the upper arm. It is an upper-arm muscle and does not add forearm size.",
    sources: [src("A50", "Introduction: attachments", LOCATION_ONLY)],
  }),

  fn({
    nodeId: ua.brachialis,
    statement: "Brachialis bends the elbow in every forearm position and does not turn the forearm; it is described as a pure elbow flexor.",
    sources: [src("A51", "Introduction", SEARCH_EXCERPT)],
  }),
  look({
    nodeId: ua.brachialis,
    statement: "Brachialis lies under the biceps in the lower front of the upper arm and may show at its sides. It is not a forearm muscle.",
    sources: [src("A51", "Introduction: deeper than the biceps", LOCATION_ONLY)],
  }),
];
