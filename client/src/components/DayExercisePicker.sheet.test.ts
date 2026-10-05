// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DayExercisePicker } from "./DayExercisePicker";
import { exercises } from "@/lib/exerciseCatalog";
import { distinguishingMuscles, sharedRowMuscles } from "@/lib/pickerRowFacts";

// Pass-through spies, so a test can see whether the rows' facts were worked out at all.
vi.mock("@/lib/pickerRowFacts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pickerRowFacts")>();
  return { ...actual, distinguishingMuscles: vi.fn(actual.distinguishingMuscles), sharedRowMuscles: vi.fn(actual.sharedRowMuscles) };
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

// Under jsdom import.meta.url is an http: URL, so the stylesheet is read by path.
const styles = readFileSync(resolve(process.cwd(), "client/src/workout-planner.css"), "utf8");

const props = (sheetOpen: boolean) => ({
  exercises, activeWorkout: [] as typeof exercises, split: "Pull" as const, sheetOpen,
  onOpenSheet: () => undefined, onCloseSheet: () => undefined, onAdd: () => undefined, onReplace: () => undefined, onInspect: () => undefined,
});

/**
 * Reported from a phone: "when I type it moves me up and down the site". Two
 * causes, both measured. The sheet was bottom-anchored with a maximum height, so
 * as the results shrank from 24 rows to 2 its top edge - search box included -
 * slid 247px down the screen and back. And the page behind the fixed sheet was
 * still scrollable, so iOS scrolled the document to reveal the focused box on
 * every keystroke.
 */
describe("the picker sheet holds still while the athlete types", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("scrollTo", vi.fn());
    Object.defineProperty(window, "scrollY", { value: 1919, configurable: true });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.removeAttribute("style"); });

  it("keeps one height however many rows the search returns", () => {
    expect(styles).toMatch(/\.day-picker-sheet \{[^}]*\bheight: min\(92dvh, 900px\)/);
    expect(styles).not.toMatch(/\.day-picker-sheet \{[^}]*max-height/);
  });

  it("pins the page where it was while the sheet is up, and puts it back on close", () => {
    const view = render(createElement(DayExercisePicker, props(true)));
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-1919px");
    expect(document.body.style.overflow).toBe("hidden");

    view.rerender(createElement(DayExercisePicker, props(false)));
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    // The athlete's place on the day, not the top of it.
    expect(window.scrollTo).toHaveBeenCalledWith(0, 1919);
  });

  it("leaves the page alone when the sheet was never opened", () => {
    render(createElement(DayExercisePicker, props(false)));
    expect(document.body.style.position).toBe("");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

/**
 * Closing the sheet unmounts the search field that held focus, so focus fell to
 * the top of the document instead of the "Add exercises" button that opened it.
 * And the split / all-catalog toggle said which side was on only with a fill.
 */
describe("the picker sheet for keyboard and screen-reader users", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); document.body.removeAttribute("style"); });

  it("moves focus into the search field, and back to the button that opened it on close", () => {
    vi.useFakeTimers();
    const opener = document.createElement("button");
    opener.textContent = "Add exercises";
    document.body.appendChild(opener);
    opener.focus();

    const view = render(createElement(DayExercisePicker, props(true)));
    vi.advanceTimersByTime(60);
    expect(document.activeElement).toBe(view.getByPlaceholderText(/Search Pull exercises/));

    view.rerender(createElement(DayExercisePicker, props(false)));
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("says which scope is on, not only with a fill colour", () => {
    const view = render(createElement(DayExercisePicker, props(true)));
    expect(view.getByRole("button", { name: /Pull fit/, pressed: true })).toBeTruthy();
    expect(view.getByRole("button", { name: /All catalog/, pressed: false })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: /All catalog/ }));
    expect(view.getByRole("button", { name: /Pull fit/, pressed: false })).toBeTruthy();
    expect(view.getByRole("button", { name: /All catalog/, pressed: true })).toBeTruthy();
  });
});

