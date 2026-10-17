/**
 * Curve helpers for the forearm drawing. Every shape in the drawing is written as a few
 * hand-placed control points (anatomical landmarks and outline points) and turned into
 * smooth cubic Béziers here, so the data stays readable and the output stays crisp.
 *
 * Output format, relied on by the manifest tests: absolute `M`, `C`, `L` and `Z` commands
 * only, numbers rounded to one decimal. Nothing else is emitted.
 */

const round = (value) => {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};
const pt = ([x, y]) => `${round(x)} ${round(y)}`;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Centripetal Catmull-Rom through the points, as cubic Béziers (alpha 0.5, the variant
 * that never loops or overshoots between unevenly spaced points). A point written as
 * `[x, y, "corner"]` is a sharp corner: the curve meets it in straight-ish segments, used
 * for crop edges and the tips where a belly hands over to its tendon.
 */
function bezierControls(p0, p1, p2, p3) {
  const corner1 = p1[2] === "corner";
  const corner2 = p2[2] === "corner";
  const alpha = 0.5;
  const d1 = Math.pow(dist(p0, p1), alpha);
  const d2 = Math.pow(dist(p1, p2), alpha);
  const d3 = Math.pow(dist(p2, p3), alpha);
  let c1 = [p1[0] + (p2[0] - p1[0]) / 3, p1[1] + (p2[1] - p1[1]) / 3];
  let c2 = [p2[0] - (p2[0] - p1[0]) / 3, p2[1] - (p2[1] - p1[1]) / 3];
  if (!corner1 && d1 > 1e-6 && d2 > 1e-6) {
    const a = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2;
    const n = 3 * d1 * (d1 + d2);
    c1 = [(a * p1[0] - d2 * d2 * p0[0] + d1 * d1 * p2[0]) / n, (a * p1[1] - d2 * d2 * p0[1] + d1 * d1 * p2[1]) / n];
  }
  if (!corner2 && d3 > 1e-6 && d2 > 1e-6) {
    const b = 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2;
    const m = 3 * d3 * (d3 + d2);
    c2 = [(b * p2[0] - d2 * d2 * p3[0] + d3 * d3 * p1[0]) / m, (b * p2[1] - d2 * d2 * p3[1] + d3 * d3 * p1[1]) / m];
  }
  return [c1, c2];
}

/** A smooth closed outline through the points. */
export function closed(points) {
  const n = points.length;
  if (n < 3) throw new Error("A closed shape needs at least three points");
  const at = (i) => points[(i + n) % n];
  let d = `M${pt(at(0))}`;
  for (let i = 0; i < n; i++) {
    const [c1, c2] = bezierControls(at(i - 1), at(i), at(i + 1), at(i + 2));
    d += ` C${pt(c1)} ${pt(c2)} ${pt(at(i + 1))}`;
  }
  return `${d} Z`;
}

/** A smooth open line through the points (creases, the ulna's border). */
export function open(points) {
  const n = points.length;
  if (n < 2) throw new Error("A line needs at least two points");
  const at = (i) => points[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pt(at(0))}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i === 0 ? [2 * at(0)[0] - at(1)[0], 2 * at(0)[1] - at(1)[1]] : at(i - 1);
    const p3 = i === n - 2 ? [2 * at(n - 1)[0] - at(n - 2)[0], 2 * at(n - 1)[1] - at(n - 2)[1]] : at(i + 2);
    const [c1, c2] = bezierControls(p0, at(i), at(i + 1), p3);
    d += ` C${pt(c1)} ${pt(c2)} ${pt(at(i + 1))}`;
  }
  return d;
}

/** Interpolates a half-width profile given as [t, w] stops along 0..1. */
function profileAt(profile, t) {
  if (typeof profile === "number") return profile;
  if (t <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [t1, w1] = profile[i];
    const [t0, w0] = profile[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      // Smoothstep between stops, so a belly swells and tapers rather than kinks.
      const s = k * k * (3 - 2 * k);
      return w0 + (w1 - w0) * s;
    }
  }
  return profile[profile.length - 1][1];
}

