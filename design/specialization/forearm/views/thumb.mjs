/**
 * THUMB-SIDE view: the radial aspect of the subject's RIGHT forearm, the thumb side facing
 * the viewer. Walking round the thumb side from the palm view to the back view, the BACK of
 * the forearm is on the viewer's LEFT and the PALM side on the viewer's RIGHT; the elbow is
 * at the top with its point (olecranon) at the back-left, the lateral epicondyle in the
 * middle. The hand is seen edge-on, the thumb nearest the viewer.
 *
 * Two layers:
 * - surface: brachioradialis down the middle of the upper two thirds (it is this view's
 *   contour), extensor carpi radialis longus and brevis behind it toward the back-side edge,
 *   the edge of extensor digitorum and the anconeus at the back of the elbow, the edge of
 *   flexor carpi radialis on the palm-side edge, the end of the biceps in the upper-arm
 *   stub; abductor pollicis longus and extensor pollicis brevis coming to the surface and
 *   crossing to the thumb (partial outcrops), and the extensor pollicis longus tendon.
 * - deep: supinator round the upper radius, flexor pollicis longus on the palm-side edge,
 *   abductor pollicis longus, extensor pollicis brevis and the edge of extensor pollicis
 *   longus crossing to the thumb, brachialis in the stub; humerus, radius and the point of
 *   the ulna as bone; the radial muscles as ghosts.
 */
import { band, closed, open, rowsShape, tendon } from "../geometry.mjs";
import { CROP_TOP, thumbEdge, thumbSilhouette } from "../silhouettes.mjs";

const C = "corner";
const INSET = 3;
const backIn = (y) => thumbEdge("back", y) + INSET;
const palmIn = (y) => thumbEdge("palm", y) - INSET;

