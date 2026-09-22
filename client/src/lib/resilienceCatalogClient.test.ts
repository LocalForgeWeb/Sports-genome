import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogEntryFromRow, connectedCatalogBoundary } from "@shared/resilienceContext";

let rows: unknown[] | null = [];
let failure: unknown = null;
const selected: string[] = [];

vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = (columns: string) => { selected.push(columns); return chain; };
      chain.order = () => chain;
      (chain as { then: unknown }).then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: rows, error: failure }).then(resolve);
      return chain;
    },
  }),
}));

const { fetchTargetCatalogAsAthlete } = await import("./resilienceCatalogClient");

const row = (over: Record<string, unknown> = {}) => ({
  target_id: "26cd0dfa-6859-4532-8a66-9eaa10902a00",
  target_key: "shoulder",
  name: "Shoulder",
  region: "shoulder",
  target_type: "body_region",
  laterality_supported: true,
  supported_routes: ["sport_specific"],
  ...over,
});

beforeEach(() => { rows = []; failure = null; selected.length = 0; });

/**
 * The catalog had one door, behind a service-role key the deployment did not
 * have, so the whole feature was off. `resilience_targets` carries a `SELECT`
 * policy for `authenticated` with `USING (true)`, and the view over it is
 * `security_invoker = true` — the database was already willing to hand a
 * signed-in athlete this list.
 */
describe("the athlete's own read of the target catalog", () => {
  it("asks for exactly the columns the shared parser needs", async () => {
    rows = [row()];
    await fetchTargetCatalogAsAthlete("user-1");
    expect(selected[0]).toBe("target_id,target_key,name,region,target_type,laterality_supported,supported_routes");
  });

  it("returns the same shape, with the same boundary sentence, as the server route", async () => {
    rows = [row(), row({ target_id: "ac8c710b-0171-4fad-b050-f73ee5345e81", target_key: "knee", name: "Knee", region: "knee" })];
    const catalog = await fetchTargetCatalogAsAthlete("user-1");
    expect(catalog?.status).toBe("connected");
    expect(catalog?.targets.map((target) => target.targetKey)).toEqual(["shoulder", "knee"]);
    // Same words either way: an athlete must not be able to tell which door the
    // list came through from what the boundary says.
    expect(catalog?.boundary).toBe(connectedCatalogBoundary);
  });

  it("drops a row the shared parser rejects, rather than half a target", async () => {
    rows = [row(), row({ target_key: null }), row({ target_type: "nonsense" })];
    const catalog = await fetchTargetCatalogAsAthlete("user-1");
    expect(catalog?.targets).toHaveLength(1);
    // The same parser the server uses, so a target means one thing.
    expect(catalogEntryFromRow(row({ target_type: "nonsense" }))).toBeNull();
  });

  /**
   * An empty read is a policy or a session problem, not a catalog with nothing
   * in it. Reporting `connected` would swap the honest "unavailable" copy for a
   * picker that silently has no options.
   */
  it("does not report an empty read as a connected catalog", async () => {
    rows = [];
    expect(await fetchTargetCatalogAsAthlete("user-1")).toBeNull();
  });

  it("stays quiet on an error or without a session", async () => {
    failure = { message: "permission denied" };
    rows = [row()];
    expect(await fetchTargetCatalogAsAthlete("user-1")).toBeNull();
    failure = null;
    // The policy is for `authenticated`, so there is nothing to try without one.
    expect(await fetchTargetCatalogAsAthlete(null)).toBeNull();
  });
});
