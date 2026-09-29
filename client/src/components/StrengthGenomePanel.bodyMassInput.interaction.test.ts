// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined) }));

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
      setPriority: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      setObservationBodyMass: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
      powerliftingNorms: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

function openMoreOptions() {
  fireEvent.click(screen.getByText("Log a lift"));
  fireEvent.click(screen.getByRole("button", { name: "Show more options" }));
  return screen.getByLabelText("Body mass at test in pounds") as HTMLInputElement;
}

describe("Strength Genome body mass at test", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => { cleanup(); document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); });

  it("starts from the profile weight, can be emptied, and takes a new number typed after clearing", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", baselineBodyWeight: 180 }));
    const bodyMass = openMoreOptions();
    expect(bodyMass.value).toBe("180");

    fireEvent.change(bodyMass, { target: { value: "" } });
    expect(bodyMass.value).toBe("");

    fireEvent.change(bodyMass, { target: { value: "175" } });
    expect(bodyMass.value).toBe("175");
  });

  it("fills an untouched box with a profile weight that arrives after the form mounted", () => {
    const { rerender } = render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb" }));
    const bodyMass = openMoreOptions();
    expect(bodyMass.value).toBe("");

    rerender(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", baselineBodyWeight: 180 }));
    expect(bodyMass.value).toBe("180");
  });

  it("puts the profile weight back after a saved lift, even when the athlete had emptied the box", () => {
    render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", baselineBodyWeight: 180 }));
    const bodyMass = openMoreOptions();
    fireEvent.change(bodyMass, { target: { value: "" } });

    fireEvent.change(screen.getByLabelText("Search and choose a catalog exercise"), { target: { value: "Back Squat" } });
    const option = screen.getAllByRole("option").find((candidate) => candidate.querySelector("strong")?.textContent === "Back Squat");
    fireEvent.click(option!);
    fireEvent.change(screen.getByLabelText("Load in pounds"), { target: { value: "225" } });
    fireEvent.click(screen.getByRole("button", { name: /Save this lift/ }));

    const saved = JSON.parse(localStorage.getItem(deviceStrengthObservationKey) ?? "[]") as Record<string, unknown>[];
    expect(saved).toHaveLength(1);
    // A blank box saves no body weight for the lift; the next lift starts from the profile again.
    expect(saved[0].bodyMassKgAtTest).toBeUndefined();
    expect(bodyMass.value).toBe("180");
  });
});
