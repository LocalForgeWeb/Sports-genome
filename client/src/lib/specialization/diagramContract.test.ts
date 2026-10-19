import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { specializationRegions } from "@shared/specialization/registry";
import type { AnatomyNode, DiagramAsset, DiagramLayerId, DiagramPath, DiagramViewId, SpecializationRegionData } from "@shared/specialization/types";
import { HIT_SQUARE_SHARE } from "@/components/specialization/SpecializationDiagram";
import { containsPoint, drawableNodeIds, drawnNodes, flattenPath, polygonArea, type Point } from "@/components/specialization/diagramGeometry";
import { deltoidRegionData } from "./__fixtures__/deltoidRegion";
// The shared generator, so every committed drawing is checked against what it produces.
import { buildAsset, drawableMembers } from "../../../../design/specialization/shared/asset.mjs";
import { exportStem, renderModule } from "../../../../design/specialization/shared/emit.mjs";
import { C, clipBy, clipToPolygon, closed, columnsShape, edgeAt, fan, insetPolygon, labels, rotate, rowsShape } from "../../../../design/specialization/shared/geometry.mjs";

/**
 * The drawing contract (10-multi-region.md §7.3; 02-design.md §12): what every region's drawing
 * keeps, run over every drawing the registry and the test fixtures provide. The manifest (brief
 * §6, "Publish an SVG ID manifest and validate every selectable path against the catalog"), the
 * kinds and the parent rule, the path grammar, the own-layer and outcrop rules, overlaps,
 * labels, and the tap squares the renderer places. Each region's own test keeps its orientation
 * and landmarks (forearmDiagram.test.ts). The tap squares' size on a phone, measured in
 * Chromium at 375 and 390, is design/specialization/shared/render-evidence.mjs's gate.
 */

type Outcrop = { pathId: string; nodeId: string; view: string; layer: string; note: string };
type Config = {
  REGION: string;
  ASSET_KEY: string;
  CANVAS: { width: number; height: number };
  STRUCTURE_WORDS?: string[];
  COVER_BOUNDS?: Record<string, number>;
  LIST_ONLY?: Record<string, string>;
};
type Drawing = { name: string; region: string; data: SpecializationRegionData; asset: DiagramAsset; config: Config | null; buildViews: (() => unknown) | null; outcrops: readonly Outcrop[] };

const folderOf = (path: string, up: number) => path.split("/").at(-1 - up)!;
const configs = new Map(Object.entries(import.meta.glob<Config>("../../../../design/specialization/*/config.mjs", { eager: true })).map(([path, module]) => [folderOf(path, 1), module]));
const authored = new Map(Object.entries(import.meta.glob<{ buildViews: () => unknown }>("../../../../design/specialization/*/views/index.mjs", { eager: true })).map(([path, module]) => [folderOf(path, 2), module.buildViews]));
const generated = new Map(Object.entries(import.meta.glob<Record<string, unknown>>("../../../../shared/specialization/regions/*/diagram.generated.ts", { eager: true })).map(([path, module]) => [folderOf(path, 1), module]));

/** Regions only tests register, with drawings of their own: they keep the contract too. */
const fixtures: readonly SpecializationRegionData[] = [deltoidRegionData];

/**
 * Checks a drawing does not pass yet, by region and check, each with the reason. They run as
 * `it.fails`, so each entry stays true: once the drawing is fixed the run fails until the entry
 * goes. Only test fixtures may be listed; a region's drawing keeps the whole contract.
 */
const NOT_YET: Record<string, Record<string, string>> = {
  [deltoidRegionData.region.id]: {
    skin: "its few hand-written curves cross its own skin outline in the front, side and rear views",
    overlap: "its front view's two bellies share an edge",
  },
};

const drawings: Drawing[] = [...specializationRegions, ...fixtures].filter((data) => data.diagram).map((data) => {
  const region = data.region.id;
  const module = generated.get(region);
  return {
    name: `${region}${data.region.status === "fixture" ? " (test fixture)" : ""}`,
    region,
    data,
    asset: data.diagram!,
    config: configs.get(region) ?? null,
    buildViews: authored.get(region) ?? null,
    outcrops: (module?.[`${exportStem(region)}DiagramOutcrops`] as readonly Outcrop[] | undefined) ?? [],
  };
});

