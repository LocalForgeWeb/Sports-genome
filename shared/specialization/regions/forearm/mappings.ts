import type { MappingVersion, VariantMapping } from "../../types";
import { FOREARM_MAPPING_VERSION } from "../../ids";

export const forearmMappingVersion: MappingVersion = {
  key: FOREARM_MAPPING_VERSION,
  state: "draft",
  publishedAt: null,
  methodNotes: "",
};

/** Variant → node mappings, by catalog id. */
export const forearmMappings: VariantMapping[] = [];
