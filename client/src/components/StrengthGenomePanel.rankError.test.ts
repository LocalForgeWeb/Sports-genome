// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RankQueryResult = { data?: unknown; isError?: boolean; isPending?: boolean; isFetching?: boolean; fetchStatus?: string; refetch?: () => Promise<unknown> };

const mocks = vi.hoisted(() => ({
  feedback: vi.fn(),
  mutate: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn().mockResolvedValue(undefined),
  // What the muscle-rank request answers, set per case.
  ranks: { data: undefined } as RankQueryResult,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ strengthGenome: { overview: { invalidate: mocks.invalidate }, observations: { invalidate: mocks.invalidate }, priorities: { invalidate: mocks.invalidate } } }),
    strengthPercentile: { forLift: { useQuery: () => ({ data: undefined }) } },
    strengthProfile: { muscleRanks: { useQuery: () => mocks.ranks } },
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

/** A 175 lb bench at 145 lb, with the body weight saved alongside it. */
const benchPress = [{
  id: "device-bench",
  exerciseName: "Barbell Bench Press",
  observedAt: "2026-09-12T12:00:00.000Z",
  measurementType: "MEASURED_1RM",
  loadKg: 175 * 0.45359237,
  bodyMassKgAtTest: 145 * 0.45359237,
}];

const failedNotice = /Ranks could not be worked out just now/;

function renderPanel(props: Record<string, unknown> = { sexForReference: "male" }) {
  render(React.createElement(StrengthGenomePanel, { directAccess: true, weightUnit: "lb", ...props }));
}

describe("muscle ranks that could not be worked out", () => {
  beforeEach(() => {
    mocks.feedback.mockReset();
    mocks.refetch.mockClear();
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(benchPress));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => { document.body.innerHTML = ""; localStorage.clear(); vi.unstubAllGlobals(); mocks.ranks = { data: undefined }; });

  it("says so when the request fails, and Try again asks once more", () => {
    mocks.ranks = { data: undefined, isError: true, isFetching: false, refetch: mocks.refetch };
    renderPanel();
    expect(screen.getByText(failedNotice).getAttribute("role")).toBe("status");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("says the same when the rank service answers that it failed", () => {
    mocks.ranks = { data: { status: "unavailable", reason: "service_error" }, isFetching: false, refetch: mocks.refetch };
    renderPanel();
    expect(screen.getByText(failedNotice)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("says it is waiting for a connection while offline, not that ranking is under way", () => {
    mocks.ranks = { data: undefined, isPending: true, fetchStatus: "paused", refetch: mocks.refetch };
    renderPanel();
    expect(screen.getByText(/Waiting for a connection to rank your lifts/)).toBeTruthy();
    expect(screen.queryByText(/Ranking your lifts/)).toBeNull();
    expect(screen.queryByText(failedNotice)).toBeNull();
  });

  // A background refetch keeps the ranks it already has. The map still draws
  // them, so neither notice may claim the map is showing coverage instead.
  const ranked = { status: "ok", muscles: [], unranked: [{ exerciseName: "Barbell Bench Press", reason: "no_reference" }] };

  it("says nothing about waiting when ranks are drawn and a refetch waits offline", () => {
    mocks.ranks = { data: ranked, isPending: false, isFetching: false, fetchStatus: "paused", refetch: mocks.refetch };
    renderPanel();
    expect(document.querySelector(".strength-map-legend")).toBeNull();
    expect(screen.queryByText(/Waiting for a connection/)).toBeNull();
    expect(screen.queryByText(failedNotice)).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByText("1 lift is not in these ranks")).toBeTruthy();
  });

  it("says nothing failed when ranks are drawn and a background refetch fails", () => {
    mocks.ranks = { data: ranked, isError: true, isPending: false, isFetching: false, fetchStatus: "idle", refetch: mocks.refetch };
    renderPanel();
    expect(document.querySelector(".strength-map-legend")).toBeNull();
    expect(screen.queryByText(failedNotice)).toBeNull();
    expect(screen.queryByText(/Waiting for a connection/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByText("1 lift is not in these ranks")).toBeTruthy();
  });

  it("asks for the sex to compare against, and nothing else, when none is set", () => {
    mocks.ranks = { data: undefined, isError: true, refetch: mocks.refetch };
    renderPanel({});
    expect(screen.getByText(/Ranks on this map need the sex to compare against/)).toBeTruthy();
    expect(screen.queryByText(failedNotice)).toBeNull();
    expect(screen.queryByText(/Waiting for a connection/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});
