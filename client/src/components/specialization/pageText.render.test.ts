// @vitest-environment jsdom
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { currentExposureRule } from "@shared/specialization/rules";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { NOW, goals, sessions, slots, store } from "./__fixtures__/forearmWeek";

/**
 * The forearm page says what it said when it shipped (3986178), apart from the changes wave 0
 * states (docs/specialization-atlas/09-page.md, "What wave 0 changes on the forearm page";
 * 10-multi-region.md §9.1 and §11 decision 11(a)). The week of __fixtures__/forearmWeek.ts is
 * rendered for both arms, three windows and the plan week; the page is read with every disclosure
 * open and every finding shown, and so are five muscles' sheets with their ledgers open (one target
 * muscle with two-handed, one-arm and no-arm rows; one with holds and strapped sets; the adjacent
 * anconeus and the external biceps, each with a target on one arm and none on the other; the
 * external brachialis, with none), the sets behind every total (the region's, the window line's
 * pair, each exercise's, each day's, those with no arm recorded, those for the forearms only, those
 * not counted here), and the wrist flexion movement.
 *
 * Each of those readings is a list of lines in the order the page shows them, kept apart per state
 * and per sheet, and compared in order with the same reading taken at 3986178
 * (__fixtures__/pageText.3986178.json) once the stated changes are applied to it: a line rewritten
 * (`stated`), runs of lines gone (`gone`) or new (`added`), each in the sheets it names. Anything
 * else that is new, gone or moved, in any sheet, fails, and every stated change must still be one
 * the page makes. The drawing's own labels (data) and the live region's announcements are not read.
 *
 * To read the reference again: copy this file and __fixtures__/forearmWeek.ts into a tree at
 * 3986178, leave out the region loader (that tree has none) and the rule import (the stated changes
 * are not read there), and run it with READ_PAGE_TEXT=<path>.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
window.scrollTo = (() => {}) as typeof window.scrollTo;

function Harness({ initial }: { initial: SpecializationViewState }) {
  const [state, setState] = useState(initial);
  return createElement(SpecializationPanel, {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Muscle growth", weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onInspectExercise: () => {}, onOpenSession: () => {},
    backLabel: null, onBack: null,
  });
}

const BLOCK = new Set(["P", "LI", "H1", "H2", "H3", "H4", "DT", "DD", "SUMMARY", "BUTTON", "LABEL", "LEGEND", "OPTION", "DIV", "SECTION", "HEADER", "UL", "OL", "DL", "DETAILS", "FORM", "FIELDSET", "SELECT", "TABLE", "TR", "TD", "TH", "SMALL", "STRONG"]);
/** Each run of text between block boundaries, and each accessible name, under `root`, in order; not the drawing, not the live region. */
function linesOf(root: Element): string[] {
  const out: string[] = [];
  let run = "";
  const flush = () => { const text = run.replace(/\s+/g, " ").trim(); if (text) out.push(text); run = ""; };
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { run += node.textContent ?? ""; return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (element.tagName.toLowerCase() === "svg" || element.hasAttribute("aria-live")) return;
    const block = BLOCK.has(element.tagName);
    if (block) flush();
    const name = element.getAttribute("aria-label");
    if (name) out.push(`[name] ${name.replace(/\s+/g, " ").trim()}`);
    element.childNodes.forEach(walk);
    if (block) flush();
  };
  walk(root);
  flush();
  return out;
}

/** One state's reading: each part's lines, in the page's order. "page" is the page itself; every other key is a sheet. */
type Reading = Record<string, string[]>;

const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); await act(async () => {}); };
const openAll = async (root: ParentNode) => {
  for (const details of Array.from(root.querySelectorAll("details"))) await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
  await act(async () => {});
};
const dialog = () => screen.getByRole("dialog");
async function readSheet(key: string, open: Element | null | undefined, into: Reading) {
  if (!open) return;
  await click(open);
  await openAll(dialog());
  into[key] = linesOf(dialog());
  await click(within(dialog()).getAllByRole("button").find((button) => /^Close/.test(button.getAttribute("aria-label") ?? button.textContent ?? ""))!);
}
const pageButton = (name: RegExp) => Array.from(document.querySelectorAll<HTMLElement>(".spz-page button")).find((button) => name.test(button.textContent ?? "") || name.test(button.getAttribute("aria-label") ?? ""));

