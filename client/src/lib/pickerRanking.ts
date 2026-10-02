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
import { trainsMuscle } from "@/lib/muscleVocabulary";
import { coveragePoints } from "@/lib/splitStackAnalysis";

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
  /**
   * How many shortfall points adding it would close, under the same coverage model the panel
   * grades with: for each gap, its contribution to that muscle, capped at what the gap lacks.
   */
  closesPoints: number;
};

/**
 * The candidates that close the most of the day's shortfall first (TR-13, B119).
 *
 * The order used to be by tag alone - any direct work on the worst gap first - so an exercise
 * that closed two gaps sat below one that closed a sliver of one. It is now the marginal
 * change under the coverage snapshot the panel shows: the points the candidate adds to each
 * gap muscle, capped at that gap. Ties fall back to the old order (direct work on the worst
 * gap, then supporting work, then the rest), and within that the previous ordering is kept,
 * so an explicit muscle filter still decides among equals.
 *
 * A typed name comes before all of that. `relevance` is how well each row
 * answers the search box; an athlete who typed "romanian" wants the Romanian
 * deadlifts at the top whatever the day is short of, and the gap order then
 * settles which of them leads.
 */
export function rankPickerResults(results: readonly Exercise[], gaps: readonly GapTarget[], relevance?: ReadonlyMap<number, number>, pointsFor: (exercise: Exercise, muscle: string) => number = coveragePoints): RankedResult[] {
  const rank = new Map(gaps.map((gap, index) => [gap.muscle, index]));

  const decorated = results.map((exercise, index) => {
    let fillsGap: GapTarget | null = null;
    let supportsGap: GapTarget | null = null;
    for (const gap of gaps) {
      // Through the catalog key that carries the muscle: a gap the register
      // names "rhomboids" is closed by exercises the catalog tags `upperBack`.
      const role = trainsMuscle(exercise, gap.muscle);
      if (!fillsGap && role === "primary") fillsGap = gap;
      if (!supportsGap && role === "secondary") supportsGap = gap;
    }
    // Direct work on a gap outranks supporting work on a worse one: the point is
    // to close a target, and a primary tag is what moves it.
    const tier = fillsGap ? 0 : supportsGap ? 1 : 2;
    const within = fillsGap ? rank.get(fillsGap.muscle) ?? 0 : supportsGap ? rank.get(supportsGap.muscle) ?? 0 : 0;
    const closesPoints = gaps.reduce((total, gap) => total + Math.min(pointsFor(exercise, gap.muscle), Math.max(0, -gap.deltaToTarget)), 0);
    return { exercise, fillsGap, supportsGap, closesPoints, tier, within, index, score: relevance?.get(exercise.id) ?? 0 };
  });

  return decorated
    .sort((left, right) => right.score - left.score || right.closesPoints - left.closesPoints || left.tier - right.tier || left.within - right.within || left.index - right.index)
    .map(({ exercise, fillsGap, supportsGap, closesPoints }) => ({ exercise, fillsGap, supportsGap, closesPoints }));
}
