// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const account = vi.hoisted(() => ({ result: { data: [] as unknown[], isError: false, isFetching: false, refetch: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutLog: { list: { useQuery: () => account.result }, progressionHistory: { useQuery: () => ({ data: [] }) } },
    strengthGenome: { observations: { useQuery: () => ({ data: [] }) } },
    strengthPercentile: { forLifts: { useQuery: () => ({ data: undefined }) } },
  },
}));

import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { HISTORY_PAGE_SIZE, ProgressOverviewPanel, historyExerciseKey } from "./ProgressOverviewPanel";

const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;
const squat = exercises.find((exercise) => exercise.name === "Back Squat")!;

/** Session n finished n days ago at noon; even ones bench, odd ones squat. */
function sessions(count: number): DeviceWorkoutSession[] {
  return Array.from({ length: count }, (_, n) => {
    const at = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const lift = n % 2 === 0 ? bench : squat;
    return {
      id: `s${n}`, title: `Workout ${n}`, dayLabel: `Week 1 · Workout ${n}`, startedAt: at.toISOString(), completedAt: at.toISOString(), status: "completed", weightUnit: "lb",
      exercises: [{ id: `e${n}`, exerciseName: lift.name, catalogId: lift.id, plannedPrescription: "3 × 5", sets: [{ weight: "100", reps: "5", unit: "lb", completed: true }] }],
    } satisfies DeviceWorkoutSession;
  });
}
const seed = (list: DeviceWorkoutSession[]) => localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(list));
const rows = () => Array.from(document.querySelectorAll<HTMLButtonElement>("[data-session-row]")).map((row) => row.dataset.sessionRow);
const renderPanel = (directAccess = true) => render(React.createElement(ProgressOverviewPanel, { onOpenStrength: () => {}, onOpenTraining: () => {}, directAccess }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  account.result = { data: [], isError: false, isFetching: false, refetch: vi.fn() };
});

describe("every finished workout is reachable from Progress (H01, J15)", () => {
  it("shows a page, then more, then says it reached the end", () => {
    seed(sessions(23));
    renderPanel();
    expect(rows()).toHaveLength(HISTORY_PAGE_SIZE);
    expect(rows()[0]).toBe("s0");
    fireEvent.click(screen.getByRole("button", { name: /^Show 10 more/ }));
    expect(rows()).toHaveLength(20);
    fireEvent.click(screen.getByRole("button", { name: /^Show 3 more/ }));
    expect(rows()).toHaveLength(23);
    expect(rows()[22]).toBe("s22");
    expect(screen.queryByRole("button", { name: /^Show \d+ more/ })).toBeNull();
    expect(screen.getByText("That's every workout: 23.")).toBeTruthy();
  });

  it("groups rows under their month", () => {
    seed(sessions(40));
    renderPanel();
    const months = Array.from(document.querySelectorAll(".progress-history-month h3")).map((heading) => heading.textContent);
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(new Set(months).size).toBe(months.length);
  });

  it("opens the oldest workout's own detail and comes back to the same row", () => {
    seed(sessions(12));
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /^Show 2 more/ }));
    fireEvent.click(screen.getByRole("button", { name: /^View session: Workout 11,/ }));
    expect(document.querySelector("[data-session-detail]")?.getAttribute("data-session-id")).toBe("s11");
    expect(document.activeElement?.textContent).toBe("Workout 11");
    fireEvent.click(screen.getByRole("button", { name: "All workouts" }));
    // Same page of the list, focus on the row that was opened.
    expect(rows()).toHaveLength(12);
    expect((document.activeElement as HTMLElement).dataset.sessionRow).toBe("s11");
  });
});

describe("filters narrow the list and reset only when asked (H02, H04, J16)", () => {
  it("filters by exercise identity and by date, and counts what matches", () => {
    seed(sessions(20));
    renderPanel();
    fireEvent.change(screen.getByRole("combobox", { name: "Exercise" }), { target: { value: historyExerciseKey({ catalogId: squat.id, exerciseName: squat.name }) } });
    expect(rows().every((id) => Number(id!.slice(1)) % 2 === 1)).toBe(true);
    expect(screen.getByText("10 of 20")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "When" }), { target: { value: "30" } });
    expect(rows()).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("20 total")).toBeTruthy();
  });

  it("says no workout matches, unlike an empty history, and keeps the filters until cleared", () => {
    const old = sessions(1).map((session) => ({ ...session, completedAt: "2024-01-01T12:00:00.000Z", startedAt: "2024-01-01T11:00:00.000Z" }));
    seed(old);
    renderPanel();
    fireEvent.change(screen.getByRole("combobox", { name: "When" }), { target: { value: "90" } });
    const nomatch = document.querySelector(".progress-history-nomatch")!;
    expect(nomatch.textContent).toContain("No workouts match the last 90 days.");
    expect(screen.queryByText("Complete a Session workout to create your first record.")).toBeNull();
    fireEvent.click(within(nomatch as HTMLElement).getByRole("button", { name: "Clear filters" }));
    expect(rows()).toEqual(["s0"]);
  });

  it("keeps two exercises that share a name apart when their catalog IDs differ (H11)", () => {
    expect(historyExerciseKey({ catalogId: 1, exerciseName: "Row" })).not.toBe(historyExerciseKey({ catalogId: 2, exerciseName: "Row" }));
    expect(historyExerciseKey({ exerciseName: "Something retired" })).toBe("name:Something retired");
  });
});

describe("an account that cannot be read is not an empty history (H05)", () => {
  it("keeps this device's rows and offers to try again", () => {
    seed(sessions(2));
    account.result = { data: undefined as unknown as unknown[], isError: true, isFetching: false, refetch: vi.fn() };
    renderPanel(false);
    expect(rows()).toEqual(["s0", "s1"]);
    const error = document.querySelector(".progress-history-error")!;
    expect(error.textContent).toContain("could not be loaded just now; the ones below are from this device");
    fireEvent.click(within(error as HTMLElement).getByRole("button", { name: "Try again" }));
    expect(account.result.refetch).toHaveBeenCalledTimes(1);
  });
});
