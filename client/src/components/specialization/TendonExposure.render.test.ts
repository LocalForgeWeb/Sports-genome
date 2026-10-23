// @vitest-environment jsdom
import React, { createElement, useRef, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { TENDON_LEDE, TENDON_NOT_ADDED, TENDON_PROMPT, aboutMeSentence, aboveEveryWeek, changeSentence, clearTendonWeekCounts, holdsSentence } from "./TendonExposure";
import { attachesAtWords } from "./AttachesAt";
import { ModelMusclePanel } from "./anatomy3d/ModelMusclePanel";
import { goals as fixtureGoals, NOW as FIXTURE_NOW, sessions as fixtureSessions, slots as fixtureSlots, store as fixtureStore } from "./__fixtures__/forearmWeek";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { applyPlanBatch } from "@/lib/specialization/planBatch";
import { loadRegionExtras } from "@/lib/specialization/regionExtras";
import { saveStackRecord } from "@/lib/specialization/stackStore";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationAreaReport, type SpecializationPlanBatch, type SpecializationPlanBatchResult, type SpecializationViewState } from "@/lib/specialization/viewState";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore, loadDay, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { tendonPlacesOf } from "@shared/specialization/tendonPlaces";
import { tendonAreaExtras } from "@shared/specialization/regions/forearm/tendonAreas";
import { forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import type { TendonBaselineWeek, TendonChange } from "@shared/specialization/tendonAreas";

/**
 * Tendon exposure on the forearm page (docs/specialization-atlas/11-forearm-research-and-stack.md §4.3–
 * §4.6, lane T3), rendered in the page as Home hands it its plan, with Home's batch apply stood in by the
 * same pure batch (`applyPlanBatch`) on a week this harness holds, so the section sees the plan change.
 *
 * Read here: the closed card's place and summary in both modes; the open section in §4.3's order; the
 * areas, groups, day columns (a day still to come is "–", the first day of a rolling window is marked
 * part) and the sets each opens; holds as text; what is kept apart; the change line in every state's
 * words, halves kept and no line where a group has no reviewed member; the prompt, gated on last week
 * being above every known week; "Planned in Week N" with −1 set, Move, Take out and their Undo, and
 * Swap; the stack's link; "Attaches at" on the muscle sheet and the 3D panel; and §4.4's never-list over
 * every string the section can render, with no exception. The deltoid fixture's render is
 * TendonExposure.deltoid.render.test.ts; "nothing fetched before first open" is
 * TendonExposure.lazy.render.test.ts.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
window.scrollTo = (() => {}) as typeof window.scrollTo;

const byId = (id: number) => exercises.find((item) => item.id === id)!;

// ---------------------------------------------------------------- the scenario with history (Thursday 22 Oct 2026)

/** Thursday: this week is 19–25 Oct, last week 12–18 Oct, the four before 14 Sep–11 Oct. */
const NOW = "2026-10-22T12:00:00.000Z";
const slots = buildDaySlots(splitDaysForFrequency(3));
/** Week 1: Reverse Wrist Curl (own "3 × 10–25") and Wrist Curl on Day 01, Hammer Curl ("1 × 10") on Day 02, Bench Press on Day 03. */
function weekOf(): WeeklyDayStore {
  let store = emptyDayStore();
  store = commitDay(store, slots[0].key, { workout: [byId(140), byId(139)], prescriptions: { 140: "3 × 10–25" }, settings: {}, context: [] });
  store = commitDay(store, slots[1].key, { workout: [byId(132)], prescriptions: { 132: "1 × 10" }, settings: {}, context: [] });
  store = commitDay(store, slots[2].key, { workout: [byId(1)], prescriptions: {}, settings: {}, context: [] });
  return store;
}
const set = (over: Record<string, unknown> = {}) => ({ weight: "30", reps: "12", unit: "lb", completed: true, ...over });
const ex = (id: string, catalogId: number, count: number, over: Record<string, unknown> = {}) => ({ id, exerciseName: byId(catalogId).name, catalogId, plannedPrescription: `${count} × 12`, sets: Array.from({ length: count }, () => set()), ...over });
const workout = (id: string, completedAt: string, done: unknown[]) => ({ id, title: "Push", dayLabel: "Week 1 · Day 01 · Push", startedAt: new Date(Date.parse(completedAt) - 3600_000).toISOString(), completedAt, status: "completed", exercises: done });
/** Reverse wrist curls at the outer elbow: 2, 2, 1 and 2 sets in the four weeks before, then 5 and a hammer curl last week (6). */
const history = [
  workout("w-sep16", "2026-09-16T18:00:00.000Z", [ex("a", 140, 2)]),
  workout("w-sep23", "2026-09-23T18:00:00.000Z", [ex("b", 140, 2)]),
  workout("w-sep30", "2026-09-30T18:00:00.000Z", [ex("c", 140, 1)]),
  workout("w-oct07", "2026-10-07T18:00:00.000Z", [ex("d", 140, 2)]),
  workout("w-oct14", "2026-10-14T18:00:00.000Z", [ex("e", 140, 5), ex("f", 132, 1)]),
  workout("w-oct20", "2026-10-20T18:00:00.000Z", [ex("g", 139, 3)]),
];

// ---------------------------------------------------------------- the harness: Home, with its batch apply

const batches: SpecializationPlanBatch[] = [];
const singleChanges: unknown[] = [];
let lastState: SpecializationViewState | null = null;

function Harness({ initial = {}, weeks = { 1: weekOf() }, planSlots = slots, aboutMeArea = null, goals = [] }: { initial?: Partial<SpecializationViewState>; weeks?: Record<number, WeeklyDayStore>; planSlots?: DaySlot[]; aboutMeArea?: SpecializationAreaReport | null; goals?: unknown[] }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...initial });
  const [plan, setPlan] = useState(weeks);
  const planRef = useRef(plan);
  planRef.current = plan;
  lastState = state;
  void goals;
  const onApplyPlanChanges = async (batch: SpecializationPlanBatch, options?: { onUndo?: () => void }): Promise<SpecializationPlanBatchResult> => {
    batches.push(batch);
    const store = planRef.current[batch.week];
    if (!store) return { ok: false, reason: `Week ${batch.week} is not built yet. Build it in Plan first.` };
    const outcome = applyPlanBatch(store, batch, { slots: planSlots, catalog: exercises });
    if (!outcome.ok) return { ok: false, reason: outcome.reason };
    setPlan((current) => ({ ...current, [batch.week]: outcome.store }));
    let undone = false;
    const undo = () => {
      if (undone) return;
      undone = true;
      setPlan((current) => ({ ...current, [batch.week]: [...outcome.days].reverse().reduce((week, day) => commitDay(week, day.slot.key, day.revert(loadDay(week, day.slot.key))), current[batch.week]) }));
      options?.onUndo?.();
    };
    return { ok: true, undo, message: outcome.message.title };
  };
  const props: SpecializationPanelProps = {
    state, onStateChange: setState,
    plan: { ready: true, slots: planSlots, weeks: plan, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Muscle growth", weightUnit: "lb", gymMinutes: 60,
    onApplyPlanChange: (change) => { singleChanges.push(change); return { ok: true, undo: () => {} }; }, onApplyPlanChanges, aboutMeArea,
    onInspectExercise: () => {}, onOpenSession: () => {}, backLabel: null, onBack: null,
  };
  return createElement(SpecializationPanel, props);
}

