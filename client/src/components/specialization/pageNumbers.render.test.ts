// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";

/**
 * The forearm page's numbers are the base's (docs/specialization-atlas/10-multi-region.md §9.1,
 * wave 0: "numbers unchanged"). The page is rendered on one week of forearm work that reaches
 * every kind of row (two-handed, one-arm, either-way with Both, one and no arm, holds, straps,
 * region-only work, a set matched by name, a warm-up, an unfinished workout) and on a plan, for
 * both arms, three windows and the plan week, and every number it shows is read off the screen:
 * each muscle row's value, the region's line, the window line, the findings, the exercises in
 * the window and each day's bar, the completeness counts, and two muscle sheets' numbers. The
 * words around the numbers changed with wave 0 (the region's own sentences); the numbers did not.
 *
 * The reference was read the same way off the page as it was at 8e746b4 (before lane 0d), by a
 * copy of this file run in that tree: __fixtures__/pageNumbers.8e746b4.json. To read it again,
 * run this file there with READ_PAGE_NUMBERS=<path> and without the region loader.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const NOW = "2026-10-16T12:00:00.000Z";
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const nameOf = (id: number) => byId(id).name;
const slots = buildDaySlots(["Upper", "Lower", "Upper", "Lower"]);
const store = { ...emptyDayStore(), plan: { [slots[0].key]: [byId(1), byId(45), byId(132)], [slots[1].key]: [byId(167)], [slots[2].key]: [byId(3), byId(139), byId(140)], [slots[3].key]: [byId(168)] } };
const set = (over: Record<string, unknown> = {}) => ({ weight: "30", reps: "12", unit: "lb", completed: true, ...over });
const hold = (seconds: number, over: Record<string, unknown> = {}) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "lb", completed: true, ...over });
const ex = (id: string, catalogId: number | null, sets: Record<string, unknown>[], over: Record<string, unknown> = {}) => ({ id, exerciseName: catalogId === null ? "Reverse Wrist Curl" : nameOf(catalogId), ...(catalogId === null ? {} : { catalogId }), plannedPrescription: `${sets.length} × 12`, sets, ...over });
const workout = (id: string, completedAt: string, exercisesDone: unknown[], over: Record<string, unknown> = {}) => ({ id, title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: new Date(Date.parse(completedAt) - 3_600_000).toISOString(), completedAt, status: "completed", exercises: exercisesDone, ...over });
const sessions = [
  workout("w-8", "2026-10-08T18:00:00.000Z", [ex("a1", 139, [set(), set(), set()]), ex("a2", 143, [hold(40), hold(35)])]),
  workout("w-13", "2026-10-13T18:00:00.000Z", [ex("b1", 132, [set(), set(), set({ reps: "10" })]), ex("b2", 139, [set({ weight: "60" }), set({ weight: "60" }), set({ weight: "60", warmup: true })])]),
  workout("w-14", "2026-10-14T18:00:00.000Z", [
    ex("c1", 350, [set({ side: "both" }), set({ side: "left" }), set()]),
    ex("c2", 410, [set({ side: "right" }), set({ side: "left" }), set()]),
    ex("c3", 145, [hold(45), hold(30)], { straps: "yes" }),
    ex("c4", 43, [set({ weight: "135" }), set({ weight: "135" })], { straps: "no" }),
    ex("c5", 46, [set({ side: "right" }), set()], { straps: "yes" }),
    ex("c6", 24, [set(), set({ side: "right" })]),
    ex("c7", 190, [set()]),
    ex("c8", null, [set(), set()]),
    ex("c9", 409, [hold(40, { side: "left" }), hold(40)]),
  ]),
  workout("w-15", "2026-10-15T18:00:00.000Z", [ex("d1", 140, [set(), set(), set()]), ex("d2", 135, [set()])]),
  { ...workout("w-16", "2026-10-16T10:00:00.000Z", [ex("e1", 411, [set(), set({ side: "right" })])]), status: "active", completedAt: undefined },
];
const goal = (id: string, over: Record<string, unknown>) => ({ id, regionId: "forearm", nodeId: null, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week", startsOn: "2026-01-01", endsOn: null, timezone: "UTC", createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T08:00:00.000Z", ...over });
const goals = (["left", "right"] as const).flatMap((side) => [
  goal(`br-${side}`, { side, nodeId: "forearm.br" }),
  goal(`fds-${side}`, { side, nodeId: "forearm.fds", metric: "deliberate_hold_seconds", target: 300 }),
  goal(`wrist-${side}`, { side, actionId: "wrist.flexion", target: 8 }),
  goal(`biceps-${side}`, { side, nodeId: "upper_arm.biceps", target: 5 }),
  goal(`anconeus-${side}`, { side, nodeId: "forearm.anconeus", target: 3 }),
]);

function Harness({ initial }: { initial: SpecializationViewState }) {
  const [state, setState] = useState(initial);
  return createElement(SpecializationPanel, {
    state,
    onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1 },
    catalog: exercises,
    equipmentProfile: defaultEquipmentProfile,
    accountId: null,
    goal: "Muscle growth",
    weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }),
    onInspectExercise: () => {},
    onOpenSession: () => {},
    backLabel: null,
    onBack: null,
  });
}

/** The numbers in a piece of text, in order: what the page counts, without the words around them. */
const numbers = (text: string | null | undefined) => (text ?? "").match(/\d+(?:\.\d+)?/g) ?? [];
const textOf = (selector: string) => document.querySelector(selector)?.textContent ?? null;

