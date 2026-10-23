import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveMembers } from "@shared/specialization/compose";
import { forearmHomeContent } from "@shared/specialization/regions/forearm/content";
import { forearmDiagram } from "@shared/specialization/regions/forearm/diagram.generated";
import { upperArmHomeContent } from "@shared/specialization/regions/upper_arm/content";
import { upperArmDiagram, upperArmDiagramOutcrops } from "@shared/specialization/regions/upper_arm/diagram.generated";
import { upperArmAdjacentIds as adj, upperArmExternalIds as ext, upperArmGroupIds as grp, upperArmMuscleIds as m } from "@shared/specialization/regions/upper_arm/ids";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import type { DiagramAsset, DiagramLayerId, DiagramPath, DiagramViewId } from "@shared/specialization/types";
import { drawableNodeIds, flattenPath, polygonArea, type Point } from "@/components/specialization/diagramGeometry";
// The generator and the region's own drawing, so the committed asset is checked against what they produce.
import * as config from "../../../../design/specialization/upper_arm/config.mjs";
import { buildViews } from "../../../../design/specialization/upper_arm/views/index.mjs";
import { ELBOW_DROP } from "../../../../design/specialization/upper_arm/silhouettes.mjs";
import { renderModule } from "../../../../design/specialization/shared/emit.mjs";

/**
 * The upper arm's drawing: what is particular to it. The rules every region's drawing keeps (the
 * path manifest, kinds and parents, the own-layer and outcrop rules, overlaps, labels, tap
 * squares, the Chromium gate on record) are in diagramContract.test.ts, which runs over this
 * drawing too. Here: its views and layers, a path for every member at its layer, its outcrops'
 * shape, the anatomy it has to get right (which side is outer in each view, what is deep and what
 * is surface, the shared triceps tendon), ends and landmarks, and the elbow it shares with the
 * forearm drawing (docs/specialization-atlas/regions/upper_arm/diagram.md).
 */

const asset = upperArmDiagram;
/** The members as the page will list them (its own nodes, then the forearm's brachioradialis). */
const members = resolveMembers(upperArmHomeContent, [forearmHomeContent]).map(({ node, role }) => (role === node.role ? node : { ...node, role }));
const nodes = new Map(members.map((node) => [node.id, node] as const));
const VIEWS: DiagramViewId[] = ["front", "back"];
const LAYERS: DiagramLayerId[] = ["surface", "intermediate", "deep"];
const W = asset.viewBox.width;

type Placed = DiagramPath & { view: DiagramViewId; layer: DiagramLayerId };
const placedOf = (drawing: DiagramAsset, views: readonly string[]): Placed[] => views.flatMap((view) => LAYERS.flatMap((layer) => (drawing.views[view]?.[layer]?.paths ?? []).map((path) => ({ ...path, view, layer }))));
const placed = placedOf(asset, VIEWS);
const bellies = placed.filter((path) => path.kind === "belly");
const layerOf = (view: DiagramViewId, layer: DiagramLayerId) => asset.views[view]![layer]!;
const pathById = (drawing: DiagramAsset, id: string) => placedOf(drawing, drawing.viewOrder.map((view) => view.id)).find((path) => path.id === id)!;

function inside(point: Point, polygon: readonly Point[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}
const centroid = (path: DiagramPath): Point => {
  const points = flattenPath(path.d);
  return { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length };
};
const ys = (path: DiagramPath) => flattenPath(path.d).map((point) => point.y);
const bellyOf = (view: DiagramViewId, layer: DiagramLayerId, nodeId: string) => {
  const found = layerOf(view, layer).paths.filter((path) => path.kind === "belly" && path.nodeId === nodeId);
  expect(found.length, `${nodeId} has a belly in ${view}/${layer}`).toBe(1);
  return found[0];
};
/** Where a closed outline crosses the height y: its leftmost and rightmost crossings. */
function across(path: DiagramPath, y: number): [number, number] {
  const points = flattenPath(path.d, 24);
  const xs: number[] = [];
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j];
    const b = points[i];
    if ((a.y > y) !== (b.y > y)) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
  }
  return [Math.min(...xs), Math.max(...xs)];
}
/** The shortest distance from a point to a closed outline. */
function distanceToOutline(point: Point, outline: readonly Point[]): number {
  let best = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy)));
  }
  return best;
}
/** A path's points moved from the forearm drawing to this one's elbow. */
const dropped = (path: DiagramPath) => flattenPath(path.d).map((point) => ({ x: point.x, y: point.y + ELBOW_DROP }));