const section = () => document.getElementById("spz-tendon") as HTMLDetailsElement;
const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); await act(async () => {}); };
async function openSection() {
  await act(async () => { section().open = true; fireEvent(section(), new Event("toggle")); });
  await waitFor(() => expect(section().querySelector(".spz-tendon")).not.toBeNull(), { timeout: 10000 });
}
const areaButtons = () => Array.from(section().querySelectorAll<HTMLButtonElement>(".spz-tendon-area"));
/** A button's words with its no-break spaces read as spaces ("Inner elbow · 25" keeps its count with the last word). */
const words = (element: Element) => (element.textContent ?? "").replace(/\u00a0/g, " ");
const areaTexts = () => areaButtons().map(words);
const area = (name: string) => areaButtons().find((button) => words(button).startsWith(`${name} · `))!;
const changeLines = () => Array.from(section().querySelectorAll(".spz-tendon-changes li")).map((item) => item.textContent);
const entries = () => Array.from(section().querySelectorAll<HTMLElement>(".spz-tendon-entry"));
const entryNamed = (name: string) => entries().find((entry) => entry.querySelector("b")?.textContent === name);
const dialog = () => screen.getByRole("dialog");
const closeDialog = async () => click(within(dialog()).getByRole("button", { name: "Close" }));

/** Every string an element shows or names: its text and its accessible names, titles and placeholders. */
function stringsOf(root: Element): string[] {
  const out = [root.textContent ?? ""];
  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    for (const attribute of ["aria-label", "title", "alt", "placeholder"]) {
      const value = element.getAttribute(attribute);
      if (value) out.push(value);
    }
  }
  return out;
}
/** §4.4's never-list, read case-insensitively, and "%": no exception. */
const NEVER = ["risk", "safe", "unsafe", "danger", "injury", "injure", "tendonitis", "tendinitis", "tendinopathy", "overuse", "overload", "strain", "damage", "warning", "alert", "limit", "budget", "threshold", "zone", "spike", "red flag", "ACWR", "acute:chronic", "push through"];
const neverHits = (texts: readonly string[]) => texts.flatMap((text) => [...NEVER.filter((word) => text.toLowerCase().includes(word.toLowerCase())).map((word) => `${word}: ${text.slice(0, 160)}`), ...(text.includes("%") ? [`%: ${text.slice(0, 160)}`] : [])]);

