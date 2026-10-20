import { describe, expect, it } from "vitest";
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

  it("has nothing for a region with no page, and has not loaded one it was never asked for", async () => {
    expect(await loadRegionData("upper_arm")).toBeNull();
    expect(await loadRegionData("nowhere")).toBeNull();
    expect(loadedRegionData("upper_arm")).toBeNull();
    // A name on Object.prototype is not a loader.
    expect(await loadRegionData("toString")).toBeNull();
  });
});
