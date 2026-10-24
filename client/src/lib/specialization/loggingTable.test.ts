import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { emitHoldCatalogIds, emitLoggingFiles, emitLoggingTable, loggingTableRows, type LoggingRegionInput, type VariantLookup } from "../../../../scripts/specialization/emit-logging-table";
import { loggingTable } from "@shared/specialization/loggingTable.generated";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import { specializationRegions } from "@shared/specialization/registry";
import { variantFor } from "@shared/specialization/variants";
import type { ExerciseVariant, SpecializationRegion, VariantMapping } from "@shared/specialization/types";
import forearmAt6738eeb from "./__fixtures__/forearmRegionData.6738eeb.json";

/**
 * The workout logger reads one generated table instead of every region's variants and mappings
 * (10-multi-region.md §6.4). These keep the table and the light hold list equal to the registry and
 * the variant library, prove the forearm logs exactly as main does (4dac1ae: no arm asked, one row
 * per planned set; owner, 20 Oct 2026), and keep what the logger imports light for every region.
 */
describe("the generated files", () => {
  it("are what the emitter writes from the registry today (npx tsx scripts/specialization/emit-logging-table.ts)", () => {
    for (const { path, text } of emitLoggingFiles()) {
      expect(readFileSync(path, "utf8"), `${path} is stale: run npx tsx scripts/specialization/emit-logging-table.ts`).toBe(text);
    }
  });

  it("hold one row per catalog exercise a production region maps, read from the current variant", () => {
    const mapped = new Map<number, Set<string>>();
    const straps = new Map<number, Set<string>>();
    for (const data of specializationRegions.filter((item) => item.region.status === "production")) {
      for (const mapping of data.mappings.filter((item) => item.reviewStatus !== "rejected")) {
        const catalogId = data.variants.find((variant) => variant.id === mapping.variantId)!.catalogExerciseId;
        mapped.set(catalogId, (mapped.get(catalogId) ?? new Set()).add(data.region.id));
        if (mapping.requiresNoStraps) straps.set(catalogId, (straps.get(catalogId) ?? new Set()).add(data.region.id));
      }
    }
    expect([...loggingTable.keys()]).toEqual([...mapped.keys()].sort((a, b) => a - b));
    for (const [catalogId, row] of loggingTable) {
      const variant = variantFor(catalogId)!;
      expect(row, `catalog ${catalogId}`).toEqual({
        measure: variant.measure,
        laterality: variant.laterality,
        ...(variant.legLaterality ? { legLaterality: variant.legLaterality } : {}),
        sidedBy: variant.sidedBy,
        ...(variant.sideAnchor ? { sideAnchor: variant.sideAnchor } : {}),
        sideCounted: [...mapped.get(catalogId)!].some((id) => specializationRegions.some(({ region }) => region.id === id && region.sides.model === "paired" && region.sides.limb === variant.sidedBy)),
        strapsBy: [...(straps.get(catalogId) ?? [])],
        mappedBy: [...mapped.get(catalogId)!],
      });
    }
  });
});

