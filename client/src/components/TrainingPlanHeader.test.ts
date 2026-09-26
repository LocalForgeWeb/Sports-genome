import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainingPlanHeader } from "./TrainingPlanHeader";
import type { DaySlot } from "@/lib/trainingDayPlan";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const slots = [
  { key: "0-Push", ordinal: "Day 01", day: "Push", index: 0 },
  { key: "1-Pull", ordinal: "Day 02", day: "Pull", index: 1 },
  { key: "2-Legs", ordinal: "Day 03", day: "Legs", index: 2 },
] as unknown as DaySlot[];

const render = (over: Partial<Parameters<typeof TrainingPlanHeader>[0]> = {}) =>
  renderToStaticMarkup(createElement(TrainingPlanHeader, {
    weeks: [{ week: 1, ready: true, savedDays: 2 }, { week: 2, ready: false, savedDays: 0 }, { week: 3, ready: false, savedDays: 0 }],
    activeWeek: 1,
    onSelectWeek: () => undefined,
    onGenerateWeek: () => undefined,
    nextWeekToGenerate: 2,
    slots,
    activeIndex: 1,
    exerciseCountFor: (slot) => (slot.day === "Pull" ? 6 : 0),
    onChooseDay: () => undefined,
    ...over,
  }));

/**
 * Five blocks and roughly 900px used to stand between the top of the Training Day
 * and its first exercise: a hero, a week generator with three cards, a day header
 * with prev/next arrows, a weekly board with five more cards and a second Save
 * button, and a "Build it, run it, print it" card. Three of them named the same
 * day, and changing day meant scrolling past the day you were on to reach a grid
 * underneath it.
 */
describe("choosing a week and a day", () => {
  it("offers all three weeks and all the days at once", () => {
    const markup = render();
    // The trailing quote-or-space keeps the `training-plan-weeks` container out
    // of a count of the pills inside it.
    expect(markup.match(/class="training-plan-week[" ]/g)).toHaveLength(3);
    expect(markup.match(/class="training-plan-day[" ]/g)).toHaveLength(3);
    for (const day of ["Push", "Pull", "Legs"]) expect(markup).toContain(day);
  });

  it("marks the current week and the current day as the selected tab", () => {
    const markup = render();
    expect(markup).toContain("training-plan-week-active");
    expect(markup).toContain("training-plan-day-active");
    expect(markup.match(/aria-selected="true"/g), "one week and one day").toHaveLength(2);
  });

  /**
   * The generator was a block of its own, with a heading, a paragraph and a
   * button, to do a thing the pill can say.
   */
  it("makes an ungenerated week its own generate control, and locks the ones after it", () => {
    const markup = render();
    expect(markup).toContain("Generate");
    expect(markup).toContain("Locked");
    // Week 3 cannot be generated before week 2, so its pill does not pretend to.
    expect(markup.match(/disabled=""/g), "only week 3 is disabled").toHaveLength(1);
  });

  it("states the day once, with the count and the fact that it is already saved", () => {
    const markup = render();
    expect(markup).toContain("Week 1 · Day 02 · 6 exercises");
    // A status, not a button: every edit is written through to its day, and the
    // two Save buttons were telling an athlete to do what had already happened.
    expect(markup).toContain("training-plan-saved");
    expect(markup).not.toContain("Save day");
  });

  it("says a day is empty rather than saying nothing about it", () => {
    expect(render({ activeIndex: 0 })).toContain("Week 1 · Day 01 · Empty");
  });

  /**
   * The day tabs carry what the weekly board used to: which days have been
   * trained. That is the question anyone asks of a week first.
   */
  it("marks the day being trained and the days already done", () => {
    const markup = render({ trainingStateFor: (index) => (index === 1 ? "live" : index === 0 ? "trained" : null) });
    expect(markup).toContain("training-plan-day-live");
    expect(markup).toContain("Training now");
    expect(markup).toContain("training-plan-day-trained");
    expect(markup).toContain("Trained");
  });

  it("renders nothing rather than a header for a week with no days", () => {
    expect(render({ slots: [], activeIndex: 0 })).toBe("");
  });
});
