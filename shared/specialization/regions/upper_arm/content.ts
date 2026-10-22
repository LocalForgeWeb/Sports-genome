import type { RegionHomeContent } from "../../types";
import { actionsFor } from "../../actions";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../actions/ids";
import { forearmSources } from "../../sources/forearm";
import { upperArmSources } from "../../sources/upper_arm";
import { upperArmRegion } from "./region";
import { upperArmNodes } from "./nodes";
import { upperArmMembers } from "./members";
import { upperArmNodeActions } from "./nodeActions";
import { upperArmClaims } from "./claims";

/** The forearm's sources the upper arm's claims cite (StatPearls on the biceps and brachialis; Kleiber 2015, A4). */
const cited = new Set(upperArmClaims.flatMap((claim) => claim.sources.map((ref) => ref.sourceId)));

/**
 * The upper arm as its folder declares it, without its drawing: its nodes, its members (the
 * forearm's brachioradialis among them), its actions (§1.2's, in that order), node actions, claims
 * and sources (docs/specialization-atlas/10-multi-region.md §1.2, §1.3). Still a reference region
 * through wave A's lanes: no page and no mapping version until the integration lane promotes it.
 * What another region's page reads of it as the home of its muscles (the forearm lists the biceps
 * and brachialis); `index.ts` adds its drawing (none until wave A draws it).
 */
export const upperArmHomeContent: RegionHomeContent = {
  region: upperArmRegion,
  nodes: upperArmNodes,
  members: upperArmMembers,
  actions: actionsFor([a.elbowFlexion, a.elbowExtension, a.supination, sh.flexion, sh.extension]),
  nodeActions: upperArmNodeActions,
  claims: upperArmClaims,
  sources: [...upperArmSources, ...forearmSources.filter((source) => cited.has(source.id))],
  variants: [],
  mappings: [],
  mappingVersion: null,
  unmappedTagged: [],
};
