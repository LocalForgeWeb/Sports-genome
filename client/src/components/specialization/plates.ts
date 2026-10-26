import type { DiagramLayerId, DiagramPlatePass, DiagramPlates, DiagramView, DiagramViewId } from "@shared/specialization/types";
import type { DiagramFill } from "./model";

/**
 * The plate renderer's arithmetic (PlateDiagram.tsx), pure so it can be tested without a canvas:
 * which pass shows what, the label image read back, a tap's muscle, and the paint.
 * Nothing here names a region: views, layers and muscles are the plates' data.
 */

export const PLATE_LAYERS: readonly DiagramLayerId[] = ["surface", "intermediate", "deep"];

/** The plates' views that have a pass, in the plates' order and words. */
export function plateViews(plates: DiagramPlates): DiagramView[] {
  return plates.viewOrder.filter((view) => plates.passes.some((pass) => pass.view === view.id));
}

/** The layers a view has a pass for, surface first. */
export function plateLayers(plates: DiagramPlates, view: DiagramViewId): DiagramLayerId[] {
  return PLATE_LAYERS.filter((layer) => plates.passes.some((pass) => pass.view === view && pass.layer === layer));
}

export function plateFor(plates: DiagramPlates, view: DiagramViewId, layer: DiagramLayerId): DiagramPlatePass | null {
  return plates.passes.find((pass) => pass.view === view && pass.layer === layer) ?? null;
}

/** Every pass that shows a node, in the plates' view order, surface first. */
export function passesShowing(plates: DiagramPlates, nodeId: string): DiagramPlatePass[] {
  const order = (pass: DiagramPlatePass) => [plates.viewOrder.findIndex((view) => view.id === pass.view), PLATE_LAYERS.indexOf(pass.layer)];
  return plates.passes.filter((pass) => pass.nodeIds.includes(nodeId)).sort((left, right) => {
    const [lv, ll] = order(left);
    const [rv, rl] = order(right);
    return lv - rv || ll - rl;
  });
}

/**
 * Where to go when a muscle is chosen that the pass shown does not show (as the owner's package
 * does): the other layer of the same view if it shows it, else the first view that does. Null
 * when the pass shown already shows it, or no pass does (the page then says so).
 */
export function passToShow(plates: DiagramPlates, nodeId: string, view: DiagramViewId, layer: DiagramLayerId): DiagramPlatePass | null {
  const showing = passesShowing(plates, nodeId);
  if (!showing.length || showing.some((pass) => pass.view === view && pass.layer === layer)) return null;
  return showing.find((pass) => pass.view === view) ?? showing[0];
}

/**
 * A label image read back from a canvas (RGBA, as `getImageData` gives it): the red channel is the
 * muscle index. A value past the pass's muscles reads as none, so a stray value never picks a muscle.
 */
export function decodeLabels(rgba: ArrayLike<number>, width: number, height: number, muscles: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let index = 0; index < out.length; index++) {
    const value = rgba[index * 4];
    out[index] = value <= muscles ? value : 0;
  }
  return out;
}

/**
 * The muscle at a point of the label image, in its pixels: the one under it, or else the nearest
 * within `reach` pixels (a tap beside a thin muscle takes it), or 0. Ties go to the first found,
 * scanning outwards ring by ring, so the result never depends on the scan's direction more than a pixel.
 */
