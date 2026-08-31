import { describe, expect, it, vi } from "vitest";
import { createSupabaseEvidenceClient } from "./supabaseEvidence";

function jsonResponse(body: unknown, count: number) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-range": `0-0/${count}` },
  });
}

describe("Supabase evidence adapter", () => {
  it("joins an existing local catalog ID to concise source metadata and counts norms without deriving a personal rank", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          [
            {
              id: "exercise-1",
              canonical_name: "barbell_bench_press__catalog_1",
              exercise_evidence_coverage: {
                coverage_level: "direct_norm",
                anchor_metric: "bench_press_1rm",
                studies: {
                  id: "study-1",
                  title: "A source-bound bench reference",
                  publication_year: 2024,
                  source_url: "https://example.edu/bench-reference",
                  study_type: "normative reference study",
                  population_summary: "Adults under the documented protocol",
                  sex: "mixed",
                  training_status: "trained",
                  sport_population: null,
                  evidence_level: "normative_reference",
                },
              },
            },
          ],
          1
        )
      )
      .mockResolvedValueOnce(jsonResponse([{ id: "norm-1" }], 18))
      .mockResolvedValueOnce(
        jsonResponse(
          [
            { metric: "bench_press_1rm" },
            { metric: "upper_body_strength" },
            { metric: "bench_press_1rm" },
          ],
          6
        )
      );
    const client = createSupabaseEvidenceClient({
      url: "https://sports.example.supabase.co",
      serviceRoleKey: "server-only-test-key",
      fetchImplementation,
    });

    const result = await client.getExerciseEvidence(1);

    expect(result).toMatchObject({
      status: "connected",
      catalogExerciseId: 1,
      canonicalExerciseName: "barbell_bench_press__catalog_1",
      coverageLevel: "direct_norm",
      coverageLabel: "Direct normative reference",
      anchorMetric: "bench_press_1rm",
      normativeRecordCount: 18,
      sourceOutcomeCount: 6,
      sourceOutcomeMetrics: ["bench press 1rm", "upper body strength"],
      source: {
        title: "A source-bound bench reference",
        publicationYear: 2024,
      },
    });
    expect(result.boundary).toContain("does not replace local exercise mechanics");
    expect(result.boundary).toContain("does not");
    expect(result).not.toHaveProperty("percentile");

    const firstRequest = new URL(String(fetchImplementation.mock.calls[0]?.[0]));
    expect(firstRequest.pathname).toBe("/rest/v1/exercises");
    expect(firstRequest.searchParams.get("source_catalog_id")).toBe("eq.1");
    expect(firstRequest.searchParams.get("select")).toContain(
      "exercise_evidence_coverage"
    );
    expect(fetchImplementation.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        apikey: "server-only-test-key",
        Authorization: "Bearer server-only-test-key",
      }),
    });
    expect(new URL(String(fetchImplementation.mock.calls[2]?.[0])).pathname).toBe(
      "/rest/v1/study_outcomes"
    );
  });

  it("returns a source-only fallback when an upstream exercise lacks a local catalog ID", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([], 0));
    const client = createSupabaseEvidenceClient({
      url: "https://sports.example.supabase.co",
      serviceRoleKey: "server-only-test-key",
      fetchImplementation,
    });

    await expect(client.getExerciseEvidence(999)).resolves.toMatchObject({
      status: "not_mapped",
      coverageLevel: "unavailable",
      normativeRecordCount: 0,
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });
});
