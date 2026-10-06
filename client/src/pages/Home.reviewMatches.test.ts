import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Sep 28 regression brief §9 and §11: two actions that did not go where they said. */
const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("actions that name a day open that day", () => {
  it("Review's 'Edit <day>' selects that slot by key and opens it in Plan", () => {
    // openTrainingDay stays on Review by design, so the button only moved the active marker.
    // The week board's day actions (Edit Pull, Add exercises to Legs) select by key and go to Plan.
    const call = home.slice(home.indexOf("<WeekReviewBoard"), home.indexOf("/>", home.indexOf("<WeekReviewBoard")));
    expect(call).toContain("daySlots.findIndex((slot) => slot.key === dayKey)");
    expect(call).toContain('selectTrainingDay(index); navigateWorkspace("day-plan"); if (options?.addExercises) { window.scrollTo({ top: 0 }); setPickerSheetOpen(true); }');
    expect(call).not.toContain("openTrainingDay(");
    expect(call).not.toContain("chooseDayToTrain(");
  });

  it("the add toast's 'View workout' opens the day that received the exercise", () => {
    const add = home.slice(home.indexOf("const addExercise = (exercise: Exercise"), home.indexOf("const toggleFavorite"));
    expect(add).toContain('action: { label: "View workout", onClick: () => { const slot = daySlots.find((item) => item.key === dayKey);');
    expect(add).toContain("setActiveSplitDayIndex(slot.index); setActiveSplitDay(slot.day);");
  });
});
