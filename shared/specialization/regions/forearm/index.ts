import type { RegionContent, SpecializationRegionData } from "../../types";
import { composeRegionData } from "../../compose";
import { upperArmHomeContent } from "../upper_arm/content";
import { forearmHomeContent } from "./content";
import { forearmDiagram } from "./diagram.generated";
import { forearmPlates } from "./plates";

/**
 * The forearm as its folder declares it: its own nodes and records, its members, its version, its
 * drawing, and the rendered plates its page shows as that drawing (`plates.ts`; the SVG drawing stays
 * the seeded one).
 */
export const forearmContent: RegionContent = { ...forearmHomeContent, diagram: forearmDiagram, plates: forearmPlates };

/**
 * The forearm page's data: its content, with the biceps and brachialis from their home, the upper
 * arm, read without the upper arm's drawing (`content.ts`). Equal to what the page read before the
 * multi-region model, record for record (client/src/lib/specialization/regionContent.test.ts).
 */
export const forearmRegionData: SpecializationRegionData = composeRegionData(forearmContent, [upperArmHomeContent]);
