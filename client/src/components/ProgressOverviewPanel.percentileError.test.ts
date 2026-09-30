// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";

/**
 * The placement request is asked once, with no retry. When it failed, every trend row just
 * lacked its placement, so a lift that cannot be placed and a request that never arrived
 * looked the same, and there was nothing to try again.
 */
const mocks = vi.hoisted(() => ({
  percentiles: { data: undefined as unknown, isError: false, isFetching: false, refetch: (() => undefined) as () => unknown },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutLog: {
      list: { useQuery: () => ({ data: [] }) },
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
    strengthGenome: {
      observations: {
        useQuery: () => ({
          data: [
            { id: 31, exerciseName: "Barbell Bench Press", measurementType: "MULTI_REP", observedAt: "2026-09-01T10:00:00Z", loadKg: "60", repetitions: 5, bodyMassKgAtTest: "80", laterality: "BILATERAL" },
            { id: 32, exerciseName: "Barbell Bench Press", measurementType: "MULTI_REP", observedAt: "2026-09-08T10:00:00Z", loadKg: "65", repetitions: 5, bodyMassKgAtTest: "80", laterality: "BILATERAL" },
          ],
        }),
      },
    },
    strengthPercentile: { forLifts: { useQuery: () => mocks.percentiles } },
  },
}));

import { ProgressOverviewPanel } from "./ProgressOverviewPanel";

const placed: StrengthPercentileResult = {
  status: "resolved",
  percentile: 63,
  observedValue: 0.95,
  estimate: { valueKg: 75.8, basis: "estimated", confidence: 0.8, effectiveReps: 5 },
  confidence: 0.8,
  scoringVersion: "strength_beta_v1",
  route: "beta_community_curve",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  exerciseId: "bench",
  aliasOfExerciseId: null,
  borrowedCurve: false,
};

const notice = /could not be read just now/;

function renderPanel() {
  return render(React.createElement(ProgressOverviewPanel, { onOpenStrength: () => {}, onOpenTraining: () => {}, sexForReference: "male", directAccess: false }));
}

describe("Progress says when placements could not be fetched", () => {
  afterEach(() => {
    cleanup();
    mocks.percentiles = { data: undefined, isError: false, isFetching: false, refetch: () => undefined };
  });

  it("says so and offers to try again when the request failed", () => {
    const refetch = vi.fn();
    mocks.percentiles = { data: undefined, isError: true, isFetching: false, refetch };
    renderPanel();
    const line = screen.getByText(notice);
    expect(line.getAttribute("role")).toBe("status");
    expect(line.textContent).toContain("Your change tracking above does not need it.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("holds the button while the second try is on its way", () => {
    mocks.percentiles = { data: undefined, isError: true, isFetching: true, refetch: vi.fn() };
    renderPanel();
    const button = screen.getByRole("button", { name: "Trying again…" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("stays quiet when a later refetch failed but the placements already shown still stand", () => {
    mocks.percentiles = { data: [placed], isError: true, isFetching: false, refetch: vi.fn() };
    const { container } = renderPanel();
    expect(screen.queryByText(notice)).toBeNull();
    expect(container.querySelector(".progress-percentile")).not.toBeNull();
  });

  it("stays quiet when the request did not fail", () => {
    mocks.percentiles = { data: undefined, isError: false, isFetching: false, refetch: vi.fn() };
    renderPanel();
    expect(screen.queryByText(notice)).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});
