// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrainingDayNav } from "./TrainingDayNav";
import { buildDaySlots } from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";

const slots = buildDaySlots(splitDaysForFrequency(4));
const counts: Record<string, number> = { "0-Upper": 5, "2-Upper": 3 };

function renderNav(overrides: Partial<React.ComponentProps<typeof TrainingDayNav>> = {}) {
  const onOpen = vi.fn();
  const onCycle = vi.fn();
  render(React.createElement(TrainingDayNav, {
    week: 2,
    slots,
    activeIndex: 2,
    exerciseCountFor: (slot) => counts[slot.key] || 0,
    onOpen,
    onCycle,
    ...overrides,
  }));
  return { onOpen, onCycle };
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

  it("shows every day of the week at once, with what each one holds", () => {
    renderNav();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(within(tabs[0]).getByText("5 exercises")).toBeTruthy();
    expect(within(tabs[1]).getByText("Empty")).toBeTruthy();
    expect(within(tabs[2]).getByText("3 exercises")).toBeTruthy();
  });

  /**
   * A four-day week is Upper / Lower / Upper / Lower, so the label alone cannot say which
   * day is selected. Marking the position is what keeps Day 03 distinguishable from Day 01.
   */
  it("marks the selected day by position, not by its repeated split label", () => {
    renderNav();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
  });

  it("opens the day that was tapped", () => {
    const { onOpen } = renderNav();
    fireEvent.click(screen.getAllByRole("tab")[3]);
    expect(onOpen).toHaveBeenCalledWith(3);
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
