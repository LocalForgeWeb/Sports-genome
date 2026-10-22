/**
 * Curve helpers for every region's drawing. Every shape is written as a few hand-placed
 * control points (anatomical landmarks and outline points) and turned into smooth cubic
 * Béziers here, so the data stays readable and the output stays crisp.
 *
 * Output format, relied on by the manifest tests: absolute `M`, `C`, `L` and `Z` commands
 * only, numbers rounded to one decimal. Nothing else is emitted.
 *
 * Points are `[x, y]`, or `[x, y, "corner"]` for a sharp corner; every helper that returns
 * points keeps the flag on the points it passes through.
 */

/** The flag that makes a point a sharp corner (crop edges, cut edges, the tips of bellies). */
export const C = "corner";
/** A border muscle sits this far inside the outline, so the outline stays visible. */
export const INSET = 3;

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
 * The part of an outline (points as `closed` takes them) on one side of a straight cut, with a
 * square edge where it is cut: `below` or `above` the height `cut`, `left` or `right` of the
 * x `cut`. This is how an outcrop is drawn: the very same outline as the whole muscle on its
 * own layer, cut where the muscles above stop covering it, so the upper layer can never show
 * the muscle anywhere its own layer does not. Away from the cut the curve passes through the
 * same points as the whole, so it is the same curve; only the cut edge and its two
 * neighbouring segments are new.
 */
export function clipBy(points, side, cut) {
  const keep = { below: (p) => p[1] >= cut, above: (p) => p[1] <= cut, right: (p) => p[0] >= cut, left: (p) => p[0] <= cut }[side];
  if (!keep) throw new Error(`clipBy: side ${side} is not one of below, above, left, right`);
  // The axis the cut is a value of (y for a horizontal cut), and the one along the cut edge.
  const axis = side === "below" || side === "above" ? 1 : 0;
  const along = 1 - axis;
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i + points.length - 1) % points.length];
    const cur = points[i];
    if (keep(prev) !== keep(cur)) {
      const k = (cut - prev[axis]) / (cur[axis] - prev[axis]);
      const at = prev[along] + (cur[along] - prev[along]) * k;
      out.push(axis === 1 ? [at, cut, C] : [cut, at, C]);
    }
    if (keep(cur)) out.push(cur);
  }
  if (out.length < 3) throw new Error(`Nothing of the outline lies ${side} ${axis === 1 ? "y" : "x"} ${cut}`);
  return out;
}

/** The part of an outline at or below the height `cut` (the forearm's outcrops above the wrist). */
export const clipBelow = (points, cut) => clipBy(points, "below", cut);

/**
 * The part of an outline inside a convex window (Sutherland-Hodgman), with square edges where
 * it is cut: a muscle that shows through a gap between its neighbours (a window outcrop), cut
 * from the same outline its own layer draws. The window is a convex polygon, its points in
 * either turning direction; the cut edges and the window's corners inside the muscle are corners.
 */
export function clipToPolygon(points, window) {
  if (window.length < 3) throw new Error("clipToPolygon: a window needs at least three points");
  const turn = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const turns = window.map((a, i) => turn(a, window[(i + 1) % window.length], window[(i + 2) % window.length]));
  const sign = Math.sign(turns.find((value) => value !== 0) ?? 0);
  if (!sign || turns.some((value) => Math.sign(value) === -sign)) throw new Error("clipToPolygon: the window must be convex");
  let out = points;
  for (let i = 0; i < window.length && out.length; i++) {
    const a = window[i];
    const b = window[(i + 1) % window.length];
    const inside = (p) => turn(a, b, p) * sign >= 0;
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const prev = input[(j + input.length - 1) % input.length];
      const cur = input[j];
      if (inside(prev) !== inside(cur)) {
        const k = turn(a, b, prev) / (turn(a, b, prev) - turn(a, b, cur));
        out.push([prev[0] + (cur[0] - prev[0]) * k, prev[1] + (cur[1] - prev[1]) * k, C]);
      }
      if (inside(cur)) out.push(cur);
    }
  }
  if (out.length < 3) throw new Error("Nothing of the outline lies inside the window");
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

/**
 * The same, sliced the other way, for a belly that lies across the drawing (a band running
 * from the spine to the shoulder): `columns` are `[x, top, bottom]`, left to right. `left` and
 * `right` are extra outline points closing the ends, given bottom-to-top along the left end and
 * top-to-bottom along the right end.
 */
export function columnsShape({ columns, left = [], right = [] }) {
  const top = columns.map(([x, t]) => (typeof t === "number" ? [x, t] : [x, t[0], t[1]]));
  const bottom = columns.map(([x, , b]) => (typeof b === "number" ? [x, b] : [x, b[0], b[1]])).reverse();
  return closed([...top, ...right, ...bottom, ...left]);
}

/**
 * Linear interpolation of an outline edge at a value of one axis: `edgeAt(points, "y", y)` is
 * the edge's x at height y (an edge running top to bottom, as a limb's does), `edgeAt(points,
 * "x", x)` its y at x (an edge running across, as the line from the neck to the shoulder does).
 * The edge must run one way along that axis; points may be given in either order.
 */
