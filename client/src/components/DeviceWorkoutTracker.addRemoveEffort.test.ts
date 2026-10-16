// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

type Toast = { title: string; options?: { description?: string; action?: { label: string; onClick: () => void } } };
const toasts: Toast[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: Toast["options"]) => { toasts.push({ title, options }); };
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * Owner, 15 Oct 2026: "make it easier to add and remove exercises" during a workout, and "you should
 * be able to specify a set isn't being taken to failure" - asked in place, briefly, only for lifts
 * like the good morning, and never as a popup.
 */
const byName = (name: string) => exercises.find((exercise) => exercise.name === name)!;
const goodMorning = byName("Good Morning");
const bench = byName("Barbell Bench Press");
const facePull = byName("Face Pull");
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });

function start(workout = [goodMorning, bench]) {
  const prescriptions = Object.fromEntries(workout.map((exercise) => [exercise.id, "2 × 8"]));
  render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: "Week 1 · Pull", weightUnit: "lb" }));
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
}
const log = () => fireEvent.click(within(card()).getByRole("button", { name: /^Log set/ }));

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("How hard a set was taken, said in place", () => {
  it("shows a good morning's assumption on the set card, not in a dialog, and logs what was chosen", () => {
    start();
    const group = within(card()).getByRole("group", { name: "How hard this set of Good Morning was taken" });
    expect(group.textContent).toContain("Usually done light. This set was");
    expect(within(group).getByRole("button", { name: "Not to failure" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();

    type(/^Weight/, "95"); type("Reps", "8");
    log();
    // Unanswered, nothing is stored: the list decides, and the athlete can still say otherwise.
    expect(stored()[0].exercises[0].sets[0]).not.toHaveProperty("effort");

    fireEvent.click(within(card()).getByRole("button", { name: "To failure" }));
    type(/^Weight/, "135"); type("Reps", "6");
    log();
    expect(stored()[0].exercises[0].sets[1]).toMatchObject({ weight: "135", reps: "6", completed: true, effort: "failure" });
  });

  it("asks nothing of an ordinary lift - one quiet toggle, off unless pressed", () => {
    start([bench, goodMorning]);
    expect(within(card()).queryByRole("group", { name: /How hard/ })).toBeNull();
    const toggle = within(card()).getByRole("button", { name: "Not to failure" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(card().textContent).toContain("Counts toward your ranks only where it raises them.");
    type(/^Weight/, "185"); type("Reps", "5");
    log();
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ completed: true, effort: "not_to_failure" });
  });

  it("can be changed on a set already logged, from the full workout", () => {
    start([bench, goodMorning]);
    type(/^Weight/, "185"); type("Reps", "5");
    log();
    fireEvent.click(screen.getByText("Full workout"));
    fireEvent.click(screen.getByRole("button", { name: /^Barbell Bench Press: taken to failure\. Mark as not to failure/ }));
    expect(stored()[0].exercises[0].sets[0].effort).toBe("not_to_failure");
  });
});

describe("Adding and removing exercises during a workout", () => {
  it("adds an exercise straight after the current one from the set card", () => {
    start();
    fireEvent.click(within(card()).getByRole("button", { name: "Add exercise" }));
    const dialog = screen.getByRole("dialog", { name: "Add an exercise" });
    expect(dialog.textContent).toContain("It goes in straight after Good Morning");
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "face pull" } });
    fireEvent.click(within(dialog).getAllByRole("button", { name: /^Face Pull/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Add Face Pull" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(stored()[0].exercises.map((exercise) => exercise.exerciseName)).toEqual(["Good Morning", "Face Pull", "Barbell Bench Press"]);
    expect(stored()[0].exercises[1]).toMatchObject({ catalogId: facePull.id, addedDuringWorkout: { afterExerciseName: "Good Morning" } });
    // Its Undo takes it back while nothing is logged on it.
    act(() => toasts.at(-1)!.options!.action!.onClick());
    expect(stored()[0].exercises.map((exercise) => exercise.exerciseName)).toEqual(["Good Morning", "Barbell Bench Press"]);
  });

  it("adds one more after the last exercise from the full workout", () => {
    start();
    fireEvent.click(screen.getByText("Full workout"));
    fireEvent.click(screen.getAllByRole("button", { name: "Add exercise" }).at(-1)!);
    const dialog = screen.getByRole("dialog", { name: "Add an exercise" });
    expect(dialog.textContent).toContain("straight after Barbell Bench Press");
  });

  it("removes an exercise with what it holds, and Undo puts it back in its place", () => {
    start();
    type(/^Weight/, "95"); type("Reps", "8");
    log();
    fireEvent.click(screen.getByText("Full workout"));
    fireEvent.click(screen.getByRole("button", { name: "Remove Good Morning from this workout" }));
    expect(stored()[0].exercises.map((exercise) => exercise.exerciseName)).toEqual(["Barbell Bench Press"]);
    expect(toasts.at(-1)).toMatchObject({ title: "Removed Good Morning", options: { description: "Its 1 logged set went with it." } });
    // The last exercise stays: a workout is finished, not emptied.
    expect(screen.queryByRole("button", { name: "Remove Barbell Bench Press from this workout" })).toBeNull();

    act(() => toasts.at(-1)!.options!.action!.onClick());
    const [restored] = stored();
    expect(restored.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Good Morning", "Barbell Bench Press"]);
    expect(restored.exercises[0].sets[0]).toMatchObject({ weight: "95", reps: "8", completed: true });
  });
});
