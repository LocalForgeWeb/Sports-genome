// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));

// Ranks are drawn: the request answered, with no muscle placed and nothing unranked.
const drawnRanks = { data: { status: "ok", muscles: [], unranked: [] }, isPending: false, isFetching: false, fetchStatus: "idle" };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    strengthProfile: { muscleRanks: { useQuery: () => drawnRanks } },
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

const bench = { id: "device-bench", exerciseName: "Barbell Bench Press", observedAt: "2026-09-12T12:00:00.000Z", measurementType: "MEASURED_1RM", loadKg: 100 };
const note = /read against your profile weight/;

function renderWith(observations: object[]) {
  localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(observations));
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "kg", sexForReference: "male", baselineBodyWeight: 80 }));
}

describe("the rank map says when a lift is read against the profile weight", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

  it("names the lift saved without a body weight, and how to fix it", () => {
    renderWith([bench]);
    const notice = document.querySelector("[data-rank-body-mass-note]");
    expect(notice?.textContent).toBe("Your Barbell Bench Press lift has no body weight saved for its day, so it is read against your profile weight. Open its record to save what you weighed that day.");
  });

  it("lists each lift saved without a body weight when there are several", () => {
    renderWith([bench, { ...bench, id: "device-squat", exerciseName: "Back Squat", observedAt: "2026-09-10T12:00:00.000Z", loadKg: 120 }, { ...bench, id: "device-curl", exerciseName: "Preacher Curl", loadKg: 30, bodyMassKgAtTest: 80 }]);
    const notice = document.querySelector("[data-rank-body-mass-note]")!;
    expect(notice.querySelector("summary")?.textContent).toBe("2 lifts are read against your profile weight");
    expect(Array.from(notice.querySelectorAll("li"), (item) => item.textContent)).toEqual(["Barbell Bench Press", "Back Squat"]);
    expect(notice.textContent).toContain("Open each one's record to save what you weighed that day.");
  });

  it("says nothing when every lift carries the weight saved with it", () => {
    renderWith([{ ...bench, bodyMassKgAtTest: 82 }]);
    expect(document.querySelector("[data-rank-body-mass-note]")).toBeNull();
    expect(screen.queryByText(note)).toBeNull();
  });
});
