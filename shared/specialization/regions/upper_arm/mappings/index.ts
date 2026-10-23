import type { UnmappedTaggedExercise, VariantMapping } from "../../../types";
import { extensionsOtherMappings, extensionsOtherUnmapped } from "./extensionsOther";
import { pressesPushesMappings, pressesPushesUnmapped } from "./pressesPushes";
import { pullsCurlsMappings, pullsCurlsUnmapped } from "./pullsCurls";

/**
 * `upper_arm_mappings_v1`: the upper arm's mappings and its deliberately unmapped exercises, one file
 * per exercise family (10-multi-region.md §9.2), joined here. The method, the families and every
 * judgment call are in docs/specialization-atlas/regions/upper_arm/mappings.md; the version-wide
 * rules are tested in client/src/lib/specialization/upper_armMappings.test.ts, each family's own in
 * upper_armMappings.<family>.test.ts.
 */
export const upperArmMappings: VariantMapping[] = [
  ...pressesPushesMappings,
  ...pullsCurlsMappings,
  ...extensionsOtherMappings,
];

/** Catalog rows the upper arm leaves unmapped, each with its reason (`unmappedTagged` in the region's content). */
export const upperArmUnmapped: UnmappedTaggedExercise[] = [
  ...pressesPushesUnmapped,
  ...pullsCurlsUnmapped,
  ...extensionsOtherUnmapped,
];

/** The version record (version.ts), published with wave A. */
export { upperArmMappingVersion } from "./version";
