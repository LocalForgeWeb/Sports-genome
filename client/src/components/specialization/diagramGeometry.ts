import type { AnatomyNode, DiagramAsset, DiagramLayerId, DiagramPath, DiagramViewId } from "@shared/specialization/types";

/**
 * Plain geometry the diagram renderer needs from a path's `d`, worked out once per asset:
 * where a muscle is widest (its label and tap anchor) and how big it is (the hit order).
 * No DOM measuring, so it runs the same in a test as on a phone. Region-agnostic: it reads
 * any asset's paths, whatever region they draw.
 */

export type Point = { x: number; y: number };

/** What the drawable rule reads of a node. */
export type DiagramNode = Pick<AnatomyNode, "id" | "kind" | "parentId">;

/**
 * The nodes a drawing may show and a tap may choose (10-multi-region.md §7.3): muscles and
 * heads, never a group or a compartment, and never a node that is another node's parent,
 * whatever its kind. A muscle split into heads is drawn and chosen as its heads: drawn whole it
 * would overlap them, and chosen it would have no mapping of its own. The design generator
 * applies the same rule (design/specialization/shared/asset.mjs, `drawableMembers`).
 */
export function drawableNodeIds(nodes: readonly DiagramNode[]): Set<string> {
  const parents = new Set(nodes.flatMap((node) => (node.parentId ? [node.parentId] : [])));
  return new Set(nodes.filter((node) => (node.kind === "muscle" || node.kind === "head") && !parents.has(node.id)).map((node) => node.id));
}

/**
 * Flattens a path into a polygon. Handles absolute and relative M, L, H, V, C, S, Q, T and Z
 * (curves sampled); arcs are taken as straight lines, which is close enough for an anchor.
 */
export function flattenPath(d: string, steps = 8): Point[] {
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const points: Point[] = [];
  let index = 0;
  let command = "";
  let current: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let lastControl = null as Point | null;
  const isCommand = (token: string | undefined) => token !== undefined && /^[A-Za-z]$/.test(token);
  const read = () => Number(tokens[index++]);
  const cubic = (c1: Point, c2: Point, end: Point) => {
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const u = 1 - t;
      points.push({
        x: u * u * u * current.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x,
        y: u * u * u * current.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y,
      });
    }
    lastControl = c2;
    current = end;
  };
  while (index < tokens.length) {
    if (isCommand(tokens[index])) command = tokens[index++];
    const relative = command === command.toLowerCase();
    const at = (x: number, y: number): Point => (relative ? { x: current.x + x, y: current.y + y } : { x, y });
    switch (command.toUpperCase()) {
      case "Z":
        current = start;
        lastControl = null;
        if (!isCommand(tokens[index])) index++;
        break;
      case "M": {
        current = at(read(), read());
        start = current;
        points.push(current);
        command = relative ? "l" : "L";
        lastControl = null;
        break;
      }
      case "L":
        current = at(read(), read());
        points.push(current);
        lastControl = null;
        break;
      case "H":
        current = { x: relative ? current.x + read() : read(), y: current.y };
        points.push(current);
        break;
      case "V":
        current = { x: current.x, y: relative ? current.y + read() : read() };
        points.push(current);
        break;
      case "C":
        cubic(at(read(), read()), at(read(), read()), at(read(), read()));
        break;
      case "S": {
        const reflected: Point = lastControl ? { x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y } : current;
        cubic(reflected, at(read(), read()), at(read(), read()));
        break;
      }
      case "Q": {
        const control = at(read(), read());
        const end = at(read(), read());
        cubic({ x: current.x + (2 / 3) * (control.x - current.x), y: current.y + (2 / 3) * (control.y - current.y) }, { x: end.x + (2 / 3) * (control.x - end.x), y: end.y + (2 / 3) * (control.y - end.y) }, end);
        break;
      }
      case "T":
        current = at(read(), read());
        points.push(current);
        break;
      case "A":
        read(); read(); read(); read(); read();
        current = at(read(), read());
        points.push(current);
        break;
      default:
        index++;
    }
  }
  return points;
}

export function polygonArea(points: readonly Point[]): number {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) sum += (points[j].x + points[i].x) * (points[j].y - points[i].y);
  return Math.abs(sum / 2);
}

/** The crossings of a horizontal line with a polygon, paired into inside intervals. */
function slice(points: readonly Point[], y: number): [number, number][] {
  const xs: number[] = [];
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j];
    const b = points[i];
    if ((a.y > y) !== (b.y > y)) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  xs.sort((left, right) => left - right);
  const intervals: [number, number][] = [];
  for (let i = 0; i + 1 < xs.length; i += 2) intervals.push([xs[i], xs[i + 1]]);
  return intervals;
}

