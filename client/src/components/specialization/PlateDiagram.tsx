import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import type { DiagramLayerId, DiagramPlates, DiagramViewId } from "@shared/specialization/types";
import type { DiagramFill } from "./model";
import { loadedPlatePass, loadPlatePass } from "./plateAssets";
import { compositePlate, cssColourToRgb, labelAt, paintFor, PLATE_FALLBACK_COLOURS, PLATE_SUPERSAMPLE, passesShowing, passToShow, plateFor, type PlateColours, type PlatePixels } from "./plates";
import { fillKey } from "./SpecializationDiagram";
import "./specialization-diagram.css";
import "./plate-diagram.css";

/**
 * The plate renderer (docs/specialization-atlas/08-diagram.md, "Plates"): a region's Drawing as
 * rendered images rather than an SVG schematic. It keeps the SVG renderer's contract (the page's
 * view and layer, `fillFor`, `selectedNodeId`, `onSelect`, `labelFor`, `describeFor`, `caption`)
 * and reads node ids only; the plates' data says which views, layers and muscles there are.
 *
 * - The canvas: the pass's plate in cool structure tones, each muscle painted through its label
 *   image with the page's fill (the exposure ramp, zero's dashed edge, the hatch), keeping the
 *   plate's shading; the selected muscle outlined outside its edge (keyline, gold, keyline, halo).
 * - A tap on the canvas reads the label image under the finger, or the nearest muscle within
 *   TAP_REACH screen pixels, and selects it through `onSelect`.
 * - Under the canvas, one chip per muscle of the pass, at least 44 × 44 px each, so every muscle,
 *   however thin on the image, has a full-size target; the chips are the keyboard's way in too.
 * - A muscle chosen elsewhere (the list, a sheet, the address) that this pass does not show moves
 *   the page to a pass that does (`onShowPass`). A view or layer the athlete chose stays: the
 *   caption says where the muscle is instead, with a button to go there.
 * - The pass's images load only while this is on screen, and only that pass (`plateAssets.ts`).
 * - One image of one side, never mirrored: both sides count as one.
 */
export type PlateDiagramProps = {
  plates: DiagramPlates;
  view: DiagramViewId;
  layer: DiagramLayerId;
  fillFor: (nodeId: string) => DiagramFill;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  /** Shows another view and layer: the page's own state, which its controls show too. */
  onShowPass: (view: DiagramViewId, layer: DiagramLayerId) => void;
  labelFor: (nodeId: string) => string;
  describeFor?: (nodeId: string) => string;
  caption?: string;
};

/** A tap this far (CSS px) beside a muscle still takes the nearest one. */
export const TAP_REACH = 12;
const LAYER_NAMES: Record<DiagramLayerId, string> = { surface: "Surface", intermediate: "Middle", deep: "Deep" };

/** The last pass that loaded (its pixels stay on the canvas until the next one is ready), or why one failed. */
type Status = { kind: "loading" } | { kind: "ready"; passId: string; pixels: PlatePixels } | { kind: "error"; passId: string; message: string };

/** The page's tokens as colours for the canvas, read from where the drawing sits; the fallbacks are the tokens' own values. */
function coloursFrom(element: Element | null): PlateColours {
  if (!element || typeof getComputedStyle !== "function") return PLATE_FALLBACK_COLOURS;
  const style = getComputedStyle(element);
  const read = (name: string, fallback: readonly [number, number, number]) => cssColourToRgb(style.getPropertyValue(name)) ?? fallback;
  return {
    ...PLATE_FALLBACK_COLOURS,
    exposure: PLATE_FALLBACK_COLOURS.exposure.map((fallback, index) => read(`--sg-exposure-${index + 1}`, fallback)),
    neutral: read("--sg-role-neutral-on-dark", PLATE_FALLBACK_COLOURS.neutral),
    selected: read("--sg-selected-on-dark", PLATE_FALLBACK_COLOURS.selected),
  };
}