export function labelAt(labels: Uint8Array, width: number, height: number, x: number, y: number, reach: number): number {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px >= 0 && py >= 0 && px < width && py < height && labels[py * width + px]) return labels[py * width + px];
  const radius = Math.max(0, Math.ceil(reach));
  let best = 0;
  let bestDistance = Infinity;
  for (let dy = -radius; dy <= radius; dy++) {
    const yy = py + dy;
    if (yy < 0 || yy >= height) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const xx = px + dx;
      if (xx < 0 || xx >= width) continue;
      const label = labels[yy * width + xx];
      if (!label) continue;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance && distance <= reach * reach) {
        best = label;
        bestDistance = distance;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------- paint

export type Rgb = readonly [number, number, number];

/** What a muscle is painted with: the page's fill, as colours. */
export type PlatePaint =
  | { kind: "solid"; colour: Rgb }
  | { kind: "zero"; colour: Rgb; edge: Rgb }
  | { kind: "hatch"; colour: Rgb; stripe: Rgb };

export type PlateColours = {
  /** The page's exposure ramp, step 1 to 5. */
  exposure: readonly Rgb[];
  neutral: Rgb;
  zeroEdge: Rgb;
  hatch: Rgb;
  hatchStripe: Rgb;
  /** Bone and anything not a muscle, from its darkest shade to its lightest: cool, off the ramp. */
  structureDark: Rgb;
  structureLight: Rgb;
  selected: Rgb;
  keyline: Rgb;
};

/** The tokens' own values, for a page that has not loaded them (the SVG drawing's fallbacks). */
export const PLATE_FALLBACK_COLOURS: PlateColours = {
  exposure: ["#f7a1a8", "#ee5d6a", "#d1202f", "#970f1c", "#560610"].map(hexToRgb),
  neutral: hexToRgb("#34465a"),
  zeroEdge: hexToRgb("#9fb3c8"),
  hatch: hexToRgb("#2e3a49"),
  hatchStripe: hexToRgb("#6f7d90"),
  structureDark: hexToRgb("#16263a"),
  structureLight: hexToRgb("#6f8399"),
  selected: hexToRgb("#f2c14d"),
  keyline: hexToRgb("#07182e"),
};

export function hexToRgb(hex: string): Rgb {
  const clean = hex.trim().replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full.slice(0, 6), 16);
  return Number.isFinite(value) ? [(value >> 16) & 255, (value >> 8) & 255, value & 255] : [0, 0, 0];
}

/** A computed CSS colour ("#rrggbb" or "rgb(r, g, b)"), or null when it is neither. */
export function cssColourToRgb(text: string | null | undefined): Rgb | null {
  const value = text?.trim();
  if (!value) return null;
  if (value.startsWith("#")) return hexToRgb(value);
  const match = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export function paintFor(fill: DiagramFill, colours: PlateColours): PlatePaint {
  if (fill.kind === "bin") {
    const step = Math.min(colours.exposure.length, Math.max(1, Math.round(Number.isFinite(fill.step) ? fill.step : 1)));
    return { kind: "solid", colour: colours.exposure[step - 1] };
  }
  if (fill.kind === "zero") return { kind: "zero", colour: colours.neutral, edge: colours.zeroEdge };
  if (fill.kind === "hatch") return { kind: "hatch", colour: colours.hatch, stripe: colours.hatchStripe };
  return { kind: "solid", colour: colours.neutral };
}

/** A pass's pixels as loaded: the plate (RGBA) and its labels, both `width` × `height`. */
export type PlatePixels = { width: number; height: number; plate: Uint8ClampedArray; labels: Uint8Array };

/** Per pass, once: each pixel's lightness, each muscle's mean lightness, and where a muscle is thick enough to edge. */
type Prepared = { luminance: Float32Array; middle: Float32Array; thick: Uint8Array };
const prepared = new WeakMap<PlatePixels, Prepared>();

function prepare(pixels: PlatePixels): Prepared {
  const known = prepared.get(pixels);
  if (known) return known;
  const { width, height, plate, labels } = pixels;
  const luminance = new Float32Array(width * height);
  const thick = new Uint8Array(width * height);
  const lights = new Map<number, number[]>();
  for (let index = 0; index < luminance.length; index++) {
    const at = index * 4;
    luminance[index] = (0.2126 * plate[at] + 0.7152 * plate[at + 1] + 0.0722 * plate[at + 2]) / 255;
    const label = labels[index];
    if (label && plate[at + 3] > 200) {
      const list = lights.get(label) ?? [];
      list.push(luminance[index]);
      lights.set(label, list);
    }
  }
  // A muscle's own mean lightness, so its shading varies round its paint and, on average, it reads as its paint.
  let most = 0;
  lights.forEach((_, label) => { most = Math.max(most, label); });
  const middle = new Float32Array(most + 1).fill(0.5);
  lights.forEach((list, label) => {
    middle[label] = Math.max(0.05, list.reduce((sum, value) => sum + value, 0) / list.length);
  });
  // Thick: more than half of the 7 × 7 square round the pixel is its muscle (a body, not a tendon's thread).
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const label = labels[y * width + x];
      if (!label) continue;
      let count = 0;
      for (let dy = -3; dy <= 3; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < width && labels[yy * width + xx] === label) count++;
        }
      }
      if (count >= 26) thick[y * width + x] = 1;
    }
  }
  const out = { luminance, middle, thick };
  prepared.set(pixels, out);
  return out;
}

/**
 * Distance, in pixels (3-4 chamfer, divided by 3), from each pixel to the nearest pixel labelled
 * `label`; 0 inside it. Only as far as `limit`: beyond it reads as `limit`.
 */
