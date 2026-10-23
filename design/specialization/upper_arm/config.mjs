/**
 * The upper arm's drawing: what the shared generator (design/specialization/shared/) needs to
 * know about it besides its views. The subject's right upper arm from the front and from
 * behind, each in a surface and a deep layer (docs/specialization-atlas/10-multi-region.md §7.2;
 * docs/specialization-atlas/regions/upper_arm/diagram.md).
 */

export const REGION = "upper_arm";
export const ASSET_KEY = "upper_arm_schematic";
export const ASSET_VERSION = 1;

/**
 * 360 × 760 view-box units, at the forearm drawing's scale (about 20 units to the centimetre).
 * Every view shares the same heights: the top of the canvas just below the shoulder joint, the
 * epicondyles at y ≈ 600, the elbow crease ≈ 610, the forearm cropped at the bottom edge. The
 * elbow is the forearm drawing's elbow, 496 units lower (silhouettes.mjs, `ELBOW_DROP`), so the
 * two drawings meet at the same elbow.
 */
export const CANVAS = { width: 360, height: 760 };
export const CROP_TOP = -14;
export const CROP_BOTTOM = 776;

/**
 * The views in the order the page offers them, with the words on their buttons and in its
 * captions (§7.2: Front, surface and deep; Back, surface and deep). The outer side's view was
 * dropped in §7.2: its brachialis outcrop had no deep layer there, and the front shows it.
 */
export const VIEW_ORDER = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
];

/** A paired region: the subject's right arm, mirrored for the left (the page never mirrors it while both arms count as one). */
export const SIDES = "one_side";

export const LICENSE_NOTE =
  "Original artwork drawn for Sports Genome (2026): a schematic built from hand-placed control points and anatomical landmarks, "
  + "checked against the anatomy references cited in the atlas. Not traced or copied from any illustration, photograph or 3D model, "
  + "and not a dissection image. All rights reserved by Sports Genome.";

/**
 * The words a path that is not a muscle may be named by: skin, bone and the lines drawn on them,
 * and the triceps' common tendon, which all three heads share, so no one head owns it (§7.2:
 * shared tendons are drawn as structure).
 */
export const STRUCTURE_WORDS = ["skin", "crease", "epicondyle", "humerus", "radius", "ulna", "olecranon", "triceps-tendon"];

/**
 * The most of a layer's drawn muscle that may lie under another muscle's tap square (a tap there
 * selects the square's muscle), per view and layer, as measured when the squares were placed
 * (23 Oct). Every square sits on its own muscle and spills over skin or gutter, except on the back
 * surface, where the medial head's square, at (123, 540), takes in the tip of the long head where
 * it ends on the common tendon: about 41 square units, 0.06 % of the layer's drawn muscle (the
 * test's sampling reads 0.058 %). Elsewhere under 1 square unit.
 */
export const COVER_BOUNDS = {
  "front/surface": 0,
  "front/deep": 0,
  "back/surface": 0.001,
  "back/deep": 0,
};
