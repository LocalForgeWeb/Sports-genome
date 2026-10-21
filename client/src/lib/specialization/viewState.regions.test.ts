// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSpecializationState, readRememberedRegion, rememberRegion, specializationRegionKeyBase, specializationStateFromParams, withRegion, writeSpecializationParams } from "./viewState";

/**
 * The view state across regions (docs/specialization-atlas/10-multi-region.md §6.1): picking a
 * region replaces the region's own choices and keeps the athlete's; no address names a side (both
 * sides are counted as one, owner 20 Oct 2026); the last region opened is remembered on the device, per account, and a device
 * that will not remember it costs nothing but the memory. The test regions reach the index as
 * production regions through the mocked light index.
 */

vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("@/components/specialization/__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["fx_thigh", "fx_core"]);
});

const known = new Set(["forearm", "fx_thigh", "fx_core"]);

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("picking a region", () => {
  it("replaces the region, its muscle, its view and its layer, and keeps the window, mode, colouring and figure", () => {
    const on = { ...defaultSpecializationState("forearm"), nodeId: "forearm.fcr", view: "posterior", layer: "deep" as const, figure: "drawing" as const, window: "custom" as const, from: "2026-10-01", to: "2026-10-07", mode: "planned" as const, map: "target" as const, planWeek: 3 };
    expect(withRegion(on, "fx_thigh")).toEqual({ ...on, regionId: "fx_thigh", nodeId: null, view: null, layer: "surface" });
    // Opened on one of the region's muscles (an external muscle's home).
    expect(withRegion(on, "fx_thigh", "fx_thigh.quads")).toMatchObject({ regionId: "fx_thigh", nodeId: "fx_thigh.quads", view: null, layer: "surface" });
  });
});

describe("no region's address names a side (both sides as one)", () => {
  it("drops an old limb on a paired or a midline region, and keeps none in the state", () => {
    for (const regionId of ["fx_thigh", "fx_core", "forearm"]) {
      const params = new URLSearchParams(`region=${regionId}&limb=left`);
      const state = specializationStateFromParams(params, "forearm", known);
      expect(state, regionId).not.toHaveProperty("limb");
      writeSpecializationParams(params, withRegion(state, regionId === "fx_core" ? "fx_thigh" : "fx_core"));
      expect(params.has("limb"), regionId).toBe(false);
    }
  });
});

describe("the remembered region", () => {
  it("is the last region opened, per account on the device", () => {
    rememberRegion("a1", "fx_thigh");
    rememberRegion(null, "fx_core");
    expect(window.localStorage.getItem(`${specializationRegionKeyBase}::a1`)).toBe("fx_thigh");
    expect(readRememberedRegion("a1", known)).toBe("fx_thigh");
    expect(readRememberedRegion(null, known)).toBe("fx_core");
    expect(readRememberedRegion("a2", known)).toBeNull();
  });

  it("is nothing when the region is no longer offered", () => {
    rememberRegion("a1", "fx_thigh");
    expect(readRememberedRegion("a1", new Set(["forearm"]))).toBeNull();
  });

  it("costs nothing but the memory when the device refuses to read or write it", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(() => rememberRegion("a1", "fx_thigh")).not.toThrow();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(readRememberedRegion("a1", known)).toBeNull();
  });
});