describe("the upper arm's drawing", () => {
  it("is exactly what the generator writes from this folder (run node design/specialization/shared/emit.mjs upper_arm after a change)", () => {
    const committed = readFileSync(join(process.cwd(), "shared/specialization/regions/upper_arm/diagram.generated.ts"), "utf8");
    expect(committed).toBe(renderModule(config, buildViews(), members));
    expect(committed).toContain("Generated by design/specialization/shared/emit.mjs");
    expect(committed).toContain("docs/specialization-atlas/regions/upper_arm/diagram.md");
  });

  it("is the upper arm's, 360 × 760, one side (the subject's right arm), an original schematic", () => {
    expect(asset.key).toBe("upper_arm_schematic");
    expect(asset.version).toBe(1);
    expect(asset.regionId).toBe("upper_arm");
    expect(asset.viewBox).toEqual({ width: 360, height: 760 });
    expect(asset.sides).toBe("one_side");
    expect(asset.licenseNote).toMatch(/^Original artwork drawn for Sports Genome/);
    expect(asset.licenseNote).toMatch(/Not traced or copied from any illustration, photograph or 3D model/);
  });

  it("is not yet the region's drawing on any page or in the seed: the integration lane promotes it", () => {
    // Wave A's drawing lane draws it; registering it changes the seed, which is the integration lane's.
    expect(upperArmContent.diagram).toBeNull();
    expect(upperArmContent.region.status).toBe("reference");
  });

  it("has §7.2's views and layers: Front and Back, each a surface and a deep layer, no middle layer", () => {
    expect(asset.viewOrder).toEqual([{ id: "front", label: "Front" }, { id: "back", label: "Back" }]);
    expect(Object.keys(asset.views)).toEqual(VIEWS);
    for (const view of VIEWS) expect(Object.keys(asset.views[view]!), view).toEqual(["surface", "deep"]);
  });
});

