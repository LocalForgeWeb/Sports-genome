import type { DiagramAsset, DiagramLayerId, DiagramPath, DiagramViewId } from "@shared/specialization/types";

/**
 * Plain geometry the diagram renderer needs from a path's `d`, worked out once per asset:
 * where a muscle is widest (its label and tap anchor) and how big it is (the hit order).
 * No DOM measuring, so it runs the same in a test as on a phone. Region-agnostic: it reads
 * any asset's paths, whatever region they draw.
 */

export type Point = { x: number; y: number };

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

/** Candidate anchors: the middle of the inside interval of horizontal slices through the shape, with its width. */
export function sliceCentres(points: readonly Point[], count = 48): { point: Point; width: number }[] {
  if (!points.length) return [];
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));
  const out: { point: Point; width: number }[] = [];
  for (let k = 1; k < count; k++) {
    const y = top + ((bottom - top) * k) / count;
    for (const [left, right] of slice(points, y)) out.push({ point: { x: (left + right) / 2, y }, width: right - left });
  }
  return out;
}

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
  const byNode = new Map<string, { bellies: DiagramPath[]; tendons: DiagramPath[] }>();
  for (const path of paths) {
    if (!path.nodeId || (path.kind !== "belly" && path.kind !== "tendon")) continue;
    const entry = byNode.get(path.nodeId) ?? { bellies: [], tendons: [] };
    (path.kind === "belly" ? entry.bellies : entry.tendons).push(path);
    byNode.set(path.nodeId, entry);
  }
  const nodes = Array.from(byNode.entries())
    .filter(([, entry]) => entry.bellies.length > 0)
    .map(([nodeId, entry]) => {
      const polygons = entry.bellies.map((path) => flattenPath(path.d));
      const areas = polygons.map(polygonArea);
      const largest = polygons[areas.indexOf(Math.max(...areas))];
      const centres = sliceCentres(largest);
      const widest = centres.reduce((best, item) => (item.width > best.width ? item : best), centres[0] ?? { point: { x: 0, y: 0 }, width: 0 });
      return { nodeId, ...entry, area: areas.reduce((sum, value) => sum + value, 0), labelAnchor: widest.point, hitAnchor: widest.point, centres };
    });

  // Tap squares, smallest node first (it has the fewest places to go): each takes the point
  // inside its own belly whose square overlaps no square already placed (Chebyshev distance
  // of a full side) and stays on the canvas, preferring wide slices and, among equals, the
  // node's widest point. Bigger nodes, placed later, have room to step round the small ones.
  const placed: Point[] = [];
  // The side a square centred here could have without touching a placed square or leaving the canvas.
  const room = (point: Point) => Math.min(
    side,
    ...placed.map((other) => Math.max(Math.abs(other.x - point.x), Math.abs(other.y - point.y))),
    ...(canvas ? [2 * point.x, 2 * (canvas.width - point.x), 2 * point.y, 2 * (canvas.height - point.y)] : []),
  );
  for (const node of [...nodes].sort((left, right) => left.area - right.area)) {
    let best = node.hitAnchor;
    let bestScore = -Infinity;
    for (const centre of node.centres) {
      const score = room(centre.point) * 100 + centre.width - Math.hypot(centre.point.x - node.labelAnchor.x, centre.point.y - node.labelAnchor.y) / 100;
      if (score > bestScore) { bestScore = score; best = centre.point; }
    }
    node.hitAnchor = best;
    placed.push(best);
  }
  return nodes.map(({ centres: _centres, ...node }) => node);
}

export type Placement = { view: DiagramViewId; layer: DiagramLayerId };

/** Every view and layer in which a node is drawn as a belly (where to find a muscle that is not on screen). */
export function placementsOf(asset: DiagramAsset, nodeId: string, kind: DiagramPath["kind"] = "belly"): Placement[] {
  const out: Placement[] = [];
  for (const view of ["palm", "back", "thumb"] as const) {
    for (const layer of ["surface", "intermediate", "deep"] as const) {
      if (asset.views[view]?.[layer]?.paths.some((path) => path.nodeId === nodeId && path.kind === kind)) out.push({ view, layer });
    }
  }
  return out;
}
