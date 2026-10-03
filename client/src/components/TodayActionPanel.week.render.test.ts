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
import { todayPlan } from "./todayPlanFixture";

/** A session finished an hour ago, so it sits inside the current training week. */
function finished(dayLabel: string, logged = true) {
  const at = new Date(Date.now() - 3_600_000).toISOString();
  // One completed set: a finish with nothing logged is not a workout, on Home or anywhere.
  const sets = logged ? [{ weight: "80", reps: "5", height: "", completed: true, skipped: false }] : [];
  return { id: `s-${dayLabel}`, title: dayLabel, dayLabel, startedAt: at, completedAt: at, status: "completed", exercises: [{ id: "e1", exerciseName: "Barbell Bench Press", plannedPrescription: "4 × 3–5", sets }] };
}

/** Push 6 and Pull 5 built, Legs not built yet: a three-day split. */
function draw(overrides: Partial<React.ComponentProps<typeof TodayActionPanel>> = {}) {
  return render(React.createElement(TodayActionPanel, {
    plan: todayPlan({ Push: 6, Pull: 5, Legs: 0 }, { split: ["Push", "Pull", "Legs"], primaryMuscles: ["lats", "biceps"] }),
    onOpenWorkout: () => {},
    onOpenTraining: () => {},
    onOpenStrength: () => {},
    onOpenTracker: () => {},
    onOpenProgress: () => {},
    hour: 9,
    ...overrides,
  }));
}

const states = () => Array.from(document.querySelectorAll(".home-week-strip li")).map((li) => (li as HTMLElement).dataset.state);
const entry = (day: string) => Array.from(document.querySelectorAll(".home-week-strip li")).find((li) => li.textContent?.startsWith(day))!;

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { document.body.innerHTML = ""; });

/**
 * The strip and the primary action read the same saved sessions the weekly count
 * reads, so a day is marked from its own record and never from its position.
 */
