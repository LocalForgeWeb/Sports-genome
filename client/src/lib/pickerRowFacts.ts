/**
 * What a picker row should say, given what its neighbours say.
 *
 * The day picker rendered four lines per result, and on the reported screen -
 * an empty Push day - two of them were the same on every row:
 *
 *   Alternating Dumbbell Bench Press / Horizontal push · Dumbbells
 *   PECTORALIS MAJOR            <- 24 rows, 3 distinct values, all starting here
 *   Closes Pectoralis major, 90 short   <- 24 rows, ONE distinct value
 *
 * Two mistakes produced that. `deltaToTarget` is a property of the DAY, not of
 * the exercise, so "90 short" was never per-row information - it is the same
 * number whichever option you look at, and it already appears on the gap chip
 * above the list. And on an empty day every option closes the gap, so the tag
 * was trivially true of all of them.
 *
 * A row earns a line only by differing from the rows around it. Anything the
 * whole list shares belongs in the list's header, which already says
 * "84 options · Pectoralis major and Anterior deltoid first".
 */

import type { Exercise } from "./exerciseCatalog";
import type { GapTarget } from "./pickerRanking";

export type PickerRowFact = {
  exercise: Exercise;
  fillsGap: GapTarget | null;
  supportsGap: GapTarget | null;
};

/** How a row relates to the day's shortfalls. */
export type RowRelation = "fills" | "supports" | "other";

export function rowRelation(row: Pick<PickerRowFact, "fillsGap" | "supportsGap">): RowRelation {
  if (row.fillsGap) return "fills";
  if (row.supportsGap) return "supports";
  return "other";
}

/**
 * Whether the gap tag tells the reader anything on this particular list.
 *
 * With every visible row in the same relation - which is the normal case on an
 * empty day, where everything closes the gap - the tag is a caption repeated
 * down the page. It earns its place only where rows actually differ.
 */
export function gapTagIsInformative(rows: readonly Pick<PickerRowFact, "fillsGap" | "supportsGap">[]): boolean {
  if (rows.length < 2) return false;
  const first = rowRelation(rows[0]);
  return rows.some((row) => rowRelation(row) !== first);
}

/**
 * The muscles worth naming on a row, given what the list is already sorted by.
 *
 * Every Push-fit result leads with Pectoralis major, so printing it on each row
 * says only "this list is what you asked for". What varies - and what decides
 * between two bench presses - is everything else the exercise brings.
 */
export function distinguishingMuscles(exercise: Exercise, sortedBy: readonly string[]): string[] {
  const known = new Set(sortedBy);
  return exercise.primaryMuscles.filter((muscle) => !known.has(muscle));
}

/**
 * Whether naming the muscles is worth a line at all across this list.
 *
 * If, after removing what the header already states, every row is left with the
 * same thing (or nothing), the line is another repeated caption.
 */
export function muscleLineIsInformative(exercises: readonly Exercise[], sortedBy: readonly string[]): boolean {
  if (exercises.length < 2) return false;
  const rendered = exercises.map((exercise) => distinguishingMuscles(exercise, sortedBy).join("|"));
  if (rendered.every((entry) => entry === "")) return false;
  return new Set(rendered).size > 1;
}
