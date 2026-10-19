import type { RegionMember } from "../../types";
import { coreForearmMuscleIds, externalContributorIds as ext, forearmAdjacentIds as adj, forearmGroupIds as grp } from "./ids";

/**
 * The nodes the forearm page lists, in its order (docs/specialization-atlas/10-multi-region.md
 * §1.3): its own (nodes.ts) and, as external members, the upper arm's biceps and brachialis. No
 * role is written here: the forearm's own nodes keep their home role and the upper-arm muscles
 * are external (`memberRole`, compose.ts).
 */
export const forearmMembers: RegionMember[] = [
  grp.anterior,
  grp.posterior,
  ...coreForearmMuscleIds,
  adj.anconeus,
  ext.biceps,
  ext.brachialis,
].map((nodeId, sortOrder) => ({ nodeId, sortOrder }));
