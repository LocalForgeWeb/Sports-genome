import type { MappingVersion } from "../../../types";
import { UPPER_ARM_MAPPING_VERSION } from "../ids";
import { upperArmMethodNotes } from "../methodNotes";

/**
 * `upper_arm_mappings_v1`'s record, published with wave A (seed v3; docs/specialization-atlas/
 * 10-multi-region.md §4.1, §9.1). Publishing freezes it: a correction is a new version in a later
 * seed. In a module of its own so a page that credits an upper-arm muscle reads the record and its
 * method notes without every family's rows (regions/forearm/upperArmHome.ts).
 */
export const upperArmMappingVersion: MappingVersion = {
  key: UPPER_ARM_MAPPING_VERSION,
  state: "published",
  publishedAt: "2026-10-23",
  methodNotes: upperArmMethodNotes,
};
