import "@/capability-rank.css";
import type { ReactNode } from "react";
import { RANKS, confidenceLabel, muscleScoreBounds, rankColorToken, rankForMuscle, rankRangeLabel, type MuscleEvidence, type MuscleScore, type RankId, type RegionRank } from "@shared/capabilityRank";
import { RankIcon } from "@/components/RankIcon";
import { ordinal, percentileFigure } from "@/lib/strengthPercentileCard";

/** The number a rank percentile is printed as: the one rule a lift's card uses too (`percentileFigure`). */
export function displayPercentile(percentile: number): number {
  return percentileFigure(percentile);
}

/**
 * A muscle's weighted benchmark score as a number or a bound: "91", "91–92", "above 95",
 * "below 6". Floored like a percentile so it never prints into the band above its colour; an
 * upper bound is rounded up so "below" stays true.
 */
export function muscleScoreValue(muscle: Pick<MuscleScore, "percentile" | "scoreBound" | "lowerBound" | "upperBound" | "estimated" | "atLeast">): string {
  const value = boundedScoreValue(muscle);
  // Past the top anchor through an estimated lift, the score is as much an estimate as that lift:
  // "≈ 98 (estimated)". Read from sets stopped short of failure only, it is a floor: "at least 41".
  const shown = muscle.estimated ? `≈ ${value} (estimated)` : value;
  return muscle.atLeast && muscleScoreBounds(muscle).bound === "exact" ? `at least ${shown}` : shown;
}

function boundedScoreValue(muscle: Pick<MuscleScore, "percentile" | "scoreBound" | "lowerBound" | "upperBound">): string {
  const { bound, lower, upper } = muscleScoreBounds(muscle);
  if (bound === "exact") return String(displayPercentile(lower));
  if (bound === "at_least") return `above ${displayPercentile(lower)}`;
  if (bound === "at_most") return `below ${Math.max(1, Math.ceil(upper))}`;
  const low = displayPercentile(lower);
  const high = displayPercentile(upper);
  return low === high ? String(low) : `${low}–${high}`;
}

/**
 * "Benchmark score 41", hedged where the evidence is thin. A muscle's number is the weighted
 * benchmark score of its lifts' percentiles - not a percentile of muscle strength - so it is
 * never printed as "41st percentile".
 */
export function rankScoreText(regionRank: Pick<RegionRank, "representative" | "confidence">): string {
  const { representative } = regionRank;
  const value = muscleScoreValue(representative);
  const plain = muscleScoreBounds(representative).bound === "exact" && !representative.estimated && !representative.atLeast;
  return regionRank.confidence === "low" && plain ? `Benchmark score about ${value}` : `Benchmark score ${value}`;
}

/**
 * One lift's own result: "89th percentile on its own", "≈ 98th percentile on its own (estimated)"
 * on the estimated tail, "at least 41st …" for a set stopped short of failure, or where it stands
 * past a benchmark when its curve allows no estimate.
 */
export function liftResultText(item: Pick<MuscleEvidence, "exercisePercentile" | "bound" | "estimated" | "notToFailure">): string | null {
  if (item.exercisePercentile == null) return null;
  if (item.bound === "above") return `above the ${ordinal(displayPercentile(item.exercisePercentile))}-percentile benchmark`;
  if (item.bound === "below") return `below the ${ordinal(Math.max(1, Math.ceil(item.exercisePercentile)))}-percentile benchmark`;
  return rankOrdinal(item.exercisePercentile, item.estimated, "percentile on its own", item.notToFailure);
}

/**
 * What a lift in a supporting role counts as for this muscle, when that differs from its own
 * result: "counts as 86 here". Null for a prime mover, which counts at its own percentile.
 */
export function countedText(item: Pick<MuscleEvidence, "exercisePercentile" | "bound" | "countedLow" | "countedHigh">): string | null {
  const low = item.countedLow;
  if (low == null || item.exercisePercentile == null) return null;
  if (item.bound === "above") return Math.abs(low - item.exercisePercentile) < 0.05 ? null : `counts as above ${displayPercentile(low)} here`;
  if (item.bound === "below") return item.countedHigh == null || Math.abs(item.countedHigh - item.exercisePercentile) < 0.05 ? null : `counts as below ${Math.ceil(item.countedHigh)} here`;
  return Math.abs(low - item.exercisePercentile) < 0.05 ? null : `counts as ${displayPercentile(low)} here`;
}

