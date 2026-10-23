import type { DiagramPlates } from "@shared/specialization/types";
import type { PlatePixels } from "../plates";

/**
 * A made-up region's plates, for the plate renderer's tests: two views (Front, Rear), each at
 * surface and deep, on a 40 × 10 frame. Muscle A is on both surfaces, C on both deep passes, B,
 * D and E on one pass each. Nothing here is a real region.
 */
export const fxPlates: DiagramPlates = {
  key: "fx_plates",
  version: 1,
  regionId: "fx_limb",
  frame: { width: 40, height: 10 },
  viewOrder: [{ id: "front", label: "Front" }, { id: "rear", label: "Rear" }],
  passes: [
    { id: "front-surface", view: "front", layer: "surface", image: "fx/front-surface.webp", labels: "fx/front-surface.labels.png", nodeIds: ["fx.a", "fx.b"] },
    { id: "front-deep", view: "front", layer: "deep", image: "fx/front-deep.webp", labels: "fx/front-deep.labels.png", nodeIds: ["fx.c"] },
    { id: "rear-surface", view: "rear", layer: "surface", image: "fx/rear-surface.webp", labels: "fx/rear-surface.labels.png", nodeIds: ["fx.a", "fx.d"] },
    { id: "rear-deep", view: "rear", layer: "deep", image: "fx/rear-deep.webp", labels: "fx/rear-deep.labels.png", nodeIds: ["fx.c", "fx.e"] },
  ],
  credit: ["Rendered from ", { text: "a test model", href: "https://example.org/model" }, " (CC BY-SA 4.0); adapted renders."],
  drawingStatement: "The test drawing is adapted from renders.",
};

/**
 * A pass's pixels: label 1 in columns 2–5, label 2 in columns 30–33 (when the pass has two
 * muscles), on every row; the plate a shaded red where labelled and a pale grey elsewhere.
 */
export function fxPixels(muscles = 2): PlatePixels {
  const { width, height } = fxPlates.frame;
  const plate = new Uint8ClampedArray(width * height * 4);
  const labels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const label = x >= 2 && x <= 5 ? 1 : x >= 30 && x <= 33 && muscles > 1 ? 2 : 0;
      labels[index] = label;
      const light = 0.8 + 0.4 * (x % 2);
      plate.set(label ? [Math.round(170 * light), Math.round(80 * light), Math.round(70 * light), 255] : [205, 212, 215, 255], index * 4);
    }
  }
  return { width, height, plate, labels };
}
