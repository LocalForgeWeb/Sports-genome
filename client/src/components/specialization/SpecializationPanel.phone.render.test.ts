// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { buildDaySlots, commitDay, emptyDayStore } from "@/lib/trainingDayPlan";
import { saveSpecializationGoals } from "@/lib/specialization/stores";
import { forearmActionIds } from "@shared/specialization/regions/forearm/ids";

/**
 * The page on a phone, after the final review (17 Oct): Not for me says so where the athlete
 * is, with its Undo in place of the row and focus on it (F-phone-1); "How this is counted" from
 * a sheet takes focus to the method (F-phone-8); planned work is planned, never "touched"
 * (F-phone-7); a short text action keeps a 44 px square (F-phone-5); and the counts that have
 * set records open them, while the rest say they cannot (F-completeness-4).
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(["Push", "Pull", "Legs"]);
const store = commitDay(commitDay(emptyDayStore(), slots[0].key, { workout: [byId(1), byId(139)], prescriptions: {}, settings: {}, context: [] }), slots[1].key, { workout: [byId(45), byId(132)], prescriptions: {}, settings: {}, context: [] });
const set = (weight: number, reps: number, extra: Record<string, unknown> = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const tuesday = {
  id: "s-tue", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-13T17:00:00.000Z", completedAt: "2026-10-13T18:00:00.000Z", status: "completed",
  exercises: [{ id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] }],
};
const logged = (list: unknown[]) => window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(list));

function Harness(props: { initial?: Partial<SpecializationViewState>; onOpenSession?: (id: string) => void }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...props.initial });
  const panel: SpecializationPanelProps = {
    state,
    onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1 },
    catalog: exercises,
    equipmentProfile: defaultEquipmentProfile,
    accountId: null,
    goal: "Athleticism",
    weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }),
    onInspectExercise: () => {},
    onOpenSession: props.onOpenSession ?? (() => {}),
    backLabel: null,
    onBack: null,
  };
  return createElement(SpecializationPanel, panel);
}

// The region's data loads on its own (loadRegion.ts); loaded once, the page draws it at once.
beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  logged([tuesday]);
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const openSheet = async (name: RegExp) => { await click(screen.getByRole("button", { name })); };
const candidateRows = (sheet: HTMLElement) => Array.from(sheet.querySelectorAll<HTMLLIElement>(".spz-candidates > li"));

describe("Not for me says so where the athlete is (F-phone-1)", () => {
  it("puts the line and its Undo in the removed row's place, focuses Undo, and after Undo focuses the restored exercise's Not for me", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await openSheet(/Inspect coverage/);
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const before = within(sheet).getAllByRole("button", { name: /^Do not suggest / });
    expect(before.length).toBeGreaterThanOrEqual(3);
    const third = before[2];
    const name = third.getAttribute("aria-label")!.replace("Do not suggest ", "");
    await click(third);

    // In the list, at the third place, where the row was: not after every remaining suggestion.
    const rows = candidateRows(sheet);
    expect(rows[2].querySelector('[role="status"]')?.textContent).toMatch(new RegExp(`^${name} will not be suggested\\.`));
    const undo = within(rows[2]).getByRole("button", { name: "Undo" });
    expect(document.activeElement).toBe(undo);
    // Its 44 px square, and what it undoes read with it.
    expect(undo.classList.contains("spz-link-box")).toBe(true);
    expect(document.getElementById(undo.getAttribute("aria-describedby")!)?.textContent).toBe(`${name} will not be suggested.`);

    await click(undo);
    const restored = within(sheet).getByRole("button", { name: `Do not suggest ${name}` });
    expect(document.activeElement).toBe(restored);
    expect(candidateRows(sheet).some((row) => row.querySelector('[role="status"]'))).toBe(false);
  });

  it("drops the Undo once the exercise is brought back another way (Suggest again)", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await openSheet(/Inspect coverage/);
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const first = within(sheet).getAllByRole("button", { name: /^Do not suggest / })[0];
    await click(first);
    await click(within(sheet).getByRole("button", { name: "Suggest again" }));
    expect(within(sheet).queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("moves focus on from Suggest again, whose row goes, and says nothing stale once the equipment changes", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await openSheet(/Inspect coverage/);
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    for (let index = 0; index < 2; index += 1) await click(within(sheet).getAllByRole("button", { name: /^Do not suggest / })[0]);
    const again = () => within(sheet).queryAllByRole("button", { name: "Suggest again" });
    expect(again()).toHaveLength(2);

    // The first row goes: focus moves to the one left, not to the page body.
    await click(again()[0]);
    expect(again()).toHaveLength(1);
    expect(document.activeElement).toBe(again()[0]);
    // The last one goes: focus moves to the disclosure, which stays for its equipment choices.
    await click(again()[0]);
    expect(again()).toHaveLength(0);
    const summary = within(sheet).getByText("What is suggested").closest("summary");
    expect(document.activeElement).toBe(summary);
    expect(document.activeElement).not.toBe(document.body);

    // Every equipment left out: no suggestion is shown, and no line about the earlier "Suggest again" appears out of place.
    for (const chip of within(sheet).getByRole("group", { name: "Equipment to leave out of suggestions" }).querySelectorAll<HTMLButtonElement>('button[aria-pressed="false"]')) await click(chip);
    expect(candidateRows(sheet)).toHaveLength(0);
    expect(sheet.textContent).not.toMatch(/is suggested again\./);
  });

  it("says a refused Suggest again, and keeps the exercise left out", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await openSheet(/Inspect coverage/);
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    await click(within(sheet).getAllByRole("button", { name: /^Do not suggest / })[0]);
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    try {
      await click(within(sheet).getByRole("button", { name: "Suggest again" }));
    } finally {
      setItem.mockRestore();
    }
    expect(within(sheet).getByRole("alert").textContent).not.toBe("");
    expect(within(sheet).getAllByRole("button", { name: "Suggest again" })).toHaveLength(1);
  });
});

describe("How this is counted, from a sheet (F-phone-8)", () => {
  it("closes the sheet, opens the method and puts focus on it, not back on the row the sheet came from", async () => {
    render(createElement(Harness));
    const row = screen.getByRole("button", { name: /^Brachioradialis,/ });
    row.focus();
    await click(row);
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    await click(within(sheet).getByRole("button", { name: /How this is counted/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    const method = document.getElementById("spz-method") as HTMLDetailsElement;
    expect(method.open).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(method.querySelector("summary")));
  });
});

describe("planned work is planned, not done (F-phone-7)", () => {
  it("says the region's planned bouts are planned for it, in that plan week, and never that they touched it", () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    const strip = screen.getByRole("group", { name: "Selected muscle" });
    expect(strip.textContent).toMatch(/^\d+ distinct bouts? (is|are) planned for your right forearm in Plan Week 1\./);
    expect(strip.textContent).not.toMatch(/touched/);
  });

  it("says a movement's planned sets are planned for it, not done by its muscles", async () => {
    saveSpecializationGoals([{
      id: "move", regionId: "forearm", nodeId: null, actionId: forearmActionIds.elbowFlexion, side: "right", metric: "direct_dynamic_bouts", target: 6,
      period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z",
    }], null);
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await click(screen.getByRole("button", { name: "Open Elbow flexion" }));
    const sheet = screen.getByRole("dialog");
    expect(sheet.textContent).toMatch(/Each planned set counts once for the movement, however many muscles it is planned for\./);
    expect(sheet.textContent).not.toMatch(/muscles did it/);
  });

  it("still says logged work touched the region in completed mode", () => {
    render(createElement(Harness));
    expect(screen.getByRole("group", { name: "Selected muscle" }).textContent).toMatch(/^3 distinct bouts touched your right forearm\./);
  });
});

describe("Custom's dates, their labels inline", () => {
  /** The rules of one `@media (max-width: …)` block of the page's stylesheet. */
  const mediaBlock = (css: string, width: number) => {
    const start = css.indexOf(`@media (max-width: ${width}px) {`);
    return start < 0 ? "" : css.slice(start, css.indexOf("\n}", start));
  };

  it("sit in one row only from 375 px, the two dates as wide as each other; below it, where the From date was cut in Chromium, they stack", () => {
    const css = readFileSync(join(__dirname, "specialization.css"), "utf8");
    // Each label its own column, the two date columns sharing the rest equally.
    expect(css).toMatch(/\.spz-field\.spz-dates \{[^}]*grid-template-columns: max-content minmax\(0, 1fr\) max-content minmax\(0, 1fr\)/);
    expect(mediaBlock(css, 374)).toMatch(/\.spz-field\.spz-dates \{ grid-template-columns: 2\.25rem minmax\(0, 1fr\); \}/);
    // The regions' grid keeps its own breakpoint; the dates are not in it.
    expect(mediaBlock(css, 359)).toMatch(/\.spz-regions/);
    expect(mediaBlock(css, 359)).not.toMatch(/spz-dates|spz-field/);
    // 16 px inputs (the field's), so iOS does not zoom on focus.
    expect(css).not.toMatch(/\.spz-dates > input \{[^}]*font-size/);
    expect(css).toMatch(/\.spz-field :is\(input, select\) \{[^}]*font-size: var\(--sg-text-lg\)/);
  });

  it("render as From and To, each labelling its own date field", () => {
    render(createElement(Harness, { initial: { window: "custom", from: "2026-10-08", to: "2026-10-16" } }));
    expect((screen.getByLabelText("From") as HTMLInputElement).value).toBe("2026-10-08");
    expect((screen.getByLabelText("To") as HTMLInputElement).value).toBe("2026-10-16");
    const dates = document.querySelector(".spz-dates")!;
    expect(Array.from(dates.children).map((child) => child.tagName)).toEqual(["LABEL", "INPUT", "LABEL", "INPUT"]);
  });
});

