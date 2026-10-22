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
 * long head's lower border (that border, less a gutter, slanting down toward the tendon) and beside
 * the common tendon (its inner edge, less a gutter), down to the head's own lower end. A convex
 * window; the muscle's own outline bounds it on the inner side. Kept small: that any of it shows
 * at the surface is weakly supported (dossier §5, §12).
 */
const MEDIAL_HEAD_WINDOW = [[60, 418], [137, 518], [143, 595], [60, 595]];

export function backView() {
  const skin = { kind: "skin", structure: "skin", d: closed(backSilhouette()) };

  // ------------------------------------------------------------------ surface

  // Long head: from the shoulder blade just below the shoulder socket (its tendon runs on above the
  // top edge), down the inner half of the back of the arm, its lower end handing over to the
  // common tendon in the lower third.
  const longHead = rowsShape({
    rows: [
      [80, 135, 170], [120, 113, 180], [160, innerIn(160), 185], [200, innerIn(200), 187], [240, innerIn(240), 187], [280, innerIn(280), 185],
      [320, innerIn(320), 181], [360, innerIn(360), 176], [400, 96, 170], [430, 100, 165], [455, 106, 160], [478, 116, 153],
    ],
    // Its lower end turns outward, onto the inner border of the common tendon.
    bottom: [[136, 500]],
    top: [[164, 60], [154, 48, C], [143, 60]],
  });
  const longHeadTendon = tendon([[154, 58], [151, 20], [149, CROP_TOP]], 10, 9);

  // Lateral head: from the back of the humerus above the groove for the radial nerve, under the
  // shoulder muscle at the top edge, down the outer half of the back of the arm, its lower border
  // running down and inward to the common tendon.
  const lateralHead = rowsShape({
    rows: [
      [CROP_TOP, [198, C], [outerIn(CROP_TOP), C]], [30, 197, outerIn(30)], [80, 196, outerIn(80)], [130, 196, outerIn(130)], [180, 196, outerIn(180)],
      [230, 197, outerIn(230)], [280, 200, outerIn(280)], [330, 204, outerIn(330)], [380, 210, outerIn(380)], [420, 216, 256],
      [450, 222, 248], [475, 226, 238],
    ],
    // Its lower end turns inward, onto the outer border of the common tendon.
    bottom: [[226, 494]],
  });

  // The common tendon the three heads end on, to the olecranon: shared, so drawn as structure.
  const commonTendon = closed([
    [188, 335, C], [198, 370], [204, 410], [209, 440], [213, 465], [216, 490], [222, 515], [226, 540], [222, 562], [210, 579], [195, 589], [178, 590],
    [161, 584], [150, 568], [146, 545], [145, 522], [150, 503], [158, 485], [165, 460], [171, 430], [177, 400], [183, 370],
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
