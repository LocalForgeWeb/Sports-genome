import type { MappingVersion, UnmappedTaggedExercise, VariantMapping } from "../../../types";
import { UPPER_ARM_MAPPING_VERSION } from "../ids";
import { upperArmMethodNotes } from "../methodNotes";
import { extensionsOtherMappings, extensionsOtherUnmapped } from "./extensionsOther";
// ---------------------------------------------------------------- INTEGRATION: the other two families
// Wave A's integration lane adds the two other families here, in this order, and in the two arrays
// below (docs/specialization-atlas/regions/upper_arm/mappings.md, "Families"):
//   import { pressesPushesMappings, pressesPushesUnmapped } from "./pressesPushes";
//   import { pullsCurlsMappings, pullsCurlsUnmapped } from "./pullsCurls";
// Until then the version holds this family only, and the coverage test in
// client/src/lib/specialization/upper_armMappings.test.ts fails for exactly the rows those two own.
// ---------------------------------------------------------------- END INTEGRATION

/**
 * `upper_arm_mappings_v1`: the upper arm's mappings and its deliberately unmapped exercises, one file
 * per exercise family (10-multi-region.md §9.2), joined here. The method, the families and every
 * judgment call are in docs/specialization-atlas/regions/upper_arm/mappings.md; the version-wide
 * rules are tested in client/src/lib/specialization/upper_armMappings.test.ts, each family's own in
 * upper_armMappings.<family>.test.ts.
 */
export const upperArmMappings: VariantMapping[] = [
  // INTEGRATION: ...pressesPushesMappings,
  // INTEGRATION: ...pullsCurlsMappings,
  ...extensionsOtherMappings,
];

/** Catalog rows the upper arm leaves unmapped, each with its reason (`unmappedTagged` in the region's content). */
export const upperArmUnmapped: UnmappedTaggedExercise[] = [
  // INTEGRATION: ...pressesPushesUnmapped,
  // INTEGRATION: ...pullsCurlsUnmapped,
  ...extensionsOtherUnmapped,
];

/**
 * The version record. A draft until wave A's release: the integration lane sets `state:
 * "published"` and the date when it wires the version into the region's content (content.ts), which
 * this lane does not touch.
 */
export const upperArmMappingVersion: MappingVersion = {
  key: UPPER_ARM_MAPPING_VERSION,
  state: "draft",
  publishedAt: null,
  methodNotes: upperArmMethodNotes,
};
