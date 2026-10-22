/**
 * FRONT view: the subject's RIGHT upper arm in anatomical position, palm forward, seen from the
 * front. The outer (lateral) side is on the viewer's LEFT, the inner (medial) side on the
 * viewer's RIGHT, as in the forearm's palm view; the shoulder is above the top edge and the
 * elbow near the bottom. The left arm is the mirror image, drawn by the renderer.
 *
 * Two layers, as anatomy has them on this side (docs/specialization-atlas/10-multi-region.md
 * §1.2, §7.2; regions/upper_arm/research/dossier.md §4–§5):
 * - surface: the biceps, its long head on the outer side and its short head on the inner side
 *   running up toward the shoulder blade on their tendons, its lower tendon dipping into the
 *   hollow in front of the elbow; the outer edge of brachialis as a partial outcrop beside the
 *   lower biceps; brachioradialis (a forearm muscle the upper arm lists) from the ridge above
 *   the outer epicondyle down the outer border of the forearm.
 * - deep: brachialis whole, on the front of the lower half of the upper-arm bone, crossing the
 *   elbow to the ulna; coracobrachialis on the inner side of the upper half, from the shoulder
 *   blade (above the top edge) to the middle of the bone; the humerus, the top of the radius and
 *   the ulna as bone; the biceps and brachioradialis as dashed ghosts.
 *
 * Bellies are written as cross-sections (`rowsShape`): [y, outer edge, inner edge] per slice, so
 * neighbours keep an even gutter. Below y 546 the elbow is the forearm drawing's (`fromForearm`).
 */
import { C, INSET, band, clipToPolygon, closed, ghostOf, labels, open, rowsShape, tendon } from "../../shared/geometry.mjs";
import { CANVAS, CROP_BOTTOM, CROP_TOP } from "../config.mjs";
import { frontEdge, frontSilhouette, fromForearm, rowsPoints } from "../silhouettes.mjs";

const outerIn = (y) => frontEdge("outer", y) + INSET;

/**
 * Brachialis, whole, as the deep layer draws it: from the front of the lower half of the
 * humerus, its top embracing the shoulder muscle's insertion, broad across the bone, its outer
 * edge reaching the outer border of the arm; from y 546 down it is the forearm drawing's
 * brachialis, ending on the ulna below the elbow. The surface layer cuts its outcrop from these
 * same points (`clipToPolygon`), so the part that shows is exactly part of the muscle underneath.
 */
const BRACHIALIS = {
  rows: [
    [300, 156, 190], [325, 128, 206], [350, 108, 218], [380, outerIn(380), 228], [410, outerIn(410), 235], [440, outerIn(440), 239],
    [470, outerIn(470), 241], [500, 109, 240], [525, 122, 235],
    // The forearm drawing's slices at 50, 75 and 95, moved down.
    [546, 139, 228], [571, 153, 220], [591, 177, 211],
  ],
  bottom: fromForearm([[191, 105], [201, 113], [209, 105]]),
  top: [[182, 287], [170, 281], [160, 288]],
};

/**
 * Where brachialis shows on the surface: lateral to the lower biceps, below the shoulder
 * muscle's insertion (y 335), between the biceps (its outer edge, less a gutter) and
 * brachioradialis (its upper inner edge, less a gutter), down to where those two close over it
 * (y 532). A convex window; the muscle's own outline bounds it on the outer side.
 */
const BRACHIALIS_WINDOW = [[77.3, 335], [119, 335], [144.5, 505], [144.5, 532], [140, 532]];

/**
 * Brachioradialis from the front: from the ridge above the outer epicondyle (its pointed top,
 * about 7.5 cm above the epicondyle) down the outer border, as the forearm drawing draws it from
 * y 546 down (its rows, moved down); cropped at the bottom edge.
 */
const BR_ROWS = [
  [480, outerIn(480), 113], [510, outerIn(510), 124],
  ...[[50, 134.5], [80, 137.5], [114, 141], [150, 144], [188, 144], [228, 141.5], [272, 138]].map(([y, inner]) => [y + 496, outerIn(y + 496), inner]),
];