function seed(sessions: unknown[], now: string) {
  vi.setSystemTime(new Date(now));
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
}

beforeAll(async () => { await loadRegionData("forearm"); await loadRegionExtras("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  window.localStorage.clear();
  clearSummaryCache();
  clearTendonWeekCounts();
  batches.length = 0;
  singleChanges.length = 0;
  lastState = null;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("the closed card", () => {
  it("sits after Exercises in this window and before Targets, closed, and says what it counts in both modes", async () => {
    seed(history, NOW);
    for (const [mode, line] of [["completed", "Sets by attachment area"], ["planned", "Sets by attachment area, Plan Week 1, as written"]] as const) {
      render(createElement(Harness, { initial: { mode } }));
      await act(async () => {});
      const summaries = Array.from(document.querySelectorAll(".spz-disclosures > details > summary b")).map((item) => item.textContent);
      expect(summaries.slice(0, 3)).toEqual(["Exercises in this window", "Tendon exposure", "Targets"]);
      expect(section().open).toBe(false);
      expect(section().querySelector(":scope > summary small")!.textContent).toBe(line);
      // Nothing of the section is on the page until it opens.
      expect(section().querySelector(".spz-tendon")).toBeNull();
      cleanup();
    }
  });
});

describe("the section, open, in §4.3's order", () => {
  it("reads the lede, the 2 × 2 areas with the window's count and the note once, then the chosen area", async () => {
    seed(history, NOW);
    render(createElement(Harness));
    await openSection();
    const body = section().querySelector(".spz-tendon")!;
    expect(body.querySelector(".spz-tendon-lede")!.textContent).toBe(TENDON_LEDE);
    expect(areaTexts()).toEqual(["Inner elbow · 3", "Outer elbow · 0", "Wrist and thumb · 3", "Fingers · 3"]);
    expect(areaButtons().map((button) => button.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"]);
    expect(Array.from(body.querySelectorAll("p")).filter((item) => item.textContent === TENDON_NOT_ADDED)).toHaveLength(1);
    // §4.3's order inside the chosen area: groups, days, the change.
    const order = ["spz-tendon-areas", "spz-tendon-groups", "spz-tendon-days", "spz-tendon-change", "spz-tendon-method"].map((name) => body.querySelector(`.${name}`)!);
    for (let index = 1; index < order.length; index += 1) expect(order[index - 1].compareDocumentPosition(order[index]) & Node.DOCUMENT_POSITION_FOLLOWING, order[index].className).toBeTruthy();
    // A quiet area says so in its own words, never "safe" or "rested".
    await click(area("Outer elbow"));
    expect(area("Outer elbow").getAttribute("aria-pressed")).toBe("true");
    expect(section().querySelector(".spz-tendon-quiet")!.textContent).toBe("No mapped sets in this area this week.");
  });

  it("lists the chosen area's groups as rows of at least one line each, with their kinds, and each opens its sets", async () => {
    seed(history, NOW);
    render(createElement(Harness));
    await openSection();
    const rows = Array.from(section().querySelectorAll(".spz-tendon-groups > li")).map((item) => item.textContent);
    expect(rows).toEqual(["Common flexor origin · 3 sets3 target · 0 holds · 0 other"]);
    await click(section().querySelector("button.spz-tendon-group")!);
    expect(dialog().querySelector("h2")!.textContent).toBe("Common flexor origin");
    expect(within(dialog()).getByRole("region", { name: "Target: 3 sets" })).not.toBeNull();
  });

  it("draws a column per day of the week, a day still to come as –, and a day with sets opens them by list", async () => {
    seed(history, NOW);
    render(createElement(Harness));
    await openSection();
    const days = Array.from(section().querySelectorAll(".spz-tendon-days > li"));
    expect(days).toHaveLength(7);
    expect(days.map((day) => day.querySelector("b")!.textContent)).toEqual(["0", "3", "0", "0", "–", "–", "–"]);
    expect(days[4].querySelector(".spz-day")!.getAttribute("aria-label")).toMatch(/: still to come$/);
    const tuesday = days[1].querySelector("button.spz-day")!;
    const long = new Date("2026-10-20T12:00:00Z").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    expect(tuesday.getAttribute("aria-label")).toBe(`${long}: 3 sets (3 target, 0 holds, 0 other). See these sets`);
    // The stacked bar: target only, three of twelve.
    expect((tuesday.querySelector(".spz-bar-direct") as HTMLElement).style.height).toBe("25%");
    await click(tuesday);
    expect(dialog().querySelector("h2")!.textContent).toBe(`Inner elbow · ${long}`);
    expect(within(dialog()).getAllByRole("region").map((part) => part.getAttribute("aria-label"))).toEqual(["Target: 3 sets"]);
  });

  it("marks the first day of a rolling window as part of a day, in eight columns", async () => {
    seed(history, NOW);
    render(createElement(Harness, { initial: { window: "7d" } }));
    await openSection();
    const days = Array.from(section().querySelectorAll(".spz-tendon-days > li"));
    expect(days).toHaveLength(8);
    expect(days[0].querySelector(".spz-tendon-partial")!.textContent).toBe("part");
    expect(days[0].querySelector(".spz-day")!.getAttribute("aria-label")).toMatch(/, part of the day: /);
    expect(days.slice(1).some((day) => day.querySelector(".spz-tendon-partial"))).toBe(false);
    expect(section().textContent).toContain("The column marked “part” is part of a day: the window starts at this time 7 days ago.");
  });

  it("says a window of more than 31 days in the page's own words", async () => {
    seed(history, NOW);
    render(createElement(Harness, { initial: { window: "custom", from: "2026-09-01", to: "2026-10-22" } }));
    await openSection();
    expect(section().textContent).toContain("Choose 31 days or fewer to see the work day by day.");
    expect(section().querySelector(".spz-tendon-days")).toBeNull();
  });

  it("in Planned mode shows the plan week per area only: no groups, days, change or warm-ups", async () => {
    seed(history, NOW);
    render(createElement(Harness, { initial: { mode: "planned" } }));
    await openSection();
    // Week 1 as written: Reverse Wrist Curl (3), Wrist Curl (3) and Hammer Curl (1); the grip of each counts at the finger flexors.
    expect(areaTexts()).toEqual(["Inner elbow · 7", "Outer elbow · 4", "Wrist and thumb · 7", "Fingers · 7"]);
    for (const part of [".spz-tendon-groups", ".spz-tendon-days", ".spz-tendon-change", ".spz-tendon-planned"]) expect(section().querySelector(part), part).toBeNull();
    expect(section().textContent).not.toContain("Warm-ups:");
  });
});

describe("the forearm week: holds, and what is kept apart", () => {
  it("says holds as text, keeps strapped, pending, region-only and warm-up sets apart, each opening its sets", async () => {
    seed(fixtureSessions, FIXTURE_NOW);
    render(createElement(Harness, { weeks: { 1: fixtureStore }, planSlots: fixtureSlots, goals: fixtureGoals }));
    await openSection();
    await click(area("Fingers"));
    expect(section().querySelector(".spz-tendon-holds")!.textContent).toMatch(/^Holds: \d+ sets, \d+ (min|s).* recorded/);
    const apart = Array.from(section().querySelectorAll(".spz-tendon-area-body .spz-tendon-apart button")).map((button) => button.textContent!.trim());
    expect(apart.some((text) => /^\d+ sets? done with straps$/.test(text ?? ""))).toBe(true);
    await click(Array.from(section().querySelectorAll(".spz-tendon-area-body .spz-tendon-apart button"))[0]);
    expect(dialog().querySelector("h2")!.textContent).toBe("Fingers · not counted here");
    await closeDialog();
    const sectionApart = section().querySelector(":scope .spz-tendon > .spz-tendon-apart")!;
    expect(sectionApart.textContent).toMatch(/\d+ sets? counts? for the forearms as a whole and (is|are) in no area\./);
    expect(sectionApart.textContent).toMatch(/Warm-ups: 1 set, kept out of the counts above\./);
    await click(within(sectionApart as HTMLElement).getByRole("button", { name: /See the warm-ups/ }));
    expect(dialog().querySelector("h2")!.textContent).toBe("Warm-ups");
    await closeDialog();
    // Last week has a finished workout and no earlier week does: the baseline is building.
    expect(section().querySelector(".spz-tendon-change")!.textContent).toContain("Building your baseline: 0 of the 3 earlier weeks needed have a finished workout.");
    // No comparison, so no prompt and no planned rows.
    expect(section().querySelector(".spz-tendon-prompt")).toBeNull();
    expect(section().querySelector(".spz-tendon-planned")).toBeNull();
  });
});

describe("the change line", () => {
  const week = (finishedWorkouts: number, value: number | null, holdsWithoutTime: number | null = 0): TendonBaselineWeek => ({ firstDay: "", lastDay: "", label: "", finishedWorkouts, known: value !== null, value, holdsWithoutTime: value === null ? null : holdsWithoutTime });
  const base = { lastHoldsWithoutTime: 0, knownWeeks: 4 };
  it("says each state in §4.4's words, halves kept, and nothing as a percentage", () => {
    const cases: [TendonChange, string, string][] = [
      [{ state: "no_workout_last_week" }, "sets", "No finished workout logged last week; nothing to compare."],
      [{ state: "building_baseline", last: 4, lastHoldsWithoutTime: 0, knownWeeks: 2, neededWeeks: 3, baseline: [week(1, 2), week(0, null), week(2, 1), week(0, null)] }, "sets", "Building your baseline: 2 of the 3 earlier weeks needed have a finished workout."],
      [{ state: "none", last: 0, median: 0, ...base, baseline: [week(4, 0), week(3, 0), week(1, 0), week(4, 0)] }, "sets", "None last week or in the 4 weeks before."],
      [{ state: "new", last: 3, median: 0, ...base, aboveEveryKnownWeek: true, baseline: [week(4, 0), week(3, 0), week(1, 0), week(4, 0)] }, "sets", "New: 3 sets last week; none in the 4 weeks before."],
      [{ state: "change", last: 25, median: 16, change: 9, ...base, aboveEveryKnownWeek: false, baseline: [week(4, 16), week(3, 18), week(1, 14), week(4, 12)] }, "sets", "Last week: 25 sets · median of the 4 weeks before: 16 (weeks with 4, 3, 1 and 4 finished workouts) · +9 sets."],
      [{ state: "change", last: 25, median: 16, change: 9, ...base, aboveEveryKnownWeek: true, baseline: [week(4, 16), week(3, 18), week(1, 14), week(4, 12)] }, "sets", "Last week: 25 sets · median of the 4 weeks before: 16 (weeks with 4, 3, 1 and 4 finished workouts) · +9 sets · more than in any of those weeks."],
      // A median of 0 beside a known week above 0 is a change, never "none in the 4 weeks before".
      [{ state: "change", last: 3, median: 0, change: 3, ...base, knownWeeks: 3, aboveEveryKnownWeek: false, baseline: [week(2, 0), week(2, 0), week(0, null), week(1, 5)] }, "sets", "Last week: 3 sets · median of the 4 weeks before: 0 (weeks with 2, 2 and 1 finished workouts) · +3 sets."],
      [{ state: "change", last: 2, median: 2.5, change: -0.5, ...base, aboveEveryKnownWeek: false, baseline: [week(1, 2), week(1, 3), week(1, 2), week(1, 3)] }, "target", "Last week: 2 target sets · median of the 4 weeks before: 2.5 (weeks with 1, 1, 1 and 1 finished workouts) · −0.5 target sets."],
      [{ state: "change", last: 4, median: 4, change: 0, ...base, aboveEveryKnownWeek: false, baseline: [week(1, 4), week(1, 4), week(1, 4), week(1, 4)] }, "other", "Last week: 4 other sets · median of the 4 weeks before: 4 (weeks with 1, 1, 1 and 1 finished workouts) · no change."],
      [{ state: "change", last: 190, median: 90, change: 100, ...base, aboveEveryKnownWeek: true, baseline: [week(1, 90), week(1, 80), week(1, 100), week(1, 90)] }, "holdSeconds", "Last week: 3 min 10 s of holds · median of the 4 weeks before: 1 min 30 s (weeks with 1, 1, 1 and 1 finished workouts) · +1 min 40 s · more than in any of those weeks."],
      [{ state: "some_untimed", last: 120, ...base, lastHoldsWithoutTime: 1, baseline: [week(1, 40), week(0, null), week(1, 30, 1), week(1, 0)] }, "holdSeconds", "Hold time is not compared, because some holds in these weeks have no time recorded. Last week: 2 min recorded, 1 hold with no time recorded. The 4 weeks before: 40 s · no finished workout · 30 s and 1 hold with no time · 0 s."],
    ];
    for (const [change, metric, words] of cases) {
      expect(changeSentence(metric as never, change, true), `${change.state} ${metric}`).toBe(words);
      expect(neverHits([words])).toEqual([]);
    }
    // The prompt's gate is last week above every known week, never "new" alone or a change at or below one.
    expect(cases.map(([change]) => aboveEveryWeek(change))).toEqual([false, false, false, true, false, true, false, false, false, true, false]);
  });

  it("says holds as text, never stacked on the counts, a hold with no time never as 0 s", () => {
    expect(holdsSentence({ sets: 7, seconds: 190, withTime: 6, withoutTime: 1 }, false)).toBe("Holds: 7 sets, 3 min 10 s recorded; 1 with no time recorded.");
    expect(holdsSentence({ sets: 2, seconds: 0, withTime: 0, withoutTime: 2 }, false)).toBe("Holds: 2 sets, no time recorded.");
    expect(holdsSentence({ sets: 3, seconds: 90, withTime: 3, withoutTime: 0 }, true)).toBe("Holds: 3 sets, 1 min 30 s planned.");
    expect(holdsSentence({ sets: 0, seconds: 0, withTime: 0, withoutTime: 0 }, false)).toBeNull();
  });

  it("puts last week beside the 4 weeks before, and above every one of them offers the sets and the plan week in place", async () => {
    seed(history, NOW);
    render(createElement(Harness));
    await openSection();
    await click(area("Outer elbow"));
    expect(section().querySelector(".spz-tendon-change h4")!.textContent).toBe("Last week (12–18 Oct) beside the 4 weeks before");
    expect(changeLines()).toEqual([
      "Last week: 6 sets · median of the 4 weeks before: 2 (weeks with 1, 1, 1 and 1 finished workouts) · +4 sets · more than in any of those weeks.",
      "Last week: 6 target sets · median of the 4 weeks before: 2 · +4 target sets · more than in any of those weeks.",
    ]);
    const prompt = section().querySelector(".spz-tendon-prompt")!;
    expect(prompt.querySelector("p")!.textContent).toBe(TENDON_PROMPT);
    await click(within(prompt as HTMLElement).getByRole("button", { name: /See these sets/ }));
    expect(dialog().querySelector("h2")!.textContent).toBe("Outer elbow · last week");
    expect(within(dialog()).getByRole("region", { name: "Target: 6 sets" })).not.toBeNull();
    await closeDialog();
    expect(section().querySelector(".spz-tendon-planned h4")!.textContent).toBe("Planned in Week 1 at the outer elbow");
    expect(entries().map((entry) => entry.querySelector("p")!.textContent)).toEqual(["Reverse Wrist CurlDay 01 · 3 × 10–25 · 3 sets counted here", "Hammer CurlDay 02 · 1 × 10 · 1 set counted here"]);
  });
});

describe("the planned entries, changed in place with Undo", () => {
  async function atOuterElbow(over: Parameters<typeof Harness>[0] = {}) {
    seed(history, NOW);
    render(createElement(Harness, over));
    await openSection();
    await click(area("Outer elbow"));
  }
  const done = () => section().querySelector(".spz-tendon-done");
  const press = async (entry: string, label: string) => click(within(entryNamed(entry)!).getByRole("button", { name: label }));

  it("−1 set acts at once, says so with Undo, and Undo puts the set count as it was", async () => {
    await atOuterElbow();
    await press("Reverse Wrist Curl", "−1 set");
    expect(batches).toEqual([{ week: 1, changes: [{ kind: "sets", dayKey: slots[0].key, entryId: 140, catalogExerciseId: 140, sets: 2, prescription: "3 × 10–25" }] }]);
    expect(done()!.textContent).toBe("Reverse Wrist Curl on Day 01 of Week 1: 3 → 2 setsUndo");
    expect(entryNamed("Reverse Wrist Curl")!.querySelector("small")!.textContent).toBe("Day 01 · 2 × 10–25 · 2 sets counted here");
    await click(within(done() as HTMLElement).getByRole("button", { name: "Undo" }));
    expect(done()!.textContent).toBe("Undone: Plan Week 1 is as it was.");
    expect(entryNamed("Reverse Wrist Curl")!.querySelector("small")!.textContent).toBe("Day 01 · 3 × 10–25 · 3 sets counted here");
  });

  it("−1 set on a one-set entry says why in place and sends nothing; the button stays visible at full contrast", async () => {
    await atOuterElbow();
    const button = within(entryNamed("Hammer Curl")!).getByRole("button", { name: "−1 set" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    await click(button);
    expect(batches).toEqual([]);
    expect(entryNamed("Hammer Curl")!.querySelector(".spz-tendon-reason")!.textContent).toBe("1 set is the fewest for Hammer Curl; use Take out instead.");
  });

  it("Move to another day shows the other days in place, moves on a pick, and Undo moves it back", async () => {
    await atOuterElbow();
    await press("Reverse Wrist Curl", "Move to another day");
    const chips = within(entryNamed("Reverse Wrist Curl")!).getByRole("group", { name: "Move Reverse Wrist Curl to" });
    expect(within(chips).getAllByRole("button").map((chip) => chip.textContent)).toEqual(["Day 02Pull", "Day 03Legs"]);
    await click(within(chips).getByRole("button", { name: "Day 03Legs" }));
    expect(batches[0].changes).toEqual([{ kind: "move", dayKey: slots[0].key, entryId: 140, catalogExerciseId: 140, toDayKey: slots[2].key }]);
    expect(done()!.textContent).toBe("Reverse Wrist Curl moved from Day 01 to Day 03 of Week 1Undo");
    expect(entryNamed("Reverse Wrist Curl")!.querySelector("small")!.textContent).toMatch(/^Day 03 · 3 × 10–25/);
    await click(within(done() as HTMLElement).getByRole("button", { name: "Undo" }));
    expect(entryNamed("Reverse Wrist Curl")!.querySelector("small")!.textContent).toMatch(/^Day 01 · 3 × 10–25/);
  });

  it("Take out acts at once with no confirm, and Undo puts it back where it was", async () => {
    const confirm = vi.spyOn(window, "confirm");
    await atOuterElbow();
    await press("Reverse Wrist Curl", "Take out");
    expect(confirm).not.toHaveBeenCalled();
    expect(batches[0].changes).toEqual([{ kind: "remove", dayKey: slots[0].key, entryId: 140, catalogExerciseId: 140, prescription: "3 × 10–25" }]);
    expect(done()!.textContent).toBe("Reverse Wrist Curl taken out of Day 01 of Week 1Undo");
    expect(entryNamed("Reverse Wrist Curl")).toBeUndefined();
    await click(within(done() as HTMLElement).getByRole("button", { name: "Undo" }));
    expect(entryNamed("Reverse Wrist Curl")!.querySelector("small")!.textContent).toMatch(/^Day 01 · 3 × 10–25/);
  });

  it("Swap opens the add sheet in swap mode on that entry, and saves through the page's single change", async () => {
    await atOuterElbow();
    await press("Reverse Wrist Curl", "Swap");
    expect(dialog().querySelector("h2")!.textContent).toBe("Swap into your plan");
    expect(dialog().querySelector(".spz-change-where")!.textContent).toBe("Week 1 · Day 01 · Push · In place of Reverse Wrist Curl");
    await click(within(dialog()).getByRole("button", { name: "Save swap" }));
    expect(singleChanges).toHaveLength(1);
    expect(singleChanges[0]).toMatchObject({ week: 1, dayKey: slots[0].key, replaceEntryId: 140 });
  });

  it("an entry the stack wrote links to the stack card", async () => {
    expect(saveStackRecord({ id: "stack-1", regionId: "forearm", planWeek: 1, mappingVersion: "forearm_mappings_v1", total: 4, createdAt: "2026-10-20T08:00:00.000Z", settings: { days: null, perDay: 2, holds: null }, entries: [{ dayKey: slots[0].key, catalogExerciseId: 140, prescription: "3 × 10–25" }] }).ok).toBe(true);
    await atOuterElbow();
    expect(within(entryNamed("Hammer Curl")!).queryByRole("button", { name: /Added by your stack/ })).toBeNull();
    await click(within(entryNamed("Reverse Wrist Curl")!).getByRole("button", { name: /Added by your stack: see it there/ }));
    expect((document.querySelector("details.spz-stack") as HTMLDetailsElement).open).toBe(true);
  });
});

describe("Attaches at", () => {
  it("is said from the reviewed memberships, by area with its groups", () => {
    expect(attachesAtWords(tendonPlacesOf(tendonAreaExtras, m.flexorCarpiRadialis))).toBe("inner elbow (common flexor origin), wrist and thumb (front of the wrist)");
    expect(attachesAtWords(tendonPlacesOf(tendonAreaExtras, m.brachioradialis))).toBe("outer elbow (ridge above the outer elbow), wrist and thumb (radial styloid)");
  });

  it("on the muscle sheet: one line, and See tendon exposure opens the section on that area", async () => {
    seed(history, NOW);
    render(createElement(Harness));
    await act(async () => {});
    await click(Array.from(document.querySelectorAll<HTMLElement>(".spz-row")).find((row) => /^Extensor carpi radialis brevis, /.test(row.getAttribute("aria-label") ?? ""))!);
    const line = await waitFor(() => { const found = dialog().querySelector(".spz-attaches"); expect(found).not.toBeNull(); return found!; });
    expect(line.querySelector("p")!.textContent).toBe("Attaches at: outer elbow (common extensor origin), wrist and thumb (back of the wrist).");
    await click(within(line as HTMLElement).getByRole("button", { name: /See tendon exposure/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(section().open).toBe(true);
    await waitFor(() => expect(section().querySelector(".spz-tendon")).not.toBeNull(), { timeout: 10000 });
    await waitFor(() => expect(area("Outer elbow").getAttribute("aria-pressed")).toBe("true"));
  });

  it("on the 3D model's panel: the same line under the muscle's lead number, opening the section", async () => {
    const onOpen = vi.fn();
    render(createElement(ModelMusclePanel, {
      data: { nodeId: m.flexorCarpiRadialis, name: "Flexor carpi radialis", shortName: "FCR", layerLabel: "Surface", inModel: true, physicalFunction: { text: "Bends the wrist.", reviewed: true }, visibleShapeContribution: { text: "", reviewed: true, caveats: [] }, dataStatus: "ready", dataNote: null, exercises: [], metrics: [], targets: [], targetSets: null, direct: { bouts: 0, reps: 0 } } as never,
      mode: "completed", windowLabel: "This week", regionLine: "", bothSides: null, countedTogether: "", onViewContributions: () => {}, onAddExercise: () => {}, onViewExercise: () => {}, onOpenMethod: () => {}, onSeeRegionSets: null,
      attachesAt: { places: tendonPlacesOf(tendonAreaExtras, m.flexorCarpiRadialis), onOpen },
      credits: null,
    }));
    const line = document.querySelector(".spz-attaches")!;
    expect(line.previousElementSibling!.classList.contains("sg-anatomy3d-lead")).toBe(true);
    expect(line.querySelector("p")!.textContent).toBe("Attaches at: inner elbow (common flexor origin), wrist and thumb (front of the wrist).");
    fireEvent.click(within(line as HTMLElement).getByRole("button", { name: /See tendon exposure/ }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("§4.4's never-list", () => {
  it("is in no string the section can render, sheets and states included, with no exception", async () => {
    const seen: string[] = [];
    // About me's every answer but "Feels fine", in the section's words.
    for (const constraintType of ["symptomatic", "recent_or_returning", "prior_recurrent", "clinician_restricted", "unsure"]) {
      const said = aboutMeSentence({ constraintType: constraintType as never, answer: "" }, "forearms");
      expect(said, constraintType).toMatch(/^You told the app .+ \(About me\)\. These counts are not a diagnosis\.$/);
      seen.push(said!);
    }
    const readEverything = async () => {
      const body = section().querySelector(".spz-tendon")!;
      (section().querySelector("#spz-tendon-method") as HTMLDetailsElement).open = true;
      for (let index = 0; index < areaButtons().length; index += 1) {
        await click(areaButtons()[index]);
        seen.push(...stringsOf(section()));
        const openers = Array.from(body.querySelectorAll<HTMLElement>("button.spz-tendon-group, button.spz-day, .spz-tendon-apart button, .spz-tendon-prompt > button"));
        for (let opener = 0; opener < openers.length; opener += 1) {
          const target = Array.from(body.querySelectorAll<HTMLElement>("button.spz-tendon-group, button.spz-day, .spz-tendon-apart button, .spz-tendon-prompt > button"))[opener];
          if (!target) continue;
          await click(target);
          seen.push(...stringsOf(dialog()));
          await closeDialog();
        }
      }
    };
    // The forearm week in every window and both modes, with About me's answer.
    for (const initial of [{}, { window: "7d" as const }, { window: "custom" as const, from: "2026-10-05", to: "2026-10-16" }, { mode: "planned" as const }]) {
      seed(fixtureSessions, FIXTURE_NOW);
      render(createElement(Harness, { initial, weeks: { 1: fixtureStore }, planSlots: fixtureSlots, aboutMeArea: { constraintType: "symptomatic", answer: "Bothering me now" } }));
      await openSection();
      await readEverything();
      cleanup();
    }
    // The history: the prompt, the planned rows, each action's words, a refusal, Undo, and the swap sheet.
    seed(history, NOW);
    render(createElement(Harness));
    await openSection();
    await readEverything();
    await click(area("Outer elbow"));
    await click(within(entryNamed("Hammer Curl")!).getByRole("button", { name: "−1 set" }));
    await click(within(entryNamed("Reverse Wrist Curl")!).getByRole("button", { name: "Move to another day" }));
    seen.push(...stringsOf(section()));
    await click(within(entryNamed("Reverse Wrist Curl")!).getByRole("button", { name: "Day 02Pull" }));
    seen.push(...stringsOf(section()));
    await click(within(section().querySelector(".spz-tendon-done") as HTMLElement).getByRole("button", { name: "Undo" }));
    seen.push(...stringsOf(section()));
    await click(within(entryNamed("Reverse Wrist Curl")!).getByRole("button", { name: "Swap" }));
    seen.push(...stringsOf(dialog()));
    await closeDialog();
    // The live region's words for the section too.
    seen.push(document.querySelector(".spz-page > [aria-live='polite']")!.textContent ?? "");
    expect(seen.length).toBeGreaterThan(50);
    expect(neverHits(seen)).toEqual([]);
  }, 120000);
});

void lastState;
