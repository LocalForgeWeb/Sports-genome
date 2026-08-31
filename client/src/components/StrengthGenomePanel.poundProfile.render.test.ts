import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn().mockResolvedValue(undefined),
  mutate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { observationCount: 0, nextAction: "Add a result", regions: [], athleteConfirmedPriorityRegionIds: [] } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
  },
}));

import { StrengthGenomePanel } from "./StrengthGenomePanel";

describe("Strength Genome mounted pound-profile entry", () => {
  it("renders the real entry form and open testing detail in pounds, never with a default kilogram prompt", () => {
    const markup = renderToStaticMarkup(React.createElement(StrengthGenomePanel, { weightUnit: "lb", defaultTestingDetailOpen: true }));
    expect(markup).toContain("Load in pounds");
    expect(markup).toContain("Enter lb");
    expect(markup).toContain("Body mass at test (lb)");
    expect(markup).toContain("Body mass at test in pounds");
    expect(markup).not.toContain("Load in kilograms");
    expect(markup).not.toContain("Body mass at test (kg)");
  });

  it("prepopulates the saved athlete baseline weight for a pound-profile test entry", () => {
    const markup = renderToStaticMarkup(React.createElement(StrengthGenomePanel, { weightUnit: "lb", baselineBodyWeight: 180, defaultTestingDetailOpen: true }));
    expect(markup).toContain("Body mass at test (lb)");
    expect(markup).toContain('value="180"');
    expect(markup).not.toContain("Enter weight in lb");
  });
});