/** The same with x and y exchanged, so a vertical line is sliced as `slice` slices a horizontal one. */
const transposed = (points: readonly Point[]): Point[] => points.map((point) => ({ x: point.y, y: point.x }));

/** Horizontal slices (`rows`) suit a belly that runs up and down the drawing; vertical ones (`columns`) a belly lying across it. */
export type SliceAxis = "rows" | "columns";

/**
 * Candidate anchors: the middle of the inside interval of each slice through the shape, with the
 * interval's length (its `width`, across the slice). Horizontal slices by default; `columns`
 * slices vertically.
 */
export function sliceCentres(points: readonly Point[], count = 48, axis: SliceAxis = "rows"): { point: Point; width: number }[] {
  if (!points.length) return [];
  if (axis === "columns") return sliceCentres(transposed(points), count).map(({ point, width }) => ({ point: { x: point.y, y: point.x }, width }));
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));
  const out: { point: Point; width: number }[] = [];
  for (let k = 1; k < count; k++) {
    const y = top + ((bottom - top) * k) / count;
    for (const [left, right] of slice(points, y)) out.push({ point: { x: (left + right) / 2, y }, width: right - left });
  }
  return out;
}

/** A belly lies across the drawing when it is at least this many times longer across than up and down. */
const ACROSS_RATIO = 2;

/**
 * Which way to slice a belly for its anchors: across its length. Horizontal slices, unless its
 * longest horizontal slice is at least twice its longest vertical one (a band running from the
 * spine toward the shoulder), when vertical slices give anchors all along it instead of three
 * across its middle.
 */
export function acrossAxis(points: readonly Point[]): SliceAxis {
  const longest = (axis: SliceAxis) => Math.max(0, ...sliceCentres(points, 48, axis).map((item) => item.width));
  return longest("rows") >= ACROSS_RATIO * longest("columns") ? "columns" : "rows";
}

/** Even-odd point-in-polygon test. */
export function containsPoint(points: readonly Point[], point: Point): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < a.x + ((point.y - a.y) * (b.x - a.x)) / (b.y - a.y)) inside = !inside;
  }
  return inside;
}

type Box = { left: number; top: number; right: number; bottom: number };
const boxOf = (points: readonly Point[]): Box => ({
  left: Math.min(...points.map((point) => point.x)),
  top: Math.min(...points.map((point) => point.y)),
  right: Math.max(...points.map((point) => point.x)),
  bottom: Math.max(...points.map((point) => point.y)),
});

/**
 * Which node's belly is painted on top at a point (paint order: later paths are on top), or
 * null over a gutter, a tendon, bone or skin. The tap squares are scored with it. Worked out
 * once per layer as a raster of RASTER_CELL-unit cells, filled row by row from each belly's
 * slices, so scoring a square is a few look-ups rather than point-in-polygon tests.
 */
function topBellyAt(bellies: readonly { nodeId: string; points: Point[]; box: Box }[]) {
  if (!bellies.length) return () => null;
  const left = Math.floor(Math.min(...bellies.map((belly) => belly.box.left)));
  const top = Math.floor(Math.min(...bellies.map((belly) => belly.box.top)));
  const cols = Math.ceil((Math.max(...bellies.map((belly) => belly.box.right)) - left) / RASTER_CELL) + 1;
  const rows = Math.ceil((Math.max(...bellies.map((belly) => belly.box.bottom)) - top) / RASTER_CELL) + 1;
  const owners = new Int16Array(cols * rows).fill(-1);
  bellies.forEach((belly, index) => {
    const firstRow = Math.max(0, Math.floor((belly.box.top - top) / RASTER_CELL));
    const lastRow = Math.min(rows - 1, Math.ceil((belly.box.bottom - top) / RASTER_CELL));
    for (let row = firstRow; row <= lastRow; row++) {
      for (const [from, to] of slice(belly.points, top + (row + 0.5) * RASTER_CELL)) {
        const firstCol = Math.max(0, Math.ceil((from - left) / RASTER_CELL - 0.5));
        const lastCol = Math.min(cols - 1, Math.floor((to - left) / RASTER_CELL - 0.5));
        for (let col = firstCol; col <= lastCol; col++) owners[row * cols + col] = index;
      }
    }
  });
  return (point: Point): string | null => {
    const col = Math.floor((point.x - left) / RASTER_CELL);
    const row = Math.floor((point.y - top) / RASTER_CELL);
    if (col < 0 || row < 0 || col >= cols || row >= rows) return null;
    const index = owners[row * cols + col];
    return index < 0 ? null : bellies[index].nodeId;
  };
}

