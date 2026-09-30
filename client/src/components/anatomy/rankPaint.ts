import { rankColorToken, type RankId } from "@shared/capabilityRank";

/**
 * How a region is painted in rank encoding, for the Strength map and its row thumbnails alike:
 * a rank's flat token, the unscored hatch, or nothing (the figure's resting muscle). The
 * thumbnails had their own rule, which painted "not scored" flat pale, the same as Prospect
 * (Sep 28 regression brief §10).
 */
export function rankPaint(rank: RankId | "unscored" | undefined, unscoredPatternId: string): string | undefined {
  if (rank === "unscored") return `url(#${unscoredPatternId})`;
  return rank ? `var(${rankColorToken(rank)})` : undefined;
}