const oneDecimal = (value: number) => (Math.floor(value * 10) / 10).toFixed(1).replace(/\.0$/, "");

/**
 * The score's arithmetic, in the numbers the rows show: "89.4 × 68% + above 95 × 32% =
 * 91.2 to 92.8". Each term is what the lift counts as for the muscle, times its share.
 */
export function scoreArithmeticText(muscle: Pick<MuscleScore, "evidence" | "percentile" | "scoreBound" | "lowerBound" | "upperBound">): string | null {
  const rows = muscle.evidence.filter((item) => item.weightShare != null && (item.countedLow ?? item.exercisePercentile) != null);
  if (rows.length < 2) return null;
  const term = (item: MuscleEvidence) => {
    const value = item.countedLow ?? item.exercisePercentile!;
    const shown = item.bound === "above" ? `above ${oneDecimal(value)}` : item.bound === "below" ? `below ${oneDecimal(item.countedHigh ?? value)}` : oneDecimal(value);
    return `${shown} × ${Math.round(item.weightShare! * 100)}%`;
  };
  const { bound, lower, upper } = muscleScoreBounds(muscle);
  const result = bound === "exact" ? oneDecimal(lower) : bound === "at_least" ? `above ${oneDecimal(lower)}` : bound === "at_most" ? `below ${oneDecimal(upper)}` : `${oneDecimal(lower)} to ${oneDecimal(upper)}`;
  return `${rows.map(term).join(" + ")} = ${result}`;
}

/**
 * A percentile as a rank surface prints it: "96th", or "≈ 96th (estimated)" when it is past the
 * top anchor the comparison data measures and rests on the estimated tail. `noun` goes between
 * the number and the label: "96th percentile", "≈ 96th percentile (estimated)". A floor - read from
 * sets stopped short of failure - reads "at least 41st", lower case, for the middle of a line.
 */
export function rankOrdinal(percentile: number, estimated?: boolean, noun = "", floor = false): string {
  const text = `${ordinal(displayPercentile(percentile))}${noun ? ` ${noun}` : ""}`;
  const shown = estimated ? `≈ ${text} (estimated)` : text;
  return floor ? `at least ${shown}` : shown;
}

/**
 * "41st percentile", "About 41st percentile" where the evidence is thin, "≈ 97th percentile
 * (estimated)" past the top anchor, or "At least 41st percentile" from sets stopped short of failure.
 */
export function rankPercentileText(regionRank: Pick<RegionRank, "representative" | "confidence">): string {
  const { percentile, estimated, atLeast } = regionRank.representative;
  if (atLeast) return `At least ${rankOrdinal(percentile, estimated, "percentile")}`;
  if (estimated) return rankOrdinal(percentile, true, "percentile");
  const text = rankOrdinal(percentile, false, "percentile");
  return regionRank.confidence === "low" ? `About ${text}` : text;
}

const sexWord = { male: "men", female: "women" } as const;

/** Who a muscle's score was read against, in the norm source's own words - never paraphrased into a claim it did not make. */
export function referenceGroupText(regionRank: RegionRank): string | null {
  const groups = regionRank.representative.referenceGroups;
  if (groups.length === 0) return null;
  if (groups.length === 1) return `${groups[0].label}, ${sexWord[groups[0].sex]}`;
  return `${groups.length} reference groups: ${groups.map((group) => `${group.label} (${sexWord[group.sex]})`).join("; ")}`;
}

/* -------------------------------------------------------------------------------------------- */

/**
 * Seven labelled swatches and the unscored sample, each band under its badge.
 *
 * Categorical on purpose: equal-width swatches name bands, they do not measure the distance
 * between lifts. The badge is the same artwork the rank card shows, so the legend is also
 * where the seven are seen side by side; the swatch beneath it is the flat colour the map
 * paints with, which the badge's own highlights and shadows do not have to match. Each band
 * is a toggle that answers "which of mine are here" in text, which is the legend's
 * equivalent for anyone not reading colour.
 */
