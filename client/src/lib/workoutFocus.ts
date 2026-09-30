import type { Exercise } from "@/lib/exerciseCatalog";
import { regionKeysForValue } from "@/lib/anatomyRegions";
import { drawnMuscleKeys, anatomyViewBox } from "@/components/anatomy/figureGeometry";
import { strengthRegionDefinitions, strengthRegionIdsForCatalogMuscles } from "@shared/strengthGenomeDefinitions";

/**
 * Home's "Workout focus": a short, ranked summary of where the next workout's direct work lands,
 * and the one figure that shows it (Sep 28 regression brief §6).
 *
 * The hero used to list the first four primary muscles in insertion order ("Pectoralis major,
 * Triceps brachii, Rectus abdominis, External oblique") beside a full-body figure squeezed into
 * a 101px column, and always faced the figure forward if any focus muscle was on the front - so
 * a Pull day showed the biceps and hid the lats and upper back the text named.
 *
 * - Regions: the athlete-facing Strength regions (same grain and labels as Strength), ranked by
 *   the day's direct sets - an exercise's sets count once toward each region its primary
 *   muscles reach. Supporting muscles are not counted: this is planned focus, not a volume
 *   model, and never a rank, readiness or measured activation.
 * - Side: the side on which more of the day's direct sets are drawn; front on a tie.
 *   Interactive maps keep `sideForSelection`, which must not turn under the athlete's finger.
 * - Frame: upper body, lower body or the whole figure, from where the direct work is.
 * - No figure when nothing the day trains is drawn on either side, rather than an empty body
 *   captioned "Workout focus".
 */

export type FocusSide = "front" | "back";
export type FocusFrameName = "upper" | "lower" | "full";
export type FocusFrame = { x: number; y: number; width: number; height: number };

/**
 * Crops in the figure's own viewBox units, measured from the drawn muscle bounds (front: delts
 * 210-306, chest 214-338, abs 328-585, quads 521-861, calves 887-1098; back: traps 185-367, lats
 * 227-545, glutes 505-643, hamstrings 513-863). The back view draws no head, so its upper crop
 * starts lower. Hand-written here, not in the generated figureGeometry.ts.
 */
export const focusFrames: Record<FocusSide, Record<FocusFrameName, FocusFrame>> = {
  front: {
    upper: { x: 95, y: 70, width: 486, height: 540 },
    lower: { x: 140, y: 490, width: 396, height: 713 },
    full: { x: 0, y: 0, width: anatomyViewBox.width, height: anatomyViewBox.height },
  },
  back: {
    upper: { x: 95, y: 150, width: 486, height: 540 },
    lower: { x: 140, y: 490, width: 396, height: 713 },
    full: { x: 0, y: 0, width: anatomyViewBox.width, height: anatomyViewBox.height },
  },
};

export type WorkoutFocus = {
  /** Every region the day's direct work reaches, most direct sets first. */
  regions: { id: string; label: string; directSets: number }[];
  /** Null when nothing the day trains is drawn on either side of the figure. */
  figure: { side: FocusSide; frame: FocusFrameName; roles: Record<string, "primary"> } | null;
};

const regionOrder = new Map(strengthRegionDefinitions.map((region, index) => [region.id, index]));
const regionById = new Map(strengthRegionDefinitions.map((region) => [region.id, region]));

export function workoutFocus(workout: readonly Exercise[], setsFor: (exercise: Exercise, index: number) => number): WorkoutFocus | null {
  if (!workout.length) return null;
  const regionSets = new Map<string, number>();
  const sideSets: Record<FocusSide, number> = { front: 0, back: 0 };
  const keysOnSide: Record<FocusSide, Set<string>> = { front: new Set(), back: new Set() };

  workout.forEach((exercise, index) => {
    const sets = Math.max(0, setsFor(exercise, index));
    for (const id of strengthRegionIdsForCatalogMuscles(exercise.primaryMuscles)) regionSets.set(id, (regionSets.get(id) ?? 0) + sets);
    const keys = new Set(exercise.primaryMuscles.flatMap((muscle) => regionKeysForValue(muscle)));
    for (const side of ["front", "back"] as const) {
      const drawn = Array.from(keys).filter((key) => drawnMuscleKeys[side].includes(key));
      drawn.forEach((key) => keysOnSide[side].add(key));
      if (drawn.length) sideSets[side] += sets;
    }
  });

  const regions = Array.from(regionSets.entries())
    .filter(([, sets]) => sets > 0)
    .map(([id, directSets]) => ({ id, label: regionById.get(id)?.label ?? id, directSets }))
    .sort((a, b) => b.directSets - a.directSets || (regionOrder.get(a.id) ?? 0) - (regionOrder.get(b.id) ?? 0));
  if (!regions.length && !keysOnSide.front.size && !keysOnSide.back.size) return null;

  const side: FocusSide = sideSets.back > sideSets.front ? "back" : "front";
  if (!keysOnSide[side].size) return { regions, figure: null };
  const areas = new Set(regions.map((region) => regionById.get(region.id)?.bodyArea));
  const upper = areas.has("Upper body") || areas.has("Trunk");
  const lower = areas.has("Lower body");
  const frame: FocusFrameName = upper && lower ? "full" : lower ? "lower" : "upper";
  const roles = Object.fromEntries(Array.from(keysOnSide[side]).map((key) => [key, "primary" as const]));
  return { regions, figure: { side, frame, roles } };
}

/** "Chest · Triceps · Abdominals · +3 more": the ranked regions, three named. */
export function focusSummary(focus: WorkoutFocus | null, named = 3): string {
  if (!focus?.regions.length) return "";
  const shown = focus.regions.slice(0, named).map((region) => region.label);
  const rest = focus.regions.length - shown.length;
  return [...shown, ...(rest > 0 ? [`+${rest} more`] : [])].join(" · ");
}
