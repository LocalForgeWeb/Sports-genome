import type { RegionContent } from "../../types";
import { upperArmHomeContent } from "./content";

/** The upper arm as its folder declares it: its content (`content.ts`) and its drawing, none until wave A draws it. */
export const upperArmContent: RegionContent = { ...upperArmHomeContent, diagram: null };
