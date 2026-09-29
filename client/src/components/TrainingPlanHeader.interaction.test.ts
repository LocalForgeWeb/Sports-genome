// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
