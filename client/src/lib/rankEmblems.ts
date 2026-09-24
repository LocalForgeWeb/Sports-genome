import type { RankId } from "@shared/capabilityRank";

/**
 * The seven rank emblems, as geometry. This file is the single source: the React component
 * draws from it and `scripts/export-rank-emblems.ts` writes the standalone SVGs from it, and a
 * test holds the committed files to what this produces.
 *
 * One family, one idea - an upward route through a gate. The route starts as an open track
 * with a starting point, closes into a gate, gains ascent marks, grows wings around a summit,
 * steps its shoulders, doubles its track, and finally becomes an orbit the summit breaks
 * through. Each rank is meant to be told apart by silhouette or major internal form at 20 px
 * with no colour at all, which is why nothing here depends on a hue, a gradient or a hairline.
 *
 * 64 x 64, content inside 4..60. Strokes share one weight and round joins, so the corner
 * language stays the same across the set; marks are filled.
 */

export const EMBLEM_VIEWBOX = 64;
export const EMBLEM_STROKE = 5.5;

export type EmblemGeometry = {
  /** Open or closed routes, drawn with `currentColor` at `EMBLEM_STROKE`. */
  strokes: string[];
  /** Solid marks, filled with `currentColor`; `evenOdd` cuts negative space. */
  fills: { d: string; evenOdd?: boolean }[];
};

export const rankEmblems: Record<RankId, EmblemGeometry> = {
  // The lower half of the gate only - open sky above - and the point the route starts from.
  prospect: {
    strokes: ["M10 28 V45 L32 58 L54 45 V28"],
    fills: [{ d: "M32 35 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" }],
  },
  // The route closes into the gate, and one bold chevron sets the direction.
  jv: {
    strokes: ["M32 6 L54 19 V45 L32 58 L10 45 V19 Z", "M21 38 L32 27 L43 38"],
    fills: [],
  },
  // The same gate with two thick ascent strokes, far enough apart to stay two at 20 px.
  varsity: {
    strokes: ["M32 6 L54 19 V45 L32 58 L10 45 V19 Z", "M21 44 L32 33 L43 44", "M21 31 L32 20 L43 31"],
    fills: [],
  },
  // The gate's sides break outward into two directional wings around a solid diamond summit.
  regional: {
    strokes: ["M32 6 L54 19 L60 32 L54 45 L32 58 L10 45 L4 32 L10 19 Z"],
    fills: [{ d: "M32 19 L42 32 L32 45 L22 32 Z" }],
  },
  // The shoulders step out - the silhouette changes, not just the contents - around the summit.
  state: {
    strokes: ["M10 45 V29 H17 V21 L32 8 L47 21 V29 H54 V45 L32 58 Z"],
    fills: [{ d: "M32 23 L43 43 H21 Z" }],
  },
  // A second track under the roof, and a summit with a portal cut through its base.
  national: {
    strokes: ["M32 6 L54 19 V45 L32 58 L10 45 V19 Z", "M18 25 L32 17 L46 25"],
    fills: [{ d: "M32 24 L46 50 H18 Z M27.5 50 V45 A4.5 4.5 0 0 1 36.5 45 V50 Z", evenOdd: true }],
  },
  // The gate becomes an orbit, broken at its apex, and a broad summit fills it and rises through
  // the break. Broad on purpose: a thin mark through a ring broken at the top is a power button.
  world_stage: {
    strokes: ["M44.30 16.76 A22 22 0 1 1 19.70 16.76"],
    fills: [{ d: "M32 5 L47 44 H17 Z" }],
  },
};

/** The standalone SVG for one rank, exactly as exported. */
export function emblemSvgMarkup(id: RankId, title: string): string {
  const geometry = rankEmblems[id];
  const strokes = geometry.strokes.map((d) => `<path d="${d}"/>`).join("");
  const fills = geometry.fills.map((fill) => `<path d="${fill.d}"${fill.evenOdd ? ' fill-rule="evenodd"' : ""}/>`).join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EMBLEM_VIEWBOX} ${EMBLEM_VIEWBOX}" role="img" aria-labelledby="t">`,
    `<title id="t">${title}</title>`,
    `<g fill="none" stroke="currentColor" stroke-width="${EMBLEM_STROKE}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>`,
    fills ? `<g fill="currentColor">${fills}</g>` : "",
    `</svg>`,
  ].join("") + "\n";
}
