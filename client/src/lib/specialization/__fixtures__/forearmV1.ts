import { composeRegionData } from "@shared/specialization/compose";
import { forearmMappingsV1, forearmMappingVersionV1 } from "@shared/specialization/__fixtures__/forearmMappingsV1";
import { forearmContent } from "@shared/specialization/regions/forearm";
import { upperArmAsForearmHome } from "@shared/specialization/regions/forearm/upperArmHome";
import { forearmSources } from "@shared/specialization/sources/forearm";
import { forearmMappingSources } from "@shared/specialization/sources/forearmMappings";
import { forearmV1Variants } from "@shared/specialization/variants/forearm";
import type { RegionContent, SpecializationRegionData, VariantMapping } from "@shared/specialization/types";

/**
 * The forearm as it was before release F3 (24 Oct 2026): its content with `forearm_mappings_v1`
 * (the frozen rows, shared/specialization/__fixtures__/forearmMappingsV1.ts), the 119 variants v1
 * maps and the sources v1's content listed, everything else as the tree has it; and its page data,
 * composed with the upper arm as wave A left it. What the tests that hold "nothing moved" to an
 * older reference read, and what F3's differences are taken from (forearmMappingsV2.test.ts,
 * golden.test.ts, golden.both.test.ts, regionContent.test.ts).
 */
const mappedByV1 = new Set(forearmMappingsV1.map((mapping) => mapping.variantId));

export const forearmContentV1: RegionContent = {
  ...forearmContent,
  sources: [...forearmSources, ...forearmMappingSources],
  variants: forearmV1Variants.filter((variant) => mappedByV1.has(variant.id)),
  mappings: forearmMappingsV1 as VariantMapping[],
  mappingVersion: forearmMappingVersionV1,
};

export const forearmRegionDataV1: SpecializationRegionData = composeRegionData(forearmContentV1, [upperArmAsForearmHome]);
