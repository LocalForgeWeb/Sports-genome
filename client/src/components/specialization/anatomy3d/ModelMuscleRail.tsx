import { useLayoutEffect, useRef } from "react";
import type { SpecializationRegionData } from "@shared/specialization/types";
import { canonicalForModelSource } from "./modelIdentity";
import { muscleManifest } from "./muscleManifest";

/**
 * The muscles of the 3D model as a row right above it (owner, 20 Oct 2026, from a recording
 * of the supplied demo: "it should be more like this"). Overview, then every structure in the
 * model's own order, numbered; a swipe moves along the row and one tap frames that muscle on
 * the model. The supplied rail's chips were 32 px tall in 9–10 px type; here each one is a
 * 44 px target in the app's own type, solid at rest, and the selected one is lit orange.
 *
 * The chosen chip is brought into view along the row (only the row scrolls, never the page),
 * so a muscle picked on the model or opened from a link is never off the end of the row.
 */
export function ModelMuscleRail({ data, selectedId, onSelect }: {
  data: SpecializationRegionData;
  /** The canonical id selected on the page, or null for the whole region. */
  selectedId: string | null;
  onSelect: (nodeId: string | null) => void;
}) {
  const nameOf = new Map(data.nodes.map((node) => [node.id, node.name] as const));
  const entries = muscleManifest
    .map((entry) => canonicalForModelSource(entry.id))
    .filter((id): id is string => id !== null && nameOf.has(id))
    .map((id, index) => ({ id, number: index + 1, name: nameOf.get(id)! }));

  const rowRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    // Centre the chip in the row when it is not wholly in view; the page itself does not move.
    // The row is the chips' offset parent (position: relative), so offsetLeft is within it.
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left >= row.scrollLeft && right <= row.scrollLeft + row.clientWidth) return;
    const target = Math.max(0, left - (row.clientWidth - chip.offsetWidth) / 2);
    if (typeof row.scrollTo === "function") row.scrollTo({ left: target, behavior: "smooth" });
    else row.scrollLeft = target;
  }, [selectedId]);

  return <div ref={rowRef} className="sg-anatomy3d-rail" role="group" aria-label={`Muscles of the 3D model, ${entries.length}`}>
    <button type="button" className="sg-anatomy3d-rail-chip" aria-pressed={selectedId === null} onClick={() => onSelect(null)}>
      <span className="sg-anatomy3d-rail-mark" aria-hidden="true">◎</span>Overview
    </button>
    {entries.map((entry) => <button key={entry.id} type="button" className="sg-anatomy3d-rail-chip" aria-pressed={entry.id === selectedId} onClick={() => onSelect(entry.id)}>
      <span className="sg-anatomy3d-rail-mark" aria-hidden="true">{entry.number}</span>{entry.name}
    </button>)}
  </div>;
}
