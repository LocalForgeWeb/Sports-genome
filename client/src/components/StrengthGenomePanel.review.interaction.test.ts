// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedback: vi.fn(), mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    // The beta community-curve route. Off by default here: these cases are about the
    // research-grade routes, and a percentile arriving would displace the card under test.
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    // The repair router backs the "remove this test" control in the history list.
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
      // Undefined stands for the status still loading: the offline notice stays hidden.
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: {
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: mocks.feedback }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

describe("Strength Genome direct Review workflow", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ id: "device-review", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36.2873896, repetitions: 10, bodyMassKgAtTest: 81.6466266 }]));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("opens the routed biceps record detail from the rendered Review action with optional feedback", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(mocks.feedback).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("region", { name: "Biceps recorded strength context" })).toBeTruthy();
    expect(screen.getByText(/0\.44× your body weight on that day — for your own context, not a rank\./)).toBeTruthy();
    // A preacher curl is not one of the three lifts the published reference
    // covers, so this says so plainly rather than explaining a study protocol.
    expect(screen.getByText("No ranking for this lift yet")).toBeTruthy();
  });
});
