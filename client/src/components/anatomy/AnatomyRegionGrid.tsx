import React from "react";
import { useId, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { anatomyViewBox, anatomyViews } from "./figureGeometry";
import { rankMapFillToken, type RankId } from "@shared/capabilityRank";
import { RankEmblem } from "@/components/RankEmblem";
import "./anatomy-region-grid.css";

/**
 * The list route into the body map.
 *
 * Tapping the figure is the fast path, but it can never be the only one. Half
 * the regions are small enough that a precise tap is a fair ask only on a big
 * screen, and showing both bodies at once halves the figure again — so the grid
 * is what guarantees every region is reachable at a full 44px, named in words,
 * with its state legible without decoding a colour.
 *
 * Each row carries a thumbnail of where the region actually is. That is the one
 * job the reference apps use leader lines and labels for, and the thumbnail does
 * it without writing 30 labels across the artwork.
 */

export type AnatomyRegionRow = {
  id: string;
  label: string;
  /** Drawn muscle keys, for the thumbnail. */
  muscleKeys: readonly string[];
  /** The region's state, in the athlete's words. */
  state: string;
  /** Whether the figure is highlighting this region. Drives tone, never rank. */
  active: boolean;
  /** Strength/Rank mode: the region's rank, shown as an emblem and as the thumbnail's fill. */
  rankId?: RankId;
  /** Picked out by a legend band, so "which of mine are Varsity" has an answer in the list. */
  highlighted?: boolean;
};

/**
 * Which body to draw the thumbnail on: whichever one draws more of the region.
 * Ties go to the anterior view, which is the one the athlete sees first.
 */
function thumbView(muscleKeys: readonly string[]): "front" | "back" {
  const count = (view: "front" | "back") =>
    anatomyViews[view].muscles.filter((muscle) => muscleKeys.includes(muscle.key)).length;
  return count("back") > count("front") ? "back" : "front";
}

function RegionThumb({ muscleKeys, active, shellId, rankId }: { muscleKeys: readonly string[]; active: boolean; shellId: string; rankId?: RankId }) {
  const view = thumbView(muscleKeys);
  const paths = useMemo(
    () => anatomyViews[view].muscles.filter((muscle) => muscleKeys.includes(muscle.key)).flatMap((muscle) => muscle.paths),
    [view, muscleKeys],
  );
  return (
    <svg
      className="region-thumb"
      data-active={active ? "true" : undefined}
      viewBox={`0 0 ${anatomyViewBox.width} ${anatomyViewBox.height}`}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${shellId}-${view}`} />
      {paths.map((path) => <path key={path.id} className="region-thumb-muscle" d={path.d} style={rankId ? { fill: `var(${rankMapFillToken(rankId)})` } : undefined} />)}
    </svg>
  );
}

export function AnatomyRegionGrid({
  rows,
  selectedId,
  onSelect,
  label,
  initialVisible = 6,
}: {
  rows: readonly AnatomyRegionRow[];
  selectedId?: string;
  onSelect: (id: string) => void;
  label: string;
  /** How many rows show before the expander. Everything shows if none is active. */
  initialVisible?: number;
}) {
  const shellId = useId().replace(/:/g, "");
  const [expanded, setExpanded] = useState(false);

  /**
   * The regions you have something in come first, because those are the ones
   * worth opening. This is ordering, not ranking: no row claims to be better
   * than another, and the words say only whether anything is on record.
   */
  const ordered = useMemo(
    () => [...rows].sort((a, b) => Number(b.active) - Number(a.active)),
    [rows],
  );
  const activeCount = ordered.filter((row) => row.active).length;
  /**
   * Collapsed by default. Eighteen cards all reading "Nothing yet" is a wall
   * rather than a menu, and the ones worth opening are the ones with something
   * in them — so the list opens on those and never truncates them.
   */
  const collapsible = ordered.length > initialVisible;
  const visible = !collapsible || expanded ? ordered : ordered.slice(0, Math.max(initialVisible, activeCount));
  const hidden = ordered.length - visible.length;

  return (
    <div className="region-grid-block">
      {/* The two shells, drawn once and referenced by every thumbnail, so the
          grid costs one body outline rather than eighteen. */}
      <svg className="region-thumb-defs" aria-hidden="true" focusable="false">
        <defs>
          {(["front", "back"] as const).map((view) => (
            <g id={`${shellId}-${view}`} key={view}>
              {anatomyViews[view].shell.map((d, i) => <path key={i} className="region-thumb-shell" d={d} />)}
            </g>
          ))}
        </defs>
      </svg>

      {/* A group of buttons, not a list of them. `role="listitem"` on a button
          replaces its button role, so a screen reader announced these as list
          items with no hint they could be activated — and because `listitem`
          takes no name from its contents, they announced with no name at all.
          The state rides in the label so it survives being read on its own. */}
      <div className="region-grid" role="group" aria-label={label}>
        {visible.map((row) => (
          <button
            key={row.id}
            type="button"
            className="region-grid-card"
            data-active={row.active ? "true" : undefined}
            data-highlighted={row.highlighted ? "true" : undefined}
            aria-label={`${row.label}, ${row.state}`}
            aria-pressed={selectedId === row.id}
            onClick={() => onSelect(row.id)}
          >
            <RegionThumb muscleKeys={row.muscleKeys} active={row.active} shellId={shellId} rankId={row.rankId} />
            <span className="region-grid-name">{row.label}</span>
            {row.rankId ? (
              // Two lines by design: rank with its emblem, then the percentile. On one line it
              // measured ~106px against a ~90px column on a phone and ran under the chevron.
              <span className="region-grid-state region-grid-state-ranked">
                <span className="region-grid-rank"><RankEmblem rankId={row.rankId} size={16} className="region-grid-emblem" />{row.state.split(" · ")[0]}</span>
                {row.state.includes(" · ") && <span className="region-grid-percentile">{row.state.split(" · ").slice(1).join(" · ")}</span>}
              </span>
            ) : <span className="region-grid-state">{row.state}</span>}
            <ChevronRight className="region-grid-chevron h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>

      {collapsible && (hidden > 0 || expanded) && (
        <button type="button" className="region-grid-toggle" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show fewer" : `Show all ${ordered.length} regions`}
        </button>
      )}
    </div>
  );
}
