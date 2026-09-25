import { BADGE_METALS, rankById, type RankId } from "@shared/capabilityRank";

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
  /**
   * The closed silhouette a badge's gem is cut from - the gate, the winged gate, the stepped
   * gate, the orbit's disc. Null for Prospect, which is the open route and has no gem: it is
   * the rank before the gate closes, and the one badge left unpolished on purpose.
   */
  plate: string | null;
  /** Open or closed routes, drawn with `currentColor` at `EMBLEM_STROKE`. The first is the frame. */
  strokes: string[];
  /** Solid marks, filled with `currentColor`; `evenOdd` cuts negative space. */
  fills: { d: string; evenOdd?: boolean }[];
};

export const rankEmblems: Record<RankId, EmblemGeometry> = {
  // The lower half of the gate only - open sky above - and the point the route starts from.
  prospect: {
    plate: null,
    strokes: ["M10 28 V45 L32 58 L54 45 V28"],
    fills: [{ d: "M32 35 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" }],
  },
  // The route closes into the gate, and one bold chevron sets the direction.
  jv: {
    plate: "M32 6 L54 19 V45 L32 58 L10 45 V19 Z",
    strokes: ["M32 6 L54 19 V45 L32 58 L10 45 V19 Z", "M21 38 L32 27 L43 38"],
    fills: [],
  },
  // The same gate with two thick ascent strokes, far enough apart to stay two at 20 px.
  varsity: {
    plate: "M32 6 L54 19 V45 L32 58 L10 45 V19 Z",
    strokes: ["M32 6 L54 19 V45 L32 58 L10 45 V19 Z", "M21 44 L32 33 L43 44", "M21 31 L32 20 L43 31"],
    fills: [],
  },
  // The gate's sides break outward into two directional wings around a solid diamond summit.
  regional: {
    plate: "M32 6 L54 19 L60 32 L54 45 L32 58 L10 45 L4 32 L10 19 Z",
    strokes: ["M32 6 L54 19 L60 32 L54 45 L32 58 L10 45 L4 32 L10 19 Z"],
    fills: [{ d: "M32 19 L42 32 L32 45 L22 32 Z" }],
  },
  // The shoulders step out - the silhouette changes, not just the contents - around the summit.
  state: {
    plate: "M10 45 V29 H17 V21 L32 8 L47 21 V29 H54 V45 L32 58 Z",
    strokes: ["M10 45 V29 H17 V21 L32 8 L47 21 V29 H54 V45 L32 58 Z"],
    fills: [{ d: "M32 23 L43 43 H21 Z" }],
  },
  // A second track under the roof, and a summit with a diamond cut through its heart - Regional's
  // diamond, carried up into the peak. It was an arch at the base, which read as a front door.
  national: {
    plate: "M32 6 L54 19 V45 L32 58 L10 45 V19 Z",
    strokes: ["M32 6 L54 19 V45 L32 58 L10 45 V19 Z", "M18 25 L32 17 L46 25"],
    fills: [{ d: "M32 24 L47 51 H17 Z M32 33.5 L36.5 40.5 L32 47.5 L27.5 40.5 Z", evenOdd: true }],
  },
  // The gate becomes an orbit, broken at its apex, and a broad summit fills it and rises through
  // the break. Broad on purpose: a thin mark through a ring broken at the top is a power button.
  world_stage: {
    plate: "M10 35 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0",
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

/* -------------------------------------------------------------------------------------------
 * The finished badge, as data
 *
 * One description of the badge, rendered two ways: by the React component in the app and by
 * `badgeSvgMarkup` for the exported files. Two hand-written copies would drift.
 * ---------------------------------------------------------------------------------------- */

export type SvgNode = { tag: string; attrs: Record<string, string | number>; children?: SvgNode[] };

/** Below this the gradients and the facet highlight stop reading and only muddy the mark. */
export const BADGE_POLISH_MIN_SIZE = 28;

/**
 * The gem is the emblem's closed silhouette in the rank's colour; the frame becomes a metal
 * rim; the inner mark sits on the gem in whichever of light or dark clears 3:1 across the gem's
 * whole gradient. Polished adds the gradient, the metal and one restrained facet kept clear of
 * the mark. World Stage's summit is gold metal; Prospect has no gem, so its dot is the gem.
 */
export function badgeNodes(id: RankId, { polished, uid }: { polished: boolean; uid: string }): SvgNode[] {
  const geometry = rankEmblems[id];
  const rank = rankById.get(id)!;
  const metal = BADGE_METALS[rank.badge.rim];
  const [frame, ...markStrokes] = geometry.strokes;
  const gem = polished ? `url(#${uid}-gem)` : rank.color;
  const rim = polished ? `url(#${uid}-rim)` : metal[1];
  const mark = id === "world_stage" ? (polished ? `url(#${uid}-gold)` : BADGE_METALS.gold[1]) : geometry.plate ? rank.badge.glyph : gem;
  const line = { fill: "none", "stroke-width": EMBLEM_STROKE, "stroke-linecap": "round", "stroke-linejoin": "round" };
  const gradient = (name: string, x2: number, y2: number, stops: readonly (readonly [number, string])[]): SvgNode => ({
    tag: "linearGradient", attrs: { id: `${uid}-${name}`, x1: 0, y1: 0, x2, y2 },
    children: stops.map(([offset, color]) => ({ tag: "stop", attrs: { offset, "stop-color": color } })),
  });
  const nodes: SvgNode[] = [];
  if (polished) {
    nodes.push({ tag: "defs", attrs: {}, children: [
      gradient("gem", 0, 1, [[0, rank.badge.plateTop], [1, rank.badge.plateBottom]]),
      gradient("rim", 1, 1, [[0, metal[0]], [0.45, metal[1]], [1, metal[2]]]),
      gradient("gold", 1, 1, [[0, BADGE_METALS.gold[0]], [0.5, BADGE_METALS.gold[1]], [1, BADGE_METALS.gold[2]]]),
      ...(geometry.plate ? [{ tag: "clipPath", attrs: { id: `${uid}-clip` }, children: [{ tag: "path", attrs: { d: geometry.plate } }] }] : []),
    ] });
  }
  if (geometry.plate) nodes.push({ tag: "path", attrs: { d: geometry.plate, fill: gem } });
  if (polished && geometry.plate) {
    // One facet, upper left, above every inner mark - enough to read as cut, not glossy.
    nodes.push({ tag: "g", attrs: { "clip-path": `url(#${uid}-clip)` }, children: [{ tag: "path", attrs: { d: "M0 0 H40 L0 30 Z", fill: "#ffffff", opacity: 0.14 } }] });
  }
  nodes.push({ tag: "path", attrs: { d: frame, ...line, stroke: rim } });
  if (markStrokes.length) nodes.push({ tag: "g", attrs: { ...line, stroke: mark }, children: markStrokes.map((d) => ({ tag: "path", attrs: { d } })) });
  if (geometry.fills.length) {
    nodes.push({ tag: "g", attrs: { fill: mark }, children: geometry.fills.map((fill): SvgNode => ({ tag: "path", attrs: fill.evenOdd ? { d: fill.d, "fill-rule": "evenodd" } : { d: fill.d } })) });
  }
  return nodes;
}

function serialise(node: SvgNode): string {
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
  return node.children?.length ? `<${node.tag}${attrs}>${node.children.map(serialise).join("")}</${node.tag}>` : `<${node.tag}${attrs}/>`;
}

/** The polished badge as a standalone SVG, exactly as exported. */
export function badgeSvgMarkup(id: RankId, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EMBLEM_VIEWBOX} ${EMBLEM_VIEWBOX}" role="img" aria-labelledby="t"><title id="t">${title}</title>${badgeNodes(id, { polished: true, uid: id }).map(serialise).join("")}</svg>\n`;
}
