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
 * The forearm page says what it said before wave 0, apart from the changes wave 0 states
 * (docs/specialization-atlas/10-multi-region.md §9.1 and §11 decision 11(a): "your right forearm"
 * sentences, targets read-only on muscles that are not a target here; §8: the plain statement about
 * automated review; §4.3: the strapped finding's words from the published rule). The week of
 * __fixtures__/forearmWeek.ts is rendered for both arms, three windows and the plan week; the page
 * is read with every disclosure open and every finding shown, and so are four muscles' sheets with
 * their ledgers open (one target muscle with two-handed, one-arm and no-arm rows; one with holds
 * and strapped sets; the adjacent anconeus; the external biceps), the sets behind every total (the
 * region's, the window line's pair, each exercise's, each day's, those with no arm recorded, those
 * for the forearms only), and the wrist flexion movement. Every distinct line of text and
 * every accessible name is compared with the same reading taken at 8e746b4
 * (__fixtures__/pageText.8e746b4.json) after the stated changes (`stated`) are applied to it:
 * anything else that is new, or gone, fails. The drawing's own labels (data) and the live region's
 * announcements are not read.
 *
 * To read the reference again: copy this file and __fixtures__/forearmWeek.ts into a tree at
 * 8e746b4, leave out the region loader (that tree has none), and run it with
 * READ_PAGE_TEXT=<path>.
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
/** Each run of text between block boundaries, and each accessible name, under `root`; not the drawing, not the live region. */
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

const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); await act(async () => {}); };
const openAll = async (root: ParentNode) => {
  for (const details of Array.from(root.querySelectorAll("details"))) await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
  await act(async () => {});
};
const dialog = () => screen.getByRole("dialog");
async function readSheet(open: Element | null | undefined, into: string[]) {
  if (!open) return;
  await click(open);
  await openAll(dialog());
  into.push(...linesOf(dialog()));
  await click(within(dialog()).getAllByRole("button").find((button) => /^Close/.test(button.getAttribute("aria-label") ?? button.textContent ?? ""))!);
}
const pageButton = (name: RegExp) => Array.from(document.querySelectorAll<HTMLElement>(".spz-page button")).find((button) => name.test(button.textContent ?? "") || name.test(button.getAttribute("aria-label") ?? ""));

async function readPage(state: SpecializationViewState): Promise<string[]> {
  render(createElement(Harness, { initial: state }));
  await act(async () => {});
  const seen: string[] = [];
  const more = pageButton(/^Show \d+ more$/);
  if (more) await click(more);
  await openAll(document.querySelector(".spz-page")!);
  seen.push(...linesOf(document.querySelector(".spz-page")!));
  // The sets behind each total, before a muscle is selected: the region's, the pair's, each exercise's and each day's.
  await readSheet(pageButton(/^See these sets/), seen);
  await readSheet(document.querySelector(".spz-window-open"), seen);
  const count = (selector: string) => document.querySelectorAll(selector).length;
  for (let index = 0; index < count(".spz-exercise-list .spz-link-box[aria-label^='The sets of']"); index += 1) await readSheet(document.querySelectorAll(".spz-exercise-list .spz-link-box[aria-label^='The sets of']")[index], seen);
  for (let index = 0; index < count("button.spz-day"); index += 1) await readSheet(document.querySelectorAll("button.spz-day")[index], seen);
  for (const name of ["Brachioradialis", "Flexor digitorum superficialis", "Anconeus", "Biceps brachii"]) await readSheet(pageButton(new RegExp(`^${name}, `)), seen);
  await readSheet(pageButton(/^See the \d+ sets? with no arm recorded/), seen);
  await readSheet(pageButton(/^See the \d+ sets? for the forearms only/), seen);
  await readSheet(pageButton(/^Open Wrist flexion$/), seen);
  cleanup();
  return seen;
}

/** Both arms, this week, the rolling 7 days, a custom window and the plan week. */
const states: [string, Partial<SpecializationViewState>][] = [
  ["left/week", { limb: "left" }],
  ["right/7d", { limb: "right", window: "7d" }],
  ["left/custom", { limb: "left", window: "custom", from: "2026-10-05", to: "2026-10-16" }],
  ["right/planned", { limb: "right", mode: "planned" }],
];

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

