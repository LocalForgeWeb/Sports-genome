import "@/capability-rank.css";
import { createElement, useId, type ReactNode } from "react";
import type { RankId } from "@shared/capabilityRank";
import { rankById } from "@shared/capabilityRank";
import { BADGE_POLISH_MIN_SIZE, EMBLEM_STROKE, EMBLEM_VIEWBOX, badgeNodes, rankEmblems, type SvgNode } from "@/lib/rankEmblems";

/** SVG attribute names as React spells them: stop-color -> stopColor, clip-path -> clipPath. */
const reactAttrs = (attrs: SvgNode["attrs"]) =>
  Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), value]));

function renderNode(node: SvgNode, key: string): ReactNode {
  return createElement(node.tag, { key, ...reactAttrs(node.attrs) }, node.children?.map((child, index) => renderNode(child, `${key}.${index}`)));
}

/**
 * A rank's badge: the emblem's own geometry, finished.
 *
 * The gem is the emblem's closed silhouette filled with the rank's colour; the frame becomes a
 * metal rim; the inner mark sits on the gem in whichever of light or dark clears 3:1 across the
 * gem's whole gradient. From 28px it is polished - gradient, metal, one restrained facet kept
 * clear of the mark - and below that it is drawn flat in the same colours.
 *
 * `monochrome` draws the master instead: every line in `currentColor`, which is how each emblem
 * is designed to be read first and what prints, embosses and survives any colour setting.
 *
 * Decorative by default, because a badge almost always sits beside the rank's name and a second
 * announcement of it is noise. Pass `labelled` where it stands alone.
 */
export function RankEmblem({ rankId, size = 24, monochrome = false, labelled = false, className }: { rankId: RankId; size?: number; monochrome?: boolean; labelled?: boolean; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const geometry = rankEmblems[rankId];
  const rank = rankById.get(rankId)!;
  const a11y = labelled
    ? { role: "img", "aria-label": `${rank.fullName} rank emblem` }
    : { "aria-hidden": true as const, focusable: "false" as const };

  if (monochrome) {
    return (
      <svg className={className} viewBox={`0 0 ${EMBLEM_VIEWBOX} ${EMBLEM_VIEWBOX}`} width={size} height={size} data-rank-emblem={rankId} {...a11y}>
        <g fill="none" stroke="currentColor" strokeWidth={EMBLEM_STROKE} strokeLinecap="round" strokeLinejoin="round">
          {geometry.strokes.map((d) => <path key={d} d={d} />)}
        </g>
        {geometry.fills.length > 0 && <g fill="currentColor">{geometry.fills.map((fill) => <path key={fill.d} d={fill.d} fillRule={fill.evenOdd ? "evenodd" : undefined} />)}</g>}
      </svg>
    );
  }

  const polished = size >= BADGE_POLISH_MIN_SIZE;
  return (
    <svg className={className} viewBox={`0 0 ${EMBLEM_VIEWBOX} ${EMBLEM_VIEWBOX}`} width={size} height={size} data-rank-emblem={rankId} data-finish={polished ? "polished" : "flat"} {...a11y}>
      {badgeNodes(rankId, { polished, uid }).map((node, index) => renderNode(node, `${index}`))}
    </svg>
  );
}
