// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { WorkoutSessionDetail } from "./WorkoutSessionDetail";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * The session detail (the recap after Finish, and the workout opened from Progress) reading a
 * workout with holds, arms and straps in it, and correcting a hold in seconds without losing
 * the arm or the straps record.
 */
const workout: DeviceWorkoutSession = {
  id: "w1", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-16T10:00:00.000Z", completedAt: "2026-10-16T10:45:00.000Z", status: "completed", weightUnit: "lb",
  exercises: [
    { id: "carry", exerciseName: "Farmer Hold", catalogId: 145, plannedPrescription: "2 × 40", straps: "yes", plannedSets: 2, skippedSets: 0,
      sets: [{ id: "c1", weight: "70", reps: "", holdSeconds: "40", unit: "lb", side: "left", completed: true }, { id: "c2", weight: "70", reps: "", holdSeconds: "38", unit: "lb", side: "right", completed: true }] },
    { id: "row", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "1 × 8", plannedSets: 1, skippedSets: 0,
      sets: [{ id: "r1", weight: "135", reps: "8", unit: "lb", completed: true }] },
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

describe("a workout with holds, arms and straps", () => {
  it("shows holds in seconds, the arm of each set and the straps record, with no NaN", () => {
    const text = view().textContent ?? "";
    expect(text).toContain("70 lb × 40 s · Left");
    expect(text).toContain("70 lb × 38 s · Right");
    expect(text).toContain("2 of 2 planned sets · Straps used");
    expect(text).toContain("135 lb × 8");
    expect(text).not.toContain("NaN");
    expect(within(view()).getByText("Working sets").nextElementSibling?.textContent).toBe("3");
  });

  it("corrects a hold in seconds and keeps its arm and the straps record", () => {
    fireEvent.click(screen.getByRole("button", { name: "Correct a set" }));
    expect(view().textContent).toContain("seconds on a hold");
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1 of Farmer Hold" }));
    const seconds = screen.getByLabelText("Seconds") as HTMLInputElement;
    expect(seconds.value).toBe("40");
    expect(screen.queryByLabelText("Reps")).toBeNull();
    fireEvent.change(seconds, { target: { value: "0" } });
    expect(screen.getByRole("alert").textContent).toBe("Seconds are a whole number, at least 1.");
    fireEvent.change(seconds, { target: { value: "44" } });
    fireEvent.click(screen.getByRole("button", { name: /Save set/ }));
    expect(stored()[0].exercises[0]).toMatchObject({ straps: "yes", sets: [{ id: "c1", weight: "70", holdSeconds: "44", reps: "", side: "left" }, { id: "c2", holdSeconds: "38" }] });
    expect(view().textContent).toContain("70 lb × 44 s · Left");
  });

  it("still corrects an ordinary set in reps", () => {
    fireEvent.click(screen.getByRole("button", { name: "Correct a set" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1 of Barbell Bench Press" }));
    expect(screen.queryByLabelText("Seconds")).toBeNull();
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /Save set/ }));
    expect(stored()[0].exercises[1].sets[0]).toMatchObject({ id: "r1", reps: "7", weight: "135" });
  });
});