describe("a reading's date and time, in Progress", () => {
  it("sit in two equal columns that may shrink, so the date input never runs under the time field; stacked under 375 px; 16 px inputs", () => {
    const css = readFileSync(join(__dirname, "progress.css"), "utf8");
    expect(css).toMatch(/\.spz-progress-when \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*\}/);
    expect(css).toMatch(/\.spz-progress-when input \{ min-width: 0; padding: 0 \.375rem; \}/);
    const narrow = css.slice(css.indexOf("@media (max-width: 374px) {"));
    expect(narrow).toMatch(/^@media \(max-width: 374px\) \{\s*\.spz-progress-when \{ grid-template-columns: minmax\(0, 1fr\); \}/);
    // The flex row it replaced, whose date input would not shrink, is gone; nothing sets a smaller type.
    expect(css).not.toMatch(/\.spz-progress-when[^{]*\{[^}]*(flex-wrap|font-size)/);
  });
});

describe("short text actions keep a 44 px square (F-phone-5)", () => {
  it("gives the notes' Open and an exercise's Sets the box", () => {
    logged([{ ...tuesday, note: "Grip gave out on the last set." }]);
    render(createElement(Harness));
    const open = screen.getByRole("button", { name: "Open Week 1 · Day 02 · Pull" });
    expect(open.textContent).toBe("Open");
    expect(open.classList.contains("spz-link-box")).toBe(true);
    expect(screen.getByRole("button", { name: "The sets of Hammer Curl" }).classList.contains("spz-link-box")).toBe(true);
  });
});

describe("the completeness counts open what they can (F-completeness-4)", () => {
  const thursday = {
    id: "s-thu", title: "Upper", dayLabel: "Week 1 · Day 01 · Push", startedAt: "2026-10-15T17:00:00.000Z", completedAt: "2026-10-15T18:00:00.000Z", status: "completed",
    exercises: [
      { id: "p1", exerciseName: "Dumbbell Pullover", catalogId: 24, plannedPrescription: "3 × 12", sets: [set(40, 12), set(40, 12), set(40, 10)] },
      { id: "w1", exerciseName: "One-Arm Dumbbell Wrist Curl", catalogId: 410, plannedPrescription: "1 × 12", sets: [set(25, 12)] },
      { id: "h1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "2 × 12", sets: [set(15, 12, { warmup: true }), set(30, 12, { completed: false, skipped: true })] },
    ],
  };
  const method = () => document.getElementById("spz-method")!;

  it("opens the region-only and no-arm sets from How this is counted, and says plainly what is not kept as a list", async () => {
    const onOpenSession = vi.fn();
    logged([tuesday, thursday]);
    render(createElement(Harness, { onOpenSession }));
    expect(method().textContent).toMatch(/Left out: 1 not completed, 1 warm-ups\./);
    expect(method().textContent).toMatch(/Sets not completed and warm-ups are left out of every total and not kept as a list, so they cannot be opened\./);

    // The three forearms-only sets have no arm recorded too: said to be in their own list, never "left out".
    expect(method().textContent).toMatch(/3 sets with no arm recorded are among the sets for the forearms only, and open there\./);
    expect(method().textContent).not.toMatch(/count for no muscle|leaves them out/);
    await click(within(method()).getByRole("button", { name: /See the 3 sets for the forearms only/ }));
    let sheet = screen.getByRole("dialog", { name: "3 sets for the forearms as a whole" });
    expect(within(sheet).getByText("Dumbbell Pullover")).not.toBeNull();
    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });

    await click(within(method()).getByRole("button", { name: /See the 1 set with no arm recorded/ }));
    sheet = screen.getByRole("dialog", { name: "1 set with no arm recorded" });
    expect(within(sheet).getByText("One-Arm Dumbbell Wrist Curl")).not.toBeNull();
    await click(within(sheet).getByRole("button", { name: /Open this workout/ }));
    expect(onOpenSession).toHaveBeenCalledWith("s-thu");
  });

  it("says which sets with no arm recorded are in which list, and which count for no muscle of the forearms", () => {
    // A strapped one-leg Romanian deadlift: its only forearm credit is grip, which straps take away, and it names no arm.
    const strapped = { id: "rdl", exerciseName: "Single-Leg Romanian Deadlift", catalogId: 188, plannedPrescription: "1 × 8", straps: "yes", sets: [set(60, 8)] };
    logged([tuesday, { ...thursday, exercises: [...thursday.exercises, strapped] }]);
    render(createElement(Harness));
    const text = method().textContent ?? "";
    expect(text).toMatch(/5 with no arm recorded/);
    expect(text).toMatch(/3 sets with no arm recorded are among the sets for the forearms only, and open there\./);
    expect(text).toMatch(/The other set with no arm recorded counts for no muscle of the forearms, so no list of it opens here\./);
  });

  it("has nothing to open, and says nothing extra, when every set counted", () => {
    render(createElement(Harness));
    expect(within(method()).queryByRole("button", { name: /^See the/ })).toBeNull();
    expect(method().textContent).not.toMatch(/cannot be opened|leaves them out/);
  });
});

describe("the sets a muscle matched but did not count (F-completeness-4)", () => {
  it("shows each strapped set's segments and its workout, as the ledger rows above do", async () => {
    const onOpenSession = vi.fn();
    logged([{
      id: "s-row", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
      exercises: [{ id: "r1", exerciseName: "Barbell Bent-Over Row", catalogId: 43, plannedPrescription: "2 × 8", straps: "yes", sets: [set(185, 8), set(185, 7)] }],
    }]);
    render(createElement(Harness, { onOpenSession }));
    await click(screen.getByRole("button", { name: /^Flexor digitorum superficialis,/ }));
    const sheet = screen.getByRole("dialog", { name: "Flexor digitorum superficialis" });
    const notCounted = within(sheet).getByText("Not counted").closest("details")!;
    const rows = notCounted.querySelectorAll(".spz-bout");
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector(".spz-segments")?.textContent).toMatch(/185 lb × 8/);
    expect(rows[0].textContent).toMatch(/Strapped: grip not counted/);
    await click(within(rows[0] as HTMLElement).getByRole("button", { name: /Open this workout/ }));
    expect(onOpenSession).toHaveBeenCalledWith("s-row");
  });
});
