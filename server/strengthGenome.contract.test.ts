import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./strengthGenome.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("Strength Genome account and evidence contract", () => {
  it("preserves dated account-owned observations and does not invent an early strength tier", () => {
    expect(source).toContain("eq(strengthObservations.userId, userId)");
    expect(source).toContain("bodyMassObservations");
    expect(source).toContain("observedAt: input.observedAt");
    expect(source).toContain("bodyMassKg: input.bodyMassKgAtTest.toFixed(2)");
    expect(source).toContain('"OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const');
    expect(source).toContain('sourceStatus: "OBSERVATION_ROUTING_ONLY" as const');
    expect(source).toContain("resolveStrengthObservationRoute(observation.exerciseName)");
    expect(source).toContain('state: observedRegionIds.has(region.id) ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const');
    expect(source).toContain("not a direct regional force measurement or strength rank");
    expect(source).not.toContain("estimatedPercentile:");
    expect(source).not.toContain("tier:");
  });

  it("exposes only authenticated Strength Genome observation procedures", () => {
    expect(router).toContain("strengthGenome: router({");
    expect(router).toContain("overview: protectedProcedure");
    expect(router).toContain("observations: protectedProcedure");
    expect(router).toContain("addObservation: protectedProcedure");
  });
});
