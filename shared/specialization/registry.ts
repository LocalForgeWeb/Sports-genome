import type { RegionContent, RegionId, SpecializationRegionData } from "./types";
import { forearmContent, forearmRegionData } from "./regions/forearm";
import { upperArmContent } from "./regions/upper_arm";

/**
 * The registered regions (docs/specialization-atlas/10-multi-region.md §1). A new region is
 * added here as data; nothing else in the calculator or the page changes (brief §1, §11 "New
 * deltoid region fixture"). `regionIndex.ts` lists the same regions without their content.
 */

/** Every registered region's content, production and reference, in body order. */
export const registeredRegionContents: readonly RegionContent[] = [upperArmContent, forearmContent];

/** Production regions' page data, composed from their content and their external members' homes. */
export const specializationRegions: readonly SpecializationRegionData[] = [forearmRegionData];

export function regionDataFor(id: RegionId | null | undefined): SpecializationRegionData | null {
  if (!id) return null;
  return specializationRegions.find((data) => data.region.id === id) ?? null;
}

/** A registered region's content, production or reference. */
export function regionContentFor(id: RegionId | null | undefined): RegionContent | null {
  if (!id) return null;
  return registeredRegionContents.find((content) => content.region.id === id) ?? null;
}

export { defaultSpecializationRegionId } from "./regionIndex";
