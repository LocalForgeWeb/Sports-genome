import type { RegionId, SpecializationRegionData } from "./types";
import { forearmRegionData } from "./regions/forearm";

/**
 * Production regions. A new region (deltoids, calves) is added here as data; nothing
 * else in the calculator or the page changes (brief §1, §11 "New deltoid region fixture").
 */
export const specializationRegions: readonly SpecializationRegionData[] = [forearmRegionData];

export function regionDataFor(id: RegionId | null | undefined): SpecializationRegionData | null {
  if (!id) return null;
  return specializationRegions.find((data) => data.region.id === id) ?? null;
}

export const defaultSpecializationRegionId: RegionId = forearmRegionData.region.id;
