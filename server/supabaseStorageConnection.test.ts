import { describe, expect, it } from "vitest";

describe("Supabase Storage connection", () => {
  it("authenticates a lightweight bucket metadata read with the server-only service key", async () => {
    const projectUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(projectUrl, "VITE_SUPABASE_URL must be configured").toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY must be configured").toBeTruthy();

    const response = await fetch(`${projectUrl}/storage/v1/bucket`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.ok, "Supabase Storage bucket metadata request should authenticate").toBe(true);
    await response.body?.cancel();
  });
});
