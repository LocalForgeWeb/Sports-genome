/**
 * BACK view: the subject's RIGHT upper arm seen from behind. The inner (medial) side is on the
 * viewer's LEFT, the outer (lateral) side on the viewer's RIGHT, as in the forearm's back view;
 * the point of the elbow (olecranon) is near the bottom, in the middle.
 *
 * Two layers, as anatomy has them on this side (docs/specialization-atlas/10-multi-region.md
 * §1.2, §7.2; regions/upper_arm/research/dossier.md §4–§5):
 * - surface: the triceps' long head on the inner side, running up toward the shoulder blade on
 *   its tendon (the one head that crosses the shoulder), and its lateral head on the outer side,
 *   both ending on the common tendon, which all three heads share and is drawn as structure;
 *   the medial head as a small partial outcrop on the inner side just above the elbow, below the
 *   long head and beside the tendon; the olecranon, the inner epicondyle and the ulna's back border.
 * - deep: the medial head whole, on the back of the lower half of the humerus below the groove
 *   for the radial nerve, broad across the bone, down to the olecranon; the humerus, the ulna and
 *   the top of the radius as bone; the long and lateral heads as dashed ghosts.
 *
 * Bellies are written as cross-sections (`rowsShape`): [y, inner edge, outer edge] per slice.
 * Below y 526 the elbow's bones and marks are the forearm drawing's back view (`fromForearm`).
 */
import { C, INSET, clipToPolygon, closed, ghostOf, labels, open, rowsShape, tendon } from "../../shared/geometry.mjs";
import { CANVAS, CROP_BOTTOM, CROP_TOP } from "../config.mjs";
import { backEdge, backSilhouette, fromForearm, rowsPoints } from "../silhouettes.mjs";

/** Inner-side (left) and outer-side (right) edges of the outline, just inside. */
const innerIn = (y) => backEdge("inner", y) + INSET;
const outerIn = (y) => backEdge("outer", y) - INSET;

/**
 * The medial head, whole, as the deep layer draws it: from the back of the humerus below the
 * groove for the radial nerve, which runs down and outward, so its top is high on the inner side
 * and low on the outer side; broad across the lower half of the bone, its inner edge along the
 * inner border of the arm; down to the olecranon, closer to the elbow than the other two heads.
 * The surface layer cuts its outcrop from these same points.
 */
const MEDIAL_HEAD = {
  rows: [
    [270, 104, 126], [300, innerIn(300), 150], [340, innerIn(340), 180], [380, innerIn(380), 210], [420, innerIn(420), 236],
    [460, innerIn(460), 248], [500, innerIn(500), 251], [540, innerIn(540), 247], [565, 116, 236],
  ],
  bottom: [[136, 582], [158, 590], [192, 590], [214, 582]],
  top: [[112, 252]],
};

/**
 * Where the medial head shows on the surface: on the inner side just above the elbow, below the
 * long head's lower border (parallel to it, a gutter below, slanting down toward the tendon) and
 * beside the common tendon (its inner edge, less a gutter), down to the head's own lower end. A
 * convex window; the muscle's own outline bounds it on the inner side. Kept small: that any of it
 * shows at the surface is weakly supported (dossier §5, §12). The inner side is a drawing choice
 * (diagram.md, "What each shape rests on").
 */
const MEDIAL_HEAD_WINDOW = [[60, 394], [140.4, 538.5], [143.5, 595], [60, 595]];

