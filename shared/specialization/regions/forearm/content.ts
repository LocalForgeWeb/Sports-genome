import type { RegionHomeContent } from "../../types";
import { actionsFor } from "../../actions";
import { forearmSources } from "../../sources/forearm";
import { forearmMappingSources } from "../../sources/forearmMappings";
import { forearmActionIds } from "./ids";
import { forearmRegion } from "./region";
import { forearmNodes } from "./nodes";
import { forearmMembers } from "./members";
import { forearmNodeActions } from "./nodeActions";
import { forearmClaims } from "./claims";
import { forearmVariants } from "./variants";
import { forearmMappings, forearmMappingVersion } from "./mappings";
import { forearmUnmappedTagged } from "./unmapped";

/**
 * The forearm as its folder declares it, without its drawing: its own nodes and records, its
 * members, its version. What another region's page reads of the forearm as the home of its
 * muscles (the upper arm lists the brachioradialis), so that page never carries the forearm's
 * drawing; `index.ts` adds the drawing for the forearm's own page.
 */
export const forearmHomeContent: RegionHomeContent = {
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
  // The stack designer (11-forearm-research-and-stack.md §3.10). Its rep profiles are in
  // ./repProfiles.ts, loaded only when the section opens, never imported here.
  // Tendon exposure (§4.6): its areas are in ./tendonAreas.ts, likewise loaded only when it opens.
  sections: { stack: true, tendonExposure: true },
};
