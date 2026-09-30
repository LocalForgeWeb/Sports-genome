// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Toaster, toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AddObservationOptions = { onError?: (error: { data?: { code?: string } }) => void };

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  addObservationOptions: null as AddObservationOptions | null,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    // The muscle-rank route: no answer here keeps the map in the coverage view.
    strengthProfile: { muscleRanks: { useQuery: () => ({ data: undefined }) } },
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    repair: { deleteStrengthObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { regions: [], athleteConfirmedPriorityRegionIds: [], nextAction: "Add a result" } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      // The save's own handlers are kept so the test can answer it the way the server would.
      addObservation: { useMutation: (options: AddObservationOptions) => { mocks.addObservationOptions = options; return { mutate: mocks.mutate, isPending: false }; } },
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: {
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));

import { expiryNotice } from "@/lib/sessionExpiryNotice";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

describe("Strength Genome lift save after a sign-in lapse", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.addObservationOptions = null;
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { cleanup(); toast.dismiss(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("leaves one toast that says the lift was not saved, not that everything stays saved", async () => {
    render(React.createElement(React.Fragment, null,
      React.createElement(Toaster),
      React.createElement(StrengthGenomePanel, { directAccess: false, weightUnit: "lb" })));

    // The refused save reaches main.tsx's MutationCache first, which posts the app-wide notice.
    act(() => { toast(expiryNotice.title, { id: "session-expired", description: expiryNotice.description }); });
    await screen.findByText(expiryNotice.description);
    // Then the save's own handler.
    act(() => { mocks.addObservationOptions?.onError?.({ data: { code: "UNAUTHORIZED" } }); });

    await screen.findByText("This lift was not saved. Your entry is still in the form.");
    await waitFor(() => expect(screen.queryByText(expiryNotice.description)).toBeNull());
    const toasts = document.querySelectorAll("[data-sonner-toast]");
    expect(toasts).toHaveLength(1);
    expect(toasts[0].textContent ?? "").not.toMatch(/about me|sign in again/i);
    // The reason is still written beside the save button.
    expect(screen.getByRole("alert").textContent).toBe("This lift was not saved because your sign-in has expired. Your entry is still here.");
  });
});
