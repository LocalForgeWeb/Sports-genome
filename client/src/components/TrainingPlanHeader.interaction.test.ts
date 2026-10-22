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
 * what confirms it, to a screen reader as well: a polite status that names the open week
 * and day. Only those are live. The exercise count sits beside the status, not in it,
 * because an add or a removal already has its toast and the sheet's own footer; a third
 * announcement of the same change was noise.
 */
describe("the identity line confirms the week and day being shown", () => {
  afterEach(() => { cleanup(); });

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

  it("is a polite status region that follows the selected week and day", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const view = render(React.createElement(TrainingPlanHeader, props));
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("Week 1 · Day 01");
    // The visible line still reads as one: the count follows the status, outside it.
    expect(status.parentElement!.textContent).toBe("Week 1 · Day 01 · 2 exercises");

    view.rerender(React.createElement(TrainingPlanHeader, { ...props, activeWeek: 2, activeIndex: 1 }));
    // The same node, so a screen reader hears the change rather than a new region appearing.
    expect(screen.getByRole("status")).toBe(status);
    expect(status.textContent).toBe("Week 2 · Day 02");
  });

  it("leaves the status unchanged when only the day's exercise count changes", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const view = render(React.createElement(TrainingPlanHeader, props));
    const status = screen.getByRole("status");

    view.rerender(React.createElement(TrainingPlanHeader, { ...props, exerciseCountFor: () => 3 }));
    expect(screen.getByRole("status")).toBe(status);
    expect(status.textContent).toBe("Week 1 · Day 01");
    expect(status.parentElement!.textContent).toBe("Week 1 · Day 01 · 3 exercises");

    view.rerender(React.createElement(TrainingPlanHeader, { ...props, exerciseCountFor: () => 0 }));
    expect(status.textContent).toBe("Week 1 · Day 01");
    expect(status.parentElement!.textContent).toBe("Week 1 · Day 01 · Empty");
  });
});

/**
 * "Make it so you can name the weeks" (owner, 21 Oct 2026). The open week is named in place:
 * "Name week" ends the week row and opens a one-line field under it, with no dialog. A named
 * week's pill leads with the name and keeps its number; the line under the days says both.
 */
