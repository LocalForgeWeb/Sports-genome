import { describe, expect, it } from "vitest";
import {
  getSupabaseEvidenceInventory,
  getSupabaseExerciseEvidence,
} from "./supabaseEvidence";

describe("Supabase evidence runtime connection", () => {
  it("retrieves a mapped source record through the server-only data layer without returning a personal percentile", async () => {
    expect(process.env.VITE_SUPABASE_URL).toMatch(
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i
    );
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();

    const record = await getSupabaseExerciseEvidence(1);

    expect(record.status).toBe("connected");
    expect(record.catalogExerciseId).toBe(1);
    expect(record.coverageLevel).not.toBe("unavailable");
    expect(record.source?.title).toBeTruthy();
    expect(record.source?.sourceUrl).toMatch(/^https:\/\//);
    expect(record.boundary).toContain("does not replace local exercise mechanics");
    expect(record).not.toHaveProperty("percentile");
  });

  it("reports the connected repository as source data rather than auto-promoted athlete recommendations", async () => {
    const inventory = await getSupabaseEvidenceInventory();

    expect(inventory).toMatchObject({ status: "connected" });
    expect(inventory.sourceExercises).toBeGreaterThanOrEqual(422);
    expect(inventory.localCatalogLinks).toBeGreaterThanOrEqual(400);
    expect(inventory.linkedCoverageRecords).toBeGreaterThanOrEqual(400);
    expect(inventory.studies).toBeGreaterThanOrEqual(134);
    expect(inventory.studyOutcomes).toBeGreaterThanOrEqual(1_407);
    expect(inventory.strengthNorms).toBeGreaterThanOrEqual(2_172);
    expect(inventory.performanceNorms).toBeGreaterThanOrEqual(1_094);
    expect(inventory.boundary).toContain("not automatically used");
  });
});
