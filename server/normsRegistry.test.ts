import { describe, expect, it } from "vitest";
import { createNormsRegistryClient } from "./normsRegistry";

const eligibilityRow = {
  id: "gate-1",
  source_table: "strength_norms",
  source_record_id: "norm-1",
  reference_family: "strength_norm",
  exercise_id: "exercise-1",
  measurement_type: "direct_relative_1rm_by_age_sex",
  unit: "x_bodyweight",
  sex: "male",
  age_min: "18.00",
  age_max: "35.00",
  training_status: "strength-trained competitive",
  equipment: null,
  protocol: "Competition 1RM/bodyweight percentile.",
  competition_conditions: "powerlifting; drug-tested unequipped competition",
  body_mass_normalization_method: "direct_relative_1rm_by_age_sex",
  population_definition: "powerlifting; strength-trained competitive",
  blocking_reason: "Existing van den Hoek 2024 route preserved.",
  provenance: { percentile: 50, sample_size: 103984, source_study_id: "study-1" },
};

const strengthNormRow = {
  id: "norm-1",
  value: "2.28000",
  percentile: "50.00",
  unit: "x_bodyweight",
  bodyweight_min_kg: null,
  bodyweight_max_kg: null,
  sample_size: 103984,
  source_text: "van den Hoek et al. 2024",
  source_study_id: "study-1",
};

type Responder = (path: string, params: URLSearchParams) => unknown[];

/** Records each request so the tests can assert the registry gate is applied server-side. */
function stubFetch(responder: Responder) {
  const requests: { path: string; params: URLSearchParams }[] = [];
  const fetchImplementation = (async (input: URL | RequestInfo) => {
    const url = input instanceof URL ? input : new URL(String(input));
    const path = url.pathname.replace("/rest/v1/", "");
    requests.push({ path, params: url.searchParams });
    return {
      ok: true,
      status: 200,
      json: async () => responder(path, url.searchParams),
    } as Response;
  }) as typeof fetch;
  return { fetchImplementation, requests };
}

function client(responder: Responder, overrides: Parameters<typeof stubFetch>[0] | null = null) {
  const { fetchImplementation, requests } = stubFetch(overrides ?? responder);
  return {
    registry: createNormsRegistryClient({
      url: "https://project.supabase.co",
      serviceRoleKey: "service-role-key",
      fetchImplementation,
    }),
    requests,
  };
}

const defaultResponder: Responder = path => {
  if (path === "app_reference_eligibility") return [eligibilityRow];
  if (path === "strength_norms") return [strengthNormRow];
  if (path === "exercises") return [{ id: "exercise-1", name: "Back Squat" }];
  if (path === "studies") return [{ id: "study-1", source_url: "https://example.org/van-den-hoek-2024" }];
  if (path === "app_exercise_source_mappings") {
    return [
      { supabase_exercise_id: "exercise-1", local_catalog_id: 101 },
      { supabase_exercise_id: "exercise-1", local_catalog_id: 102 },
    ];
  }
  return [];
};

describe("createNormsRegistryClient", () => {
  it("requests only rows the registry has approved", async () => {
    const { registry, requests } = client(defaultResponder);
    await registry.getApprovedReferenceRows();

    const eligibility = requests.find(request => request.path === "app_reference_eligibility");
    expect(eligibility?.params.get("eligibility_status")).toBe("eq.approved");
    const mappings = requests.find(request => request.path === "app_exercise_source_mappings");
    expect(mappings?.params.get("mapping_status")).toBe("eq.approved");
  });

  it("denormalizes a gate row into a self-contained reference row", async () => {
    const { registry } = client(defaultResponder);
    const [row] = await registry.getApprovedReferenceRows();

    expect(row).toMatchObject({
      // The registry keeps the database identity; only the wire sees the digest.
      sourceRecordId: "norm-1",
      sourceTable: "strength_norms",
      exerciseName: "Back Squat",
      localCatalogIds: [101, 102],
      measurementType: "direct_relative_1rm_by_age_sex",
      unit: "x_bodyweight",
      sex: "male",
      ageMin: 18,
      ageMax: 35,
      trainingStatus: "strength-trained competitive",
      competitionConditions: "powerlifting; drug-tested unequipped competition",
      percentile: 50,
      value: 2.28,
      sampleSize: 103984,
      reviewerNote: "Existing van den Hoek 2024 route preserved.",
      sourceUrl: "https://example.org/van-den-hoek-2024",
    });
  });

  it("skips approvals that are catalog metadata rather than a ranking route", async () => {
    const rows = await client(path =>
      path === "app_reference_eligibility"
        ? [{ ...eligibilityRow, id: "gate-2", source_table: "performance_tests" }]
        : defaultResponder(path, new URLSearchParams())
    ).registry.getApprovedReferenceRows();
    expect(rows).toEqual([]);
  });

  it("drops a gate row whose source norm record is missing", async () => {
    const rows = await client(path =>
      path === "strength_norms" ? [] : defaultResponder(path, new URLSearchParams())
    ).registry.getApprovedReferenceRows();
    expect(rows).toEqual([]);
  });

  it("drops a row with no usable percentile or value rather than defaulting one", async () => {
    const rows = await client(path =>
      path === "strength_norms"
        ? [{ ...strengthNormRow, value: null, percentile: null }]
        : defaultResponder(path, new URLSearchParams())
    ).registry.getApprovedReferenceRows();
    expect(rows).toEqual([]);
  });

  it("leaves catalog identities empty when no approved mapping exists", async () => {
    const rows = await client(path =>
      path === "app_exercise_source_mappings" ? [] : defaultResponder(path, new URLSearchParams())
    ).registry.getApprovedReferenceRows();
    expect(rows[0].localCatalogIds).toEqual([]);
  });

  it("batches id lookups so the request URL stays bounded", async () => {
    const ids = Array.from({ length: 170 }, (_, index) => `norm-${index}`);
    const { registry, requests } = client(path => {
      if (path === "app_reference_eligibility") {
        return ids.map((id, index) => ({ ...eligibilityRow, id: `gate-${index}`, source_record_id: id }));
      }
      if (path === "strength_norms") return ids.map(id => ({ ...strengthNormRow, id }));
      if (path === "exercises") return [{ id: "exercise-1", name: "Back Squat" }];
      return [];
    });

    const rows = await registry.getApprovedReferenceRows();
    expect(rows).toHaveLength(170);
    const normRequests = requests.filter(request => request.path === "strength_norms");
    expect(normRequests.length).toBeGreaterThan(1);
    for (const request of normRequests) {
      expect(request.params.get("id")!.length).toBeLessThan(2000);
    }
  });

  it("surfaces a failed request instead of returning a partial registry", async () => {
    const failing = (async () =>
      ({ ok: false, status: 500, json: async () => [] }) as Response) as typeof fetch;
    const registry = createNormsRegistryClient({
      url: "https://project.supabase.co",
      serviceRoleKey: "service-role-key",
      fetchImplementation: failing,
    });
    await expect(registry.getApprovedReferenceRows()).rejects.toThrow(/app_reference_eligibility/);
  });
});
