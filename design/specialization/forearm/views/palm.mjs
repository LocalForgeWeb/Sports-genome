/**
 * PALM view: the anterior forearm of the subject's RIGHT arm in anatomical position, palm
 * facing the viewer. The thumb (radial) side is on the viewer's LEFT, the pinky (ulnar)
 * side on the viewer's RIGHT; the lateral epicondyle is top-left, the medial epicondyle
 * top-right. The left arm is the mirror image, drawn by the renderer.
 *
 * Three layers, as anatomy has them on this side (S5, S6):
 * - surface: brachioradialis on the thumb-side border; the flexor-pronator fan from the
 *   medial epicondyle (pronator teres, flexor carpi radialis, palmaris longus, flexor carpi
 *   ulnaris); the end of the biceps in the upper-arm stub as a landmark.
 * - intermediate: flexor digitorum superficialis, with the surface muscles as ghosts.
 * - deep: flexor digitorum profundus, flexor pollicis longus, pronator quadratus, the
 *   supinator round the neck of the radius, brachialis in the upper-arm stub; the end of
 *   the humerus, the radius and the ulna as bone.
 *
 * Bellies are written as cross-sections (`rowsShape`): [y, thumb-side edge, pinky-side
 * edge] per slice, so neighbours keep an even gutter.
 */
import { C, INSET, closed, ghostOf, labels, open, rowsShape, tendon } from "../../shared/geometry.mjs";
import { CANVAS, CROP_TOP } from "../config.mjs";
import { palmEdge, palmSilhouette } from "../silhouettes.mjs";

const radialIn = (y) => palmEdge("radial", y) + INSET;
const ulnarIn = (y) => palmEdge("ulnar", y) - INSET;

