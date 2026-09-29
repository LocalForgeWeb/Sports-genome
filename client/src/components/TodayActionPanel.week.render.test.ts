// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    strengthGenome: {
      overview: { useQuery: () => ({ data: { observationCount: 0 } }) },
      observations: { useQuery: () => ({ data: [] }) },
      referenceRows: { useQuery: () => ({ data: [] }) },
    },
    workoutLog: {
      list: { useQuery: () => ({ data: [] }) },
      progressionHistory: { useQuery: () => ({ data: [] }) },
    },
  },
}));

import { TodayActionPanel } from "./TodayActionPanel";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";

const planDays = [
  { index: 0, name: "Push", label: "Week 1 · Day 01 · Push", exerciseCount: 6 },
  { index: 1, name: "Pull", label: "Week 1 · Day 02 · Pull", exerciseCount: 5 },
  { index: 2, name: "Legs", label: "Week 1 · Day 03 · Legs", exerciseCount: 0 },
];

/** A session finished an hour ago, so it sits inside the current training week. */
function finished(dayLabel: string, logged = true) {
  const at = new Date(Date.now() - 3_600_000).toISOString();
  // One completed set: a finish with nothing logged is not a workout, on Home or anywhere.
  const sets = logged ? [{ weight: "80", reps: "5", height: "", completed: true, skipped: false }] : [];
  return { id: `s-${dayLabel}`, title: dayLabel, dayLabel, startedAt: at, completedAt: at, status: "completed", exercises: [{ id: "e1", exerciseName: "Barbell Bench Press", plannedPrescription: "4 × 3–5", sets }] };
}

function draw(overrides: Partial<React.ComponentProps<typeof TodayActionPanel>> = {}) {
  return render(React.createElement(TodayActionPanel, {
    stagedExerciseCount: 6,
    trainingDays: 3,
    activeDayLabel: "Week 1 · Day 02 · Pull",
    activeDayIndex: 1,
    planDays,
    focusMuscles: ["lats", "biceps"],
    onOpenTraining: () => {},
    onOpenStrength: () => {},
    onOpenTracker: () => {},
    onOpenProgress: () => {},
    onChooseDay: () => {},
    hour: 9,
    ...overrides,
  }));
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { document.body.innerHTML = ""; });

/**
 * The strip and the primary action read the same saved sessions the weekly count
 * reads, so a day is marked from its own record and never from its position.
 */
describe("Home week strip and primary action", () => {
  it("marks a day completed from its own saved session, and the selected day as next", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push")]));
    draw();
    const states = Array.from(document.querySelectorAll(".home-week-strip li")).map((li) => (li as HTMLElement).dataset.state);
    expect(states).toEqual(["trained", "next", "planned"]);
    expect(screen.getByRole("button", { name: /^Push, completed this week/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Legs, planned, empty/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open next workout/ })).toBeTruthy();
  });

  it("shows each day's state as a word beside the dot, not by colour alone", () => {
    // Completed and under way share the filled-dot shape; only a word tells them apart without hue.
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push")]));
    const live = { id: "s1", dayLabel: "Week 1 · Day 02 · Pull", startedAt: new Date().toISOString(), completedSets: 3, plannedSets: 12, exerciseNumber: 2, exerciseCount: 5, exerciseName: "Chin-up", setNumber: 2, setCount: 4, finishedExercises: ["Barbell Row"] };
    draw({ live });
    const segment = (state: string) => document.querySelector(`.home-week-strip li[data-state="${state}"]`) as HTMLElement;
    expect(segment("trained").querySelector("small")?.textContent).toBe("Done");
    expect(segment("live").querySelector("small")?.textContent).toBe("Now");
    expect(segment("planned").querySelector("small")).toBeNull();
    // The word is for the eye; the accessible name already says the state in full.
    expect(segment("trained").querySelector("small")?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByRole("button", { name: /^Push, completed this week/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Pull, under way/ })).toBeTruthy();
  });

  it("marks the next day with a word as well as its ring", () => {
    draw();
    const next = document.querySelector('.home-week-strip li[data-state="next"]') as HTMLElement;
    expect(next.querySelector("small")?.textContent).toBe("Next");
    expect(screen.getByRole("button", { name: /^Pull, next up/ })).toBeTruthy();
  });

  it("does not mark the first days completed merely because the count is one", () => {
    // Legs finished, not Push: the strip follows the record, not the order.
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 03 · Legs")]));
    draw();
    const states = Array.from(document.querySelectorAll(".home-week-strip li")).map((li) => (li as HTMLElement).dataset.state);
    expect(states).toEqual(["planned", "next", "trained"]);
  });

  it("offers the record when the selected workout is already completed this week", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 02 · Pull")]));
    draw();
    expect(screen.getByRole("button", { name: /View workout summary/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open Pull again/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Open next workout/ })).toBeNull();
  });

  it("does not mark a day whose session finished with nothing logged", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push", false)]));
    draw();
    expect((document.querySelector('.home-week-strip li') as HTMLElement).dataset.state).toBe("planned");
    expect(screen.getByRole("button", { name: /Open next workout/ })).toBeTruthy();
  });

  it("leaves a session finished last week out of this week's strip", () => {
    const old = new Date(Date.now() - 14 * 86_400_000).toISOString();
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([{ ...finished("Week 1 · Day 01 · Push"), startedAt: old, completedAt: old }]));
    draw();
    expect((document.querySelector('.home-week-strip li') as HTMLElement).dataset.state).toBe("planned");
  });

  it("draws the workout focus as a picture in the action colour, never as a rank map", () => {
    draw();
    const figure = document.querySelector(".today-action-focus .anatomy-figure") as SVGElement | null;
    expect(figure).toBeTruthy();
    expect(figure?.getAttribute("role")).toBe("img");
    expect(figure?.getAttribute("aria-label")).toMatch(/^Workout focus: /);
    expect(figure?.getAttribute("data-encoding")).toBeNull();
    expect(document.querySelector(".today-action-focus .anatomy-hit-layer")).toBeNull();
    expect(screen.getByText("Workout focus")).toBeTruthy();
  });

  it("shows no schematic when the workout names no muscles, and none for the live workout", () => {
    draw({ focusMuscles: [] });
    expect(document.querySelector(".today-action-focus")).toBeNull();
  });
});
