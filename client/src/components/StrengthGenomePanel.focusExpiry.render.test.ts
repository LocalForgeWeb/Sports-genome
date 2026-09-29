// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Toaster, toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SetPriorityOptions = { onError?: (error: { data?: { code?: string } }) => void };

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  setPriorityOptions: {} as SetPriorityOptions,
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
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      // The focus write's own handlers are kept so the test can answer it the way the server would.
      setPriority: { useMutation: (options: SetPriorityOptions) => { mocks.setPriorityOptions = options; return { mutate: mocks.mutate, isPending: false }; } },
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

describe("Strength Genome focus save after a sign-in lapse", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { cleanup(); toast.dismiss(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("shows one toast that says the focus was not saved, in place of the app-wide notice", async () => {
    render(React.createElement(React.Fragment, null,
      React.createElement(Toaster),
      React.createElement(StrengthGenomePanel, { directAccess: false, weightUnit: "lb" })));
    fireEvent.click(within(screen.getByRole("group", { name: "Strength Genome regions" })).getByRole("button", { name: /^Chest,/ }));
    fireEvent.click(screen.getByRole("button", { name: "Set focus" }));

    // The refused write reaches main.tsx's MutationCache first, which posts the app-wide notice.
    act(() => { toast(expiryNotice.title, { id: "session-expired", description: expiryNotice.description }); });
    await screen.findByText(expiryNotice.title);
    // Then the focus write's own handler.
    act(() => { mocks.setPriorityOptions.onError?.({ data: { code: "UNAUTHORIZED" } }); });

    await screen.findByText("Focus was not saved because your sign-in has expired.");
    await waitFor(() => expect(screen.queryByText(expiryNotice.title)).toBeNull());
    const toasts = document.querySelectorAll("[data-sonner-toast]");
    expect(toasts).toHaveLength(1);
    // The notice's promise that everything stays saved is not left under a focus that was saved nowhere.
    expect(screen.queryByText(expiryNotice.description)).toBeNull();
    expect(toasts[0].textContent ?? "").not.toMatch(/about me|sign in again/i);
  });
});