export function frontView() {
  const skin = { kind: "skin", structure: "skin", d: closed(frontSilhouette()) };

  // ------------------------------------------------------------------ surface

  // Biceps: two heads from the shoulder blade, side by side in the upper arm (the long head on the
  // outer side, its belly starting lower; the short head on the inner side), joined into one belly
  // that narrows to its tendon above the elbow. One node: its heads are not split (§1.2).
  const biceps = rowsShape({
    rows: [
      [150, 127, 235], [190, 121, 242], [230, 118, 246], [270, 118, 247], [310, 121, 246], [350, 128, 243], [390, 136, 238], [430, 143, 232],
      [470, 148, 226], [505, 151, 220], [544, 151, 213],
    ],
    // The forearm drawing's end of the biceps, moved down: the same rounded end above the crease.
    bottom: fromForearm([[161, 70], [176, 82], [190, 82], [204, 70]]),
    // Right to left: up the short head to its tip, down into the groove between the heads, up the long head to its tip.
    top: [[233, 112], [226, 76], [215, 50, C], [204, 76], [194, 112], [181, 150, C], [168, 120], [160, 104], [153, 92, C], [142, 108], [133, 128]],
  });
  // Their tendons run on above the top edge: the long head's over the head of the humerus to the
  // top of the shoulder socket, the short head's to the coracoid process.
  const longHeadTendon = tendon([[153, 104], [151, 60], [149, 20], [148, CROP_TOP]], 7, 6);
  const shortHeadTendon = tendon([[215, 62], [218, 30], [220, CROP_TOP]], 9, 8);
  // The lower tendon, the forearm drawing's: into the hollow in front of the elbow, toward the radius.
  const bicepsTendon = tendon(fromForearm([[184, 66], [180, 96], [172, 128], [163, 156], [156, 178]]), 11, 7, { taper: 0.18 });

  const br = rowsShape({
    rows: [...BR_ROWS, [CROP_BOTTOM, [outerIn(CROP_BOTTOM), C], [137.5, C]]],
    top: [[105.5, 455]],
  });

  const brachialisOutcrop = closed(clipToPolygon(rowsPoints(BRACHIALIS), BRACHIALIS_WINDOW));

  const surface = [
    skin,
    // The elbow crease and the inner (medial) epicondyle under the skin, as the forearm drawing has them.
    { kind: "outline", structure: "crease", d: open(fromForearm([[150, 114], [178, 117], [210, 117], [236, 114]])) },
    { kind: "outline", structure: "epicondyle", d: open(fromForearm([[262, 96], [267.5, 103], [267.5, 112]])) },
    { kind: "belly", node: "Biceps", d: biceps },
    { kind: "belly", node: "BR", d: br },
    {
      kind: "belly", node: "Brachialis", d: brachialisOutcrop,
      outcrop: "Its outer edge shows beside the lower half of the biceps, between the biceps and brachioradialis, below the shoulder muscle's insertion; the rest of the muscle lies under the biceps.",
    },
    { kind: "tendon", node: "Biceps", d: longHeadTendon },
    { kind: "tendon", node: "Biceps", d: shortHeadTendon },
    { kind: "tendon", node: "Biceps", d: bicepsTendon },
  ];

  // ------------------------------------------------------------------ deep

  // The humerus from the front: the head (inner side) and the greater tubercle (outer side) at the
  // top edge, the shaft, and from y 542 down the forearm drawing's lower end with its two
  // epicondyles, the outer one under the origins of brachioradialis and the wrist extensors.
  const humerus = closed([
    [126, CROP_TOP, C], [240, CROP_TOP, C], [240, 10], [232, 40], [216, 70], [206, 100], [203, 150], [203, 250], [204, 350], [205, 440], [205, 482],
    ...fromForearm([
      [207, 34], [216, 62], [238, 82], [258, 94], [269, 103], [266, 112], [250, 116], [232, 120], [214, 127], [196, 128], [180, 122], [164, 124],
      [148, 125], [132, 124], [117, 118], [110, 110], [110, 100], [118, 90], [133, 74], [150, 46],
    ]),
    [158, 482], [159, 440], [160, 350], [159, 250], [158, 150], [154, 100], [142, 72], [126, 40], [122, 10],
  ]);
  // The tops of the radius (outer) and the ulna (inner), the forearm drawing's, cropped at the bottom edge.
  const radius = closed([
    ...fromForearm([[121, 128], [134, 125], [148, 127], [151, 135], [146, 143], [143, 154], [150, 166], [150, 180], [142, 192], [137, 250]]),
    [136.6, CROP_BOTTOM, C], [117.6, CROP_BOTTOM, C],
    ...fromForearm([[120, 250], [127, 196], [131, 154], [124, 140]]),
  ]);
  const ulna = closed([
    ...fromForearm([[184, 130], [204, 129], [228, 126], [236, 136], [230, 156], [227, 200]]),
    [225, CROP_BOTTOM, C], [212, CROP_BOTTOM, C],
    ...fromForearm([[211, 200], [202, 162], [190, 146]]),
  ]);

  const brachialis = rowsShape(BRACHIALIS);
  // Its tendon to the ulna below the elbow, the forearm drawing's.
  const brachialisTendon = tendon(fromForearm([[201, 100], [201, 122], [202, 142]]), 10, 8);

  // Coracobrachialis: slender, on the inner side of the upper half, from the coracoid process
  // (above the top edge, with the biceps' short head) to the inner side of the humerus about
  // halfway down. Behind the biceps' short head, so it is drawn on the deep layer only.
  const coracobrachialis = band(
    [[237, CROP_TOP], [235, 40], [229, 110], [221, 180], [213, 240], [207, 282]],
    [[0, 7], [0.2, 12.5], [0.55, 14], [0.85, 9], [1, 0]],
    undefined,
    { samples: 21 },
  );

  const deep = [
    skin,
    { kind: "bone", structure: "humerus", d: humerus },
    { kind: "bone", structure: "radius", d: radius },
    { kind: "bone", structure: "ulna", d: ulna },
    ghostOf(biceps, "Biceps"), ghostOf(br, "BR"),
    { kind: "belly", node: "Brachialis", d: brachialis },
    { kind: "belly", node: "CB", d: coracobrachialis },
    { kind: "tendon", node: "Brachialis", d: brachialisTendon },
  ];

  const words = labels(CANVAS.width, [["Shoulder", "left", 36], ["Outer side", "left", 530], ["Inner side", "right", 530], ["Elbow", "left", 606]]);

  return { surface: { paths: surface, labels: words }, deep: { paths: deep, labels: words } };
}
