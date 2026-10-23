import { describe, expect, it } from "vitest";
import { fxPixels, fxPlates } from "./__fixtures__/plates";
import { compositePlate, cssColourToRgb, decodeLabels, distanceTo, labelAt, paintFor, PLATE_FALLBACK_COLOURS, PLATE_SUPERSAMPLE, passesShowing, passToShow, plateFor, plateLayers, plateViews, SELECTION_RINGS } from "./plates";

/** The plate renderer's arithmetic (plates.ts), on a made-up region's plates: no canvas needed. */

describe("which pass shows what", () => {
  it("lists the views that have a pass, in the plates' order and words, and each view's layers surface first", () => {
    expect(plateViews(fxPlates)).toEqual([{ id: "front", label: "Front" }, { id: "rear", label: "Rear" }]);
    expect(plateLayers(fxPlates, "front")).toEqual(["surface", "deep"]);
    expect(plateLayers(fxPlates, "side")).toEqual([]);
    expect(plateFor(fxPlates, "rear", "deep")?.id).toBe("rear-deep");
    expect(plateFor(fxPlates, "rear", "intermediate")).toBeNull();
  });

  it("finds every pass that shows a muscle, in view order, surface first", () => {
    expect(passesShowing(fxPlates, "fx.a").map((pass) => pass.id)).toEqual(["front-surface", "rear-surface"]);
    expect(passesShowing(fxPlates, "fx.c").map((pass) => pass.id)).toEqual(["front-deep", "rear-deep"]);
    expect(passesShowing(fxPlates, "fx.nowhere")).toEqual([]);
  });

  it("moves a deep muscle chosen on a surface pass to the deep layer of the same view, and stays put when the pass shows it", () => {
    expect(passToShow(fxPlates, "fx.c", "front", "surface")?.id).toBe("front-deep");
    expect(passToShow(fxPlates, "fx.c", "rear", "surface")?.id).toBe("rear-deep");
    expect(passToShow(fxPlates, "fx.e", "front", "surface")?.id).toBe("rear-deep");
    expect(passToShow(fxPlates, "fx.a", "front", "surface")).toBeNull();
    expect(passToShow(fxPlates, "fx.nowhere", "front", "surface")).toBeNull();
  });
});

describe("the label image read back", () => {
  it("takes the muscle index from the red channel, and reads a value past the pass's muscles as none", () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 255, 1, 1, 1, 255, 2, 9, 9, 255, 3, 3, 3, 255, 200, 200, 200, 255, 2, 2, 2, 0]);
    expect(Array.from(decodeLabels(rgba, 3, 2, 2))).toEqual([0, 1, 2, 0, 0, 2]);
  });

  it("reads computed CSS colours as the canvas needs them", () => {
    expect(cssColourToRgb("#b0a088")).toEqual([176, 160, 136]);
    expect(cssColourToRgb(" rgb(52, 70, 90)")).toEqual([52, 70, 90]);
    expect(cssColourToRgb("")).toBeNull();
    expect(cssColourToRgb("var(--x)")).toBeNull();
  });
});

describe("a tap's muscle", () => {
  const { width, height, labels } = fxPixels();
  it("is the muscle under the finger", () => {
    expect(labelAt(labels, width, height, 3.5, 4.5, 6)).toBe(1);
    expect(labelAt(labels, width, height, 31.2, 0.1, 0)).toBe(2);
  });

  it("is the nearest muscle within reach when the tap lands beside one, and none beyond it", () => {
    expect(labelAt(labels, width, height, 9.5, 4.5, 6)).toBe(1);
    expect(labelAt(labels, width, height, 26.5, 4.5, 6)).toBe(2);
    expect(labelAt(labels, width, height, 9.5, 4.5, 3)).toBe(0);
    expect(labelAt(labels, width, height, 17.5, 4.5, 6)).toBe(0);
    // Outside the image, within reach of its edge.
    expect(labelAt(labels, width, height, 3.5, -2, 6)).toBe(1);
  });

  it("goes to the nearer of two muscles", () => {
    const two = new Uint8Array(10);
    two[1] = 1;
    two[6] = 2;
    expect(labelAt(two, 10, 1, 3.5, 0.5, 5)).toBe(1);
    expect(labelAt(two, 10, 1, 4.5, 0.5, 5)).toBe(2);
  });
});

