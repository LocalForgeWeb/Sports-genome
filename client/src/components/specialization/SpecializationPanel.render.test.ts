// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { saveSpecializationGoals, specializationGoalsKeyBase } from "@/lib/specialization/stores";
import type { SpecializationGoal } from "@shared/specialization/types";
import { specializationExclusionsKeyBase } from "@/lib/specialization/exclusions";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { buildDaySlots, commitDay, emptyDayStore } from "@/lib/trainingDayPlan";
import { parseSetCount } from "@/lib/sessionVolume";
import { getGoalPrescription } from "@/lib/workoutPlanner";

/**
 * The specialization page, rendered (design §7): the list and the sheet say the same thing,
 * a muscle without a target is "Not targeted", a target for both arms is two targets, and an
 * add is previewed in planned totals and handed to Home as one exact day.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(["Push", "Pull", "Legs"]);
const store = commitDay(commitDay(emptyDayStore(), slots[0].key, { workout: [byId(1), byId(139)], prescriptions: {}, settings: {}, context: [] }), slots[1].key, { workout: [byId(45), byId(132)], prescriptions: {}, settings: {}, context: [] });
const set = (weight: number, reps: number) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const sessions = [{
  id: "s-tue", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-13T17:00:00.000Z", completedAt: "2026-10-13T18:00:00.000Z", status: "completed",
  exercises: [{ id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] }],
}];

let lastState: SpecializationViewState | null = null;
function Harness(props: { initial?: Partial<SpecializationViewState>; onApply?: SpecializationPanelProps["onApplyPlanChange"]; onOpenSession?: (id: string) => void; plan?: Partial<SpecializationPanelProps["plan"]> }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...props.initial });
  lastState = state;
  return createElement(SpecializationPanel, {
    state,
    onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1, ...props.plan },
    catalog: exercises,
    equipmentProfile: defaultEquipmentProfile,
    accountId: null,
    goal: "Athleticism",
    weightUnit: "lb",
    onApplyPlanChange: props.onApply ?? (() => ({ ok: true, undo: () => {} })),
    onInspectExercise: () => {},
    onOpenSession: props.onOpenSession ?? (() => {}),
    backLabel: null,
    onBack: null,
  });
}

// The region's data loads on its own (loadRegion.ts); loaded once, the page draws it at once, as on a return visit.
beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const row = (name: RegExp) => screen.getByRole("button", { name });

describe("the specialization page", () => {
  it("lists the muscles with what this week's logged work gave them", () => {
    render(createElement(Harness));
    expect(screen.getByRole("heading", { level: 1, name: "Forearm specialization" })).not.toBeNull();
    // Three two-handed hammer curls: three direct bouts for the right arm, never six.
    expect(row(/^Brachioradialis, Surface\. 3 direct dynamic bouts/)).not.toBeNull();
    expect(within(screen.getByRole("group", { name: "Selected muscle" })).getByText(/3 distinct bouts touched your right forearm/)).not.toBeNull();
  });

  it("opens a muscle's sheet from the list, in the brief's order, and says Not targeted rather than a gap", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(row(/^Brachioradialis,/)); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const headings = within(sheet).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["What it does", "How it contributes to shape", "Completed · This week · 12–18 Oct · right arm", "Where the numbers come from", "Your target", "Exercises for this muscle", "Sources and method"]);
    expect(within(sheet).getByText("Not targeted.")).not.toBeNull();
    expect(within(sheet).getByText("Hammer Curl")).not.toBeNull();
    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("saves a target for both arms as two targets, one per arm", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Set a target/ })); });
    await act(async () => { fireEvent.change(within(sheet).getByRole("spinbutton"), { target: { value: "20" } }); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save target" })); });
    const saved = JSON.parse(window.localStorage.getItem(specializationGoalsKeyBase) ?? "[]");
    expect(saved.map((goal: { side: string; target: number; nodeId: string }) => [goal.side, goal.target, goal.nodeId])).toEqual([["left", 20, "forearm.br"], ["right", 20, "forearm.br"]]);
    // The right arm's progress, on this muscle's right-arm target row.
    expect(within(sheet).getAllByText(/3 of your 20/).length).toBeGreaterThan(0);
  });

  it("previews an add in planned totals and hands Home one exact day", async () => {
    const onApply = vi.fn(() => ({ ok: true as const, undo: () => {} }));
    render(createElement(Harness, { initial: { nodeId: "forearm.br" }, onApply }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const first = within(screen.getByRole("dialog")).getAllByRole("button", { name: /Add or swap/ })[0];
    await act(async () => { fireEvent.click(first); });
    const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ })); });
    expect(within(sheet).getByRole("heading", { name: "Planned totals, Week 1, right arm" })).not.toBeNull();
    const focus = sheet.querySelector(".spz-preview-list li[data-focus]");
    expect(focus?.textContent).toMatch(/^Brachioradialis/);
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatchObject({ week: 1, dayKey: slots[2].key, slotIndex: 2 });
    expect(onApply.mock.calls[0][0]).not.toHaveProperty("replaceEntryId");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the sheet open with Home's reason when the change is refused", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" }, onApply: () => ({ ok: false, reason: "Your plan is still loading, so nothing was changed." }) }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    await act(async () => { fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: /Add or swap/ })[0]); });
    const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
    // The day is the athlete's to choose: Save waits for it.
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ })); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    expect(within(sheet).getByRole("alert").textContent).toBe("Your plan is still loading, so nothing was changed.");
  });

  it("switches arm and mode through the page state, and reads the plan as written in planned mode", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Planned" })); });
    expect(screen.getByText("Plan Week 1, as written")).not.toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Left arm" })); });
    expect(screen.getByRole("button", { name: "Left arm" }).getAttribute("aria-pressed")).toBe("true");
    // Planned: Hammer Curl's sets as the goal's default prescription writes them for its place in the day, on each arm.
    const planned = parseSetCount(getGoalPrescription("Athleticism", 1));
    expect(row(new RegExp(`^Brachioradialis, Surface\\. ${planned} direct dynamic bouts`))).not.toBeNull();
  });
  it("starts an add from Add targeted exercise when the muscle has no work", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.fcr" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Add targeted exercise/ })); });
    expect(screen.getByRole("dialog", { name: "Add to your plan" })).not.toBeNull();
  });

  it("leaves an exercise out of suggestions with Not for me, and Undo brings it back", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const first = within(sheet).getAllByRole("button", { name: /^Do not suggest / })[0];
    const name = first.getAttribute("aria-label")!.replace("Do not suggest ", "");
    await act(async () => { fireEvent.click(first); });
    expect(within(sheet).queryByRole("button", { name: `Do not suggest ${name}` })).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(specializationExclusionsKeyBase) ?? "{}").catalogExerciseIds).toHaveLength(1);
    const notice = within(sheet).getAllByRole("status").find((element) => element.textContent?.startsWith(`${name} will not be suggested`))!;
    expect(notice).toBeTruthy();
    await act(async () => { fireEvent.click(within(notice).getByRole("button", { name: "Undo" })); });
    expect(within(sheet).getByRole("button", { name: `Do not suggest ${name}` })).not.toBeNull();
  });

  it("sets this week's logged work beside the plan week as written", () => {
    render(createElement(Harness));
    const line = document.querySelector(".spz-window")!.textContent!;
    // "Plan Week" and its number never part across lines (a no-break space).
    expect(line).toMatch(/^This week · \d+–\d+ Oct · right arm: 3 bouts logged · \d+ planned in Plan Week\u00a01$/);
  });

  it("drops a muscle the region does not have from the address", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.nonexistent" } }));
    await act(async () => {});
    expect(lastState?.nodeId).toBeNull();
  });
});

const target = (over: Partial<SpecializationGoal>): SpecializationGoal => ({
  id: "t1", regionId: "forearm", nodeId: "forearm.br", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 20,
  period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z", ...over,
});
const logged = (list: unknown[]) => window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(list));
const mapCard = () => screen.getByRole("region", { name: "Muscle map" });
const windowLine = () => document.querySelector(".spz-window")!.textContent!;

describe("the selected muscle, on the same screen as the drawing (brief §6 mobile overview)", () => {
  it("sits inside the map card between the view controls and the drawing, with the one action, and nowhere else", () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    const card = mapCard();
    const strip = within(card).getByRole("group", { name: "Selected muscle" });
    expect(within(strip).getByText("Brachioradialis")).not.toBeNull();
    expect(within(strip).getByText(/^3 direct dynamic bouts/)).not.toBeNull();
    const controls = within(card).getByRole("group", { name: "View" });
    const drawing = card.querySelector(".spz-diagram-svg")!;
    expect(controls.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(strip.compareDocumentPosition(drawing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // One action for the selection, in the strip: no second copy further down the page.
    expect(screen.getAllByRole("button", { name: /Inspect coverage|Add targeted exercise/ })).toEqual([within(strip).getByRole("button", { name: /Inspect coverage/ })]);
  });

  it("keeps to one target line however many targets the muscle has: the one furthest behind, and how many more", () => {
    saveSpecializationGoals([
      target({ id: "near", metric: "direct_dynamic_bouts", target: 4 }),
      target({ id: "far", metric: "deliberate_hold_bouts", target: 6 }),
      target({ id: "left", side: "left", metric: "direct_dynamic_bouts", target: 4 }),
    ], null);
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    const lines = strip.querySelectorAll(".spz-strip-goal");
    expect(lines).toHaveLength(1);
    // Right arm: 3 of 4 direct bouts, 0 of 6 holds; the holds are furthest behind. The left arm's target is not this arm's.
    expect(lines[0].textContent).toMatch(/^Hold bouts: 0 of your 6.* · 1 more target$/);
  });

  it("follows a tap on the drawing, and offers to add when the muscle has no work", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(within(mapCard()).getByRole("button", { name: /^Flexor carpi radialis\. / })); });
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    expect(within(strip).getByText("Flexor carpi radialis")).not.toBeNull();
    expect(within(strip).getByRole("button", { name: /Add targeted exercise/ })).not.toBeNull();
    expect(lastState?.nodeId).toBe("forearm.fcr");
  });

  it("keeps the drawing still under the finger when a tap changes the strip's height", async () => {
    render(createElement(Harness));
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    const rect = (bottom: number) => ({ top: bottom - 116, bottom, left: 0, right: 320, width: 320, height: 116, x: 0, y: bottom - 116, toJSON: () => ({}) }) as DOMRect;
    // Before the tap the region line is 116 px tall; the selected muscle's strip is 12 px shorter.
    vi.spyOn(strip, "getBoundingClientRect").mockImplementationOnce(() => rect(716)).mockImplementation(() => rect(704));
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    await act(async () => { fireEvent.click(within(mapCard()).getByRole("button", { name: /^Flexor carpi radialis\. / })); });
    expect(lastState?.nodeId).toBe("forearm.fcr");
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: -12, behavior: "instant" });
    // A choice from the list opens the sheet and moves nothing.
    scrollBy.mockClear();
    await act(async () => { fireEvent.click(row(/^Brachioradialis,/)); });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("with nothing selected, gives the region's count and opens the sets behind it", async () => {
    const onOpenSession = vi.fn();
    render(createElement(Harness, { onOpenSession }));
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    expect(within(strip).getByText(/^3 distinct bouts touched your right forearm\./)).not.toBeNull();
    await act(async () => { fireEvent.click(within(strip).getByRole("button", { name: /See these sets/ })); });
    const sheet = screen.getByRole("dialog", { name: "3 distinct bouts" });
    expect(sheet.textContent).toMatch(/every set that touched your right forearm/);
    expect(within(sheet).getByText("Hammer Curl")).not.toBeNull();
    const open = within(sheet).getAllByRole("button", { name: /Open this workout/ });
    expect(open).toHaveLength(3);
    await act(async () => { fireEvent.click(open[0]); });
    expect(onOpenSession).toHaveBeenCalledWith("s-tue");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("totals for the whole region open their sets (brief §1)", () => {
  const extra = {
    id: "s-thu", title: "Upper", dayLabel: "Week 1 · Day 01 · Push", startedAt: "2026-10-15T17:00:00.000Z", completedAt: "2026-10-15T18:00:00.000Z", status: "completed",
    exercises: [
      { id: "p1", exerciseName: "Dumbbell Pullover", catalogId: 24, plannedPrescription: "3 × 12", sets: [set(40, 12), set(40, 12), set(40, 10)] },
      { id: "w1", exerciseName: "One-Arm Dumbbell Wrist Curl", catalogId: 410, plannedPrescription: "1 × 12", sets: [set(25, 12)] },
    ],
  };
  it("lists the work mapped to no muscle, exercise by set, from its finding", async () => {
    const onOpenSession = vi.fn();
    logged([...sessions, extra]);
    render(createElement(Harness, { onOpenSession }));
    const finding = screen.getByText("3 sets count for the forearms as a whole only").closest("li")!;
    await act(async () => { fireEvent.click(within(finding).getByRole("button", { name: /See these sets/ })); });
    const sheet = screen.getByRole("dialog", { name: "3 sets for the forearms as a whole" });
    expect(within(sheet).getByText("Dumbbell Pullover")).not.toBeNull();
    expect(within(sheet).getByText("3 sets")).not.toBeNull();
    const open = within(sheet).getAllByRole("button", { name: /Open this workout/ });
    expect(open).toHaveLength(3);
    await act(async () => { fireEvent.click(open[0]); });
    expect(onOpenSession).toHaveBeenCalledWith("s-thu");
  });

  it("lists the sets with no arm recorded from their finding", async () => {
    logged([...sessions, extra]);
    render(createElement(Harness));
    const finding = screen.getByText("1 set with no arm recorded").closest("li")!;
    await act(async () => { fireEvent.click(within(finding).getByRole("button", { name: /See these sets/ })); });
    const sheet = screen.getByRole("dialog", { name: "1 set with no arm recorded" });
    expect(within(sheet).getByText("One-Arm Dumbbell Wrist Curl")).not.toBeNull();
    expect(within(sheet).getByText(/Arm not recorded/)).not.toBeNull();
  });

  it("in planned mode, calls the sets planned rather than done", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    await act(async () => { fireEvent.click(within(strip).getByRole("button", { name: /See these sets/ })); });
    const sheet = screen.getByRole("dialog");
    expect(sheet.textContent).toMatch(/every set planned for your right forearm/);
    expect(sheet.textContent).not.toMatch(/loaded/);
    expect(within(sheet).queryAllByRole("button", { name: /Open this workout/ })).toEqual([]);
  });

  it("opens one exercise's sets from Exercises in this window", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "The sets of Hammer Curl" })); });
    const sheet = screen.getByRole("dialog", { name: "Hammer Curl" });
    expect(within(sheet).getAllByRole("button", { name: /Open this workout/ })).toHaveLength(3);
  });

  it("opens a day's bouts from its bar in Exercises in this window; a day with none is not a button", async () => {
    const onOpenSession = vi.fn();
    logged([...sessions, extra]);
    render(createElement(Harness, { onOpenSession }));
    const days = screen.getByRole("list", { name: "Distinct bouts per day in this window" });
    // Thursday's pullovers are mapped to no muscle and its one-arm wrist curl has no arm recorded,
    // so only Tuesday's hammer curls make a bar with work, and only that bar is a button.
    expect(within(days).getAllByRole("listitem")).toHaveLength(7);
    const bars = within(days).getAllByRole("button");
    expect(bars.map((bar) => bar.getAttribute("aria-label"))).toEqual([expect.stringMatching(/13.*: 3 distinct bouts\. See these sets$/)]);
    await act(async () => { fireEvent.click(bars[0]); });
    const sheet = screen.getByRole("dialog", { name: bars[0].getAttribute("aria-label")!.replace(/: 3 distinct bouts\. See these sets$/, "") });
    expect(sheet.textContent).toMatch(/3 distinct bouts that day: every set that touched your right forearm/);
    expect(within(sheet).getByText("Hammer Curl")).not.toBeNull();
    const open = within(sheet).getAllByRole("button", { name: /Open this workout/ });
    expect(open).toHaveLength(3);
    await act(async () => { fireEvent.click(open[0]); });
    expect(onOpenSession).toHaveBeenCalledWith("s-tue");
  });
});

describe("the window line's pair opens its sets (brief §1: every total opens the set records)", () => {
  it("in completed mode the whole line is one button, and it opens this week's logged bouts beside the plan week's", async () => {
    const onOpenSession = vi.fn();
    render(createElement(Harness, { onOpenSession }));
    const line = document.querySelector(".spz-window")!;
    const button = within(line as HTMLElement).getByRole("button");
    expect(button.textContent).toBe(line.textContent);
    expect(button.textContent).toMatch(/: 3 bouts logged · \d+ planned in Plan Week\u00a01$/);
    await act(async () => { fireEvent.click(button); });
    const sheet = screen.getByRole("dialog", { name: /^3 logged · \d+ planned$/ });
    const headings = within(sheet).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    // Counted as the line counts them: bouts, each set once however many muscles it loads.
    expect(headings).toEqual(["Logged for your right forearm: 3 bouts", expect.stringMatching(/^Planned in Plan Week 1: \d+ bouts$/)]);
    expect(sheet.textContent).toMatch(/This week · \d+–\d+ Oct, logged, beside Plan Week 1, as written\./);
    // Only the logged sets have a workout to open.
    const open = within(sheet).getAllByRole("button", { name: /Open this workout/ });
    expect(open).toHaveLength(3);
    await act(async () => { fireEvent.click(open[0]); });
    expect(onOpenSession).toHaveBeenCalledWith("s-tue");
  });

  it("in planned mode, on the week being trained, opens the same sets", async () => {
    render(createElement(Harness, { initial: { mode: "planned" } }));
    const button = within(document.querySelector(".spz-window") as HTMLElement).getByRole("button");
    expect(button.textContent).toMatch(/^Plan Week 1, as written · right arm: \d+ bouts planned · 3 logged this week$/);
    await act(async () => { fireEvent.click(button); });
    const sheet = screen.getByRole("dialog", { name: /^3 logged · \d+ planned$/ });
    expect(within(sheet).getAllByRole("button", { name: /Open this workout/ })).toHaveLength(3);
  });

  it("is plain words with no pair to open: another window, or a plan week that is not the one trained", async () => {
    render(createElement(Harness, { initial: { window: "7d" } }));
    expect(within(document.querySelector(".spz-window") as HTMLElement).queryByRole("button")).toBeNull();
  });

  it("reads at AA on the Body Lab blue under it: on-dark ink, underlined, never link ink", () => {
    // The line sits on the page's own blue, lighter than the app's dark surfaces. Its lightest
    // point was measured at #1d5c94 in headless Chromium (375 x 667 and 390 x 844), where link
    // ink reads 3.8:1, under the 4.5:1 that 16 px text needs. The underline and the arrow may
    // stay in link ink: a non-text cue needs 3:1.
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
    const tokens = read("../../index.css");
    const token = (name: string) => tokens.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))![1];
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    const ground = "#1d5c94";
    const pair = read("./specialization.css").match(/\.spz-pair \{([^}]*)\}/)![1];
    expect(pair).toMatch(/(^|;)\s*color: var\(--sg-text-on-dark\)/);
    expect(pair).toMatch(/text-decoration: underline/);
    expect(ratio(token("--sg-text-on-dark"), ground)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token("--sg-link-on-dark"), ground)).toBeLessThan(4.5);
    expect(ratio(token("--sg-link-on-dark"), ground)).toBeGreaterThanOrEqual(3);
    // The same ground is under Back and the selected-muscle strip's links.
    for (const rule of [/\.spz-back \{([^}]*)\}/, /\.spz-strip \.spz-link \{([^}]*)\}/]) {
      const body = read("./specialization.css").match(rule)![1];
      expect(body).toMatch(/(^|;)\s*color: var\(--sg-text-on-dark\)/);
      expect(body).toMatch(/text-decoration: underline/);
    }
  });
});

describe("the exercises for a muscle, beyond each suggestion (brief §7)", () => {
  const section = (sheet: HTMLElement) => within(sheet).getByRole("heading", { name: "Exercises for this muscle" }).closest("section")!;

  it("says once, above the list, a target of yours that no reviewed exercise can count toward", async () => {
    saveSpecializationGoals([
      target({ id: "dyn", nodeId: "forearm.fcr", metric: "direct_dynamic_bouts", target: 10 }),
      target({ id: "hold", nodeId: "forearm.fcr", metric: "deliberate_hold_bouts", target: 3 }),
    ], null);
    render(createElement(Harness));
    await act(async () => { fireEvent.click(row(/^Flexor carpi radialis,/)); });
    const exercisesSection = section(screen.getByRole("dialog", { name: "Flexor carpi radialis" }));
    const note = "No reviewed exercise for flexor carpi radialis counts toward your target of 3 deliberate hold bouts this week.";
    const notes = Array.from(exercisesSection.querySelectorAll(".spz-suggest-note")).map((item) => item.textContent);
    expect(notes).toEqual([note]);
    const list = exercisesSection.querySelector(".spz-candidates")!;
    expect(exercisesSection.querySelector(".spz-suggest-note")!.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The exercises that fill the dynamic target name only that one.
    const first = list.querySelector(".spz-candidate small")!.textContent!;
    expect(first).toMatch(/of your 10 direct dynamic bouts this week/);
    expect(first).not.toMatch(/hold/);
  });

  it("says plainly when a main action has no direct work and no reviewed exercise trains it directly", async () => {
    logged([{ ...sessions[0], exercises: [{ id: "c1", exerciseName: "Barbell Curl", catalogId: 121, plannedPrescription: "3 × 10", sets: [set(60, 10), set(60, 10), set(60, 8)] }] }]);
    render(createElement(Harness));
    await act(async () => { fireEvent.click(row(/^Biceps brachii,/)); });
    const exercisesSection = section(screen.getByRole("dialog", { name: "Biceps brachii" }));
    const notes = Array.from(exercisesSection.querySelectorAll(".spz-suggest-note")).map((item) => item.textContent);
    expect(notes).toEqual(["Supination, a main action of this muscle, has no direct work in this window, and no reviewed exercise trains it directly yet."]);
    // A fact about the records, with no target and no shortfall in it.
    expect(notes[0]).not.toMatch(/behind|short|need|should|target/i);
  });

  it("says both once, in that order, when a target nothing can fill and a main action whose exercises answer a met target meet", async () => {
    // Two two-handed wrist curls meet FCR's dynamic target of 2; its hold target of 3 stays open.
    saveSpecializationGoals([
      target({ id: "dyn", nodeId: "forearm.fcr", metric: "direct_dynamic_bouts", target: 2 }),
      target({ id: "hold", nodeId: "forearm.fcr", metric: "deliberate_hold_bouts", target: 3 }),
    ], null);
    logged([{ ...sessions[0], exercises: [{ id: "w1", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "2 × 15", sets: [set(60, 15), set(60, 15)] }] }]);
    render(createElement(Harness));
    await act(async () => { fireEvent.click(row(/^Flexor carpi radialis,/)); });
    const exercisesSection = section(screen.getByRole("dialog", { name: "Flexor carpi radialis" }));
    expect(Array.from(exercisesSection.querySelectorAll(".spz-suggest-note")).map((item) => item.textContent)).toEqual([
      "No reviewed exercise for flexor carpi radialis counts toward your target of 3 deliberate hold bouts this week.",
      "Radial deviation, a main action of this muscle, has no direct work in this window, and the exercises that train it directly answer a target you have already met, so none is suggested.",
    ]);
    const list = exercisesSection.querySelector(".spz-candidates")!;
    expect(list).not.toBeNull();
    expect(exercisesSection.querySelectorAll(".spz-suggest-note")[1].compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Each is said once: no suggestion repeats the missing action as its lead.
    expect(list.textContent).not.toMatch(/Radial deviation: no direct work/);
  });

  it("lists what already covers the muscle in words: the plan days, then the sets logged, never as a day", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(row(/^Brachioradialis,/)); });
    const covered = section(screen.getByRole("dialog", { name: "Brachioradialis" })).querySelector(".spz-covered")!;
    expect(within(covered as HTMLElement).getByText("Already covered by")).not.toBeNull();
    expect(Array.from(covered.querySelectorAll("li")).map((item) => item.textContent)).toContain("Hammer Curl: planned on Day 02 · Pull; 3 sets logged in this window");
  });
});

describe("a movement target leads somewhere (brief §7: targets attach to a muscle or an action)", () => {
  beforeEach(() => { saveSpecializationGoals([target({ id: "move", nodeId: null, actionId: "elbow.flexion", target: 10 })], null); });

  it("opens the movement from its finding: its numbers, the bouts behind them and each workout", async () => {
    const onOpenSession = vi.fn();
    render(createElement(Harness, { onOpenSession }));
    const finding = screen.getByText("Elbow flexion: 3 of your 10").closest("li")!;
    await act(async () => { fireEvent.click(within(finding).getByRole("button", { name: /See its sets and exercises/ })); });
    const sheet = screen.getByRole("dialog", { name: "Elbow flexion" });
    const numbers = within(sheet).getByText("Direct dynamic bouts").closest("div")!;
    expect(numbers.querySelector("dd")!.textContent).toBe("3");
    expect(within(sheet).getByText(/Direct dynamic bouts: 3 of your 10/)).not.toBeNull();
    const group = within(sheet).getByText("Hammer Curl").closest("details")!;
    expect(within(group).getByText("3 bouts")).not.toBeNull();
    expect(within(group).getAllByText(/^By BR/).length).toBe(3);
    const open = within(group).getAllByRole("button", { name: /Open this workout/ });
    expect(open).toHaveLength(3);
    await act(async () => { fireEvent.click(open[0]); });
    expect(onOpenSession).toHaveBeenCalledWith("s-tue");
  });

  it("opens from Targets, suggests exercises for the movement, and adds one through the add sheet", async () => {
    const onApply = vi.fn(() => ({ ok: true as const, undo: () => {} }));
    render(createElement(Harness, { onApply }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Open Elbow flexion" })); });
    const sheet = screen.getByRole("dialog", { name: "Elbow flexion" });
    const suggestions = within(sheet).getByRole("heading", { name: "Exercises for this movement" }).closest("section")!;
    const first = within(suggestions).getAllByRole("listitem")[0];
    const name = first.querySelector("b")!.textContent!;
    await act(async () => { fireEvent.click(within(first).getByRole("button", { name: /Add or swap/ })); });
    const change = screen.getByRole("dialog", { name: "Add to your plan" });
    expect(within(change).getByText(/^For .+ · right arm$/)).not.toBeNull();
    await act(async () => { fireEvent.click(within(change).getByRole("button", { name: /Day 03 · Legs/ })); });
    await act(async () => { fireEvent.click(within(change).getByRole("button", { name: "Save to plan" })); });
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatchObject({ week: 1, dayKey: slots[2].key, catalogExerciseId: exercises.find((item) => item.name === name)!.id });
  });
});

describe("why an exercise counts (brief §2–§3: the mapping and its evidence)", () => {
  it("says, under each exercise in the ledger, the mapping, its basis, its rationale and its sources", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const ledger = within(sheet).getByRole("heading", { name: "Where the numbers come from" }).closest("section")!;
    const why = within(ledger).getByText("Why this counts").closest("details")!;
    expect(within(why).getByText("Direct target, moves the joint. Counted as direct dynamic.")).not.toBeNull();
    expect(within(why).getAllByText("Inferred from anatomy").length).toBeGreaterThan(0);
    expect(within(why).getByText(/^Hammer-style curls keep the forearm in neutral/)).not.toBeNull();
    expect(within(why).getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("puts the same disclosure under every suggestion", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const section = within(screen.getByRole("dialog", { name: "Brachioradialis" })).getByRole("heading", { name: "Exercises for this muscle" }).closest("section")!;
    const items = Array.from(section.querySelectorAll(".spz-candidate"));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(within(item as HTMLElement).getByText("Why this counts")).not.toBeNull();
  });
});

describe("planned mode while the plan loads", () => {
  it("shows that it is loading: no zeros, no hatching, no target progress and no findings", () => {
    saveSpecializationGoals([target({})], null);
    render(createElement(Harness, { initial: { mode: "planned", nodeId: "forearm.br" }, plan: { ready: false } }));
    expect(windowLine()).toMatch(/your plan is loading/);
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    expect(within(strip).getByText("Loading your plan…")).not.toBeNull();
    expect(screen.queryByText(/of your 20/)).toBeNull();
    expect(screen.queryByText(/distinct bouts? touched/)).toBeNull();
    expect(screen.getByRole("heading", { name: "Coverage to review" }).closest("section")!.textContent).toMatch(/Loading your plan…$/);
    expect(row(/^Brachioradialis, Surface\. Loading your plan…/)).not.toBeNull();
    expect(screen.queryAllByRole("button", { name: /No work for it|No exercise is mapped/ })).toEqual([]);
    const fills = new Set(Array.from(document.querySelectorAll<SVGPathElement>(".spz-diagram-belly")).map((path) => path.dataset.fill));
    expect(Array.from(fills)).toEqual(["none"]);
  });

  it("shows no target progress in the muscle sheet either, until the plan has loaded", async () => {
    saveSpecializationGoals([target({})], null);
    render(createElement(Harness, { initial: { mode: "planned", nodeId: "forearm.br" }, plan: { ready: false } }));
    await act(async () => { fireEvent.click(within(mapCard()).getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    expect(within(sheet).queryByText(/of your 20/)).toBeNull();
    const targets = within(sheet).getByRole("heading", { name: "Your target" }).closest("section")!;
    expect(targets.textContent).toMatch(/once your plan has loaded/);
  });
});

describe("planned beside logged, only for the week being trained (design §4)", () => {
  const week2 = commitDay(emptyDayStore(), slots[0].key, { workout: [byId(139)], prescriptions: {}, settings: {}, context: [] });
  // Plan is showing Week 2 (being edited); the last workout was from Week 1, so Week 1 is the one trained.
  const plan = { weeks: { 1: store, 2: week2 }, activeWeek: 2 };

  it("pairs this week's logged work with the week trained from, not the week Plan is showing", () => {
    render(createElement(Harness, { plan }));
    expect(windowLine()).toMatch(/planned in Plan Week\u00a01$/);
  });

  it("defaults planned mode to that week, and on another week says there is nothing logged to compare", async () => {
    render(createElement(Harness, { plan, initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Planned" })); });
    expect(screen.getByRole("button", { name: "Week 1" }).getAttribute("aria-pressed")).toBe("true");
    expect(windowLine()).toMatch(/logged this week$/);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Week 2" })); });
    expect(windowLine()).toMatch(/not the week you train from \(Week 1\), so there is no logged week to compare$/);
    expect(windowLine()).not.toMatch(/logged this week/);
    await act(async () => { fireEvent.click(row(/^Brachioradialis,/)); });
    expect(within(screen.getByRole("dialog", { name: "Brachioradialis" })).getByText("Plan Week 2 is not the week you train from (Week 1), so there is no logged week to compare.")).not.toBeNull();
    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });
    // Back in completed mode with Week 2 still in the address: the pair is still the week trained from.
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Completed" })); });
    expect(lastState?.planWeek).toBe(2);
    expect(windowLine()).toMatch(/planned in Plan Week\u00a01$/);
  });

  it("follows an explicit choice of week", () => {
    render(createElement(Harness, { plan: { ...plan, choice: { week: 2, index: 0, day: "Push", madeAt: "2026-10-16T08:00:00.000Z" } } }));
    expect(windowLine()).toMatch(/planned in Plan Week\u00a02$/);
  });
});

describe("target periods follow the clock while the page stays open", () => {
  it("re-reads a rolling 7-day target when the page is looked at again days later", async () => {
    vi.setSystemTime(new Date("2026-10-12T09:00:00.000Z"));
    // Last Tuesday's curls: inside the rolling week on Monday morning, outside it by Thursday.
    logged([{ ...sessions[0], id: "s-prev", startedAt: "2026-10-06T17:00:00.000Z", completedAt: "2026-10-06T18:00:00.000Z" }]);
    saveSpecializationGoals([target({ period: "rolling_7d" })], null);
    render(createElement(Harness));
    expect(screen.getByText("Brachioradialis: 3 of your 20")).not.toBeNull();
    vi.setSystemTime(new Date("2026-10-15T09:00:00.000Z"));
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(screen.queryByText("Brachioradialis: 3 of your 20")).toBeNull();
    expect(screen.getByText("Brachioradialis: 0 of your 20")).not.toBeNull();
  });
});
