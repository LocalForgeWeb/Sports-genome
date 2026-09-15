// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const workout = [exercises[0], exercises[1]];
const prescriptions = { [exercises[0].id]: "3 × 8", [exercises[1].id]: "2 × 10" };

function mount() {
  return render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, dayLabel: "Week 1 · Push" }));
}

function startWorkout() {
  mount();
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("live workout glance contract", () => {
  // "The first view must make active exercise/set, prescribed or entered
  // progression variable, completion/rest state, and one dominant next action
  // immediately legible."
  it("leads with the active exercise, its set position, its prescription and the rest state", () => {
    startWorkout();
    const card = document.querySelector(".live-set-card")!;
    expect(card).toBeTruthy();
    expect(within(card as HTMLElement).getByRole("heading").textContent).toBe(exercises[0].name);
    expect(card.textContent).toContain("Set 1 of 3");
    expect(card.textContent).toContain("3 × 8");
    expect(document.querySelector(".live-rest-row")).toBeTruthy();
  });

  it("offers exactly one dominant next action, not one per planned set", () => {
    startWorkout();
    // The whole session is reachable, but behind an explicit drill-down, so the
    // glance surface is not competing with eleven other commit buttons.
    expect(document.querySelectorAll(".live-set-commit")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /log set 1/i })).toBeTruthy();
    expect(document.querySelector(".live-session-queue")?.hasAttribute("open")).toBe(false);
  });

  // "timer controls may not overlap, occlude, or create a competing tap target
  // beside reps/load/completion"
  it("keeps every rest control out of the set-entry and completion zone", () => {
    startWorkout();
    const entry = document.querySelector(".live-set-entry")!;
    const commit = document.querySelector(".live-set-commit")!;
    document.querySelectorAll(".live-rest-controls button").forEach((control) => {
      expect(entry.contains(control), "a rest control sits inside the entry zone").toBe(false);
      expect(commit.contains(control), "a rest control sits inside the commit action").toBe(false);
    });
    // And the rest row is a sibling below the action, not inside the card.
    expect(document.querySelector(".live-set-card")!.contains(document.querySelector(".live-rest-row"))).toBe(false);
  });

  it("advances to the next set and starts rest when a set is logged", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    expect(document.querySelector(".live-set-card")!.textContent).toContain("Set 2 of 3");
    expect(document.querySelector(".live-rest-row")!.textContent).toContain("Resting");
  });

  it("moves to the next exercise once its sets are confirmed, then to the finish state", () => {
    startWorkout();
    // Scoped to the card: jsdom renders a closed <details>, so the queue's own
    // per-set buttons are present in the tree even while the drill-down is shut.
    const commit = () => fireEvent.click(document.querySelector(".live-set-commit")!);
    for (let i = 0; i < 3; i++) commit();
    expect(document.querySelector(".live-set-card")!.textContent).toContain(exercises[1].name);
    for (let i = 0; i < 2; i++) commit();
    expect(document.querySelector(".live-set-card-done")).toBeTruthy();
    expect(document.querySelectorAll(".live-set-commit")).toHaveLength(0);
  });

  // "Secondary ... history ... use explicit drill-down that preserves
  // active-set context."
  it("does not move the active set when the full session is opened", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    const before = document.querySelector(".live-set-card")!.textContent;
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    expect(document.querySelector(".live-session-queue")?.hasAttribute("open")).toBe(true);
    expect(document.querySelector(".live-set-card")!.textContent).toBe(before);
  });
});

describe("live-set commitment semantics contract", () => {
  it("marks a typed-but-unlogged set as a draft rather than counting it", () => {
    startWorkout();
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "135" } });
    expect(document.querySelector(".execution-head")!.textContent).toContain("0 / 5 sets logged");
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    expect(document.querySelector(".session-set-draft")!.textContent).toContain("typed, not logged");
  });

  it("excludes drafts at finish and says how many were left out", () => {
    startWorkout();
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    // Set 2 gets a value but is never logged.
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/reps/i), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: /finish workout/i }));

    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    const saved = stored.find((session: { status: string }) => session.status === "completed");
    const savedSets = saved.exercises.flatMap((exercise: { sets: unknown[] }) => exercise.sets);
    expect(savedSets).toHaveLength(1);
    expect(savedSets[0]).toMatchObject({ weight: "135", completed: true });
  });

  it("keeps completion reversible from the full session", () => {
    startWorkout();
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    fireEvent.click(screen.getAllByRole("button", { name: /undo/i })[0]);
    expect(document.querySelector(".execution-head")!.textContent).toContain("0 / 5 sets logged");
  });
});

describe("carried-forward entry", () => {
  it("prefills the next set with the load just confirmed, and records it on completion", () => {
    startWorkout();
    const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
    fireEvent.change(entry().getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.change(entry().getByLabelText(/reps/i), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));

    expect((entry().getByLabelText(/weight/i) as HTMLInputElement).value).toBe("135");
    expect(document.querySelector(".live-set-last")!.textContent).toContain("Last set: 135 lb × 8");

    // Committing an untouched carried default records it as a real observation.
    fireEvent.click(screen.getByRole("button", { name: /log set 2/i }));
    const stored = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey)!);
    const sets = stored[0].exercises[0].sets;
    expect(sets[1]).toMatchObject({ weight: "135", reps: "8", completed: true });
  });

  it("does not count an untouched prefill as a typed-but-unlogged set", () => {
    startWorkout();
    const entry = () => within(document.querySelector(".live-set-entry") as HTMLElement);
    fireEvent.change(entry().getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    // Set 2 shows 135 as a default but was never touched.
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    expect(document.querySelector(".session-set-draft")).toBeNull();
  });
});

describe("active workout continuity contract", () => {
  // "Every consequential athlete action ... must checkpoint on-device before
  // the UI treats it as safely saved."
  it("says so when the device refuses the checkpoint, instead of claiming it saved", () => {
    startWorkout();
    expect(screen.queryByRole("alert")).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));

    expect(screen.getByRole("alert").textContent).toMatch(/would not store/i);
    // The typed work is still on screen — a failed write must not also lose it.
    expect(document.querySelector(".live-set-card")!.textContent).toContain("Set 2 of 3");
  });

  // "On interruption or reconnect, restore last confirmed execution position...
  // the resume cue says what is confirmed and what needs verification."
  it("restores the confirmed position on a fresh mount and names the unverified work", () => {
    startWorkout();
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "135" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    fireEvent.change(within(document.querySelector(".live-set-entry") as HTMLElement).getByLabelText(/weight/i), { target: { value: "145" } });
    cleanup();

    act(() => { mount(); });
    expect(document.querySelector(".live-set-card")!.textContent).toContain("Set 2 of 3");
    const cue = document.querySelector(".tracker-resume-cue")!.textContent!;
    expect(cue).toContain("1 set is confirmed");
    expect(cue).toMatch(/1 set was typed but never logged/);
  });

  it("shows no resume cue for a workout started in this sitting", () => {
    startWorkout();
    expect(document.querySelector(".tracker-resume-cue")).toBeNull();
  });
});
