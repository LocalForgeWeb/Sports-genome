/**
 * Posterior figure.
 *
 * Authored for the subject's LEFT side (viewer's left on a back view) and
 * mirrored, so a given limb keeps its anatomical side name across both views.
 *
 * The silhouette is deliberately the anterior outline: same landmarks, same
 * height, same widths. Front and back therefore share scale and vertical
 * alignment by construction rather than by inspection.
 *
 * This view carries the coverage fix. `upperBack` is a canonical catalog key on
 * 56 primary and 39 secondary exercises, and the figure this replaces had no
 * region for it at all — those exercises coloured nothing between the shoulder
 * blades. The interscapular region below is that key's home, which also ends
 * the old collision where `traps` and `rhomboids` both claimed one mid-trap
 * path and `rhomboids` could never win it.
 */
import { silhouette as frontSilhouette } from "./front.mjs";

export const silhouette = frontSilhouette;

export const regions = [
  // ── head and neck ───────────────────────────────────────────
  { id: "cranium_posterior", structural: true, midline: true, tension: 0.95,
    anchors: [[116, 7], [104, 9], [94, 24], [91, 44], [96, 64], [102, 76], [116, 84], [130, 76], [136, 64], [141, 44], [138, 24], [128, 9]] },
  { id: "hair_posterior", structural: true, tension: 0.9,
    anchors: [[116, 3], [102, 6], [93, 20], [91, 44], [98, 48], [103, 28], [110, 18], [116, 16]] },
  { id: "nape", structural: true, midline: true, tension: 0.85,
    anchors: [[102, 74], [99, 92], [98, 106], [116, 110], [134, 106], [133, 92], [130, 74]] },

  // ── shoulder girdle and upper back ──────────────────────────
  { key: "traps", part: "upper", tension: 0.9,
    anchors: [[113, 70], [104, 88], [82, 98], [58, 108], [45, 118], [56, 132], [80, 122], [102, 108], [112, 86]] },
  { key: "upperBack", part: "interscapular", tension: 0.9,
    anchors: [{ x: 114, y: 118, corner: true }, [97, 124], [84, 140], [80, 162], [89, 180], [105, 188], { x: 114, y: 184, corner: true }] },
  { key: "traps", part: "lower", tension: 0.9,
    anchors: [{ x: 114, y: 188, corner: true }, [100, 194], [92, 212], [100, 232], { x: 113, y: 250, corner: true }, [114, 216]] },
  { key: "rearDelts", tension: 1,
    anchors: [[54, 108], [36, 116], [26, 140], [27, 172], [36, 192], [47, 188], [53, 154], [57, 124]] },
  { key: "rotatorCuff", tension: 0.95,
    anchors: [[80, 138], [64, 144], [54, 162], [56, 182], [70, 190], [81, 178], [82, 156]] },

  // ── back ────────────────────────────────────────────────────
  { key: "lats", tension: 0.95,
    anchors: [[86, 168], [60, 176], [50, 200], [54, 230], [66, 254], [82, 266], [100, 268], [110, 258], [108, 232], [98, 204], [91, 182]] },
  { key: "lowerBack", part: "erector_spinae", tension: 0.9,
    anchors: [{ x: 113, y: 240, corner: true }, [99, 248], [93, 266], [95, 288], [106, 298], { x: 114, y: 296, corner: true }] },

  // ── arm ─────────────────────────────────────────────────────
  { key: "triceps", part: "lateral_head", tension: 1,
    anchors: [[49, 178], [32, 208], [24, 240], [28, 262], [42, 262], [48, 228], [53, 196]] },
  { key: "triceps", part: "long_head", tension: 1,
    anchors: [[61, 180], [48, 208], [43, 238], [45, 262], [57, 260], [62, 226], [64, 198]] },
  { key: "forearms", part: "extensors", tension: 1,
    anchors: [[50, 248], [38, 272], [30, 302], [24, 336], [38, 340], [44, 302], [47, 272]] },
  { key: "forearms", part: "ulnar", tension: 1,
    anchors: [[34, 248], [18, 270], [11, 302], [8, 334], [23, 340], [29, 302], [32, 270]] },
  { id: "hand_posterior", structural: true, tension: 0.85,
    anchors: [[11, 330], [9, 350], [13, 366], [22, 372], [32, 360], [36, 338], [32, 324], [18, 322]] },

  { key: "obliques", tension: 0.95,
    anchors: [[80, 250], [66, 260], [62, 280], [68, 298], [80, 302], [90, 294], [92, 274], [88, 256]] },

  // ── hip ─────────────────────────────────────────────────────
  { key: "abductors", tension: 1,
    anchors: [[82, 292], [68, 298], [62, 314], [64, 330], [77, 324], [85, 306]] },
  { key: "glutes", tension: 1,
    anchors: [[114, 296], [96, 298], [78, 306], [67, 324], [64, 348], [72, 366], [90, 374], [108, 368], [114, 356]] },

  // ── thigh ───────────────────────────────────────────────────
  { key: "adductors", part: "magnus", tension: 1,
    anchors: [[114, 326], [104, 342], [99, 368], [99, 396], [106, 406], [112, 382], [115, 348]] },
  { key: "hamstrings", part: "biceps_femoris", tension: 1,
    anchors: [[74, 368], [63, 390], [58, 416], [60, 438], [72, 448], [82, 426], [84, 396], [82, 374]] },
  { key: "hamstrings", part: "semimembranosus", tension: 1,
    anchors: [[94, 370], [84, 392], [82, 420], [87, 444], [98, 446], [104, 418], [106, 390], [104, 372]] },
  { id: "knee_posterior", structural: true, tension: 0.9,
    anchors: [[68, 440], [63, 452], [65, 468], [78, 474], [95, 472], [104, 460], [104, 446], [86, 436]] },

  // ── lower leg ───────────────────────────────────────────────
  { key: "peroneals", tension: 1,
    anchors: [[64, 480], [56, 498], [56, 518], [64, 524], [68, 502], [68, 484]] },
  { key: "calves", part: "gastrocnemius_lateral", tension: 1,
    anchors: [[72, 466], [62, 486], [61, 510], [70, 520], [81, 508], [83, 482]] },
  { key: "calves", part: "gastrocnemius_medial", tension: 1,
    anchors: [[92, 466], [103, 484], [105, 510], [97, 522], [86, 512], [84, 484]] },
  { key: "soleus", tension: 0.9,
    anchors: [[68, 502], [64, 518], [72, 532], [98, 532], [104, 518], [99, 502], [84, 508]] },
  { key: "feet", part: "plantar", tension: 0.8,
    anchors: [[80, 522], [72, 538], [70, 550], [78, 556], [104, 556], [108, 546], [104, 530], [93, 518]] },
];
