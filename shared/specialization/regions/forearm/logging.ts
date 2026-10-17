import type { SpecializationRegionData } from "../../types";
import { forearmRegion } from "./region";
import { forearmVariants } from "./variants";
import { forearmMappings } from "./mappings";

/**
 * What the workout logger reads of the forearm region: the region's status, its exercise
 * variants (seconds or reps, which arm) and its mappings (which grips a strapped set does not
 * earn). Nothing else: the drawing, the anatomy, the claims and the sources stay with the
 * specialization page (`./index.ts`), so opening the workout logger does not download them
 * (shared/specialization/loggingRegions.ts).
 *
 * The arrays are the same ones `./index.ts` gives the page, so the logger and the page can
 * never read two different versions of a variant.
 */
export const forearmLoggingData: Pick<SpecializationRegionData, "region" | "variants" | "mappings"> = {
  region: forearmRegion,
  variants: forearmVariants,
  mappings: forearmMappings,
};
