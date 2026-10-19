import type { RegionContent, SpecializationRegionData } from "../../types";
import { actionsFor } from "../../actions";
import { composeRegionData } from "../../compose";
import { forearmSources } from "../../sources/forearm";
import { forearmMappingSources } from "../../sources/forearmMappings";
import { upperArmContent } from "../upper_arm";
import { forearmActionIds } from "./ids";
import { forearmRegion } from "./region";
import { forearmNodes } from "./nodes";
import { forearmMembers } from "./members";
import { forearmNodeActions } from "./nodeActions";
import { forearmClaims } from "./claims";
import { forearmVariants } from "./variants";
import { forearmMappings, forearmMappingVersion } from "./mappings";
import { forearmUnmappedTagged } from "./unmapped";
import { forearmDiagram } from "./diagram.generated";

/** The forearm as its folder declares it: its own nodes and records, its members, its version. */
export const forearmContent: RegionContent = {
  region: forearmRegion,
  nodes: forearmNodes,
  members: forearmMembers,
  // The forearm's 20 actions, in the order the page lists them.
  actions: actionsFor(Object.values(forearmActionIds)),
  nodeActions: forearmNodeActions,
  claims: forearmClaims,
  sources: [...forearmSources, ...forearmMappingSources],
  variants: forearmVariants,
  mappings: forearmMappings,
  mappingVersion: forearmMappingVersion,
  unmappedTagged: forearmUnmappedTagged,
  diagram: forearmDiagram,
};

/**
 * The forearm page's data: its content, with the biceps and brachialis from their home, the upper
 * arm. Equal to what the page read before the multi-region model, record for record
 * (client/src/lib/specialization/regionContent.test.ts).
 */
export const forearmRegionData: SpecializationRegionData = composeRegionData(forearmContent, [upperArmContent]);