export function palmView() {
  const skin = { kind: "skin", structure: "skin", d: closed(palmSilhouette()) };

  // ------------------------------------------------------------------ surface

  // Brachioradialis: from the ridge above the lateral epicondyle (cropped at the top) down
  // the thumb-side border; belly in the upper part, tendon to the radial styloid.
  const br = rowsShape({
    rows: [
      [CROP_TOP, [radialIn(CROP_TOP), C], [131.5, C]], [20, radialIn(20), 132.5], [50, radialIn(50), 134.5], [80, radialIn(80), 137.5], [114, radialIn(114), 141],
      [150, radialIn(150), 144], [188, radialIn(188), 144], [228, radialIn(228), 141.5], [272, radialIn(272), 138], [322, radialIn(322), 131.5], [372, radialIn(372), 125], [410, radialIn(410), 120],
    ],
    bottom: [[115.5, 434]],
  });
  const brTendon = tendon([[117, 400], [119.5, 450], [122.5, 505], [125, 552], [127, 590]], 7.5, 6);

  // Pronator teres: short and thick, slanting from the medial epicondyle toward the middle
  // of the radius. The insertion lies under the brachioradialis, so the drawn belly stops at
  // that muscle's edge: the deeper muscle drawn partially, as anatomy has it.
  const pt = rowsShape({
    rows: [[130, 226, 254], [150, 208, 247], [175, 186, 237], [200, 166, 222], [230, 145.5, 200], [260, 142.5, 178], [290, 139, 157]],
    bottom: [[140.5, 305]],
    top: [[257, 116]],
  });

  // Flexor carpi radialis: from the medial epicondyle to the thumb side of the wrist; belly
  // in the upper half, tendon to the base of the second metacarpal.
  const fcr = rowsShape({
    rows: [[150, 250, 259], [175, 240, 254], [200, 227, 246], [230, 207, 236], [260, 190, 222], [290, 178, 210], [320, 169, 200], [350, 161.5, 189], [380, 157, 176]],
    bottom: [[160.5, 410]],
    top: [[263.5, 128]],
  });
  const fcrTendon = tendon([[165, 380], [158.5, 430], [155, 480], [153, 530], [152.5, 575], [153, 604], [151, 640]], 8, 6.5);

  // Palmaris longus: a small belly near the elbow and a long slender tendon to the middle
  // of the wrist, fanning into the palm (the palmar aponeurosis).
  const pl = rowsShape({
    rows: [[150, 262, 265.5], [175, 257.5, 263.5], [200, 250, 258.5], [230, 240, 252.5], [255, 231, 245.5], [275, 226, 239]],
    bottom: [[228, 296]],
    top: [[266.5, 137]],
  });
  const plTendon = tendon([[228.5, 282], [219, 330], [209, 390], [199.5, 450], [191.5, 510], [186, 560], [183, 602]], 4.5, 4);
  // Four slips fanning toward the fingers, thin, because it is a sheet of connective tissue.
  const palmarAponeurosis = [
    tendon([[183, 598], [176, 640], [164, 676], [152, 702]], 4, 2.5, { taper: 0.05 }),
    tendon([[183, 598], [180, 640], [174, 676], [170, 704]], 4, 2.5, { taper: 0.05 }),
    tendon([[183.5, 598], [186, 640], [190, 676], [193, 704]], 4, 2.5, { taper: 0.05 }),
    tendon([[184, 598], [192, 640], [204, 674], [214, 700]], 4, 2.5, { taper: 0.05 }),
  ];

  // Flexor carpi ulnaris: down the pinky-side border to the pisiform.
  const fcu = rowsShape({
    rows: [150, 175, 200, 230, 260, 290, 320, 350, 380, 410, 440, 470, 500, 530].map((y, index) => [y, [268.5, 266.5, 262, 256.5, 249, 238.5, 232, 229, 227.5, 227, 227, 227.5, 228.5, 230.5][index], ulnarIn(y)]),
    bottom: [[234, 554]],
    top: [[269, 120]],
  });
  const fcuTendon = tendon([[235, 525], [232.5, 565], [229.5, 592], [226.5, 608], [224.5, 622]], 8.5, 7);

  // The end of the biceps in the upper-arm stub, its tendon dipping into the hollow in
  // front of the elbow toward the radius. An upper-arm muscle, drawn as a landmark.
  const biceps = closed([
    [150, CROP_TOP, C], [148, 20], [151, 48], [161, 70], [176, 82], [190, 82], [204, 70], [213, 48], [216, 20], [215, CROP_TOP, C],
  ]);
  const bicepsTendon = tendon([[184, 66], [180, 96], [172, 128], [163, 156], [156, 178]], 11, 7, { taper: 0.18 });

  const surface = [
    skin,
    { kind: "outline", structure: "crease", d: open([[150, 114], [178, 117], [210, 117], [236, 114]]) },
    { kind: "outline", structure: "epicondyle", d: open([[262, 96], [267.5, 103], [267.5, 112]]) },
    { kind: "belly", node: "BR", d: br },
    { kind: "belly", node: "Biceps", d: biceps },
    { kind: "belly", node: "PT", d: pt },
    { kind: "belly", node: "FCR", d: fcr },
    { kind: "belly", node: "PL", d: pl },
    { kind: "belly", node: "FCU", d: fcu },
    { kind: "tendon", node: "BR", d: brTendon },
    { kind: "tendon", node: "Biceps", d: bicepsTendon },
    { kind: "tendon", node: "FCR", d: fcrTendon },
    { kind: "tendon", node: "PL", d: plTendon },
    ...palmarAponeurosis.map((d) => ({ kind: "tendon", node: "PL", d })),
    { kind: "tendon", node: "FCU", d: fcuTendon },
  ];

  // ------------------------------------------------------------------ intermediate

  // Flexor digitorum superficialis: a broad sheet from the medial epicondyle (humero-ulnar
  // head) and the front of the radius (radial head, on the thumb side), joined by a fibrous
  // arch, splitting into four slips and tendons that pass the wrist together and fan to the
  // four fingers.
  const fds = rowsShape({
    rows: [[200, 137, 267], [240, 133.5, 266], [280, 132.5, 263], [320, 133.5, 259], [360, 136.5, 252.5], [400, 141.5, 244.5], [430, 147.5, 237.5], [455, 155, 231]],
    bottom: [[163, 470], [173, 492], [181, 478], [190, 498], [198, 480], [206, 494], [213, 476], [220, 486], [226, 468]],
    top: [[266.5, 170], [264, 142], [252, 123], [226, 134], [200, 150], [176, 167], [155, 180], [141, 190]],
  });
  const fdsTendons = [
    tendon([[173, 480], [171.5, 532], [171, 600], [160, 656], [143, 712], [130, 776]], 6.5, 6),
    tendon([[190, 486], [188.5, 540], [186.5, 600], [178, 656], [164, 712], [161, 776]], 7, 6.5),
    tendon([[206, 482], [203.5, 540], [200, 600], [198, 656], [194.5, 712], [195, 776]], 7, 6.5),
    tendon([[220, 474], [216.5, 540], [212, 600], [218, 656], [224, 712], [225, 776]], 6, 5.5),
  ];

  const intermediate = [
    skin,
    ghostOf(br, "BR"), ghostOf(pt, "PT"), ghostOf(fcr, "FCR"), ghostOf(pl, "PL"), ghostOf(fcu, "FCU"),
    { kind: "belly", node: "FDS", d: fds },
    ...fdsTendons.map((d) => ({ kind: "tendon", node: "FDS", d })),
  ];

  // ------------------------------------------------------------------ deep

  // The medial epicondyle reaches the pinky-side outline (it is under the skin there); the
  // lateral one sits a finger's width inside the thumb-side outline, under the origins of
  // brachioradialis and the radial wrist extensors, which is why the surface layer marks only
  // the medial one.
  const humerus = closed([
    [158, CROP_TOP, C], [205, CROP_TOP, C], [207, 34], [216, 62], [238, 82], [258, 94], [269, 103], [266, 112], [250, 116], [232, 120], [214, 127], [196, 128], [180, 122], [164, 124], [148, 125], [132, 124], [117, 118], [110, 110], [110, 100], [118, 90], [133, 74], [150, 46],
  ]);
  const radius = closed([
    [121, 128], [134, 125], [148, 127], [151, 135], [146, 143], [143, 154], [150, 166], [150, 180], [142, 192], [137, 250], [136, 310], [139, 380], [146, 450], [158, 520], [171, 564], [180, 582], [178, 598], [150, 601], [126, 603], [120, 592], [121, 566], [120, 520], [117, 450], [114, 380], [115, 310], [120, 250], [127, 196], [131, 154], [124, 140],
  ]);
  const ulna = closed([
    [184, 130], [204, 129], [228, 126], [236, 136], [230, 156], [227, 200], [225, 280], [223, 360], [221, 440], [221, 510], [224, 558], [231, 578], [233, 595], [225, 602], [209, 600], [203, 588], [206, 560], [208, 510], [209, 440], [211, 360], [212, 280], [211, 200], [202, 162], [190, 146],
  ]);

  // Brachialis: under the biceps in the upper-arm stub, crossing the elbow to the ulna.
  const brachialis = rowsShape({
    rows: [[CROP_TOP, [133, C], [231, C]], [20, 134, 232], [50, 139, 228], [75, 153, 220], [95, 177, 211]],
    bottom: [[191, 105], [201, 113], [209, 105]],
  });
  const brachialisTendon = tendon([[201, 100], [201, 122], [202, 142]], 10, 8);

  // Supinator: wraps the neck and upper shaft of the radius from the lateral epicondyle.
  const supinator = rowsShape({
    rows: [[128, radialIn(128) + 2, 134], [150, radialIn(150) + 2, 151], [172, radialIn(172) + 2, 156], [194, radialIn(194) + 3, 153], [214, 101, 145]],
    bottom: [[110, 226], [122, 233], [134, 226]],
    top: [[118, 118], [104, 113]],
  });

  // Flexor pollicis longus: from the front of the radius, on the thumb side.
  const fpl = rowsShape({
    rows: [[262, 139, 157], [300, 134.5, 160.5], [340, 133.5, 162], [380, 135.5, 163], [420, 139.5, 163], [460, 145.5, 163], [488, 151, 162.5]],
    bottom: [[158, 508]],
    top: [[150, 238]],
  });
  const fplTendon = tendon([[157.5, 470], [160.5, 530], [162.5, 600], [150, 640], [126, 670], [104, 700], [88, 734], [76, 776]], 7, 6.5);

  // Flexor digitorum profundus: from the front of the ulna, filling the pinky-side two
  // thirds; four tendons to the fingertips.
  const fdp = rowsShape({
    rows: [[165, 202, 252], [200, 185, 264], [250, 173.5, 266.5], [300, 167.5, 263.5], [350, 166.5, 258.5], [400, 167, 252.5], [440, 168, 245], [465, 170, 238]],
    bottom: [[171, 480], [175, 494], [182, 480], [190, 498], [198, 482], [206, 496], [213, 480], [221, 490], [229, 474]],
    top: [[246, 152], [230, 150], [212, 154]],
  });
  const fdpTendons = [
    tendon([[175, 482], [173, 540], [173.5, 600], [158, 656], [134, 712], [124, 776]], 6.5, 6),
    tendon([[190, 486], [189, 540], [188, 600], [176, 656], [160, 712], [157, 776]], 7, 6.5),
    tendon([[206, 484], [204.5, 540], [202, 600], [198, 656], [193, 712], [193, 776]], 7, 6.5),
    tendon([[221, 478], [218, 540], [213.5, 600], [215, 656], [222, 712], [223.5, 776]], 6, 5.5),
  ];

  // Pronator quadratus: the flat quadrilateral across both bones just above the wrist,
  // under the flexor tendons (which are drawn over it).
  const pq = closed([[123, 518, C], [230, 508, C], [231, 540], [233, 570, C], [127, 581, C], [124.5, 550]]);

  const deep = [
    skin,
    { kind: "bone", structure: "humerus", d: humerus },
    { kind: "bone", structure: "radius", d: radius },
    { kind: "bone", structure: "ulna", d: ulna },
    { kind: "belly", node: "Brachialis", d: brachialis },
    { kind: "belly", node: "SUP", d: supinator },
    { kind: "belly", node: "PQ", d: pq },
    { kind: "belly", node: "FDP", d: fdp },
    { kind: "belly", node: "FPL", d: fpl },
    { kind: "tendon", node: "Brachialis", d: brachialisTendon },
    ...fdpTendons.map((d) => ({ kind: "tendon", node: "FDP", d })),
    { kind: "tendon", node: "FPL", d: fplTendon },
  ];

  const words = labels(CANVAS.width, [["Thumb side", "left", 470], ["Pinky side", "right", 470], ["Elbow", "left", 120], ["Wrist", "left", 604]]);

  return { surface: { paths: surface, labels: words }, intermediate: { paths: intermediate, labels: words }, deep: { paths: deep, labels: words } };
}
