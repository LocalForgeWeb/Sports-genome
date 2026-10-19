/**
 * The outer outline of the arm in each view: upper-arm stub (cropped at the top of the
 * canvas), elbow, forearm, wrist and a hand stub whose fingers run off the bottom edge.
 *
 * Proportions are shared by every view so a muscle sits at the same height in all three:
 * epicondyles at y ≈ 104, elbow crease ≈ 114, wrist crease ≈ 600, knuckles ≈ 712, on a
 * 360 × 760 canvas. The forearm is drawn straight (no carrying angle) so the views line up.
 * Points run clockwise from the top-left crop corner; points marked "corner" are sharp.
 */
import { edgeX, mirrorPoints } from "../shared/geometry.mjs";
import { CANVAS, CROP_BOTTOM, CROP_TOP } from "./config.mjs";

/** The hand seen from the palm, thumb on the left, fingers cropped at the bottom edge. */
function palmHand() {
  const b = CROP_BOTTOM;
  return [
    // Radial side of the wrist, then the thenar eminence and the thumb.
    [121.5, 612], [117, 628], [104, 650], [90, 676], [77, 706], [66, 738], [57, 772], [56, b, "corner"],
    [83, b, "corner"], [86, 760], [92, 738], [100, 718], [108, 702], [114, 694, "corner"],
    // Index, middle, ring and little fingers, separated by the webs.
    [112, 708], [110.5, 740], [110, b, "corner"],
    [141.5, b, "corner"], [142, 740], [142.5, 720], [143.5, 714, "corner"], [144.5, 720], [145, 740], [145.5, b, "corner"],
    [176, b, "corner"], [176.5, 742], [177, 721], [178, 716, "corner"], [179, 721], [179.5, 742], [180, b, "corner"],
    [208, b, "corner"], [208.5, 744], [209.5, 724], [210.5, 719, "corner"], [211.5, 724], [212.5, 744], [213, b, "corner"],
    [236, b, "corner"], [237.5, 746], [239.5, 724], [243.5, 704],
    // The hypothenar eminence, back up to the ulnar side of the wrist.
    [247, 680], [247.5, 656], [244.5, 632], [239.5, 614],
  ];
}

/** Forearm and upper-arm stub, palm view, as two edges (radial edge top→bottom, ulnar edge bottom→top). */
function palmArmEdges() {
  const radial = [
    [112, CROP_TOP, "corner"], [110, 20], [106, 52], [100, 80], [93, 104], [88, 132], [86, 165], [87, 200], [90, 240], [95, 290], [101, 340], [106.5, 395], [110.5, 450], [113.5, 505], [116, 552], [118.5, 584], [120.5, 600],
  ];
  const ulnar = [
    [236, 600], [237.5, 584], [240.5, 552], [245.5, 505], [252, 450], [259, 395], [265.5, 340], [270.5, 290], [273.5, 240], [274.5, 200], [273.5, 165], [271, 134], [269.5, 116], [266, 100], [261, 80], [257, 52], [254, 20], [252, CROP_TOP, "corner"],
  ];
  return { radial, ulnar };
}

export function palmSilhouette() {
  const { radial, ulnar } = palmArmEdges();
  return [...radial, ...palmHand(), ...ulnar];
}

/**
 * Where the forearm's outline is at height y, palm view: `radial` is the thumb-side (left)
 * edge, `ulnar` the pinky-side (right) edge. A border muscle is drawn a few units inside it.
 */
export function palmEdge(side, y) {
  return edgeX(palmArmEdges()[side], y);
}

/**
 * Back view: the same arm seen from behind, so the outline is the palm outline mirrored
 * (thumb on the right). The back of the hand has the same outline as its palm.
 */
export function backSilhouette() {
  return mirrorPoints(palmSilhouette(), CANVAS.width).reverse();
}

/** Back view edges: `radial` is now the RIGHT edge and `ulnar` the LEFT one. */
export function backEdge(side, y) {
  return CANVAS.width - palmEdge(side, y);
}

/**
 * Thumb-side view: the radial aspect, so the outline is the arm's front-to-back thickness.
 * The back of the forearm is on the viewer's LEFT and the palm side on the RIGHT (walking
 * round the thumb side from the palm view to the back view). The hand is seen edge-on with
 * the thumb toward the viewer, reaching down and toward the palm side.
 */
function thumbArmEdges() {
  return {
    // Back edge, top→bottom: triceps, the point of the elbow (olecranon), the back of the forearm.
    back: [[114, CROP_TOP, "corner"], [111, 24], [109, 62], [106, 92], [104.5, 112], [106, 132], [109, 170], [113, 220], [118.5, 290], [125, 360], [131.5, 430], [137.5, 500], [141.5, 556], [144, 600]],
    // Palm edge, bottom→top: the front of the forearm, the elbow crease, the front of the upper arm.
    palm: [[221, 600], [222, 572], [227, 520], [235, 460], [243, 400], [250, 340], [254, 280], [255, 230], [252, 186], [245, 150], [236, 126], [235, 106], [241, 72], [244, 36], [243.5, CROP_TOP, "corner"]],
  };
}

export function thumbEdge(side, y) {
  return edgeX(thumbArmEdges()[side], y);
}

export function thumbSilhouette() {
  const { back, palm } = thumbArmEdges();
  return [
    ...back,
    // Back of the hand, edge-on; the index finger runs off the bottom edge.
    [145.5, 640], [147, 690], [149, 740], [150, CROP_BOTTOM, "corner"],
    [184, CROP_BOTTOM, "corner"], [185, 744], [188, 718], [194, 706, "corner"],
    // The thumb, toward the viewer, reaching down and toward the palm side.
    [204, 726], [215, 750], [223, CROP_BOTTOM, "corner"], [256, CROP_BOTTOM, "corner"], [251, 750], [244, 722], [237, 696], [233, 672],
    // The thenar eminence, back up to the wrist.
    [232, 648], [228, 626], [223, 608],
    ...palm,
  ];
}
