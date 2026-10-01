import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Sep 28 regression brief §8. The empty day had two equal "Add exercises" buttons (the card's
 * and the action row's), a disabled Open workout and Print, a "name it in your profile" prompt
 * and a 0/100 gauge, all before anything was in it; the header said "Empty · Saved".
 */
const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../components/TrainingPlanHeader.tsx", import.meta.url), "utf8");
const section = home.slice(home.indexOf('{workspace === "day-plan" && <section className="day-design-workspace">'), home.indexOf('{workspace === "body" &&'));

describe("the empty Plan day", () => {
  it("has one Add exercises action, with its day and week, and Import beside it", () => {
    const empty = section.slice(section.indexOf('<div className="day-plan-empty">'), section.indexOf("</div>}", section.indexOf('<div className="day-plan-empty">')));
    expect(empty.match(/setPickerSheetOpen\(true\)/g)).toHaveLength(1);
    expect(empty).toContain("{activeSlot.day} is empty");
    expect(empty).toContain("Week {activeWeek} · {activeSlot.ordinal}.");
    expect(empty).toContain("setImportOpen(true)");
  });

  it("shows the action row only on a day with work in it", () => {
    expect(section).toContain('{customWorkout.length > 0 && <div className="day-plan-actions">');
  });

  it("keeps the optional profile prompt off an empty day, but not a declared focus", () => {
    // Intentional change, Sep 30 brief §8: the one guard became two render sites, the declared
    // focus beside the rows and the generic prompt after the action row (Home.planLayout.test.ts).
    expect(section).toContain("{capacityFocus.focus && <DayCapacityNote");
    expect(section).toContain("{customWorkout.length > 0 && !capacityFocus.focus && <DayCapacityNote");
  });

  it("does not call an empty day saved, or a first session a replacement", () => {
    expect(header).toContain('{count > 0 && <span className="training-plan-saved">');
    expect(section).toContain('{customWorkout.length ? "Build a replacement session" : "Build a session for this day"}');
  });
});
