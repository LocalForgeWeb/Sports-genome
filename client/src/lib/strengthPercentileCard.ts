import { exercises } from "@/lib/exerciseCatalog";
import { loadConventionFor } from "@shared/loadConventions";
import { tailEstimateCapPercentile, type OneRepMaxEstimate, type StrengthPercentileResult } from "@shared/strengthPercentile";
import type { SetEffort } from "@shared/setEffort";

/**
 * Turning a beta percentile into the one line an athlete reads.
 *
 * The engine returns a placement, a route and a scoring version; none of that is a sentence.
 * This is the only place that decides what the card says, so the panel stays a layout and the
 * wording can be checked on its own.
 */

const catalogIdByName = new Map(exercises.map((exercise) => [exercise.name.trim().toLowerCase(), exercise.id]));

/** The app's own catalog id for a logged lift, which is how a curve is found. */
export function catalogExerciseIdForName(exerciseName: string): number | undefined {
  return catalogIdByName.get(exerciseName.trim().toLowerCase());
}

/**
 * A set placed as a rep count: a movement scored on reps (`bodyweight_reps`, such as a pull-up or
 * a push-up) done with no added load, from 1 to 1000 reps - the same sets the muscle ranks score
 * on reps, and the route reads the same way.
 */
export function isRepCountLift(exerciseName: string, loadKg: number | string | null | undefined, repetitions: number | string | null | undefined): boolean {
  if (loadConventionFor(catalogExerciseIdForName(exerciseName)) !== "bodyweight_reps") return false;
  const load = loadKg == null || loadKg === "" ? 0 : Number(loadKg);
  const reps = repetitions == null || repetitions === "" ? Number.NaN : Math.round(Number(repetitions));
  return load === 0 && reps >= 1 && reps <= 1000;
}

/**
 * The figure a percentile is printed as - on a lift's card and in the ranks alike, so one lift
 * never reads two numbers.
 *
 * Floored, not rounded, so the printed number always sits inside the band its colour and name
 * come from: 19.6 rounds to "20th", which the legend files under JV, while the rank - read on the
 * raw value - is Prospect. Flooring keeps "Prospect · 19th" true to the legend's 0-19, and nothing
 * reads as "0th". From the 99th up, where the estimated tail runs on to the 99.99th, whole numbers
 * would print 99.2 and 99.99 alike, so it keeps a tenth (99.2) and from the 99.9th a hundredth
 * (99.95) - still floored, so it never reads 100.
 */
export function percentileFigure(value: number): number {
  if (value >= 99) {
    const places = value >= 99.9 ? 100 : 10;
    // The small allowance keeps 99.99, stored as 99.98999…, from flooring to 99.98.
    return Math.min(99.99, Math.floor(value * places + 1e-6) / places);
  }
  return Math.max(1, Math.floor(value));
}

/**
 * A lift's percentile to 2 decimals, as the ranks report it (`exercise_percentile`, rounded in
 * server/muscleAggregation.ts). The card prints this, not the unrounded placement, so 57.996 reads
 * "58th" on the card exactly as the ranks' 58.00 does.
 */
