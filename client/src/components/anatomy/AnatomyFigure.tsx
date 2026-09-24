import React from "react";
import { useId, useMemo, useRef, useState } from "react";
import { anatomyViewBox, anatomyViews, type AnatomyMuscle, type AnatomyView } from "./figureGeometry";
import type { AnatomyRole } from "@/lib/anatomyRegions";
import { rankMapFillToken, type RankId } from "@shared/capabilityRank";
import "./anatomy-figure.css";

/**
 * The Body Lab figure.
 *
 * Geometry is adapted anatomy from muscle_mapper (MIT), not drawn here. Two
 * earlier attempts generated the body from anchor points and both read as a
 * segmented mannequin — convex blobs with no deltoid cap and no taper. The
 * artwork is a geometry layer; Sports Genome supplies the meaning.
 *
 * Painting order matters and is the whole trick:
 *
 *   1. **Shell** — the body outline filled flat, so joints the muscle layer does
 *      not cover (knees, shins) read as body rather than holes in it.
 *   2. **Muscle fills** — neutral at rest, recoloured from Body Lab data.
 *   3. **Linework** — the source's stroke-only anatomical detail, above every
 *      fill. This is what keeps the body legible when every region is the same
 *      grey, which is the bar: if it only looks good coloured, it is not good.
 *
 * Two structural choices carried over, each answering a measured defect:
 *
 *   - **One object per canonical muscle.** The app stores a single active muscle
 *     key, not a side or a subdivision, so the selectable unit is the key — both
 *     sides and every visual part in one focusable group.
 *   - **Hit geometry is separate from visible geometry.** Narrow muscles get a
 *     wider invisible target rather than being drawn fatter, painted
 *     largest-area-first so a small muscle's target sits above its big
 *     neighbour's. The Body Lab contract names "visually enlarging anatomy
 *     solely to solve hit testing" an anti-pattern.
 */

/**
 * How far a region's invisible target extends past its drawn edge, in viewBox
 * units. The source figure is 676 units wide against the old 232, so this is
 * scaled to match: ~5px at iPhone width, the value measured to give zero
 * cross-region mis-resolutions.
 */
const HIT_HALO = 16;

/**
 * Space between the two bodies in `both` view, in viewBox units. Wide enough
 * that the anterior figure's arm and the posterior figure's arm read as two
 * bodies rather than one crowded one.
 */
const PANEL_GAP = 72;

export type AnatomyView3 = "front" | "back" | "both";

/**
 * One body in the drawing. `both` places the anterior and posterior figures
 * side by side on one canvas, which removes the flip entirely: every region is
 * visible at once, so a selection can never be hiding on the side you are not
 * looking at. Both source figures were authored in one viewBox, so the two
 * panels align structurally rather than by eye.
 */
type Panel = { view: "front" | "back"; dx: number; figure: AnatomyView };

/** A muscle gathered across every panel that draws it, so one key is one object. */
type ComposedMuscle = { key: string; area: number; parts: { dx: number; muscle: AnatomyMuscle }[] };

export type AnatomyFigureProps = {
  view: AnatomyView3;
  /** Region key → role. Absent keys render neutral. */
  roles: Record<string, AnatomyRole>;
  /** Region keys shown as selected. A Strength Genome region spans several. */
  selectedKeys: readonly string[];
  /**
   * One named subdivision to ring instead of the whole region — the head the
   * athlete actually pointed at. Both sides of it are ringed, since the app
   * carries no per-side state.
   */
  selectedPart?: string | null;
  /** `pathId` names the exact drawn sub-region that was hit. */
  onSelect: (regionKey: string, pathId?: string) => void;
  labelFor: (regionKey: string) => string;
  onHover?: (regionKey: string | null) => void;
  /**
   * Strength/Rank encoding. When given, the figure is drawn by capability rank instead of
   * exercise role: a ranked key takes its rank's flat fill, and a key marked "unscored" is drawn
   * recessive and hatched, outside the ordered scale. A key absent from the map is not part of
   * any rankable region - the feet, say - and stays neutral anatomy: hatching it would claim a
   * measurement the model does not even attempt. Roles are ignored.
   */
  rankFor?: Readonly<Record<string, RankId | "unscored">>;
  /** Replaces the role wording in each region's accessible name. */
  describeFor?: (regionKey: string) => string | undefined;
};

