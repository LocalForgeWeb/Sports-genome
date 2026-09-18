/**
 * Ordering the add-an-exercise list by what the day actually needs.
 *
 * The picker sat directly beneath a panel saying "Pectoralis major is 34 points
 * short" and then listed 84 options alphabetically, so the exercises that would
 * close that gap were scattered between Archer Push-Up and Arnold Press. The two
 * halves of the screen were computing the same analysis and never speaking: to
 * act on the panel you had to read a muscle name off it, find the muscle filter,
 * set it, and repeat for the next gap.
 *
 * Ranking here is by the stack's own shortfalls. Nothing is hidden - the whole
 * catalog is still reachable and the count is unchanged - the order just stops
 * being arbitrary.
 */

import type { Exercise } from "@/lib/exerciseCatalog";
import type { CoverageBar } from "@/lib/stackCoverageVisual";

export type GapTarget = {
  muscle: string;
  /** Negative: how far under the split's target this muscle sits. */
  deltaToTarget: number;
  /** Short is further under than Close, and worth fixing first. */
  band: CoverageBar["band"];
};

/** The shortfalls worth offering as one-tap filters, worst first. */
export function pickerGapTargets(bars: readonly CoverageBar[]): GapTarget[] {
  return bars
    .filter((bar) => bar.deltaToTarget < 0)
    .sort((left, right) => left.deltaToTarget - right.deltaToTarget)
    .map((bar) => ({ muscle: bar.muscle, deltaToTarget: bar.deltaToTarget, band: bar.band }));
}

export type RankedResult = {
  exercise: Exercise;
  /** The worst-ranked gap this exercise loads directly, if any. */
  fillsGap: GapTarget | null;
  /** Loads a gap muscle, but only as a supporting tissue. */
  supportsGap: GapTarget | null;
};

/**
 * Direct work on the worst gap first, then supporting work on it, then the rest.
 *
 * Within each tier the previous ordering is preserved, so an explicit muscle
 * filter or search still decides the order among equals and this only breaks
 * ties the old list broke alphabetically.
 */
export function rankPickerResults(results: readonly Exercise[], gaps: readonly GapTarget[]): RankedResult[] {
  const rank = new Map(gaps.map((gap, index) => [gap.muscle, index]));

  const decorated = results.map((exercise, index) => {
    let fillsGap: GapTarget | null = null;
    let supportsGap: GapTarget | null = null;
    for (const gap of gaps) {
      if (!fillsGap && exercise.primaryMuscles.includes(gap.muscle)) fillsGap = gap;
      if (!supportsGap && exercise.secondaryMuscles.includes(gap.muscle)) supportsGap = gap;
    }
    // Direct work on a gap outranks supporting work on a worse one: the point is
    // to close a target, and a primary tag is what moves it.
    const tier = fillsGap ? 0 : supportsGap ? 1 : 2;
    const within = fillsGap ? rank.get(fillsGap.muscle) ?? 0 : supportsGap ? rank.get(supportsGap.muscle) ?? 0 : 0;
    return { exercise, fillsGap, supportsGap, tier, within, index };
  });

  return decorated
    .sort((left, right) => left.tier - right.tier || left.within - right.within || left.index - right.index)
    .map(({ exercise, fillsGap, supportsGap }) => ({ exercise, fillsGap, supportsGap }));
}
