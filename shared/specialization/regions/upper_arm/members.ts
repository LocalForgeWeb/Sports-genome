import type { RegionMember } from "../../types";
import { upperArmMuscleIds as ua } from "./ids";

/**
 * The nodes the upper arm lists. As a reference region it lists only the two muscles it is home
 * to; the promotion adds the triceps heads, the coracobrachialis and the forearm's brachioradialis
 * (docs/specialization-atlas/10-multi-region.md §1.2).
 */
export const upperArmMembers: RegionMember[] = [ua.biceps, ua.brachialis].map((nodeId, sortOrder) => ({ nodeId, sortOrder }));
