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
  [82, 106], [60, 112], [40, 120], [29, 140], [24, 166], [21, 196],
  [19, 226], [18, 250], [15, 278], [12, 306], [10, 330],
  [13, 356], [21, 370], [32, 360], [36, 330],
  [40, 306], [44, 278], [48, 250], [54, 218], [60, 188],
  [57, 210], [58, 234], [70, 258], [66, 282], [58, 302],
  [58, 322], [62, 356], [67, 400], [70, 434],
  [68, 458], [65, 486], [72, 512], [78, 524],
  [74, 542], [76, 554], [104, 556], [106, 538], [100, 524],
  [103, 498], [107, 470], [105, 442], [107, 412], [110, 362], [113, 330], [116, 316],
];

export const regions = [
  // ── head and neck ───────────────────────────────────────────
  { id: "cranium", structural: true, midline: true, tension: 0.95,
    anchors: [[116, 7], [104, 9], [94, 24], [91, 44], [96, 62], [102, 73], [116, 79], [130, 73], [136, 62], [141, 44], [138, 24], [128, 9]] },
  { id: "neck", structural: true, midline: true, tension: 0.85,
    anchors: [[102, 72], [99, 90], [98, 104], [116, 108], [134, 104], [133, 90], [130, 72]] },

  // ── shoulder girdle ─────────────────────────────────────────
  { key: "traps", part: "upper", tension: 0.9,
    anchors: [[103, 78], [99, 96], [82, 102], [60, 110], [47, 120], [56, 130], [80, 118], [101, 110], [108, 94]] },
  { key: "sideDelts", tension: 1,
    anchors: [[48, 112], [32, 122], [22, 150], [20, 182], [28, 198], [40, 194], [42, 158], [46, 128]] },
  { key: "frontDelts", tension: 1,
    anchors: [[66, 112], [50, 118], [41, 140], [40, 168], [47, 194], [60, 198], [66, 176], [68, 140]] },

  // ── chest ───────────────────────────────────────────────────
  { key: "chest", part: "clavicular", tension: 0.9,
    anchors: [[112, 104], [86, 110], [65, 120], [53, 134], [53, 150], [70, 148], [90, 136], [111, 122]] },
  { key: "chest", part: "sternal", tension: 0.9,
    anchors: [{ x: 112, y: 132, corner: true }, { x: 112, y: 204, corner: true }, [96, 210], [78, 204], [64, 188], [54, 164], [54, 148], [72, 148], [94, 142], [110, 136]] },

  // ── arm ─────────────────────────────────────────────────────
  { key: "biceps", tension: 1,
    anchors: [[60, 176], [41, 188], [28, 220], [24, 254], [42, 262], [52, 228], [58, 196]] },
  { key: "brachialis", tension: 1,
    anchors: [[32, 210], [21, 238], [19, 260], [33, 264], [38, 232]] },
  { key: "brachioradialis", tension: 1,
    anchors: [[35, 246], [18, 268], [9, 300], [5, 334], [22, 340], [28, 300], [33, 268]] },
  { key: "forearms", part: "flexors", tension: 1,
    anchors: [[51, 248], [39, 272], [29, 302], [23, 334], [37, 340], [43, 302], [48, 272]] },
  { id: "hand", structural: true, tension: 0.85,
    anchors: [[11, 330], [9, 350], [13, 366], [22, 372], [32, 360], [36, 338], [32, 324], [18, 322]] },

  // ── trunk ───────────────────────────────────────────────────
  { key: "serratusAnterior", tension: 0.8,
    anchors: [[66, 186], [56, 194], [54, 212], [58, 232], [66, 244], [74, 238], [74, 218], [72, 200]] },
  { key: "obliques", tension: 0.95,
    anchors: [[74, 206], [62, 222], [56, 246], [60, 272], [72, 292], [86, 298], [90, 280], [86, 254], [82, 228]] },
  { key: "abs", part: "upper", tension: 0.6,
    anchors: [{ x: 113, y: 198, corner: true }, { x: 113, y: 228, corner: true }, [91, 228], [87, 212], [88, 200], [100, 196]] },
  { key: "abs", part: "mid", tension: 0.6,
    anchors: [{ x: 113, y: 232, corner: true }, { x: 113, y: 262, corner: true }, [91, 262], [88, 246], [88, 232]] },
  { key: "abs", part: "lower", tension: 0.6,
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
