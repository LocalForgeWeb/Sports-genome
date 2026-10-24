import { describe, expect, it } from "vitest";
import { catalogMeasureOf, holdCatalogIds } from "@shared/specialization/holdCatalogIds";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import { loggingTable } from "@shared/specialization/loggingTable.generated";
import { specializationRegions } from "@shared/specialization/registry";
import { variantFor } from "@shared/specialization/variants";

/**
 * The first screens (Home's Plan editor, picker, print and share; the workout history) read an
 * exercise's measure from a light list of catalog ids, so they never load the atlas's logging
 * table or region data. The emitter writes that list with the table (loggingTable.test.ts holds
 * both to it); these check that it says what the atlas says: the logger's policy, and the variant
 * the page and the planned atlas read (10-multi-region.md §3, "Holds").
 */
describe("the light list of exercises measured in seconds", () => {
  const mappedIds = [...new Set(specializationRegions.flatMap((data) => data.variants.map((variant) => variant.catalogExerciseId)))].sort((a, b) => a - b);

  it("names exactly the exercises a production region maps with a variant measured in seconds", () => {
    const seconds = mappedIds.filter((id) => variantFor(id)?.measure === "seconds");
    expect([...holdCatalogIds].sort((a, b) => a - b)).toEqual(seconds);
    // The forearm's nine, as shipped (no hold was added or taken away in wave 0 or wave A), and from F3 419 Barbell Hold.
    expect(seconds).toEqual([142, 143, 144, 145, 299, 300, 400, 403, 409, 419]);
  });

  it("gives every mapped exercise the measure the logger, the page and the planned atlas read", () => {
    expect([...loggingTable.keys()]).toEqual(mappedIds);
    for (const id of mappedIds) {
      expect(catalogMeasureOf(id), `catalog ${id}`).toBe(loggingPolicyFor(id).measure);
      expect(catalogMeasureOf(id), `catalog ${id}`).toBe(variantFor(id)?.measure === "seconds" ? "seconds" : "reps");
    }
  });

  it("reads reps for an exercise the atlas does not map, and for no id at all", () => {
    expect(catalogMeasureOf(1)).toBe("reps");
    expect(catalogMeasureOf(undefined)).toBe("reps");
    expect(catalogMeasureOf(null)).toBe("reps");
    expect(catalogMeasureOf(143)).toBe("seconds");
  });
});
