import "@/capability-rank.css";
import type { ReactNode } from "react";
import { RANKS, confidenceLabel, rankForPercentile, rankColorToken, rankRangeLabel, type RankId, type RegionRank } from "@shared/capabilityRank";
import { RankIcon } from "@/components/RankIcon";
import { ordinal } from "@/lib/strengthPercentileCard";

/**
 * The integer a percentile is shown as.
 *
 * Floored, not rounded, so the printed number always sits inside the band its colour and
 * name come from: 19.6 rounds to "20th", which the legend files under JV, while the rank -
 * read on the raw value - is Prospect. Flooring keeps "Prospect · 19th" true to the legend's
 * 0-19. The source clamps muscle scores to 1-99, and nothing reads as "0th".
 */
export function displayPercentile(percentile: number): number {
  return Math.max(1, Math.floor(percentile));
}

/** "41st percentile", or "About 41st percentile" where the evidence is thin. */
export function rankPercentileText(regionRank: Pick<RegionRank, "representative" | "confidence">): string {
  const text = `${ordinal(displayPercentile(regionRank.representative.percentile))} percentile`;
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
              aria-label={`${rank.fullName}, percentiles ${rankRangeLabel(rank)}. ${(regionLabelsByRank.get(rank.id) ?? []).length} of your muscle groups.`}
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
  const { rank, representative, confidence, muscles } = regionRank;
  const reference = referenceGroupText(regionRank);
  const next = RANKS.find((candidate) => candidate.sortOrder === rank.sortOrder + 1);
  const others = muscles.filter((muscle) => muscle.muscleId !== representative.muscleId);
  /** With one lift the share is 100% and the weighting has nothing to explain. */
  const shared = representative.evidence.length > 1;
  return (
    <section className="rank-card" aria-label={`${rank.fullName} rank`}>
      <span className="rank-emblem-slot"><RankIcon rankId={rank.id} size={64} /></span>
      <div className="rank-head">
        <p className="rank-name">{rank.fullName}</p>
        <p className="rank-percentile">{rankPercentileText(regionRank)}</p>
      </div>
      <div className="rank-body">
        {reference && <p className="rank-cohort">Compared with {reference}.</p>}
        <ul className="rank-states" aria-label="Rank state">
          <li>Estimated</li>
          <li>{confidenceLabel[confidence]}</li>
        </ul>
        {provenance}
        <details>
          <summary>Why this rank?</summary>
          <p>
            Drawn from {representative.name.toLowerCase()}, the muscle in this group with the most evidence behind it:
            {" "}{representative.evidenceCount} {representative.evidenceCount === 1 ? "lift" : "lifts"} across {representative.movementPatternCount} {representative.movementPatternCount === 1 ? "movement" : "movements"}.
          </p>
          {!provenance && representative.evidence.length > 0 && (
            <ul aria-label="Lifts behind this rank">
              {representative.evidence.map((item, index) => (
                <li key={`${item.exerciseName}-${index}`}>
                  {item.exerciseName}{item.role ? ` · ${item.role}` : ""}{item.exercisePercentile != null ? ` · ${ordinal(displayPercentile(item.exercisePercentile))} percentile on its own` : ""}{shared && item.weightShare != null ? ` · ${Math.round(item.weightShare * 100)}% of this rank` : ""}
                </li>
              ))}
            </ul>
          )}
          {shared && (
            /* D-016: directness. The share above is what each lift carried; this is why they differ. */
            <p data-rank-directness>
              The most direct lift counts most. A lift this muscle does most of the work in says more about it than one it shares with several other muscles, where a weaker one can hold the load back.
            </p>
          )}
          {others.length > 0 && (
            <>
              <p>Other muscles in this group:</p>
              <ul className="rank-muscles">
                {others.map((muscle) => {
                  const own = rankForPercentile(muscle.percentile);
                  return (
                    <li key={muscle.muscleId}>
                      <span>{muscle.name}</span>
                      <span>{own && <RankIcon rankId={own.id} size={32} />}{own?.shortName} · {ordinal(displayPercentile(muscle.percentile))}</span>
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
            {next ? ` Next: ${next.fullName} from the ${ordinal(next.minInclusive)} percentile.` : ""}
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
