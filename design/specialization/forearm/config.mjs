/**
 * The forearm's drawing: what the shared generator (design/specialization/shared/) needs to
 * know about it besides its views. The subject's right forearm from the palm, from behind and
 * from the thumb side (docs/specialization-atlas/08-diagram.md).
 */

export const REGION = "forearm";
export const ASSET_KEY = "forearm_schematic";
export const ASSET_VERSION = 1;

/**
 * 360 × 760 view-box units. Every view shares the same heights: epicondyles at y ≈ 104, elbow
 * crease ≈ 114, wrist crease ≈ 600, knuckles ≈ 712. The upper-arm stub is cropped at the top of
 * the canvas and the fingers at the bottom, so tendons run on toward where they attach.
 */
export const CANVAS = { width: 360, height: 760 };
export const CROP_TOP = -14;
export const CROP_BOTTOM = 776;

/**
 * The views in the order the page offers them, with the words on their buttons and in its
 * captions. The page reads these from the asset; it names no view itself. Every authored view
 * is listed once, and nothing else is.
 */
export const VIEW_ORDER = [
  { id: "palm", label: "Palm" },
  { id: "back", label: "Back" },
  { id: "thumb", label: "Thumb side" },
];

/**
 * No side policy is written: the drawing predates it, and leaving it out keeps the generated
 * file byte for byte as published. It is the subject's right arm, mirrored for the left.
 */
export const SIDES = undefined;

export const LICENSE_NOTE =
  "Original artwork drawn for Sports Genome (2026): a schematic built from hand-placed control points and anatomical landmarks, "
  + "checked against the anatomy references cited in the atlas. Not traced or copied from any illustration, photograph or 3D model, "
  + "and not a dissection image. All rights reserved by Sports Genome.";

/** The words a path that is not a muscle may be named by: skin, bone and the lines drawn on them. */
export const STRUCTURE_WORDS = ["skin", "crease", "epicondyle", "humerus", "radius", "ulna", "olecranon", "membrane", "thumb"];

/** Where the region's members are read from (the short-name table is derived from them). */
export const REGION_DATA = { module: "shared/specialization/regions/forearm/index.ts", export: "forearmRegionData" };

/** The generated module's comments as published on 16 Oct, kept word for word. */
export const MODULE_TEXT = {
  generator: "design/specialization/forearm/emit.mjs",
  command: "node design/specialization/forearm/emit.mjs",
  drawn: "The subject's RIGHT forearm; the renderer mirrors it for the left arm.",
  method: "docs/specialization-atlas/08-diagram.md",
  outcrops: [
    "Deep muscles drawn on a surface layer, and why: each is a partial outcrop where anatomy has the muscle",
    "come to the surface. Every other belly is drawn only on its node's own layer (tested in",
    "client/src/lib/specialization/forearmDiagram.test.ts).",
  ],
};

/**
 * The most of a layer's drawn muscle that may lie under another muscle's tap square (a tap there
 * selects the square's muscle), per view and layer, as measured when the squares were placed
 * (08-diagram.md, "Tap targets"). Before that placement: palm surface 3.2 %, back surface
 * 12.9 % (EPB 45 %), back deep 3.8 %, thumb surface 10.2 % (ECRB 28 %), thumb deep 6.7 %.
 */
export const COVER_BOUNDS = {
  "palm/surface": 0.03,
  "palm/intermediate": 0,
  "palm/deep": 0.01,
  "back/surface": 0.065,
  "back/deep": 0.015,
  "thumb/surface": 0.055,
  "thumb/deep": 0.05,
};
