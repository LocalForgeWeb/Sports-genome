/**
 * Sports Genome anatomical geometry — shared curve + symmetry helpers.
 *
 * Muscles are authored as ordered anchor points and converted to smooth cubic
 * Béziers here. Two reasons this is a generator rather than hand-written path
 * data:
 *
 *   1. The figure it replaces was straight-line polygons — every back muscle was
 *      an `L`-only path of four to eight points, which is why the body read as
 *      segmented armour rather than tissue. Anchors plus Catmull-Rom gives
 *      anatomical contours without hand-tuning hundreds of control points.
 *   2. Bilateral symmetry becomes structural. One side is authored; the other is
 *      mirrored about the midline, so left and right cannot drift apart.
 */

/** Figure canvas. Both views share it, so front and back align exactly. */
export const VIEW = { width: 232, height: 560, midX: 116 };

/**
 * Catmull-Rom through the anchors, emitted as cubic Béziers.
 *
 * `tension` is the curve's slack: 1 is a natural anatomical contour, lower
 * values tighten toward the polygon. A point may be marked a corner (see
 * `corner`) where anatomy genuinely creases — the iliac crest, the heel — and
 * the curve is pulled to a point there instead of rounding it off.
 */
export function smoothClosed(points, tension = 1) {
  const n = points.length;
  if (n < 3) throw new Error(`need at least 3 anchors, got ${n}`);
  const at = (i) => points[(i % n + n) % n];
  const xy = (p) => (Array.isArray(p) ? p : [p.x, p.y]);
  const isCorner = (p) => !Array.isArray(p) && p.corner === true;

  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = xy(at(i - 1));
    const p1 = xy(at(i));
    const p2 = xy(at(i + 1));
    const p3 = xy(at(i + 2));
    // A corner kills the tangent on its own side only, so the neighbouring
    // segment keeps its curve instead of the whole shape going polygonal.
    const t1 = isCorner(at(i)) ? 0 : tension;
    const t2 = isCorner(at(i + 1)) ? 0 : tension;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t1, p1[1] + ((p2[1] - p0[1]) / 6) * t1];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t2, p2[1] - ((p3[1] - p1[1]) / 6) * t2];
    if (i === 0) d += `M${r(p1[0])},${r(p1[1])}`;
    d += `C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(p2[0])},${r(p2[1])}`;
  }
  return d + "Z";
}

/** Two decimals is well under a device pixel at every tested size. */
const r = (v) => Math.round(v * 100) / 100;

/** Reflect anchors about the figure midline, preserving corner flags. */
export function mirror(points) {
  return points.map((p) =>
    Array.isArray(p)
      ? [VIEW.midX * 2 - p[0], p[1]]
      : { ...p, x: VIEW.midX * 2 - p.x },
  );
}

/** Winding flips under reflection; reversing keeps both sides consistent. */
export const mirrorPath = (points) => mirror(points).slice().reverse();

/**
 * Close a half-outline into one full-body ring.
 *
 * Emitting the two halves as separate closed subpaths looked right but was not:
 * they overlap along the midline, and under `evenodd` that overlap became a
 * hole — a dark seam straight down the figure, head included. One continuous
 * ring has no interior edge to cancel. The first and last anchors sit on the
 * midline and are shared, so the mirrored return trip drops them.
 */
export const ringFromHalf = (half) => [...half, ...mirror(half).reverse().slice(1, -1)];

/**
 * Anatomical side naming, which is not image side.
 *
 * On an anterior view the subject's right is the viewer's left; on a posterior
 * view it is the viewer's right. Region IDs name the subject's side, so
 * `muscle__quads__vastus_lateralis__right` is the same limb in both views. The
 * old library named by image side and disagreed with itself between views.
 */
export function sideFor(view, half) {
  if (view === "front") return half === "near" ? "right" : "left";
  return half === "near" ? "left" : "right";
}

export const bbox = (points) => {
  const pts = points.map((p) => (Array.isArray(p) ? p : [p.x, p.y]));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
