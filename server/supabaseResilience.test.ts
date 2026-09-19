import { describe, expect, it } from "vitest";
import { createSupabaseResilienceClient, unavailableCatalog } from "./supabaseResilience";

const row = {
  target_id: "11111111-1111-1111-1111-111111111111",
  target_key: "shoulder",
  name: "Shoulder",
  region: "shoulder",
  target_type: "body_region",
  laterality_supported: true,
  supported_routes: ["sport_specific"],
};

function clientReturning(payload: unknown, ok = true) {
  return createSupabaseResilienceClient({
    url: "https://example.supabase.co",
    serviceRoleKey: "service-role",
    fetchImplementation: async () =>
      ({ ok, status: ok ? 200 : 500, json: async () => payload }) as unknown as Response,
  });
}

describe("Resilience target catalog boundary", () => {
  it("reads the app-safe catalog view and keeps each target's routes", async () => {
    const catalog = await clientReturning([row]).getTargetCatalog();
    expect(catalog.status).toBe("connected");
    expect(catalog.targets).toHaveLength(1);
    expect(catalog.targets[0]).toMatchObject({ targetKey: "shoulder", supportedRoutes: ["sport_specific"] });
  });

  // blocking acceptance: missing_data_fails_honestly - an uncovered target stays selectable and
  // says so; it never borrows a route.
  it("keeps a target with no reviewed route, with an empty route list", async () => {
    const catalog = await clientReturning([{ ...row, supported_routes: [] }]).getTargetCatalog();
    expect(catalog.targets[0].supportedRoutes).toEqual([]);
  });

  it("drops an unrecognized route rather than passing it through as usable", async () => {
    const catalog = await clientReturning([{ ...row, supported_routes: ["general", "made_up", "general"] }]).getTargetCatalog();
    expect(catalog.targets[0].supportedRoutes).toEqual(["general"]);
  });

  it("skips rows that cannot identify a target instead of inventing fields", async () => {
    const catalog = await clientReturning([
      { ...row, target_key: null },
      { ...row, target_type: "not_a_type" },
      row,
    ]).getTargetCatalog();
    expect(catalog.targets).toHaveLength(1);
  });

  it("surfaces an upstream failure as an error rather than an empty catalog", async () => {
    await expect(clientReturning([], false).getTargetCatalog()).rejects.toThrow(/failed \(500\)/);
  });

  it("states the boundary without promising a route exists for every target", () => {
    expect(unavailableCatalog().status).toBe("unavailable");
    expect(unavailableCatalog().targets).toEqual([]);
    expect(unavailableCatalog().boundary).toContain("Ordinary training");
  });
});
