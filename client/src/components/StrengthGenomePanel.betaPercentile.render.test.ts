// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
        useQuery: (input: unknown) => {
          mocks.percentileInput(input);
          return { data: mocks.percentile() };
        },
      },
    },
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
 * A cable curl: in the catalog, covered by a community curve, and covered by no published
 * study - which is every exercise but three, and the whole reason this route exists.
 */
const cableCurl = [{
  id: "device-curl",
  exerciseName: "Cable Curl",
  observedAt: "2026-09-12T12:00:00.000Z",
  measurementType: "MULTI_REP",
  loadKg: 40,
  repetitions: 8,
  bodyMassKgAtTest: 80,
}];

const placed: StrengthPercentileResult = {
  status: "resolved",
  percentile: 63,
  observedValue: 0.62,
  estimate: { valueKg: 49.6, basis: "estimated", confidence: 0.65, effectiveReps: 8 },
  confidence: 0.65,
  scoringVersion: "strength_beta_v1",
  route: "beta_community_curve",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  exerciseId: "uuid-cable-curl",
  aliasOfExerciseId: null,
  borrowedCurve: false,
};

function openBiceps(props: Record<string, unknown> = {}) {
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", ...props }));
  // A curl trains more than one region, so more than one offers a Review. Any of them opens the
  // same record; the first is the biceps.
  fireEvent.click(screen.getAllByRole("button", { name: "Review" })[0]);
}

describe("a logged lift gets a percentile from the community curves", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    mocks.percentileInput.mockReset();
    mocks.percentile.mockReset().mockReturnValue(placed);
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(cableCurl));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("shows the placement where the record used to say there was no ranking", () => {
    openBiceps({ sexForReference: "male", baselineBodyWeight: 176 });
    expect(screen.getByText("63rd percentile")).toBeTruthy();
    expect(screen.queryByText(/No ranking for this lift yet/)).toBeNull();
  });

  /**
   * The route is asked by the app's own catalog id, which is what each curve's canonical name
   * carries. Asking by name alone would leave the match to string luck.
   */
  it("asks for the curve by the catalog id of the exercise that was logged", () => {
    openBiceps({ sexForReference: "male", baselineBodyWeight: 176 });
    const asked = mocks.percentileInput.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(asked.exerciseName).toBe("Cable Curl");
    expect(asked.catalogExerciseId).toEqual(expect.any(Number));
    // A working set, so the load and reps travel - not a measured maximum.
    expect(asked.loadKg).toBe(40);
    expect(asked.repetitions).toBe(8);
    expect(asked.measuredOneRmKg).toBeNull();
  });

  it("reads the lift against the weight saved with it", () => {
    openBiceps({ sexForReference: "male", baselineBodyWeight: 176 });
    const asked = mocks.percentileInput.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(asked.bodyMassKg).toBe(80);
  });

  it("says nothing about a placement that did not happen", () => {
    mocks.percentile.mockReturnValue({ status: "unavailable", reason: "no_curve_for_exercise" });
    openBiceps({ sexForReference: "male", baselineBodyWeight: 176 });
    expect(screen.queryByText(/percentile/)).toBeNull();
    expect(screen.getByText(/No ranking for this lift yet/)).toBeTruthy();
  });

  /**
   * Sex is the one input the athlete can supply on the spot, so a missing one is asked for.
   * An exercise with no curve is not theirs to fix and is not raised at all.
   */
  it("asks for the one missing input the athlete can actually give", () => {
    mocks.percentile.mockReturnValue({ status: "unavailable", reason: "sex_required" });
    openBiceps({ baselineBodyWeight: 176 });
    expect(screen.getByText(/Add the sex to compare against in About Me/)).toBeTruthy();
  });
});
