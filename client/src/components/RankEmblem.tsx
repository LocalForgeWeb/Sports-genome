import "@/capability-rank.css";
import type { RankId } from "@shared/capabilityRank";
import { rankById, rankBadgeAccentToken } from "@shared/capabilityRank";
import { EMBLEM_STROKE, EMBLEM_VIEWBOX, rankEmblems } from "@/lib/rankEmblems";

/**
 * A rank's emblem. Coloured by the rank's badge accent unless told otherwise; `monochrome`
 * leaves it on `currentColor`, which is how every emblem is designed to be read first.
 *
 * Decorative by default, because an emblem almost always sits beside the rank's name and a
 * second announcement of it is noise. Pass `labelled` where the emblem stands alone.
 */
export function RankEmblem({ rankId, size = 24, monochrome = false, labelled = false, className }: { rankId: RankId; size?: number; monochrome?: boolean; labelled?: boolean; className?: string }) {
  const geometry = rankEmblems[rankId];
  const rank = rankById.get(rankId);
  const color = monochrome ? undefined : `var(${rankBadgeAccentToken(rankId)})`;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${EMBLEM_VIEWBOX} ${EMBLEM_VIEWBOX}`}
      width={size}
      height={size}
      data-rank-emblem={rankId}
      style={color ? { color } : undefined}
      {...(labelled ? { role: "img", "aria-label": `${rank?.fullName ?? rankId} rank emblem` } : { "aria-hidden": true, focusable: "false" })}
    >
      <g fill="none" stroke="currentColor" strokeWidth={EMBLEM_STROKE} strokeLinecap="round" strokeLinejoin="round">
        {geometry.strokes.map((d) => <path key={d} d={d} />)}
      </g>
      {geometry.fills.length > 0 && (
        <g fill="currentColor">
          {geometry.fills.map((fill) => <path key={fill.d} d={fill.d} fillRule={fill.evenOdd ? "evenodd" : undefined} />)}
        </g>
      )}
    </svg>
  );
}
