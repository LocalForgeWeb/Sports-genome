import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { DiagramAsset, DiagramLabel, DiagramLayerId, DiagramPath, DiagramViewId } from "@shared/specialization/types";
import type { DiagramFill } from "./model";
import { drawableNodeIds, drawnNodes, placementsOf, type DiagramNode, type DrawnNode, type Point } from "./diagramGeometry";
import "./specialization-diagram.css";

/**
 * The renderer contract (02-design.md §12). Any drawing of a region (this SVG renderer, or a
 * 3D viewer later) takes these props and reads node ids only.
 */
export type SpecializationDiagramProps = {
  asset: DiagramAsset;
  view: DiagramViewId;
  layer: DiagramLayerId;
  /** The left side of a drawing of one side: the drawing flips, its text does not. */
  mirrored: boolean;
  /**
   * The region's members. When given, a path of a member that is not drawable (a group, a
   * compartment, or any node's parent: `drawableNodeIds`) is neither drawn nor chosen.
   */
  nodes?: readonly DiagramNode[];
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
 *   2. The selected muscle's outline, round its bellies and tendons as one shape (masked to the
 *      outside): a dark keyline, a gold line, a dark keyline and a soft halo, so it reads on the
 *      palest exposure step and on the dark ground alike, never by hue alone.
 *   3. The tap targets (invisible): every belly widened across its gutters, every belly as
 *      drawn above those, and on top one 44 pt square per muscle, placed inside its own belly
 *      and clear of every other square, where it covers the least of other muscles as drawn
 *      (a tap there selects the square's muscle). Largest first, so a smaller one wins a tie.
 *   4. Text, outside the mirror: the anatomy labels and the selected muscle's name.
 *
 * Mirroring flips the drawing for the left arm and re-places every label (x and anchor), so
 * each label lands on the side it names and no text is ever drawn backwards. The views, and
 * the words for them, are the asset's (`viewOrder`).
 */

/** Tap targets reach this far past a belly's edge, in view-box units: across the gutters, not over a neighbour. */
const HIT_HALO = 9;
/**
 * Every muscle also gets a square tap target this wide, as a share of the drawing's width. The
 * page draws the diagram 307 px wide on a 375 pt phone and 321 px on a 390 pt one (measured in
 * Chromium), so the square is 44.5–46.5 px: the 44 × 44 pt floor (CLAUDE.md; Apple HIG).
 */
export const HIT_SQUARE_SHARE = 0.145;
const LABEL_CLEARANCE = 24;

/** A view's words are the drawing's own (its `viewOrder`); an id it does not list reads as itself. */
const viewLabelOf = (asset: DiagramAsset, view: DiagramViewId): string => asset.viewOrder.find((item) => item.id === view)?.label ?? view;
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

/**
 * Keyboard focus only: a finger tap also focuses the target, and the blue focus outline on top
 * of the gold selection would read as a second selection. Where the browser cannot say, show it.
 */
function focusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/** Text width estimate for the label pill (no DOM measuring, so tests and phones agree). */
const textWidth = (text: string, size: number) => text.length * size * 0.6;

export function SpecializationDiagram({ asset, view, layer, mirrored, nodes: members, fillFor, selectedNodeId, onSelect, labelFor, describeFor, caption }: SpecializationDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hatchId = `${uid}-hatch`;
  const noteId = `${uid}-note`;
  const maskId = `${uid}-selection-mask`;
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  // The muscle that last had focus, by any means: the one tab stop moves with it, so Tab from
  // a muscle reached with the arrow keys leaves the drawing instead of landing on another muscle.
  const [rovingNodeId, setRovingNodeId] = useState<string | null>(null);
  const { width, height } = asset.viewBox;
  const drawn = asset.views[view]?.[layer] ?? null;
  // Members that are never drawn (10-multi-region.md §7.3). The contract test keeps them out of
  // every asset; this keeps the renderer to the rule for any asset it is handed.
  const hidden = useMemo(() => {
    if (!members) return null;
    const drawable = drawableNodeIds(members);
    const out = new Set(members.filter((node) => !drawable.has(node.id)).map((node) => node.id));
    return out.size ? out : null;
  }, [members]);
  const paths = useMemo(() => {
    const all = drawn?.paths ?? [];
    // The same array when nothing is left out, so the layer's placements stay cached with it.
    return hidden && all.some((path) => path.nodeId && hidden.has(path.nodeId)) ? all.filter((path) => !path.nodeId || !hidden.has(path.nodeId)) : all;
  }, [drawn, hidden]);

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
  const roving = nodes.some((node) => node.nodeId === rovingNodeId) ? rovingNodeId : null;
  const tabbable = roving ?? selected?.nodeId ?? focusOrder[0]?.nodeId ?? null;

  // The page's description is sentences ("<Name>. 3 direct dynamic bouts."): the state
  // follows as its own sentence, never as ".,".
  const describe = (nodeId: string) => {
    const text = (describeFor?.(nodeId) ?? labelFor(nodeId)).trim();
    if (nodeId !== selectedNodeId) return text;
    return /[.!?]$/.test(text) ? `${text} Selected.` : `${text}, selected`;
  };
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
    const elsewhere = hidden?.has(selectedNodeId) ? [] : placementsOf(asset, selectedNodeId).map((place) => `${viewLabelOf(asset, place.view)} · ${LAYER_NAMES[place.layer]}`);
    if (ghost) return `${name} lies above this layer; its outline is dashed here. It is drawn in ${elsewhere.join(", ")}.`;
    if (elsewhere.length) return `${name} is not drawn on this layer. It is drawn in ${elsewhere.join(", ")}.`;
    return `${name} is not part of this drawing.`;
  }, [selectedNodeId, selected, paths, asset, labelFor, hidden]);

  if (!drawn) {
    return <figure className="spz-diagram"><figcaption className="spz-diagram-caption">{caption ? `${caption}. ` : ""}This view is not drawn.</figcaption></figure>;
  }

  const labels: DiagramLabel[] = drawn.labels.map((label) => ({
    ...label,
    x: flipX(label.x),
    anchor: mirrored && label.anchor !== "middle" ? (label.anchor === "start" ? "end" : "start") : label.anchor,
  }));
  const callout = selected ? calloutFor(selected, labelFor(selected.nodeId), labels, { width, height, flipX }) : null;
  const outlined = selected ? [...selected.bellies, ...selected.tendons] : [];
  const mirror = mirrored ? `translate(${width} 0) scale(-1 1)` : undefined;
  const square = HIT_SQUARE_SHARE * width;

  return (
    <figure className="spz-diagram" data-view={view} data-layer={layer} data-mirrored={mirrored ? "" : undefined}>
      <svg
        className="spz-diagram-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`${caption ?? `${viewLabelOf(asset, view)} view, ${LAYER_NAMES[layer].toLowerCase()} layer`}. ${nodes.length} muscles to choose from.`}
        aria-describedby={note ? noteId : undefined}
      >
        <defs>
          {/* Mapping not reviewed: the legend's hatch, the same colours and slant. The pattern is
              laid out in the space of the bellies that use it, which the left arm mirrors, so it
              is flipped back there: the stripes slant the legend's way on either arm. */}
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform={mirrored ? "scale(-1 1) rotate(-45)" : "rotate(-45)"}>
            <rect width="6" height="6" fill="#2e3a49" />
            <rect width="1.2" height="6" fill="#6f7d90" />
          </pattern>
          {/* The selected muscle's outline is drawn outside its shapes only: a belly and the
              tendon that starts inside its tip are outlined as one shape, with no crossing
              lines where they join. In the user space of the (possibly mirrored) drawing. */}
          {selected && <mask id={maskId} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}>
            <rect x={-width} y={-height} width={width * 3} height={height * 3} fill="#fff" />
            {outlined.map((path) => <path key={path.id} d={path.d} fill="#000" />)}
          </mask>}
        </defs>

        <g transform={mirror}>
          <g className="spz-diagram-art" aria-hidden="true">
            {paths.map((path) => <ArtPath key={path.id} path={path} fill={path.kind === "belly" && path.nodeId ? fillFor(path.nodeId) : null} hatchId={hatchId} selectedNodeId={selectedNodeId} />)}
          </g>

          {selected && <g className="spz-diagram-selection" aria-hidden="true" data-node={selected.nodeId} mask={`url(#${maskId})`}>
            {/* Outside the shape, from it outwards: dark keyline, gold line, dark keyline, soft halo. */}
            {(["halo", "outer-keyline", "ring", "keyline"] as const).map((part) => outlined.map((path) => <path key={`${part}-${path.id}`} className={`spz-diagram-${part}`} d={path.d} />))}
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
                onFocus={(event) => { setRovingNodeId(node.nodeId); setFocusedNodeId(focusVisible(event.currentTarget) ? node.nodeId : null); }}
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