export function AnatomyFigure({ view, roles, selectedKeys, selectedPart, onSelect, labelFor, onHover, rankFor, describeFor }: AnatomyFigureProps) {
  const uid = useId();
  const [focusedKey, setFocusedKey] = useState("");
  const hoverRef = useRef("");
  const isSelected = (key: string) => selectedKeys.includes(key);

  const panels = useMemo<Panel[]>(() => (
    view === "both"
      ? [
        { view: "front", dx: 0, figure: anatomyViews.front },
        { view: "back", dx: anatomyViewBox.width + PANEL_GAP, figure: anatomyViews.back },
      ]
      : [{ view, dx: 0, figure: anatomyViews[view] }]
  ), [view]);

  /**
   * Selection and hit testing work on the merged key, not per panel. `traps`
   * is drawn on both bodies and is still one muscle: tapping either lights
   * both, and the figure stays one tab stop rather than two.
   */
  const composed = useMemo<ComposedMuscle[]>(() => {
    const byKey = new Map<string, ComposedMuscle>();
    panels.forEach((panel) => panel.figure.muscles.forEach((muscle) => {
      const existing = byKey.get(muscle.key);
      if (existing) { existing.area += muscle.area; existing.parts.push({ dx: panel.dx, muscle }); return; }
      byKey.set(muscle.key, { key: muscle.key, area: muscle.area, parts: [{ dx: panel.dx, muscle }] });
    }));
    // Largest first, so a small muscle's target lands above its big neighbour's.
    return Array.from(byKey.values()).sort((a, b) => b.area - a.area);
  }, [panels]);

  const setHover = (key: string) => {
    if (hoverRef.current === key) return;
    hoverRef.current = key;
    onHover?.(key || null);
  };

  // Roving tabindex: the figure is one stop in the page's tab order, and arrow
  // keys move within it. A tab stop per muscle would bury the rest of the page.
  const tabbableKey = useMemo(() => {
    const onFigure = selectedKeys.find((key) => composed.some((muscle) => muscle.key === key));
    return onFigure ?? composed[0]?.key ?? "";
  }, [selectedKeys, composed]);

  const moveFocus = (fromKey: string, step: number) => {
    const index = composed.findIndex((muscle) => muscle.key === fromKey);
    if (index < 0) return;
    const next = composed[(index + step + composed.length) % composed.length];
    setFocusedKey(next.key);
    document.getElementById(`${uid}-hit-${next.key}`)?.focus?.();
  };

  const rankEncoding = rankFor !== undefined;

  const fillFor = (key: string) => {
    if (rankEncoding) {
      const rankId = rankFor[key];
      if (rankId === "unscored") return `url(#${uid}-unscored)`;
      return rankId ? `var(${rankMapFillToken(rankId)})` : undefined;
    }
    const role = roles[key];
    if (role === "primary") return `url(#${uid}-primary)`;
    if (role === "supporting") return `url(#${uid}-supporting)`;
    return undefined;
  };

  const clipFor = (half: string | null) => (half ? `url(#${uid}-${half})` : undefined);

  const describe = (key: string) => {
    const described = describeFor?.(key);
    if (described) return `${described}${isSelected(key) ? ", selected" : ""}`;
    const role = roles[key] ?? "neutral";
    const roleWord = role === "primary" ? "primary role" : role === "supporting" ? "supporting role" : "not involved";
    return `${labelFor(key)}, ${roleWord}${isSelected(key) ? ", selected" : ""}`;
  };

  const { width, height } = anatomyViewBox;
  const canvasWidth = view === "both" ? width * 2 + PANEL_GAP : width;
  const viewName = view === "both" ? "Anterior and posterior" : view === "front" ? "Anterior" : "Posterior";
  // One mid serves both panels: the two source figures share a viewBox, and the
  // clip rects ride each panel's own transform into place.
  const mid = panels[0].figure.mid;

  return (
    <svg
      className="anatomy-figure"
      data-view={view}
      data-encoding={rankEncoding ? "rank" : undefined}
      viewBox={`0 0 ${canvasWidth} ${height}`}
      role="group"
      aria-label={`${viewName} muscle map. ${composed.length} selectable regions.`}
      onPointerLeave={() => setHover("")}
    >
      <defs>
        {/* Halves for the paired muscles the source drew as one shape. */}
        <clipPath id={`${uid}-viewerLeft`}>
          <rect x="0" y="0" width={mid} height={height} />
        </clipPath>
        <clipPath id={`${uid}-viewerRight`}>
          <rect x={mid} y="0" width={width - mid} height={height} />
        </clipPath>
        {/* A flat flood over a whole region reads as paint-by-numbers; a
            gradient gives the muscle a lit side. Stops come from CSS variables
            so the dark-surface override reaches them too. */}
        <linearGradient id={`${uid}-supporting`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--anatomy-supporting-1)" />
          <stop offset="100%" stopColor="var(--anatomy-supporting-2)" />
        </linearGradient>
        <linearGradient id={`${uid}-primary`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--anatomy-primary-1)" />
          <stop offset="100%" stopColor="var(--anatomy-primary-2)" />
        </linearGradient>
        {/* Not scored: hatched, about 7px apart at the figure's usual size, so the cue that
            says "nothing measured here" is texture rather than a lightness that could be
            mistaken for a step on the rank scale. */}
        {rankEncoding && (
          <pattern id={`${uid}-unscored`} patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
            <rect width="16" height="16" fill="var(--sg-rank-unavailable-fill)" />
            <rect width="4" height="16" fill="var(--sg-rank-unavailable-hatch)" />
          </pattern>
        )}
      </defs>

      {panels.map((panel) => (
        <g key={`art-${panel.view}`} aria-hidden="true" transform={panel.dx ? `translate(${panel.dx},0)` : undefined}>
          {panel.figure.shell.map((d, i) => (
            <path key={`shell-${i}`} className="anatomy-shell" d={d} />
          ))}
          {panel.figure.structural.map((piece) => (
            <path key={piece.id} className="anatomy-structural" d={piece.d} />
          ))}
          {panel.figure.muscles.map((muscle) => {
            const paint = fillFor(muscle.key);
            return (
              <g
                key={muscle.key}
                className="anatomy-muscle"
                data-muscle={muscle.key}
                data-role={rankEncoding ? undefined : roles[muscle.key] ?? "neutral"}
                data-rank={rankEncoding && rankFor[muscle.key] && rankFor[muscle.key] !== "unscored" ? rankFor[muscle.key] : undefined}
                data-unscored={rankEncoding && rankFor[muscle.key] === "unscored" ? "true" : undefined}
                data-selected={isSelected(muscle.key) ? "true" : undefined}
                data-focused={focusedKey === muscle.key ? "true" : undefined}
              >
                {muscle.paths.map((path) => (
                  // Inline style, not a `fill` attribute: a presentation attribute
                  // loses to any stylesheet rule, so the neutral fill silently won
                  // and no muscle ever showed its role colour.
                  <path
                    key={path.id}
                    id={panel.dx ? undefined : path.id}
                    data-muscle-id={path.id}
                    d={path.d}
                    clipPath={clipFor(path.clipHalf)}
                    style={paint ? { fill: paint } : undefined}
                  />
                ))}
              </g>
            );
          })}
          {/* The source's own anatomical detail, above every fill. Without it the
              body loses its seams the moment two neighbours share a colour. */}
          <g className="anatomy-linework">
            {panel.figure.linework.map((d, i) => (
              <path key={`line-${i}`} d={d} />
            ))}
          </g>
        </g>
      ))}

      {/* Selection redrawn on top: a muscle already carrying a role colour has
          no colour left to spend, so the cue is weight, not hue. A region drawn
          on both bodies is ringed on both — it is one muscle seen twice.
          Two strokes rather than one thick one: a soft wide halo under a crisp
          hairline. A single 6px white outline read as a sticker slapped over
          the anatomy, and at that width it swallowed the shape it was marking. */}
      {selectedKeys.length > 0 &&
        composed
          .filter((muscle) => isSelected(muscle.key))
          .flatMap((muscle) => muscle.parts.map((part) => {
            // Ring the named head when one is picked; the whole muscle otherwise.
            const ringed = selectedPart
              ? part.muscle.paths.filter((path) => path.part === selectedPart)
              : part.muscle.paths;
            if (!ringed.length) return null;
            return (
              <g key={`sel-${muscle.key}-${part.dx}`} transform={part.dx ? `translate(${part.dx},0)` : undefined}>
                {ringed.map((path) => (
                  <path key={`halo-${path.id}`} className="anatomy-selection-halo" d={path.d} clipPath={clipFor(path.clipHalf)} />
                ))}
                {ringed.map((path) => (
                  <path key={`sel-${path.id}`} className="anatomy-selection-ring" d={path.d} clipPath={clipFor(path.clipHalf)} />
                ))}
              </g>
            );
          }))}

      <g className="anatomy-hit-layer">
        {composed.map((muscle) => (
          <g
            key={muscle.key}
            id={`${uid}-hit-${muscle.key}`}
            className="anatomy-hit"
            role="button"
            aria-label={describe(muscle.key)}
            aria-pressed={isSelected(muscle.key)}
            tabIndex={tabbableKey === muscle.key ? 0 : -1}
            onClick={(event) => onSelect(muscle.key, (event.target as SVGElement)?.getAttribute?.("data-path-id") ?? undefined)}
            onPointerEnter={() => setHover(muscle.key)}
            onFocus={() => { setFocusedKey(muscle.key); setHover(muscle.key); }}
            onBlur={() => { setFocusedKey(""); setHover(""); }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(muscle.key);
                return;
              }
              if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                event.preventDefault();
                moveFocus(muscle.key, 1);
                return;
              }
              if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(muscle.key, -1);
              }
            }}
          >
            {muscle.parts.map((part) => (
              <g key={`hit-${muscle.key}-${part.dx}`} transform={part.dx ? `translate(${part.dx},0)` : undefined}>
                {part.muscle.paths.map((path) => (
                  // Transparent fill plus a transparent halo stroke: the target
                  // grows outward without the drawn muscle changing shape.
                  <path
                    key={`hit-${path.id}`}
                    d={path.d}
                    data-path-id={path.id}
                    clipPath={clipFor(path.clipHalf)}
                    strokeWidth={HIT_HALO}
                  />
                ))}
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