export function distanceTo(labels: Uint8Array, width: number, height: number, label: number, limit: number): Float32Array {
  const far = limit * 3;
  const d = new Float32Array(width * height).fill(far);
  for (let index = 0; index < d.length; index++) if (labels[index] === label) d[index] = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      let best = d[index];
      if (!best) continue;
      if (x > 0) best = Math.min(best, d[index - 1] + 3);
      if (y > 0) {
        best = Math.min(best, d[index - width] + 3);
        if (x > 0) best = Math.min(best, d[index - width - 1] + 4);
        if (x < width - 1) best = Math.min(best, d[index - width + 1] + 4);
      }
      d[index] = best;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const index = y * width + x;
      let best = d[index];
      if (!best) continue;
      if (x < width - 1) best = Math.min(best, d[index + 1] + 3);
      if (y < height - 1) {
        best = Math.min(best, d[index + width] + 3);
        if (x < width - 1) best = Math.min(best, d[index + width + 1] + 4);
        if (x > 0) best = Math.min(best, d[index + width - 1] + 4);
      }
      d[index] = best;
    }
  }
  for (let index = 0; index < d.length; index++) d[index] = Math.min(limit, d[index] / 3);
  return d;
}

/** The selection's rings outside the muscle, in label pixels from its edge: keyline, gold, keyline, soft halo. */
export const SELECTION_RINGS = { keyline: 1.5, ring: 4, outerKeyline: 5.5, halo: 10 } as const;

/** The canvas draws each label pixel as this many pixels a side, so edges are smooth on a 3× phone. */
export const PLATE_SUPERSAMPLE = 2;

const clamp = (value: number, low: number, high: number) => (value < low ? low : value > high ? high : value);
const smooth = (low: number, high: number, value: number) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * The composite, as RGBA for a canvas `scale` times the pass's size: the plate in cool structure
 * tones (bone and anything that is not a labelled muscle, so nothing unlabelled reads as a step of
 * the ramp); each labelled muscle in its paint with the plate's shading kept round the paint's own
 * colour (a muscle's mean lightness is its paint; light and shade move it by under a step of the
 * ramp); a soft dark seam where two muscles meet; and the selected muscle outlined outside its edge.
 * Labels are sampled between pixels and their edges sharpened, so outlines follow the muscle
 * smoothly rather than the label image's pixel steps. `paints[k - 1]` is label k's; a label with
 * no paint stays structure.
 */