export function PlateDiagram({ plates, view, layer, fillFor, selectedNodeId, onSelect, onShowPass, labelFor, describeFor, caption }: PlateDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const noteId = `${uid}-note`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pass = plateFor(plates, view, layer);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const { width, height } = plates.frame;

  // A muscle chosen anywhere that this pass does not show: go to a pass that does. Only when the
  // choice changes (and on opening the drawing with one chosen), so a view the athlete picks stays.
  // Declared before the load, which then waits for the pass it is going to rather than fetch this one.
  const goingTo = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedNodeId) return;
    const target = passToShow(plates, selectedNodeId, view, layer);
    if (!target) return;
    goingTo.current = target.id;
    onShowPass(target.view, target.layer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  useEffect(() => {
    if (!pass) return;
    if (goingTo.current && goingTo.current !== pass.id) return;
    goingTo.current = null;
    let live = true;
    loadPlatePass(pass, plates.frame).then(
      (pixels) => { if (live) setStatus({ kind: "ready", passId: pass.id, pixels }); },
      (error: unknown) => { if (live) setStatus({ kind: "error", passId: pass.id, message: error instanceof Error ? error.message : String(error) }); },
    );
    return () => { live = false; };
  }, [pass, plates.frame]);

  const nodeIds = pass?.nodeIds ?? [];
  const fills = nodeIds.map((nodeId) => fillFor(nodeId));
  const fillSignature = fills.map(fillKey).join(" ");
  // This pass's pixels once loaded. Until then the canvas keeps the last pass it painted, and a tap waits.
  const shown = status.kind === "ready" && status.passId === pass?.id ? status.pixels : pass ? loadedPlatePass(pass) : null;
  const failed = status.kind === "error" && status.passId === pass?.id;
  const selectedLabel = selectedNodeId ? nodeIds.indexOf(selectedNodeId) + 1 : 0;

  // Painted in the next frame, not in the tap's own task: the chip and the strip above answer the
  // finger at once, and the plate (tens of milliseconds of pixels) follows a frame later.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shown) return;
    const paint = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const colours = coloursFrom(canvas);
      const paints = fills.map((fill) => paintFor(fill, colours));
      const image = context.createImageData(width * PLATE_SUPERSAMPLE, height * PLATE_SUPERSAMPLE);
      image.data.set(compositePlate(shown, paints, selectedLabel, colours));
      context.putImageData(image, 0, 0);
    };
    if (typeof requestAnimationFrame !== "function") { paint(); return; }
    const frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, fillSignature, selectedLabel, width, height]);

  const describe = (nodeId: string) => {
    const text = (describeFor?.(nodeId) ?? labelFor(nodeId)).trim();
    if (nodeId !== selectedNodeId) return text;
    return /[.!?]$/.test(text) ? `${text} Selected.` : `${text}, selected`;
  };

  const tap = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!shown) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // The image as drawn inside the element (object-fit: contain), in label pixels per screen pixel.
    const shownScale = Math.min(rect.width / width, rect.height / height);
    const left = rect.left + (rect.width - width * shownScale) / 2;
    const top = rect.top + (rect.height - height * shownScale) / 2;
    const label = labelAt(shown.labels, width, height, (event.clientX - left) / shownScale, (event.clientY - top) / shownScale, TAP_REACH / shownScale);
    const nodeId = label ? nodeIds[label - 1] : undefined;
    if (nodeId) onSelect(nodeId);
  };

  const placeName = (target: { view: DiagramViewId; layer: DiagramLayerId }) => `${plates.viewOrder.find((item) => item.id === target.view)?.label ?? target.view} · ${LAYER_NAMES[target.layer]}`;
  // Where a selected muscle is when this pass does not show it: never dropped, said in words.
  const note = useMemo(() => {
    if (!selectedNodeId || nodeIds.includes(selectedNodeId)) return null;
    const name = labelFor(selectedNodeId);
    const elsewhere = passesShowing(plates, selectedNodeId);
    if (!elsewhere.length) return { text: `${name} is not part of this drawing.`, go: null };
    return { text: `${name} is not shown in this view and layer. It is shown in ${elsewhere.map(placeName).join(", ")}.`, go: elsewhere.find((item) => item.view === view) ?? elsewhere[0] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, nodeIds.join(" "), plates, view]);

  if (!pass) {
    return <figure className="spz-diagram spz-plate"><figcaption className="spz-diagram-caption">{caption ? `${caption}. ` : ""}This view is not drawn.</figcaption></figure>;
  }

  const names = nodeIds.map(labelFor).join(", ");
  return (
    <figure className="spz-diagram spz-plate" data-view={view} data-layer={layer} data-pass={pass.id} data-status={shown ? "ready" : failed ? "error" : "loading"}>
      <div className="spz-plate-group" role="group" aria-label={`${caption ?? `${placeName({ view, layer })}`}. ${nodeIds.length} muscles to choose from.`} aria-describedby={note ? noteId : undefined}>
        <div className="spz-plate-stage">
          <canvas
            ref={canvasRef}
            className="spz-plate-canvas"
            width={width * PLATE_SUPERSAMPLE}
            height={height * PLATE_SUPERSAMPLE}
            role="img"
            aria-label={`Rendered image: ${names}.${selectedNodeId && nodeIds.includes(selectedNodeId) ? ` ${labelFor(selectedNodeId)} outlined in gold.` : ""} Each muscle is also a button below.`}
            onClick={tap}
          />
          {failed
            ? <p className="spz-plate-status" role="status">The image could not load. Every muscle is a button below, and in the list.</p>
            : !shown && <p className="spz-plate-status" role="status">Loading the image…</p>}
        </div>
        <ul className="spz-plate-chips" aria-label="Muscles in this image">
          {nodeIds.map((nodeId, index) => (
            <li key={nodeId}>
              <button type="button" className="spz-plate-chip" data-node={nodeId} data-fill={fillKey(fills[index])} aria-pressed={nodeId === selectedNodeId} aria-label={describe(nodeId)} onClick={() => onSelect(nodeId)}>
                <i className="spz-plate-swatch" data-fill={fillKey(fills[index])} aria-hidden="true" />
                {labelFor(nodeId)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {(caption || note) && <figcaption className="spz-diagram-caption">
        {caption && <span>{caption}</span>}
        {note && <span id={noteId} className="spz-diagram-note" role="note">{note.text}</span>}
        {note?.go && <button type="button" className="spz-plate-go" onClick={() => onShowPass(note.go!.view, note.go!.layer)}>Show {placeName(note.go)}</button>}
      </figcaption>}
    </figure>
  );
}

/**
 * The plates' credit (the source model, its licences, and that the images are adapted renders), as
 * the 3D model's credits are shown with the model; the page puts it under the drawing's key.
 */
export function PlateCredit({ plates }: { plates: DiagramPlates }) {
  return <p className="spz-plate-credit">
    {plates.credit.map((part, index) => typeof part === "string"
      ? <span key={index}>{part}</span>
      : <a key={index} href={part.href} target="_blank" rel="noreferrer">{part.text}</a>)}
  </p>;
}