async function readPage(state: SpecializationViewState) {
  render(createElement(Harness, { initial: state }));
  await act(async () => {});
  const rows = Array.from(document.querySelectorAll(".spz-row")).map((row) => [row.querySelector(".spz-row-name")?.childNodes[0]?.textContent ?? "", row.querySelector(".spz-row-value")?.textContent ?? ""]);
  const findings = Array.from(document.querySelectorAll(".spz-finding strong")).map((item) => numbers(item.textContent));
  const exercisesShown = Array.from(document.querySelectorAll(".spz-exercise-list li")).map((item) => [item.querySelector("b")?.textContent ?? "", numbers(item.querySelector("small")?.textContent)]);
  const days = Array.from(document.querySelectorAll(".spz-days li b")).map((item) => item.textContent);
  const completeness = Array.from(document.querySelectorAll("#spz-method p")).map((item) => item.textContent ?? "").find((text) => /sets considered/.test(text));
  // Read with nothing selected, before a row is opened (opening one selects its muscle).
  const region = numbers(textOf(".spz-strip-line"));
  const windowLine = numbers(textOf(".spz-window"));
  const sheets: Record<string, string[][]> = {};
  for (const name of ["Brachioradialis", "Flexor digitorum superficialis"]) {
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}, `) })); });
    const sheet = screen.getByRole("dialog", { name });
    // Each count in the sheet's order; the labels are words (the incidental one is the ledger's category since wave 0).
    sheets[name] = Array.from(sheet.querySelectorAll(".spz-numbers div")).map((item) => numbers(item.querySelector("dd")?.textContent));
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /^Close/ })); });
  }
  const read = { rows, region, window: windowLine, findings, exercises: exercisesShown, days, completeness: numbers(completeness), sheets };
  cleanup();
  return read;
}

/** Every state the reference reads: both arms, this week, the rolling 7 days, a custom window and the plan week. */
const states: [string, Partial<SpecializationViewState>][] = (["left", "right"] as const).flatMap((limb) => [
  [`${limb}/week`, { limb }],
  [`${limb}/7d`, { limb, window: "7d" }],
  [`${limb}/custom`, { limb, window: "custom", from: "2026-10-05", to: "2026-10-16" }],
  [`${limb}/planned`, { limb, mode: "planned" }],
] as [string, Partial<SpecializationViewState>][]);

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  window.localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(goals));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("the forearm page shows the base's numbers", () => {
  const reference = JSON.parse(readFileSync(join(process.cwd(), "client/src/components/specialization/__fixtures__/pageNumbers.8e746b4.json"), "utf8")) as Record<string, unknown>;

  it("reads every state the reference read", () => {
    expect(Object.keys(reference).sort()).toEqual(states.map(([id]) => id).sort());
  });

  for (const [id, over] of states) {
    it(id, async () => {
      const read = await readPage({ ...defaultSpecializationState("forearm"), ...over });
      // The reading reaches the page's numbers at all: rows with work, and the completeness counts.
      expect(read.rows.length).toBeGreaterThan(20);
      expect(read.completeness.length).toBeGreaterThan(5);
      expect(read).toEqual(reference[id]);
    }, 30000);
  }
});
