import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { forearmModelSourceToCanonical } from "@/components/specialization/anatomy3d/modelIdentity";
import { decodeLabels, labelAt, plateLayers, plateViews } from "@/components/specialization/plates";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmAdjacentIds, FOREARM_REGION_ID } from "@shared/specialization/regions/forearm/ids";
import { forearmPlates, forearmPlateSlugToNode } from "@shared/specialization/regions/forearm/plates";
import { forearmPlateFrame, forearmPlatePasses } from "@shared/specialization/regions/forearm/plates.generated";

/**
 * The forearm's rendered plates (the owner's package, 23 Oct 2026; docs/specialization-atlas/
 * 08-diagram.md "Plates"): which package muscle is which atlas node, every muscle on a pass, the
 * served files within their budget, and the label images read back pixel for pixel.
 */

const root = process.cwd();
const manifest = JSON.parse(readFileSync(join(root, "design/specialization/forearm-plates/upload/public/assets/anatomy/mesh-plates/manifest.json"), "utf8")) as { passes: Record<string, { muscles: string[] }> };
const packageSlugs = new Set(Object.values(manifest.passes).flatMap((pass) => pass.muscles));
const publicFile = (path: string) => join(root, "client/public", path);

/** An 8-bit greyscale PNG, read with nothing but zlib: its header, its chunk types and its pixels. */
function readGreyPng(file: string) {
  const data = readFileSync(file);
  expect(Array.from(data.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  let offset = 8;
  const header = { width: 0, height: 0, bitDepth: 0, colourType: -1, interlace: -1 };
  const types: string[] = [];
  const idat: Buffer[] = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const body = data.subarray(offset + 8, offset + 8 + length);
    types.push(type);
    if (type === "IHDR") Object.assign(header, { width: body.readUInt32BE(0), height: body.readUInt32BE(4), bitDepth: body[8], colourType: body[9], interlace: body[12] });
    if (type === "IDAT") idat.push(body);
    offset += 12 + length;
  }
  const { width, height } = header;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = new Uint8Array(width * height);
  let previous = new Uint8Array(width);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (width + 1)];
    const line = raw.subarray(y * (width + 1) + 1, (y + 1) * (width + 1));
    const current = new Uint8Array(width);
    for (let x = 0; x < width; x++) {
      const a = x ? current[x - 1] : 0;
      const b = previous[x];
      const c = x ? previous[x - 1] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      current[x] = value & 255;
    }
    pixels.set(current, y * width);
    previous = current;
  }
  return { ...header, types, pixels };
}

/** A lossy WebP with alpha (VP8X): its canvas size. */
function webpSize(file: string) {
  const data = readFileSync(file);
  expect(data.toString("ascii", 0, 4)).toBe("RIFF");
  expect(data.toString("ascii", 8, 16)).toBe("WEBPVP8X");
  return { width: data.readUIntLE(24, 3) + 1, height: data.readUIntLE(27, 3) + 1, alpha: Boolean(data[20] & 0x10) };
}

describe("which package muscle is which atlas node", () => {
  it("maps all 20 of the package's muscles, and only them, each to its own node", () => {
    expect(packageSlugs.size).toBe(20);
    expect(Object.keys(forearmPlateSlugToNode).sort()).toEqual(Array.from(packageSlugs).sort());
    const nodeIds = Object.values(forearmPlateSlugToNode);
    expect(new Set(nodeIds).size).toBe(20);
  });

  it("maps only to the forearm's own muscles: its 19 targets and the adjacent anconeus", () => {
    const own = forearmRegionData.nodes.filter((node) => node.regionId === FOREARM_REGION_ID);
    for (const [slug, nodeId] of Object.entries(forearmPlateSlugToNode)) {
      const node = own.find((item) => item.id === nodeId);
      expect(node, slug).toBeDefined();
      expect(node!.kind, slug).toBe("muscle");
      expect(["target", "adjacent"], slug).toContain(node!.role);
    }
    expect(Object.values(forearmPlateSlugToNode).filter((nodeId) => own.find((node) => node.id === nodeId)?.role === "adjacent")).toEqual([forearmAdjacentIds.anconeus]);
  });

  it("is the 3D model's table, row for row: the same source names one muscle in both", () => {
    expect(forearmPlateSlugToNode).toEqual(forearmModelSourceToCanonical);
  });

  it("gives each pass's labels in the generated order, every one through the table", () => {
    expect(forearmPlates.passes.map((pass) => pass.nodeIds)).toEqual(forearmPlatePasses.map((pass) => pass.muscles.map((muscle) => forearmPlateSlugToNode[muscle.slug as keyof typeof forearmPlateSlugToNode])));
    for (const pass of forearmPlatePasses) expect(pass.muscles.map((muscle) => muscle.slug).sort(), pass.id).toEqual([...manifest.passes[pass.id].muscles].sort());
  });
});

