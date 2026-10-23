import { describe, expect, it } from "vitest";
import { registeredRegionContents } from "@shared/specialization/registry";
import { repProfileExtras as forearmProfiles } from "@shared/specialization/regions/forearm/repProfiles";
import { hasRegionExtras, loadedRegionExtras, loadRegionExtras, regionExtrasFiles } from "./regionExtras";

/**
 * The region-agnostic loader of a region's extras (11-forearm-research-and-stack.md §3.10): it finds
 * `regions/<region>/repProfiles.ts` (and, from F2, `tendonAreas.ts`) by their place in the tree, and a
 * region's content opts into a section exactly where its file exists, so a later region gets the stack
 * by adding its file and its flag, with no code.
 */

describe("a region's extras, by file", () => {
  it("finds the forearm's rep profiles and no file for a region without one", () => {
    expect(regionExtrasFiles()).toContainEqual({ regionId: "forearm", kind: "repProfiles" });
    expect(hasRegionExtras("forearm", "repProfiles")).toBe(true);
    expect(hasRegionExtras("nowhere")).toBe(false);
    expect(loadedRegionExtras("nowhere")).toBeNull();
  });

  it("sets a section's flag exactly where the region has the section's file, on every registered region", () => {
    for (const content of registeredRegionContents) {
      const id = content.region.id;
      expect(Boolean(content.sections?.stack), `${id}: sections.stack`).toBe(hasRegionExtras(id, "repProfiles"));
      expect(Boolean(content.sections?.tendonExposure), `${id}: sections.tendonExposure`).toBe(hasRegionExtras(id, "tendonAreas"));
    }
  });

  it("loads the region's file once, merged, and keeps it for the visit", async () => {
    const pending = loadRegionExtras("forearm");
    expect(loadRegionExtras("forearm")).toBe(pending);
    const extras = await pending;
    expect(extras?.regionId).toBe("forearm");
    expect(extras?.repProfiles).toEqual(forearmProfiles.repProfiles);
    expect(extras?.repProfileAssignments).toEqual(forearmProfiles.repProfileAssignments);
    expect(loadedRegionExtras("forearm")).toBe(extras);
    await expect(loadRegionExtras("nowhere")).resolves.toBeNull();
  });
});
