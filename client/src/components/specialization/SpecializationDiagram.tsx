import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { DiagramAsset, DiagramLabel, DiagramLayerId, DiagramPath, DiagramViewId } from "@shared/specialization/types";
import type { DiagramFill } from "./model";
import { drawnNodes, placementsOf, type DrawnNode, type Point } from "./diagramGeometry";
import "./specialization-diagram.css";

/**
 * The renderer contract (02-design.md §12). Any drawing of a region (this SVG renderer, or a
 * 3D viewer later) takes these props and reads node ids only.
 */
export type SpecializationDiagramProps = {
  asset: DiagramAsset;
  view: DiagramViewId;
  layer: DiagramLayerId;
  /** The left arm: the drawing flips, its text does not. */
  mirrored: boolean;
  fillFor: (nodeId: string) => DiagramFill;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  labelFor: (nodeId: string) => string;
  describeFor?: (nodeId: string) => string;
  caption?: string;
};

/**
 * The SVG renderer. It draws whatever region the asset holds; nothing here names one.
 *
 * Paint order, bottom to top:
 *   1. The asset's paths in their own order: skin, bone, ghost outlines of the layer above,
 *      bellies (painted by `fillFor`), tendons (always neutral: a tendon is not muscle bulk,
 *      brief §6), creases.
 *   2. The selected muscle's outline: a soft halo, a dark keyline and a gold line, so it reads
 *      on the palest exposure step and on the dark ground alike, never by hue alone.
 *   3. The tap targets (invisible): every belly widened across its gutters, every belly as
 *      drawn above those, and on top one 44 pt square per muscle, placed inside its own belly
 *      and clear of every other square. Largest muscle first, so a smaller one wins a tie.
 *   4. Text, outside the mirror: the anatomy labels and the selected muscle's name.
 *
 * Mirroring flips the drawing for the left arm and re-places every label (x and anchor), so
 * "Thumb side" lands on the thumb side and no text is ever drawn backwards.
 */

/** Tap targets reach this far past a belly's edge, in view-box units: across the gutters, not over a neighbour. */
const HIT_HALO = 9;
/**
 * Every muscle also gets a square tap target this wide, as a share of the drawing's width. At
 * the width a 375–390 pt phone draws it (about 309–324 px) that is 45–47 px square: the
 * 44 × 44 pt floor (CLAUDE.md; Apple HIG), whatever the region.
 */
export const HIT_SQUARE_SHARE = 0.145;
const LABEL_CLEARANCE = 24;

const VIEW_NAMES: Record<DiagramViewId, string> = { palm: "Palm", back: "Back", thumb: "Thumb side" };
const LAYER_NAMES: Record<DiagramLayerId, string> = { surface: "Surface", intermediate: "Middle", deep: "Deep" };

const EXPOSURE_STEPS = 5;

export function fillKey(fill: DiagramFill): string {
  return fill.kind === "bin" ? `bin-${clampStep(fill.step)}` : fill.kind;
}
const clampStep = (step: number) => Math.min(EXPOSURE_STEPS, Math.max(1, Math.round(Number.isFinite(step) ? step : 1)));

/** The paint for a belly. Fallback values are the tokens' own, so a page that has not loaded them still never paints black. */
const EXPOSURE_FALLBACK = ["#7a6d5c", "#958670", "#b0a088", "#cbbda4", "#e8dfcc"];
function paintFor(fill: DiagramFill, hatchId: string): string {
  if (fill.kind === "bin") {
    const step = clampStep(fill.step);
    return `var(--sg-exposure-${step}, ${EXPOSURE_FALLBACK[step - 1]})`;
  }
  if (fill.kind === "hatch") return `url(#${hatchId})`;
  return "var(--sg-role-neutral-on-dark, #34495f)";
}

/** Text width estimate for the label pill (no DOM measuring, so tests and phones agree). */
const textWidth = (text: string, size: number) => text.length * size * 0.6;