describe("the forearm logs exactly as main does (4dac1ae), through the table", () => {
  // The policy on main (4dac1ae loggingPolicy.ts: both arms as one, so no arm asked and no row per
  // arm), over the forearm's variants and mappings as they shipped (6738eeb, unchanged since).
  const before = forearmAt6738eeb as unknown as { variants: ExerciseVariant[]; mappings: VariantMapping[] };
  const shippedPolicy = (catalogId: number) => {
    const variant = before.variants.find((item) => item.catalogExerciseId === catalogId);
    if (!variant) return { measure: "reps", askSide: false, oneArm: false, sideDefault: null, strapsSensitive: false };
    return {
      measure: variant.measure === "seconds" ? "seconds" : "reps",
      askSide: false,
      oneArm: false,
      sideDefault: variant.laterality === "either" ? "both" : null,
      strapsSensitive: before.mappings.some((mapping) => mapping.variantId === variant.id && mapping.requiresNoStraps && mapping.reviewStatus !== "rejected"),
    };
  };

  it("asks the same of every catalog exercise: measure, the arm, its default, one arm at a time, straps", () => {
    const ids = new Set([...before.variants.map((variant) => variant.catalogExerciseId), ...loggingTable.keys(), 1, 167, 173, 217, 247]);
    expect(ids.size).toBeGreaterThan(119);
    // Wave A: the upper arm maps exercises the forearm never did. The logger reads their variants as it reads the forearm's
    // (no arm asked, no straps question, reps), and an either-arm one starts its row on Both, as the forearm's do.
    const shipped = new Set(before.variants.map((variant) => variant.catalogExerciseId));
    for (const id of ids) {
      const { measure, askSide, oneArm, sideDefault, strapsSensitive } = loggingPolicyFor(id);
      const row = loggingTable.get(id);
      const expected = shipped.has(id) || !row ? shippedPolicy(id) : { measure: row.measure, askSide: false, oneArm: false, sideDefault: row.laterality === "either" ? "both" : null, strapsSensitive: false };
      expect({ measure, askSide, oneArm, sideDefault, strapsSensitive }, `catalog ${id}`).toEqual(expected);
      if (!shipped.has(id) && row) expect([row.mappedBy, row.strapsBy, row.measure], `catalog ${id}`).toEqual([["upper_arm"], [], "reps"]);
    }
  });

  it("asks no side of any exercise, of an arm or a leg, and lays no planned set out per side", () => {
    for (const id of loggingTable.keys()) {
      const policy = loggingPolicyFor(id);
      expect([policy.askSide, policy.oneArm], `catalog ${id}`).toEqual([false, false]);
      // The limb a side would be recorded on is still the variant's, for a decision that asks again.
      if (policy.sideLimb !== null) expect(policy.sideLimb, `catalog ${id}`).toBe("arm");
    }
  });
});

describe("the emitter", () => {
  const region = (id: string, sides: SpecializationRegion["sides"], status: SpecializationRegion["status"] = "production", sortOrder = 10) =>
    ({ id, status, sides, sortOrder } as SpecializationRegion);
  const variant = (catalogExerciseId: number, fields: Partial<ExerciseVariant> = {}) =>
    ({ id: `fx-${catalogExerciseId}`, catalogExerciseId, catalogName: `Exercise ${catalogExerciseId}`, measure: "reps", laterality: "bilateral", sidedBy: "none", ...fields } as ExerciseVariant);
  const mapping = (variantId: string, fields: Partial<VariantMapping> = {}) => ({ id: `${variantId}-m`, variantId, requiresNoStraps: false, reviewStatus: "reviewed", ...fields } as VariantMapping);
  const library = (...variants: ExerciseVariant[]): VariantLookup => ({ byId: new Map(variants.map((item) => [item.id, item])), current: (id) => variants.find((item) => item.catalogExerciseId === id && !variants.some((other) => other.replaces === item.id)) ?? null });

  const split = variant(173, { catalogName: "Bulgarian Split Squat", laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "front_leg" });
  const plank = variant(247, { catalogName: "Side Plank", measure: "seconds", laterality: "not_applicable", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "bottom_leg" });
  const carry = variant(409, { catalogName: "Suitcase Carry", measure: "seconds", laterality: "unilateral", sidedBy: "arm" });
  const regions: LoggingRegionInput[] = [
    { region: region("thigh", { model: "paired", limb: "leg" }, "production", 16), mappings: [mapping(split.id)] },
    { region: region("core", { model: "midline" }, "production", 12), mappings: [mapping(plank.id), mapping(carry.id), mapping(split.id, { reviewStatus: "rejected" })] },
    { region: region("forearm", { model: "paired", limb: "arm" }), mappings: [mapping(carry.id, { requiresNoStraps: true, reviewStatus: "draft" })] },
    { region: region("deltoid", { model: "paired", limb: "arm" }, "fixture"), mappings: [mapping(split.id, { requiresNoStraps: true })] },
  ];

  it("names every production region that maps an exercise, in body order, and only those that count its side", () => {
    expect(loggingTableRows(regions, library(split, plank, carry))).toEqual([
      { catalogExerciseId: 173, catalogName: "Bulgarian Split Squat", measure: "reps", laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "front_leg", sideCounted: true, strapsBy: [], mappedBy: ["thigh"] },
      { catalogExerciseId: 247, catalogName: "Side Plank", measure: "seconds", laterality: "not_applicable", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "bottom_leg", sideCounted: false, strapsBy: [], mappedBy: ["core"] },
      { catalogExerciseId: 409, catalogName: "Suitcase Carry", measure: "seconds", laterality: "unilateral", sidedBy: "arm", sideCounted: true, strapsBy: ["forearm"], mappedBy: ["forearm", "core"] },
    ]);
  });

  it("writes the hold list from the same rows, and both files deterministically", () => {
    const rows = loggingTableRows(regions, library(split, plank, carry));
    expect(emitHoldCatalogIds(rows)).toContain("new Set([247, 409])");
    expect(emitHoldCatalogIds(rows)).toContain(" * 247 Side Plank, 409 Suitcase Carry.\n");
    expect(emitLoggingTable(rows)).toContain(`  // Bulgarian Split Squat\n  [173, { measure: "reps", laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "front_leg", sideCounted: true, strapsBy: [], mappedBy: ["thigh"] }],`);
    expect(emitLoggingTable(loggingTableRows([...regions].reverse(), library(carry, plank, split)))).toBe(emitLoggingTable(rows));
  });

  it("refuses a leg-sided variant that does not say which leg a side names", () => {
    const lunge = variant(371, { laterality: "unilateral", legLaterality: "unilateral", sidedBy: "leg" });
    expect(() => loggingTableRows([{ region: region("thigh", { model: "paired", limb: "leg" }), mappings: [mapping(lunge.id)] }], library(lunge))).toThrow(/no side anchor/);
  });

  it("refuses a mapping of a variant that is not the current one for its exercise, or not in the library", () => {
    const old = variant(188, { laterality: "either", sidedBy: "arm" });
    const replacement = variant(188, { id: "fx-188.v2", replaces: old.id, laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "stance_leg" });
    const thigh = region("thigh", { model: "paired", limb: "leg" });
    expect(() => loggingTableRows([{ region: thigh, mappings: [mapping(old.id)] }], library(old, replacement))).toThrow(/not the current variant/);
    expect(loggingTableRows([{ region: thigh, mappings: [mapping(replacement.id)] }], library(old, replacement))[0]).toMatchObject({ sidedBy: "leg", sideAnchor: "stance_leg" });
    expect(() => loggingTableRows([{ region: thigh, mappings: [mapping("fx-999")] }], library(old))).toThrow(/does not hold/);
  });
});

