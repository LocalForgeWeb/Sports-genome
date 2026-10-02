import { exercises } from "@/lib/exerciseCatalog";
import type { OneRepMaxEstimate, StrengthPercentileResult } from "@shared/strengthPercentile";

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
 * 63 -> "63rd". English ordinals, with the teens exception that catches every naive version:
 * 11, 12 and 13 take "th" despite ending in 1, 2 and 3.
 */
export function ordinal(value: number): string {
  const whole = Math.round(value);
  const lastTwo = whole % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${whole}th`;
  switch (whole % 10) {
    case 1: return `${whole}st`;
    case 2: return `${whole}nd`;
    case 3: return `${whole}rd`;
    default: return `${whole}th`;
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
  context: { sex: "male" | "female"; bodyMassKg?: number | null }
): StrengthPercentileCard | null {
  if (result.status !== "resolved") return null;
  const placedAs = result.unit === "x_bodyweight"
    ? `${result.observedValue.toFixed(2)}× body weight`
    : result.unit === "reps"
      ? `${Math.round(result.observedValue)} reps`
      : `${Math.round(result.observedValue)} ${result.unit === "kg" ? "kg" : "lb"}`;
  const placement = `${placedAs} · among ${populationLabel[context.sex]} this lift${ageAdjustmentNote(result.ageAdjustment)}`;
  const effort = effortNote(result.estimate);
  return {
    headline: `${ordinal(result.percentile)} percentile`,
    detail: `${placement}${effort}`,
    placement,
    effort: effort.trim(),
  };
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
