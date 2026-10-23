import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { registeredRegionIndex, specializationRegionIndex } from "@shared/specialization/regionIndex";
import { regionDataFor } from "@shared/specialization/registry";
import { loadableRegionIds, loadedRegionData, loadRegionData } from "./loadRegion";

/**
 * Each production region's page data loads on its own (docs/specialization-atlas/
 * 10-multi-region.md §6.1): one loader per production region of the light index, each handing
 * out the registry's data for that region, kept once loaded, and nothing for a region with no page.
 */
describe("the region loader", () => {
  it("has one loader for each production region of the index, and none for a reference region", () => {
    expect([...loadableRegionIds].sort()).toEqual(specializationRegionIndex.map((region) => region.id).sort());
    for (const region of registeredRegionIndex.filter((item) => item.status !== "production")) expect(loadableRegionIds).not.toContain(region.id);
  });

  it("hands out the registry's data for each region, and keeps it for the rest of the visit", async () => {
    for (const id of loadableRegionIds) {
      const data = await loadRegionData(id);
      expect(data).toBe(regionDataFor(id));
      expect(loadedRegionData(id)).toBe(data);
      // A second call is the same data, not a second import.
      expect(await loadRegionData(id)).toBe(data);
    }
  });

  it("starts a region's load for the page's chunk to wait for, once, a region with no page loading nothing", async () => {
    // A fresh loader (this file's other tests have loaded every region already).
    vi.resetModules();
    const fresh = await import("./loadRegion");
    expect(fresh.loadedRegionData("forearm")).toBeNull();
    fresh.preloadRegionData("forearm");
    fresh.preloadRegionData("forearm");
    // A region with no page (none is a reference region from wave A on, so a name the index lacks).
    fresh.preloadRegionData("lower_leg");
    expect(fresh.loadedRegionData("forearm")).toBeNull();
    await fresh.regionLoadsSettled();
    expect(fresh.loadedRegionData("forearm")?.region.id).toBe("forearm");
    expect(fresh.loadedRegionData("lower_leg")).toBeNull();
    // A region never asked for is not loaded.
    expect(fresh.loadedRegionData("upper_arm")).toBeNull();
    // With nothing loading, it settles at once; a load asked for again is the one already made.
    await fresh.regionLoadsSettled();
    expect(await fresh.loadRegionData("forearm")).toBe(fresh.loadedRegionData("forearm"));
  });

  it("has nothing for a region with no page, and has not loaded one it was never asked for", async () => {
    expect(await loadRegionData("lower_leg")).toBeNull();
    expect(await loadRegionData("nowhere")).toBeNull();
    expect(loadedRegionData("lower_leg")).toBeNull();
    // A name on Object.prototype is not a loader.
    expect(await loadRegionData("toString")).toBeNull();
  });
});

/**
 * What a region's chunk carries (10-multi-region.md §6.1): its own drawing, and of its external
 * members' homes the content only (`regions/<home>/content.ts`), never their drawings. Read from
 * the static imports of each region's `index.ts`, followed through every module it reaches in the
 * repository; a dynamic import is a chunk of its own and is not followed.
 */
