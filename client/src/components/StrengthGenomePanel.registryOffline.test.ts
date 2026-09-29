// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `failed` stands for the library requests failing outright (no signal, or the
// API down after its retries); false stands for them still loading.
const mocks = vi.hoisted(() => ({ mutate: vi.fn(), invalidate: vi.fn().mockResolvedValue(undefined), failed: false }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    // The community curve is out of reach too, so no percentile stands in for the library.
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined, isError: mocks.failed }) } },
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
      referenceRows: { useQuery: () => ({ data: undefined, isError: mocks.failed }) },
      referenceRegistryStatus: { useQuery: () => ({ data: undefined, isError: mocks.failed }) },
    },
    workoutLog: { progressionHistory: { useQuery: () => ({ data: [] }) } },
  },
}));
vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { StrengthGenomePanel } from "./StrengthGenomePanel";

const benchPress = [{
  id: "device-bench",
  exerciseName: "Barbell Bench Press",
  observedAt: "2026-09-12T12:00:00.000Z",
  measurementType: "MEASURED_1RM",
  loadKg: 175 * 0.45359237,
  bodyMassKgAtTest: 145 * 0.45359237,
}];

const offlineNotice = /says nothing about your lifts/;
const offlineReason = /The research library is not reachable right now/;

function openBenchRecord() {
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", sexForReference: "male" }));
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  return screen.getByRole("group", { name: /record$/ });
}

describe("a research library that cannot be reached", () => {
  beforeEach(() => {
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(benchPress));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); mocks.failed = false; });

  it("says so in How ranks work and in the lift's record, when the request itself fails", () => {
    mocks.failed = true;
    const sheet = openBenchRecord();

    const notice = screen.getByText(offlineNotice);
    expect(notice.getAttribute("role")).toBe("status");
    expect(notice.closest("details")?.querySelector("summary")?.textContent).toContain("How ranks work");
    expect(sheet.textContent).toMatch(offlineReason);
  });

  it("says nothing about the library while its requests are still loading", () => {
    mocks.failed = false;
    const sheet = openBenchRecord();

    expect(screen.queryByText(offlineNotice)).toBeNull();
    expect(sheet.textContent).not.toMatch(offlineReason);
  });
});
