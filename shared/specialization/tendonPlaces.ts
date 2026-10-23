import type { NodeId, RegionExtras } from "./types";

/**
 * Where a node is a reviewed member of a tendon group: the "Attaches at" line of a muscle's sheet and
 * of the 3D model's panel (docs/specialization-atlas, note 11, §4.3). Kept in a module of its own,
 * apart from the calculation (`tendonAreas.ts`, which re-exports it), so the page's own chunk carries
 * these few lines and none of the section's counting (§7.5). Region-agnostic: it reads the region's
 * lazily loaded areas and names no region, muscle or side.
 */

/** Where a node is a reviewed member: the "Attaches at" line. */
export interface TendonPlace {
  areaId: string;
  areaLabel: string;
  groupId: string;
  groupLabel: string;
}

/** Where a node is a reviewed member, area by area, in the region's order: the "Attaches at" line. */
export function tendonPlacesOf(extras: Pick<RegionExtras, "tendonAreas">, nodeId: NodeId): TendonPlace[] {
  return (extras.tendonAreas ?? []).flatMap((area) => area.groups
    .filter((group) => group.members.some((member) => member.nodeId === nodeId && member.reviewStatus === "reviewed"))
    .map((group) => ({ areaId: area.id, areaLabel: area.label, groupId: group.id, groupLabel: group.label })));
}
