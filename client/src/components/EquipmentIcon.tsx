import type { ReactElement } from "react";
import { equipmentHasOwnIcon, equipmentIdFor, equipmentIconLabel, type EquipmentId } from "@/lib/equipmentIdentity";

/**
 * Family A: equipment marks for the exercise rows.
 *
 * Drawn in the language the app's icon set already speaks - lucide's 24x24 box,
 * `currentColor` strokes at width 2, round caps and joins - so an equipment mark
 * sitting next to a lucide glyph reads as one family rather than two.
 *
 * They are authored paths rather than generated images. The brief's own format
 * table prefers a clean vector for geometry this simple, and the Hugging Face
 * Spaces that could have explored shapes cannot be invoked on this connection, so
 * generation was not a route that was open and then rejected - it was never open.
 * For four shapes at 20px that costs nothing: each is a handful of paths, scales
 * without resampling, and takes its colour from the text beside it.
 *
 * Stroke width is fixed at 2 in a 24 box and scaled with the box, so the optical
 * weight matches at every size instead of thinning as the mark grows.
 */

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * Two tall thin plates a long bar apart.
 *
 * The first attempt had four plate lines and two outer collars. Rendered at 14px
 * they merged into the bar and the whole mark read as a double-headed arrow, which
 * is the reject condition for this icon. Three elements survive the reduction: what
 * distinguishes a barbell is that the plates are *thin* and the shaft between them
 * is *long*, and both of those still hold when the mark is 16 pixels wide.
 */
function BarbellMark() {
  return (
    <>
      <path d="M4.6 6.4v11.2" />
      <path d="M4.6 12h14.8" />
      <path d="M19.4 6.4v11.2" />
    </>
  );
}

/**
 * Short handle between two solid bells. Closed rounded bodies rather than the
 * barbell's open plate lines: at small sizes the silhouette is what is read, and
 * two blocks with a gap cannot be mistaken for a bar with four lines on it.
 */
function DumbbellMark() {
  return (
    <>
      <rect x="2.2" y="6.4" width="5" height="11.2" rx="1.8" />
      <path d="M7.2 12h9.6" />
      <rect x="16.8" y="6.4" width="5" height="11.2" rx="1.8" />
    </>
  );
}

/**
 * Bell body under an open handle. The gap between the two is the whole icon - a
 * handle fused to the body reads as a bag - so the arc starts clear of the body
 * and the body's shoulders sit below where the arc lands.
 */
function KettlebellMark() {
  return (
    <>
      <path d="M8.2 7.9a3.8 3.8 0 0 1 7.6 0" />
      <path d="M12 10.4a6.3 6.3 0 0 0-4.4 10.8c.3.3.6.4 1 .4h6.8c.4 0 .7-.1 1-.4A6.3 6.3 0 0 0 12 10.4z" />
    </>
  );
}

/**
 * The honest mark for equipment this app cannot resolve to one object - the
 * 114-row "Free weights" bucket, and any value the catalog adds later that this
 * module has not been taught. A plate is true of all of them and claims nothing
 * about which implement it is on; the row's label supplies that.
 */
function PlateMark() {
  return (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  );
}

const marks: Record<string, () => ReactElement> = {
  barbell: BarbellMark,
  dumbbell: DumbbellMark,
  kettlebell: KettlebellMark,
};

export function EquipmentIcon({ equipment, size = 18, className, decorative = true }: {
  /** The catalog's own equipment string, resolved here rather than by the caller. */
  equipment: string;
  size?: number;
  className?: string;
  /**
   * True where a visible label already names the equipment, which is every
   * current placement. The mark is then hidden from assistive technology so the
   * equipment is announced once, not twice.
   */
  decorative?: boolean;
}) {
  const id: EquipmentId = equipmentIdFor(equipment);
  const Mark = marks[id] ?? PlateMark;
  const label = equipmentIconLabel(id, equipment);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...strokeProps}
      {...(decorative
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": label })}
    >
      <Mark />
    </svg>
  );
}

export { equipmentHasOwnIcon };
