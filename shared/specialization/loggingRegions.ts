import type { SpecializationRegionData } from "./types";
import { forearmLoggingData } from "./regions/forearm/logging";

/**
 * The production regions as the workout logger needs them: each region's status, variants and
 * mappings, and nothing else (shared/specialization/loggingPolicy.ts).
 *
 * `registry.ts` holds every region's full data, drawing, claims and sources included, for the
 * lazy specialization page. The logger must not import it: any import of `registry.ts` links
 * all of that into the importer's chunk, and the workout logger would download the atlas
 * drawing to ask whether a set was done with one arm. This list is the light twin of the
 * registry, as `regionIndex.ts` is for the regions' names, and a test keeps the two in step
 * (client/src/lib/specialization/loggingRegions.test.ts): a region added to the registry is
 * added here with its variants and mappings, and nothing in the logger changes.
 */
export type RegionLoggingData = Pick<SpecializationRegionData, "region" | "variants" | "mappings">;

export const specializationLoggingRegions: readonly RegionLoggingData[] = [forearmLoggingData];