describe("a region's chunk", () => {
  const root = process.cwd();
  const regionsDir = join(root, "shared/specialization/regions");
  const regionIds = readdirSync(regionsDir).filter((name) => statSync(join(regionsDir, name)).isDirectory());
  const resolveImport = (from: string, specifier: string): string | null => {
    const base = specifier.startsWith("@shared/") ? join(root, "shared", specifier.slice("@shared/".length))
      : specifier.startsWith("@/") ? join(root, "client/src", specifier.slice(2))
      : specifier.startsWith(".") ? resolve(dirname(from), specifier)
      : null;
    if (!base) return null;
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    throw new Error(`${relative(root, from)} imports ${specifier}, which does not resolve`);
  };
  /** Every module `entry` reaches by static imports (type-only imports leave nothing in a chunk). */
  const closureOf = (entry: string): string[] => {
    const seen = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/^(?:import|export)\s+(?!type\b)(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/gm)) {
        const target = resolveImport(file, match[1]);
        if (target) visit(target);
      }
    };
    visit(entry);
    return Array.from(seen).map((file) => relative(root, file));
  };
  const drawingsIn = (files: string[]) => files.filter((file) => /^shared\/specialization\/regions\/[^/]+\/diagram\.generated\.ts$/.test(file));

  it("holds its own drawing and no other region's, and of a home only what the page reads", () => {
    expect(regionIds).toEqual(expect.arrayContaining(["forearm", "upper_arm"]));
    for (const id of regionIds) {
      const closure = closureOf(join(regionsDir, id, "index.ts"));
      const own = `shared/specialization/regions/${id}/diagram.generated.ts`;
      expect(drawingsIn(closure).filter((file) => file !== own), id).toEqual([]);
    }
    // The forearm's reaches the upper arm as the home of the biceps and brachialis only through what its page reads of it
    // (regions/forearm/upperArmHome.ts, wave A): not the upper arm's whole content, its index, its triceps rows, its own
    // claims and sources, or the whole variant library (§6.1's download gate).
    const forearm = closureOf(join(regionsDir, "forearm/index.ts"));
    expect(forearm).toContain("shared/specialization/regions/forearm/upperArmHome.ts");
    for (const file of [
      "shared/specialization/regions/upper_arm/index.ts",
      "shared/specialization/regions/upper_arm/content.ts",
      "shared/specialization/regions/upper_arm/claims.ts",
      "shared/specialization/regions/upper_arm/nodes.ts",
      "shared/specialization/regions/upper_arm/mappings/index.ts",
      "shared/specialization/regions/upper_arm/mappings/pressesPushes.ts",
      "shared/specialization/regions/upper_arm/mappings/extensionsOther.ts",
      "shared/specialization/sources/upper_arm.ts",
      "shared/specialization/sources/upper_arm-pullsCurls.ts",
      "shared/specialization/sources/upper_arm-pressesPushes.ts",
      "shared/specialization/variants/index.ts",
      "shared/specialization/variants/upperArm.ts",
    ]) expect(forearm, file).not.toContain(file);
    expect(drawingsIn(forearm)).toEqual(["shared/specialization/regions/forearm/diagram.generated.ts"]);
    // The upper arm's reaches the forearm's content, as the home of the brachioradialis, and not its index.
    const upperArm = closureOf(join(regionsDir, "upper_arm/index.ts"));
    expect(upperArm).toContain("shared/specialization/regions/forearm/content.ts");
    expect(upperArm).not.toContain("shared/specialization/regions/forearm/index.ts");
    expect(drawingsIn(upperArm)).toEqual(["shared/specialization/regions/upper_arm/diagram.generated.ts"]);
  });

  it("leaves the whole variant library out of the page's own chunk: a region's data carries the records its page reads", () => {
    // The page, its calculator and its plan reader read variants from the region's data (its version's, its homes', and the
    // library's records of exercises tagged with its keys, `taggedVariants`), never the library, so opening one region does
    // not download every region's variants (10-multi-region.md §6.1; wave A).
    for (const entry of ["client/src/components/specialization/SpecializationPanel.tsx", "shared/specialization/exposure.ts", "client/src/lib/specialization/useSpecializationSummary.ts"]) {
      const closure = closureOf(join(root, entry));
      expect(closure, entry).not.toContain("shared/specialization/variants/index.ts");
      expect(closure.filter((file) => /^shared\/specialization\/regions\//.test(file) && !/\/(ids|region)\.ts$/.test(file)), entry).toEqual([]);
    }
  });

  it("reads a home through its content, which holds no drawing at all", () => {
    for (const id of regionIds) {
      const content = join(regionsDir, id, "content.ts");
      expect(existsSync(content), `${id} has a content.ts`).toBe(true);
      expect(drawingsIn(closureOf(content)), id).toEqual([]);
    }
  });
});
