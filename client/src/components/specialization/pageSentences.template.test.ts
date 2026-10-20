// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { BodySide, Contribution, NodeExposure, SpecializationRegionData, SpecializationSummary, SummarySide } from "@shared/specialization/types";
import { pageFixtures } from "./__fixtures__/pageRegions";
import { exposureSentence, findingsFor } from "./model";
import { sideWordsFor } from "./sideWords";
import { SpecializationPanel } from "./SpecializationPanel";

/**
 * Every page sentence that names a region or a side, for every region shape
 * (docs/specialization-atlas/10-multi-region.md §1.1, §6.2): the forearm, and test regions paired
 * by the arm (the deltoid fixture), by the leg with the side word "leg" (a thigh), by the arm with
 * the side word "side" (a back), and a midline core; each side of a paired region, and none for
 * the midline. The page is rendered with work that reaches the sentences (sets with no side
 * recorded, region-only work, a plan), its sheets and disclosures opened, and every piece of text
 * and every accessible name is held to three rules:
 *
 * - no noun said twice in a row ("arm arm"), and the region's own noun at most once a sentence
 *   ("the forearms on your right forearm");
 * - never "{label} on the" ("the thighs on the right thigh": a side is said as the region says it);
 * - no limb word that is not the region's ("leg" on the back's page, "arm" on the thigh's), and no
 *   side at all on the midline region.
 *
 * Left out, because they are not the page's sentences: the published rule's text (`.spz-rule-text`,
 * the same on every region and never edited), the region's own content (a muscle's anatomy, its
 * sources, a mapping's rationale, the version's method notes), and names: a muscle's ("Anterior
 * deltoid and Lateral deltoid") and an exercise's ("Single-Leg Romanian Deadlift" on the forearm's
 * page) are said as they are named. "Left" that is no side ("Nothing left out") is not a side.
 */

vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("./__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["deltoid", "fx_thigh", "fx_back", "fx_shoulder", "fx_core"]);
});
vi.mock("@/lib/specialization/loadRegion", async (importOriginal) => {
  const { loaderWith } = await import("./__fixtures__/pageRegions");
  return loaderWith(await importOriginal(), ["deltoid", "fx_thigh", "fx_back", "fx_shoulder", "fx_core"]);
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const set = (over: Record<string, unknown> = {}) => ({ weight: "30", reps: "10", unit: "kg", completed: true, ...over });
const hold = (seconds: number, over: Record<string, unknown> = {}) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "kg", completed: true, ...over });
const ex = (id: string, catalogId: number, sets: Record<string, unknown>[], over: Record<string, unknown> = {}) => ({ id, exerciseName: byId(catalogId).name, catalogId, plannedPrescription: `${sets.length} × 10`, sets, ...over });
/** One week that reaches every kind of sentence on each region: a side recorded and none, region-only work, holds. */
const sessions = [{
  id: "s-wed", title: "Full", dayLabel: "Week 1 · Day 01 · Full", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
  exercises: [
    ex("e1", 132, [set(), set()]),
    ex("e2", 410, [set({ side: "right" }), set()]),
    ex("e3", 24, [set()]),
    ex("e4", 145, [hold(30), hold(30)], { straps: "yes" }),
    ex("e5", 161, [set(), set()]),
    ex("e6", 173, [set({ legSide: "right" }), set({ legSide: "left" })]),
    ex("e7", 188, [set(), set({ legSide: "left" })]),
    ex("e8", 46, [set({ side: "right" }), set()]),
    ex("e9", 409, [hold(40, { side: "left" }), hold(40)]),
    ex("e10", 241, [set()]),
    ex("e11", 247, [hold(30)]),
    ex("e12", 111, [set(), set()]),
    ex("e13", 93, [set({ side: "left" }), set()]),
  ],
}];
const slots = buildDaySlots(["Full"]);
const store = { ...emptyDayStore(), plan: { [slots[0].key]: [byId(161), byId(173), byId(46), byId(241), byId(132), byId(111)] } };

function Harness({ initial }: { initial: SpecializationViewState }) {
  const [state, setState] = useState(initial);
  return createElement(SpecializationPanel, {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Athleticism", weightUnit: "kg",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onInspectExercise: () => {}, onOpenSession: () => {},
    backLabel: null, onBack: null,
  });
}

const regions: SpecializationRegionData[] = [forearmRegionData, pageFixtures.deltoid, pageFixtures.fx_thigh, pageFixtures.fx_back, pageFixtures.fx_core];
const sidesOf = (data: SpecializationRegionData): SummarySide[] => (data.region.sides.model === "midline" ? ["midline"] : ["left", "right"]);

const BLOCKS = "p, li, h1, h2, h3, dt, dd, summary, legend, figcaption, label > span, button, option, small, strong, b";
/** Region content the page shows but does not write: anatomy, claims and sources, rationales, method notes, and the published rule. */
const CONTENT = ".spz-rule-text, .spz-method-notes, #spz-does ~ *, [aria-labelledby='spz-does'], [aria-labelledby='spz-shape'], [aria-labelledby='spz-sources'], .spz-why-rationale, .spz-sources, .spz-sheet-subtitle, .spz-actions-list small";

