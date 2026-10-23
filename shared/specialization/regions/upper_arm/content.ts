import type { RegionHomeContent } from "../../types";
import { actionsFor } from "../../actions";
import { forearmActionIds as a, shoulderActionIds as sh } from "../../actions/ids";
import { forearmSources } from "../../sources/forearm";
import { forearmMappingSources } from "../../sources/forearmMappings";
import { upperArmSources } from "../../sources/upper_arm";
import { upperArmPressesPushesSources } from "../../sources/upper_arm-pressesPushes";
import { upperArmPullsCurlsSources } from "../../sources/upper_arm-pullsCurls";
import { variantsMappedBy } from "../../variants";
import { upperArmRegion } from "./region";
import { upperArmNodes } from "./nodes";
import { upperArmMembers } from "./members";
import { upperArmNodeActions } from "./nodeActions";
import { upperArmClaims } from "./claims";
import { upperArmMappingVersion, upperArmMappings, upperArmUnmapped } from "./mappings";
import { taggedVariants } from "./libraryVariants.generated";

/**
 * The forearm library's sources the upper arm cites: StatPearls on the biceps and brachialis and
 * Kleiber 2015 (A4) in its claims; the forearm's mapping sources (M5, M6 on supination) in its rows.
 */
const cited = new Set([...upperArmClaims, ...upperArmMappings].flatMap((record) => record.sources.map((ref) => ref.sourceId)));

/**
 * The upper arm as its folder declares it, without its drawing: its nodes, its members (the
 * forearm's brachioradialis among them), its actions (§1.2's, in that order), node actions, claims,
 * sources, and `upper_arm_mappings_v1` with the variants it maps and the exercises it leaves
 * unmapped (docs/specialization-atlas/10-multi-region.md §1.2, §1.3, §4.1). A production region
 * from wave A. `index.ts` adds its drawing.
 *
 * Another region's page does not read this whole record: the forearm, which lists the biceps and
 * brachialis, reads only what crediting and explaining those two needs
 * (regions/forearm/upperArmHome.ts).
 */
export const upperArmHomeContent: RegionHomeContent = {
  region: upperArmRegion,
  nodes: upperArmNodes,
  members: upperArmMembers,
  actions: actionsFor([a.elbowFlexion, a.elbowExtension, a.supination, sh.flexion, sh.extension]),
  nodeActions: upperArmNodeActions,
  claims: upperArmClaims,
  sources: [
    ...upperArmSources,
    ...upperArmPressesPushesSources,
    ...upperArmPullsCurlsSources,
    ...[...forearmSources, ...forearmMappingSources].filter((source) => cited.has(source.id)),
  ],
  variants: variantsMappedBy(upperArmMappings),
  taggedVariants,
  mappings: upperArmMappings,
  mappingVersion: upperArmMappingVersion,
  unmappedTagged: upperArmUnmapped,
};