export function backView() {
  const skin = { kind: "skin", structure: "skin", d: closed(backSilhouette()) };

  // ------------------------------------------------------------------ surface

  // Long head: from the shoulder blade just below the shoulder socket (its tendon runs on above the
  // top edge), down the inner half of the back of the arm, its lower end handing over to the
  // common tendon in the lower third.
  const longHead = rowsShape({
    rows: [
      [80, 135, 170], [120, 113, 180], [160, innerIn(160), 185], [200, innerIn(200), 187], [240, innerIn(240), 187], [280, innerIn(280), 185],
      [320, innerIn(320), 181], [360, innerIn(360), 176], [400, 96, 169.5], [430, 100, 163.5], [455, 106, 158.5], [478, 116, 152.5],
      [500, 127, 144.5],
    ],
    // Its lower end turns outward and ends on the inner border of the common tendon.
    bottom: [[140, 522]],
    top: [[164, 60], [154, 48, C], [143, 60]],
  });
  const longHeadTendon = tendon([[154, 58], [151, 20], [149, CROP_TOP]], 10, 9);

  // Lateral head: from the back of the humerus below the greater tubercle and above the groove for
  // the radial nerve (its origin, an oblique top running down and inward; it does not cross the
  // shoulder, so nothing of it runs off the top edge), under the shoulder muscle near its top, down
  // the outer half of the back of the arm, its inner edge a gutter from the common tendon all the
  // way down, its outer edge converging, to end on the tendon's outer border.
  const lateralHead = rowsShape({
    rows: [
      [100, 202, outerIn(100)], [140, 198, outerIn(140)], [180, 196, outerIn(180)], [230, 197, outerIn(230)], [280, 199, outerIn(280)],
      [330, 201.5, outerIn(330)], [370, 205.5, 261], [410, 211.5, 255], [440, 217.5, 249], [470, 223.5, 242], [500, 226.5, 235],
    ],
    bottom: [[219.5, 538]],
    // Right to left: up the outer side to the origin's highest point, then down and inward along it.
    top: [[263, 64], [252, 52, C], [228, 70], [208, 90]],
  });

  // The common tendon the three heads end on, to the olecranon: shared, so drawn as structure.
  // Widest between the heads' lower ends, narrowing to the olecranon's width where it ends on it.
  const commonTendon = closed([
    [188, 335, C], [198, 370], [204, 410], [210, 440], [216, 470], [219, 500], [214.5, 530], [203, 558], [186, 580], [176, 588], [164, 590],
    [152, 582], [148, 560], [147, 530], [151, 503], [158, 485], [165, 460], [171, 430], [177, 400], [183, 370],
  ]);

  const medialHeadOutcrop = closed(clipToPolygon(rowsPoints(MEDIAL_HEAD), MEDIAL_HEAD_WINDOW));

  // The point of the elbow, the inner epicondyle under the skin, and the ulna's back border below
  // the elbow: the forearm drawing's back view, moved down.
  const olecranon = closed(fromForearm([[152, 96], [167, 91], [177, 99], [175, 112], [164, 120], [153, 115], [148, 105]]));

  const surface = [
    skin,
    { kind: "outline", structure: "ulna", d: open([...fromForearm([[166, 118], [157, 160], [148, 200], [140, 250]]), [136.7, CROP_BOTTOM]]) },
    { kind: "outline", structure: "epicondyle", d: open(fromForearm([[99, 96], [95, 103], [95.5, 111]])) },
    { kind: "outline", structure: "triceps-tendon", d: commonTendon },
    { kind: "bone", structure: "olecranon", d: olecranon },
    { kind: "belly", node: "TriLong", d: longHead },
    { kind: "belly", node: "TriLat", d: lateralHead },
    {
      kind: "belly", node: "TriMed", d: medialHeadOutcrop,
      outcrop: "Its lowest part, on the inner side just above the elbow, below the long head and beside the common tendon, is not covered by the other two heads; the rest of the head lies under them.",
    },
    { kind: "tendon", node: "TriLong", d: longHeadTendon },
  ];

  // ------------------------------------------------------------------ deep

  // The humerus from behind (the front view's, mirrored, with the head on the inner side), and from
  // y 526 down the forearm drawing's lower end; the olecranon of the ulna sits against it.
  const humerus = closed([
    [120, CROP_TOP, C], [234, CROP_TOP, C], [238, 10], [234, 40], [218, 72], [206, 100], [202, 150], [201, 250], [200, 350], [201, 440], [202, 482],
    ...fromForearm([
      [210, 30], [228, 64], [243, 82], [250, 96], [247, 110], [236, 116], [222, 112], [204, 104], [188, 102], [172, 104], [154, 110], [128, 116],
      [104, 114], [94, 104], [102, 94], [122, 80], [144, 56], [152, 30],
    ]),
    [155, 482], [155, 440], [156, 350], [157, 250], [157, 150], [154, 100], [144, 70], [128, 40], [120, 10],
  ]);
  const ulna = closed([
    ...fromForearm([[150, 92], [166, 86], [182, 96], [182, 120], [170, 150], [155, 200]]),
    [143, CROP_BOTTOM, C], [130, CROP_BOTTOM, C],
    ...fromForearm([[141, 200], [150, 150], [148, 126], [146, 108]]),
  ]);
  const radius = closed([
    ...fromForearm([[228, 128], [240, 124], [252, 128], [254, 140], [250, 150], [251, 175], [246, 250]]),
    [244.5, CROP_BOTTOM, C], [230.5, CROP_BOTTOM, C],
    ...fromForearm([[232, 250], [236, 175], [236, 148], [228, 140]]),
  ]);

  const medialHead = rowsShape(MEDIAL_HEAD);

  const deep = [
    skin,
    { kind: "bone", structure: "humerus", d: humerus },
    { kind: "bone", structure: "ulna", d: ulna },
    { kind: "bone", structure: "radius", d: radius },
    ghostOf(longHead, "TriLong"), ghostOf(lateralHead, "TriLat"),
    { kind: "belly", node: "TriMed", d: medialHead },
  ];

  const words = labels(CANVAS.width, [["Shoulder", "left", 36], ["Inner side", "left", 530], ["Outer side", "right", 530], ["Elbow", "left", 606]]);

  return { surface: { paths: surface, labels: words }, deep: { paths: deep, labels: words } };
}
