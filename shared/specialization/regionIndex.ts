import type { RegionId, SpecializationRegion } from "./types";
import { forearmRegion } from "./regions/forearm/region";

/**
 * The production regions' names and entry points only, for screens that link to the
 * specialization page (Home, Body Lab, Review, search). It imports none of the region
 * data, so linking to the page does not put its anatomy, mappings and drawing in the
 * main bundle; `registry.ts` (read by the lazy page) holds the data, and a test keeps
 * the two lists in step.
 */
export const specializationRegionIndex: readonly SpecializationRegion[] = [forearmRegion];

export const defaultSpecializationRegionId: RegionId = forearmRegion.id;

/** The production region a body-map or catalog muscle key belongs to, if any. */
export function regionForBodyMapKey(key: string | null | undefined): SpecializationRegion | null {
  if (!key) return null;
  return specializationRegionIndex.find((region) => region.bodyMapKeys.includes(key)) ?? null;
}