describe("what the logger imports", () => {
  const root = process.cwd();
  const regionFolders = readdirSync(join(root, "shared/specialization/regions"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  // Any region's folder, the registry, the composition, the libraries of records: the drawing,
  // anatomy, claims, sources and mapping text would follow them into the logger's download.
  const heavy = new RegExp(`(regions/(${regionFolders.join("|")})\\b|/registry"|/compose"|/variants"|/variants/index"|/variants/forearm"|/sources|/actions|/exposure"|diagram)`);
  const loggerModules = [
    "shared/specialization/loggingPolicy.ts",
    "shared/specialization/loggingTable.generated.ts",
    "shared/specialization/holdCatalogIds.ts",
    "client/src/lib/specialization/loggerGates.ts",
    "client/src/lib/deviceWorkoutLog.ts",
    "client/src/lib/setEntryFields.ts",
    "client/src/lib/workoutSwap.ts",
    "client/src/components/DeviceWorkoutTracker.tsx",
    "client/src/components/ExerciseSwapSheet.tsx",
  ];

  it("reads no region's folder: no region has a logging file of its own any more", () => {
    expect(regionFolders).toContain("forearm");
    for (const folder of regionFolders) expect(existsSync(join(root, "shared/specialization/regions", folder, "logging.ts")), folder).toBe(false);
  });

  it("imports nothing that carries a region's drawing, anatomy, claims, sources or mappings", () => {
    for (const file of loggerModules) {
      const imports = readFileSync(join(root, file), "utf8").split("\n").filter((line) => /^\s*import\b/.test(line) && !/^\s*import type\b/.test(line));
      expect(imports.filter((line) => heavy.test(line)), file).toEqual([]);
    }
  });

  it("gives the first screens a hold list that imports nothing, and gates that read no atlas data", () => {
    const holds = readFileSync(join(root, "shared/specialization/holdCatalogIds.ts"), "utf8");
    expect(holds.split("\n").filter((line) => /^\s*import\b/.test(line))).toEqual([]);
    const gates = readFileSync(join(root, "client/src/lib/specialization/loggerGates.ts"), "utf8").split("\n").filter((line) => /^\s*import\b/.test(line) && !/^\s*import type\b/.test(line));
    expect(gates).toEqual(['import { isGoalActiveAt } from "@shared/specialization/goals";']);
  });
});
