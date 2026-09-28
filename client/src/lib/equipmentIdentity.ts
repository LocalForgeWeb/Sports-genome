/**
 * The catalog's equipment strings, resolved to canonical IDs an icon can key off.
 *
 * Icons are mapped from these IDs and never from substring matching on the display
 * name, so renaming a label cannot silently change what an athlete is shown.
 *
 * The important finding is in `freeWeights`. Counted across all 400 catalog rows:
 *
 *     Free weights   114      Machine          25      Plyometric box   3
 *     Cable          109      Barbell          18      Battle ropes     2
 *     Bodyweight      47      Medicine ball    14      Band             2
 *     Dumbbells       30      Kettlebell        6
 *     Landmine        26      Sled              4
 *
 * "Free weights" is 28% of the catalog and it is not one piece of equipment. It
 * holds Conventional Deadlift, Plate Squeeze Press, Seal Row and Meadows Row
 * together; 102 of the 114 cannot be resolved even by reading the exercise name.
 * Worse, `Barbell`, `Dumbbells` and `Kettlebell` also exist as their own values,
 * so the same bar is filed two different ways depending on the row.
 *
 * That is a data problem and an icon cannot fix it. Drawing a barbell for
 * "Free weights" would be a guess shown as a fact on 114 rows. So the ambiguous
 * bucket resolves to a deliberately non-committal plate mark, and `ambiguous`
 * says why, so the catalog can be split later without hunting for the assumption.
 */

export type EquipmentId =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "landmine"
  | "medicineBall"
  | "sled"
  | "plyoBox"
  | "battleRopes"
  | "band"
  | "freeWeights"
  | "unknown";

/** Exact catalog value → canonical id. Exact, not fuzzy: an unlisted value is `unknown`. */
const catalogValueToId: Record<string, EquipmentId> = {
  "Barbell": "barbell",
  "Dumbbells": "dumbbell",
  "Kettlebell": "kettlebell",
  "Cable": "cable",
  "Machine": "machine",
  "Bodyweight": "bodyweight",
  "Landmine": "landmine",
  "Medicine ball": "medicineBall",
  "Sled": "sled",
  "Plyometric box": "plyoBox",
  "Battle ropes": "battleRopes",
  "Band": "band",
  "Free weights": "freeWeights",
};

/**
 * Ids whose catalog value covers several distinct implements, so no specific
 * object may be drawn for them. `unknown` is here because a value this module has
 * never seen is exactly as unresolved as `freeWeights`.
 */
const ambiguousIds = new Set<EquipmentId>(["freeWeights", "unknown"]);

export function equipmentIdFor(catalogValue: string | undefined | null): EquipmentId {
  if (!catalogValue) return "unknown";
  return catalogValueToId[catalogValue] ?? "unknown";
}

/** Whether this id names one implement, or a bucket holding several. */
export function equipmentIsAmbiguous(id: EquipmentId): boolean {
  return ambiguousIds.has(id);
}

/**
 * Ids with an authored icon of their own: twelve of the catalog's thirteen values.
 * The thirteenth is `freeWeights`, which stays on the plate mark on purpose - it
 * names several implements at once, so there is no object to draw for it. The
 * row's text label names the real equipment either way, so the fallback loses
 * precision, never information.
 */
export const drawnEquipmentIds: readonly EquipmentId[] = [
  "barbell", "dumbbell", "kettlebell", "cable", "machine", "bodyweight",
  "landmine", "medicineBall", "sled", "plyoBox", "battleRopes", "band",
];

export function equipmentHasOwnIcon(id: EquipmentId): boolean {
  return drawnEquipmentIds.includes(id);
}

/**
 * What the icon is announced as, when it is announced at all.
 *
 * Beside a visible equipment label the icon is decorative and gets `aria-hidden`,
 * so a screen reader says "Dumbbells" once rather than twice. This is for the
 * cases where the mark stands alone.
 */
export function equipmentIconLabel(id: EquipmentId, catalogValue: string): string {
  if (equipmentHasOwnIcon(id)) return catalogValue;
  return `${catalogValue} (shown with a general weights mark)`;
}