/** Raster cell for topBellyAt, in view-box units. */
const RASTER_CELL = 2;
/** Samples per side when scoring how much of other muscles a tap square would cover. */
const COVER_SAMPLES = 6;
/** A label anchor stays this far inside the canvas, so the leader line ends on the drawing. */
const ANCHOR_MARGIN = 14;

export type DrawnNode = {
  nodeId: string;
  /** Belly paths in draw order. */
  bellies: DiagramPath[];
  /** Tendons that belong to the node, outlined with it when selected. */
  tendons: DiagramPath[];
  /** Total belly area, in view-box units: the hit order (largest first, so small ones sit on top). */
  area: number;
  /** Where the node is widest: its selection label points here. */
  labelAnchor: Point;
  /** Where its enlarged tap target is centred: inside the belly, kept apart from smaller neighbours' targets. */
  hitAnchor: Point;
};

/**
 * The selectable nodes of one view and layer. A node is selectable where it has a belly;
 * tendons and ghosts never are (brief §6: tendons are not muscle bulk).
 *
 * `square` (view-box units) and `canvas` place the tap squares: each node gets a square
 * centred inside its own belly, kept clear of every other node's square and inside the
 * canvas, so each one is a whole target of its own.
 */
export function drawnNodes(paths: readonly DiagramPath[], options: { square?: number; canvas?: { width: number; height: number } } = {}): DrawnNode[] {
  const side = options.square ?? 0;
  const canvas = options.canvas ?? null;
  // One asset's layers are fixed module data, so each is worked out once per square size.
  const cacheKey = `${side}|${canvas ? `${canvas.width}x${canvas.height}` : "-"}`;
  const cached = placementCache.get(paths)?.get(cacheKey);
  if (cached) return cached;

  const byNode = new Map<string, { bellies: DiagramPath[]; tendons: DiagramPath[] }>();
  // Every belly as drawn, in paint order (the paths' order: later is on top).
  const bellyShapes: { nodeId: string; points: Point[]; box: Box }[] = [];
  const pointsOf = new Map<DiagramPath, Point[]>();
  for (const path of paths) {
    if (path.kind !== "belly" || !path.nodeId) continue;
    const points = flattenPath(path.d);
    pointsOf.set(path, points);
    bellyShapes.push({ nodeId: path.nodeId, points, box: boxOf(points) });
  }
  const ownerAt = topBellyAt(bellyShapes);
  for (const path of paths) {
    if (!path.nodeId || (path.kind !== "belly" && path.kind !== "tendon")) continue;
    const entry = byNode.get(path.nodeId) ?? { bellies: [], tendons: [] };
    (path.kind === "belly" ? entry.bellies : entry.tendons).push(path);
    byNode.set(path.nodeId, entry);
  }
  // A label anchor on the canvas: a belly that runs off the edge of the drawing is labelled
  // where it is drawn, never at a point the leader line cannot reach.
  const onCanvas = (point: Point) => !canvas || (point.y >= ANCHOR_MARGIN && point.y <= canvas.height - ANCHOR_MARGIN && point.x >= 0 && point.x <= canvas.width);
  // Each slice's middle and its quarter points, along the slice.
  const spread = (centres: { point: Point; width: number }[], axis: SliceAxis) => centres.flatMap(({ point, width }) => [0, -0.25, 0.25].map((shift) => ({
    point: axis === "rows" ? { x: point.x + shift * width, y: point.y } : { x: point.x, y: point.y + shift * width },
    width,
  })));
  const nodes = Array.from(byNode.entries())
    .filter(([, entry]) => entry.bellies.length > 0)
    .map(([nodeId, entry]) => {
      const polygons = entry.bellies.map((path) => pointsOf.get(path) ?? flattenPath(path.d));
      const areas = polygons.map(polygonArea);
      const largest = polygons[areas.indexOf(Math.max(...areas))];
      // Slices across each belly: its width is measured across its length, whichever way it lies.
      const axes = polygons.map(acrossAxis);
      const all = sliceCentres(largest, 48, axes[polygons.indexOf(largest)]);
      const visible = all.filter((item) => onCanvas(item.point));
      const centres = visible.length ? visible : all;
      const widest = centres.reduce((best, item) => (item.width > best.width ? item : best), centres[0] ?? { point: { x: 0, y: 0 }, width: 0 });
      // Tap-square candidates: across every belly of the node, each slice's middle and its quarter
      // points; and the slices the other way, tried only where none of those has room for a whole square.
      const candidates = polygons.flatMap((points, index) => spread(sliceCentres(points, 48, axes[index]), axes[index]));
      const fallback = polygons.flatMap((points, index) => {
        const other: SliceAxis = axes[index] === "rows" ? "columns" : "rows";
        return spread(sliceCentres(points, 48, other), other);
      });
      return { nodeId, ...entry, area: areas.reduce((sum, value) => sum + value, 0), labelAnchor: widest.point, hitAnchor: widest.point, candidates, fallback };
    });

  // Tap squares, smallest node first (it has the fewest places to go): each takes the point
  // inside its own belly whose square overlaps no square already placed (Chebyshev distance
  // of a full side) and stays on the canvas. Among those it takes the one that covers the
  // least of other muscles as drawn, because the squares sit above the bellies and a tap on a
  // neighbour under a square selects the square's muscle; then wide slices, then the node's
  // widest point. Bigger nodes, placed later, have room to step round the small ones.
  const placed: Point[] = [];
  // The side a square centred here could have without touching a placed square or leaving the canvas.
  const room = (point: Point) => Math.min(
    side,
    ...placed.map((other) => Math.max(Math.abs(other.x - point.x), Math.abs(other.y - point.y))),
    ...(canvas ? [2 * point.x, 2 * (canvas.width - point.x), 2 * point.y, 2 * (canvas.height - point.y)] : []),
  );
  // Share of the square over another muscle's belly as drawn, and over its own.
  const cover = (nodeId: string, centre: Point) => {
    let other = 0;
    let own = 0;
    for (let i = 0; i < COVER_SAMPLES; i++) {
      for (let j = 0; j < COVER_SAMPLES; j++) {
        const owner = ownerAt({ x: centre.x + side * ((i + 0.5) / COVER_SAMPLES - 0.5), y: centre.y + side * ((j + 0.5) / COVER_SAMPLES - 0.5) });
        if (owner === nodeId) own++;
        else if (owner !== null) other++;
      }
    }
    const total = COVER_SAMPLES * COVER_SAMPLES;
    return { other: other / total, own: own / total };
  };
  for (const node of [...nodes].sort((left, right) => left.area - right.area)) {
    let best = node.hitAnchor;
    let bestScore = -Infinity;
    let bestRoom = -Infinity;
    const consider = (candidates: { point: Point; width: number }[]) => {
      for (const candidate of candidates) {
        const free = room(candidate.point);
        // Room first and by far (a square that touches another is never chosen over one that does not).
        let score = free * 1e5 + candidate.width - Math.hypot(candidate.point.x - node.labelAnchor.x, candidate.point.y - node.labelAnchor.y) / 100;
        if (side > 0 && free * 1e5 >= bestScore - 1e4) {
          const { other, own } = cover(node.nodeId, candidate.point);
          score += -other * 1000 + own * 100;
        }
        if (score > bestScore) { bestScore = score; best = candidate.point; bestRoom = free; }
      }
    };
    consider(node.candidates);
    if (bestRoom < side) consider(node.fallback);
    node.hitAnchor = best;
    placed.push(best);
  }
  const result = nodes.map(({ candidates: _candidates, fallback: _fallback, ...node }) => node);
  const forPaths = placementCache.get(paths) ?? new Map<string, DrawnNode[]>();
  forPaths.set(cacheKey, result);
  placementCache.set(paths, forPaths);
  return result;
}

const placementCache = new WeakMap<readonly DiagramPath[], Map<string, DrawnNode[]>>();

export type Placement = { view: DiagramViewId; layer: DiagramLayerId };

/**
 * Every view and layer in which a node is drawn as a belly (where to find a muscle that is not
 * on screen), in the drawing's own view order, then surface to deep.
 */
export function placementsOf(asset: DiagramAsset, nodeId: string, kind: DiagramPath["kind"] = "belly"): Placement[] {
  const out: Placement[] = [];
  for (const { id: view } of asset.viewOrder) {
    for (const layer of ["surface", "intermediate", "deep"] as const) {
      if (asset.views[view]?.[layer]?.paths.some((path) => path.nodeId === nodeId && path.kind === kind)) out.push({ view, layer });
    }
  }
  return out;
}
