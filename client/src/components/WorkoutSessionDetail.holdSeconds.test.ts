// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { WorkoutSessionDetail } from "./WorkoutSessionDetail";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * A Dead Hang set logged before its seconds were required: completed, no seconds, no reps. The
 * session detail reads the exercise's measure from the atlas (Dead Hang is measured in seconds in
 * the real forearm data), so Correct a set asks for Seconds and stores seconds, never reps (R2).
 */
const workout: DeviceWorkoutSession = {
  id: "w1", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-16T10:00:00.000Z", completedAt: "2026-10-16T10:45:00.000Z", status: "completed", weightUnit: "lb",
  exercises: [
    { id: "hang", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "3 × 30 sec", plannedSets: 1, skippedSets: 0, sets: [{ id: "h1", weight: "", reps: "", completed: true }] },
    { id: "row", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "1 × 8", plannedSets: 1, skippedSets: 0, sets: [{ id: "r1", weight: "135", reps: "8", unit: "lb", completed: true }] },
  ],
};
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const view = () => document.querySelector("[data-session-detail]") as HTMLElement;

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([workout]));
  render(createElement(WorkoutSessionDetail, { sessionId: "w1", weightUnit: "lb", variant: "history" }));
});
afterEach(() => cleanup());

describe("a hold logged without its seconds", () => {
  it("says the seconds were not recorded, and asks for Seconds when corrected", () => {
    expect(view().textContent).toContain("Seconds not recorded");
    expect(view().textContent).not.toContain("— lb × —");
    fireEvent.click(screen.getByRole("button", { name: "Correct a set" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1 of Dead Hang" }));
    expect(screen.queryByLabelText("Reps")).toBeNull();
    fireEvent.change(screen.getByLabelText("Seconds"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: /Save set/ }));
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ id: "h1", reps: "", holdSeconds: "30" });
    expect(view().textContent).toContain("30 s");
  });
});