describe("the paint", () => {
  const colours = PLATE_FALLBACK_COLOURS;
  it("is the page's own fill: the ramp's step, zero's resting tone with its edge, the hatch, the resting tone", () => {
    expect(paintFor({ kind: "bin", step: 3 }, colours)).toEqual({ kind: "solid", colour: colours.exposure[2] });
    expect(paintFor({ kind: "bin", step: 9 }, colours)).toEqual({ kind: "solid", colour: colours.exposure[4] });
    expect(paintFor({ kind: "zero" }, colours)).toEqual({ kind: "zero", colour: colours.neutral, edge: colours.zeroEdge });
    expect(paintFor({ kind: "hatch" }, colours)).toEqual({ kind: "hatch", colour: colours.hatch, stripe: colours.hatchStripe });
    expect(paintFor({ kind: "none" }, colours)).toEqual({ kind: "solid", colour: colours.neutral });
  });

  const pixels = fxPixels();
  const outWidth = pixels.width * PLATE_SUPERSAMPLE;
  const at = (out: Uint8ClampedArray, x: number, y: number) => Array.from(out.slice((y * outWidth + x) * 4, (y * outWidth + x) * 4 + 4));
  /** The mean colour of a muscle's output pixels well inside it (columns 3–4 of label 1, all rows). */
  const insideMean = (out: Uint8ClampedArray) => {
    const sum = [0, 0, 0];
    let count = 0;
    for (let y = 0; y < pixels.height * PLATE_SUPERSAMPLE; y++) for (let x = 3 * PLATE_SUPERSAMPLE + 1; x < 5 * PLATE_SUPERSAMPLE; x++) { const [r, g, b] = at(out, x, y); sum[0] += r; sum[1] += g; sum[2] += b; count++; }
    return sum.map((value) => value / count);
  };

  it("paints a muscle in its step of the ramp, the plate's shading kept round it, and bone off the ramp", () => {
    const out = compositePlate(pixels, [paintFor({ kind: "bin", step: 3 }, colours), paintFor({ kind: "bin", step: 5 }, colours)], 0, colours);
    expect(out.length).toBe(outWidth * pixels.height * PLATE_SUPERSAMPLE * 4);
    const mean = insideMean(out);
    colours.exposure[2].forEach((channel, index) => expect(Math.abs(mean[index] - channel), `channel ${index}`).toBeLessThan(10));
    // The shading is kept: light and dark columns of the plate differ, by less than a step of the ramp (about 27 levels).
    const [light] = at(out, 3 * PLATE_SUPERSAMPLE + 1, 8);
    const [dark] = at(out, 4 * PLATE_SUPERSAMPLE + 1, 8);
    expect(Math.abs(light - dark)).toBeGreaterThan(3);
    expect(Math.abs(light - dark)).toBeLessThan(40);
    // Bone: a cool tone, blue above red, never a warm step of the ramp.
    const [r, , b, a] = at(out, 15 * PLATE_SUPERSAMPLE, 8);
    expect(b).toBeGreaterThan(r);
    expect(a).toBe(255);
  });

  it("hatches a muscle whose mapping is not reviewed with the key's two colours", () => {
    const out = compositePlate(pixels, [paintFor({ kind: "hatch" }, colours), null], 0, colours);
    const seen = new Set<string>();
    for (let y = 0; y < pixels.height * PLATE_SUPERSAMPLE; y++) for (let x = 3 * PLATE_SUPERSAMPLE + 1; x < 5 * PLATE_SUPERSAMPLE; x++) { const [r, g, b] = at(out, x, y); seen.add(r > 70 ? "stripe" : "ground"); expect(b).toBeGreaterThanOrEqual(r); expect(g).toBeGreaterThanOrEqual(0); }
    expect(seen).toEqual(new Set(["stripe", "ground"]));
  });

  it("outlines the selected muscle outside its edge, in gold between dark keylines, and leaves its paint inside", () => {
    const plain = compositePlate(pixels, [paintFor({ kind: "bin", step: 3 }, colours), paintFor({ kind: "bin", step: 3 }, colours)], 0, colours);
    const selected = compositePlate(pixels, [paintFor({ kind: "bin", step: 3 }, colours), paintFor({ kind: "bin", step: 3 }, colours)], 1, colours);
    expect(insideMean(selected)).toEqual(insideMean(plain));
    // Along a row, outwards from the muscle's right edge: column 5 is its last, so a point `distance`
    // label pixels from its centre (pixel-centre coordinates 5 + distance), as the rings measure it.
    const row = 5 * PLATE_SUPERSAMPLE;
    const outward = (distance: number) => at(selected, Math.round((5 + distance + 0.5) * PLATE_SUPERSAMPLE - 0.5), row);
    const gold = (pixel: number[]) => pixel[0] > 200 && pixel[1] > 150 && pixel[2] < 120;
    const keyline = (pixel: number[]) => pixel[0] < 40 && pixel[1] < 50 && pixel[2] < 70;
    expect(keyline(outward(1))).toBe(true);
    expect(gold(outward((SELECTION_RINGS.keyline + SELECTION_RINGS.ring) / 2))).toBe(true);
    expect(keyline(outward((SELECTION_RINGS.ring + SELECTION_RINGS.outerKeyline) / 2))).toBe(true);
    // Muscle 2, unselected, has no ring.
    expect(gold(at(selected, 29 * PLATE_SUPERSAMPLE - 4, row))).toBe(false);
    expect(at(selected, 20 * PLATE_SUPERSAMPLE, row)).toEqual(at(plain, 20 * PLATE_SUPERSAMPLE, row));
  });

  it("measures distance from a muscle's edge, zero inside it", () => {
    const d = distanceTo(new Uint8Array([0, 1, 1, 0, 0, 0]), 6, 1, 1, 10);
    expect(Array.from(d)).toEqual([1, 0, 0, 1, 2, 3]);
  });
});
