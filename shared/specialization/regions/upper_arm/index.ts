import type { RegionContent, SpecializationRegionData } from "../../types";
import { composeRegionData } from "../../compose";
import { forearmHomeContent } from "../forearm/content";
import { upperArmHomeContent } from "./content";
import { upperArmDiagram } from "./diagram.generated";

/** The upper arm as its folder declares it: its content (`content.ts`) and its drawing. */
export const upperArmContent: RegionContent = { ...upperArmHomeContent, diagram: upperArmDiagram };

/**
 * The upper-arm page's data (wave A): its content and drawing, with the brachioradialis from its
 * home, the forearm, read without the forearm's drawing.
 */
export const upperArmRegionData: SpecializationRegionData = composeRegionData(upperArmContent, [forearmHomeContent]);
