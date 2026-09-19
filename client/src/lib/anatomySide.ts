import { drawnMuscleKeys } from "@/components/anatomy/figureGeometry";

/**
 * Which way the body figure is facing, and which way it has to face to show
 * what the athlete just selected.
 *
 * The figure showed front and back side by side. That was chosen to fix a real
 * failure - selecting a region drawn only on the hidden side left the card
 * naming a muscle you could not see - but it paid for it by halving the figure,
 * and with it every muscle's tap target, on the screen where tapping a muscle is
 * the whole interaction.
 *
 * One body at a time, and the selection decides which body. The failure the
 * side-by-side layout was avoiding cannot happen if the figure turns around to
 * show you what you picked.
 */

export type AnatomySide = "front" | "back";

export const anatomySides: readonly AnatomySide[] = ["front", "back"];

/** The side an athlete sees first. Front is the conventional default. */
export const defaultAnatomySide: AnatomySide = "front";

export function oppositeSide(side: AnatomySide): AnatomySide {
  return side === "front" ? "back" : "front";
}

/** Whether this side's artwork draws the given muscle at all. */
export function sideDrawsMuscle(side: AnatomySide, muscleKey: string): boolean {
  return drawnMuscleKeys[side].includes(muscleKey);
}

/**
 * The sides that draw a muscle. Several - calves, traps, forearms, adductors,
 * side delts, feet, soleus - are drawn on both, so a selection can be satisfied
 * without turning the figure around.
 */
export function sidesDrawingMuscle(muscleKey: string): AnatomySide[] {
  return anatomySides.filter((side) => sideDrawsMuscle(side, muscleKey));
}

/** Whether a side shows any of a selection. */
export function sideShowsSelection(side: AnatomySide, muscleKeys: readonly string[]): boolean {
  return muscleKeys.some((key) => sideDrawsMuscle(side, key));
}

/**
 * The side to face for a selection, given the side currently faced.
 *
 * Turns around only when it has to: an empty selection, or one the current side
 * already draws, leaves the athlete where they are rather than moving the figure
 * under them. A selection this artwork draws on neither side also leaves the
 * view alone - turning to another blank body would say nothing.
 */
export function sideForSelection(current: AnatomySide, muscleKeys: readonly string[]): AnatomySide {
  if (!muscleKeys.length) return current;
  if (sideShowsSelection(current, muscleKeys)) return current;
  const other = oppositeSide(current);
  return sideShowsSelection(other, muscleKeys) ? other : current;
}

/** What the control that turns the figure around should say. */
export function turnToSideLabel(current: AnatomySide): string {
  return current === "front" ? "Show back" : "Show front";
}

/** What the figure currently on screen is. */
export function sideLabel(side: AnatomySide): string {
  return side === "front" ? "Front" : "Back";
}
