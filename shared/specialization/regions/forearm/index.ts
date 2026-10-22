import type { RegionContent, SpecializationRegionData } from "../../types";
import { composeRegionData } from "../../compose";
import { upperArmHomeContent } from "../upper_arm/content";
import { forearmHomeContent } from "./content";
import { forearmDiagram } from "./diagram.generated";

/** The forearm as its folder declares it: its own nodes and records, its members, its version, its drawing. */
export const forearmContent: RegionContent = { ...forearmHomeContent, diagram: forearmDiagram };

/**
 * The forearm page's data: its content, with the biceps and brachialis from their home, the upper
 * arm, read without the upper arm's drawing (`content.ts`). Equal to what the page read before the
 * multi-region model, record for record (client/src/lib/specialization/regionContent.test.ts).
 */
export const forearmRegionData: SpecializationRegionData = composeRegionData(forearmContent, [upperArmHomeContent]);