export function RankLegend({ activeBand, onBand, regionLabelsByRank }: { activeBand: RankId | null; onBand: (band: RankId | null) => void; regionLabelsByRank: ReadonlyMap<RankId, string[]> }) {
  const active = activeBand ? RANKS.find((rank) => rank.id === activeBand) : null;
  const matches = activeBand ? regionLabelsByRank.get(activeBand) ?? [] : [];
  return (
    <div className="rank-legend">
      <ul className="rank-legend-scale" aria-label="Rank colours, lowest to highest">
        {RANKS.map((rank) => (
          <li key={rank.id}>
            <button
              type="button"
              className="rank-legend-button"
              aria-pressed={activeBand === rank.id}
              aria-label={`${rank.fullName}, scores ${rankRangeLabel(rank)}. ${(regionLabelsByRank.get(rank.id) ?? []).length} of your muscle groups.`}
              onClick={() => onBand(activeBand === rank.id ? null : rank.id)}
            >
              <RankIcon rankId={rank.id} size={32} className="rank-legend-icon" />
              <span className="rank-legend-swatch" data-rank={rank.id} style={{ background: `var(${rankColorToken(rank.id)})` }} aria-hidden="true" />
              <span className="rank-legend-name" aria-hidden="true">{rank.shortName}</span>
              <span className="rank-legend-range" aria-hidden="true">{rankRangeLabel(rank)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="rank-legend-foot">
        <span className="rank-legend-unscored"><i aria-hidden="true" />Not scored</span>
        <span>Sports Genome ranks, not competition titles.</span>
      </div>
      {active && (
        <p className="rank-legend-note" role="status">
          {matches.length ? `At ${active.fullName}: ${matches.join(", ")}.` : `None of your muscle groups is at ${active.fullName} yet.`}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------- */

/**
 * A selected region's rank: name, emblem, percentile, who it is against, and what state it is
 * in. Estimated is the only state shown because it is the only one this build can support:
 * confirming a rank needs a calibrated error model or repeat comparable lifts, and neither is
 * wired yet, so nothing here claims or celebrates a confirmed rank.
 *
 * `provenance` is the record's account of the dated lifts behind the rank, shown as a fact
 * under the rank rather than folded away. Given it, "Why this rank?" keeps the method and drops
 * its own list of exercises, which the provenance already names with more detail.
 */
export function RankCard({ regionRank, provenance }: { regionRank: RegionRank; provenance?: ReactNode }) {
  const { rank, representative, confidence, muscles, rankIsMinimum } = regionRank;
  const reference = referenceGroupText(regionRank);
  const next = RANKS.find((candidate) => candidate.sortOrder === rank.sortOrder + 1);
  const others = muscles.filter((muscle) => muscle.muscleId !== representative.muscleId);
  /** With one lift the share is 100% and the weighting has nothing to explain. */
  const shared = representative.evidence.length > 1;
  const beyond = representative.evidence.filter((item) => item.bound === "above");
  const arithmetic = scoreArithmeticText(representative);
  const muscleWord = representative.name.toLowerCase();
  return (
    <section className="rank-card" aria-label={`${rank.fullName} rank${rankIsMinimum ? ", at least" : ""}`}>
      <span className="rank-emblem-slot"><RankIcon rankId={rank.id} size={64} /></span>
      <div className="rank-head">
        <p className="rank-name">{rank.fullName}</p>
        <p className="rank-percentile">{rankScoreText(regionRank)}</p>
      </div>
      <div className="rank-body">
        {reference && <p className="rank-cohort">Compared with {reference}.</p>}
        <ul className="rank-states" aria-label="Rank state">
          <li>Estimated</li>
          <li>{confidenceLabel[confidence]}</li>
          {rankIsMinimum && <li>Minimum rank</li>}
        </ul>
        {/* A lift past the reference's top is recognised as such, never printed as an exact 95th. */}
        {beyond.length > 0 && (
          <p className="rank-beyond" data-rank-beyond>
            {beyond.length === 1 ? `${beyond[0].exerciseName} is` : `${beyond.length} lifts are`} above the highest benchmark this comparison publishes, the {ordinal(displayPercentile(beyond[0].exercisePercentile ?? 95))} percentile. A more precise percentile is not available{rankIsMinimum ? `, so ${rank.fullName} is the lowest rank your lifts support` : ""}.
          </p>
        )}
        {provenance}
        <details>
          <summary>How this is calculated</summary>
          <p>
            Your {muscleWord} score weighs each lift's percentile by how directly the lift works the {muscleWord} and how sure its comparison is.
            {arithmetic ? <>{" "}<span data-rank-arithmetic>{arithmetic}</span>.</> : " With one lift, the score is that lift's percentile."}
          </p>
          <p>
            It is a score on the percentile scale, not a percentile of {muscleWord} strength: each lift's own percentile compares that lift with {reference ? "the group above" : "its comparison group"}, and no one has measured how muscles compare.
            {beyond.length > 0 ? " A lift above the highest benchmark could stand anywhere above it, so the score is given as a range or a minimum." : ""}
          </p>
          <p>
            Drawn from {muscleWord}, the muscle in this group with the most evidence behind it:
            {" "}{representative.evidenceCount} {representative.evidenceCount === 1 ? "exercise" : "exercises"} across {representative.movementPatternCount} {representative.movementPatternCount === 1 ? "movement" : "movements"}.
          </p>
          {!provenance && representative.evidence.length > 0 && (
            <ul aria-label="Lifts behind this rank">
              {representative.evidence.map((item, index) => {
                const result = liftResultText(item);
                const counted = countedText(item);
                return (
                  <li key={`${item.exerciseName}-${index}`}>
                    {item.exerciseName}{item.role ? ` · ${item.role}` : ""}{result ? ` · ${result}` : ""}{counted ? ` · ${counted}` : ""}{item.notToFailure ? " · not to failure" : ""}{shared && item.weightShare != null ? ` · ${Math.round(item.weightShare * 100)}% of this rank` : ""}
                  </li>
                );
              })}
            </ul>
          )}
          {shared && !provenance && (
            /* D-016: directness. The share above is what each lift carried; this is why they differ.
               Left out beside the sheet's provenance, which already says it with the shares. */
            <p data-rank-directness>
              The most direct lift counts most. A lift this muscle does most of the work in says more about it than one it shares with several other muscles, where a weaker one can hold the load back.
            </p>
          )}
          {others.length > 0 && (
            <>
              <p>Other muscles in this group:</p>
              <ul className="rank-muscles">
                {others.map((muscle) => {
                  const own = rankForMuscle(muscle);
                  return (
                    <li key={muscle.muscleId}>
                      <span>{muscle.name}</span>
                      <span>{own && <RankIcon rankId={own.rank.id} size={32} />}{own ? `${own.isMinimum ? "at least " : ""}${own.rank.shortName}` : ""} · score {muscleScoreValue(muscle)}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p>
            {confidence === "high"
              ? "Several different movements agree on this one."
              : "A lift from another movement that trains this group would firm this up."}
            {/* No progress-to-next line from a bound: how far is left cannot be said. */}
            {next && !rankIsMinimum && muscleScoreBounds(representative).bound === "exact" ? ` Next: ${next.fullName} from a score of ${next.minInclusive}.` : ""}
          </p>
          <p>Estimated from your logged lifts. A rank is confirmed only once repeat comparable lifts back it up, and that check is not live yet — so every rank here is an estimate.</p>
          <p>A Sports Genome rank, not a competition credential. Percentiles put lifts in order; the gap between two percentiles is not an equal step in strength.</p>
        </details>
      </div>
    </section>
  );
}

/**
 * Ranks on their way. Plain, with no hatch and no badge: a group still being ranked has lost
 * nothing, and must not read as one that has no rank.
 */
export function PendingRankCard({ offline = false }: { offline?: boolean }) {
  return (
    <p className="rank-pending-note" role="status">
      {offline ? "Waiting for a connection to rank your lifts." : "Ranking your lifts…"}
    </p>
  );
}

/** Outside the scale, in words as well as texture. */
export function UnscoredRankCard({ hasRecords }: { hasRecords: boolean }) {
  return (
    <div className="rank-unscored-card" role="note">
      <strong>Not scored</strong>
      {hasRecords
        ? "The lifts logged for this group have no percentile yet — none has a comparison group to read it against."
        : "Nothing logged for this muscle group yet, so there is nothing to rank."}
    </div>
  );
}
