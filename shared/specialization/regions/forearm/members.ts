import type { RegionMember } from "../../types";
import { coreForearmMuscleIds, externalContributorIds as ext, forearmAdjacentIds as adj, forearmGroupIds as grp } from "./ids";

/**
 * The nodes the forearm page lists, in its order (docs/specialization-atlas/10-multi-region.md
 * §1.3): its own (nodes.ts) and, as external members, the upper arm's biceps and brachialis. No
 * role is written here: the forearm's own nodes keep their home role and the upper-arm muscles
 * are external (`memberRole`, compose.ts).
 *
 * The words about the biceps and brachialis that speak from the forearm's page are this page's
 * caveats on them, not the nodes' (§1.3): the forearm's review wrote them on the nodes in seed v1,
 * and the upper arm keeps neutral anatomy text on its nodes. The page says them after the node's own.
 */
const caveatsOf: Partial<Record<string, string[]>> = {
  [ext.biceps]: ["It is an upper-arm muscle and does not add forearm size.", "Shown only as another muscle that curls and palm-up turning load; not a forearm target."],
  [ext.brachialis]: ["It is not a forearm muscle.", "Shown only as another muscle that curls load; not a forearm target."],
};

export const forearmMembers: RegionMember[] = [
  grp.anterior,
  grp.posterior,
  ...coreForearmMuscleIds,
  adj.anconeus,
  ext.biceps,
  ext.brachialis,
].map((nodeId, sortOrder) => {
  const caveats = caveatsOf[nodeId];
  return caveats ? { nodeId, sortOrder, caveats } : { nodeId, sortOrder };
});