/** Samples a smooth centreline (Catmull-Rom through the spine points) at `count` points. */
export function sampleSpine(spine, count) {
  // Arc-length parametrisation over the polyline is close enough at these scales.
  const lengths = [0];
  for (let i = 1; i < spine.length; i++) lengths.push(lengths[i - 1] + dist(spine[i - 1], spine[i]));
  const total = lengths[lengths.length - 1];
  const out = [];
  for (let k = 0; k < count; k++) {
    const s = (total * k) / (count - 1);
    let i = 1;
    while (i < spine.length - 1 && lengths[i] < s) i++;
    const local = (s - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    // Catmull-Rom (uniform) between spine[i-1] and spine[i], for a smooth centreline.
    const p0 = spine[Math.max(0, i - 2)];
    const p1 = spine[i - 1];
    const p2 = spine[i];
    const p3 = spine[Math.min(spine.length - 1, i + 1)];
    const t = local;
    const t2 = t * t;
    const t3 = t2 * t;
    const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
    const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
    out.push([x, y, s / total]);
  }
  return out;
}

/**
 * A band around a centreline: the outline of a fusiform belly or a tendon. `left` and
 * `right` are half-width profiles ([t, w] stops, t from the first spine point to the last),
 * measured to the left and right of the direction of travel. Ends are pointed when the
 * width there is zero and square (`ends`) when it is not, which is how a tendon meets
 * its bone.
 */
export function bandPoints(spine, left, right = left, { samples = 11, sharpTips = false } = {}) {
  const pts = sampleSpine(spine, samples);
  const leftSide = [];
  const rightSide = [];
  pts.forEach(([x, y, t], i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    // Screen coordinates (y down): the left of the direction of travel is (dy, -dx).
    const nx = dy / len;
    const ny = -dx / len;
    const wl = profileAt(left, t);
    const wr = profileAt(right, t);
    leftSide.push([x + nx * wl, y + ny * wl]);
    rightSide.push([x - nx * wr, y - ny * wr]);
  });
  const corner = (p) => [p[0], p[1], "corner"];
  const startPointed = profileAt(left, 0) + profileAt(right, 0) < 0.6;
  const endPointed = profileAt(left, 1) + profileAt(right, 1) < 0.6;
  const l = leftSide.slice(startPointed ? 1 : 0, endPointed ? -1 : leftSide.length);
  const r = rightSide.slice(startPointed ? 1 : 0, endPointed ? -1 : rightSide.length).reverse();
  if (!startPointed) { l[0] = corner(l[0]); r[r.length - 1] = corner(r[r.length - 1]); }
  if (!endPointed) { l[l.length - 1] = corner(l[l.length - 1]); r[0] = corner(r[0]); }
  const tip = (p) => (sharpTips ? corner(p) : [p[0], p[1]]);
  const outline = [];
  if (startPointed) outline.push(tip(pts[0]));
  outline.push(...l);
  if (endPointed) outline.push(tip(pts[pts.length - 1]));
  outline.push(...r);
  return outline;
}

export const band = (spine, left, right = left, options = {}) => closed(bandPoints(spine, left, right, options));

/**
 * The part of an outline (points as `closed` takes them) at or below the height `cut`, with a
 * square edge where it is cut. This is how a deep muscle's outcrop is drawn: the very same
 * outline as the whole muscle in the deep layer, cut where the surface muscles stop covering
 * it, so the surface layer can never show the muscle anywhere the deep layer does not.
 * Away from the cut the curve passes through the same points as the whole, so it is the same
 * curve; only the cut edge and its two neighbouring segments are new.
 */
export function clipBelow(points, cut) {
  const out = [];
  const below = (p) => p[1] >= cut;
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i + points.length - 1) % points.length];
    const cur = points[i];
    if (below(prev) !== below(cur)) {
      const k = (cut - prev[1]) / (cur[1] - prev[1]);
      out.push([prev[0] + (cur[0] - prev[0]) * k, cut, "corner"]);
    }
    if (below(cur)) out.push(cur);
  }
  if (out.length < 3) throw new Error(`Nothing of the outline lies below y ${cut}`);
  return out;
}

/** A tendon: a narrow band, pointed where it leaves its belly, square where it attaches. */
export function tendon(spine, startWidth, endWidth = startWidth, { taper = 0.1, samples } = {}) {
  const profile = [[0, 0], [taper, startWidth / 2], [1, endWidth / 2]];
  return band(spine, profile, profile, { samples: samples ?? Math.max(6, spine.length * 2), sharpTips: true });
}

/**
 * A belly written as cross-sections, the way an anatomy atlas slices a limb: `rows` are
 * `[y, left, right]`, the muscle's extent across each horizontal slice, top to bottom.
 * `top` and `bottom` are extra outline points closing the shape (a pointed origin, the
 * lobes where a muscle hands over to its tendons), given right-to-left along the top and
 * left-to-right along the bottom. Writing neighbours as slices of the same heights is what
 * keeps the gutter between them even.
 */
export function rowsShape({ rows, top = [], bottom = [] }) {
  const left = rows.map(([y, l]) => (typeof l === "number" ? [l, y] : [l[0], y, l[1]]));
  const right = rows.map(([y, , r]) => (typeof r === "number" ? [r, y] : [r[0], y, r[1]])).reverse();
  return closed([...left, ...bottom, ...right, ...top]);
}

/** Linear interpolation of an outline edge (points top→bottom or bottom→top) at height y. */
export function edgeX(points, y) {
  const sorted = [...points].sort((a, b) => a[1] - b[1]);
  if (y <= sorted[0][1]) return sorted[0][0];
  for (let i = 1; i < sorted.length; i++) {
    const [x1, y1] = sorted[i];
    const [x0, y0] = sorted[i - 1];
    if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1);
  }
  return sorted[sorted.length - 1][0];
}

/** Mirrors a point list across the vertical centre of a canvas `width` wide. */
export const mirrorPoints = (points, width) => points.map(([x, y, flag]) => (flag ? [width - x, y, flag] : [width - x, y]));
export const reverse = (points) => [...points].reverse();