export function compositePlate(pixels: PlatePixels, paints: readonly (PlatePaint | null)[], selectedLabel: number, colours: PlateColours, scale = PLATE_SUPERSAMPLE): Uint8ClampedArray {
  const { width, height, plate, labels } = pixels;
  const { luminance, middle, thick } = prepare(pixels);
  const outWidth = width * scale;
  const outHeight = height * scale;
  const out = new Uint8ClampedArray(outWidth * outHeight * 4);
  const ring = selectedLabel ? distanceTo(labels, width, height, selectedLabel, SELECTION_RINGS.halo + 1) : null;
  const [dr, dg, db] = colours.structureDark;
  const [lr, lg, lb] = colours.structureLight;
  const [kr, kg, kb] = colours.keyline;
  const [sr, sg, sb] = colours.selected;
  const ids = [0, 0, 0, 0];
  const weights = [0, 0, 0, 0];
  const cover = [0, 0, 0, 0];
  const sample = [0, 0, 0, 0];
  for (let v = 0; v < outHeight; v++) {
    const fy = (v + 0.5) / scale - 0.5;
    const y0 = clamp(Math.floor(fy), 0, height - 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const ty = clamp(fy - y0, 0, 1);
    for (let u = 0; u < outWidth; u++) {
      const fx = (u + 0.5) / scale - 0.5;
      const x0 = clamp(Math.floor(fx), 0, width - 1);
      const x1 = Math.min(width - 1, x0 + 1);
      const tx = clamp(fx - x0, 0, 1);
      sample[0] = y0 * width + x0; sample[1] = y0 * width + x1; sample[2] = y1 * width + x0; sample[3] = y1 * width + x1;
      weights[0] = (1 - tx) * (1 - ty); weights[1] = tx * (1 - ty); weights[2] = (1 - tx) * ty; weights[3] = tx * ty;
      let lum = 0;
      let alpha = 0;
      let distinct = 0;
      for (let k = 0; k < 4; k++) {
        const index = sample[k];
        lum += luminance[index] * weights[k];
        alpha += plate[index * 4 + 3] * weights[k];
        const label = labels[index];
        let slot = 0;
        while (slot < distinct && ids[slot] !== label) slot++;
        if (slot === distinct) { ids[slot] = label; cover[slot] = 0; distinct++; }
        cover[slot] += weights[k];
      }
      let d = 0;
      if (ring) for (let k = 0; k < 4; k++) d += ring[sample[k]] * (k === 0 ? (1 - tx) * (1 - ty) : k === 1 ? tx * (1 - ty) : k === 2 ? (1 - tx) * ty : tx * ty);
      const inRing = ring !== null && d > 0.35 && d <= SELECTION_RINGS.halo;
      // Nothing here and no ring: leave it transparent (most of the frame), which halves the work.
      if (alpha <= 0 && !inRing) continue;
      const t = clamp((lum - 0.1) / 0.8, 0, 1);
      const baseR = dr + (lr - dr) * t;
      const baseG = dg + (lg - dg) * t;
      const baseB = db + (lb - db) * t;
      let r = 0;
      let g = 0;
      let b = 0;
      // Each label's share, sharpened round half-cover so the edge is about one output pixel wide.
      let total = 0;
      for (let slot = 0; slot < distinct; slot++) { weights[slot] = smooth(0.4, 0.6, cover[slot]); total += weights[slot]; }
      if (total <= 0) { for (let slot = 0; slot < distinct; slot++) weights[slot] = cover[slot]; total = 1; }
      let muscles = 0;
      let leastMuscle = 1;
      for (let slot = 0; slot < distinct; slot++) {
        const share = weights[slot] / total;
        const label = ids[slot];
        const paint = label ? paints[label - 1] : null;
        if (label && paint) { muscles++; leastMuscle = Math.min(leastMuscle, cover[slot]); }
        if (!share) continue;
        if (!label || !paint) { r += baseR * share; g += baseG * share; b += baseB * share; continue; }
        let colour: Rgb = paint.colour;
        if (paint.kind === "hatch" && ((((u - v) % 12) + 12) % 12) < 2.6) colour = paint.stripe;
        if (paint.kind === "zero" && cover[slot] < 0.999 && thick[sample[0]] && ((u + v) >> 2) % 3 !== 2) colour = paint.edge;
        const shade = clamp(1 + 0.4 * (lum / middle[label] - 1), 0.8, 1.12);
        r += colour[0] * shade * share; g += colour[1] * shade * share; b += colour[2] * shade * share;
      }
      // Two muscles meeting: a soft dark seam along the line between them.
      if (muscles >= 2) {
        const seam = 1 - 0.32 * smooth(0, 0.5, leastMuscle);
        r *= seam; g *= seam; b *= seam;
      }
      if (inRing) {
        // From the edge outwards: keyline, gold, keyline, halo; each change over half a label pixel.
        const gold = smooth(SELECTION_RINGS.keyline - 0.25, SELECTION_RINGS.keyline + 0.25, d) * (1 - smooth(SELECTION_RINGS.ring - 0.25, SELECTION_RINGS.ring + 0.25, d));
        const ringR = kr + (sr - kr) * gold;
        const ringG = kg + (sg - kg) * gold;
        const ringB = kb + (sb - kb) * gold;
        const solid = smooth(0.35, 0.85, d) * (1 - smooth(SELECTION_RINGS.outerKeyline - 0.25, SELECTION_RINGS.outerKeyline + 0.25, d));
        const halo = 0.32 * (1 - smooth(SELECTION_RINGS.outerKeyline, SELECTION_RINGS.halo, d)) * smooth(SELECTION_RINGS.outerKeyline - 0.25, SELECTION_RINGS.outerKeyline + 0.25, d);
        const over = solid + halo;
        const below = alpha / 255;
        const sum = over + below * (1 - over);
        if (sum > 0) {
          const cr = (solid * ringR + halo * sr) / Math.max(over, 1e-6);
          const cg = (solid * ringG + halo * sg) / Math.max(over, 1e-6);
          const cb = (solid * ringB + halo * sb) / Math.max(over, 1e-6);
          r = (cr * over + r * below * (1 - over)) / sum;
          g = (cg * over + g * below * (1 - over)) / sum;
          b = (cb * over + b * below * (1 - over)) / sum;
        }
        alpha = sum * 255;
      }
      const at = (v * outWidth + u) * 4;
      out[at] = r;
      out[at + 1] = g;
      out[at + 2] = b;
      out[at + 3] = alpha;
    }
  }
  return out;
}