describe("a path for every member, at its layer", () => {
  it("draws every member that can be drawn, by its short name, and never the triceps itself", () => {
    const drawable = drawableNodeIds(members);
    expect([...drawable].sort()).toEqual([m.biceps, m.brachialis, m.tricepsLong, m.tricepsLateral, m.tricepsMedial, adj.coracobrachialis, ext.brachioradialis].sort());
    expect(drawable.has(grp.triceps)).toBe(false);
    expect(placed.filter((path) => path.nodeId === grp.triceps)).toEqual([]);
    const drawn = new Set(bellies.map((path) => path.nodeId));
    expect([...drawable].filter((id) => !drawn.has(id))).toEqual([]);
    // Path names are the short names of §1.2, the external's its home's.
    const names = new Map(bellies.map((path) => [path.nodeId, path.id.split("__")[2]] as const));
    expect(Object.fromEntries([...names].sort())).toEqual({
      [ext.brachioradialis]: "br",
      [m.biceps]: "biceps",
      [m.brachialis]: "brachialis",
      [m.tricepsLateral]: "trilat",
      [m.tricepsLong]: "trilong",
      [m.tricepsMedial]: "trimed",
      [adj.coracobrachialis]: "cb",
    });
  });

  it("puts each muscle where its layer and view have it", () => {
    const where = (id: string) => bellies.filter((path) => path.nodeId === id).map((path) => `${path.view}/${path.layer}`).sort();
    // Surface: the biceps and the long and lateral heads; the forearm's brachioradialis on the outer border.
    expect(where(m.biceps)).toEqual(["front/surface"]);
    expect(where(m.tricepsLong)).toEqual(["back/surface"]);
    expect(where(m.tricepsLateral)).toEqual(["back/surface"]);
    expect(where(ext.brachioradialis)).toEqual(["front/surface"]);
    // Deep, whole on their own layer, each with one outcrop above it.
    expect(where(m.brachialis)).toEqual(["front/deep", "front/surface"]);
    expect(where(m.tricepsMedial)).toEqual(["back/deep", "back/surface"]);
    // Deep, and not distinct at the surface: on the deep layer only.
    expect(where(adj.coracobrachialis)).toEqual(["front/deep"]);
    for (const path of bellies) {
      const node = nodes.get(path.nodeId!)!;
      const outcrop = upperArmDiagramOutcrops.some((item) => item.pathId === path.id);
      expect(outcrop ? "deep" : path.layer, path.id).toBe(node.layer);
    }
  });

  it("lists exactly the two outcrops §1.2 names: brachialis on Front · Surface, the medial head on Back · Surface", () => {
    expect(upperArmDiagramOutcrops.map((item) => [item.nodeId, item.view, item.layer])).toEqual([
      [m.brachialis, "front", "surface"],
      [m.tricepsMedial, "back", "surface"],
    ]);
    for (const item of upperArmDiagramOutcrops) {
      const node = nodes.get(item.nodeId)!;
      expect([node.layer, node.surfaceVisibility], item.pathId).toEqual(["deep", "partial"]);
    }
    expect(nodes.get(adj.coracobrachialis)!.surfaceVisibility).toBe("not_distinct");
  });

  it("cuts each outcrop from its muscle's own outline in the same view: part of it, below its upper end", () => {
    for (const item of upperArmDiagramOutcrops) {
      const outcrop = pathById(asset, item.pathId);
      const whole = bellyOf(item.view as DiagramViewId, "deep", item.nodeId);
      // Below where the muscles over it stop covering it, never above the muscle's own upper end.
      expect(Math.min(...ys(outcrop)) - Math.min(...ys(whole)), item.pathId).toBeGreaterThan(30);
      // Small next to the muscle drawn whole: the medial head's, weakly supported, smallest of all.
      expect(polygonArea(flattenPath(outcrop.d)) / polygonArea(flattenPath(whole.d)), item.pathId).toBeLessThan(item.nodeId === m.tricepsMedial ? 0.1 : 0.2);
    }
  });

  it("shows the brachialis beside the lower half of the biceps on the outer side, between it and brachioradialis", () => {
    const outcrop = pathById(asset, upperArmDiagramOutcrops[0].pathId);
    const biceps = bellyOf("front", "surface", m.biceps);
    const br = bellyOf("front", "surface", ext.brachioradialis);
    expect(centroid(outcrop).x).toBeLessThan(centroid(biceps).x);
    expect(Math.min(...ys(outcrop))).toBeGreaterThan(300);
    expect(Math.max(...ys(outcrop))).toBeLessThan(Math.max(...ys(biceps)));
    // Brachioradialis starts on the ridge above the outer epicondyle, below the outcrop's upper end.
    expect(Math.min(...ys(br))).toBeGreaterThan(Math.min(...ys(outcrop)));
  });

  it("shows the medial head on the inner side just above the elbow, ending where the medial head ends", () => {
    const outcrop = pathById(asset, upperArmDiagramOutcrops[1].pathId);
    const whole = bellyOf("back", "deep", m.tricepsMedial);
    const longHead = bellyOf("back", "surface", m.tricepsLong);
    expect(centroid(outcrop).x).toBeLessThan(W / 2);
    // In the lower fifth of the arm, below the long head's lower border (no overlap: the contract test).
    expect(Math.min(...ys(outcrop))).toBeGreaterThan(440);
    expect(Math.min(...ys(outcrop))).toBeGreaterThan(Math.min(...ys(longHead)) + 400);
    expect(Math.abs(Math.max(...ys(outcrop)) - Math.max(...ys(whole)))).toBeLessThan(10);
  });

  it("draws the triceps' common tendon as structure between the heads, to the olecranon, owned by no head", () => {
    const tendon = layerOf("back", "surface").paths.find((path) => path.id === "back__surface__triceps-tendon__1")!;
    expect([tendon.kind, tendon.nodeId]).toEqual(["outline", null]);
    const box = flattenPath(tendon.d);
    expect(centroid(tendon).x).toBeGreaterThan(centroid(bellyOf("back", "surface", m.tricepsLong)).x);
    expect(centroid(tendon).x).toBeLessThan(centroid(bellyOf("back", "surface", m.tricepsLateral)).x);
    const olecranon = flattenPath(layerOf("back", "surface").paths.find((path) => path.id === "back__surface__olecranon__1")!.d);
    expect(Math.max(...box.map((point) => point.y))).toBeGreaterThan(Math.min(...olecranon.map((point) => point.y)));
  });

  it("brings the long and lateral heads onto the common tendon, which narrows to the olecranon's width", () => {
    const tendon = layerOf("back", "surface").paths.find((path) => path.id === "back__surface__triceps-tendon__1")!;
    const outline = flattenPath(tendon.d, 24);
    // Each head's lowest point lies on the tendon's border, within one gutter of it.
    for (const id of [m.tricepsLong, m.tricepsLateral]) {
      const points = flattenPath(bellyOf("back", "surface", id).d);
      const lowest = points.reduce((low, point) => (point.y > low.y ? point : low));
      expect(distanceToOutline(lowest, outline), id).toBeLessThanOrEqual(8);
    }
    // Where it reaches the olecranon it is no wider than the olecranon (it does not balloon there).
    const olecranon = flattenPath(layerOf("back", "surface").paths.find((path) => path.id === "back__surface__olecranon__1")!.d);
    const top = Math.min(...olecranon.map((point) => point.y));
    const [left, right] = across(tendon, top);
    expect(right - left).toBeLessThanOrEqual(Math.max(...olecranon.map((point) => point.x)) - Math.min(...olecranon.map((point) => point.x)) + 6);
  });

  it("runs only the long head off the top edge on the back: the one head that crosses the shoulder", () => {
    const offTop = layerOf("back", "surface").paths.filter((path) => path.nodeId && Math.min(...ys(path)) < 0).map((path) => path.id);
    expect(offTop).toEqual(["back__surface__trilong__2"]);
    expect(pathById(asset, "back__surface__trilong__2").kind).toBe("tendon");
    // The lateral head starts at its origin on the back of the humerus, below the greater tubercle, on both layers.
    expect(Math.min(...ys(bellyOf("back", "surface", m.tricepsLateral)))).toBeGreaterThanOrEqual(40);
    const ghost = layerOf("back", "deep").paths.find((path) => path.kind === "ghost" && path.nodeId === m.tricepsLateral)!;
    expect(Math.min(...ys(ghost))).toBeGreaterThanOrEqual(40);
  });

  it("draws tendons apart from the bellies, each narrow, and only the biceps', the long head's and brachialis'", () => {
    const tendons = placed.filter((path) => path.kind === "tendon");
    expect(tendons.map((path) => path.id).sort()).toEqual(["back__surface__trilong__2", "front__deep__brachialis__2", "front__surface__biceps__2", "front__surface__biceps__3", "front__surface__biceps__4"]);
    for (const path of tendons) expect(polygonArea(flattenPath(path.d)), path.id).toBeLessThan(2200);
  });
});

