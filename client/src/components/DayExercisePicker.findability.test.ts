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
    expect(home.indexOf("setPickerSheetOpen(true)", empty)).toBeLessThan(home.indexOf("</div>", empty) + 400);
  });

  /**
   * Pressing it used to scroll the page down to the panel, which is not opening: the page
   * moved under the athlete and left them to work out that the thing they asked for was
   * now somewhere below.
   */
  it("opens a sheet over the day rather than scrolling the page to a panel", () => {
    expect(picker).toContain("sheetOpen?: boolean;");
    expect(picker).toContain('<div className="day-picker-sheet-scrim"');
    expect(picker).toContain('role="dialog" aria-modal="true"');
    expect(picker).not.toContain("scrollIntoView");
    expect(home).toContain("setPickerSheetOpen(true)");
  });

  it("puts the cursor in the search field, because searching is what it is for", () => {
    expect(picker).toContain("searchRef.current?.focus()");
    expect(picker).toContain("}, [sheetOpen]);");
  });

  it("closes the way every other layer over this page closes", () => {
    expect(picker).toContain('if (event.key === "Escape") onCloseSheet();');
    expect(picker).toContain('aria-label="Close add exercises"');
    // Clicking the scrim itself, not a click that bubbled up from inside the sheet.
    expect(picker).toContain("if (event.target === event.currentTarget) onCloseSheet?.()");
    expect(home).toContain("onCloseSheet={() => setPickerSheetOpen(false)}");
  });

  /**
   * It rendered in both places at once. The inline disclosure was 3,300px of the
   * Training Day's 6,400 - the largest block on a page whose job is to show the
   * day you are building, and a second copy of a surface that already had a door.
   */
  it("renders the catalog in the sheet and nowhere else", () => {
    expect(picker.match(/\{pickerBody\}/g)?.length).toBe(1);
    expect(picker).not.toContain("{!sheetOpen && pickerBody}");
    expect(picker).not.toContain('<details className="day-exercise-disclosure"');
    // What is left on the page is the door, and it opens the same sheet.
    expect(picker).toContain('className="day-exercise-open-catalog"');
    expect(home).toContain("onOpenSheet={() => setPickerSheetOpen(true)}");
  });

  /**
   * The coverage read-out named a muscle as the day's worst shortfall and then
   * offered nothing to do about it but open a modal that named it again.
   */
  it("makes a named shortfall open the catalog already filtered to it", () => {
    expect(picker).toContain("onFixMuscle={(target) => { setMuscle(muscleFilterKey(target)); setQuery(\"\"); onOpenSheet?.(); }}");
  });

  it("scrolls its results, not the sheet, so the way out stays on screen", () => {
    expect(styles).toContain(".day-picker-sheet .day-exercise-picker-content { min-height: 0; flex: 1 1 auto; overflow-y: auto;");
    expect(styles).toContain(".day-picker-sheet-foot");
  });
});
