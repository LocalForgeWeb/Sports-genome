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
import { catalogSublabelOf, requiredAccessoriesOf, requiredAccessoryLabels } from "./exerciseExecution";

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
  return labelTellsRowsApart(rows.map(rowRelation));
}

/**
 * The same rule, for any per-row label: does printing it distinguish the rows?
 *
 * Measured on the shipped build at 390px, two other lists were failing it. The
 * Genome selector's connection badge held ONE value across all 24 rows in the
 * default view and in the "row" and "press" searches, and the catalog's held one
 * across all 36 cards in the default view - a column of identical pills in the
 * accent colour, each repeating the one above it. Both split under other
 * searches, which is exactly when the badge earns its place.
 *
 * A uniform label is not false, so it is not dropped: it stops being a property
 * of the row and becomes one of the list, and moves to the list's own header.
 */
export function labelTellsRowsApart(labels: readonly string[]): boolean {
  if (labels.length < 2) return false;
  return new Set(labels).size > 1;
}

/**
 * The muscles worth naming on a row, given what the list is already sorted by.
 *
 * Every Push-fit result leads with Pectoralis major, so printing it on each row
 * says only "this list is what you asked for". What varies - and what decides
 * between two bench presses - is everything else the exercise brings.
 */
export function distinguishingMuscles(exercise: Exercise, named: readonly string[]): string[] {
  return remainingMuscles(exercise, new Set(named)).slice(0, namedMusclePerRow);
}

/** Everything the exercise brings that the reader has not already been told. */
function remainingMuscles(exercise: Exercise, named: Set<string>): string[] {
  return exercise.primaryMuscles.filter((muscle) => !named.has(muscle));
}

/**
 * The row is one line in a card that shares its width with an Add button, and
 * the line is set in uppercase with letter-spacing. A third muscle ran it past
 * the card and the ellipsis ate the end of the second - so the line that exists
 * to tell two squat variants apart was cut off exactly where they differed.
 * Two is what fits whole, and the exercise's own primary order puts the two
 * that matter first.
 */
const namedMusclePerRow = 2;

/** The muscles the list shares, and whether it is every row or merely most. */
export type SharedRowMuscles = { muscles: string[]; everyRow: boolean };

/**
 * The muscles most of these rows would each be repeating at the reader.
 *
 * `muscleLineIsInformative` is list-wide and binary, so it passes any list whose
 * rows are not all identical - and the measured Legs day is exactly that. Filter
 * to Quadriceps femoris and all twenty-four options also work the glutes:
 *
 *   Also Gluteal complex                     <- 9 rows
 *   Also Gluteal complex · Gastrocn…         <- 12 rows, ellipsised
 *   Also Gluteal complex · Hip adductors     <- 2 rows
 *   Also Gluteal complex · Hip abductors     <- 1 row
 *
 * The set has four members, so the line prints, and "Gluteal complex" is read
 * twenty-four times while the part that actually tells a back squat from a leg
 * press is what the ellipsis cuts off. The repetition is per MUSCLE, not per
 * line, so that is what has to be counted: a muscle most of the list shares is a
 * property of the list, and moves to the list's header. Each row is left with
 * its remainder - nothing at all for nine of them, one short word for the rest -
 * and the rows that differ become the only ones speaking, which is the whole
 * point of the line.
 *
 * A strict majority, so a list that genuinely splits down the middle keeps the
 * muscle on the rows that have it: there it is telling half the list from the
 * other half rather than captioning all of it.
 */
export function sharedRowMuscles(exercises: readonly Exercise[], sortedBy: readonly string[]): SharedRowMuscles {
  if (exercises.length < 2) return { muscles: [], everyRow: false };
  const known = new Set(sortedBy);
  const counts = new Map<string, number>();
  const order: string[] = [];
  exercises.forEach((exercise) => {
    new Set(remainingMuscles(exercise, known)).forEach((muscle) => {
      if (!counts.has(muscle)) order.push(muscle);
      counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
    });
  });
  const muscles = order.filter((muscle) => (counts.get(muscle) ?? 0) * 2 > exercises.length);
  return { muscles, everyRow: muscles.length > 0 && muscles.every((muscle) => counts.get(muscle) === exercises.length) };
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

/**
 * A picker row's set-up line. Most rows say their pattern and equipment; a row the catalog needs a
 * sublabel to tell apart from its neighbours (the six Zercher protocols, the neck directions, the
 * incline machines: exerciseExecution.ts) says that instead, so "zercher" returns six rows that read
 * as six different exercises, in every picker alike.
 */
export function pickerSetupLine(exercise: Pick<Exercise, "id" | "movement" | "equipment">): string {
  return catalogSublabelOf(exercise.id) ?? `${exercise.movement} · ${exercise.equipment}`;
}

/**
 * What a row needs that its broad equipment word does not say: "Cable" is not a head harness and
 * "Machine" is not a neck machine (equipmentProfile.ts). Shown on the row in a manual picker, where
 * the athlete may still add it; automatic stacks leave it out unless the profile has the accessory.
 */
export function pickerRequirementNote(exercise: Pick<Exercise, "id">): string | null {
  const needs = requiredAccessoriesOf(exercise.id);
  return needs.length ? `Needs a ${needs.map((accessory) => requiredAccessoryLabels[accessory].toLowerCase()).join(" and a ")}` : null;
}
