// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { neckWeekSummary } from "@/lib/neckWeek";
import { analyzeWeek } from "@/lib/weekReview";
import { NeckWeekCard } from "./NeckWeekCard";
import { WeekReviewBoard } from "./WeekReviewBoard";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * The neck card on Review's week board (the owner's handoff §4, "Neck weekly view"; T21, T27): rows
 * by direction with sets and reps apart from holds and time, a tap lists the sets behind a row, and
 * the card is on the board only in a week with neck work.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const now = new Date(2026, 10, 4, 12);
const at = new Date(2026, 10, 3, 18).toISOString();
const week: DeviceWorkoutSession[] = [{
  id: "n1", title: "Neck", dayLabel: "Week 1 · Day 02 · Neck", startedAt: at, completedAt: at, status: "completed", weightUnit: "kg",
  exercises: [
    { id: "a", exerciseName: byId(425).name, catalogId: 425, plannedPrescription: "3 × 12", sets: [{ weight: "15", reps: "12", unit: "kg", completed: true }, { weight: "15", reps: "10", unit: "kg", completed: true }] },
    { id: "b", exerciseName: byId(436).name, catalogId: 436, plannedPrescription: "2 × 20 s", sets: [{ weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true }, { weight: "", reps: "", holdSeconds: "20", completed: true }] },
  ],
}];

afterEach(() => cleanup());

describe("the neck card", () => {
  it("shows each direction's sets and reps apart from its holds and time, and No logged work where there is none", () => {
    render(createElement(NeckWeekCard, { summary: neckWeekSummary(week, now) }));
    expect(screen.getByRole("heading", { name: "Neck work logged this week" })).toBeTruthy();
    const flexion = screen.getByRole("button", { name: /^Flexion: 2 sets · 22 reps; no holds/ });
    expect(flexion.textContent).toContain("2 sets · 22 reps");
    expect(screen.getByRole("button", { name: /^Rotation · Right: no sets; 1 hold · 20 s/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Rotation · Unknown direction: no sets; 1 hold · 20 s/ })).toBeTruthy();
    const lines = screen.getByRole("list", { name: "Neck work by direction" });
    for (const empty of ["Extension", "Side bend · Left", "Side bend · Right", "Rotation · Left"]) {
      const row = within(lines).getByText(empty).closest("li")!;
      expect(row.textContent).toBe(`${empty}No logged work`);
      expect(within(row).queryByRole("button")).toBeNull();
    }
    // No number anywhere adds seconds to reps.
    expect(document.body.textContent).not.toMatch(/\b42\b/);
  });

  it("opens a row to the sets behind it, and closes it again", () => {
    render(createElement(NeckWeekCard, { summary: neckWeekSummary(week, now) }));
    const flexion = screen.getByRole("button", { name: /^Flexion:/ });
    expect(flexion.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(flexion);
    expect(flexion.getAttribute("aria-expanded")).toBe("true");
    const sets = screen.getByRole("list", { name: "Sets behind Flexion" });
    expect(within(sets).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      `${byId(425).name}${new Date(at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · 12 reps`,
      `${byId(425).name}${new Date(at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · 10 reps`,
    ]);
    fireEvent.click(screen.getByRole("button", { name: /^Rotation · Right:/ }));
    expect(screen.queryByRole("list", { name: "Sets behind Flexion" })).toBeNull();
    expect(within(screen.getByRole("list", { name: "Sets behind Rotation · Right" })).getByRole("listitem").textContent).toContain("Right · 20 s");
  });

  it("is on the week board only in a week with neck work", () => {
    const analysis = analyzeWeek({ slots: [], plan: {}, prescriptions: {}, goal: "Muscle growth", catalog: exercises });
    const props = { analysis, ready: true, onEditWeek: () => undefined, onEditDay: () => undefined, onInspectExercise: () => undefined };
    const { rerender } = render(createElement(WeekReviewBoard, { ...props, neckWeek: neckWeekSummary([], now) }));
    expect(screen.queryByRole("heading", { name: "Neck work logged this week" })).toBeNull();
    rerender(createElement(WeekReviewBoard, { ...props, neckWeek: neckWeekSummary(week, now) }));
    expect(screen.getByRole("heading", { name: "Neck work logged this week" })).toBeTruthy();
  });
});