async function readPage(state: SpecializationViewState): Promise<Reading> {
  render(createElement(Harness, { initial: state }));
  await act(async () => {});
  const seen: Reading = {};
  const more = pageButton(/^Show \d+ more$/);
  if (more) await click(more);
  await openAll(document.querySelector(".spz-page")!);
  seen.page = linesOf(document.querySelector(".spz-page")!);
  // The sets behind each total, before a muscle is selected: the region's, the pair's, each exercise's and each day's.
  await readSheet("sets: the region's", pageButton(/^See these sets\s*$/), seen);
  await readSheet("sets: logged and planned", document.querySelector(".spz-window-open"), seen);
  const all = (selector: string) => Array.from(document.querySelectorAll(selector));
  const exerciseLinks = ".spz-exercise-list .spz-link-box[aria-label^='The sets of']";
  for (let index = 0; index < all(exerciseLinks).length; index += 1) await readSheet(`sets: exercise ${index + 1}`, all(exerciseLinks)[index], seen);
  for (let index = 0; index < all("button.spz-day").length; index += 1) await readSheet(`sets: day ${index + 1}`, all("button.spz-day")[index], seen);
  for (const name of ["Brachioradialis", "Flexor digitorum superficialis", "Anconeus", "Biceps brachii", "Brachialis"]) await readSheet(`muscle: ${name}`, pageButton(new RegExp(`^${name}, `)), seen);
  await readSheet("sets: with no arm recorded", pageButton(/^See the \d+ sets? with no arm recorded/), seen);
  await readSheet("sets: for the forearms only", pageButton(/^See the \d+ sets? for the forearms only/), seen);
  await readSheet("sets: not counted here", pageButton(/^See (this set|these sets) and why/), seen);
  await readSheet("movement: Wrist flexion", pageButton(/^Open Wrist flexion$/), seen);
  cleanup();
  return seen;
}

/** The targets of the fixture but those saved earlier on the biceps and the anconeus: each muscle that is not a target here then has none. */
const onTargetMusclesOnly = goals.filter((goal) => goal.nodeId !== "upper_arm.biceps" && goal.nodeId !== "forearm.anconeus");

/** Both arms, this week, the rolling 7 days, a custom window and the plan week; and this week with no target saved earlier on a muscle that is not a target here. */
const states: [string, Partial<SpecializationViewState>, unknown[]][] = [
  ["left/week", { limb: "left" }, goals],
  ["right/week", { limb: "right" }, goals],
  ["right/7d", { limb: "right", window: "7d" }, goals],
  ["left/custom", { limb: "left", window: "custom", from: "2026-10-05", to: "2026-10-16" }, goals],
  ["right/planned", { limb: "right", mode: "planned" }, goals],
  ["right/week, targets on target muscles only", { limb: "right" }, onTargetMusclesOnly],
];

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

async function readAll(): Promise<Record<string, Reading>> {
  const read: Record<string, Reading> = {};
  for (const [id, over, saved] of states) {
    window.localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(saved));
    clearSummaryCache();
    read[id] = await readPage({ ...defaultSpecializationState("forearm"), ...over });
  }
  return read;
}

const out = process.env.READ_PAGE_TEXT;
describe.runIf(out)("reading the page's text", () => {
  it("writes it", async () => {
    writeFileSync(out!, `${JSON.stringify(await readAll(), null, 1)}\n`);
  }, 300000);
});

// ---------------------------------------------------------------- what wave 0 changes, each where it is stated