export function edgeAt(points, axis, value) {
  const [key, other] = axis === "y" ? [1, 0] : [0, 1];
  const sorted = [...points].sort((a, b) => a[key] - b[key]);
  if (value <= sorted[0][key]) return sorted[0][other];
  for (let i = 1; i < sorted.length; i++) {
    const v1 = sorted[i][key];
    const v0 = sorted[i - 1][key];
    if (value <= v1) return sorted[i - 1][other] + ((sorted[i][other] - sorted[i - 1][other]) * (value - v0)) / (v1 - v0 || 1);
  }
  return sorted[sorted.length - 1][other];
}

/** Linear interpolation of an outline edge (points top→bottom or bottom→top) at height y. */
export const edgeX = (points, y) => edgeAt(points, "y", y);

/** Mirrors a point list across the vertical centre of a canvas `width` wide. */
export const mirrorPoints = (points, width) => points.map(([x, y, flag]) => (flag ? [width - x, y, flag] : [width - x, y]));
export const reverse = (points) => [...points].reverse();

/**
 * Turns points about `centre` by `degrees`, clockwise as drawn (y runs down the canvas). Lets a
 * belly be written as straight slices (`rowsShape`) in its own frame and then laid at its angle.
 */
export function rotate(points, degrees, centre = [0, 0]) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map(([x, y, flag]) => {
    const dx = x - centre[0];
    const dy = y - centre[1];
    const out = [centre[0] + dx * cos - dy * sin, centre[1] + dx * sin + dy * cos];
    return flag ? [...out, flag] : out;
  });
}

/**
 * A fan-shaped belly, broad where it takes origin and narrow where it inserts (the latissimus,
 * the pectoralis major, the gluteus maximus): `origin` is the broad attachment as points in
 * order, `insertion` the narrow end's two corners `[first, second]`, `second` on the side the
 * origin ends. The two borders are straight, bowed outward by `bulge` times their length.
 */
export function fan(origin, insertion, { bulge = 0 } = {}) {
  if (origin.length < 2) throw new Error("fan: the origin needs at least two points");
  const all = [...origin, ...insertion];
  const centre = [all.reduce((sum, p) => sum + p[0], 0) / all.length, all.reduce((sum, p) => sum + p[1], 0) / all.length];
  // A border's midpoint, pushed away from the fan's middle.
  const border = (a, b) => {
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let normal = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    if (normal[0] * (mid[0] - centre[0]) + normal[1] * (mid[1] - centre[1]) < 0) normal = [-normal[0], -normal[1]];
    return [mid[0] + normal[0] * bulge * length, mid[1] + normal[1] * bulge * length];
  };
  const corner = (p) => [p[0], p[1], C];
  const first = origin[0];
  const last = origin[origin.length - 1];
  return [corner(first), ...origin.slice(1, -1), corner(last), border(last, insertion[1]), corner(insertion[1]), corner(insertion[0]), border(insertion[0], first)];
}

/**
 * An outline moved inward by `distance` all round (a border muscle that follows an outline
 * which doubles back, such as the shoulder's cap, where `edgeAt` cannot be used). Each point
 * moves along the bisector of its two edges, never more than three times `distance`.
 */
export function insetPolygon(points, distance) {
  let doubled = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    doubled += a[0] * b[1] - b[0] * a[1];
  }
  // Inward is to the right of travel for points running clockwise as drawn (y down), else to the left.
  const inward = doubled > 0 ? 1 : -1;
  const normalOf = (a, b) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(-(b[1] - a[1]) / length) * inward, ((b[0] - a[0]) / length) * inward];
  };
  return points.map((p, i) => {
    const n1 = normalOf(points[(i + points.length - 1) % points.length], p);
    const n2 = normalOf(p, points[(i + 1) % points.length]);
    const sum = [n1[0] + n2[0], n1[1] + n2[1]];
    const length = Math.hypot(sum[0], sum[1]);
    const miter = length > 1e-9 ? Math.min(3 * distance, (2 * distance) / length) : distance;
    const out = length > 1e-9 ? [p[0] + (sum[0] / length) * miter, p[1] + (sum[1] / length) * miter] : [p[0] + n1[0] * distance, p[1] + n1[1] * distance];
    return p[2] ? [...out, p[2]] : out;
  });
}

// ---------------------------------------------------------------- per-view helpers

/** A muscle from a layer above, drawn as a dashed outline on the layer under it. */
export const ghostOf = (d, short) => ({ kind: "ghost", node: short, d });

/**
 * A layer's direction labels, in the margins of a canvas `width` wide: each entry is
 * `[text, "left" | "right", y]`, set `margin` in from its edge (start-anchored on the left,
 * end-anchored on the right), in the order given.
 */
export const labels = (width, entries, margin = 10) =>
  entries.map(([text, side, y]) => ({ text, x: side === "left" ? margin : width - margin, y, anchor: side === "left" ? "start" : "end" }));
