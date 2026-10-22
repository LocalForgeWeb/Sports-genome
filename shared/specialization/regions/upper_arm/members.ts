import type { RegionMember } from "../../types";
import { upperArmAdjacentIds as adj, upperArmExternalIds as ext, upperArmGroupIds as grp, upperArmMuscleIds as m } from "./ids";

/**
 * The nodes the upper arm lists, in its order (docs/specialization-atlas/10-multi-region.md §1.2,
 * §1.3): its own (nodes.ts) in §1.2's order, the biceps and brachialis keeping the places seed v2
 * gave them, then the forearm's brachioradialis as an external member. No role is written here:
 * the upper arm's own nodes keep their home role and the brachioradialis is external (`memberRole`,
 * compose.ts). A membership's caveats are words for this page only, said after the node's own.
 */
export const upperArmMembers: RegionMember[] = [
  { nodeId: m.biceps },
  { nodeId: m.brachialis },
  { nodeId: grp.triceps },
  { nodeId: m.tricepsLong },
  { nodeId: m.tricepsLateral },
  { nodeId: m.tricepsMedial },
  { nodeId: adj.coracobrachialis },
  { nodeId: ext.brachioradialis, caveats: ["A forearm muscle shown here because curls load it; it is credited as the forearm counts it."] },
].map((member, sortOrder) => ({ ...member, sortOrder }));
