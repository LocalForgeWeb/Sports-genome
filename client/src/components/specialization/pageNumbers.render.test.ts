// @vitest-environment jsdom
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, preloadStackModel } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { NOW, goals, sessions, slots, store } from "./__fixtures__/forearmWeek";

/**
 * The forearm page's numbers are main's (4dac1ae: both arms counted as one, owner 20 Oct 2026),
 * which are the athlete's current reality; wave 0 changes no number (docs/specialization-atlas/
 * 10-multi-region.md §9.1, "numbers unchanged"; appendix "Both sides as one"). The page is rendered
 * on one week of forearm work that reaches every kind of row (two-handed, one-arm, either-way with
 * Both, one and no arm, holds, straps, region-only work, a set matched by name, a warm-up, an
 * unfinished workout) and on a plan, both arms as one, for three windows and the plan week, and
 * every number it shows is read off the screen: each muscle row's value, the region's line, the
 * window line, the findings, the exercises in the window and each day's bar, the completeness
 * counts, and two muscle sheets' numbers.
 *
 * The reference was read the same way off main's page, at 4dac1ae, by a copy of this file run in
 * that tree: __fixtures__/pageNumbers.4dac1ae.json. (Wave 0 first held these numbers against
 * 3986178 per arm; the reconciliation of 21 Oct 2026 re-baselined them on main for both arms.) To
 * read it again, copy this file and __fixtures__/forearmWeek.ts into a tree at 4dac1ae and run it
 * there with READ_PAGE_NUMBERS=<path> and without the region loader (that tree has none). The week
 * and the plan are __fixtures__/forearmWeek.ts.
 *
 * The owner's cleanup of 26 Oct 2026 ("cut out unnecessary words") moves no number, only the words
 * around them, so the reference stands: the lines are found by what they are (the completeness line
 * by its "This window:"), and the two places the words were a row's value or a line's name are
 * stated moves (`withCleanup`).
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
  // Every finding, not only the first few the page shows at rest.
  const more = Array.from(document.querySelectorAll<HTMLElement>(".spz-page button")).find((button) => /^Show \d+ more$/.test(button.textContent ?? ""));
  if (more) await act(async () => { fireEvent.click(more); });
  const rows = Array.from(document.querySelectorAll(".spz-row")).map((row) => [row.querySelector(".spz-row-name")?.childNodes[0]?.textContent ?? "", row.querySelector(".spz-row-value")?.textContent ?? ""]);
  const findings = Array.from(document.querySelectorAll(".spz-finding strong")).map((item) => numbers(item.textContent));
  const exercisesShown = Array.from(document.querySelectorAll(".spz-exercise-list li")).map((item) => [item.querySelector("b")?.textContent ?? "", numbers(item.querySelector("small")?.textContent)]);
  const days = Array.from(document.querySelectorAll(".spz-days li b")).map((item) => item.textContent);
  // The completeness counts: "This window: 31 sets: 28 mapped, 0 under review, …" (main: "31 sets considered: 28 with a reviewed mapping, …"), in the same order.
  const completeness = Array.from(document.querySelectorAll("#spz-method p")).map((item) => item.textContent ?? "").find((text) => /^This window: \d+ sets: /.test(text));
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

/** Every state the reference reads, both arms as one: this week, the rolling 7 days, a custom window and the plan week. */
const states: [string, Partial<SpecializationViewState>][] = [
  ["week", {}],
  ["7d", { window: "7d" }],
  ["custom", { window: "custom", from: "2026-10-05", to: "2026-10-16" }],
  ["planned", { mode: "planned" }],
];