/** A sheet of the reading, by its key ("page" for the page itself). */
type Where = RegExp;
const ANYWHERE: Where = /./;
const MUSCLES_NOT_TARGETS: Where = /^muscle: (Anconeus|Biceps brachii|Brachialis)$/;

/** A line of the reference rewritten wherever it is: `was` → `now`. */
const stated: { why: string; was: RegExp; now: string }[] = [
  { why: "09 item 1; §9.1, §11 decision 11(a): sentences read 'your right forearm' (the region's onSide)", was: /\b(touched|is planned for|are planned for) the forearms on the (left|right) arm\b/, now: "$1 your $2 forearm" },
  { why: "09 item 1; §9.1: the same, for the sets behind a total", was: /\bloaded a muscle of the forearms on the (left|right) arm\b/, now: "touched your $1 forearm" },
  { why: "09 item 1; §9.1: the same, planned", was: /\bplanned for a muscle of the forearms on the (left|right) arm\b/, now: "planned for your $1 forearm" },
  { why: "09 item 1; §9.1: the window pair's logged list", was: /^(\[name\] )?Logged on the (left|right) arm: /, now: "$1Logged for your $2 forearm: " },
  { why: "09 item 1; §9.1: the region's sets, headed by its side", was: /^(\[name\] )?On the (left|right) arm$/, now: "$1Your $2 forearm" },
  { why: "09 item 4; §4.3: the strapped finding's words come from the published rule and the calculator's note", was: /^(\d+ strapped sets?) earned no grip credit$/, now: "$1: grip not counted" },
  { why: "09 item 4; §4.3: the strapped finding's detail is the published rule's straps clause", was: /^Straps hold the bar for the hand, so the finger flexors are not credited for those sets\. The rest of each set still counts\.$/, now: `${currentExposureRule.specification.straps} The rest of each set still counts.` },
  // The anconeus's target of 3 is the fixture's only one of 3; the biceps' target of 5 is counted, and its row keeps "0 of your 5".
  { why: "09 item 5; §2.2: a target on a muscle nothing can be counted for (the anconeus: no mapping) says so, never a zero", was: /^3 per calendar week · 0 of your 3$/, now: "3 per calendar week · cannot be counted yet" },
];
/** Runs of the reference's lines, one after another, gone from the sheets `in` names. */
const gone: { why: string; in: Where; lines: RegExp[] }[] = [
  { why: "09 item 5; §2.2: a target saved earlier on a muscle that is not a target here is no target behind, with exercises for it", in: /^page$/, lines: [/^(Biceps brachii|Anconeus): 0 of your \d+$/, /^Direct dynamic bouts, (left|right) arm, .+\. The target is yours, not a prescription\.$/, /^See exercises for it$/] },
  { why: "09 item 2; §2.2, §9.1: a target saved earlier on a muscle that is not a target here can be ended or removed, not changed", in: ANYWHERE, lines: [/^\[name\] Change the (left|right)-arm target of .+ for (Anconeus|Biceps brachii|Brachialis)$/, /^Change$/] },
  { why: "09 item 2: no target is offered on a muscle that is not a target here", in: MUSCLES_NOT_TARGETS, lines: [/^Set a target$/] },
  { why: "09 item 2: nor is it said to be untargeted, as if it could take one", in: MUSCLES_NOT_TARGETS, lines: [/^Not targeted\. Nothing here is behind: a muscle without a target has no gap to show\.$/] },
  { why: "09 item 2: nor untargeted on this arm, as if this arm could take one", in: MUSCLES_NOT_TARGETS, lines: [/^Not targeted on the (left|right) arm\. Only the other arm has a target for this muscle\.$/] },
];
/** Runs of lines new in the sheets `in` names (each run may stand anywhere in them). */
const added: { why: string; in: Where; lines: RegExp[] }[] = [
  // First: its middle line is the note the next rule takes out anywhere else.
  { why: "09 item 5; §2.2: a target saved earlier on a muscle that is not a target here is said last, as one to end or remove", in: /^page$/, lines: [/^(Biceps brachii|Anconeus): a target saved earlier$/, /^Targets are for this region's target muscles\. You can end or remove this one\.$/, /^End or remove it$/] },
  { why: "09 item 2; §2.2: said beside such a target", in: ANYWHERE, lines: [/^Targets are for this region's target muscles\. You can end or remove this one\.$/] },
  { why: "09 item 2; §2.2: said on such a muscle with no target", in: /^muscle: Anconeus$/, lines: [/^Targets are for this region's target muscles, and this one is not one of them\.$/] },
  { why: "09 item 2; §2.2, §6.2: an external muscle's sheet says where its targets are set", in: /^muscle: (Biceps brachii|Brachialis)$/, lines: [/^Targets for this muscle are set on the upper arm page, which is not available yet\.$/] },
  { why: "09 item 3; §8: the plain statement about automated review, under How this is counted", in: /^page$/, lines: [/^“Reviewed” means an automated agent checked each sentence/] },
  { why: "09 item 6; §8: How this is counted names the sets of exercises the forearm leaves unmapped, and opens them", in: /^page$/, lines: [/^\d+ sets? of exercises left unmapped here (is|are) not counted, each for the reason given with it\.$/, /^See (this set|these sets) and why$/] },
];
/** Sheets new with wave 0. */
const addedSheets: { why: string; key: RegExp }[] = [
  { why: "09 item 6; §8: the sets not counted here, each with its reason", key: /^sets: not counted here$/ },
];

/** `lines` without each run of `runs` that stands in it, the runs found in order; `used` collects the rules that matched. */
function withoutRuns(lines: string[], rules: { why: string; lines: RegExp[] }[], used: Set<string>): string[] {
  const result = [...lines];
  for (const rule of rules) {
    for (let start = 0; start + rule.lines.length <= result.length;) {
      if (rule.lines.every((pattern, offset) => pattern.test(result[start + offset]))) {
        result.splice(start, rule.lines.length);
        used.add(rule.why);
      } else start += 1;
    }
  }
  return result;
}

describe.skipIf(out)("the forearm page says what it said at 3986178, apart from wave 0's stated changes", () => {
  it("reads the same lines, in the same order, in every state and every sheet", async () => {
    const reference = JSON.parse(readFileSync(join(process.cwd(), "client/src/components/specialization/__fixtures__/pageText.3986178.json"), "utf8")) as Record<string, Reading>;
    const read = await readAll();
    expect(Object.keys(read)).toEqual(Object.keys(reference));
    const used = new Set<string>();
    const rewrite = (line: string) => stated.reduce((text, rule) => (rule.was.test(text) ? (used.add(rule.why), text.replace(rule.was, rule.now)) : text), line);
    const differences: Record<string, { expected: string[]; read: string[] } | string> = {};
    let total = 0;
    for (const state of Object.keys(reference)) {
      const sheetsNow = Object.keys(read[state]).filter((key) => !addedSheets.some((rule) => rule.key.test(key) && used.add(rule.why)));
      if (JSON.stringify(sheetsNow) !== JSON.stringify(Object.keys(reference[state]))) differences[`${state}: sheets`] = `${Object.keys(reference[state]).join(", ")} → ${sheetsNow.join(", ")}`;
      for (const key of Object.keys(reference[state])) {
        const expected = withoutRuns(reference[state][key], gone.filter((rule) => rule.in.test(key)), used).map(rewrite);
        const shown = withoutRuns(read[state][key] ?? [], added.filter((rule) => rule.in.test(key)), used);
        total += shown.length;
        if (JSON.stringify(shown) !== JSON.stringify(expected)) differences[`${state}: ${key}`] = { expected, read: shown };
      }
    }
    expect(total).toBeGreaterThan(2000);
    expect(differences).toEqual({});
    // Every stated change is still one the page makes.
    expect([...stated, ...gone, ...added, ...addedSheets].map((rule) => rule.why).filter((why) => !used.has(why))).toEqual([]);
  }, 300000);
});
