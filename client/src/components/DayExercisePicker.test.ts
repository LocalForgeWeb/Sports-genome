import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DayExercisePicker } from "./DayExercisePicker";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const source = readFileSync(new URL("./DayExercisePicker.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

const stack = ["Barbell Bench Press", "Seated Barbell Overhead Press"]
  .map((name) => exercises.find((exercise) => exercise.name === name))
  .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise));

const render = (activeWorkout: typeof stack, sheetOpen = false) =>
  renderToStaticMarkup(
    createElement(DayExercisePicker, {
      exercises,
      activeWorkout,
      split: "Push" as const,
      sheetOpen,
      onOpenSheet: () => undefined,
      onCloseSheet: () => undefined,
      onAdd: () => undefined,
      onReplace: () => undefined,
      onInspect: () => undefined,
    })
  );

/**
 * The catalog lives in the sheet now, and only there. It used to render inline in
 * a disclosure as well - 3,300px of the Training Day's 6,400 - so these two
 * renders are the day as you read it, and the catalog as you open it.
 */
const day = render(stack);
const built = render(stack, true);
const empty = render([], true);

describe("Training Day exercise finder disclosure", () => {
  it("keeps Stack Analysis on the day and the catalog behind one clear control", () => {
    expect(source).toContain("<RateStackPanel");
    expect(source).toContain('className="day-exercise-open-catalog"');
    expect(day).toContain("Find an exercise");
    expect(source).toContain("Search, filter, then add from the catalog");
  });

  /**
   * Both surfaces were on the page at once: the sheet "Add exercises" opens, and
   * the same tools, filters and 110 rows expanded inline underneath the day.
   */
  it("does not also render the catalog underneath the day", () => {
    expect(day).not.toContain("day-picker-tools");
    expect(day).not.toContain("day-picker-results");
    expect(day).not.toContain("Add exercises directly");
    expect(source).not.toContain('<details className="day-exercise-disclosure"');
  });

  it("retains split scope, muscle, equipment, inspection, and add behavior inside the disclosure", () => {
    // The muscle filter is a searchable listbox now rather than a native
    // select, so its label travels with the component that renders it.
    expect(source).toContain("<MuscleSelect muscles={muscleOptions}");
    const muscleSelect = readFileSync(resolve(process.cwd(), "client/src/components/MuscleSelect.tsx"), "utf8");
    expect(muscleSelect).toContain('aria-label="Filter day exercises by muscle group"');
    expect(muscleSelect).toContain('aria-label="Search muscles"');
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
    expect(source).toContain("rankPickerResults(results.map((match) => match.exercise), gaps, relevance)");
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

  /**
   * This used to be a disclosure that opened itself on an empty day, because the
   * first exercise of a new day otherwise cost a scroll past the analysis and an
   * expand. The sheet replaces that: nothing is expanded on the page at all, and
   * the empty day's own control opens it.
   */
  it("names the first exercise as the thing to do on an empty day", () => {
    expect(render([])).toContain("Start with your first exercise");
    expect(render([])).not.toContain("day-picker-results");
  });

  it("puts the cursor in the search field when the sheet is what opened", () => {
    expect(source).toContain("searchRef.current?.focus()");
    expect(empty).toContain("day-picker-results");
  });

  it("does not enumerate every target as a gap on an empty day", () => {
    // With nothing added, all of them are short and the chips say nothing.
    expect(empty).not.toContain("day-picker-gaps");
  });

  it("drops the catalog id from the card, which led every row", () => {
    expect(source).not.toContain('String(exercise.id).padStart(3, "0")');
  });
});

/**
 * "reardelt fly", "trap bar" and "romanain" all returned "No exercises match".
 * The box asked for an exact substring of the catalog's spelling; it now uses
 * the shared matcher, ranks by how well a row answers the query before how well
 * it fills a gap, labels a list of spelling guesses as guesses, and offers the
 * nearest names instead of a dead end.
 */
describe("Training Day finder search tolerance", () => {
  it("matches the way an athlete types and ranks relevance ahead of gaps", () => {
    expect(source).toContain('import { matchesAreGuesses, rankExerciseMatches, suggestExerciseNames } from "@/lib/exerciseSearch";');
    expect(source).toContain("rankPickerResults(results.map((match) => match.exercise), gaps, relevance)");
  });

  it("says when the results are the closest spellings rather than the thing typed", () => {
    expect(source).toContain('{guessed && <span className="day-picker-result-guess">Nothing is spelled “{query.trim()}” — these are the closest.</span>}');
  });

  it("offers the nearest names when nothing matched, as taps that run the search", () => {
    expect(source).toContain("suggestExerciseNames(candidates, query)");
    expect(source).toContain('<button type="button" onClick={() => setQuery(name)}>{name}</button>');
    expect(styles).toContain(".day-picker-empty button {");
  });
});

/**
 * On a phone in dark mode the sheet's exercise names were #f7fbff on a white
 * card - 1.04:1 - because the rows were still themed for the dark Training Day
 * page they used to sit on inline. The sheet is a light surface in both themes
 * and is the only place the rows render, so the dark theme has nothing to say
 * about them.
 */
describe("the picker sheet stays readable in dark mode", () => {
  const theme = readFileSync(new URL("../index.css", import.meta.url), "utf8");

  it("never paints the rows, scope bar or show-more for a dark ground", () => {
    expect(theme).not.toMatch(/\[data-theme="dark"\] \.day-picker-result\b/);
    expect(theme).not.toMatch(/\[data-theme="dark"\] \.day-picker-scope\b/);
    expect(theme).not.toMatch(/\[data-theme="dark"\] \.day-picker-more\b/);
  });

  it("keeps the search-scope line in light ink inside the sheet, where its ground is light in both themes", () => {
    // The shared component's default ink is for dark panels: 2.15:1 on the sheet, in light mode too.
    expect(styles).toContain(".day-picker-sheet .local-search-scope { color: var(--sg-text-subtle-on-light); }");
    expect(styles).toContain(".day-picker-sheet .local-search-scope button { color: var(--sg-info-strong); }");
    expect(theme).toContain('[data-theme="dark"] .day-picker-sheet .local-search-scope { color: var(--sg-text-subtle-on-light); }');
  });

  it("lifts the row's movement line and the inactive scope button above 4.5:1", () => {
    expect(styles).toContain(".day-picker-sheet .day-picker-result > button:first-child small { color: var(--sg-text-subtle-on-light); }");
    expect(styles).toContain(".day-picker-sheet .day-picker-scope button:not(.day-picker-scope-active) { color: var(--sg-text-subtle-on-light); }");
  });

  it("keeps the sheet itself a light surface, so the ink above is the right ink", () => {
    expect(styles).toMatch(/\.day-picker-sheet \{[^}]*background: var\(--sg-surface-light\)/);
    expect(theme).not.toMatch(/\[data-theme="dark"\] \.day-picker-sheet \{/);
  });
});