describe("orientation, for the subject's right arm (anatomical, never mirrored)", () => {
  const labelX = (view: DiagramViewId, text: string) => {
    for (const layer of ["surface", "deep"] as const) expect(layerOf(view, layer).labels.some((label) => label.text === text), `${view}/${layer} labels "${text}"`).toBe(true);
    return layerOf(view, "surface").labels.find((label) => label.text === text)!;
  };

  it("labels the outer side, the inner side, the shoulder and the elbow on every layer, in anatomical words only", () => {
    for (const view of VIEWS) for (const text of ["Outer side", "Inner side", "Shoulder", "Elbow"]) labelX(view, text);
    const words = [
      ...VIEWS.flatMap((view) => (["surface", "deep"] as const).flatMap((layer) => layerOf(view, layer).labels.map((label) => label.text))),
      ...upperArmDiagramOutcrops.map((item) => item.note),
      asset.licenseNote,
      ...asset.viewOrder.map((view) => view.label),
    ];
    // No screen-left or screen-right, no promise of growth or size.
    for (const text of words) {
      expect(text, text).not.toMatch(/\b(left|right)\b/i);
      expect(text, text).not.toMatch(/\b(grow|growth|gain|bigger|size|bulge|build)\b/i);
    }
  });

  it("from the front, has the outer side on the viewer's left: brachioradialis, the brachialis outcrop and the biceps' long head out there, coracobrachialis inside", () => {
    expect(labelX("front", "Outer side").x).toBeLessThan(W / 2);
    expect(labelX("front", "Inner side").x).toBeGreaterThan(W / 2);
    const biceps = centroid(bellyOf("front", "surface", m.biceps)).x;
    expect(centroid(bellyOf("front", "surface", ext.brachioradialis)).x).toBeLessThan(biceps);
    expect(centroid(pathById(asset, upperArmDiagramOutcrops[0].pathId)).x).toBeLessThan(biceps);
    const humerus = layerOf("front", "deep").paths.find((path) => path.id === "front__deep__humerus__1")!;
    expect(centroid(bellyOf("front", "deep", adj.coracobrachialis)).x).toBeGreaterThan(centroid(humerus).x);
    // The long head's tendon runs up on the outer side of the short head's, both off the top edge toward the shoulder blade.
    const [longHead, shortHead] = ["front__surface__biceps__2", "front__surface__biceps__3"].map((id) => pathById(asset, id));
    expect(centroid(longHead).x).toBeLessThan(centroid(shortHead).x);
    for (const tendon of [longHead, shortHead]) expect(Math.min(...ys(tendon)), tendon.id).toBeLessThan(0);
    // The inner epicondyle is marked on the inner side, as the forearm's palm view marks it.
    expect(centroid(layerOf("front", "surface").paths.find((path) => path.id === "front__surface__epicondyle__1")!).x).toBeGreaterThan(W / 2);
  });

  it("from behind, has the outer side on the viewer's right: the lateral head out there, the long head and the medial head's outcrop inside", () => {
    expect(labelX("back", "Outer side").x).toBeGreaterThan(W / 2);
    expect(labelX("back", "Inner side").x).toBeLessThan(W / 2);
    expect(centroid(bellyOf("back", "surface", m.tricepsLateral)).x).toBeGreaterThan(centroid(bellyOf("back", "surface", m.tricepsLong)).x);
    expect(centroid(pathById(asset, upperArmDiagramOutcrops[1].pathId)).x).toBeLessThan(W / 2);
    expect(centroid(layerOf("back", "surface").paths.find((path) => path.id === "back__surface__epicondyle__1")!).x).toBeLessThan(W / 2);
    // The ulna is on the inner side and the radius on the outer side, the forearm's back view's.
    const bone = (id: string) => centroid(layerOf("back", "deep").paths.find((path) => path.id === id)!);
    expect(bone("back__deep__ulna__1").x).toBeLessThan(bone("back__deep__radius__1").x);
    // The long head is the head that crosses the shoulder: its tendon runs off the top edge.
    expect(Math.min(...ys(pathById(asset, "back__surface__trilong__2")))).toBeLessThan(0);
  });

  it("is the same arm from both sides: the back outline is the front outline mirrored", () => {
    for (let y = 0; y <= 760; y += 20) {
      const [frontLeft, frontRight] = across(layerOf("front", "surface").paths[0], y);
      const [backLeft, backRight] = across(layerOf("back", "surface").paths[0], y);
      expect(Math.abs(backLeft - (W - frontRight)), `y ${y}`).toBeLessThan(0.5);
      expect(Math.abs(backRight - (W - frontLeft)), `y ${y}`).toBeLessThan(0.5);
    }
  });
});

