// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";

const mocks = vi.hoisted(() => ({
  feedback: vi.fn(),
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  percentile: vi.fn(),
  percentileInput: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: {
      forLift: {
        // As react-query answers: a query that is not enabled has no data.
        useQuery: (input: unknown, options?: { enabled?: boolean }) => {
          mocks.percentileInput(input, options);
          return options?.enabled === false ? { data: undefined, isPending: true, fetchStatus: "idle" } : { data: mocks.percentile() };
        },
      },
    },
    // The muscle-rank route: no answer here keeps the map in the coverage view these tests describe.
    strengthProfile: { muscleRanks: { useQuery: () => ({ data: undefined }) } },
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    repair: { deleteStrengthObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { regions: [], athleteConfirmedPriorityRegionIds: [], nextAction: "Add a result" } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: mocks.feedback }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

/**
 * T22 of the Zercher, neck and bench handoff: a provisional row (exerciseExecution.ts) has no
 * comparison data, and none is borrowed for it - not the bench press's, though "Paused Barbell
 * Bench Press" says bench press. The route is not even asked; the record says no comparison is
 * available, and never prints a percentile (a 0th or any other).
 */
const borrowed: StrengthPercentileResult = {
  status: "resolved",
  percentile: 0.4,
  observedValue: 1.1,
  estimate: { valueKg: 88, basis: "estimated", confidence: 0.65, effectiveReps: 5 },
  confidence: 0.65,
  scoringVersion: "strength_beta_v1",
  route: "beta_community_curve",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  exerciseId: "uuid-bench",
  aliasOfExerciseId: "uuid-bench",
  borrowedCurve: true,
};

const lift = (exerciseName: string) => [{ id: "device-lift", exerciseName, observedAt: "2026-11-02T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 80, repetitions: 5, bodyMassKgAtTest: 80 }];

function openFirstRecord() {
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "kg", sexForReference: "male", baselineBodyWeight: 80 }));
  fireEvent.click(screen.getAllByRole("button", { name: "Review" })[0]);
}

describe("T22: a provisional lift is never placed against a population", () => {
  beforeEach(() => {
    mocks.percentileInput.mockReset();
    mocks.percentile.mockReset().mockReturnValue(borrowed);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  for (const name of ["Paused Barbell Bench Press", "Spoto Press", "Barbell Floor Press"]) {
    it(`${name}: no comparison asked, "No comparison available" said, no percentile and no estimated 1RM`, () => {
      localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(lift(name)));
      openFirstRecord();
      const options = mocks.percentileInput.mock.calls.at(-1)?.[1] as { enabled?: boolean } | undefined;
      expect(options?.enabled).toBe(false);
      expect(screen.getAllByText(new RegExp(`No comparison available: ${name} is new to the catalog`)).length).toBeGreaterThan(0);
      // The lift's comparison, from its heading to the progress line: no placement, not even a 0th.
      const text = document.body.textContent ?? "";
      const comparison = text.slice(text.indexOf("Comparison rank for this lift"), text.indexOf("Your progress on this lift"));
      expect(comparison).toContain("No comparison rank available for this lift");
      expect(comparison).not.toMatch(/\d+(st|nd|rd|th) percentile/);
      expect(screen.getAllByText(new RegExp(`${name} is new to the catalog and not yet reviewed, so it gets no estimated 1RM`)).length).toBeGreaterThan(0);
    });
  }

  it("still places the catalog's own bench press, so the gate is the row and not the word", () => {
    mocks.percentile.mockReturnValue({ ...borrowed, percentile: 63, aliasOfExerciseId: null, borrowedCurve: false });
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(lift("Barbell Bench Press")));
    openFirstRecord();
    const options = mocks.percentileInput.mock.calls.at(-1)?.[1] as { enabled?: boolean } | undefined;
    expect(options?.enabled).toBe(true);
    expect(screen.queryByText(/No comparison available/)).toBeNull();
  });
});