const LAYERS: readonly DiagramLayerId[] = ["surface", "intermediate", "deep"];
const STRUCTURE_KINDS = new Set(["skin", "bone", "outline"]);
/** The most of a layer's drawn muscle any drawing may have under another muscle's tap square. */
const COVER_CEILING = 0.1;

type Placed = DiagramPath & { view: DiagramViewId; layer: DiagramLayerId };
const placedOf = (asset: DiagramAsset): Placed[] => asset.viewOrder.flatMap(({ id: view }) => LAYERS.flatMap((layer) => (asset.views[view]?.[layer]?.paths ?? []).map((path) => ({ ...path, view, layer }))));
const layersOf = (asset: DiagramAsset) => asset.viewOrder.flatMap(({ id: view }) => LAYERS.filter((layer) => asset.views[view]?.[layer]).map((layer) => ({ view, layer, drawn: asset.views[view]![layer]! })));

function inside(point: Point, polygon: readonly Point[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

it("finds the drawings: every registered region's, and the fixtures'", () => {
  expect(drawings.map((drawing) => drawing.region)).toEqual(expect.arrayContaining(["forearm", deltoidRegionData.region.id]));
});

it("lets only a test fixture's drawing leave a check for later", () => {
  for (const region of Object.keys(NOT_YET)) {
    expect(fixtures.find((data) => data.region.id === region)?.region.status, region).toBe("fixture");
    expect(configs.has(region), region).toBe(false);
  }
});

it("draws every region drawn in design/specialization/ as its registered region's diagram", () => {
  for (const [region, config] of configs) {
    const data = specializationRegions.find((item) => item.region.id === region);
    expect(data, `${region} is registered`).toBeDefined();
    expect(config.REGION, region).toBe(region);
    expect(data!.diagram?.key, region).toBe(config.ASSET_KEY);
    expect(authored.has(region), `${region} has views/index.mjs`).toBe(true);
  }
});

for (const drawing of drawings) {
  const { asset, data, config } = drawing;
  const members = new Map(data.nodes.map((node) => [node.id, node] as const));
  const placed = placedOf(asset);
  const bellies = placed.filter((path) => path.kind === "belly");
  const layerIndex = (layer: AnatomyNode["layer"]) => LAYERS.indexOf(layer as DiagramLayerId);
  /** `it`, or `it.fails` for a check NOT_YET lists for this drawing, its reason in the test's name. */
  const check = (key: string, name: string, body: () => void) => {
    const reason = NOT_YET[drawing.region]?.[key];
    if (reason) it.fails(`${name} (not yet: ${reason})`, body);
    else it(name, body);
  };

  describe(`${drawing.name}: the manifest`, () => {
    if (config) {
      it("is the shared generator's output, byte for byte (run node design/specialization/shared/emit.mjs <region> after a change)", () => {
        const committed = readFileSync(join(process.cwd(), "shared/specialization/regions", drawing.region, "diagram.generated.ts"), "utf8");
        expect(committed).toBe(renderModule(config, drawing.buildViews!(), data.nodes));
        expect(generated.get(drawing.region)?.[`${exportStem(drawing.region)}Diagram`]).toBe(asset);
      });

      it("is drawn 360 units wide, so labels, pills and tap squares are the same size in every region", () => {
        expect(asset.viewBox.width).toBe(360);
        expect(asset.viewBox).toEqual(config.CANVAS);
      });
    }

    it("belongs to its region, with a licence note", () => {
      expect(asset.regionId).toBe(drawing.region);
      expect(asset.viewBox.width).toBeGreaterThan(0);
      expect(asset.viewBox.height).toBeGreaterThan(0);
      expect(asset.licenseNote.trim()).not.toBe("");
      const sides = (asset as DiagramAsset & { sides?: string }).sides;
      if (sides !== undefined) expect(["one_side", "both_sides"]).toContain(sides);
    });

    it("lists its views in the page's order, each once, with button words of 10 characters or fewer", () => {
      expect(Object.keys(asset.views)).toEqual(asset.viewOrder.map((view) => view.id));
      expect(new Set(asset.viewOrder.map((view) => view.id)).size).toBe(asset.viewOrder.length);
      for (const view of asset.viewOrder) {
        expect(view.id, view.label).toMatch(/^[a-z][a-z0-9_]*$/);
        expect(view.label.trim(), view.id).not.toBe("");
        expect(view.label.length, view.label).toBeLessThanOrEqual(10);
        for (const layer of Object.keys(asset.views[view.id]!)) expect(LAYERS, `${view.id}/${layer}`).toContain(layer);
      }
    });

    it("gives every path a unique, well-formed id that names its view, layer and node", () => {
      const ids = placed.map((path) => path.id);
      expect(new Set(ids).size).toBe(ids.length);
      const shortNames = new Set(data.nodes.map((node) => node.shortName.toLowerCase()));
      for (const path of placed) {
        const match = /^([a-z][a-z0-9_]*)__(surface|intermediate|deep)__([a-z][a-z0-9-]*)__(\d+)$/.exec(path.id);
        expect(match, path.id).not.toBeNull();
        expect([match![1], match![2]], path.id).toEqual([path.view, path.layer]);
        if (path.nodeId) expect(match![3], path.id).toBe(members.get(path.nodeId)?.shortName.toLowerCase());
        else {
          expect(shortNames.has(match![3]), `${path.id}: a structure is not named like a muscle`).toBe(false);
          if (config?.STRUCTURE_WORDS) expect(config.STRUCTURE_WORDS, path.id).toContain(match![3]);
        }
      }
    });

    it("numbers each name's paths from 1 in draw order", () => {
      for (const { view, layer, drawn } of layersOf(asset)) {
        const counts = new Map<string, number>();
        for (const path of drawn.paths) {
          const name = path.id.split("__")[2];
          const next = (counts.get(name) ?? 0) + 1;
          expect(path.id.endsWith(`__${next}`), `${view}/${layer} ${path.id}`).toBe(true);
          counts.set(name, next);
        }
      }
    });

    it("ties every belly, tendon and ghost to one of the region's members, and structure to none", () => {
      for (const path of placed) {
        if (STRUCTURE_KINDS.has(path.kind)) expect(path.nodeId, path.id).toBeNull();
        else expect(path.nodeId && members.has(path.nodeId), `${path.id} → ${path.nodeId}`).toBe(true);
      }
    });

    it("draws muscles and heads only, and never a node that is another node's parent", () => {
      const drawable = drawableNodeIds(data.nodes);
      const parents = new Set(data.nodes.map((node) => node.parentId).filter(Boolean));
      for (const path of placed.filter((item) => item.nodeId)) {
        const node = members.get(path.nodeId!)!;
        expect(["muscle", "head"], `${path.id} draws a ${node.kind}`).toContain(node.kind);
        expect(parents.has(node.id), `${path.id} draws ${node.id}, which is a parent`).toBe(false);
        expect(drawable.has(node.id), path.id).toBe(true);
      }
      // The generator's table follows the same rule.
      expect(new Set([...drawableMembers(data.nodes).values()].map((node: { id: string }) => node.id))).toEqual(drawable);
    });

    it("writes outlines as absolute curves with one decimal, closed unless a line", () => {
      for (const path of placed) {
        expect(path.d, path.id).toMatch(config ? /^M[-\d. ]+( [CL][-\d. ]+)+( Z)?$/ : /^M[-\d. ]+( [CLQ][-\d. ]+)+( Z)?$/);
        for (const number of path.d.match(/-?[\d.]+/g)!) expect(number, path.id).toMatch(/^-?\d+(\.\d)?$/);
        if (path.kind !== "outline") expect(path.d.endsWith(" Z"), path.id).toBe(true);
        expect(path.d, `${path.id} is curved`).toMatch(/ [CQ]/);
      }
    });

    it("draws one skin outline under everything else on every layer", () => {
      for (const { view, layer, drawn } of layersOf(asset)) {
        expect(drawn.paths[0]?.kind, `${view}/${layer}`).toBe("skin");
        expect(drawn.paths.filter((path) => path.kind === "skin"), `${view}/${layer}`).toHaveLength(1);
      }
    });
  });

  describe(`${drawing.name}: what is drawn where`, () => {
    it("draws every target muscle as a belly on its own layer in at least one view", () => {
      const drawable = drawableNodeIds(data.nodes);
      const listOnly = config?.LIST_ONLY ?? {};
      const onOwnLayer = new Set(bellies.filter((path) => members.get(path.nodeId!)?.layer === path.layer).map((path) => path.nodeId));
      const targets = data.nodes.filter((node) => node.role === "target" && drawable.has(node.id) && !listOnly[node.id]);
      expect(targets.filter((node) => !onOwnLayer.has(node.id)).map((node) => node.id)).toEqual([]);
      for (const [id, reason] of Object.entries(listOnly)) {
        expect(members.has(id), id).toBe(true);
        expect(bellies.some((path) => path.nodeId === id), `${id} is list-only`).toBe(false);
        expect(reason.length, id).toBeGreaterThan(20);
      }
    });

    it("draws a belly off its own layer only as a listed outcrop, above that layer, of a muscle that shows there", () => {
      const off = bellies.filter((path) => members.get(path.nodeId!)!.layer !== path.layer);
      expect(off.map((path) => path.id).sort()).toEqual(drawing.outcrops.map((item) => item.pathId).sort());
      for (const path of off) {
        const node = members.get(path.nodeId!)!;
        expect(layerIndex(node.layer), `${node.id} has one layer`).toBeGreaterThanOrEqual(0);
        expect(LAYERS.indexOf(path.layer), `${path.id} is above ${node.layer}`).toBeLessThan(layerIndex(node.layer));
        expect(node.surfaceVisibility, path.id).not.toBe("not_distinct");
      }
      for (const item of drawing.outcrops) {
        const path = placed.find((candidate) => candidate.id === item.pathId);
        expect([path?.kind, path?.nodeId, path?.view, path?.layer], item.pathId).toEqual(["belly", item.nodeId, item.view, item.layer]);
        expect(item.note.length, item.pathId).toBeGreaterThan(40);
      }
    });

    it("cuts each outcrop from its muscle as its own layer draws it, in a view that has that layer", () => {
      // Changing layer must never move a muscle: the part that shows above is part of the muscle
      // underneath, not a shape of its own. Sampled on a grid.
      for (const item of drawing.outcrops) {
        const own = members.get(item.nodeId)!.layer as DiagramLayerId;
        const ownLayer = asset.views[item.view]?.[own];
        expect(ownLayer, `${item.view} draws ${own}, ${item.nodeId}'s own layer`).toBeDefined();
        const wholes = ownLayer!.paths.filter((path) => path.kind === "belly" && path.nodeId === item.nodeId).map((path) => flattenPath(path.d));
        expect(wholes.length, `${item.nodeId} is drawn whole on ${item.view}/${own}`).toBeGreaterThan(0);
        const tendons = ownLayer!.paths.filter((path) => path.kind === "tendon" && path.nodeId === item.nodeId).map((path) => flattenPath(path.d));
        const outcrop = flattenPath(placed.find((candidate) => candidate.id === item.pathId)!.d);
        const xs = outcrop.map((point) => point.x);
        const ys = outcrop.map((point) => point.y);
        let sampled = 0;
        let inWhole = 0;
        let onTendonOnly = 0;
        for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.5) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 0.5) {
          if (!inside({ x, y }, outcrop)) continue;
          sampled++;
          if (wholes.some((whole) => inside({ x, y }, whole))) inWhole++;
          else if (tendons.some((tendon) => inside({ x, y }, tendon))) onTendonOnly++;
        }
        expect(sampled, item.pathId).toBeGreaterThan(200);
        expect(inWhole / sampled, `${item.pathId} lies within ${item.nodeId} on ${item.view}/${own}`).toBeGreaterThan(0.99);
        // Never muscle above where its own layer draws the tendon.
        expect(onTendonOnly, item.pathId).toBe(0);
        // Partial: much smaller than the muscle drawn whole.
        expect(polygonArea(outcrop), item.pathId).toBeLessThan(Math.max(...wholes.map(polygonArea)) * 0.75);
      }
    });

    it("draws no layer without a muscle on it", () => {
      for (const { view, layer, drawn } of layersOf(asset)) expect(drawn.paths.some((path) => path.kind === "belly"), `${view}/${layer}`).toBe(true);
    });

    check("skin", "keeps every belly inside the skin", () => {
      for (const { view, layer, drawn } of layersOf(asset)) {
        const skin = flattenPath(drawn.paths.find((path) => path.kind === "skin")!.d);
        for (const path of drawn.paths.filter((item) => item.kind === "belly")) {
          const outside = flattenPath(path.d).filter((point) => point.y > 0 && point.y < asset.viewBox.height && !inside(point, skin));
          expect(outside, `${view}/${layer}: ${path.id} leaves the skin`).toEqual([]);
        }
      }
    });

    check("overlap", "lets no two bellies on one layer overlap", () => {
      for (const { drawn } of layersOf(asset)) {
        const shapes = drawn.paths.filter((path) => path.kind === "belly").map((path) => ({ id: path.id, points: flattenPath(path.d) }));
        for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
          const overlap = shapes[i].points.filter((point) => inside(point, shapes[j].points)).length + shapes[j].points.filter((point) => inside(point, shapes[i].points)).length;
          expect(overlap, `${shapes[i].id} overlaps ${shapes[j].id}`).toBe(0);
        }
      }
    });

    it("never draws a tendon or a ghost of a muscle the drawing does not show as a belly", () => {
      const withBelly = new Set(bellies.map((path) => path.nodeId));
      expect(placed.filter((path) => (path.kind === "tendon" || path.kind === "ghost") && !withBelly.has(path.nodeId)).map((path) => path.id)).toEqual([]);
    });

    it("keeps its labels on the canvas", () => {
      for (const { view, layer, drawn } of layersOf(asset)) {
        for (const label of drawn.labels) {
          expect(label.text.trim(), `${view}/${layer}`).not.toBe("");
          expect(label.x, label.text).toBeGreaterThanOrEqual(0);
          expect(label.x, label.text).toBeLessThanOrEqual(asset.viewBox.width);
          expect(label.y, label.text).toBeGreaterThan(0);
          expect(label.y, label.text).toBeLessThan(asset.viewBox.height);
        }
      }
    });
  });

  describe(`${drawing.name}: tap squares and anchors, as the renderer places them`, () => {
    const side = HIT_SQUARE_SHARE * asset.viewBox.width;
    const placedNodes = layersOf(asset).map(({ view, layer, drawn }) => ({ key: `${view}/${layer}`, paths: drawn.paths, nodes: drawnNodes(drawn.paths, { square: side, canvas: asset.viewBox }) }));

    it("gives every muscle a square inside its own belly, on the canvas, overlapping no other square", () => {
      for (const { key, paths, nodes } of placedNodes) {
        for (const node of nodes) {
          const own = paths.filter((path) => path.kind === "belly" && path.nodeId === node.nodeId).map((path) => flattenPath(path.d));
          expect(own.some((points) => containsPoint(points, node.hitAnchor)), `${key} ${node.nodeId}'s square is centred on it`).toBe(true);
          expect(node.hitAnchor.x - side / 2, `${key} ${node.nodeId}`).toBeGreaterThanOrEqual(-0.01);
          expect(node.hitAnchor.y - side / 2, `${key} ${node.nodeId}`).toBeGreaterThanOrEqual(-0.01);
          expect(node.hitAnchor.x + side / 2, `${key} ${node.nodeId}`).toBeLessThanOrEqual(asset.viewBox.width + 0.01);
          expect(node.hitAnchor.y + side / 2, `${key} ${node.nodeId}`).toBeLessThanOrEqual(asset.viewBox.height + 0.01);
        }
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i].hitAnchor;
          const b = nodes[j].hitAnchor;
          expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)), `${key}: ${nodes[i].nodeId} and ${nodes[j].nodeId}`).toBeGreaterThanOrEqual(side - 0.01);
        }
      }
    });

    it("keeps every selected muscle's label anchor on the drawing, so its leader line ends on it", () => {
      // Before: brachioradialis from behind runs off the top of the canvas and its anchor sat at y -8.
      for (const { key, nodes } of placedNodes) {
        for (const node of nodes) {
          expect(node.labelAnchor.y, `${key} ${node.nodeId}`).toBeGreaterThanOrEqual(10);
          expect(node.labelAnchor.y, `${key} ${node.nodeId}`).toBeLessThanOrEqual(asset.viewBox.height - 10);
          expect(node.labelAnchor.x, `${key} ${node.nodeId}`).toBeGreaterThanOrEqual(0);
          expect(node.labelAnchor.x, `${key} ${node.nodeId}`).toBeLessThanOrEqual(asset.viewBox.width);
        }
      }
    });

    it("places each square where it covers little of other muscles as drawn (a tap there selects the square's muscle)", () => {
      // The squares sit above the bellies. A drawn region states its bound per view and layer
      // (its config's COVER_BOUNDS); none may pass the ceiling.
      const bounds = config?.COVER_BOUNDS ?? null;
      if (bounds) expect(Object.keys(bounds).sort()).toEqual(placedNodes.map(({ key }) => key).sort());
      for (const { key, paths, nodes } of placedNodes) {
        const bound = bounds?.[key] ?? COVER_CEILING;
        expect(bound, key).toBeLessThanOrEqual(COVER_CEILING);
        const shapes = paths.filter((path) => path.kind === "belly" && path.nodeId).map((path) => ({ nodeId: path.nodeId!, points: flattenPath(path.d) }));
        let drawn = 0;
        let taken = 0;
        const step = asset.viewBox.width / 120;
        for (let y = step / 3; y < asset.viewBox.height; y += step) {
          for (let x = step / 3; x < asset.viewBox.width; x += step) {
            const top = [...shapes].reverse().find((shape) => containsPoint(shape.points, { x, y }));
            if (!top) continue;
            drawn++;
            const square = nodes.find((node) => Math.abs(node.hitAnchor.x - x) <= side / 2 && Math.abs(node.hitAnchor.y - y) <= side / 2);
            if (square && square.nodeId !== top.nodeId) taken++;
          }
        }
        expect(taken / drawn, key).toBeLessThanOrEqual(bound);
      }
    });
  });
}

