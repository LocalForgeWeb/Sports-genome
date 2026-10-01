// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedback: vi.fn(), mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined), toastError: vi.fn(), toastSuccess: vi.fn(), setPriorityOptions: {} as { onError?: (error: { data?: { code?: string } }) => void } }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    // The beta community-curve route. Off by default here: these cases are about the
    // research-grade routes, and a percentile arriving would displace the card under test.
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    // The muscle-rank route: no answer here keeps the map in the coverage view these tests describe.
    strengthProfile: { muscleRanks: { useQuery: () => ({ data: undefined }) } },
    researchEvidence: { supabaseInventory: { useQuery: () => ({ data: { status: "unavailable" } }) } },
    // The repair router backs the "remove this lift" control in the history list.
    repair: { deleteStrengthObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) } },
    strengthGenome: {
      overview: { useQuery: () => ({ data: { regions: [], athleteConfirmedPriorityRegionIds: [], nextAction: "Add a result" } }) },
      observations: { useQuery: () => ({ data: [] }) },
      priorities: { useQuery: () => ({ data: [] }) },
      addObservation: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      // A failed focus write is reported through the options' onError.
      setPriority: { useMutation: (options: { onError?: (error: { data?: { code?: string } }) => void }) => { mocks.setPriorityOptions = options; return { mutate: mocks.mutate, isPending: false }; } },
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
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

describe("Strength Genome direct Review workflow", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    mocks.mutate.mockReset();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ id: "device-review", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36.2873896, repetitions: 10, bodyMassKgAtTest: 81.6466266 }]));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  // Unmount first: an open region record listens on window for Escape, and a
  // panel left mounted would keep that listener into the next test.
  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

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

  it("hands focus back to the Review button when Escape closes the record", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    const review = screen.getByRole("button", { name: "Review" });
    review.focus();
    fireEvent.click(review);
    expect(document.activeElement).not.toBe(review);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.activeElement).toBe(review);
  });

  it("hands focus back to the Review button when the close button closes the record", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    const review = screen.getByRole("button", { name: "Review" });
    review.focus();
    fireEvent.click(review);
    fireEvent.click(screen.getByRole("button", { name: "Close Biceps detail" }));
    expect(document.activeElement).toBe(review);
  });

  it("leaves focus in the exercise search when Escape there closes the record", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    const review = screen.getByRole("button", { name: "Review" });
    review.focus();
    fireEvent.click(review);
    const search = screen.getByLabelText("Search and choose a catalog exercise");
    search.focus();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(document.activeElement).toBe(search);
  });

  it("forgets the opener of a record closed another way", () => {
    // jsdom has no scrollIntoView; Log a lift scrolls the form into view.
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: scrollIntoView, configurable: true, writable: true });
    try {
      render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
      // Open an empty region from the list, then leave it through its Log a lift button.
      const chest = within(screen.getByRole("group", { name: "Strength Genome regions" })).getByRole("button", { name: /^Chest,/ });
      chest.focus();
      fireEvent.click(chest);
      fireEvent.click(screen.getByRole("button", { name: /^Log a lift for chest/ }));
      expect(document.activeElement).toBe(screen.getByLabelText("Search and choose a catalog exercise"));
      // A click that does not focus its button (Safari) leaves focus on the page.
      (document.activeElement as HTMLElement).blur();
      fireEvent.click(screen.getByRole("button", { name: "Review" }));
      fireEvent.keyDown(window, { key: "Escape" });
      expect(document.activeElement).not.toBe(chest);
    } finally {
      delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    }
  });

  it("tells a screen reader which lift each Review button opens", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    const describedBy = screen.getByRole("button", { name: "Review" }).getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("Preacher Curl");
  });

  it("offers no focus on a device-only record, which has nowhere to keep one, and still offers training", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.queryByRole("button", { name: "Set focus" })).toBeNull();
    // Renamed from "Review training" (Sep 30 §6): the action names where it goes.
    expect(screen.getByRole("button", { name: "Open Plan to add biceps work" })).toBeTruthy();
    expect(screen.getByText("Want to train this?")).toBeTruthy();
  });

  it("offers focus on an account record and says so when the focus is not saved", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: false, weightUnit: "lb" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Strength Genome regions" })).getByRole("button", { name: /^Chest,/ }));
    fireEvent.click(screen.getByRole("button", { name: "Set focus" }));
    expect(mocks.mutate).toHaveBeenCalledWith({ regionId: "chest", active: true });
    mocks.setPriorityOptions.onError?.({ data: { code: "INTERNAL_SERVER_ERROR" } });
    expect(mocks.toastError).toHaveBeenCalledWith("Focus was not saved. Check your connection and try again.");
  });

  it("names an expired sign-in, not the connection, when the focus is not saved for that reason", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: false, weightUnit: "lb" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Strength Genome regions" })).getByRole("button", { name: /^Chest,/ }));
    fireEvent.click(screen.getByRole("button", { name: "Set focus" }));
    mocks.setPriorityOptions.onError?.({ data: { code: "UNAUTHORIZED" } });
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    // Under the app-wide notice's id, so it takes that notice's place rather than
    // stacking a second toast under it, and with no pointer to a sign-in: this
    // build has none to go back to.
    const [message, options] = mocks.toastError.mock.calls[0];
    expect(message).toBe("Focus was not saved because your sign-in has expired.");
    expect(options).toMatchObject({ id: "session-expired" });
    expect(message).not.toMatch(/about me|sign in again/i);
  });

  it("calls a logged lift a lift through the whole remove flow", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    // The row sits inside the closed Recent lifts list.
    fireEvent.click(screen.getByRole("button", { name: /^Remove the Preacher Curl lift from /, hidden: true }));
    expect(within(screen.getByRole("alertdialog")).getByText("Remove this lift?")).toBeTruthy();
    expect(screen.getByText(/^The Preacher Curl lift from .* is deleted\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove lift" }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Lift removed from this device.");
    expect(localStorage.getItem(deviceStrengthObservationKey) ?? "").not.toContain("device-review");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
