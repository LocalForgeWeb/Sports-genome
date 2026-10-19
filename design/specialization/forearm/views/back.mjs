/**
 * BACK view: the posterior forearm of the subject's RIGHT arm, seen from behind. The thumb
 * (radial) side is on the viewer's RIGHT, the pinky (ulnar) side on the viewer's LEFT; the
 * lateral epicondyle is top-right, the point of the elbow (olecranon) top-centre-left.
 *
 * Two layers (the back has no middle layer worth separating, S5):
 * - surface: from the thumb side, the brachioradialis on the edge, extensor carpi radialis
 *   longus and brevis, extensor digitorum (four tendons over the back of the hand), extensor
 *   digiti minimi, extensor carpi ulnaris along the ulna; the anconeus at the elbow; the edge
 *   of flexor carpi ulnaris on the pinky side of the ulna's border. Abductor pollicis longus
 *   and extensor pollicis brevis come to the surface above the wrist and cross the radial
 *   wrist extensor tendons toward the thumb: drawn as partial outcrops (their upper ends cut
 *   where they go under extensor digitorum). The extensor pollicis longus tendon is drawn
 *   where it crosses the wrist; its belly is deep.
 * - deep: supinator round the upper radius, abductor pollicis longus, extensor pollicis
 *   brevis, extensor pollicis longus and extensor indicis on radius, ulna and the membrane
 *   between them; the surface muscles as dashed ghosts.
 */
import { C, INSET, band, bandPoints, clipBelow, closed, ghostOf, labels, open, rowsShape, tendon } from "../../shared/geometry.mjs";
import { CANVAS, CROP_TOP } from "../config.mjs";
import { backEdge, backSilhouette } from "../silhouettes.mjs";

/** Pinky-side (left) and thumb-side (right) edges of the outline, just inside. */
const leftIn = (y) => backEdge("ulnar", y) + INSET;
const rightIn = (y) => backEdge("radial", y) - INSET;

/**
 * The ulna's back border, which lies just under the skin from the point of the elbow to the
 * knob at the wrist: the line between extensor carpi ulnaris and flexor carpi ulnaris on the
 * surface, and the middle of the ulna drawn in the deep layer. One line for both layers, so
 * the bone does not move when the layer changes (tested). It runs nearly straight, as the
 * bone does, about a quarter of the way in from the pinky-side edge at mid-forearm.
 */
const ULNA_BORDER = [[166, 118], [157, 160], [148, 200], [140, 250], [134.5, 300], [131, 360], [129, 420], [127.5, 480], [126.5, 540], [126, 580]];

/**
 * Abductor pollicis longus and extensor pollicis brevis, whole, as the deep layer draws them:
 * from the bones and the membrane between them, slanting toward the thumb, fleshy until a few
 * centimetres above the wrist. The surface layer cuts its outcrops from these same outlines
 * (`clipBelow`), below the height where the extensor digitorum and the radial wrist extensors
 * stop covering them, so the part that shows is exactly part of the muscle underneath.
 */
const APL_OUTLINE = bandPoints(
  [[156, 262], [178, 316], [199, 362], [216, 400], [226, 440], [235, 490], [243, 540]],
  [[0, 0], [0.12, 8], [0.3, 11.5], [0.5, 8], [0.62, 7], [0.85, 6.5], [1, 0]],
  undefined,
  { samples: 25 },
);
const EPB_OUTLINE = bandPoints(
  [[184, 376], [194, 400], [203, 426], [211, 462], [221, 510], [230, 556]],
  [[0, 0], [0.16, 5.5], [0.4, 6], [0.8, 5], [1, 0]],
  undefined,
  { samples: 21 },
);
/** Where each comes out from under its neighbours on the surface, as a height in the drawing. */
const APL_SURFACES_AT = 404;
const EPB_SURFACES_AT = 430;
/** Their tendons, the same in both layers: APL to the base of the thumb, EPB along the thumb. */
const APL_TENDON = tendon([[242, 528], [246.5, 565], [250, 595], [252, 615]], 7, 6.5);
const EPB_TENDON = tendon([[229, 544], [238, 582], [246, 612], [258, 650], [272, 700], [286, 750], [292, 776]], 5.5, 5);

