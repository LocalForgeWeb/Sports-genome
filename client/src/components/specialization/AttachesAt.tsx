import { ArrowRight } from "lucide-react";
import type { TendonPlace } from "@shared/specialization/tendonPlaces";

/**
 * "Attaches at" on a muscle's sheet and on the 3D model's panel (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §4.3): where the muscle is a reviewed member of a tendon group, by
 * area with its groups in brackets, and a way to the tendon exposure section, which opens on the first
 * of those areas. In the page's own chunk, so it is a few lines; the places come from the region's
 * lazily loaded areas (`tendonPlacesOf`), and the line is left out until they arrive or where there are
 * none. Region-agnostic: every word but the frame is the region's.
 */
export type AttachesAt = { places: readonly TendonPlace[]; onOpen: () => void };

const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);

/** "inner elbow (common flexor origin), wrist and thumb (front of the wrist)": each area once, in the region's order. */
export function attachesAtWords(places: readonly TendonPlace[]): string {
  const areas: { id: string; label: string; groups: string[] }[] = [];
  for (const place of places) {
    const area = areas.find((item) => item.id === place.areaId);
    if (area) area.groups.push(place.groupLabel);
    else areas.push({ id: place.areaId, label: place.areaLabel, groups: [place.groupLabel] });
  }
  return areas.map((area) => `${lowerFirst(area.label)} (${area.groups.map(lowerFirst).join(", ")})`).join(", ");
}

export function AttachesAtLine({ attachesAt, className }: { attachesAt: AttachesAt; className?: string }) {
  if (!attachesAt.places.length) return null;
  return <div className={`spz-attaches${className ? ` ${className}` : ""}`}>
    <p>Attaches at: {attachesAtWords(attachesAt.places)}.</p>
    <button type="button" className="spz-link" onClick={attachesAt.onOpen}>See tendon exposure <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
  </div>;
}
