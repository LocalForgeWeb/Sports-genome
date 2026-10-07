// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const noData = { data: undefined };
vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutLog: { list: { useQuery: () => noData }, progressionHistory: { useQuery: () => noData } },
    strengthGenome: { observations: { useQuery: () => noData } },
    strengthPercentile: { forLifts: { useQuery: () => noData } },
  },
}));

import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { ProgressOverviewPanel } from "./ProgressOverviewPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const sissy = exercises.find((exercise) => exercise.name === "Sissy Squat")!;
const backSquat = exercises.find((exercise) => exercise.name === "Back Squat")!;

/**
 * The record of a finished workout says what was done, on the exercise it was done on: a swap
 * shows both exercises and where one became the other, and a drop set is one set of stages.
 */
describe("A finished workout's record after a swap and a drop set", () => {
  afterEach(() => { cleanup(); localStorage.clear(); });

  it("lists both exercises with the swap, and the drop set as one line of stages with its totals", () => {
    const session: DeviceWorkoutSession = {
      id: "device-1", title: "Week 1 · Legs workout", dayLabel: "Week 1 · Legs", startedAt: "2026-10-06T10:00:00.000Z", completedAt: "2026-10-06T11:00:00.000Z", status: "completed", weightUnit: "lb",
      exercises: [
        { id: "a", exerciseName: "Sissy Squat", catalogId: sissy.id, plannedPrescription: "4 × 10", sets: [{ weight: "", reps: "12", completed: true }, { weight: "", reps: "12", completed: true }], replacedBy: { swapId: "s", exerciseName: "Back Squat", catalogId: backSquat.id, afterSets: 2, at: "2026-10-06T10:20:00.000Z" } },
        { id: "b", exerciseName: "Back Squat", catalogId: backSquat.id, plannedPrescription: "4 × 10", swappedFrom: { swapId: "s", exerciseName: "Sissy Squat", catalogId: sissy.id, afterSets: 2, at: "2026-10-06T10:20:00.000Z" }, sets: [
          { weight: "135", reps: "8", unit: "lb", completed: true },
          { id: "d", type: "drop", weight: "100", reps: "5", unit: "lb", completed: true, stages: [{ id: "d-1", weight: "100", reps: "5", unit: "lb" }, { id: "d-2", weight: "70", reps: "6", unit: "lb" }, { id: "d-3", weight: "50", reps: "10", unit: "lb" }] },
        ] },
      ],
    };
    localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([session]));
    const { container } = render(React.createElement(ProgressOverviewPanel, { onOpenStrength: () => {}, onOpenTraining: () => {}, weightUnit: "lb", directAccess: true }));
    // The list row opens the workout's detail, where the sets are.
    expect(container.querySelector(".progress-session-open")!.textContent).toContain("2 exercises · 4 sets");
    fireEvent.click(screen.getByRole("button", { name: /^View session: Week 1 · Legs workout,/ }));
    const card = container.querySelector(".session-detail-exercises")!;
    expect(card).toBeTruthy();
    const text = card.textContent!;
    expect(text).toContain("Sissy Squat");
    expect(text).toContain("Switched to Back Squat after 2 sets");
    expect(text).toContain("bodyweight × 12");
    expect(text).toContain("Switched from Sissy Squat after 2 sets");
    expect(text).toContain("135 lb × 8");
    expect(text).toContain("Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10");
    expect(text).toContain("1 drop set · 3 stages · 21 reps · 1,420 lb·reps");
    // The drop set is one of Back Squat's two sets, and the workout holds four working sets.
    const backSquatRow = Array.from(card.querySelectorAll(":scope > li")).find((row) => row.querySelector("strong")?.textContent === "Back Squat")!;
    expect(backSquatRow.querySelector("small")!.textContent).toBe("2 sets");
    expect(container.querySelector(".session-detail-summary")!.textContent).toContain("Working sets4");
  });
});