export function thumbView() {
  const skin = { kind: "skin", structure: "skin", d: closed(thumbSilhouette()) };

  // ------------------------------------------------------------------ surface

  const br = rowsShape({
    rows: [[CROP_TOP, [178, C], [204, C]], [30, 180, 207], [70, 182, 212], [110, 186, 226], [150, 190, 235], [190, 190.5, palmIn(190)], [230, 191, palmIn(230)], [270, 192, 238], [310, 194, 230], [350, 196, 222], [390, 197, 214], [420, 198, 208]],
    bottom: [[203.5, 440]],
  });
  const brTendon = tendon([[204, 422], [200, 480], [196.5, 540], [193.5, 592]], 7.5, 6.5);
  const ecrl = rowsShape({
    rows: [[80, 160, 176], [110, 160, 182], [150, 156, 186], [200, 157.5, 186.5], [250, 160.5, 187.5], [300, 163.5, 189], [340, 166, 186]],
    bottom: [[175, 362]],
    top: [[168, 54]],
  });
  const ecrlTendon = tendon([[175, 346], [170, 420], [163, 490], [157, 560], [154, 615]], 7, 6);
  const ecrb = rowsShape({
    rows: [[150, 140, 152.5], [200, 134.5, 154], [250, 134, 157], [300, 135, 160], [350, 137, 162.5], [375, 138, 160]],
    bottom: [[146, 394]],
    top: [[156, 114]],
  });
  const ecrbTendon = tendon([[147, 380], [146, 440], [146, 500], [148, 560], [150, 612]], 7, 6);
  // The edge of extensor digitorum, on the back-side edge.
  const ed = rowsShape({
    rows: [[225, backIn(225), 129.5], [260, backIn(260), 130.5], [295, backIn(295), 132], [330, backIn(330), 133.5]],
    bottom: [[133, 352]],
    top: [[125, 202]],
  });
  const anconeus = closed([[148, 112, C], [112, 120, C], [115, 160], [119, 190, C], [132, 150]]);
  // The edge of flexor carpi radialis on the palm-side edge.
  const fcr = rowsShape({
    rows: [[280, 241.5, palmIn(280)], [320, 233.5, palmIn(320)], [360, 226, palmIn(360)], [400, 222, 234], [430, 221, 229.5]],
    bottom: [[225, 450]],
    top: [[245, 256]],
  });
  const fcrTendon = tendon([[225, 436], [222, 500], [219.5, 560], [218, 600]], 7, 6);
  const biceps = rowsShape({
    rows: [[CROP_TOP, [212, C], [palmIn(CROP_TOP), C]], [20, 212.5, palmIn(20)], [50, 214.5, palmIn(50)], [75, 220, palmIn(75)]],
    bottom: [[226, 92]],
  });
  const bicepsTendon = tendon([[228, 80], [230, 104], [230.5, 124]], 8, 6);

  // Abductor pollicis longus and extensor pollicis brevis where they come to the surface:
  // from the back side, crossing the radial wrist extensor tendons toward the thumb.
  const aplOutcrop = band([[152, 408], [164, 450], [177, 495], [190, 540]], [[0, 6], [0.3, 7.5], [0.75, 6.5], [1, 0]]);
  const epbOutcrop = band([[144, 440], [153, 480], [164, 520], [176, 560]], [[0, 4.5], [0.35, 5.5], [0.8, 4.5], [1, 0]]);
  const aplTendon = tendon([[188, 528], [195, 570], [202, 600], [208, 624]], 7, 6.5);
  const epbTendon = tendon([[173, 548], [184, 585], [197, 615], [212, 650], [226, 690], [237, 730], [243, 776]], 5.5, 5);
  const eplTendon = tendon([[146, 556], [155, 590], [168, 620], [190, 655], [208, 690], [222, 730], [230, 776]], 5, 4.5);

  const surface = [
    skin,
    { kind: "outline", structure: "crease", d: open([[226, 112], [232, 120]]) },
    { kind: "outline", structure: "thumb", d: open([[198, 632], [204, 660], [205, 688], [196, 708]]) },
    { kind: "bone", structure: "olecranon", d: closed([[109, 100], [118, 94], [126, 102], [124, 116], [114, 120], [108, 112]]) },
    { kind: "belly", node: "BR", d: br },
    { kind: "belly", node: "ECRL", d: ecrl },
    { kind: "belly", node: "ECRB", d: ecrb },
    { kind: "belly", node: "ED", d: ed },
    { kind: "belly", node: "ANC", d: anconeus },
    { kind: "belly", node: "FCR", d: fcr },
    { kind: "belly", node: "Biceps", d: biceps },
    { kind: "tendon", node: "Biceps", d: bicepsTendon },
    { kind: "tendon", node: "ECRL", d: ecrlTendon },
    { kind: "tendon", node: "ECRB", d: ecrbTendon },
    { kind: "tendon", node: "FCR", d: fcrTendon },
    { kind: "tendon", node: "BR", d: brTendon },
    { kind: "belly", node: "APL", d: aplOutcrop, outcrop: "Seen from the thumb side, it comes to the surface on the back of the lower forearm and crosses the radial wrist extensor tendons and the end of brachioradialis toward the thumb; the rest of the muscle is deep." },
    { kind: "belly", node: "EPB", d: epbOutcrop, outcrop: "Seen from the thumb side, it comes to the surface beside abductor pollicis longus and crosses toward the thumb; the rest of the muscle is deep." },
    { kind: "tendon", node: "APL", d: aplTendon },
    { kind: "tendon", node: "EPB", d: epbTendon },
    { kind: "tendon", node: "EPL", d: eplTendon },
  ];

  // ------------------------------------------------------------------ deep

  const humerus = closed([[146, CROP_TOP, C], [206, CROP_TOP, C], [208, 30], [214, 70], [220, 100], [208, 116], [188, 118], [170, 114], [152, 110], [134, 102], [124, 88], [132, 64], [142, 30]]);
  const ulnaPoint = closed([[108, 96], [124, 90], [136, 100], [140, 124], [136, 160], [130, 200], [124, 160], [116, 128]]);
  const radius = closed([[160, 122], [178, 118], [196, 122], [198, 136], [190, 146], [190, 200], [192, 280], [194, 360], [196, 440], [202, 520], [212, 572], [214, 592], [200, 600], [176, 600], [164, 592], [166, 560], [172, 520], [176, 440], [176, 360], [174, 280], [170, 200], [168, 146], [160, 136]]);

  const brachialis = rowsShape({
    rows: [[CROP_TOP, [150, C], [218, C]], [30, 152, 222], [60, 158, 222], [90, 172, 218]],
    bottom: [[182, 104], [194, 112], [205, 104]],
  });
  const supinator = rowsShape({
    rows: [[125, 148, 196], [150, 142, 206], [175, 144, 210], [200, 152, 208], [225, 164, 202]],
    bottom: [[178, 248]],
    top: [[188, 116], [160, 116]],
  });
  const fpl = rowsShape({
    rows: [[260, 226, 242], [300, 221, palmIn(300) - 1], [340, 217, palmIn(340) - 1], [380, 214, 234], [420, 211, 230], [460, 210, 225], [490, 210, 220]],
    bottom: [[212, 510]],
    top: [[236, 240]],
  });
  const apl = band([[146, 300], [154, 360], [166, 420], [180, 475], [194, 525]], [[0, 0], [0.15, 7], [0.5, 11], [0.85, 7], [1, 0]]);
  const epb = band([[148, 428], [153, 462], [161, 500], [172, 536], [184, 562]], [[0, 0], [0.2, 6.5], [0.55, 8.5], [0.85, 6], [1, 0]]);
  const epl = band([[136, 318], [139, 352], [141, 384], [143, 410]], [[0, 0], [0.25, 4.5], [0.6, 5], [1, 0]]);
  const deepTendons = [
    { node: "FPL", d: tendon([[212, 495], [214, 560], [217, 600], [225, 640], [234, 690], [243, 740], [248, 776]], 6.5, 6) },
    { node: "APL", d: tendon([[192, 515], [198, 560], [204, 600], [208, 622]], 7, 6.5) },
    { node: "EPB", d: tendon([[182, 550], [190, 580], [199, 610], [213, 650], [227, 690], [238, 730], [244, 776]], 5.5, 5) },
    { node: "EPL", d: tendon([[143, 398], [147, 480], [151, 530], [154, 575], [166, 610], [190, 652], [208, 690], [222, 730], [230, 776]], 5, 4.5) },
    { node: "Brachialis", d: tendon([[206, 100], [213, 120], [216, 136]], 9, 8) },
  ];

  const ghostOf = (d, short) => ({ kind: "ghost", node: short, d });
  const deep = [
    skin,
    { kind: "bone", structure: "humerus", d: humerus },
    { kind: "bone", structure: "ulna", d: ulnaPoint },
    { kind: "bone", structure: "radius", d: radius },
    ghostOf(br, "BR"), ghostOf(ecrl, "ECRL"), ghostOf(ecrb, "ECRB"),
    { kind: "belly", node: "Brachialis", d: brachialis },
    { kind: "belly", node: "SUP", d: supinator },
    { kind: "belly", node: "FPL", d: fpl },
    { kind: "belly", node: "APL", d: apl },
    { kind: "belly", node: "EPB", d: epb },
    { kind: "belly", node: "EPL", d: epl },
    ...deepTendons.map(({ node, d }) => ({ kind: "tendon", node, d })),
  ];

  const labels = [
    { text: "Back side", x: 10, y: 470, anchor: "start" },
    { text: "Palm side", x: 350, y: 470, anchor: "end" },
    { text: "Elbow", x: 10, y: 120, anchor: "start" },
    { text: "Wrist", x: 10, y: 604, anchor: "start" },
  ];

  return { surface: { paths: surface, labels }, deep: { paths: deep, labels } };
}
