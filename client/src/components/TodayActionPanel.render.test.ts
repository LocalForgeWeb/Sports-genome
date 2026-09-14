// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  observations: [] as unknown[],
  trackedSets: [] as unknown[],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    strengthGenome: {
      overview: { useQuery: () => ({ data: { observationCount: 2 } }) },
      observations: { useQuery: () => ({ data: mocks.observations }) },
    },
    workoutLog: {
      list: { useQuery: () => ({ data: [] }) },
      progressionHistory: { useQuery: () => ({ data: mocks.trackedSets }) },
    },
  },
}));

import { TodayActionPanel } from "./TodayActionPanel";

/**
 * Two logs of the same lift, far enough apart that the within-athlete model rates the
 * change confirmed: 100 kg x 5 to 145 kg x 5 is well past the meaningful threshold.
 */
function observation(id: number, loadKg: number, observedAt: string) {
  return {
    id,
    exerciseName: "Back Squat",
    observedAt,
    measurementType: "MULTI_REP",
    loadKg,
    repetitions: 5,
    laterality: "BILATERAL",
  };
}

function renderPanel() {
  return render(
    React.createElement(TodayActionPanel, {
      stagedExerciseCount: 0,
      trainingDays: 4,
      activeDayLabel: "Week 1 · Push",
      onOpenTraining: () => {},
      onOpenStrength: () => {},
    })
  );
}

describe("Today action panel state layer", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    mocks.observations = [];
    mocks.trackedSets = [];
  });

  it("headlines a confirmed change with its direction and its boundary", () => {
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 145, "2026-06-05T12:00:00.000Z"),
    ];
    renderPanel();

    expect(screen.getByText("Back Squat")).toBeTruthy();
    expect(screen.getByText(/^\+\d+%$/)).toBeTruthy();
    expect(screen.getByText("Confirmed change")).toBeTruthy();
    expect(screen.getByText(/not a rank against other people/)).toBeTruthy();
  });

  it("states no direction when the movement sits inside normal variation", () => {
    // A ~2% difference is well inside the estimator's own error.
    mocks.observations = [
      observation(1, 100, "2026-01-05T12:00:00.000Z"),
      observation(2, 102, "2026-06-05T12:00:00.000Z"),
    ];
    renderPanel();

    expect(screen.queryByText("Confirmed change")).toBeNull();
    expect(
      screen.getByText("No change yet is large enough to call a real one rather than normal variation.")
    ).toBeTruthy();
  });

  it("invites a first comparison rather than showing an empty metric", () => {
    renderPanel();

    expect(screen.getByText("No tracked lifts yet")).toBeTruthy();
    expect(screen.getByText("Log the same lift twice and your change starts tracking here.")).toBeTruthy();
    expect(screen.queryByText("Confirmed change")).toBeNull();
  });

  it("still carries the next action beneath the state layer", () => {
    renderPanel();
    expect(screen.getByText("Choose the next useful move.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Design training day/i })).toBeTruthy();
  });
});