export function reportedPercentile(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A percentile as an English ordinal, at its printed figure (`percentileFigure`): "63rd", with
 * the teens exception that catches every naive version - 11, 12 and 13 take "th" despite ending in
 * 1, 2 and 3. From the 99th up the figure keeps its decimals and the suffix follows the last digit,
 * read one by one: "99.2nd", "99.95th", "99.99th".
 */
export function ordinal(value: number): string {
  const figure = percentileFigure(value);
  if (!Number.isInteger(figure)) return `${figure}${suffix(Number(String(figure).slice(-1)))}`;
  const lastTwo = figure % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${figure}th`;
  return `${figure}${suffix(figure % 10)}`;
}

function suffix(lastDigit: number): string {
  switch (lastDigit) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export type StrengthPercentileCard = {
  headline: string;
  detail: string;
  /** `detail` without the effort note, for a surface that keeps that note with its other caveats. */
  placement: string;
  /** The effort note on its own, or "" when there is none. */
  effort: string;
};

const populationLabel: Record<"male" | "female", string> = {
  male: "men who lift",
  female: "women who lift",
};

/**
 * What to show for a resolved placement.
 *
 * The lift is described in the unit it was actually placed in — a bodyweight multiple on a
 * relative curve, a load on an absolute one — because that is what the percentile was read
 * against, and any other number would be describing a different comparison.
 */
export function strengthPercentileCard(
  result: StrengthPercentileResult,
  context: {
    sex: "male" | "female";
    bodyMassKg?: number | null;
    /**
     * How hard the set was taken (shared/setEffort.ts `effectiveEffort`): said by the athlete, or
     * assumed for a usually-light exercise left unmarked. Absent reads as before - not recorded.
     */
    effort?: { effort: SetEffort | null; assumed: boolean };
  }
): StrengthPercentileCard | null {
  if (result.status !== "resolved") return null;
  const placedAs = result.unit === "x_bodyweight"
    ? `${result.observedValue.toFixed(2)}× body weight`
    : result.unit === "reps"
      ? `${Math.round(result.observedValue)} reps`
      : `${Math.round(result.observedValue)} ${result.unit === "kg" ? "kg" : "lb"}`;
  const placement = `${placedAs} · among ${populationLabel[context.sex]} this lift${ageAdjustmentNote(result.ageAdjustment)}${borrowedCurveNote(result)}${tailEstimateNote(result.tailEstimate)}`;
  const floor = context.effort?.effort === "not_to_failure";
  const effort = floor ? floorNote(Boolean(context.effort?.assumed)) : context.effort?.effort === "failure" ? "" : effortNote(result.estimate);
  // Printed as the ranks print the same lift: to 2 decimals, then floored.
  const shown = ordinal(reportedPercentile(result.percentile));
  const placed = result.tailEstimate ? `≈ ${shown} percentile (estimated)` : `${shown} percentile`;
  return {
    headline: floor ? `At least ${placed}` : placed,
    detail: `${placement}${effort}`,
    placement,
    effort: effort.trim(),
  };
}

/**
 * Why a percentile past the top anchor is an estimate. The comparison data stops at its top
 * anchor (the 95th for every curve today); beyond it the place is the curve's shape carried on,
 * and the estimate itself stops at the 99.99th.
 */
export function tailEstimateNote(tail: Extract<StrengthPercentileResult, { status: "resolved" }>["tailEstimate"]): string {
  if (!tail) return "";
  const where = ` Past the ${ordinal(tail.aboveAnchorPercentile)} percentile, where the comparison data stops, so this is estimated from the curve's shape.`;
  return tail.capped ? `${where} Estimates stop at the ${ordinal(tailEstimateCapPercentile)}.` : where;
}

/** Said when the lift was read on a related exercise's curve, because the logged one has none. */
export function borrowedCurveNote(result: Extract<StrengthPercentileResult, { status: "resolved" }>): string {
  return result.borrowedCurve ? " Compared through a closely related lift, which has the community data this one lacks." : "";
}

/**
 * A set stopped short of failure is a floor: the lift shows the least the athlete can do, and in the
 * ranks it may raise a muscle, never lower it. An unmarked set of a usually-light exercise is read
 * that way too, and the card says so, so it can be marked otherwise.
 */
export function floorNote(assumed: boolean): string {
  return assumed
    ? " Usually done light, so read as not to failure - the least this lift shows. It can raise a rank, never lower it; mark the set to failure if it was."
    : " Not taken to failure, so this is the least the lift shows. It can raise a rank, never lower it.";
}

/**
 * What an unrecorded effort did to the estimate (B059, B093, B253).
 *
 * Nothing records reps in reserve yet, so a working set is read the way the source
 * calculator reads every set: as taken to failure. That is the lowest the estimate - and so
 * the placement - can be, and the card says so rather than letting it pass for a known
 * maximal effort. A single rep, a measured maximum, or a result cached before effort was
 * reported (no field at all) gets no note.
 */
export function effortNote(estimate: Partial<Pick<OneRepMaxEstimate, "basis" | "effectiveReps" | "repsInReserve">> | undefined): string {
  if (!estimate || estimate.basis !== "estimated" || estimate.repsInReserve !== null || (estimate.effectiveReps ?? 1) <= 1) return "";
  return " Read as a set taken to failure, because effort was not recorded; if reps were left in reserve, the lift places higher.";
}

/**
 * The end of the card's sentence, saying what age did to the comparison.
 *
 * Said only where it changed something or was asked for and could not be given: 25 to 40 is
 * the table's own baseline, where the factor is 1 and "adjusted for age 30" would describe a
 * change that did not happen. Optional on the result because a response cached from before
 * age reached the route carries none.
 */
export function ageAdjustmentNote(age: Extract<StrengthPercentileResult, { status: "resolved" }>["ageAdjustment"] | undefined): string {
  if (age?.status === "applied" && age.factor !== 1) return `, adjusted for age ${Math.round(age.ageYears)}.`;
  if (age?.status === "not_applied" && age.reason === "outside_published_age_range" && age.ageYears !== null) {
    return `. Not adjusted for age ${Math.round(age.ageYears)}: the published age adjustment covers 15 to 90.`;
  }
  return ".";
}

/**
 * Why there is no placement, where the answer is something the athlete can act on.
 *
 * Only the reasons with a next step get copy. Everything else returns null and the card simply
 * does not render, rather than explaining a gap nobody asked about.
 */
export const strengthPercentileGapCopy: Partial<Record<
  Extract<StrengthPercentileResult, { status: "unavailable" }>["reason"],
  string
>> = {
  sex_required: "Add the sex to compare against in About Me and this lift gets a percentile.",
  body_mass_required: "Add your body weight and this lift gets a percentile.",
};
