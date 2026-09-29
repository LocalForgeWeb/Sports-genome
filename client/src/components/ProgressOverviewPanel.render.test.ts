// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

import { deviceStrengthObservationKey } from "@/lib/deviceStrengthObservations";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";
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

describe("Progress lists what this device recorded", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  const set = (completed: boolean) => ({ weight: "60", reps: "5", unit: "kg", completed });
  const finish = (id: string, title: string, completedAt: string, sets: ReturnType<typeof set>[]) => ({
    id,
    title,
    dayLabel: `Week 1 · ${title}`,
    startedAt: completedAt,
    completedAt,
    status: "completed",
    exercises: [{ id: `${id}-e`, exerciseName: "Barbell Bench Press", plannedPrescription: "3 × 5", sets }],
  });
  const squat = (id: string, observedAt: string, loadKg: number) => ({ id, exerciseName: "Back Squat", measurementType: "MULTI_REP", observedAt, loadKg, repetitions: 5, laterality: "BILATERAL" });

  function renderOnDevice(onOpenTraining = () => {}) {
    return render(React.createElement(ProgressOverviewPanel, { onOpenStrength: () => {}, onOpenTraining }));
  }

  it("says how to start each record when nothing is stored yet", () => {
    renderOnDevice();
    expect(screen.getByRole("heading", { name: "Your completed sessions." })).toBeTruthy();
    expect(screen.getByText("Complete a Session workout to create your first record.")).toBeTruthy();
    expect(screen.getByText("0 total")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "No comparable history yet." })).toBeTruthy();
    expect(screen.getByText("Log a lift in the Strength Genome to start a trend.")).toBeTruthy();
  });

  it("lists finished workouts newest first, with their counts, and leaves out a finish with no set done", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([
      finish("pull", "Pull B", "2026-09-20T10:00:00.000Z", [set(true)]),
      finish("empty", "Legs C", "2026-09-21T10:00:00.000Z", [set(false), set(false)]),
      finish("push", "Push A", "2026-09-22T10:00:00.000Z", [set(true), set(true), set(false)]),
    ]));
    const { container } = renderOnDevice();
    const cards = container.querySelectorAll(".progress-records .progress-session-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector("summary p")?.textContent).toBe("Push A");
    expect(cards[1].querySelector("summary p")?.textContent).toBe("Pull B");
    const newest = cards[0].textContent || "";
    expect(newest).toContain("1 exercise");
    expect(newest).toContain("2 sets");
    expect(newest).toContain("Device");
    expect(newest).toContain("2 of 3 sets");
    expect(container.textContent).not.toContain("Legs C");
    expect(container.querySelector(".progress-facts")?.textContent).toContain("2 on this device");
    expect(screen.getByText("2 total")).toBeTruthy();
  });

  it("heads the trend as an estimated change once a lift is logged twice", () => {
    window.localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([
      squat("squat-1", "2026-06-01T10:00:00.000Z", 100),
      squat("squat-2", "2026-08-01T10:00:00.000Z", 145),
    ]));
    const { container } = renderOnDevice();
    expect(screen.getByRole("heading", { name: "Estimated change since your first log" })).toBeTruthy();
    expect(container.querySelector(".progress-trend-rows p")?.textContent).toBe("Back Squat");
  });

  it("hands the plan to the page to open", () => {
    const onOpenTraining = vi.fn();
    renderOnDevice(onOpenTraining);
    fireEvent.click(screen.getByRole("button", { name: "Open your plan" }));
    expect(onOpenTraining).toHaveBeenCalledTimes(1);
  });
});