/** Every piece of text on screen, innermost block by block, and every accessible name and description. */
function pageTexts(): string[] {
  const page = document.body.cloneNode(true) as HTMLElement;
  page.querySelectorAll(CONTENT).forEach((element) => element.remove());
  const blocks = Array.from(page.querySelectorAll(BLOCKS)).filter((element) => !element.querySelector(BLOCKS)).map((element) => element.textContent ?? "");
  const names = Array.from(page.querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label") ?? "");
  return [...blocks, ...names].map((text) => text.replace(/\s+/g, " ").trim()).filter(Boolean);
}

const sentences = (text: string) => text.split(/(?<=[.!?:])\s+/);
/** Exercise names, longest first, so a longer name is taken out before a shorter one inside it. */
const exerciseNames = exercises.map((exercise) => exercise.name).filter(Boolean).sort((a, b) => b.length - a.length);
const withoutNames = (sentence: string, names: readonly string[]) => names.reduce((text, name) => (text.includes(name) ? text.split(name).join("·") : text), sentence);

/** What the three rules find wrong in these texts for this region, as readable lines. */
function problems(data: SpecializationRegionData, texts: readonly string[]): string[] {
  const { region } = data;
  const label = region.label.toLowerCase();
  const noun = label.split(" ").pop()!.replace(/s$/, "");
  const limb = region.sides.model === "paired" ? region.sides.limb : null;
  const foreign = limb === "arm" ? /\blegs?\b/i : limb === "leg" ? /\barms?\b/i : /\barms?\b|\blegs?\b|\b(left|right)\b(?! out\b| unmapped\b)/i;
  const names = [...data.nodes.map((node) => node.name), ...exerciseNames].sort((a, b) => b.length - a.length);
  const out: string[] = [];
  for (const text of texts) {
    for (const sentence of sentences(text)) {
      const repeated = sentence.match(/\b([a-z]{3,})\s+\1\b/i);
      if (repeated) out.push(`repeated "${repeated[1]}": ${sentence}`);
      const said = withoutNames(sentence, names);
      if ((said.match(new RegExp(`\\b${noun}s?\\b`, "gi")) ?? []).length > 1) out.push(`"${noun}" twice: ${sentence}`);
      if (sentence.toLowerCase().includes(`${label} on the`)) out.push(`"${label} on the": ${sentence}`);
      if (foreign.test(said)) out.push(`limb or side not the region's: ${sentence}`);
    }
  }
  return out;
}

const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const openDisclosure = async (name: string) => {
  const details = screen.getByText(name).closest("details")!;
  await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
  return details;
};
const closeSheet = async () => { const close = screen.queryByRole("button", { name: "Close" }); if (close) await click(close); };

/** The page for one region and side, with its sheets and disclosures opened in turn; every text seen along the way. */
async function readEverything(data: SpecializationRegionData, side: SummarySide, mode: "completed" | "planned"): Promise<string[]> {
  const limb: BodySide = side === "midline" ? "right" : side;
  render(createElement(Harness, { initial: { ...defaultSpecializationState(data.region.id), limb, mode } }));
  await act(async () => {});
  const seen = [...pageTexts()];
  // The region's sets, and the sets with no side recorded where there are any.
  const strip = screen.getByRole("group", { name: "Selected muscle" });
  const seeSets = within(strip).queryByRole("button", { name: /See these sets/ });
  if (seeSets) { await click(seeSets); seen.push(...pageTexts()); await closeSheet(); }
  for (const button of screen.queryAllByRole("button", { name: /^See these sets/ })) {
    if (!document.body.contains(button)) continue;
    await click(button); seen.push(...pageTexts()); await closeSheet();
  }
  // The first muscle's sheet: its numbers, its ledger opened, its target form.
  const firstRow = document.querySelector<HTMLElement>(".spz-row");
  if (firstRow) {
    await click(firstRow);
    const sheet = screen.getByRole("dialog");
    sheet.querySelectorAll("details").forEach((details) => { details.open = true; });
    const setTarget = within(sheet).queryByRole("button", { name: /Set a target/ });
    if (setTarget) await click(setTarget);
    seen.push(...pageTexts());
    await closeSheet();
  }
  // Targets with its form, Progress with its form, and How this is counted.
  const targets = await openDisclosure("Targets");
  await click(within(targets).getByRole("button", { name: /Add a target/ }));
  const progress = await openDisclosure("Progress");
  const addReading = within(progress).queryByRole("button", { name: "Add a reading" });
  if (addReading) await click(addReading);
  await openDisclosure("How this is counted");
  seen.push(...pageTexts());
  cleanup();
  return seen;
}

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("every page sentence that names a region or a side, for every region shape", () => {
  for (const data of regions) {
    for (const side of sidesOf(data)) {
      for (const mode of ["completed", "planned"] as const) {
        it(`${data.region.id}, ${side}, ${mode}`, async () => {
          const texts = await readEverything(data, side, mode);
          const words = sideWordsFor(data.region);
          // The page reached its sentences: the region's line names the region and the side as the region says them.
          expect(texts.some((text) => text.includes(words.onSide(side))), words.onSide(side)).toBe(true);
          expect(problems(data, texts)).toEqual([]);
        }, 60000);
      }
    }
  }

  it("finds what it is looking for: each rule catches the sentence it is there for", () => {
    const thigh = pageFixtures.fx_thigh;
    expect(problems(thigh, ["12 distinct bouts touched the fixture thighs on the right thigh."])).toHaveLength(2);
    expect(problems(pageFixtures.deltoid, ["Mapping under review for Anterior deltoid and Lateral deltoid and 2 more"])).toEqual([]);
    expect(problems(forearmRegionData, ["About Single-Leg Romanian Deadlift"])).toEqual([]);
    expect(problems(pageFixtures.fx_core, ["Nothing left out"])).toEqual([]);
    expect(problems(thigh, ["Kept apart and counted for neither arm."])).toEqual(["limb or side not the region's: Kept apart and counted for neither arm."]);
    expect(problems(pageFixtures.fx_core, ["This week · right side"])).toHaveLength(1);
    expect(problems(forearmRegionData, ["Logged on the right arm arm: 3 bouts"])).toHaveLength(1);
    expect(problems(forearmRegionData, ["12 distinct bouts touched your right forearm."])).toEqual([]);
  });
});

describe("what the page model says, for every region shape and side", () => {
  const node = (nodeId: string, over: Partial<NodeExposure> = {}): NodeExposure => ({
    nodeId, directDynamicBouts: 0, contributingDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, incidentalBouts: 2, mixedBouts: 0, unknownBouts: 0, directDynamicReps: 0, contributingDynamicReps: 0,
    unknownSide: { bouts: 1, directDynamicBouts: 1, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, pendingReviewBouts: 1 }, pendingReviewBouts: 1, mappingCoverage: "reviewed", contributions: [], ...over,
  });
  const strapped = { notes: ["Strapped: grip not counted"], boutId: "b1" } as unknown as Contribution;
  const summary = (data: SpecializationRegionData, side: SummarySide, direct: number): SpecializationSummary => ({
    regionId: data.region.id, interval: { kind: "calendar_week", startAt: null, endAtExclusive: null, timezone: "UTC", planWeek: null, label: "This week" }, side, mode: "completed",
    mappingVersion: data.mappingVersion.key, ruleVersion: "x", sourceRevision: "", planRevision: null,
    nodes: data.nodes.map((item) => node(item.id, { directDynamicBouts: direct, contributions: Array.from({ length: direct }, (_, index) => ({ boutId: `${side}${index}`, nodeId: item.id, category: "direct_dynamic", parts: [], side: "bilateral", countedSide: side, recordedSide: null } as unknown as Contribution)), notCounted: [strapped] })),
    regionDistinctBouts: 4, regionUnknownSideBouts: 2, regionUnclassified: { bouts: 1, exercises: [{ name: "Dumbbell Pullover", catalogExerciseId: 24, bouts: 1 }] },
    goals: [{ goal: { id: "g", regionId: data.region.id, nodeId: data.nodes[0].id, actionId: null, side, metric: "direct_dynamic_bouts", target: 9, period: "calendar_week", startsOn: "2026-01-01", endsOn: null, timezone: "UTC", createdAt: "", updatedAt: "" }, value: 1, fraction: 1 / 9, label: "1 of your 9" }],
    completeness: { boutsConsidered: 9, boutsWithReviewedMapping: 4, boutsPendingReview: 1, boutsRegionOnly: 1, boutsNameMatched: 0, boutsUnknownSide: 2, boutsExcluded: { notCompleted: 0, warmup: 0 }, boutsListedUnmapped: 0 },
    calculatedAt: "",
  });
  for (const data of regions) {
    for (const side of sidesOf(data)) {
      it(`${data.region.id}, ${side}`, () => {
        const words = sideWordsFor(data.region);
        const other = side === "left" ? "right" : side === "right" ? "left" : "midline";
        const findings = findingsFor({ data, summary: summary(data, side, 5), otherSide: summary(data, other, 1) });
        const texts = [...findings.flatMap((finding) => [finding.title, finding.detail]), exposureSentence(node(data.nodes[0].id), data.region.wording.incidentalWork, words)];
        // A midline region keeps nothing apart for want of a side and compares no sides.
        expect(findings.some((finding) => finding.id === "unknown-side")).toBe(words.paired);
        expect(findings.some((finding) => finding.id.startsWith("sides:"))).toBe(words.paired);
        expect(problems(data, texts)).toEqual([]);
      });
    }
  }
});
