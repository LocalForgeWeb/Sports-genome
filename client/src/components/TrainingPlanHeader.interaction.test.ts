// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrainingPlanHeader } from "./TrainingPlanHeader";
import type { DaySlot } from "@/lib/trainingDayPlan";

const slots = [
  { key: "0-Push", ordinal: "Day 01", day: "Push", index: 0 },
  { key: "1-Pull", ordinal: "Day 02", day: "Pull", index: 1 },
] as unknown as DaySlot[];

describe("the week row is a group of buttons", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("opens a ready week, builds the next one, and does nothing for a locked one", () => {
    const onSelectWeek = vi.fn();
    const onGenerateWeek = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(React.createElement(TrainingPlanHeader, {
      weeks: [{ week: 1, ready: true, savedDays: 2 }, { week: 2, ready: false, savedDays: 0 }, { week: 3, ready: false, savedDays: 0 }],
      activeWeek: 1,
      onSelectWeek,
      onGenerateWeek,
      nextWeekToGenerate: 2,
      slots,
      activeIndex: 0,
      exerciseCountFor: () => 0,
      onChooseDay: () => undefined,
    }));

    const weeks = within(screen.getByRole("group", { name: "Training week" }));
    // No week is a tab. Each is named by what it says, including what pressing the next one does.
    expect(weeks.queryAllByRole("tab")).toHaveLength(0);
    expect(weeks.getByRole("button", { name: /^Week 1\s*2 saved$/ }).getAttribute("aria-current")).toBe("true");

    fireEvent.click(weeks.getByRole("button", { name: /^Week 1\s*2 saved$/ }));
    expect(onSelectWeek).toHaveBeenCalledWith(1);

    fireEvent.click(weeks.getByRole("button", { name: /^Week 2\s*Generate$/ }));
    expect(onGenerateWeek).toHaveBeenCalledTimes(1);

    const locked = weeks.getByRole("button", { name: /^Week 3\s*Locked$/ }) as HTMLButtonElement;
    expect(locked.disabled).toBe(true);
    fireEvent.click(locked);
    expect(onGenerateWeek).toHaveBeenCalledTimes(1);
    expect(onSelectWeek).toHaveBeenCalledTimes(1);
  });
});

/**
 * Sep 30 brief §8: a week switch raises no "Week N loaded" toast, so the identity line is
 * what confirms it, to a screen reader as well: a polite status that names the open week.
 */
describe("the identity line confirms the week and day being shown", () => {
  afterEach(() => { cleanup(); });

  it("is a polite status region that follows the selected week", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const props = {
      weeks: [{ week: 1, ready: true, savedDays: 2 }, { week: 2, ready: true, savedDays: 1 }, { week: 3, ready: false, savedDays: 0 }],
      activeWeek: 1,
      onSelectWeek: () => undefined,
      onGenerateWeek: () => undefined,
      nextWeekToGenerate: 3,
      slots,
      activeIndex: 0,
      exerciseCountFor: () => 2,
      onChooseDay: () => undefined,
    };
    const view = render(React.createElement(TrainingPlanHeader, props));
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("Week 1 · Day 01 · 2 exercises");

    view.rerender(React.createElement(TrainingPlanHeader, { ...props, activeWeek: 2, activeIndex: 1 }));
    expect(screen.getByRole("status").textContent).toBe("Week 2 · Day 02 · 2 exercises");
  });
});