/** Every distinct line the page showed in these states. */
async function readAll(): Promise<string[]> {
  const lines = new Set<string>();
  for (const [, over] of states) for (const line of await readPage({ ...defaultSpecializationState("forearm"), ...over })) lines.add(line);
  return Array.from(lines).sort();
}

const out = process.env.READ_PAGE_TEXT;
describe.runIf(out)("reading the page's text", () => {
  it("writes it", async () => {
    writeFileSync(out!, `${JSON.stringify(await readAll(), null, 1)}\n`);
  }, 300000);
});

/**
 * What wave 0 changes on the forearm page, each with where it is stated: a line of the reference is
 * rewritten (`was` → `now`), or goes (`gone`), or a line is new (`added`). Nothing else may differ,
 * and every entry must still match something, so the list stays true.
 */
const stated: { why: string; was: RegExp; now: string }[] = [
  { why: "§9.1, §11 decision 11(a): sentences read 'your right forearm' (the region's onSide)", was: /\b(touched|is planned for|are planned for) the forearms on the (left|right) arm\b/, now: "$1 your $2 forearm" },
  { why: "§9.1: the same, for the sets behind a total", was: /\bloaded a muscle of the forearms on the (left|right) arm\b/, now: "touched your $1 forearm" },
  { why: "§9.1: the same, planned", was: /\bplanned for a muscle of the forearms on the (left|right) arm\b/, now: "planned for your $1 forearm" },
  { why: "§9.1: the window pair's logged list", was: /^(\[name\] )?Logged on the (left|right) arm: /, now: "$1Logged for your $2 forearm: " },
  { why: "§9.1: the region's sets, headed by its side", was: /^(\[name\] )?On the (left|right) arm$/, now: "$1Your $2 forearm" },
  { why: "§4.3: the strapped finding's words come from the published rule and the calculator's note", was: /^(\d+ strapped sets?) earned no grip credit$/, now: "$1: grip not counted" },
  { why: "§4.3: the strapped finding's detail is the published rule's straps clause", was: /^Straps hold the bar for the hand, so the finger flexors are not credited for those sets\. The rest of each set still counts\.$/, now: `${currentExposureRule.specification.straps} The rest of each set still counts.` },
];
const gone: { why: string; line: RegExp }[] = [
  { why: "§2.2, §9.1: a target saved earlier on a muscle that is not a target here can be ended or removed, not changed", line: /^\[name\] Change the (left|right)-arm target of .+ for (Anconeus|Biceps brachii|Brachialis)$/ },
];
const added: { why: string; line: RegExp }[] = [
  { why: "§2.2: said beside such a target", line: /^Targets are for this region's target muscles\. You can end or remove this one\.$/ },
  { why: "§2.2, §6.2: an external muscle's sheet says where its targets are set", line: /^Targets for this muscle are set on the upper arm page, which is not available yet\.$/ },
  { why: "§8: the plain statement about automated review, under How this is counted", line: /^“Reviewed” means an automated agent checked each sentence/ },
];

describe.skipIf(out)("the forearm page says what it said at 8e746b4, apart from wave 0's stated changes", () => {
  it("reads the same lines", async () => {
    const reference = JSON.parse(readFileSync(join(process.cwd(), "client/src/components/specialization/__fixtures__/pageText.8e746b4.json"), "utf8")) as string[];
    const read = await readAll();
    expect(read.length).toBeGreaterThan(700);
    const used = new Set<string>();
    const rewrite = (line: string) => stated.reduce((text, rule) => (rule.was.test(text) ? (used.add(rule.why), text.replace(rule.was, rule.now)) : text), line);
    const expected = new Set(reference.filter((line) => !gone.some((rule) => rule.line.test(line) && used.add(rule.why))).map(rewrite));
    const shown = new Set(read);
    const isAdded = (line: string) => added.some((rule) => rule.line.test(line) && used.add(rule.why));
    expect({ new: read.filter((line) => !expected.has(line) && !isAdded(line)), lost: Array.from(expected).filter((line) => !shown.has(line)) }).toEqual({ new: [], lost: [] });
    // Every stated change is still one the page makes.
    expect([...stated, ...gone, ...added].map((rule) => rule.why).filter((why) => !used.has(why))).toEqual([]);
  }, 300000);
});
