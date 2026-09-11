import { describe, expect, it, vi } from "vitest";
import { createPowerliftingNormsClient } from "./powerliftingNormsReference";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("Powerlifting norms registry adapter", () => {
  it("parses reported decile rows across age bands and drops rows missing required fields", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        { sex: "male", age_min: "18.00", age_max: "35.00", percentile: "50.00", value: "2.28000", exercises: { name: "Back Squat" } },
        { sex: "female", age_min: "36.00", age_max: "59.00", percentile: "50.00", value: "1.51000", exercises: { name: "Conventional Deadlift" } },
        // dropped: not one of the three known lifts
        { sex: "male", age_min: "18.00", age_max: "35.00", percentile: "50.00", value: "1.00", exercises: { name: "Landmine Press" } },
        // dropped: missing sex
        { sex: null, age_min: "18.00", age_max: "35.00", percentile: "50.00", value: "1.00", exercises: { name: "Back Squat" } },
      ])
    );
    const client = createPowerliftingNormsClient({
      url: "https://sports.example.supabase.co",
      serviceRoleKey: "server-only-test-key",
      fetchImplementation,
    });

    const rows = await client.getPowerliftingNorms();

    expect(rows).toEqual([
      { exerciseName: "Back Squat", sex: "male", ageMin: 18, ageMax: 35, percentile: 50, relativeStrength: 2.28 },
      { exerciseName: "Conventional Deadlift", sex: "female", ageMin: 36, ageMax: 59, percentile: 50, relativeStrength: 1.51 },
    ]);

    const requestUrl = new URL(String(fetchImplementation.mock.calls[0]?.[0]));
    expect(requestUrl.pathname).toBe("/rest/v1/strength_norms");
    expect(requestUrl.searchParams.get("source_text")).toBe("ilike.*van den hoek*");
  });

  it("returns an empty list rather than throwing when the registry request fails", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response("", { status: 500 }));
    const client = createPowerliftingNormsClient({
      url: "https://sports.example.supabase.co",
      serviceRoleKey: "server-only-test-key",
      fetchImplementation,
    });

    await expect(client.getPowerliftingNorms()).rejects.toThrow();
  });
});