describe("ends and landmarks", () => {
  const lowest = (path: DiagramPath) => Math.max(...ys(path));
  const bone = (view: DiagramViewId, structure: string) => layerOf(view, "deep").paths.find((path) => path.id === `${view}__deep__${structure}__1`)!;

  it("puts the elbow at the same height in both views: the humerus' lower end and the inner epicondyle", () => {
    expect(Math.abs(lowest(bone("front", "humerus")) - lowest(bone("back", "humerus")))).toBeLessThan(20);
    const mark = (view: DiagramViewId) => centroid(layerOf(view, "surface").paths.find((path) => path.id === `${view}__surface__epicondyle__1`)!).y;
    expect(Math.abs(mark("front") - mark("back"))).toBeLessThan(5);
    for (const view of VIEWS) expect(Math.min(...ys(bone(view, "humerus"))), view).toBeLessThan(0);
  });

  it("ends each muscle at the same height on every layer that shows it: ghosts are the bellies above, outcrops end where their muscle does", () => {
    for (const ghost of placed.filter((path) => path.kind === "ghost")) {
      const above = bellies.filter((path) => path.nodeId === ghost.nodeId && path.view === ghost.view && path.layer === "surface");
      expect(above.map((path) => path.d), ghost.id).toContain(ghost.d);
    }
    expect(placed.filter((path) => path.kind === "ghost").map((path) => path.nodeId).sort()).toEqual([m.biceps, m.tricepsLateral, m.tricepsLong, ext.brachioradialis].sort());
  });

  it("puts each bony landmark over its bone, and the biceps' and brachialis' lower ends at the elbow", () => {
    for (const view of VIEWS) {
      const marks = layerOf(view, "surface").paths.filter((path) => path.kind === "bone" || /__epicondyle__/.test(path.id));
      expect(marks.length, view).toBeGreaterThan(0);
      const bones = layerOf(view, "deep").paths.filter((path) => path.kind === "bone").map((path) => flattenPath(path.d));
      for (const mark of marks) expect(bones.some((points) => inside(centroid(mark), points)), `${mark.id} is over bone`).toBe(true);
    }
    // The ulna's back border below the elbow lies over the ulna.
    const border = flattenPath(layerOf("back", "surface").paths.find((path) => path.id === "back__surface__ulna__1")!.d);
    const ulna = flattenPath(bone("back", "ulna").d);
    expect(border.filter((point) => point.y > 620 && point.y < 770 && !inside(point, ulna)).map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)).toEqual([]);
    // The biceps' belly ends above the crease and brachialis below it, on the ulna.
    const crease = Math.min(...ys(layerOf("front", "surface").paths.find((path) => path.id === "front__surface__crease__1")!));
    expect(lowest(bellyOf("front", "surface", m.biceps))).toBeLessThan(crease);
    expect(lowest(bellyOf("front", "deep", m.brachialis))).toBeGreaterThan(crease - 10);
    expect(Math.min(...ys(bellyOf("front", "deep", m.brachialis)))).toBeGreaterThan(260);
  });
});

