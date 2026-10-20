import type { RegionHomeContent } from "../../types";
import { actionsFor } from "../../actions";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../actions/ids";
import { forearmSources } from "../../sources/forearm";
import { upperArmRegion } from "./region";
import { upperArmNodes } from "./nodes";
import { upperArmMembers } from "./members";
import { upperArmNodeActions } from "./nodeActions";
import { upperArmClaims } from "./claims";

/** The sources the forearm's claims on these nodes cite (StatPearls, biceps and brachialis). */
const cited = new Set(upperArmClaims.flatMap((claim) => claim.sources.map((ref) => ref.sourceId)));

/**
 * The upper arm as a reference region (docs/specialization-atlas/10-multi-region.md §1.3), without
 * a drawing: the home of the biceps and brachialis, with no page and no mapping version. Its
 * actions are §1.2's, so its node actions rest on its own region's actions. What the forearm's page
 * reads of it; `index.ts` adds its drawing (none until wave A draws it).
 */
export const upperArmHomeContent: RegionHomeContent = {
  region: upperArmRegion,
  nodes: upperArmNodes,
  members: upperArmMembers,
  actions: actionsFor([a.elbowFlexion, a.elbowExtension, a.supination, sh.flexion, sh.extension]),
  nodeActions: upperArmNodeActions,
  claims: upperArmClaims,
  sources: forearmSources.filter((source) => cited.has(source.id)),
  variants: [],
  mappings: [],
  mappingVersion: null,
  unmappedTagged: [],
};
