// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invalidate: vi.fn().mockResolvedValue(undefined), mutate: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { observationCount: 2, nextAction: "", regions: [], athleteConfirmedPriorityRegionIds: [] } }) },
      observations: {
        useQuery: () => ({
          data: [
            { id: 1, exerciseName: "Barbell Bench Press", observedAt: "2026-09-12T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 79.4, repetitions: null, bodyMassKgAtTest: null },
            { id: 2, exerciseName: "Barbell Bench Press", observedAt: "2026-09-11T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 74.8, repetitions: 3, bodyMassKgAtTest: null },
          ],
        }),
      },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("body-muscles", () => ({ ViewSide: { FRONT: "front", BACK: "back" }, BodyChart: class { update() {} destroy() {} } }));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { StrengthGenomePanel } from "./StrengthGenomePanel";

describe("Strength Genome performance log measurement labels", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("shows the athlete-facing measurement label, never the raw enum value", () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "lb" }));
    expect(screen.getByText(/Measured 1RM · 9\/12\/2026/)).toBeTruthy();
    expect(screen.getByText(/Working set · 9\/11\/2026/)).toBeTruthy();
    expect(screen.queryByText(/MEASURED_1RM/)).toBeNull();
    expect(screen.queryByText(/MEASURED 1RM/)).toBeNull();
    expect(screen.queryByText(/MULTI_REP/)).toBeNull();
    expect(screen.queryByText(/MULTI REP/)).toBeNull();
  });
});
