import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DayExercisePicker } from "./DayExercisePicker";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const source = readFileSync(new URL("./DayExercisePicker.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

const stack = ["Barbell Bench Press", "Seated Barbell Overhead Press"]
  .map((name) => exercises.find((exercise) => exercise.name === name))
  .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise));

const render = (activeWorkout: typeof stack) =>
  renderToStaticMarkup(
    createElement(DayExercisePicker, {
      exercises,
      activeWorkout,
      split: "Push" as const,
      onAdd: () => undefined,
      onReplace: () => undefined,
      onInspect: () => undefined,
    })
  );

const built = render(stack);
const empty = render([]);

describe("Training Day exercise finder disclosure", () => {
  it("keeps Stack Analysis separately reachable while hiding the full catalog toolset behind one clear finder control", () => {
    expect(source).toContain("<RateStackPanel");
    expect(source).toContain('<details className="day-exercise-disclosure"');
    expect(built).toContain("Find an exercise");
    expect(source).toContain("Search, filter, then add from the catalog");
  });

  it("retains split scope, muscle, equipment, inspection, and add behavior inside the disclosure", () => {
    expect(source).toContain('aria-label="Filter day exercises by muscle group"');
    expect(source).toContain('aria-label="Filter day exercises by equipment"');
    expect(source).toContain('setScope("all")');
    expect(source).toContain("onInspect(exercise)");
    expect(source).toContain("onAdd(exercise)");
  });

  it("prioritizes direct muscle matches and makes the number of matching catalog options visible before an athlete scans results", () => {
    expect(source).toContain("export function sortDayExerciseResults");
    // The "Direct target · X" phrase is gone; the card lists the primary muscles
    // outright and the accent border still marks a filtered direct match.
    expect(styles).toContain(".day-picker-result-direct { border-left: 3px solid var(--sg-action)");
    expect(built).toMatch(/<strong>\d+<\/strong> options/);
    expect(source).toContain("Show more options");
  });

  /**
   * The picker sat beneath a panel naming this day's shortfalls and then listed
   * 84 options alphabetically, so acting on the panel meant reading a muscle name
   * off it and setting a filter by hand.
   */
  it("orders the options by the shortfalls this day actually has", () => {
    expect(built).toContain("day-picker-result-fills");
    expect(built).toMatch(/Closes [^<]+, \d+ short/);
  });

  it("offers each shortfall as a one-tap filter", () => {
    expect(built).toContain("day-picker-gaps");
    expect(built).toContain("Short in this day");
  });

  it("says what the ordering is, rather than leaving it a mystery", () => {
    expect(built).toMatch(/options · [^<]+ first/);
  });

  it("opens itself on an empty day, where adding is the only thing to do", () => {
    // It was collapsed unconditionally, so the first exercise of a new day cost
    // a scroll past the analysis and an expand before anything could be typed.
    expect(empty).toContain("<details class=\"day-exercise-disclosure\" open");
    expect(empty).toContain("Start with your first exercise");
  });

  it("stays closed once the day has exercises in it", () => {
    expect(built).not.toContain("day-exercise-disclosure\" open");
  });

  it("does not enumerate every target as a gap on an empty day", () => {
    // With nothing added, all of them are short and the chips say nothing.
    expect(empty).not.toContain("day-picker-gaps");
  });

  it("drops the catalog id from the card, which led every row", () => {
    expect(source).not.toContain('String(exercise.id).padStart(3, "0")');
  });
});
