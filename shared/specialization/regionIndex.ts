import type { RegionId, SpecializationRegion, SummarySide } from "./types";
import { forearmRegion } from "./regions/forearm/region";
import { upperArmRegion } from "./regions/upper_arm/region";

/**
 * The regions' names, sides, words and entry points only, for screens that link to the
 * specialization page (Home, Body Lab, Review, search) and for the page's region picker. It
 * imports none of the region content, so linking to the page does not put its anatomy, mappings
 * and drawing in the main bundle; `registry.ts` (read by the lazy page) holds the content, and
 * client/src/lib/specialization/regionContent.test.ts keeps the two lists in step.
 */

/** Every registered region, production and reference, in body order (sortOrder). */
export const registeredRegionIndex: readonly SpecializationRegion[] = [upperArmRegion, forearmRegion];

/** The production regions, in body order: the regions with a page. */
export const specializationRegionIndex: readonly SpecializationRegion[] = registeredRegionIndex.filter((region) => region.status === "production");

export const defaultSpecializationRegionId: RegionId = forearmRegion.id;

/** A registered region by id, production or reference (a reference region names an external member's home). */
export function regionIndexEntry(id: RegionId | null | undefined): SpecializationRegion | null {
  if (!id) return null;
  return registeredRegionIndex.find((region) => region.id === id) ?? null;
}

/** The production region a body-map or catalog muscle key belongs to, if any. */
export function regionForBodyMapKey(key: string | null | undefined): SpecializationRegion | null {
  if (!key) return null;
  return specializationRegionIndex.find((region) => region.bodyMapKeys.includes(key)) ?? null;
}

/**
 * The region and a side in a sentence, from the region's `onSideTemplate`: "your right forearm",
 * "the left side of your chest"; a midline region's names no side ("your core"). A paired
 * region always needs a side.
 */
export function onSide(region: Pick<SpecializationRegion, "id" | "wording">, side: SummarySide): string {
  const template = region.wording.onSideTemplate;
  if (!template.includes("{side}")) return template;
  if (side === "midline") throw new Error(`Region ${region.id} names a side in its sentences; give it left or right`);
  return template.replace("{side}", side);
}
