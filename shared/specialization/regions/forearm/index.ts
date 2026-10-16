import type { SpecializationRegionData } from "../../types";
import { forearmRegion } from "./region";
import { forearmNodes } from "./nodes";
import { forearmActions } from "./actions";
import { forearmNodeActions } from "./nodeActions";
import { forearmClaims } from "./claims";
import { forearmSources } from "./sources";
import { forearmMappingSources } from "./mappingSources";
import { forearmVariants } from "./variants";
import { forearmMappings, forearmMappingVersion } from "./mappings";
import { forearmDiagram } from "./diagram.generated";

export const forearmRegionData: SpecializationRegionData = {
  region: forearmRegion,
  nodes: forearmNodes,
  actions: forearmActions,
  nodeActions: forearmNodeActions,
  claims: forearmClaims,
  sources: [...forearmSources, ...forearmMappingSources],
  variants: forearmVariants,
  mappings: forearmMappings,
  mappingVersion: forearmMappingVersion,
  diagram: forearmDiagram,
};
