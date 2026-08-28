import { describe, expect, it } from "vitest";
import {
  resolveStrengthObservationRoute,
  strengthDomainDefinitions,
  strengthObservationRoutes,
  strengthRegionDefinitions,
} from "../../../shared/strengthGenomeDefinitions";

describe("Strength Genome definitions", () => {
  it("keeps functional domains distinct from athlete-facing anatomical regions", () => {
    expect(strengthDomainDefinitions.length).toBeGreaterThan(20);
    expect(strengthRegionDefinitions.length).toBeGreaterThan(12);
    expect(strengthDomainDefinitions.every(domain => domain.evidenceStatus === "AWAITING_EVIDENCE")).toBe(true);
    expect(new Set(strengthDomainDefinitions.map(domain => domain.id)).size).toBe(strengthDomainDefinitions.length);
    expect(new Set(strengthRegionDefinitions.map(region => region.id)).size).toBe(strengthRegionDefinitions.length);
  });

  it("routes recognized tests only to broad non-numeric observation context", () => {
    const squat = resolveStrengthObservationRoute("Barbell Back Squat");
    expect(squat?.domainIds).toEqual(expect.arrayContaining(["knee_extension", "hip_extension"]));
    expect(squat?.regionIds).toEqual(expect.arrayContaining(["quadriceps", "glutes"]));
    expect(squat?.boundary).toContain("does not directly measure");
    expect(strengthObservationRoutes.every(route => route.basis === "EXERCISE_MOVEMENT_CLASSIFICATION")).toBe(true);
    expect(JSON.stringify(strengthObservationRoutes)).not.toContain("percentile");
  });

  it("does not promote reviewed reliability or reference literature into unqualified athlete percentiles or tiers", async () => {
    const { readFileSync } = await import("node:fs");
    const panelSource = readFileSync(new URL("../components/StrengthGenomePanel.tsx", import.meta.url), "utf8");
    expect(panelSource).toContain("A percentile, universal rank, and regional force score are not shown");
    expect(panelSource).toContain("No regional strength tier is shown until supporting evidence is available.");
    expect(panelSource).not.toContain("Your percentile");
    expect(panelSource).not.toContain("SS+");
  });
});
