// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  sessions: [] as unknown[],
  observations: [] as unknown[],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutLog: {
      list: { useQuery: () => ({ data: fixtures.sessions }) },
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
    strengthGenome: { observations: { useQuery: () => ({ data: fixtures.observations }) } },
    strengthPercentile: { forLifts: { useQuery: () => ({ data: undefined }) } },
  },
}));

import { ProgressOverviewPanel } from "./ProgressOverviewPanel";

const push = { id: 1, title: "Push", status: "completed", startedAt: "2026-09-01T10:00:00Z", completedAt: "2026-09-01T10:00:00Z", completedSetCount: 3, exerciseCount: 1 };
// Twenty reps is past the fifteen the estimate is trusted to, so the set is kept but not trended.
const twentyReps = (id: number, observedAt: string) => ({ id, exerciseName: "Barbell Bench Press", measurementType: "MULTI_REP", observedAt, loadKg: "60", repetitions: 20, laterality: "BILATERAL" });

function renderPanel() {
  return render(React.createElement(ProgressOverviewPanel, { onOpenStrength: () => {}, onOpenTraining: () => {}, directAccess: false }));
}

describe("Progress counts agree with the words beside them", () => {
  afterEach(() => {
    cleanup();
    fixtures.sessions = [];
    fixtures.observations = [];
  });

  it("reads one workout, one lift and one set left out in the singular", () => {
    fixtures.sessions = [push];
    fixtures.observations = [twentyReps(11, "2026-09-01T10:00:00Z")];
    const { container } = renderPanel();
    expect(container.querySelector(".progress-facts")?.getAttribute("aria-label")).toBe("1 workout recorded, 1 lift logged");
    expect(container.querySelector(".progress-excluded")?.textContent).toBe("1 logged set outside the validated rep range for estimation is recorded but not used for this trend.");
  });

  it("reads two sets left out of one lift in the plural", () => {
    fixtures.sessions = [push];
    fixtures.observations = [twentyReps(11, "2026-09-01T10:00:00Z"), twentyReps(12, "2026-09-08T10:00:00Z")];
    const { container } = renderPanel();
    expect(container.querySelector(".progress-facts")?.getAttribute("aria-label")).toBe("1 workout recorded, 2 lifts logged");
    expect(container.querySelector(".progress-excluded")?.textContent).toBe("2 logged sets outside the validated rep range for estimation are recorded but not used for this trend.");
  });

  it("names the trend's unit in words the method note defines", () => {
    const fives = (id: number, observedAt: string, loadKg: string) => ({ ...twentyReps(id, observedAt), loadKg, repetitions: 5 });
    fixtures.observations = [fives(21, "2026-09-01T10:00:00Z", "60"), fives(22, "2026-09-08T10:00:00Z", "66")];
    const { container } = renderPanel();
    expect(container.querySelector(".progress-trend-rows strong")?.textContent).toMatch(/^\+\d+% est\. 1RM$/);
    expect(container.querySelector(".progress-method-note")?.textContent).toContain("estimated one-rep max (est. 1RM, Epley formula)");
    expect(container.textContent).not.toContain("e1RM");
  });
});
