// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The trend summary groups and sorts every logged lift. It ran on every render, so opening
 * "How it works" or any device-store event redid it, and the placement request's inputs
 * built from it were new each time too.
 */
const mocks = vi.hoisted(() => ({ summaries: 0 }));

// One unchanging answer: a fresh array per call would change the memo's inputs by itself.
const noData = { data: undefined };
vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutLog: {
      list: { useQuery: () => noData },
      progressionHistory: { useQuery: () => noData },
    },
    strengthGenome: { observations: { useQuery: () => noData } },
    strengthPercentile: { forLifts: { useQuery: () => noData } },
  },
}));
vi.mock("@/lib/withinAthleteStrengthChange", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/withinAthleteStrengthChange")>();
  return {
    ...original,
    summarizeWithinAthleteStrengthComparisons: (...args: Parameters<typeof original.summarizeWithinAthleteStrengthComparisons>) => {
      mocks.summaries += 1;
      return original.summarizeWithinAthleteStrengthComparisons(...args);
    },
  };
});

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { ProgressOverviewPanel } from "./ProgressOverviewPanel";

describe("Progress works out the strength trend once per change in the record", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    mocks.summaries = 0;
  });

  it("does not redo it when the method note is opened", () => {
    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([
      { id: "squat-1", exerciseName: "Back Squat", measurementType: "MULTI_REP", observedAt: "2026-06-01T10:00:00.000Z", loadKg: 100, repetitions: 5, laterality: "BILATERAL" },
    ]));
    render(React.createElement(ProgressOverviewPanel, { onOpenStrength() {}, onOpenTraining() {}, directAccess: true }));
    const afterFirstRender = mocks.summaries;
    expect(afterFirstRender).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("How it works"));
    expect(screen.getByText("How it works").closest("summary")?.getAttribute("aria-expanded")).toBe("true");
    expect(mocks.summaries).toBe(afterFirstRender);
  });
});
