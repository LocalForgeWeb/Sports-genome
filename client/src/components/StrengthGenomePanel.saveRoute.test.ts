// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ToastOptions = { action?: { label: string; onClick: () => void } } | undefined;
type AddObservationOptions = { onSuccess?: (saved: { id: number } | undefined, variables: { exerciseName: string }) => Promise<void> };

const mocks = vi.hoisted(() => ({
  feedback: vi.fn(),
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  success: vi.fn(),
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
      // The save's own handlers are kept so the account case can answer the save as the server would.
      addObservation: {
        useMutation: (options: AddObservationOptions) => {
          mocks.addObservationOptions = options;
          return { mutate: mocks.mutate, isPending: false };
        },
      },
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
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: vi.fn() } }));

import { StrengthGenomePanel } from "./StrengthGenomePanel";

function saveLift(exercise: string, load: string) {
  fireEvent.click(screen.getByText("Log a lift"));
  fireEvent.change(screen.getByLabelText("Search and choose a catalog exercise"), { target: { value: exercise } });
  fireEvent.click(screen.getByRole("option", { name: new RegExp(`^${exercise}`) }));
  fireEvent.change(screen.getByLabelText("Load in kilograms"), { target: { value: load } });
  fireEvent.click(screen.getByRole("button", { name: /Save this lift/ }));
}

describe("a saved lift offers its record from the toast", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    mocks.mutate.mockReset();
    mocks.success.mockReset();
    mocks.addObservationOptions = null;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("opens the saved lift's record from View record, on this device", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "kg" }));
    saveLift("Preacher Curl", "30");

    expect(mocks.success).toHaveBeenCalledTimes(1);
    const [message, options] = mocks.success.mock.calls[0] as [string, ToastOptions];
    expect(message).toBe("Lift saved on this device.");
    expect(options?.action?.label).toBe("View record");
    // Saving does not move the athlete: the record opens only when asked for.
    expect(screen.queryByRole("region", { name: "Biceps recorded strength context" })).toBeNull();
    expect(document.querySelector(".strength-log-open")?.getAttribute("aria-expanded")).toBe("true");

    act(() => { options!.action!.onClick(); });

    expect(screen.getByRole("region", { name: "Biceps recorded strength context" })).toBeTruthy();
    // The log folds away so the record is what is left in view.
    expect(document.querySelector(".strength-log-open")?.getAttribute("aria-expanded")).toBe("false");
    const heading = document.activeElement as HTMLElement;
    expect(heading.hasAttribute("data-strength-region-heading")).toBe(true);
    expect(heading.textContent).toBe("Biceps");
  });

  it("gives focus back to Log a lift when that record closes, since the toast is gone by then", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "kg" }));
    saveLift("Preacher Curl", "30");
    const [, options] = mocks.success.mock.calls[0] as [string, ToastOptions];

    // The action pressed from the keyboard: focus is on the toast's button, which the
    // toast takes away with it as soon as the action has run.
    const toastButton = document.createElement("button");
    toastButton.textContent = "View record";
    document.body.appendChild(toastButton);
    toastButton.focus();
    act(() => { options!.action!.onClick(); });
    toastButton.remove();
    expect((document.activeElement as HTMLElement).hasAttribute("data-strength-region-heading")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close Biceps detail" }));

    expect(document.activeElement).toBe(document.querySelector(".strength-log-open"));
  });

  it("offers the record after an account save too", async () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
    await act(async () => { await mocks.addObservationOptions?.onSuccess?.({ id: 42 }, { exerciseName: "Preacher Curl" }); });

    const [message, options] = mocks.success.mock.calls[0] as [string, ToastOptions];
    expect(message).toBe("Lift saved. Your progress updates as you log more.");
    expect(options?.action?.label).toBe("View record");
    act(() => { options!.action!.onClick(); });
    expect(screen.getByRole("region", { name: "Biceps recorded strength context" })).toBeTruthy();
  });

  it("offers nothing for a lift no muscle group reads, rather than an action that does nothing", async () => {
    render(React.createElement(StrengthGenomePanel, { weightUnit: "kg" }));
    await act(async () => { await mocks.addObservationOptions?.onSuccess?.({ id: 43 }, { exerciseName: "Something not in the library" }); });

    expect(mocks.success).toHaveBeenCalledWith("Lift saved. Your progress updates as you log more.", undefined);
  });
});
