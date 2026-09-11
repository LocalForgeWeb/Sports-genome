import { describe, expect, it, vi } from "vitest";
import { createSupabaseSportProfileClient, toSportCanonicalName } from "./supabaseSportProfile";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("toSportCanonicalName", () => {
  it("converts kebab-case client sport ids to the registry's snake_case canonical names", () => {
    expect(toSportCanonicalName("brazilian-jiu-jitsu")).toBe("brazilian_jiu_jitsu");
    expect(toSportCanonicalName("wrestling")).toBe("wrestling");
    expect(toSportCanonicalName("Track And Field")).toBe("track_and_field");
  });
});

describe("Supabase sport profile adapter", () => {
  it("assembles evidence-backed demands and recommendations for a matched sport", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([{ id: "sport-1", name: "Wrestling", category: "combat" }])
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { importance_weight: 0.9, confidence_score: 0.8, movement_patterns: { name: "Double leg takedown" } },
          { importance_weight: 0.4, confidence_score: 0.5, movement_patterns: null },
        ])
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { importance_weight: 0.85, confidence_score: 0.7, muscles: { name: "Trapezius", region: "upper_back" } },
        ])
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { importance_weight: 0.95, confidence_score: 0.9, athletic_attributes: { name: "Maximal strength" } },
        ])
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            recommendation_goal: "performance",
            recommendation_role: "lower_body_explosive_power",
            confidence_score: 0.91,
            effect_metric: "CMJ height change (%)",
            effect_size: 0.72,
            rationale: "Direct same-sport intervention supports this movement.",
            dose_summary: "3 sessions/week for 6 weeks.",
            exercises: { name: "Smith Machine Squat", source_catalog_id: 168 },
          },
          {
            recommendation_goal: "acute_potentiation",
            recommendation_role: "pre-explosive conditioning",
            confidence_score: 0.9,
            effect_metric: null,
            effect_size: null,
            rationale: null,
            dose_summary: null,
            exercises: { name: "Barbell Back Squat", source_catalog_id: null },
          },
        ])
      );

    const client = createSupabaseSportProfileClient({
      url: "https://sports.example.supabase.co",
      serviceRoleKey: "server-only-test-key",
      fetchImplementation,
    });

    const result = await client.getSportProfile("wrestling");

    expect(result).toMatchObject({
      status: "connected",
      sportId: "wrestling",
      sportName: "Wrestling",
      category: "combat",
    });
    expect(result.movementDemands).toEqual([
      { patternName: "Double leg takedown", importanceWeight: 0.9, confidenceScore: 0.8 },
    ]);
    expect(result.muscleDemands).toEqual([
      { muscleName: "Trapezius", region: "upper_back", importanceWeight: 0.85, confidenceScore: 0.7 },
    ]);
    expect(result.qualityDemands).toEqual([
      { qualityName: "Maximal strength", importanceWeight: 0.95, confidenceScore: 0.9 },
    ]);
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0]).toMatchObject({
      catalogExerciseId: 168,
      exerciseName: "Smith Machine Squat",
      confidenceScore: 0.91,
    });
    expect(result.recommendations[1]).toMatchObject({
      catalogExerciseId: null,
      exerciseName: "Barbell Back Squat",
    });
    expect(result.boundary).toContain("do not replace");

    const sportsRequest = new URL(String(fetchImplementation.mock.calls[0]?.[0]));
    expect(sportsRequest.pathname).toBe("/rest/v1/sports");
    expect(sportsRequest.searchParams.get("canonical_name")).toBe("eq.wrestling");
    const recommendationsRequest = new URL(String(fetchImplementation.mock.calls[4]?.[0]));
    expect(recommendationsRequest.pathname).toBe("/rest/v1/sport_exercise_recommendations");
    expect(recommendationsRequest.searchParams.get("exercise_id")).toBe("not.is.null");
  });

  it("returns a not_mapped fallback without further requests when the sport has no registry match", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([]));
    const client = createSupabaseSportProfileClient({
      url: "https://sports.example.supabase.co",
      serviceRoleKey: "server-only-test-key",
      fetchImplementation,
    });

    await expect(client.getSportProfile("underwater-basket-weaving")).resolves.toMatchObject({
      status: "not_mapped",
      movementDemands: [],
      recommendations: [],
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });
});
