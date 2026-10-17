import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogMeasureOf, holdCatalogIds } from "@shared/specialization/holdCatalogIds";
import { loggingPolicyFor, productionVariants } from "@shared/specialization/loggingPolicy";
import { specializationRegions } from "@shared/specialization/registry";
import { variantForCatalogId } from "@shared/specialization/exposure";

/**
 * The first screens (Home's Plan editor, picker, print and share; the workout history) read an
 * exercise's measure from a light list of catalog ids, so they never load the atlas's region
 * data. These checks keep that list equal to what the atlas says: the logger's policy, and the
 * variant the page and the planned atlas read.
 */
describe("the light list of exercises measured in seconds", () => {
  const catalogIds = [...new Set(productionVariants().map((variant) => variant.catalogExerciseId))].sort((a, b) => a - b);

  it("names exactly the exercises the atlas measures in seconds", () => {
    const seconds = catalogIds.filter((id) => loggingPolicyFor(id).measure === "seconds");
    expect([...holdCatalogIds].sort((a, b) => a - b)).toEqual(seconds);
    expect(seconds.length).toBeGreaterThan(0);
  });

  it("gives every mapped exercise the measure the logger, the page and the planned atlas read", () => {
    for (const id of catalogIds) {
      expect(catalogMeasureOf(id), `catalog ${id}`).toBe(loggingPolicyFor(id).measure);
      const variant = specializationRegions.map((region) => variantForCatalogId(region, id)).find(Boolean);
      expect(catalogMeasureOf(id), `catalog ${id}`).toBe(variant?.measure === "seconds" ? "seconds" : "reps");
    }
  });

  it("reads reps for an exercise the atlas does not map, and for no id at all", () => {
    expect(catalogMeasureOf(1)).toBe("reps");
    expect(catalogMeasureOf(undefined)).toBe("reps");
    expect(catalogMeasureOf(null)).toBe("reps");
    expect(catalogMeasureOf(143)).toBe("seconds");
  });

  it("imports nothing, so it adds only its own few bytes to the screens that read it", () => {
    const source = readFileSync(join(process.cwd(), "shared/specialization/holdCatalogIds.ts"), "utf8");
    expect(source.split("\n").filter((line) => /^\s*import\b/.test(line))).toEqual([]);
  });
});
