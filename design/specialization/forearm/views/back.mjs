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
import { band, closed, open, rowsShape, tendon } from "../geometry.mjs";
import { CROP_TOP, backEdge, backSilhouette } from "../silhouettes.mjs";

const C = "corner";
const INSET = 3;
/** Pinky-side (left) and thumb-side (right) edges of the outline, just inside. */
const leftIn = (y) => backEdge("ulnar", y) + INSET;
const rightIn = (y) => backEdge("radial", y) - INSET;

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
    rows: [[150, 222, 230], [180, 197, 226.5], [210, 183.5, 222.5], [250, 171.5, 219], [300, 169.5, 217.5], [350, 167.5, 217], [390, 166.5, 210], [420, 165.5, 194], [450, 165, 191], [468, 165, 189.5]],
    bottom: [[165.5, 478], [168.5, 492], [171.5, 482], [175, 496], [178, 484], [181.5, 495], [184.5, 483], [187.5, 490], [190, 476]],
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
    rows: [[150, 213, 218.5], [180, 185, 193.5], [210, 168.5, 180], [250, 157.5, 168], [300, 154.5, 166], [350, 152.5, 164], [400, 151.5, 163], [440, 151, 162], [470, 151, 161]],
    bottom: [[155.5, 490]],
    top: [[228, 127]],
  });
  const edmTendon = tendon([[155.5, 474], [153, 540], [151, 600], [142, 660], [137, 712], [135, 776]], 5, 4.5);
  // Extensor carpi ulnaris: from the lateral epicondyle, slanting to the ulna and down its
  // thumb side; tendon past the ulnar head to the base of the fifth metacarpal.
  const ecu = rowsShape({
    rows: [[150, 202, 209.5], [180, 162, 181.5], [210, 140.5, 165], [250, 129, 154], [300, 124, 151], [350, 122, 149], [400, 122, 148], [450, 123, 147], [500, 124.5, 144], [540, 126.5, 139]],
    bottom: [[131, 562]],
    top: [[223, 130]],
  });
  const ecuTendon = tendon([[130.5, 540], [128.5, 575], [130, 600], [134, 625], [137, 642]], 7, 6);
  // Anconeus: the small triangle from the lateral epicondyle to the point of the elbow and the
  // top of the ulna. A neighbour of the forearm, not a forearm target.
  const anconeus = closed([[226, 112, C], [180, 111, C], [160, 150], [146, 190, C], [188, 148]]);
  // Flexor carpi ulnaris, the part seen from behind: on the pinky side of the ulna's border.
  const fcu = rowsShape({
    rows: [[130, leftIn(130), 147], [160, leftIn(160), 148], [190, leftIn(190), 139], [220, leftIn(220), 131], [260, leftIn(260), 123.5], [300, leftIn(300), 120], [340, leftIn(340), 118], [380, leftIn(380), 117.5], [420, leftIn(420), 117.5], [445, leftIn(445), 118]],
    bottom: [[114.5, 470]],
    top: [[144, 122], [122, 114], [100, 117]],
  });

  // Abductor pollicis longus and extensor pollicis brevis where they come to the surface:
  // square upper ends (they continue under extensor digitorum), then over the radial wrist
  // extensor tendons toward the thumb.
  const aplOutcrop = band([[217, 396], [226, 440], [235, 490], [243, 540]], [[0, 6], [0.3, 7.5], [0.75, 6.5], [1, 0]]);
  const epbOutcrop = band([[203, 420], [211, 462], [221, 510], [230, 556]], [[0, 5], [0.35, 6], [0.8, 5], [1, 0]]);
  const aplTendon = tendon([[242, 528], [246.5, 565], [250, 595], [252, 615]], 7, 6.5);
  const epbTendon = tendon([[230, 544], [238, 582], [246, 612], [258, 650], [272, 700], [286, 750], [292, 776]], 5.5, 5);
  // The long thumb extensor's tendon: deep above, it surfaces at the wrist, bends round the
  // bony bump on the back of the radius and runs to the thumb tip.
  const eplTendon = tendon([[198, 560], [202, 586], [212, 606], [232, 636], [250, 672], [264, 716], [275, 760], [279, 776]], 5, 4.5);

  const ulnaBorder = open([[166, 118], [152, 160], [139, 200], [128, 250], [122, 300], [120, 360], [120, 420], [121, 480], [123, 540], [126, 580]]);
  const olecranon = closed([[152, 96], [167, 91], [177, 99], [175, 112], [164, 120], [153, 115], [148, 105]]);

  const surface = [
    skin,
    { kind: "outline", structure: "ulna", d: ulnaBorder },
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
    { kind: "tendon", node: "APL", d: aplTendon },
    { kind: "tendon", node: "EPB", d: epbTendon },
    { kind: "tendon", node: "EPL", d: eplTendon },
  ];

  // ------------------------------------------------------------------ deep

  const humerus = closed([
    [155, CROP_TOP, C], [202, CROP_TOP, C], [210, 30], [232, 66], [254, 86], [262, 98], [258, 110], [240, 116], [222, 112], [204, 104], [188, 102], [172, 104], [154, 110], [128, 116], [104, 114], [94, 104], [102, 94], [122, 80], [144, 56], [152, 30],
  ]);
  const ulna = closed([
    [150, 92], [166, 86], [182, 96], [182, 120], [176, 150], [168, 200], [160, 280], [152, 360], [145, 440], [140, 510], [138, 556], [134, 580], [128, 596], [119, 594], [117, 578], [123, 556], [128, 510], [134, 440], [140, 360], [147, 280], [154, 200], [156, 150], [150, 126], [146, 108],
  ]);
  const radius = closed([
    [232, 128], [246, 124], [260, 128], [262, 140], [254, 148], [252, 175], [246, 250], [242, 330], [240, 410], [240, 480], [242, 540], [245, 570], [246, 592], [236, 600], [210, 601], [186, 598], [178, 590], [184, 566], [198, 540], [214, 480], [224, 410], [228, 330], [232, 250], [236, 175], [236, 148], [228, 140],
  ]);
  const membrane = open([[178, 230], [186, 330], [192, 430], [196, 520]]);

  const supinator = rowsShape({
    rows: [[128, 196, 255], [155, 188, 262], [180, 186, 266], [205, 196, 266], [230, 214, 265], [250, 230, 263]],
    bottom: [[250, 272]],
    top: [[238, 118], [212, 120]],
  });
  const apl = band([[160, 262], [178, 320], [197, 378], [214, 428], [232, 474]], [[0, 0], [0.15, 8], [0.45, 13], [0.8, 9], [1, 0]]);
  const epb = band([[172, 372], [186, 414], [202, 456], [218, 496], [232, 530]], [[0, 0], [0.2, 7], [0.55, 9.5], [0.85, 7], [1, 0]]);
  const epl = band([[148, 300], [152, 350], [158, 400], [166, 445], [176, 482]], [[0, 0], [0.15, 7], [0.5, 11], [0.85, 7], [1, 0]]);
  const ei = band([[140, 430], [146, 470], [154, 505], [164, 540]], [[0, 0], [0.25, 6.5], [0.6, 7.5], [1, 0]]);
  const deepTendons = [
    { node: "APL", d: tendon([[230, 466], [240, 520], [247, 570], [251, 600], [253, 615]], 7, 6.5) },
    { node: "EPB", d: tendon([[229, 518], [236, 560], [242, 595], [252, 630], [266, 680], [280, 730], [290, 776]], 5.5, 5) },
    { node: "EPL", d: tendon([[174, 474], [190, 530], [199, 565], [204, 588], [214, 607], [234, 638], [251, 674], [265, 718], [276, 760], [279, 776]], 5.5, 4.5) },
    { node: "EI", d: tendon([[162, 532], [174, 570], [188, 600], [210, 650], [228, 712], [232, 776]], 5, 4.5) },
  ];

  const ghostOf = (d, short) => ({ kind: "ghost", node: short, d });
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

  const labels = [
    { text: "Pinky side", x: 10, y: 470, anchor: "start" },
    { text: "Thumb side", x: 350, y: 470, anchor: "end" },
    { text: "Elbow", x: 10, y: 120, anchor: "start" },
    { text: "Wrist", x: 10, y: 604, anchor: "start" },
  ];

  return { surface: { paths: surface, labels }, deep: { paths: deep, labels } };
}
