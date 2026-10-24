/**
 * The outer outline of the arm in each view: the upper arm from just below the shoulder joint
 * (cropped at the top of the canvas), the elbow, and the top of the forearm (cropped at the
 * bottom). Points run clockwise from the top-left crop corner; points marked "corner" are sharp.
 *
 * The elbow is the forearm drawing's (design/specialization/forearm/), moved down the canvas by
 * ELBOW_DROP, so the two drawings meet at one elbow: from y 548 down, the outline is the forearm
 * palm view's outline, point for point, and the bones, the end of the biceps and its tendon, the
 * end of brachialis and the course of brachioradialis are the forearm's too (tested in
 * client/src/lib/specialization/upper_armDiagram.test.ts). Above that the upper arm is this
 * drawing's own: widest across the biceps and triceps at mid-arm, narrowing toward the elbow.
 */
import { C, edgeX, mirrorPoints } from "../shared/geometry.mjs";
import { CANVAS, CROP_BOTTOM, CROP_TOP } from "./config.mjs";

/** How far below its place in the forearm drawing a point of the shared elbow is drawn here. */
export const ELBOW_DROP = 496;

/** Points of the forearm drawing, moved down to this drawing's elbow. */
export const fromForearm = (points) => points.map(([x, y, flag]) => (flag ? [x, y + ELBOW_DROP, flag] : [x, y + ELBOW_DROP]));

/**
 * The outline points `rowsShape` (shared/geometry.mjs) draws a belly through, so a deep muscle
 * can be cut into its outcrop from exactly the outline its own layer draws:
 * `closed(rowsPoints(spec))` is `rowsShape(spec)`.
 */
export function rowsPoints({ rows, top = [], bottom = [] }) {
  const left = rows.map(([y, l]) => (typeof l === "number" ? [l, y] : [l[0], y, l[1]]));
  const right = rows.map(([y, , r]) => (typeof r === "number" ? [r, y] : [r[0], y, r[1]])).reverse();
  return [...left, ...bottom, ...right, ...top];
}

/**
 * Front view: the arm in anatomical position, palm forward, so the outer (lateral) side is on
 * the viewer's LEFT and the inner (medial) side on the RIGHT, as the forearm's palm view has
 * the thumb side on the left. `outer` runs top→bottom, `inner` bottom→top.
 */
function frontArmEdges() {
  const outer = [
    [97, CROP_TOP, C], [92, 30], [88, 80], [86, 130], [85, 180], [86, 230], [88, 280], [92, 330], [96, 380], [100, 430], [103, 480], [105, 515],
    // The forearm palm view's thumb-side edge from 52 down (its 548 here).
    ...fromForearm([[106, 52], [100, 80], [93, 104], [88, 132], [86, 165], [87, 200], [90, 240]]),
    [94, CROP_BOTTOM, C],
  ];
  const inner = [
    [271, CROP_BOTTOM, C],
    // The forearm palm view's pinky-side edge, up to 52 (its 548 here).
    ...fromForearm([[273.5, 240], [274.5, 200], [273.5, 165], [271, 134], [269.5, 116], [266, 100], [261, 80], [257, 52]]),
    [258, 515], [261, 480], [265, 440], [269, 400], [273, 350], [276, 300], [277.5, 250], [278, 200], [277, 150], [275, 100], [272.5, 50], [270, CROP_TOP, C],
  ];
  return { outer, inner };
}

export function frontSilhouette() {
  const { outer, inner } = frontArmEdges();
  return [...outer, ...inner];
}

/** Where the outline is at height y, front view: `outer` is the left edge, `inner` the right. */
export function frontEdge(side, y) {
  return edgeX(frontArmEdges()[side], y);
}

/**
 * Back view: the same arm seen from behind, so the outline is the front outline mirrored, the
 * inner side on the viewer's LEFT and the outer side on the RIGHT (as the forearm's back view has
 * the pinky side on the left).
 */
export function backSilhouette() {
  return mirrorPoints(frontSilhouette(), CANVAS.width).reverse();
}

/** Back view edges: `outer` is now the RIGHT edge and `inner` the LEFT one. */
export function backEdge(side, y) {
  return CANVAS.width - frontEdge(side, y);
}
