import "@/capability-rank.css";
import { rankById, type RankId } from "@shared/capabilityRank";
import { RankEmblem } from "@/components/RankEmblem";
import { rankIconSources } from "@/lib/rankIcons";

/**
 * A rank's approved badge, exactly as supplied: raster artwork, never redrawn, tinted, faded
 * or filtered. Its colours are its own; the flat rank colour is for the map and the swatches.
 *
 * `size` is the CSS box the badge is contained in; the browser picks the 128 or 384 px file
 * from that and the screen density. Decorative by default - empty alt - because a badge nearly
 * always sits beside the rank's name, and a second announcement of it is noise; pass
 * `labelled` where it stands alone.
 *
 * A rank whose approved artwork has not arrived yet (`iconSrc` null) draws the emblem from
 * rankEmblems.ts instead, so no rank is ever iconless and nothing older stands in for it.
 */
export function RankIcon({ rankId, size, labelled = false, className }: { rankId: RankId; size: number; labelled?: boolean; className?: string }) {
  const rank = rankById.get(rankId)!;
  if (!rank.iconSrc) return <RankEmblem rankId={rankId} size={size} labelled={labelled} className={className} />;
  const { src, srcSet } = rankIconSources(rank.iconSrc);
  return (
    <img
      className={className ? `rank-icon ${className}` : "rank-icon"}
      src={src}
      srcSet={srcSet}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={labelled ? `${rank.fullName} rank` : ""}
      decoding="async"
      draggable={false}
      data-rank-icon={rankId}
    />
  );
}
