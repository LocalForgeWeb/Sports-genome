import React from "react";
import { useId, useMemo, useRef, useState } from "react";
import { anatomyViewBox, anatomyViews } from "./figureGeometry";
import type { AnatomyRole } from "@/lib/anatomyRegions";
import "./anatomy-figure.css";

/**
 * The Body Lab figure.
 *
 * Replaces the `body-muscles` package, whose geometry was the thing holding the
 * surface back: every posterior muscle was an `L`-only polygon of four to eight
 * points, so the back read as armour panels rather than tissue. Geometry now
 * comes from `design/anatomy`, which is also what builds the Figma workspace.
 *
 * Three structural choices, each answering a specific defect:
 *
 *   1. **One object per canonical muscle.** The app stores a single active
 *      muscle key, not a side or a subdivision, so the selectable unit is the
 *      key — both sides and every visual part in one focusable group. That is
 *      ~18 tab stops per view instead of 48, and it makes a tap on any part of
 *      the quadriceps resolve to `quads` with nothing to disambiguate.
 *   2. **Hit geometry is separate from visible geometry.** Narrow muscles get a
 *      wider invisible target rather than being drawn fatter, and targets are
 *      painted largest-area-first so a small muscle's target sits above its big
 *      neighbour's. The Body Lab contract asks for exactly this, and names
 *      "visually enlarging anatomy solely to solve hit testing" an anti-pattern.
 *   3. **Selection is not carried by colour.** A selected muscle is already
 *      coloured by its role, so selection is a weight change — a bright outline
 *      redrawn over the region — which survives being primary-red already.
 */

/**
 * How far a region's invisible target extends past its drawn edge, in viewBox
 * units — about 5px at iPhone width.
 *
 * Deliberately flat, and deliberately modest. Scaling it by region area so that
 * narrow strips got a wider halo was measured and rejected: it grew the targets
 * but put 12 path centroids inside a neighbour's target across the two views,
 * where this value puts none. A target that reaches further but resolves to the
 * wrong muscle is a worse result than a smaller one that is always right, and
 * the named list beside the figure is the equally authoritative path to any
 * region that is still fiddly.
 */
const HIT_HALO = 5.5;

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
  const isSelected = (key: string) => selectedKeys.includes(key);
  const clipId = useId();
  const figure = anatomyViews[view];
  const [focusedKey, setFocusedKey] = useState("");
  const hoverRef = useRef("");

  const setHover = (key: string) => {
    if (hoverRef.current === key) return;
    hoverRef.current = key;
    onHover?.(key || null);
  };

  // Roving tabindex: the figure is one stop in the page's tab order, and arrow
  // keys move within it. 18 separate tab stops would bury the rest of the page.
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
    const node = document.getElementById(`${clipId}-hit-${next.key}`);
    node?.focus?.();
  };

  const describe = (key: string) => {
    const role = roles[key] ?? "neutral";
    const roleWord = role === "primary" ? "primary role" : role === "supporting" ? "supporting role" : "not involved";
    return `${labelFor(key)}, ${roleWord}${isSelected(key) ? ", selected" : ""}`;
  };

  return (
    <svg
      className="anatomy-figure"
      viewBox={`0 0 ${anatomyViewBox.width} ${anatomyViewBox.height}`}
      role="group"
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} muscle map. ${figure.muscles.length} selectable regions.`}
      onPointerLeave={() => setHover("")}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={figure.outline} />
        </clipPath>
      </defs>

      <path className="anatomy-silhouette" d={figure.outline} />

      {/* Clipping to the outline is what makes adjacent muscles share a border.
          Drawn to stop at the body edge instead, they read as floating plates. */}
      <g clipPath={`url(#${clipId})`} aria-hidden="true">
        {figure.structural.map((piece) => (
          <path key={piece.id} className="anatomy-structural" d={piece.d} />
        ))}
        {figure.muscles.map((muscle) => (
          <g
            key={muscle.key}
            className="anatomy-muscle"
            data-muscle={muscle.key}
            data-role={roles[muscle.key] ?? "neutral"}
            data-selected={isSelected(muscle.key) ? "true" : undefined}
            data-focused={focusedKey === muscle.key ? "true" : undefined}
          >
            {muscle.paths.map((path) => (
              <path key={path.id} id={path.id} d={path.d} />
            ))}
          </g>
        ))}
      </g>

      <path className="anatomy-contour" d={figure.outline} />

      {/* Selection redrawn on top, unclipped, so the outline is not trimmed away
          at the body edge where it is most needed for orientation. */}
      {selectedKeys.length > 0 &&
        figure.muscles
          .filter((muscle) => isSelected(muscle.key))
          .map((muscle) =>
            muscle.paths.map((path) => (
              <path key={`sel-${path.id}`} className="anatomy-selection-ring" d={path.d} />
            )),
          )}

      <g className="anatomy-hit-layer">
        {figure.muscles.map((muscle) => (
          <g
            key={muscle.key}
            id={`${clipId}-hit-${muscle.key}`}
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
              // grows outward by half the stroke width without the drawn muscle
              // changing shape by a single unit.
              <path key={`hit-${path.id}`} d={path.d} strokeWidth={HIT_HALO} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