describe("the shared generator", () => {
  // A tiny region: a muscle split into two heads, a group, and a muscle of another region.
  const members = [
    { id: "r.whole", parentId: null, kind: "muscle", shortName: "Whole" },
    { id: "r.front", parentId: "r.whole", kind: "head", shortName: "Front" },
    { id: "r.back", parentId: "r.whole", kind: "head", shortName: "Back" },
    { id: "r.group", parentId: null, kind: "group", shortName: "Group" },
    { id: "other.m", parentId: null, kind: "muscle", shortName: "Other" },
  ];
  const config = { REGION: "r", ASSET_KEY: "r_schematic", ASSET_VERSION: 1, CANVAS: { width: 360, height: 400 }, VIEW_ORDER: [{ id: "front", label: "Front" }], LICENSE_NOTE: "Drawn for this test." };
  const skin = { kind: "skin", structure: "skin", d: closed([[20, 20], [340, 20], [340, 380], [20, 380]]) };
  const viewsDrawing = (node: string) => ({ front: { surface: { paths: [skin, { kind: "belly", node, d: closed([[60, 60], [160, 60], [160, 300], [60, 300]]) }], labels: [] } } });

  it("derives the path names from the members that can be drawn: heads, not their parent, not a group", () => {
    expect([...drawableMembers(members).keys()].sort()).toEqual(["Back", "Front", "Other"]);
    const { asset } = buildAsset(config, viewsDrawing("Front"), members);
    expect(asset.views.front.surface.paths.map((path: DiagramPath) => [path.id, path.nodeId])).toEqual([["front__surface__skin__1", null], ["front__surface__front__1", "r.front"]]);
    expect(() => buildAsset(config, viewsDrawing("Whole"), members)).toThrow(/another node's parent/);
    expect(() => buildAsset(config, viewsDrawing("Group"), members)).toThrow(/a group/);
    expect(() => buildAsset(config, viewsDrawing("Nobody"), members)).toThrow(/unknown node Nobody/);
    expect(() => buildAsset({ ...config, LIST_ONLY: { "r.front": "Too thin for a 44 pt square." } }, viewsDrawing("Front"), members)).toThrow(/list-only/);
  });

  it("refuses two drawable members whose short names are the same in lower case", () => {
    expect(() => drawableMembers([...members, { id: "other.front", parentId: null, kind: "muscle", shortName: "FRONT" }])).toThrow(/share the path name front/);
    expect(() => drawableMembers([{ id: "r.x", parentId: null, kind: "muscle", shortName: "Glute max" }])).toThrow(/short name/);
  });

  it("writes a sides line only when the config sets one", () => {
    expect(renderModule(config, viewsDrawing("Front"), members)).not.toContain("sides:");
    const module = renderModule({ ...config, SIDES: "one_side" }, viewsDrawing("Front"), members);
    expect(module).toContain('  sides: "one_side",\n  viewOrder:');
    expect(module).toContain("export const rDiagram: DiagramAsset = {");
    expect(exportStem("lower_leg")).toBe("lowerLeg");
    expect(() => renderModule({ ...config, SIDES: "left" }, viewsDrawing("Front"), members)).toThrow(/one_side or both_sides/);
  });

  it("cuts an outline on any side, and to a convex window, with square corners where it is cut", () => {
    const square = [[0, 0], [100, 0], [100, 100], [0, 100]];
    for (const [side, test] of [["below", (p: number[]) => p[1] >= 40], ["above", (p: number[]) => p[1] <= 40], ["right", (p: number[]) => p[0] >= 40], ["left", (p: number[]) => p[0] <= 40]] as const) {
      const cut = clipBy(square, side, 40);
      expect(cut.every(test), side).toBe(true);
      expect(cut.filter((point: unknown[]) => point[2] === C), side).toHaveLength(2);
    }
    const window = [[50, -10], [130, 50], [50, 110], [-30, 50]];
    const inWindow = clipToPolygon(square, window);
    expect(inWindow.length).toBeGreaterThanOrEqual(4);
    const windowPoints = window.map(([x, y]) => ({ x, y }));
    for (const [x, y] of inWindow) expect(inside({ x: x + (50 - x) * 1e-6, y: y + (50 - y) * 1e-6 }, windowPoints), `${x},${y}`).toBe(true);
    expect(() => clipToPolygon(square, [[0, 0], [100, 0], [50, 20], [100, 100], [0, 100]])).toThrow(/convex/);
  });

  it("slices a belly lying across into columns, as rowsShape slices one running up and down", () => {
    const across = flattenPath(columnsShape({ columns: [[20, 40, 60], [100, 30, 70], [180, 40, 60]] }));
    const upright = flattenPath(rowsShape({ rows: [[20, 40, 60], [100, 30, 70], [180, 40, 60]] }));
    // The same shape with x and y exchanged.
    expect(across.map((point) => [point.y, point.x])).toEqual(upright.map((point) => [point.x, point.y]));
    // Through each column's top and bottom, left to right.
    for (const [x, top, bottom] of [[100, 30, 70]]) expect(across.some((point) => Math.abs(point.x - x) < 0.5 && Math.abs(point.y - top) < 0.5) && across.some((point) => Math.abs(point.x - x) < 0.5 && Math.abs(point.y - bottom) < 0.5)).toBe(true);
  });

  it("turns, fans and insets outlines, and reads an edge along either axis", () => {
    expect(rotate([[10, 0, C]], 90).map(([x, y, flag]: [number, number, string?]) => [Math.round(x), Math.round(y), flag])).toEqual([[0, 10, C]]);
    const shape = fan([[0, 0], [50, -10], [100, 0]], [[45, 100], [55, 100]], { bulge: 0.1 });
    expect(shape.filter((point: unknown[]) => point[2] === C)).toHaveLength(4);
    // The border from the origin's end to the insertion bows outward, away from the fan's middle.
    expect(shape[3][0]).toBeGreaterThan((100 + 55) / 2);
    const inset = insetPolygon([[0, 0], [100, 0], [100, 100], [0, 100]], 5);
    expect(inset.map(([x, y]: number[]) => [Math.round(x), Math.round(y)])).toEqual([[5, 5], [95, 5], [95, 95], [5, 95]]);
    expect(insetPolygon([[0, 0], [0, 100], [100, 100], [100, 0]], 5).map(([x, y]: number[]) => [Math.round(x), Math.round(y)])).toEqual([[5, 5], [5, 95], [95, 95], [95, 5]]);
    const ridge = [[0, 50], [100, 20], [200, 40]];
    expect(edgeAt(ridge, "x", 50)).toBeCloseTo(35);
    expect(edgeAt([[10, 0], [30, 100]], "y", 50)).toBeCloseTo(20);
  });

  it("sets a layer's labels in the margins of the canvas", () => {
    expect(labels(360, [["Inner", "left", 100], ["Outer", "right", 100]])).toEqual([{ text: "Inner", x: 10, y: 100, anchor: "start" }, { text: "Outer", x: 350, y: 100, anchor: "end" }]);
  });
});
