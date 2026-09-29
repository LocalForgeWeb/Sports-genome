// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountSessions: [] as unknown[],
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutLog: {
      list: { useQuery: () => ({ data: mocks.accountSessions }) },
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
    strengthGenome: { observations: { useQuery: () => ({ data: [] }) } },
    strengthPercentile: { forLifts: { useQuery: () => ({ data: undefined }) } },
  },
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { ProgressOverviewPanel } from "./ProgressOverviewPanel";

const finished = (id: string, title: string, completedAt: string) => ({
  id,
  title,
  dayLabel: `Week 1 · Day 01 · ${title}`,
  startedAt: completedAt,
  completedAt,
  status: "completed",
  exercises: [{ id: `${id}-e`, exerciseName: "Barbell Bench Press", plannedPrescription: "3 × 5", sets: [{ weight: "80", reps: "5", completed: true }] }],
});
const running = { ...finished("live", "Legs", "2026-09-24T10:00:00.000Z"), status: "active", completedAt: undefined };

function seed() {
  localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([
    finished("push", "Push", "2026-09-22T10:00:00.000Z"),
    finished("pull", "Pull", "2026-09-23T10:00:00.000Z"),
    running,
  ]));
}

function renderPanel(directAccess = true) {
  return render(React.createElement(ProgressOverviewPanel, { onOpenStrength: () => {}, onOpenTraining: () => {}, directAccess }));
}

const removeButton = (title: string) => screen.getByRole("button", { name: new RegExp(`^Remove the ${title} workout from `) });

describe("a finished workout on this device can be taken back from Progress", () => {
  beforeEach(seed);
  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    mocks.accountSessions = [];
    mocks.success.mockReset();
    mocks.error.mockReset();
    vi.restoreAllMocks();
  });

  it("keeps the control inside the opened row, not in the row's summary line", () => {
    renderPanel();
    const button = removeButton("Push");
    expect(button.textContent).toBe("Remove this workout");
    expect(button.closest("details")).not.toBeNull();
    expect(button.closest("summary")).toBeNull();
    expect(button.closest("details")?.querySelector(".progress-session-sets")).not.toBeNull();
  });

  it("asks first, names the workout and says what removing it changes", () => {
    renderPanel();
    fireEvent.click(removeButton("Push"));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Remove this workout?")).toBeTruthy();
    const body = dialog.querySelector("#confirm-dialog-body")?.textContent ?? "";
    expect(body).toMatch(/^Push from .+ is deleted from this device\./);
    expect(body).toContain("It stops counting in your workouts, your strength trends and your muscle ranks.");
    expect(body).toContain("This cannot be undone.");
    // Nothing is gone until the athlete confirms.
    expect(loadDeviceWorkoutSessions().map((session) => session.id)).toEqual(["push", "pull", "live"]);
  });

  it("removes only that workout once confirmed, and the list follows the device", () => {
    renderPanel();
    expect(screen.getByText("2 total")).toBeTruthy();
    fireEvent.click(removeButton("Push"));
    fireEvent.click(screen.getByRole("button", { name: "Remove workout" }));

    expect(loadDeviceWorkoutSessions().map((session) => session.id)).toEqual(["pull", "live"]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Remove the Push workout/ })).toBeNull();
    expect(removeButton("Pull")).toBeTruthy();
    expect(screen.getByText("1 total")).toBeTruthy();
    expect(mocks.success).toHaveBeenCalledWith("Workout removed from this device.");
  });

  it("changes nothing when the athlete cancels", () => {
    renderPanel();
    fireEvent.click(removeButton("Pull"));
    // The dialog's worded Cancel, not its close cross (which is also named Cancel).
    fireEvent.click(within(screen.getByRole("alertdialog")).getByText("Cancel"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(loadDeviceWorkoutSessions().map((session) => session.id)).toEqual(["push", "pull", "live"]);
  });

  it("says so when the device refuses the save, and keeps the workout", () => {
    renderPanel();
    fireEvent.click(removeButton("Push"));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    fireEvent.click(screen.getByRole("button", { name: "Remove workout" }));
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith("This workout could not be removed", { description: "The device refused the save, so nothing changed." });
    expect(loadDeviceWorkoutSessions().map((session) => session.id)).toEqual(["push", "pull", "live"]);
    expect(removeButton("Push")).toBeTruthy();
  });

  it("offers no removal on an account record, which has no route to delete it", () => {
    localStorage.clear();
    mocks.accountSessions = [{ id: 7, title: "Upper", status: "completed", startedAt: "2026-09-20T10:00:00.000Z", completedAt: "2026-09-20T11:00:00.000Z", completedSetCount: 12, exerciseCount: 4 }];
    renderPanel(false);
    expect(screen.getByText("Upper")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Remove the / })).toBeNull();
  });
});
