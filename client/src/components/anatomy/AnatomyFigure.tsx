import React from "react";
import { useId, useMemo, useRef, useState } from "react";
import { anatomyViewBox, anatomyViews } from "./figureGeometry";
import type { AnatomyRole } from "@/lib/anatomyRegions";
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

export type AnatomyFigureProps = {
  view: "front" | "back";
  /** Region key → role. Absent keys render neutral. */
  roles: Record<string, AnatomyRole>;
  /** Region keys shown as selected. A Strength Genome region spans several. */
  selectedKeys: readonly string[];
  onSelect: (regionKey: string) => void;
  labelFor: (regionKey: string) => string;
  onHover?: (regionKey: string | null) => void;
};

export function AnatomyFigure({ view, roles, selectedKeys, onSelect, labelFor, onHover }: AnatomyFigureProps) {
  const uid = useId();
  const figure = anatomyViews[view];
  const [focusedKey, setFocusedKey] = useState("");
  const hoverRef = useRef("");
  const isSelected = (key: string) => selectedKeys.includes(key);

  const setHover = (key: string) => {
    if (hoverRef.current === key) return;
    hoverRef.current = key;
    onHover?.(key || null);
  };

  // Roving tabindex: the figure is one stop in the page's tab order, and arrow
  // keys move within it. A tab stop per muscle would bury the rest of the page.
  const tabbableKey = useMemo(() => {
    const onFigure = selectedKeys.find((key) => figure.muscles.some((muscle) => muscle.key === key));
    return onFigure ?? figure.muscles[0]?.key ?? "";
  }, [selectedKeys, figure]);

  const moveFocus = (fromKey: string, step: number) => {
    const order = figure.muscles;
    const index = order.findIndex((muscle) => muscle.key === fromKey);
    if (index < 0) return;
    const next = order[(index + step + order.length) % order.length];
    setFocusedKey(next.key);
    document.getElementById(`${uid}-hit-${next.key}`)?.focus?.();
  };

  const fillFor = (role?: AnatomyRole) => {
    if (role === "primary") return `url(#${uid}-primary)`;
    if (role === "supporting") return `url(#${uid}-supporting)`;
    return undefined;
  };

  const clipFor = (half: string | null) => (half ? `url(#${uid}-${half})` : undefined);

  const describe = (key: string) => {
    const role = roles[key] ?? "neutral";
    const roleWord = role === "primary" ? "primary role" : role === "supporting" ? "supporting role" : "not involved";
    return `${labelFor(key)}, ${roleWord}${isSelected(key) ? ", selected" : ""}`;
  };

  const { width, height } = anatomyViewBox;

  return (
    <svg
      className="anatomy-figure"
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} muscle map. ${figure.muscles.length} selectable regions.`}
      onPointerLeave={() => setHover("")}
    >
      <defs>
        {/* Halves for the paired muscles the source drew as one shape. */}
        <clipPath id={`${uid}-viewerLeft`}>
          <rect x="0" y="0" width={figure.mid} height={height} />
        </clipPath>
        <clipPath id={`${uid}-viewerRight`}>
          <rect x={figure.mid} y="0" width={width - figure.mid} height={height} />
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
      </defs>

      <g aria-hidden="true">
        {figure.shell.map((d, i) => (
          <path key={`shell-${i}`} className="anatomy-shell" d={d} />
        ))}
        {figure.structural.map((piece) => (
          <path key={piece.id} className="anatomy-structural" d={piece.d} />
        ))}
        {figure.muscles.map((muscle) => {
          const paint = fillFor(roles[muscle.key]);
          return (
            <g
              key={muscle.key}
              className="anatomy-muscle"
              data-muscle={muscle.key}
              data-role={roles[muscle.key] ?? "neutral"}
              data-selected={isSelected(muscle.key) ? "true" : undefined}
              data-focused={focusedKey === muscle.key ? "true" : undefined}
            >
              {muscle.paths.map((path) => (
                // Inline style, not a `fill` attribute: a presentation attribute
                // loses to any stylesheet rule, so the neutral fill silently won
                // and no muscle ever showed its role colour.
                <path
                  key={path.id}
                  id={path.id}
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
          {figure.linework.map((d, i) => (
            <path key={`line-${i}`} d={d} />
          ))}
        </g>
      </g>

      {/* Selection redrawn on top: a muscle already carrying a role colour has
          no colour left to spend, so the cue is weight, not hue. */}
      {selectedKeys.length > 0 &&
        figure.muscles
          .filter((muscle) => isSelected(muscle.key))
          .map((muscle) =>
            muscle.paths.map((path) => (
              <path
                key={`sel-${path.id}`}
                className="anatomy-selection-ring"
                d={path.d}
                clipPath={clipFor(path.clipHalf)}
              />
            )),
          )}

      <g className="anatomy-hit-layer">
        {figure.muscles.map((muscle) => (
          <g
            key={muscle.key}
            id={`${uid}-hit-${muscle.key}`}
            className="anatomy-hit"
            role="button"
            aria-label={describe(muscle.key)}
            aria-pressed={isSelected(muscle.key)}
            tabIndex={tabbableKey === muscle.key ? 0 : -1}
            onClick={() => onSelect(muscle.key)}
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
            {muscle.paths.map((path) => (
              // Transparent fill plus a transparent halo stroke: the target
              // grows outward without the drawn muscle changing shape.
              <path
                key={`hit-${path.id}`}
                d={path.d}
                clipPath={clipFor(path.clipHalf)}
                strokeWidth={HIT_HALO}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
