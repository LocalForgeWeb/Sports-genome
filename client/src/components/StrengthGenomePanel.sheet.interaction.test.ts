// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedback: vi.fn(), mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
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

/** A phone is anything below the dock's breakpoint, where the record becomes a modal sheet. */
function stubWidth(phone: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(max-width: 1023px)" ? phone : false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
}

/** The panel in the shape of the app: inside <main>, beside the bottom navigation and the toaster's live region. */
function renderPage() {
  const onOpenTraining = vi.fn();
  render(React.createElement("div", { id: "app-shell" },
    React.createElement("main", null, React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", onOpenTraining })),
    React.createElement("div", { className: "mobile-workspace-dock" }, React.createElement("nav", { "aria-label": "Primary mobile navigation" }, React.createElement("button", { type: "button" }, "Home"))),
    React.createElement("section", { "aria-live": "polite", "aria-label": "Notifications" }),
  ));
  return {
    onOpenTraining,
    dock: document.querySelector(".mobile-workspace-dock") as HTMLElement,
    toaster: screen.getByRole("region", { name: "Notifications" }),
  };
}

function openFromReview() {
  const review = screen.getByRole("button", { name: "Review" });
  review.focus();
  fireEvent.click(review);
  return review;
}

describe("the Strength record on a phone", () => {
  beforeEach(() => {
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ id: "device-curl", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36.2873896, repetitions: 10, bodyMassKgAtTest: 81.6466266 }]));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
    stubWidth(true);
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; document.body.removeAttribute("style"); localStorage.clear(); vi.unstubAllGlobals(); });

  it("opens as a modal dialog named by its title, with the lift on show and its date under it, and moves focus in", () => {
    renderPage();
    openFromReview();
    const dialog = screen.getByRole("dialog", { name: "Biceps" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toMatch(/^Preacher Curl · /);
    expect(document.activeElement).toBe(within(dialog).getByRole("heading", { name: "Biceps" }));
    // A header that does not scroll holds the title, Close and the muscle-group select;
    // the record under it is the one scroll region, and the actions sit below that.
    const header = dialog.querySelector("header.strength-region-record-heading") as HTMLElement;
    expect(within(header).getByRole("button", { name: "Close Biceps detail" })).toBeTruthy();
    expect(within(header).getByRole("combobox", { name: "Muscle group to show" })).toBeTruthy();
    expect(dialog.querySelectorAll(".strength-region-record-body")).toHaveLength(1);
    expect(header.contains(dialog.querySelector(".strength-region-record-body"))).toBe(false);
    expect(document.querySelector(".strength-region-scrim")).toBeTruthy();
  });

  it("makes the page and the bottom navigation inert while open, keeps the toaster live, and gives it all back on Close", () => {
    const { dock, toaster } = renderPage();
    const review = openFromReview();
    const dialog = screen.getByRole("dialog", { name: "Biceps" });

    expect(dock.hasAttribute("inert")).toBe(true);
    expect(screen.getByRole("group", { name: "Strength Genome regions" }).closest("[inert]")).not.toBeNull();
    expect(review.closest("[inert]")).not.toBeNull();
    expect(dialog.closest("[inert]")).toBeNull();
    expect(document.querySelector(".strength-region-scrim")!.closest("[inert]")).toBeNull();
    expect(toaster.closest("[inert]")).toBeNull();
    expect(document.body.style.position).toBe("fixed");

    fireEvent.click(within(dialog).getByRole("button", { name: "Close Biceps detail" }));
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    expect(document.body.style.position).toBe("");
    expect(document.activeElement).toBe(review);
  });

  it("closes on Escape, handing focus back to its opener and the page back to where it was scrolled", () => {
    vi.stubGlobal("scrollY", 640);
    renderPage();
    const review = openFromReview();
    expect(document.body.style.top).toBe("-640px");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 640);
    expect(document.activeElement).toBe(review);
  });

  it("closes from the scrim", () => {
    renderPage();
    const review = openFromReview();
    fireEvent.click(document.querySelector(".strength-region-scrim")!);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    expect(document.activeElement).toBe(review);
  });

  it("keeps Tab inside the sheet", () => {
    renderPage();
    openFromReview();
    const dialog = screen.getByRole("dialog", { name: "Biceps" });
    // Focus starts on the title; Shift+Tab from there wraps to the last control, the footer's.
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Open Plan to add biceps work" }));
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Close Biceps detail" }));
  });

  it("switches muscle group from its own header, since the figure behind it cannot be tapped", () => {
    const { dock } = renderPage();
    openFromReview();
    fireEvent.change(screen.getByRole("combobox", { name: "Muscle group to show" }), { target: { value: "chest" } });

    const dialog = screen.getByRole("dialog", { name: "Chest" });
    expect(within(dialog).getByText("Nothing logged for this muscle group yet.")).toBeTruthy();
    // Focus stays on the select the athlete just used, and the page stays held behind.
    expect((document.activeElement as HTMLSelectElement).value).toBe("chest");
    expect(document.activeElement?.hasAttribute("data-strength-region-select")).toBe(true);
    expect(dock.hasAttribute("inert")).toBe(true);
  });

  it("names where its training action goes, and keeps it in the footer outside the scroll region", () => {
    const { onOpenTraining } = renderPage();
    openFromReview();
    const action = screen.getByRole("button", { name: "Open Plan to add biceps work" });
    expect(action.textContent?.trim()).toBe("Open Plan");
    expect(action.closest(".strength-region-focus-row")).not.toBeNull();
    expect(action.closest(".strength-region-record-body")).toBeNull();
    fireEvent.click(action);
    expect(onOpenTraining).toHaveBeenCalledTimes(1);
  });
});

describe("the Strength record on a wide screen", () => {
  beforeEach(() => {
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([{ id: "device-curl", exerciseName: "Preacher Curl", observedAt: "2026-08-28T12:00:00.000Z", measurementType: "MULTI_REP", loadKg: 36.2873896, repetitions: 10, bodyMassKgAtTest: 81.6466266 }]));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
    stubWidth(false);
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; document.body.removeAttribute("style"); localStorage.clear(); vi.unstubAllGlobals(); });

  it("stays a panel in the page: no scrim, no modal semantics, nothing behind it inert", () => {
    const { dock } = renderPage();
    openFromReview();
    const panel = screen.getByRole("group", { name: "Biceps" });
    expect(panel.hasAttribute("aria-modal")).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".strength-region-scrim")).toBeNull();
    expect(dock.hasAttribute("inert")).toBe(false);
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
    expect(document.body.style.position).toBe("");
  });

  it("scrolls back to where the page stood when it closes to its opener", () => {
    vi.stubGlobal("scrollY", 300);
    renderPage();
    const review = openFromReview();
    fireEvent.click(screen.getByRole("button", { name: "Close Biceps detail" }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: "smooth" });
    expect(document.activeElement).toBe(review);
  });
});
