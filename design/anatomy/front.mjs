/**
 * Anterior figure.
 *
 * Authored for the subject's RIGHT side (viewer's left on a front view) and
 * mirrored. `key` is the canonical Sports Genome catalog muscle key — the same
 * vocabulary the 400-exercise catalog and `catalogMuscleRegionIds` use. `part`
 * is a visual subdivision only: several paths may share one key, and no part
 * ever becomes an identifier the data model has to know about.
 *
 * `structural: true` marks body that is not a selectable muscle — head, hands,
 * feet, joints.
 *
 * Muscles are drawn generously and clipped to the silhouette at build time.
 * Authoring each one to stop exactly at the body edge is what produced the
 * floating-plate look in the figure this replaces; letting the outline do the
 * trimming means adjacent muscles share a border and the body reads as tissue.
 */

// Eight-head athletic canon. Every region hangs off these, so proportions stay
// coherent instead of drifting muscle by muscle.
export const LANDMARKS = {
  crown: 6, chin: 76, acromion: 112, nipple: 158, ribBottom: 232,
  waist: 254, navel: 258, iliacCrest: 284, crotch: 316,
  elbow: 248, wrist: 316, fingertip: 372,
  knee: 440, ankle: 524, sole: 556,
};

/** Left half, crown to crotch; the right half is mirrored at build time. */
export const silhouette = [
  [116, 7], [104, 9], [94, 24], [91, 44], [96, 62], [102, 73], [100, 86], [98, 100],
  [80, 104], [58, 110],
  [40, 116], [28, 134], [24, 156], [26, 182],
  [24, 206], [22, 236], [21, 252], [17, 280], [14, 308], [13, 330],
  [13, 356], [21, 370], [32, 360], [36, 330],
  [40, 306], [44, 278], [48, 250], [54, 218], [60, 186],
  [56, 208], [59, 236], [76, 262], [70, 286], [64, 306],
  [62, 326], [64, 358], [68, 400], [70, 434],
  [68, 458], [64, 486], [71, 512], [78, 524],
  [74, 542], [76, 554], [104, 556], [106, 538], [100, 524],
  [103, 498], [107, 470], [105, 442], [107, 412], [110, 362], [113, 330], [116, 316],
];