describe("every muscle on a pass", () => {
  it("shows every forearm target muscle, and the anconeus, on at least one pass, with pixels to tap", () => {
    const targets = forearmRegionData.nodes.filter((node) => node.regionId === FOREARM_REGION_ID && node.role === "target").map((node) => node.id);
    expect(targets).toHaveLength(19);
    for (const nodeId of [...targets, forearmAdjacentIds.anconeus]) {
      const shown = forearmPlatePasses.flatMap((pass) => pass.muscles.filter((muscle) => forearmPlateSlugToNode[muscle.slug as keyof typeof forearmPlateSlugToNode] === nodeId));
      expect(shown.length, nodeId).toBeGreaterThan(0);
      expect(Math.max(...shown.map((muscle) => muscle.area)), nodeId).toBeGreaterThanOrEqual(30);
    }
  });

  it("offers three views in the drawing's own words, each at surface and deep, one pass each", () => {
    expect(plateViews(forearmPlates)).toEqual(forearmRegionData.diagram!.viewOrder);
    for (const view of plateViews(forearmPlates)) expect(plateLayers(forearmPlates, view.id), view.id).toEqual(["surface", "deep"]);
    expect(new Set(forearmPlates.passes.map((pass) => `${pass.view}/${pass.layer}`)).size).toBe(6);
    expect(forearmRegionData.plates).toBe(forearmPlates);
  });

  it("credits the source model, its licences, and says the images are adapted renders", () => {
    const words = forearmPlates.credit.map((part) => (typeof part === "string" ? part : part.text)).join("");
    expect(words).toMatch(/Open3Dmodel upper-limb model/);
    expect(words).toMatch(/BodyParts3D .*CC BY-SA 2\.1 Japan/);
    expect(words).toMatch(/Z-Anatomy \(CC BY-SA 4\.0\)/);
    expect(words).toMatch(/adapted renders/);
    expect(words).toMatch(/never mirrored/);
    for (const part of forearmPlates.credit) if (typeof part !== "string") expect(part.href).toMatch(/^https:\/\//);
  });
});

describe("the served files", () => {
  it("are the generated ones, each pass within 150 KB and all within 900 KB", () => {
    let total = 0;
    const sums = new Map(readFileSync(publicFile("assets/anatomy/forearm-plates/SHA256SUMS.txt"), "utf8").trim().split("\n").map((line) => { const [digest, name] = line.split(/\s+/); return [name, digest] as const; }));
    for (const pass of forearmPlatePasses) {
      const image = readFileSync(publicFile(pass.image));
      const labels = readFileSync(publicFile(pass.labels));
      expect(image.length, pass.image).toBe(pass.bytes.image);
      expect(labels.length, pass.labels).toBe(pass.bytes.labels);
      expect(image.length + labels.length, pass.id).toBeLessThanOrEqual(150 * 1024);
      expect(createHash("sha256").update(image).digest("hex")).toBe(sums.get(pass.image.split("/").pop()!));
      expect(createHash("sha256").update(labels).digest("hex")).toBe(sums.get(pass.labels.split("/").pop()!));
      total += image.length + labels.length;
    }
    expect(total).toBeLessThanOrEqual(900 * 1024);
    // The 12.6 MB originals are not shipped.
    expect(existsSync(join(root, "client/public/assets/anatomy/mesh-plates"))).toBe(false);
  });

  it("frames every plate the same: a WebP with alpha, the frame's size", () => {
    for (const pass of forearmPlatePasses) expect(webpSize(publicFile(pass.image)), pass.id).toEqual({ ...forearmPlateFrame, alpha: true });
  });
});

describe("the label images read back", () => {
  for (const pass of forearmPlatePasses) {
    it(`${pass.id}: one 8-bit greyscale label per pixel, each muscle's index on exactly its pixels`, () => {
      const png = readGreyPng(publicFile(pass.labels));
      expect({ width: png.width, height: png.height }).toEqual(forearmPlateFrame);
      expect([png.bitDepth, png.colourType, png.interlace]).toEqual([8, 0, 0]);
      // No gamma, colour profile or sRGB chunk: a canvas reads the values back exactly.
      expect(png.types.filter((type) => ["gAMA", "iCCP", "sRGB", "cHRM"].includes(type))).toEqual([]);
      const counts = new Array(pass.muscles.length + 1).fill(0);
      let over = 0;
      for (const value of png.pixels) value <= pass.muscles.length ? counts[value]++ : over++;
      expect(over).toBe(0);
      expect(counts.slice(1)).toEqual(pass.muscles.map((muscle) => muscle.area));
      // Read through the renderer's decoder, as a canvas hands it over (RGBA, grey in each colour).
      const rgba = new Uint8ClampedArray(png.pixels.length * 4);
      png.pixels.forEach((value, index) => { rgba.set([value, value, value, 255], index * 4); });
      const decoded = decodeLabels(rgba, png.width, png.height, pass.muscles.length);
      expect(Array.from(decoded)).toEqual(Array.from(png.pixels));
      // A tap on each muscle's own pixel finds it.
      pass.muscles.forEach((_, index) => {
        const at = png.pixels.indexOf(index + 1);
        expect(labelAt(decoded, png.width, png.height, (at % png.width) + 0.5, Math.floor(at / png.width) + 0.5, 0)).toBe(index + 1);
      });
    });
  }
});
