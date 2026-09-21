// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrainingDayNav } from "./TrainingDayNav";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildDaySlots } from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";

const slots = buildDaySlots(splitDaysForFrequency(4));
const counts: Record<string, number> = { "0-Upper": 5, "2-Upper": 3 };

function renderNav(overrides: Partial<React.ComponentProps<typeof TrainingDayNav>> = {}) {
  const onCycle = vi.fn();
  render(React.createElement(TrainingDayNav, {
    week: 2,
    slots,
    activeIndex: 2,
    exerciseCountFor: (slot) => counts[slot.key] || 0,
    onCycle,
    ...overrides,
  }));
  return { onCycle };
}

afterEach(() => { document.body.innerHTML = ""; });

describe("Training day navigation", () => {
  it("says which week and which day is being built, by position as well as split label", () => {
    renderNav();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toContain("Day 03");
    expect(heading.textContent).toContain("Upper");
    expect(screen.getByText("Week 2 · building")).toBeTruthy();
  });

  /**
   * A four-day week is Upper / Lower / Upper / Lower, so the label alone cannot
   * say which day is selected. The position does, and with the strip of day
   * chips gone it is the only thing that does - which is why the counter beside
   * the arrows is no longer dropped on a phone.
   */
  it("marks the selected day by position, not by its repeated split label", () => {
    renderNav();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("Day 03");
    expect(screen.getByText("Day 03 of 04")).toBeTruthy();
  });

  it("carries no strip of day chips: the header is the whole control", () => {
    // Asked for directly. It was a third pinned band under the topbar and the
    // tab row, and the week cards scrolled behind it half-covered.
    renderNav();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(document.querySelector(".training-day-nav-strip")).toBeNull();
    expect(document.querySelector(".training-day-chip")).toBeNull();
  });

  it("steps to the next and previous day without leaving the screen", () => {
    const { onCycle } = renderNav();
    fireEvent.click(screen.getByLabelText("Next training day"));
    fireEvent.click(screen.getByLabelText("Previous training day"));
    expect(onCycle).toHaveBeenNthCalledWith(1, 1);
    expect(onCycle).toHaveBeenNthCalledWith(2, -1);
  });

  it("states that the open day is saving itself, because the old Save button was the thing athletes forgot", () => {
    renderNav();
    expect(screen.getByText(/Saved to this day as you edit/)).toBeTruthy();
    expect(screen.getByText("3 exercises in this day")).toBeTruthy();
  });

  it("says a day is empty rather than leaving an athlete guessing whether it failed to load", () => {
    renderNav({ activeIndex: 1 });
    expect(screen.getByText("Empty — add exercises below")).toBeTruthy();
  });

  it("does not offer to cycle a one-day week", () => {
    renderNav({ slots: buildDaySlots(splitDaysForFrequency(1)), activeIndex: 0 });
    expect(screen.getByLabelText("Next training day").hasAttribute("disabled")).toBe(true);
  });
});

/**
 * Nothing on this screen follows the scroll any more.
 *
 * The bar was once one sticky block 219px tall, which joined a topbar and a tab
 * row already pinned above it: 354px of an 852px phone never moved. Splitting it
 * so only the day strip stayed pinned got that down, but it was still a third
 * pinned band, and content passed behind it into a gap too small to read. The
 * strip is gone, so the header scrolls like everything else.
 */
describe("the day header does not follow the scroll", () => {
  const styles = readFileSync(join(process.cwd(), "client/src/workout-planner.css"), "utf8");
  /** Every declaration block for a selector, since it is styled in a base rule and
      again inside media queries and scoped overrides. */
  const rule = (selector: string) => (styles.match(new RegExp(`\\${selector} \\{[^}]*\\}`, "g")) ?? []).join("\n");

  it("lets the title, the count and the saved-state note scroll away", () => {
    expect(rule(".training-day-nav")).not.toContain("position: sticky");
  });

  it("leaves no styles behind for the strip it used to pin", () => {
    expect(styles).not.toContain("training-day-nav-strip");
    expect(styles).not.toContain("training-day-chip");
  });

  it("brings the weekly board back on a phone, now that nothing else lists the days", () => {
    // It was hidden there because the strip said the same thing in less room.
    expect(styles).not.toContain(".day-design-rail .weekly-plan-board { display: none; }");
  });
});