export const regions = [
  // ── head and neck ───────────────────────────────────────────
  { id: "cranium", structural: true, midline: true, tension: 0.95,
    anchors: [[116, 7], [104, 9], [94, 24], [91, 44], [96, 62], [102, 73], [116, 79], [130, 73], [136, 62], [141, 44], [138, 24], [128, 9]] },
  { id: "hair", structural: true, tension: 0.9,
    anchors: [[116, 3], [103, 6], [95, 16], [91, 34], [96, 37], [100, 24], [108, 17], [116, 15]] },
  { id: "neck", structural: true, midline: true, tension: 0.85,
    anchors: [[102, 72], [99, 90], [98, 104], [116, 108], [134, 104], [133, 90], [130, 72]] },

  // ── shoulder girdle ─────────────────────────────────────────
  { key: "traps", part: "upper", tension: 0.9,
    anchors: [[103, 78], [99, 96], [80, 100], [58, 108], [46, 118], [55, 128], [78, 116], [100, 108], [108, 94]] },
  { key: "sideDelts", tension: 1,
    anchors: [[48, 108], [32, 116], [25, 140], [26, 172], [35, 192], [46, 188], [47, 154], [49, 124]] },
  { key: "frontDelts", tension: 1,
    anchors: [[66, 108], [50, 114], [43, 138], [43, 170], [51, 192], [63, 196], [67, 170], [68, 136]] },

  // ── chest ───────────────────────────────────────────────────
  { key: "chest", part: "clavicular", tension: 0.9,
    anchors: [[112, 104], [86, 110], [65, 120], [53, 134], [53, 150], [70, 148], [90, 136], [111, 122]] },
  { key: "chest", part: "sternal", tension: 0.9,
    anchors: [{ x: 112, y: 132, corner: true }, { x: 112, y: 204, corner: true }, [96, 210], [78, 204], [64, 188], [54, 164], [54, 148], [72, 148], [94, 142], [110, 136]] },

  // ── arm ─────────────────────────────────────────────────────
  { key: "biceps", tension: 1,
    anchors: [[61, 178], [43, 190], [31, 220], [27, 252], [43, 260], [53, 226], [59, 198]] },
  { key: "brachialis", tension: 1,
    anchors: [[33, 212], [23, 238], [21, 258], [34, 262], [39, 234]] },
  { key: "brachioradialis", tension: 1,
    anchors: [[34, 248], [18, 270], [11, 302], [8, 334], [23, 340], [29, 302], [32, 270]] },
  { key: "forearms", part: "flexors", tension: 1,
    anchors: [[50, 248], [38, 272], [30, 302], [24, 336], [38, 340], [44, 302], [47, 272]] },
  { id: "hand", structural: true, tension: 0.85,
    anchors: [[11, 330], [9, 350], [13, 366], [22, 372], [32, 360], [36, 338], [32, 324], [18, 322]] },

  // ── trunk ───────────────────────────────────────────────────
  { key: "serratusAnterior", tension: 0.8,
    anchors: [[66, 184], [56, 192], [55, 212], [60, 234], [68, 244], [76, 236], [76, 214], [73, 196]] },
  { key: "obliques", tension: 0.95,
    anchors: [[76, 206], [60, 224], [58, 252], [66, 278], [78, 296], [90, 300], [93, 280], [88, 252], [84, 226]] },
  { key: "abs", part: "upper", tension: 0.85,
    anchors: [{ x: 113, y: 198, corner: true }, { x: 113, y: 228, corner: true }, [91, 228], [87, 212], [88, 200], [100, 196]] },
  { key: "abs", part: "mid", tension: 0.85,
    anchors: [{ x: 113, y: 232, corner: true }, { x: 113, y: 262, corner: true }, [91, 262], [88, 246], [88, 232]] },
  { key: "abs", part: "lower", tension: 0.85,
    anchors: [{ x: 113, y: 266, corner: true }, { x: 113, y: 310, corner: true }, [95, 306], [89, 288], [89, 268]] },

  // ── hip ─────────────────────────────────────────────────────
  { key: "hipFlexors", tension: 0.95,
    anchors: [[88, 284], [76, 290], [66, 302], [72, 318], [90, 320], [100, 306], [98, 290]] },
  { key: "tfl", tension: 1,
    anchors: [[70, 286], [58, 294], [55, 312], [60, 328], [70, 324], [74, 304]] },

  // ── thigh ───────────────────────────────────────────────────
  { key: "adductors", tension: 1,
    anchors: [[115, 317], [106, 324], [99, 342], [96, 368], [98, 394], [106, 401], [111, 376], [114, 348]] },
  { key: "quads", part: "vastus_lateralis", tension: 1,
    anchors: [[86, 322], [68, 332], [59, 362], [58, 398], [63, 426], [74, 438], [86, 428], [88, 388], [88, 348]] },
  { key: "quads", part: "rectus_femoris", tension: 1,
    anchors: [[100, 326], [87, 342], [84, 380], [84, 416], [89, 438], [100, 440], [103, 412], [103, 368], [103, 340]] },
  { key: "quads", part: "vastus_medialis", tension: 1,
    anchors: [[106, 368], [100, 392], [100, 420], [106, 440], [112, 436], [114, 404], [112, 378]] },
  { id: "knee", structural: true, tension: 0.9,
    anchors: [[72, 440], [67, 452], [69, 466], [82, 472], [96, 470], [104, 458], [104, 444], [88, 436]] },

  // ── lower leg ───────────────────────────────────────────────
  { key: "peroneals", tension: 1,
    anchors: [[76, 476], [66, 492], [64, 514], [72, 526], [80, 514], [80, 492]] },
  { key: "tibialis", tension: 1,
    anchors: [[88, 470], [80, 486], [76, 508], [80, 526], [88, 524], [92, 500], [92, 480]] },
  { key: "calves", part: "gastrocnemius_medial", tension: 1,
    anchors: [[96, 470], [105, 486], [107, 510], [100, 524], [93, 518], [92, 492]] },
  { key: "feet", part: "dorsum", tension: 0.8,
    anchors: [[80, 522], [72, 538], [70, 550], [78, 556], [104, 556], [108, 546], [104, 530], [93, 518]] },
];