export function backView() {
  const skin = { kind: "skin", structure: "skin", d: closed(backSilhouette()) };

  // ------------------------------------------------------------------ surface

  // Brachioradialis, seen from behind: only its edge, on the thumb side above the elbow and
  // down the upper forearm before it turns to the front.
  const br = rowsShape({
    rows: [[CROP_TOP, [234, C], [rightIn(CROP_TOP), C]], [20, 237, rightIn(20)], [50, 243, rightIn(50)], [80, 250, rightIn(80)], [110, 258.5, rightIn(110)], [140, 261, rightIn(140)], [170, 263, rightIn(170)], [200, 264, rightIn(200)], [228, 265, rightIn(228)]],
    bottom: [[267, 252]],
  });
  // Extensor carpi radialis longus: from the ridge above the lateral epicondyle; tendon to the
  // base of the second metacarpal.
  const ecrl = rowsShape({
    rows: [[60, 233, 242], [90, 238, 251], [120, 243, 255], [150, 245, 257.5], [180, 246, 259.5], [210, 246, 260.5], [240, 246, 262], [270, 246.5, rightIn(270)], [300, 247, 261], [330, 248.5, 257]],
    bottom: [[253, 354]],
    top: [[232, 42]],
  });
  const ecrlTendon = tendon([[252, 336], [249, 400], [243, 470], [235, 540], [227, 592], [221, 632]], 7, 6);
  // Extensor carpi radialis brevis: from the lateral epicondyle; tendon to the third metacarpal.
  const ecrb = rowsShape({
    rows: [[150, 233.5, 241.5], [180, 230, 242.5], [210, 226, 242.5], [240, 222, 242.5], [270, 220, 242.5], [300, 220, 243], [330, 221, 244.5], [360, 223, 243.5], [385, 226, 240.5]],
    bottom: [[232, 404]],
    top: [[238, 121]],
  });
  const ecrbTendon = tendon([[232, 388], [229, 450], [224, 510], [216, 565], [209, 600], [204, 632]], 7, 6);
  // Extensor digitorum: the middle of the back; four slips and tendons to the fingers.
  const ed = rowsShape({
    rows: [[150, 222, 230], [180, 197, 226.5], [210, 184, 222.5], [250, 175, 219], [300, 171, 217.5], [350, 169, 217], [390, 168, 210], [420, 166.5, 194], [450, 165.5, 191], [468, 165.5, 189.5]],
    bottom: [[166, 478], [168.5, 492], [171.5, 482], [175, 496], [178, 484], [181.5, 495], [184.5, 483], [187.5, 490], [190, 476]],
    top: [[233, 124]],
  });
  const edTendons = [
    tendon([[187.5, 480], [190, 540], [195, 600], [214, 660], [230, 712], [234, 776]], 6, 5.5),
    tendon([[181.5, 485], [183, 545], [186, 600], [194, 660], [199, 712], [200, 776]], 6.5, 6),
    tendon([[175, 486], [175, 545], [176.5, 600], [172, 660], [167, 712], [166, 776]], 6, 5.5),
    tendon([[168.5, 482], [167.5, 545], [167.5, 600], [156, 660], [146, 712], [143, 776]], 5, 4.5),
  ];
  // Extensor digiti minimi: the thin strip on the pinky side of extensor digitorum.
  const edm = rowsShape({
    rows: [[150, 213, 218.5], [180, 185, 193.5], [210, 170.5, 180.5], [250, 162.5, 172.5], [300, 158.5, 168.5], [350, 156.5, 166.5], [400, 154.5, 164.5], [440, 153, 163], [470, 152.5, 162]],
    bottom: [[157, 490]],
    top: [[228, 127]],
  });
  const edmTendon = tendon([[157, 474], [154, 540], [151, 600], [142, 660], [137, 712], [135, 776]], 5, 4.5);
  // Extensor carpi ulnaris: from the lateral epicondyle, slanting to the ulna and down its
  // thumb side; tendon past the ulnar head to the base of the fifth metacarpal.
  const ecu = rowsShape({
    rows: [[150, 202, 209.5], [180, 162, 181.5], [210, 148, 168], [250, 142, 160], [300, 136.5, 156], [350, 133.5, 154], [400, 131.5, 152], [450, 130, 150], [500, 129, 146], [540, 128.5, 140]],
    bottom: [[132, 562]],
    top: [[223, 130]],
  });
  const ecuTendon = tendon([[132, 540], [130, 575], [130.5, 600], [134, 625], [137, 642]], 7, 6);
  // Anconeus: the small triangle from the lateral epicondyle to the point of the elbow and the
  // top of the ulna. A neighbour of the forearm, not a forearm target.
  const anconeus = closed([[226, 112, C], [180, 111, C], [160, 150], [146, 190, C], [188, 148]]);
  // Flexor carpi ulnaris, the part seen from behind: on the pinky side of the ulna's border.
  const fcu = rowsShape({
    rows: [[130, leftIn(130), 147], [160, leftIn(160), 148], [190, leftIn(190), 139], [220, leftIn(220), 140], [260, leftIn(260), 136], [300, leftIn(300), 132], [340, leftIn(340), 129.5], [380, leftIn(380), 127.5], [420, leftIn(420), 126.5], [445, leftIn(445), 126]],
    bottom: [[122, 470]],
    top: [[144, 122], [122, 114], [100, 117]],
  });

  // Abductor pollicis longus and extensor pollicis brevis where they come to the surface: the
  // lower ends of the deep muscles, cut square where extensor digitorum and the radial wrist
  // extensors stop covering them, then over those extensors' tendons toward the thumb.
  const aplOutcrop = closed(clipBelow(APL_OUTLINE, APL_SURFACES_AT));
  const epbOutcrop = closed(clipBelow(EPB_OUTLINE, EPB_SURFACES_AT));
  // The long thumb extensor's tendon: deep above, it surfaces at the wrist, bends round the
  // bony bump on the back of the radius and runs to the thumb tip.
  const eplTendon = tendon([[198, 560], [202, 586], [212, 606], [232, 636], [250, 672], [264, 716], [275, 760], [279, 776]], 5, 4.5);

  const ulnaBorder = open(ULNA_BORDER);
  const olecranon = closed([[152, 96], [167, 91], [177, 99], [175, 112], [164, 120], [153, 115], [148, 105]]);

  const surface = [
    skin,
    { kind: "outline", structure: "ulna", d: ulnaBorder },
    // The medial epicondyle, under the skin on the pinky side of the elbow (the lateral one is
    // under the origins of brachioradialis and the radial wrist extensors from this side too).
    { kind: "outline", structure: "epicondyle", d: open([[99, 96], [95, 103], [95.5, 111]]) },
    { kind: "bone", structure: "olecranon", d: olecranon },
    { kind: "belly", node: "BR", d: br },
    { kind: "belly", node: "ECRL", d: ecrl },
    { kind: "belly", node: "ECRB", d: ecrb },
    { kind: "belly", node: "ED", d: ed },
    { kind: "belly", node: "EDM", d: edm },
    { kind: "belly", node: "ECU", d: ecu },
    { kind: "belly", node: "ANC", d: anconeus },
    { kind: "belly", node: "FCU", d: fcu },
    { kind: "tendon", node: "ECRL", d: ecrlTendon },
    { kind: "tendon", node: "ECRB", d: ecrbTendon },
    ...edTendons.map((d) => ({ kind: "tendon", node: "ED", d })),
    { kind: "tendon", node: "EDM", d: edmTendon },
    { kind: "tendon", node: "ECU", d: ecuTendon },
    { kind: "belly", node: "APL", d: aplOutcrop, outcrop: "Comes to the surface between extensor digitorum and the radial wrist extensors a few centimetres above the wrist and crosses their tendons toward the thumb; the rest of the muscle is deep." },
    { kind: "belly", node: "EPB", d: epbOutcrop, outcrop: "Comes to the surface beside abductor pollicis longus above the wrist and crosses the radial wrist extensor tendons toward the thumb; the rest of the muscle is deep." },
    { kind: "tendon", node: "APL", d: APL_TENDON },
    { kind: "tendon", node: "EPB", d: EPB_TENDON },
    { kind: "tendon", node: "EPL", d: eplTendon },
  ];

  // ------------------------------------------------------------------ deep

  // The lateral epicondyle sits a finger's width inside the thumb-side outline (brachioradialis
  // and the long radial wrist extensor make that edge), where the extensors take origin.
  const humerus = closed([
    [155, CROP_TOP, C], [202, CROP_TOP, C], [210, 30], [228, 64], [243, 82], [250, 96], [247, 110], [236, 116], [222, 112], [204, 104], [188, 102], [172, 104], [154, 110], [128, 116], [104, 114], [94, 104], [102, 94], [122, 80], [144, 56], [152, 30],
  ]);
  // Centred on ULNA_BORDER all the way down, so its back border is where the surface layer draws it.
  const ulna = closed([
    [150, 92], [166, 86], [182, 96], [182, 120], [170, 150], [155, 200], [143, 280], [137, 360], [134, 440], [133, 510], [133.5, 556], [134.5, 580], [128, 596], [119, 594], [117.5, 578], [119, 556], [121, 510], [123, 440], [125, 360], [130, 280], [141, 200], [150, 150], [148, 126], [146, 108],
  ]);
  const radius = closed([
    [228, 128], [240, 124], [252, 128], [254, 140], [250, 150], [251, 175], [246, 250], [242, 330], [240, 410], [240, 480], [242, 540], [245, 570], [246, 592], [236, 600], [210, 601], [186, 598], [178, 590], [184, 566], [198, 540], [214, 480], [224, 410], [228, 330], [232, 250], [236, 175], [236, 148], [228, 140],
  ]);
  const membrane = open([[178, 230], [186, 330], [192, 430], [196, 520]]);

  const supinator = rowsShape({
    rows: [[128, 192, 252], [155, 176, 260], [180, 170, 265], [205, 186, 265], [230, 210, 264], [250, 228, 262]],
    bottom: [[250, 272]],
    top: [[238, 118], [206, 120]],
  });
  const apl = closed(APL_OUTLINE);
  const epb = closed(EPB_OUTLINE);
  const epl = band([[145, 300], [150, 350], [157, 400], [166, 445], [176, 482]], [[0, 0], [0.15, 7], [0.5, 11], [0.85, 7], [1, 0]]);
  const ei = band([[137, 430], [144, 470], [153, 505], [164, 540]], [[0, 0], [0.25, 6.5], [0.6, 7.5], [1, 0]]);
  const deepTendons = [
    { node: "APL", d: APL_TENDON },
    { node: "EPB", d: EPB_TENDON },
    { node: "EPL", d: tendon([[174, 474], [190, 530], [199, 565], [204, 588], [214, 607], [234, 638], [251, 674], [265, 718], [276, 760], [279, 776]], 5.5, 4.5) },
    { node: "EI", d: tendon([[162, 532], [174, 570], [188, 600], [210, 650], [228, 712], [232, 776]], 5, 4.5) },
  ];

  const deep = [
    skin,
    { kind: "bone", structure: "humerus", d: humerus },
    { kind: "bone", structure: "ulna", d: ulna },
    { kind: "bone", structure: "radius", d: radius },
    { kind: "outline", structure: "membrane", d: membrane },
    ghostOf(ecu, "ECU"), ghostOf(edm, "EDM"), ghostOf(ed, "ED"), ghostOf(ecrb, "ECRB"), ghostOf(ecrl, "ECRL"),
    { kind: "belly", node: "SUP", d: supinator },
    { kind: "belly", node: "APL", d: apl },
    { kind: "belly", node: "EPB", d: epb },
    { kind: "belly", node: "EPL", d: epl },
    { kind: "belly", node: "EI", d: ei },
    ...deepTendons.map(({ node, d }) => ({ kind: "tendon", node, d })),
  ];

  const words = labels(CANVAS.width, [["Pinky side", "left", 470], ["Thumb side", "right", 470], ["Elbow", "left", 120], ["Wrist", "left", 604]]);

  return { surface: { paths: surface, labels: words }, deep: { paths: deep, labels: words } };
}
