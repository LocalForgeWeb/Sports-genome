import { describe, expect, it } from "vitest";

describe("Supabase exercise-evidence access boundary", () => {
  it("does not expose exercise coverage rows directly to a publishable browser client", async () => {
    const projectUrl = process.env.VITE_SUPABASE_URL;
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(publishableKey).toBeTruthy();

    const response = await fetch(
      `${projectUrl}/rest/v1/exercise_evidence_coverage?select=exercise_id&limit=1`,
      { headers: { apikey: publishableKey! } }
    );
    const body = response.ok ? await response.json() : null;

    expect(
      !response.ok || (Array.isArray(body) && body.length === 0),
      "A browser key must not read the server-only evidence coverage table"
    ).toBe(true);
  });
});