export function SpecializationDiagram({ asset, view, layer, mirrored, fillFor, selectedNodeId, onSelect, labelFor, describeFor, caption }: SpecializationDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hatchId = `${uid}-hatch`;
  const noteId = `${uid}-note`;
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const { width, height } = asset.viewBox;
  const drawn = asset.views[view]?.[layer] ?? null;
  const paths = drawn?.paths ?? [];

  const nodes = useMemo(() => drawnNodes(paths, { square: HIT_SQUARE_SHARE * width, canvas: { width, height } }), [paths, width, height]);
  // Tap order: largest first, so the smaller muscle's target is painted, and hit, on top.
  const hitOrder = useMemo(() => [...nodes].sort((left, right) => right.area - left.area), [nodes]);
  const flipX = (x: number) => (mirrored ? width - x : x);
  // Keyboard order follows the drawing as seen: top to bottom, then across.
  const focusOrder = useMemo(
    () => [...nodes].sort((left, right) => left.labelAnchor.y - right.labelAnchor.y || flipX(left.labelAnchor.x) - flipX(right.labelAnchor.x)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, mirrored, width],
  );
  const selected = nodes.find((node) => node.nodeId === selectedNodeId) ?? null;
  const tabbable = selected?.nodeId ?? focusOrder[0]?.nodeId ?? null;

  const describe = (nodeId: string) => `${describeFor?.(nodeId) ?? labelFor(nodeId)}${nodeId === selectedNodeId ? ", selected" : ""}`;
  const moveFocus = (from: string, step: number) => {
    const index = focusOrder.findIndex((node) => node.nodeId === from);
    if (index < 0 || !focusOrder.length) return;
    const next = step === Infinity ? focusOrder[focusOrder.length - 1] : step === -Infinity ? focusOrder[0] : focusOrder[(index + step + focusOrder.length) % focusOrder.length];
    document.getElementById(`${uid}-hit-${next.nodeId}`)?.focus();
  };
  const onKeyDown = (nodeId: string) => (event: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(nodeId); return; }
    if (event.key in steps) { event.preventDefault(); moveFocus(nodeId, steps[event.key]); }
  };

  // Where a selected muscle is when it is not on this layer: never dropped, said in words.
  const note = useMemo(() => {
    if (!selectedNodeId || selected) return null;
    const name = labelFor(selectedNodeId);
    const ghost = paths.some((path) => path.kind === "ghost" && path.nodeId === selectedNodeId);
    const elsewhere = placementsOf(asset, selectedNodeId).map((place) => `${VIEW_NAMES[place.view]} · ${LAYER_NAMES[place.layer]}`);
    if (ghost) return `${name} lies above this layer; its outline is dashed here. It is drawn in ${elsewhere.join(", ")}.`;
    if (elsewhere.length) return `${name} is not drawn on this layer. It is drawn in ${elsewhere.join(", ")}.`;
    return `${name} is not part of this drawing.`;
  }, [selectedNodeId, selected, paths, asset, labelFor]);

  if (!drawn) {
    return <figure className="spz-diagram"><figcaption className="spz-diagram-caption">{caption ? `${caption}. ` : ""}This view is not drawn.</figcaption></figure>;
  }

  const labels: DiagramLabel[] = drawn.labels.map((label) => ({
    ...label,
    x: flipX(label.x),
    anchor: mirrored && label.anchor !== "middle" ? (label.anchor === "start" ? "end" : "start") : label.anchor,
  }));
  const callout = selected ? calloutFor(selected, labelFor(selected.nodeId), labels, { width, height, flipX }) : null;
  const mirror = mirrored ? `translate(${width} 0) scale(-1 1)` : undefined;
  const square = HIT_SQUARE_SHARE * width;

  return (
    <figure className="spz-diagram" data-view={view} data-layer={layer} data-mirrored={mirrored ? "" : undefined}>
      <svg
        className="spz-diagram-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`${caption ?? `${VIEW_NAMES[view]} view, ${LAYER_NAMES[layer].toLowerCase()} layer`}. ${nodes.length} muscles to choose from.`}
        aria-describedby={note ? noteId : undefined}
      >
        <defs>
          {/* Mapping not reviewed: the legend's hatch, the same colours and slant. */}
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
            <rect width="6" height="6" fill="#2e3a49" />
            <rect width="1.2" height="6" fill="#6f7d90" />
          </pattern>
        </defs>

        <g transform={mirror}>
          <g className="spz-diagram-art" aria-hidden="true">
            {paths.map((path) => <ArtPath key={path.id} path={path} fill={path.kind === "belly" && path.nodeId ? fillFor(path.nodeId) : null} hatchId={hatchId} selectedNodeId={selectedNodeId} />)}
          </g>

          {selected && <g className="spz-diagram-selection" aria-hidden="true" data-node={selected.nodeId}>
            {[...selected.bellies, ...selected.tendons].map((path) => <path key={`halo-${path.id}`} className="spz-diagram-halo" d={path.d} />)}
            {[...selected.bellies, ...selected.tendons].map((path) => <path key={`key-${path.id}`} className="spz-diagram-keyline" d={path.d} />)}
            {[...selected.bellies, ...selected.tendons].map((path) => <path key={`ring-${path.id}`} className="spz-diagram-ring" d={path.d} />)}
          </g>}

          {focusedNodeId && <g className="spz-diagram-focus" aria-hidden="true">
            {nodes.find((node) => node.nodeId === focusedNodeId)?.bellies.map((path) => <path key={`focus-${path.id}`} d={path.d} />)}
          </g>}

          {/* Pointer reach, for taps outside the squares: each belly widened across its gutters,
              and above those halos every belly exactly as drawn, so a tap on a visible muscle
              selects that muscle and a tap in a gutter selects the nearest. Pointer only: the
              buttons above carry the name, the state and the keyboard. */}
          <g className="spz-diagram-reach" aria-hidden="true">
            {hitOrder.map((node) => <g key={`halo-${node.nodeId}`} data-hit={node.nodeId} onClick={() => onSelect(node.nodeId)}>
              {node.bellies.map((path) => <path key={path.id} d={path.d} strokeWidth={HIT_HALO * 2} />)}
            </g>)}
            {hitOrder.map((node) => <g key={`belly-${node.nodeId}`} data-hit={node.nodeId} onClick={() => onSelect(node.nodeId)}>
              {node.bellies.map((path) => <path key={path.id} d={path.d} />)}
            </g>)}
          </g>

          {/* One 44 pt square per muscle, inside its belly and clear of every other square. */}
          <g className="spz-diagram-hits">
            {hitOrder.map((node) => (
              <g
                key={node.nodeId}
                id={`${uid}-hit-${node.nodeId}`}
                className="spz-diagram-hit"
                role="button"
                tabIndex={node.nodeId === tabbable ? 0 : -1}
                aria-pressed={node.nodeId === selectedNodeId}
                aria-label={describe(node.nodeId)}
                data-node={node.nodeId}
                data-hit={node.nodeId}
                onClick={() => onSelect(node.nodeId)}
                onKeyDown={onKeyDown(node.nodeId)}
                onFocus={() => setFocusedNodeId(node.nodeId)}
                onBlur={() => setFocusedNodeId(null)}
              >
                <rect x={node.hitAnchor.x - square / 2} y={node.hitAnchor.y - square / 2} width={square} height={square} />
              </g>
            ))}
          </g>
        </g>

        <g className="spz-diagram-labels" aria-hidden="true">
          {labels.map((label, index) => <text key={`${label.text}-${index}`} x={label.x} y={label.y} textAnchor={label.anchor}>{label.text}</text>)}
        </g>

        {callout && <g className="spz-diagram-callout" aria-hidden="true" data-node={selected!.nodeId}>
          <line x1={callout.lineFrom.x} y1={callout.lineFrom.y} x2={callout.anchor.x} y2={callout.anchor.y} />
          <circle cx={callout.anchor.x} cy={callout.anchor.y} r={3.5} />
          <rect x={callout.box.x} y={callout.box.y} width={callout.box.width} height={callout.box.height} rx={callout.box.height / 2} />
          <text x={callout.box.x + callout.box.width / 2} y={callout.box.y + callout.box.height / 2} textAnchor="middle" dominantBaseline="central">{callout.text}</text>
        </g>}
      </svg>
      {(caption || note) && <figcaption className="spz-diagram-caption">
        {caption && <span>{caption}</span>}
        {note && <span id={noteId} className="spz-diagram-note" role="note">{note}</span>}
      </figcaption>}
    </figure>
  );
}