/**
 * The Plan page re-renders this panel on every keystroke in a reps field. The
 * sheet's rows, and the facts each row states, were rebuilt each time while the
 * sheet was closed and nothing showed them.
 */
describe("the closed sheet does no work for rows nobody can see", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("scrollTo", vi.fn());
    vi.mocked(distinguishingMuscles).mockClear();
    vi.mocked(sharedRowMuscles).mockClear();
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.removeAttribute("style"); });

  it("builds the rows and their facts only while the sheet is open", () => {
    const view = render(createElement(DayExercisePicker, props(false)));
    view.rerender(createElement(DayExercisePicker, props(false)));
    view.rerender(createElement(DayExercisePicker, props(false)));
    expect(sharedRowMuscles).not.toHaveBeenCalled();
    expect(distinguishingMuscles).not.toHaveBeenCalled();

    view.rerender(createElement(DayExercisePicker, props(true)));
    expect(sharedRowMuscles).toHaveBeenCalled();
    expect(distinguishingMuscles).toHaveBeenCalled();
    expect(document.querySelectorAll(".day-picker-result").length).toBeGreaterThan(0);
  });
});

/**
 * Sep 30 brief §5: an Add says where it adds. "Add X to this day" named no day,
 * while the catalog's plus said "Week 1, Pull"; both now name the day the same way.
 */
describe("each Add names the day it adds to", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.removeAttribute("style"); });

  it("reads 'Add X to Week 1, Pull', and 'X is already in Week 1, Pull' once it is there", () => {
    const view = render(createElement(DayExercisePicker, { ...props(true), destination: "Week 1 · Pull" }));
    const adds = view.getAllByRole("button", { name: /^Add .+ to Week 1, Pull$/ });
    expect(adds.length).toBeGreaterThan(0);
    expect(view.queryAllByRole("button", { name: /this day/ })).toEqual([]);
    const first = exercises.find((exercise) => adds[0].getAttribute("aria-label") === `Add ${exercise.name} to Week 1, Pull`)!;
    expect(first).toBeTruthy();

    view.rerender(createElement(DayExercisePicker, { ...props(true), destination: "Week 1 · Pull", activeWorkout: [first] }));
    const added = view.getByRole("button", { name: `${first.name} is already in Week 1, Pull` });
    expect((added as HTMLButtonElement).disabled).toBe(true);
  });
});

/**
 * Reported from a phone: an exercise added by mistake could not come back out of
 * Add Exercises. Its row said "Added" on a dead button, and taking it out meant
 * closing the sheet and finding it on the day. The row's control now takes it back
 * out, and the footer's count opens the day's own list.
 */
