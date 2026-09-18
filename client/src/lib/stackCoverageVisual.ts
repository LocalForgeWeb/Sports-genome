/**
 * The visual model for stack coverage.
 *
 * The rating surface used to show one number - "Push target score 62/100" - which
 * says nothing about which muscle is short or by how much. Every split target
 * already carries its own target value, so the useful picture is coverage
 * *against that target*: a fill for what the stack reaches and a mark for where
 * the split wants it. Under the mark is a gap, at it is covered, well past it is
 * volume that could move somewhere else.
 *
 * Geometry lives here rather than in the component so the arithmetic is testable
 * without a DOM, and so the bar and the dial cannot drift apart.
 */

import { logicCalibration } from "@/lib/evidenceTraceability";
import type { StackMuscleScore } from "@/lib/splitStackAnalysis";

/**
 * Four display bands, not the analysis' three.
 *
 * `analyzeSplitStack` calls anything above 65% of target "ready", which put
 * "Covered" next to "-24" on the same row - the word and the number
 * contradicting each other on the surface whose whole job is to be readable at a
 * glance. These bands are derived from the same number the bar draws, so the
 * label can never disagree with it: the two negative bands say so, and only a
 * bar that has actually reached its mark reads as covered.
 */
export type CoverageBand = "short" | "near" | "covered" | "heavy";

/**
 * Per the FIXED rule that consequential state meaning carries non-colour
 * redundancy, every band ships a word and a glyph alongside its colour.
 */
export const coverageBandCopy: Record<CoverageBand, { label: string; glyph: string; meaning: string }> = {
  short: { label: "Short", glyph: "↓", meaning: "Well below the split's target for this muscle." },
  near: { label: "Close", glyph: "◦", meaning: "Under target, but within reach of it." },
  covered: { label: "Covered", glyph: "✓", meaning: "At or past the split's target." },
  heavy: { label: "Heavy", glyph: "↑", meaning: "Well past target - volume that could move elsewhere." },
};

/** The band for one target, read off the same score the bar draws. */
export function bandForCoverage(score: number, target: number): CoverageBand {
  if (score > target + logicCalibration.exposure.splitCoverageHighOffset) return "heavy";
  if (score >= target) return "covered";
  if (score < target * logicCalibration.exposure.splitCoverageGapRatio) return "short";
  return "near";
}

export type CoverageBar = {
  muscle: string;
  role: "primary" | "support";
  band: CoverageBand;
  /** Where the fill ends, 0-100. */
  fillPercent: number;
  /** Where the target mark sits, 0-100. */
  targetPercent: number;
  /** Coverage points relative to target. Negative is a shortfall. */
  deltaToTarget: number;
};

/** The widest target in the split, so every bar shares one horizontal scale. */
export function coverageScaleMaximum(ratings: readonly StackMuscleScore[]): number {
  const widest = ratings.reduce((max, rating) => Math.max(max, rating.target, rating.score), 0);
  // A bar whose fill and mark both sit at the far right reads as "maxed" rather
  // than as a value. Leaving headroom keeps an over-target stack legible.
  return Math.max(100, Math.ceil((widest * 1.1) / 10) * 10);
}

export function buildCoverageBars(ratings: readonly StackMuscleScore[]): CoverageBar[] {
  const scale = coverageScaleMaximum(ratings);
  return ratings.map((rating) => ({
    muscle: rating.muscle,
    role: rating.role,
    band: bandForCoverage(rating.score, rating.target),
    fillPercent: Math.round((Math.min(rating.score, scale) / scale) * 100),
    targetPercent: Math.round((Math.min(rating.target, scale) / scale) * 100),
    deltaToTarget: rating.score - rating.target,
  }));
}

export type CoverageSummary = Record<CoverageBand, number> & {
  /** The one sentence worth reading before any bar. */
  headline: string;
  /** Every target under its mark, worst shortfall first - what to fix, in order. */
  shortfalls: CoverageBar[];
};

export function summarizeCoverage(bars: readonly CoverageBar[], muscleName: (muscle: string) => string): CoverageSummary {
  const counts = bars.reduce(
    (totals, bar) => ({ ...totals, [bar.band]: totals[bar.band] + 1 }),
    { short: 0, near: 0, covered: 0, heavy: 0 } as Record<CoverageBand, number>
  );
  // Anything under its mark is worth fixing, whether it is far off or close.
  const shortfalls = bars
    .filter((bar) => bar.deltaToTarget < 0)
    .sort((left, right) => left.deltaToTarget - right.deltaToTarget);

  const headline = !bars.length
    ? "No split targets to measure."
    : shortfalls.length === 0 && counts.heavy === 0
      ? "Every target in this split is covered."
      : shortfalls.length === 0
        ? `All targets covered; ${counts.heavy} carrying heavy volume.`
        : shortfalls.length === 1
          ? `${muscleName(shortfalls[0].muscle)} is the one gap, ${Math.abs(shortfalls[0].deltaToTarget)} points short.`
          : `${shortfalls.length} targets under. ${muscleName(shortfalls[0].muscle)} is furthest behind, ${Math.abs(shortfalls[0].deltaToTarget)} points short.`;

  return { ...counts, headline, shortfalls };
}

/**
 * The band the overall score falls in, so the dial reads at a glance.
 *
 * The overall score averages per-muscle ratios each capped at 100, so it cannot
 * exceed 100 and has no "heavy" reading - overshoot is a per-muscle fact, and the
 * tally beside the dial is where it belongs.
 */
export function scoreBand(score: number): CoverageBand {
  if (score < 50) return "short";
  if (score < 85) return "near";
  return "covered";
}

export type DialGeometry = {
  /** Arc path for a 180-degree gauge. */
  path: string;
  /** Length of that arc, for dasharray. */
  length: number;
  /** Dash offset that leaves `score` percent of the arc drawn. */
  offset: number;
  viewBox: string;
};

/**
 * A half-circle gauge. Drawn as a stroked arc rather than a rotated rectangle so
 * it stays crisp at any size and needs no wrapper to clip it.
 */
export function dialGeometry(score: number, radius = 52, stroke = 9): DialGeometry {
  const padding = stroke / 2 + 1;
  const width = radius * 2 + padding * 2;
  const height = radius + padding * 2;
  const centreY = radius + padding;
  const length = Math.PI * radius;
  const filled = Math.max(0, Math.min(1, score / 100));
  return {
    path: `M ${padding} ${centreY} A ${radius} ${radius} 0 0 1 ${padding + radius * 2} ${centreY}`,
    length,
    offset: length * (1 - filled),
    viewBox: `0 0 ${width} ${height}`,
  };
}
