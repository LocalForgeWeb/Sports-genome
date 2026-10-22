import type { NodeAction } from "../../types";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../actions/ids";
import { FOREARM_REGION_ID } from "../forearm/ids";
import { UPPER_ARM_REGION_ID, upperArmAdjacentIds as adj, upperArmMuscleIds as m } from "./ids";

/**
 * Which joint actions each upper-arm node performs, each resting on a function claim of the same
 * node (claims.ts). Node actions are global, one per node and action (docs/specialization-atlas/
 * 10-multi-region.md §1.3): any page that shows one of these muscles reads these rows, and a page
 * shows an external member's rows only for its own actions, so the forearm page reads exactly the
 * three rows it shipped with.
 *
 * `prime` is a main action of the muscle; `assist` means it helps. Only prime rows name a missing
 * action in the page's suggestions (client/src/lib/specialization/recommendations.ts), so an
 * assist row lists a real but small action without driving them.
 *
 * - The biceps' and brachialis' elbow and forearm rows are the forearm's, as seed v1 shipped them:
 *   they rest on the forearm's function claims, so their claim keys name the forearm.
 * - The biceps helps raise the arm forward (assist): anatomy references list it and those that
 *   rate it call it weak (`upper_arm.biceps.function`). Listed, unlike the forearm's weak extras,
 *   because an assist row does not drive suggestions and without it no upper-arm muscle that can be
 *   mapped performs the region's shoulder flexion (the coracobrachialis is adjacent).
 * - The long head helps move the arm down and back (assist), the one head that crosses the shoulder.
 * - The lateral and medial heads share every action; their mappings split no work between them
 *   (`allocation: "shared"`, §1.2).
 * - The triceps parent has no row of its own: it acts through its heads, and is neither drawn nor
 *   selected (§7.3).
 *
 * Left out on purpose: the long head's and the coracobrachialis's adduction (not an upper-arm
 * region action; said in their claims), and the medial head's deepest fibres at the elbow joint's
 * capsule (no action id, no load moved, and their action is disputed; said in its claim).
 */
const forearmRow = (nodeId: string, actionId: string, role: NodeAction["role"], claimId: string): NodeAction => ({
  nodeId,
  actionId,
  role,
  claimId,
  claimKey: `${FOREARM_REGION_ID}:${claimId}`,
});

/** A row on the node's own upper-arm function claim, `upper_arm:<node id>.function`. */
const row = (nodeId: string, actionId: string, role: NodeAction["role"]): NodeAction => {
  const claimId = `${nodeId}.function`;
  return { nodeId, actionId, role, claimId, claimKey: `${UPPER_ARM_REGION_ID}:${claimId}` };
};

export const upperArmNodeActions: NodeAction[] = [
  forearmRow(m.biceps, a.elbowFlexion, "prime", "biceps.function"),
  forearmRow(m.biceps, a.supination, "prime", "biceps.function"),
  row(m.biceps, sh.flexion, "assist"),

  forearmRow(m.brachialis, a.elbowFlexion, "prime", "brachialis.function"),

  row(m.tricepsLong, a.elbowExtension, "prime"),
  row(m.tricepsLong, sh.extension, "assist"),

  row(m.tricepsLateral, a.elbowExtension, "prime"),

  row(m.tricepsMedial, a.elbowExtension, "prime"),

  row(adj.coracobrachialis, sh.flexion, "prime"),
];