describe("taking an exercise back out without leaving the sheet", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.removeAttribute("style"); });

  const pull = exercises.filter((exercise) => /pull/i.test(exercise.movement));
  const open = (activeWorkout: typeof exercises, onRemove = vi.fn()) => ({ ...props(true), destination: "Week 1 · Pull", activeWorkout, onRemove });
  // A row the sheet shows on an empty Pull day (it lists the first 24 by what the day needs).
  const shownRow = () => {
    const view = render(createElement(DayExercisePicker, open([])));
    const label = view.getAllByRole("button", { name: /^Add .+ to Week 1, Pull$/ })[0].getAttribute("aria-label");
    view.unmount();
    return exercises.find((exercise) => label === `Add ${exercise.name} to Week 1, Pull`)!;
  };

  it("turns Added into Remove on a row already in the day, and the same button adds it again after", () => {
    const first = shownRow();
    const onRemove = vi.fn();
    const view = render(createElement(DayExercisePicker, open([first], onRemove)));
    const remove = view.getByRole("button", { name: `Remove ${first.name} from Week 1, Pull` }) as HTMLButtonElement;
    expect(remove.disabled).toBe(false);
    expect(remove.closest(".day-picker-result")?.querySelector(".day-picker-in-day")?.textContent).toContain("Added");
    remove.focus();
    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledWith(first);

    // The day without it: one button whose job changed, still holding focus for a second thought.
    view.rerender(createElement(DayExercisePicker, open([], onRemove)));
    const add = view.getByRole("button", { name: `Add ${first.name} to Week 1, Pull` });
    expect(add).toBe(remove);
    expect(document.activeElement).toBe(add);
  });

  it("takes out the latest entry when the day holds the exercise twice", () => {
    const first = shownRow();
    const twice = { ...first, id: -42, catalogExerciseId: first.id } as typeof first;
    const onRemove = vi.fn();
    const view = render(createElement(DayExercisePicker, open([first, twice], onRemove)));
    // Found by name: with it in the day twice, what the day needs (and so the order) changes.
    fireEvent.change(view.getByPlaceholderText(/Search Pull exercises/), { target: { value: first.name } });
    fireEvent.click(view.getByRole("button", { name: `Remove ${first.name} from Week 1, Pull` }));
    expect(onRemove).toHaveBeenCalledWith(twice);
  });

  it("opens the day's list from the footer count, in order, each with Remove", () => {
    const day = pull.slice(0, 3);
    const onRemove = vi.fn();
    const view = render(createElement(DayExercisePicker, open(day, onRemove)));
    const toggle = view.getByRole("button", { name: /3 in Week 1 · Pull/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const list = view.getByRole("region", { name: "In Week 1 · Pull" });
    expect(Array.from(list.querySelectorAll(".day-picker-day-name"), (name) => name.textContent)).toEqual(day.map((exercise) => exercise.name));
    fireEvent.click(within(list).getByRole("button", { name: `Remove ${day[1].name} from Week 1, Pull` }));
    expect(onRemove).toHaveBeenCalledWith(day[1]);
  });

  it("keeps focus in the list as rows come out, and on the count once it is empty", () => {
    const day = pull.slice(0, 2);
    const onRemove = vi.fn();
    const view = render(createElement(DayExercisePicker, open(day, onRemove)));
    fireEvent.click(view.getByRole("button", { name: /2 in Week 1 · Pull/ }));
    fireEvent.click(view.getByRole("button", { name: `Remove ${day[0].name} from Week 1, Pull` }));
    view.rerender(createElement(DayExercisePicker, open([day[1]], onRemove)));
    const list = view.getByRole("region", { name: "In Week 1 · Pull" });
    expect(document.activeElement).toBe(within(list).getByRole("button", { name: `Remove ${day[1].name} from Week 1, Pull` }));

    fireEvent.click(document.activeElement!);
    view.rerender(createElement(DayExercisePicker, open([], onRemove)));
    expect(view.getByText("Nothing in this day yet.")).toBeTruthy();
    expect(document.activeElement).toBe(view.getByRole("button", { name: /0 in Week 1 · Pull/ }));
  });

  it("says what this visit added and took out, not only the difference", () => {
    const [a, b, c] = pull;
    const view = render(createElement(DayExercisePicker, open([a, b])));
    view.rerender(createElement(DayExercisePicker, open([b, c])));
    expect(view.getByRole("button", { name: "2 in Week 1 · Pull · 1 added, 1 removed now" })).toBeTruthy();
  });

  it("closes the day's list on Escape before it closes the sheet", () => {
    const onCloseSheet = vi.fn();
    const view = render(createElement(DayExercisePicker, { ...open(pull.slice(0, 1)), onCloseSheet }));
    const toggle = view.getByRole("button", { name: /1 in Week 1 · Pull/ });
    fireEvent.click(toggle);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.queryByRole("region", { name: "In Week 1 · Pull" })).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(onCloseSheet).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCloseSheet).toHaveBeenCalledTimes(1);
  });

  it("keeps the old dead Added where nothing can remove (no onRemove given)", () => {
    const first = shownRow();
    const view = render(createElement(DayExercisePicker, { ...props(true), destination: "Week 1 · Pull", activeWorkout: [first] }));
    expect((view.getByRole("button", { name: `${first.name} is already in Week 1, Pull` }) as HTMLButtonElement).disabled).toBe(true);
    expect(view.queryByRole("button", { name: /in Week 1 · Pull/ })).toBeNull();
  });
});
