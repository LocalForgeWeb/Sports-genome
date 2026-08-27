import { describe, expect, it } from "vitest";
import {
  strengthDomainDefinitions,
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
});
