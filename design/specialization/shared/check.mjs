/**
 * Measures a region's drawing instead of eyeballing it: for every pair of bellies in one layer,
 * whether they overlap and how wide the gutter between them is, and any belly outline that
 * leaves the skin. Used while drawing, and mirrored by the contract test
 * (client/src/lib/specialization/diagramContract.test.ts).
 *
 *   node design/specialization/shared/check.mjs <region>
 *
 * Reads the views as authored (muscles by short name), so it runs before the region's data
 * lists its members. Gutters under 8 units are reported as advice, not failures.
 */
import { loadConfig, loadViews, regionArgument } from "./region.mjs";

/** Flattens an absolute M/C/L/Z path into a polygon. */
export function flatten(d, steps = 10) {
  const tokens = d.match(/[MCLZ]|-?\d+(?:\.\d+)?/g);
  const out = [];
  let i = 0;
  let cur = [0, 0];
  let cmd = "";
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MCLZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "Z") continue;
    if (cmd === "M" || cmd === "L") { cur = [num(), num()]; out.push(cur); continue; }
    if (cmd === "C") {
      const c1 = [num(), num()], c2 = [num(), num()], p = [num(), num()];
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, u = 1 - t;
        out.push([
          u * u * u * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p[0],
          u * u * u * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p[1],
        ]);
      }
      cur = p;
    }
  }
  return out;
}

export function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function segDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function minDistance(a, b) {
  let best = Infinity;
  for (const p of a) for (let i = 0; i < b.length; i++) best = Math.min(best, segDist(p, b[i], b[(i + 1) % b.length]));
  return best;
}

export function overlapCount(a, b) {
  return a.filter((p) => inside(p, b)).length + b.filter((p) => inside(p, a)).length;
}

export function area(poly) {
  let sum = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) sum += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  return Math.abs(sum / 2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const region = regionArgument(process.argv.slice(2), "node design/specialization/shared/check.mjs <region>");
  // The canvas the asset's viewBox is written from: outline points above or below it are cropped, not outside.
  const { height } = (await loadConfig(region)).CANVAS;
  const views = await loadViews(region);
  for (const [view, layers] of Object.entries(views)) {
    for (const [layer, drawn] of Object.entries(layers)) {
      const bellies = drawn.paths.filter((path) => path.kind === "belly").map((path) => ({ name: path.node, poly: flatten(path.d) }));
      const skin = drawn.paths.find((path) => path.kind === "skin");
      const skinPoly = skin ? flatten(skin.d) : null;
      const lines = [];
      for (let i = 0; i < bellies.length; i++) {
        if (skinPoly) {
          const outside = bellies[i].poly.filter((p) => !inside(p, skinPoly) && p[1] > 0 && p[1] < height).length;
          if (outside) lines.push(`  ${bellies[i].name} has ${outside} outline points outside the skin`);
        }
        for (let j = i + 1; j < bellies.length; j++) {
          const overlap = overlapCount(bellies[i].poly, bellies[j].poly);
          const gap = minDistance(bellies[i].poly, bellies[j].poly);
          if (overlap || gap < 8) lines.push(`  ${bellies[i].name}–${bellies[j].name}: ${overlap ? `OVERLAP ${overlap} pts` : `gap ${gap.toFixed(1)}`}`);
        }
      }
      console.log(`${view} ${layer}: ${bellies.map((b) => `${b.name} ${Math.round(area(b.poly))}`).join(", ")}`);
      for (const line of lines) console.log(line);
    }
  }
}