beforeAll(async () => { await loadRegionData("forearm"); await preloadStackModel(); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  window.localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(goals));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const out = process.env.READ_PAGE_NUMBERS;
describe.runIf(out)("reading the page's numbers", () => {
  it("writes them", async () => {
    const read: Record<string, unknown> = {};
    for (const [id, over] of states) read[id] = await readPage({ ...defaultSpecializationState("forearm"), ...over });
    writeFileSync(out!, `${JSON.stringify(read, null, 1)}\n`);
  }, 300000);
});

/**
 * The one place wave 0 moves a number main shows (09-page.md item 5; 10-multi-region.md §2.2): a
 * target saved earlier on a muscle that is not a target here (the fixture's anconeus target of 3
 * and biceps target of 5, which main reads "0 of your 3" and "0 of your 5") is no target behind. Its
 * finding leaves its place and is said last, as one to end or remove, with no number.
 */
const SAVED_EARLIER = [["0", "3"], ["0", "5"]];
function withWaveZero(reading: { findings: string[][] }) {
  const same = (one: string[], other: string[]) => JSON.stringify(one) === JSON.stringify(other);
  const kept = reading.findings.filter((finding) => !SAVED_EARLIER.some((saved) => same(saved, finding)));
  expect(reading.findings.length - kept.length, "both targets saved earlier are among main's findings").toBe(SAVED_EARLIER.length);
  return { ...reading, findings: [...kept, ...SAVED_EARLIER.map(() => [])] };
}

/**
 * What F1 moves (11-forearm-research-and-stack.md §3.2, §3.3; lane S4), in Planned mode only: the
 * window line says the plan week's direct moving sets where it said this week's logged bouts (the
 * logged week stays in the sets the line opens): 9, three sets each of Wrist Curl, Reverse Wrist Curl
 * and Hammer Curl, the plan's three exercises with direct moving work, each set counted once
 * (`directWorkCount`). And "Coverage to review" leads with the movements the plan week gives no direct
 * moving work, in Plan Week 1: 9 of the forearm's 12 moving movements (those three train wrist
 * flexion, wrist extension and elbow flexion).
 */
function withF1(id: string, reading: { window: string[]; findings: string[][] }) {
  if (id !== "planned") return reading;
  return { ...reading, window: [...reading.window.slice(0, -1), "9"], findings: [["9", "1"], ...reading.findings] };
}

/**
 * What wave A moves (10-multi-region.md §4.2, §2.2; §11 decision 11(b)), and nothing else:
 * - the biceps' and brachialis' rows are credited by the upper arm's version, which credits both on
 *   rows as contributing work (43 Barbell Bent-Over Row and 46 One-Arm Dumbbell Row in the logged
 *   week, four sets; 45 in the plan, three), where the forearm's own rows did not; their curl credit
 *   is as it was;
 * - the biceps' target saved earlier on this page is the upper arm's, read there through its
 *   version (re-homed on read), so its finding, said last with no number since wave 0, leaves
 *   this page.
 */
const WAVE_A_ROWS: Record<string, Record<string, [was: string, now: string]>> = {
  week: { Brachialis: ["4 direct", "4 direct · 4 other"], "Biceps brachii": ["4 other", "8 other"] },
  "7d": { Brachialis: ["4 direct", "4 direct · 4 other"], "Biceps brachii": ["4 other", "8 other"] },
  custom: { Brachialis: ["4 direct", "4 direct · 4 other"], "Biceps brachii": ["4 other", "8 other"] },
  planned: { Brachialis: ["3 direct", "3 direct · 3 other"], "Biceps brachii": ["3 other", "6 other"] },
};
function withWaveA(id: string, reading: { rows: string[][]; findings: string[][] }) {
  const rows = reading.rows.map(([name, value]) => {
    const moved = WAVE_A_ROWS[id][name];
    if (!moved) return [name, value];
    expect(value, `${id}: ${name} as main showed it`).toBe(moved[0]);
    return [name, moved[1]];
  });
  // The two targets saved earlier are said last with no number (withWaveZero); the biceps' is no longer here.
  expect(reading.findings.slice(-2)).toEqual([[], []]);
  return { ...reading, rows, findings: reading.findings.slice(0, -1) };
}

/**
 * What release F3 moves (11-forearm-research-and-stack.md §1.7; forearm_mappings_v2), and nothing
 * else; the moves are those golden.both.test.ts lists for the same kinds of set:
 * - the wrist flexors steady the wrist in the week's hangs and carries (v2's added stabilizer rows,
 *   incidental grip), and in the custom window's longer span the wrist extensors gain the same in
 *   two more of them;
 * - the thumb flexor's carries are reviewed as incidental grip, so its row says grip where it said
 *   no work, and its finding (a mapping under review, said with no number) leaves the list;
 * - in Planned mode, "Coverage to review" counts one more movement with no direct moving work in
 *   Plan Week 1: 420 makes the index and little finger extension a movement the forearm trains
 *   directly, and the plan has none of it.
 */
const F3_ROWS: Record<string, Record<string, [was: string, now: string]>> = {
  week: { "Flexor carpi radialis": ["8 direct", "8 direct · 4 grip"], "Flexor carpi ulnaris": ["8 direct", "8 direct · 4 grip"], "Flexor pollicis longus": ["No work", "2 grip"] },
  "7d": { "Flexor carpi radialis": ["8 direct", "8 direct · 4 grip"], "Flexor carpi ulnaris": ["8 direct", "8 direct · 4 grip"], "Flexor pollicis longus": ["No work", "2 grip"] },
  custom: {
    "Flexor carpi radialis": ["11 direct", "11 direct · 6 grip"], "Flexor carpi ulnaris": ["11 direct", "11 direct · 6 grip"], "Flexor pollicis longus": ["No work", "4 grip"],
    "Extensor carpi radialis longus": ["8 direct · 5 grip", "8 direct · 7 grip"], "Extensor carpi radialis brevis": ["8 direct · 5 grip", "8 direct · 7 grip"], "Extensor carpi ulnaris": ["8 direct · 5 grip", "8 direct · 7 grip"],
  },
  planned: {},
};
function withF3(id: string, reading: { rows: string[][]; findings: string[][] }) {
  const rows = reading.rows.map(([name, value]) => {
    const moved = F3_ROWS[id][name];
    if (!moved) return [name, value];
    expect(value, `${id}: ${name} under forearm_mappings_v1`).toBe(moved[0]);
    return [name, moved[1]];
  });
  for (const name of Object.keys(F3_ROWS[id])) expect(reading.rows.some(([row]) => row === name), `${id}: ${name} has a row`).toBe(true);
  if (id === "planned") {
    expect(reading.findings[0], "planned: the movements with no direct moving work").toEqual(["9", "1"]);
    return { ...reading, rows, findings: [["10", "1"], ...reading.findings.slice(1)] };
  }
  // The thumb flexor's finding (a mapping under review, no number) is the first finding with no number.
  const pending = reading.findings.findIndex((finding) => finding.length === 0);
  expect(pending, `${id}: the thumb flexor's pending-review finding`).toBeGreaterThanOrEqual(0);
  return { ...reading, rows, findings: reading.findings.filter((_, index) => index !== pending) };
}

/**
 * What the owner's cleanup of 26 Oct 2026 moves, and nothing else; no number changes:
 * - a muscle row with no reviewed mapping says "Not reviewed" where main said "Mapping not reviewed";
 * - "Same muscle, same workout" says one line per workout and pair of exercises, its muscles joined,
 *   where main said the same line once per muscle: ECRB, ECRL and ECU, each loaded directly by Cable
 *   Wrist Extension and Reverse Wrist Curl in Week 1 · Day 02 on 14 Oct, are one line with that
 *   line's numbers, said once.
 */
const SAME_WORKOUT = ["ECRB", "ECRL", "ECU"];
function withCleanup<T extends { rows: string[][] }>(id: string, reading: T): T {
  const rows = reading.rows.map(([name, value]) => [name, value === "Mapping not reviewed" ? "Not reviewed" : value]);
  const listed = (reading as T & { exercises: [string, string[]][] }).exercises;
  const merged = listed.filter(([name]) => SAME_WORKOUT.includes(name));
  if (id === "planned") {
    expect(merged, "planned: no workout to share").toEqual([]);
    return { ...reading, rows };
  }
  expect(merged.map(([name]) => name), `${id}: main's line per muscle`).toEqual(SAME_WORKOUT);
  expect(new Set(merged.map(([, numbers]) => JSON.stringify(numbers))).size, `${id}: one workout, the same numbers`).toBe(1);
  const at = listed.findIndex(([name]) => name === SAME_WORKOUT[0]);
  const exercises = listed.flatMap((item, index) => (index === at ? [[SAME_WORKOUT.join(", "), item[1]] as [string, string[]]] : SAME_WORKOUT.includes(item[0]) ? [] : [item]));
  return { ...reading, rows, exercises };
}

describe.skipIf(out)("the forearm page shows main's numbers (4dac1ae), both arms as one, apart from wave 0's, F1's, wave A's and F3's stated moves and the 26 Oct cleanup's words", () => {
  const reference = (out ? {} : JSON.parse(readFileSync(join(process.cwd(), "client/src/components/specialization/__fixtures__/pageNumbers.4dac1ae.json"), "utf8"))) as Record<string, { findings: string[][] }>;

  it("reads every state the reference read", () => {
    expect(Object.keys(reference).sort()).toEqual(states.map(([id]) => id).sort());
  });

  for (const [id, over] of states) {
    it(id, async () => {
      const read = await readPage({ ...defaultSpecializationState("forearm"), ...over });
      // The reading reaches the page's numbers at all: rows with work, and the completeness counts.
      expect(read.rows.length).toBeGreaterThan(20);
      expect(read.completeness.length).toBeGreaterThan(5);
      expect(read).toEqual(withCleanup(id, withF3(id, withWaveA(id, withF1(id, withWaveZero(reference[id] as { window: string[]; findings: string[][] })) as { rows: string[][]; window: string[]; findings: string[][] }))));
    }, 30000);
  }
});