function ArtPath({ path, fill, hatchId, selectedNodeId }: { path: DiagramPath; fill: DiagramFill | null; hatchId: string; selectedNodeId: string | null }) {
  if (path.kind === "belly" && fill) {
    return <path className="spz-diagram-belly" d={path.d} data-node={path.nodeId ?? undefined} data-path-id={path.id} data-fill={fillKey(fill)} style={{ fill: paintFor(fill, hatchId) }} />;
  }
  return (
    <path
      className={`spz-diagram-${path.kind}`}
      d={path.d}
      data-node={path.nodeId ?? undefined}
      data-path-id={path.id}
      data-selected={path.kind === "ghost" && path.nodeId !== null && path.nodeId === selectedNodeId ? "" : undefined}
    />
  );
}

type Callout = { text: string; anchor: Point; lineFrom: Point; box: { x: number; y: number; width: number; height: number } };

/**
 * The selected muscle's name, in the margin on the side it sits (as drawn), level with its
 * widest point and moved off the anatomy labels on that side, with a leader line to it.
 */
function calloutFor(node: DrawnNode, text: string, labels: readonly DiagramLabel[], frame: { width: number; height: number; flipX: (x: number) => number }): Callout {
  const size = 16;
  const boxHeight = 26;
  const boxWidth = textWidth(text, size) + 18;
  const anchor = { x: frame.flipX(node.labelAnchor.x), y: node.labelAnchor.y };
  const leftSide = anchor.x < frame.width / 2;
  const margin = 6;
  const x = leftSide ? margin : frame.width - margin - boxWidth;
  // Anatomy labels on the same side, as vertical bands the pill must not cover.
  const busy = labels.filter((label) => (label.anchor === "start") === leftSide || label.anchor === "middle").map((label) => label.y - 5);
  let y = anchor.y;
  for (let pass = 0; pass < 4; pass++) {
    const clash = busy.find((labelY) => Math.abs(labelY - y) < LABEL_CLEARANCE);
    if (clash === undefined) break;
    y = y <= clash ? clash - LABEL_CLEARANCE : clash + LABEL_CLEARANCE;
  }
  y = Math.min(frame.height - boxHeight / 2 - 4, Math.max(boxHeight / 2 + 4, y));
  const box = { x, y: y - boxHeight / 2, width: boxWidth, height: boxHeight };
  return { text, anchor, lineFrom: { x: leftSide ? x + boxWidth : x, y }, box };
}