describe("Home week strip and primary action", () => {
  it("marks a day done from its own saved session, and the first built day not done as next", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push")]));
    draw();
    expect(states()).toEqual(["trained", "next", "planned"]);
    expect(entry("Push").textContent).toBe("Push, done this week");
    expect(entry("Pull").textContent).toBe("PullNext, next up");
    expect(entry("Legs").textContent).toBe("Legs, planned, not built yet");
    expect(screen.getByRole("heading", { level: 2, name: "Pull" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open next workout/ })).toBeTruthy();
  });

  // From #81, adapted to the summary strip (Sep 28 regression brief §5): the strip is not a
  // picker, so there are no buttons to name; the words ride in each entry's text instead.
  it("gives each day state its own icon shape, hidden from screen readers", () => {
    // The old marks were CSS rings; a dashed 11px ring read as a broken "C" on a phone.
    const shapes: Record<string, string> = { trained: "lucide-circle-check", live: "lucide-circle-play", next: "lucide-circle-arrow-right", planned: "lucide-circle" };
    const seen: Record<string, string> = {};
    const collect = (wanted: string[]) => {
      for (const state of wanted) {
        const svg = document.querySelector(`.home-week-strip li[data-state="${state}"] svg.home-week-icon`) as SVGElement | null;
        expect(svg, state).not.toBeNull();
        expect(svg?.classList.contains(shapes[state]), `${state} uses ${shapes[state]}`).toBe(true);
        expect(svg?.getAttribute("aria-hidden")).toBe("true");
        seen[state] = Array.from(svg?.classList ?? []).filter((name) => name.startsWith("lucide-")).sort().join(" ");
      }
      expect(document.querySelector(".home-week-strip li i")).toBeNull();
    };
    // Nothing done yet: the next day and the days still to come.
    draw();
    collect(["next", "planned"]);
    document.body.innerHTML = "";
    // One day done and one under way (a day under way takes the place of "next").
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push")]));
    const live = { id: "s1", dayLabel: "Week 1 · Day 02 · Pull", startedAt: new Date().toISOString(), completedSets: 3, plannedSets: 12, exerciseNumber: 2, exerciseCount: 5, exerciseName: "Chin-up", setNumber: 2, setCount: 4, finishedExercises: ["Barbell Row"] };
    draw({ live });
    collect(["trained", "live"]);
    // No two states share a shape.
    expect(new Set(Object.values(seen)).size).toBe(4);
  });

  it("does not mark the first days done merely because the count is one", () => {
    // Legs finished, not Push: the strip follows the record, not the order.
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 03 · Legs")]));
    draw();
    expect(states()).toEqual(["next", "planned", "trained"]);
  });

  it("counts a day done this week whichever plan week the session was started from", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 2 · Day 01 · Push")]));
    draw();
    expect(states()).toEqual(["trained", "next", "planned"]);
  });

  it("offers the record once every built day is done this week", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push"), finished("Week 1 · Day 02 · Pull")]));
    draw();
    expect(screen.getByRole("button", { name: /View workout summary/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open Push again/ })).toBeTruthy();
    expect(screen.getByText(/1 day not built yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Open next workout/ })).toBeNull();
  });

  it("does not mark a day whose session finished with nothing logged", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push", false)]));
    draw();
    expect(states()[0]).toBe("next");
    expect(screen.getByRole("button", { name: /Open next workout/ })).toBeTruthy();
  });

  it("leaves a session finished last week out of this week's strip", () => {
    const old = new Date(Date.now() - 14 * 86_400_000).toISOString();
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([{ ...finished("Week 1 · Day 01 · Push"), startedAt: old, completedAt: old }]));
    draw();
    expect(states()[0]).toBe("next");
  });

  /** Sep 28 regression brief §5: a summary, not a second day picker; clean marks; words, not colour alone. */
  it("is a summary with vector marks, never a set of buttons or a dashed ring", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 01 · Push")]));
    draw();
    const strip = document.querySelector(".home-week-strip")!;
    expect(strip.querySelector("button")).toBeNull();
    expect(strip.querySelector("i")).toBeNull();
    expect(entry("Push").querySelector("svg")?.getAttribute("class")).toContain("lucide-circle-check");
    expect(entry("Pull").querySelector("svg")?.getAttribute("class")).toContain("lucide-circle");
    expect(entry("Pull").querySelector(".home-week-tag")?.textContent).toBe("Next");
    expect(entry("Pull").getAttribute("aria-current")).toBe("step");
  });

  it("gives a running workout the one current mark, with no second next day beside it", () => {
    const live = { id: "s1", dayLabel: "Week 1 · Day 02 · Pull", startedAt: new Date().toISOString(), completedSets: 1, plannedSets: 9, exerciseNumber: 1, exerciseCount: 3, exerciseName: "Row", setNumber: 2, setCount: 3, finishedExercises: [] };
    draw({ live });
    expect(states()).toEqual(["planned", "live", "planned"]);
    expect(entry("Pull").querySelector("svg")?.getAttribute("class")).toContain("lucide-circle-play");
    expect(entry("Pull").querySelector(".home-week-tag")?.textContent).toBe("Now");
    expect(document.querySelectorAll('.home-week-strip li[aria-current]')).toHaveLength(1);
  });

  it("makes the fraction equal the checked days, with repeats and extra sessions said apart", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished("Week 1 · Day 02 · Pull"), { ...finished("Week 1 · Day 02 · Pull"), id: "again" }, finished("Week 1 · Day 01 · Push")]));
    draw();
    expect(states().filter((state) => state === "trained")).toHaveLength(2);
    expect(document.querySelector(".home-week-line")?.textContent).toBe("2 of 3 planned workouts done this week · 1 more session this week");
  });

  /** A day with its own figure artwork shows that, captioned with the muscles it highlights (lib/dayFigures). */
  it("shows the Push day's figure artwork, and keeps the focus line from the exercises", () => {
    draw();
    const art = document.querySelector(".today-action-primary.today-action-with-art .today-action-focus.today-action-art") as HTMLElement | null;
    expect(art).toBeTruthy();
    const img = art!.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/day-figures/push.webp");
    expect(img.getAttribute("alt")).toBe("Push day: chest, delts, triceps highlighted on a front and a back figure.");
    expect([img.getAttribute("width"), img.getAttribute("height")]).toEqual(["720", "778"]);
    expect(art!.querySelector("figcaption")?.textContent).toBe("Chest · delts · triceps");
    expect(document.querySelector(".today-action-focus .anatomy-figure")).toBeNull();
    expect(document.querySelector(".today-action-focus-line")?.textContent).toBe("Workout focus Lats · Biceps");
  });

  it("shows the artwork for its day even when the exercises name no drawable muscle", () => {
    draw({ plan: todayPlan({ Push: 2 }, { split: ["Push", "Pull", "Legs"], primaryMuscles: ["serratusAnterior"] }) });
    expect(document.querySelector(".today-action-art img")?.getAttribute("src")).toBe("/day-figures/push.webp");
    expect(document.querySelector(".today-action-focus-line")?.textContent).toBe("Workout focus Chest");
  });

  /** A day without artwork (here Lower) keeps the planned-focus schematic, drawn from the exercises. */
  it("draws the workout focus as a picture in the action colour, never as a rank map", () => {
    draw({ plan: todayPlan({ Lower: 6, Pull: 5, Legs: 0 }, { split: ["Lower", "Pull", "Legs"], primaryMuscles: ["lats", "biceps"] }) });
    const figure = document.querySelector(".today-action-focus .anatomy-figure") as SVGElement | null;
    expect(figure).toBeTruthy();
    expect(figure?.getAttribute("role")).toBe("img");
    expect(figure?.getAttribute("aria-label")).toMatch(/^Planned workout focus, front view: .*not a strength rank, recovery readiness or measured activation\.$/);
    expect(figure?.getAttribute("data-encoding")).toBeNull();
    expect(document.querySelector(".today-action-focus .anatomy-hit-layer")).toBeNull();
    expect(screen.getByText("Primary muscles")).toBeTruthy();
    expect(document.querySelector(".today-action-focus-line")?.textContent).toBe("Workout focus Lats · Biceps");
  });

  /** Sep 28 regression brief §6: the figure faces and frames where the day's work is. */
  it("turns a pulling day to the back and crops it to the upper body", () => {
    draw({ plan: todayPlan({ Lower: 3 }, { split: ["Lower", "Pull", "Legs"], primaryMuscles: ["lats", "upperBack"] }) });
    const figure = document.querySelector(".today-action-focus .anatomy-figure")!;
    expect(figure.getAttribute("data-view")).toBe("back");
    expect(figure.getAttribute("data-frame")).toBe("");
    expect(figure.getAttribute("viewBox")).toBe("95 150 486 540");
  });

  it("names the day's regions but draws no empty body when nothing it trains is drawn", () => {
    draw({ plan: todayPlan({ Lower: 2 }, { split: ["Lower", "Pull", "Legs"], primaryMuscles: ["serratusAnterior"] }) });
    expect(document.querySelector(".today-action-focus")).toBeNull();
    expect(document.querySelector(".today-action-focus-line")?.textContent).toBe("Workout focus Chest");
  });

  it("shows no schematic when the workout names no muscles, and none for the live workout", () => {
    draw({ plan: todayPlan({ Lower: 6, Pull: 5 }, { split: ["Lower", "Pull", "Legs"] }) });
    expect(document.querySelector(".today-action-focus")).toBeNull();
  });
});
