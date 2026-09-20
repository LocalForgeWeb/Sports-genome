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
    expect(built).toMatch(/options · [^<]+ first/);
    expect(source).toContain("rankPickerResults(results, gaps)");
  });

  /**
   * The row tag and its green outline say "this closes a gap". On an empty day
   * that is true of every option, so all 24 rows carried the same sentence and
   * the same border - and the number in it, the day's shortfall, is identical
   * whichever row you read because it belongs to the day, not the exercise.
   */
  it("drops the gap tag on a list where every row would carry the same one", () => {
    expect(empty).not.toMatch(/Closes [^<]+</);
    expect(empty).not.toContain("day-picker-result-fills");
    // The day-level number never returns to a row; the gap chip above owns it.
    expect(source).not.toContain("Math.abs(fillsGap.deltaToTarget)");
  });

  it("keeps the tag where rows differ, which is the only time it decides anything", () => {
    expect(source).toContain("gapTagIsInformative(visibleRanked)");
    expect(source).toContain('showGapTag && fillsGap ? " day-picker-result-fills"');
  });

  it("names only the muscles the reader has not already been told about", () => {
    // Every Push-fit result leads with Pectoralis major, so printing it on each
    // row repeats the header rather than telling two options apart. The same
    // goes for a muscle most of the list happens to share - on the measured
    // Legs day all 24 rows also worked the glutes - which the line above the
    // list states once so the rows keep only what differs.
    expect(source).toContain("const alreadyNamed = [...sortedBy, ...shared.muscles]");
    expect(source).toContain("distinguishingMuscles(exercise, alreadyNamed)");
    expect(source).toContain("muscleLineIsInformative(visibleExercises, alreadyNamed)");
    expect(empty).not.toMatch(/<em>PECTORALIS MAJOR<\/em>/i);
  });

  it("strips every muscle the header names, not whichever one the header happened to lose to", () => {
    // The header leads with the day's shortfalls and falls back to the muscle
    // filter; this stripped only the filter. A Legs day filtered to quadriceps
    // printed "Gluteal complex and Rectus abdominis first" and then repeated
    // "Also Gluteal complex" on all twenty-four rows beneath it.
    expect(source).toContain('...(muscle !== "all" ? [muscle] : []),');
    expect(source).toContain("...gaps.slice(0, 2).map((gap) => gap.muscle),");
    expect(source).not.toContain('const sortedBy = muscle !== "all" ? [muscle] : gaps.slice(0, 2)');
  });

  it("states a muscle the whole list shares once, above it, instead of on every row", () => {
    expect(source).toContain("sharedRowMuscles(visibleExercises, sortedBy)");
    expect(source).toContain("day-picker-result-shared");
    // Counted, not assumed: a list where only most rows carry it does not get
    // to claim all of them do.
    expect(source).toContain('shared.everyRow ? "All of these also work" : "Most of these also work"');
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
