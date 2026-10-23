import type { RegionContent, SpecializationRegionData } from "../../types";
import { composeRegionData } from "../../compose";
import { upperArmAsForearmHome } from "./upperArmHome";
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
 * arm, read through what the forearm's page needs of it (`upperArmHome.ts`: the two nodes, the
 * forearm's claims on them, the upper arm's published rows for them), never the upper arm's
 * drawing or its other muscles. Equal to composing with the upper arm's whole content, record for
 * record, and to what the page read before the multi-region model apart from wave A's stated
 * changes (client/src/lib/specialization/regionContent.test.ts).
 */
export const forearmRegionData: SpecializationRegionData = composeRegionData(forearmContent, [upperArmAsForearmHome]);
