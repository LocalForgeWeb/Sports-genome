import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const picker = readFileSync(new URL("./DayExercisePicker.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

/** Where a block first appears inside the Training Day workspace. */
function order(marker: string): number {
  const day = home.indexOf('{workspace === "day-plan"');
  expect(day, "the Training Day workspace is rendered").toBeGreaterThan(-1);
  const index = home.indexOf(marker, day);
  expect(index, `${marker} is rendered on the Training Day`).toBeGreaterThan(-1);
  return index;
}

describe("Adding an exercise is findable on the Training Day", () => {
  it("puts the picker directly after the day it fills, ahead of the draft generator", () => {
    // It used to sit below the stack, the coach scan and the whole draft panel, which on a
    // phone is several screens of scrolling past the thing the empty day asks you to do.
    expect(order("<DayExercisePicker")).toBeLessThan(order("<SessionDraftPanel"));
    expect(order("<DayExercisePicker")).toBeLessThan(order("<WarmupPanel"));
  });

  it("offers adding as an action in the day header, not only further down the page", () => {
    expect(home).toContain('className="day-action-add"');
    expect(order('className="day-action-add"')).toBeLessThan(order("<DayExercisePicker"));
  });

  it("keeps that action visible on a phone", () => {
    // The mobile rule hides the two shortcuts that have their own panels. It used to select
    // them by position, so inserting a button in front of them hid the wrong one.
    expect(styles).toContain(".day-active-actions .day-action-session, .day-active-actions .day-action-draft { display: none; }");
    expect(styles).not.toContain(".day-active-actions button:nth-child(");
  });

  it("gives the empty day a control instead of telling the reader to look below", () => {
    expect(home).toContain("Nothing in this day yet.");
    expect(home).toContain("Add exercises from the catalog, or paste a stack.");
    expect(home).not.toContain("Search, filter, and add below.");
    expect(home).not.toContain("Search, filter, and add exercises below.");
    const empty = order('className="day-plan-empty"');
    expect(home.indexOf("setPickerOpenSignal", empty)).toBeLessThan(home.indexOf("</div>", empty) + 400);
  });

  it("arrives expanded, in view, and ready to type", () => {
    expect(picker).toContain("openSignal?: number;");
    expect(picker).toContain("setPickerOpen(true);");
    expect(picker).toContain('sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })');
    expect(picker).toContain("searchRef.current?.focus()");
  });

  it("re-opens on a second ask rather than latching once", () => {
    // A boolean would stay true after the athlete closed the picker, so the next ask would
    // do nothing. The counter makes every ask a fresh one.
    expect(home).toContain("setPickerOpenSignal((value) => value + 1)");
    expect(picker).toContain("}, [openSignal]);");
  });
});
