import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { coreForearmMuscleIds, forearmAdjacentIds, forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { regionDataFor } from "@shared/specialization/registry";
import { selectableNodes } from "../model";
import { anatomyModelFor, canonicalForModelSource, forearmModelCanonicalIds, forearmModelSourceToCanonical, modelSourceForCanonical } from "./modelIdentity";
import { manifestById, muscleManifest } from "./muscleManifest";

/**
 * The 3D model's identity adapter (SG-FOREARM-INTEGRATION-20261019 §4): one explicit row per
 * structure, one to one, reversible, and every mesh it names really in the GLB that ships.
 */

const PUBLIC = join(process.cwd(), "client/public");
const GLB = join(PUBLIC, "assets/anatomy/upper-limb-open3dmodel.glb");
const data = regionDataFor("forearm")!;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The node names in a GLB's JSON chunk (the binary chunk is not needed to know what is in it). */
function glbNodeNames(path: string): string[] {
  const file = readFileSync(path);
  expect(file.readUInt32LE(0)).toBe(0x46546c67); // "glTF"
  const jsonLength = file.readUInt32LE(12);
  expect(file.readUInt32LE(16)).toBe(0x4e4f534a); // "JSON"
  const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString("utf8")) as { nodes?: { name?: string }[] };
  return (gltf.nodes ?? []).map((node) => node.name ?? "");
}

describe("source id ↔ canonical id", () => {
  const rows = Object.entries(forearmModelSourceToCanonical);

  it("has 20 structures: the 19 core muscles and anconeus, kept apart as the 20th", () => {
    expect(rows).toHaveLength(20);
    const canonical = rows.map(([, id]) => id);
    expect([...canonical].sort()).toEqual([...coreForearmMuscleIds, forearmAdjacentIds.anconeus].sort());
    expect(coreForearmMuscleIds).not.toContain(forearmAdjacentIds.anconeus);
    expect(data.nodes.find((node) => node.id === forearmAdjacentIds.anconeus)?.role).toBe("adjacent");
  });

  it("is one to one, both ways", () => {
    expect(new Set(rows.map(([source]) => source)).size).toBe(20);
    expect(new Set(rows.map(([, canonical]) => canonical)).size).toBe(20);
    for (const [source, canonical] of rows) {
      expect(canonicalForModelSource(source)).toBe(canonical);
      expect(modelSourceForCanonical(canonical)).toBe(source);
    }
  });

  it("covers every entry of the supplied manifest and nothing else", () => {
    expect(muscleManifest.map((entry) => entry.id).sort()).toEqual(rows.map(([source]) => source).sort());
    expect(forearmModelCanonicalIds).toHaveLength(20);
  });

  it("names only muscles the atlas has, each selectable on the page", () => {
    const selectable = new Set(selectableNodes(data).map((node) => node.id));
    for (const [, canonical] of rows) expect(selectable.has(canonical), canonical).toBe(true);
  });

  it("matches nothing by substring, name or case: an unknown id is null, never a guess", () => {
    for (const unknown of ["flexor", "Flexor carpi ulnaris", "FLEXOR-CARPI-ULNARIS", "flexor-carpi", "fcu", "forearm.fcu", "", null, undefined]) {
      expect(canonicalForModelSource(unknown)).toBeNull();
    }
    for (const notDrawn of ["upper_arm.biceps", "upper_arm.brachialis", "forearm.anterior", "forearm.posterior", "forearm.nope", "flexor-carpi-ulnaris", null]) {
      expect(modelSourceForCanonical(notDrawn)).toBeNull();
    }
  });
});

describe("the meshes behind each structure", () => {
  it("lights every head of a multi-head muscle: FDS, FCU, pronator teres and ECU each name two meshes", () => {
    for (const canonical of [m.flexorDigitorumSuperficialis, m.flexorCarpiUlnaris, m.pronatorTeres, m.extensorCarpiUlnaris]) {
      const entry = manifestById[modelSourceForCanonical(canonical)!];
      expect(entry.meshNames.length, canonical).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives no mesh to two muscles", () => {
    const all = muscleManifest.flatMap((entry) => entry.meshNames.map(normalize));
    expect(new Set(all).size).toBe(all.length);
  });

  it("names meshes that are really in the GLB that ships, the file the supplied checksum describes", () => {
    expect(existsSync(GLB)).toBe(true);
    const sums = readFileSync(join(PUBLIC, "assets/anatomy/SHA256SUMS.txt"), "utf8");
    const digest = createHash("sha256").update(readFileSync(GLB)).digest("hex");
    expect(sums).toContain(digest);
    const names = new Set(glbNodeNames(GLB).map(normalize));
    for (const entry of muscleManifest) for (const mesh of entry.meshNames) expect(names.has(normalize(mesh)), `${entry.id}: ${mesh}`).toBe(true);
  });
});

describe("where the model's files are", () => {
  it("serves the model and the Draco decoder from the app's own public folder, for the forearm only", () => {
    const config = anatomyModelFor("forearm")!;
    expect(config.modelUrl).toBe("/assets/anatomy/upper-limb-open3dmodel.glb");
    expect(config.decoderPath).toBe("/draco/");
    expect(existsSync(join(PUBLIC, config.modelUrl))).toBe(true);
    for (const file of ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"]) expect(existsSync(join(PUBLIC, config.decoderPath, file)), file).toBe(true);
    expect(anatomyModelFor("deltoid")).toBeNull();
  });
});
