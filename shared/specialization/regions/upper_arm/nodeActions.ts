import type { NodeAction } from "../../types";
import { forearmActionIds as a } from "../../actions/ids";
import { FOREARM_REGION_ID } from "../forearm/ids";
import { upperArmMuscleIds as ua } from "./ids";

/**
 * The biceps' and brachialis' node actions, as the forearm atlas shipped them (seed v1): each rests
 * on the forearm's function claim of the node (claims.ts), so its claim key names the forearm.
 * Node actions are global, one per node and action (docs/specialization-atlas/10-multi-region.md
 * §1.3): any page that shows these muscles' elbow flexion or supination reads these rows.
 */
const forearmRow = (nodeId: string, actionId: string, role: NodeAction["role"], claimId: string): NodeAction => ({
  nodeId,
  actionId,
  role,
  claimId,
  claimKey: `${FOREARM_REGION_ID}:${claimId}`,
});

export const upperArmNodeActions: NodeAction[] = [
  forearmRow(ua.biceps, a.elbowFlexion, "prime", "biceps.function"),
  forearmRow(ua.biceps, a.supination, "prime", "biceps.function"),

  forearmRow(ua.brachialis, a.elbowFlexion, "prime", "brachialis.function"),
];