describe("the elbow it shares with the forearm drawing", () => {
  const forearm = (id: string) => pathById(forearmDiagram, id);
  const bone = (view: DiagramViewId) => layerOf(view, "deep").paths.find((path) => path.id === `${view}__deep__humerus__1`)!;
  const near = (a: Point[], b: Point[]) => Math.max(...a.map((point, index) => Math.hypot(point.x - b[index].x, point.y - b[index].y)));

  it("has the forearm drawing's outline from y 548, just above the epicondyles, toward the bottom edge, moved down", () => {
    for (const [view, forearmView] of [["front", "palm"], ["back", "back"]] as const) {
      const skin = layerOf(view, "surface").paths[0];
      const theirs = forearm(`${forearmView}__surface__skin__1`);
      for (let y = 548; y <= 730; y += 6) {
        const [left, right] = across(skin, y);
        const [forearmLeft, forearmRight] = across(theirs, y - ELBOW_DROP);
        expect(Math.abs(left - forearmLeft), `${view} y ${y}`).toBeLessThan(1);
        expect(Math.abs(right - forearmRight), `${view} y ${y}`).toBeLessThan(1);
      }
    }
  });

  it("draws the radius and the ulna below the elbow as the forearm drawing does, from their tops toward the bottom edge", () => {
    for (const [view, forearmView] of [["front", "palm"], ["back", "back"]] as const) {
      for (const structure of ["radius", "ulna"]) {
        const ours = layerOf(view, "deep").paths.find((path) => path.id === `${view}__deep__${structure}__1`)!;
        const theirs = forearm(`${forearmView}__deep__${structure}__1`);
        for (let y = Math.ceil(Math.min(...ys(ours))) + 6; y <= 730; y += 6) {
          const [left, right] = across(ours, y);
          const [forearmLeft, forearmRight] = across(theirs, y - ELBOW_DROP);
          expect(Math.abs(left - forearmLeft), `${view} ${structure} y ${y}`).toBeLessThan(1);
          expect(Math.abs(right - forearmRight), `${view} ${structure} y ${y}`).toBeLessThan(1);
        }
      }
    }
  });

  it("ends the biceps and brachialis where the forearm drawing ends them, with the same tendons", () => {
    expect(near(flattenPath(pathById(asset, "front__surface__biceps__4").d), dropped(forearm("palm__surface__biceps__2")))).toBeLessThan(0.2);
    expect(near(flattenPath(pathById(asset, "front__deep__brachialis__2").d), dropped(forearm("palm__deep__brachialis__2")))).toBeLessThan(0.2);
    expect(Math.abs(Math.max(...ys(bellyOf("front", "surface", m.biceps))) - Math.max(...dropped(forearm("palm__surface__biceps__1")).map((point) => point.y)))).toBeLessThan(1);
    expect(Math.abs(Math.max(...ys(bellyOf("front", "deep", m.brachialis))) - Math.max(...dropped(forearm("palm__deep__brachialis__1")).map((point) => point.y)))).toBeLessThan(1);
  });

  it("runs brachioradialis down the outer border as the forearm drawing does, and draws the elbow's bones and marks as it does", () => {
    const br = bellyOf("front", "surface", ext.brachioradialis);
    const theirs = forearm("palm__surface__br__1");
    for (let y = 620; y <= 740; y += 20) {
      const ours = across(br, y);
      const forearmAt = across(theirs, y - ELBOW_DROP);
      expect(Math.abs(ours[0] - forearmAt[0]), `y ${y}`).toBeLessThan(1);
      expect(Math.abs(ours[1] - forearmAt[1]), `y ${y}`).toBeLessThan(1);
    }
    for (const [ours, theirsId] of [
      ["front__surface__crease__1", "palm__surface__crease__1"],
      ["front__surface__epicondyle__1", "palm__surface__epicondyle__1"],
      ["back__surface__epicondyle__1", "back__surface__epicondyle__1"],
      ["back__surface__olecranon__1", "back__surface__olecranon__1"],
    ]) expect(near(flattenPath(pathById(asset, ours).d), dropped(forearm(theirsId))), ours).toBeLessThan(0.2);
    for (const [view, forearmView] of [["front", "palm"], ["back", "back"]] as const) {
      const humerusEnd = Math.max(...ys(bone(view)));
      expect(Math.abs(humerusEnd - Math.max(...dropped(forearm(`${forearmView}__deep__humerus__1`)).map((point) => point.y))), view).toBeLessThan(1);
    }
  });
});