describe("naming the open week", () => {
  afterEach(() => { cleanup(); });

  const props = {
    weeks: [{ week: 1, ready: true, savedDays: 2 }, { week: 2, ready: true, savedDays: 1, name: "Deload" }, { week: 3, ready: false, savedDays: 0 }],
    activeWeek: 1,
    onSelectWeek: () => undefined,
    onGenerateWeek: () => undefined,
    nextWeekToGenerate: 3,
    slots,
    activeIndex: 0,
    exerciseCountFor: () => 2,
    onChooseDay: () => undefined,
  };
  const field = () => screen.queryByRole("textbox", { name: "Name for Week 1" }) as HTMLInputElement | null;

  it("shows a named week by its name, with its number kept under it", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(React.createElement(TrainingPlanHeader, { ...props, activeWeek: 2, onRenameWeek: vi.fn() }));
    const weeks = within(screen.getByRole("group", { name: "Training week" }));
    expect(weeks.getByRole("button", { name: /^Deload\s*Week 2 · 1 saved$/ }).getAttribute("aria-current")).toBe("true");
    expect(weeks.getByRole("button", { name: /^Week 1\s*2 saved$/ })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Week 2: Deload · Day 01");
    // The control says what it does to which week, and its visible words are in its name.
    expect(screen.getByRole("button", { name: "Rename Week 2, Deload" }).textContent).toBe("Rename");
  });

  it("opens a field in place, saves what was typed, and gives focus back to the button", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const onRenameWeek = vi.fn();
    render(React.createElement(TrainingPlanHeader, { ...props, onRenameWeek }));
    const button = screen.getByRole("button", { name: "Name Week 1" });
    expect(button.textContent).toBe("Name week");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(field()).toBeNull();
    // Not a dialog: the field is part of the page.
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const input = field()!;
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("");
    expect(input.maxLength).toBe(24);

    fireEvent.change(input, { target: { value: "Heavy" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onRenameWeek).toHaveBeenCalledWith(1, "Heavy");
    expect(field()).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it("starts from the current name, and Escape or Cancel leave it as it was", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const onRenameWeek = vi.fn();
    render(React.createElement(TrainingPlanHeader, { ...props, activeWeek: 2, onRenameWeek }));
    fireEvent.click(screen.getByRole("button", { name: "Rename Week 2, Deload" }));
    const input = screen.getByRole("textbox", { name: "Name for Week 2" }) as HTMLInputElement;
    expect(input.value).toBe("Deload");
    fireEvent.change(input, { target: { value: "Peak" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("textbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Rename Week 2, Deload" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(onRenameWeek).not.toHaveBeenCalled();
  });

  it("closes the field when another week opens, so it never renames a week it did not name", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const view = render(React.createElement(TrainingPlanHeader, { ...props, onRenameWeek: vi.fn() }));
    fireEvent.click(screen.getByRole("button", { name: "Name Week 1" }));
    expect(field()).toBeTruthy();
    view.rerender(React.createElement(TrainingPlanHeader, { ...props, activeWeek: 2, onRenameWeek: vi.fn() }));
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("offers no naming where nothing saves it", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(React.createElement(TrainingPlanHeader, props));
    expect(screen.queryByRole("button", { name: /Name Week|Rename Week/ })).toBeNull();
  });
});

/**
 * "I'm struggling to switch the workout days in a week; I should be able to have 5 Upper days
 * or whatever" (owner, 22 Oct 2026). The day tabs carry their numbers, since a split repeats
 * its names, and "Edit days" opens the week's layout in place.
 */
describe("the week's days", () => {
  afterEach(() => { cleanup(); });

  const fourDays = [
    { key: "0-Upper", ordinal: "Day 01", day: "Upper", index: 0 },
    { key: "1-Lower", ordinal: "Day 02", day: "Lower", index: 1 },
    { key: "2-Upper", ordinal: "Day 03", day: "Upper", index: 2 },
    { key: "3-Lower", ordinal: "Day 04", day: "Lower", index: 3 },
  ] as unknown as DaySlot[];
  const layout = () => ({ onDays: vi.fn(), onPreset: vi.fn(), onDayType: vi.fn() });
  const props = (extra: Record<string, unknown> = {}) => ({
    weeks: [{ week: 1, ready: true, savedDays: 2 }, { week: 2, ready: false, savedDays: 0 }, { week: 3, ready: false, savedDays: 0 }],
    activeWeek: 1,
    onSelectWeek: () => undefined,
    onGenerateWeek: () => undefined,
    nextWeekToGenerate: 2,
    slots: fourDays,
    activeIndex: 0,
    exerciseCountFor: (slot: DaySlot) => (slot.index === 0 ? 2 : 0),
    onChooseDay: () => undefined,
    ...extra,
  });

  it("numbers each day tab, so two Upper days are told apart", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(React.createElement(TrainingPlanHeader, props()));
    const tabs = within(screen.getByRole("tablist", { name: "Day of the week" })).getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toEqual(["UpperDay 1 · 2", "LowerDay 2 · —", "UpperDay 3 · —", "LowerDay 4 · —"]);
  });

  it("opens the layout in place, with every option on the page, and hands each choice on", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const handlers = layout();
    render(React.createElement(TrainingPlanHeader, props({ layout: handlers, onRenameWeek: vi.fn() })));
    const edit = screen.getByRole("button", { name: "Edit days" });
    expect(edit.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(edit);
    expect(edit.getAttribute("aria-expanded")).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
    const editor = within(screen.getByRole("region", { name: "Your training days" }));

    expect(editor.getByRole("button", { name: "4 days a week" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(editor.getByRole("button", { name: "5 days a week" }));
    expect(handlers.onDays).toHaveBeenCalledWith(5);

    // Each day's kind, with what is on it.
    const third = editor.getByRole("combobox", { name: /Day 3/ }) as HTMLSelectElement;
    expect([...third.options].map((option) => option.value)).toEqual(["Upper", "Lower", "Push", "Pull", "Legs", "Full Body", "Sport Transfer"]);
    expect(third.value).toBe("Upper");
    expect(editor.getByText("2 exercises")).toBeTruthy();
    fireEvent.change(third, { target: { value: "Push" } });
    expect(handlers.onDayType).toHaveBeenCalledWith(2, "Push");

    // The ready-made weeks, the current one pressed and the suggestion marked.
    const upperLower = editor.getByRole("button", { name: /^Upper \/ LowerSuggested/ });
    expect(upperLower.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(editor.getByRole("button", { name: /^Upper every day/ }));
    expect(handlers.onPreset).toHaveBeenCalledWith(["Upper", "Upper", "Upper", "Upper"], "Upper every day");

    fireEvent.click(editor.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("region", { name: "Your training days" })).toBeNull();
    expect(document.activeElement).toBe(edit);
  });

  it("shows one of naming the week and editing its days at a time", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(React.createElement(TrainingPlanHeader, props({ layout: layout(), onRenameWeek: vi.fn() })));
    fireEvent.click(screen.getByRole("button", { name: "Edit days" }));
    fireEvent.click(screen.getByRole("button", { name: "Name Week 1" }));
    expect(screen.queryByRole("region", { name: "Your training days" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "Name for Week 1" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit days" }));
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("offers no editing where nothing saves it", () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(React.createElement(TrainingPlanHeader, props()));
    expect(screen.queryByRole("button", { name: "Edit days" })).toBeNull();
  });
});
