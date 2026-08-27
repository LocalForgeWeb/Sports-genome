import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./strengthGenome.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("Strength Genome account and evidence contract", () => {
  it("preserves dated account-owned observations and does not invent an early strength tier", () => {
    expect(source).toContain("eq(strengthObservations.userId, userId)");
    expect(source).toContain('state: "INSUFFICIENT_DATA" as const');
    expect(source).toContain('sourceStatus: "AWAITING_EVIDENCE" as const');
    expect(source).toContain("Awaiting an approved exercise-to-domain mapping and reference dataset.");
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
