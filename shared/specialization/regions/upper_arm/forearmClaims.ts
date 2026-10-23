import type { Claim } from "../../types";
import { LOCATION_ONLY as FOREARM_LOCATION_ONLY, SEARCH_EXCERPT as FOREARM_SEARCH_EXCERPT, fn as forearmFn, look as forearmLook, src as forearmSrc } from "../forearm/review";
import { upperArmMuscleIds as m } from "./ids";

/**
 * The forearm's four claims on the biceps and brachialis, frozen in seed v1 with their keys:
 * `forearm:biceps.function`, `forearm:biceps.appearance`, `forearm:brachialis.function`,
 * `forearm:brachialis.appearance` (docs/specialization-atlas/10-multi-region.md §1.3, §10). Kept
 * beside the nodes they are about, first in `upperArmClaims` (claims.ts), and in a module of their
 * own so that the forearm's page, which shows them, loads them without the upper arm's own claims
 * (§6.1's download gate; regions/forearm/upperArmHome.ts). Moved here unchanged at wave A's integration.
 */
export const forearmClaimsOnUpperArm: Claim[] = [
  forearmFn({
    nodeId: m.biceps,
    statement: "Biceps brachii bends the elbow and turns the forearm palm-up; with the elbow bent it is the forearm's most powerful palm-up muscle.",
    sources: [forearmSrc("A50", "Introduction", FOREARM_SEARCH_EXCERPT)],
  }),
  forearmLook({
    nodeId: m.biceps,
    statement: "Biceps shapes the front of the upper arm. It is an upper-arm muscle and does not add forearm size.",
    sources: [forearmSrc("A50", "Introduction: attachments", FOREARM_LOCATION_ONLY)],
  }),

  forearmFn({
    nodeId: m.brachialis,
    statement: "Brachialis bends the elbow in every forearm position and does not turn the forearm; it is described as a pure elbow flexor.",
    sources: [forearmSrc("A51", "Introduction", FOREARM_SEARCH_EXCERPT)],
  }),
  forearmLook({
    nodeId: m.brachialis,
    statement: "Brachialis lies under the biceps in the lower front of the upper arm and may show at its sides. It is not a forearm muscle.",
    sources: [forearmSrc("A51", "Introduction: deeper than the biceps", FOREARM_LOCATION_ONLY)],
  }),
];
