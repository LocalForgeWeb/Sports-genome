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
import { NOW, goals, sessions, slots, store } from "./__fixtures__/forearmWeek";

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
 * run this file there with READ_PAGE_NUMBERS=<path> and without the region loader. The week and
 * the plan are __fixtures__/forearmWeek.ts.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

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
