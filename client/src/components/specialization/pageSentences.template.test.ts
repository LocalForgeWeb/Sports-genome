// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { loadRegionExtras } from "@/lib/specialization/regionExtras";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { registeredRegionIndex } from "@shared/specialization/regionIndex";
import type { Contribution, NodeExposure, SpecializationRegionData, SpecializationSummary, SummarySide } from "@shared/specialization/types";
import { pageFixtures } from "./__fixtures__/pageRegions";
import { exposureSentence, findingsFor } from "./model";
import { SpecializationPanel, preloadStackModel } from "./SpecializationPanel";

/**
 * Every page sentence that names a region, for every region shape (docs/specialization-atlas/
 * 10-multi-region.md §1.1, §6.2 and the appendix "Both sides as one"): the forearm, and test regions
 * paired by the arm (the deltoid fixture), by the leg with the side word "leg" (a thigh), by the arm
 * with the side word "side" (a back), and a midline core. Since the owner's decision of 20 Oct 2026
 * ("there's no reason for a left and right arm", extended to every paired region) each page counts
 * both sides as one, so there is one page per region and mode, and no side to say. The page is
 * rendered with work that reaches the sentences (sets with a side recorded and none, region-only
 * work, a plan), its sheets and disclosures opened, and every piece of text and every accessible
 * name is held to these rules:
 *
 * - no noun said twice in a row ("arm arm"), and the region's own noun at most once a sentence
 *   ("the forearms on your right forearm");
 * - never "{label} on the" ("the thighs on the right thigh");
 * - no left or right side on any region, and no limb word that is not the region's ("leg" on the
 *   back's page, "arm" on the thigh's; none on the midline region): the region's own limb word is
 *   said only where the page says both sides count together;
 * - nothing kept apart for want of a side ("kept apart", "counted for neither arm");
 * - no named week said twice in one text ("Plan Week 1, as written: … planned … in Plan Week 1").
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
/** The page's one summary of a region: both sides as one on a paired region, the midline on a midline one. */
const pageSideOf = (data: SpecializationRegionData): SummarySide => (data.region.sides.model === "midline" ? "midline" : "both");
/** The region's line, as the page says it: "on the forearms", "planned for the forearms". */
const regionLineOf = (data: SpecializationRegionData, mode: "completed" | "planned") => `${mode === "planned" ? "planned for" : "on"} the ${data.region.label.toLowerCase()}`;

const BLOCKS = "p, li, h1, h2, h3, dt, dd, summary, legend, figcaption, label > span, button, option, small, strong, b";
/** Region content the page shows but does not write: anatomy, claims and sources, rationales, method notes, and the published rule. */
const CONTENT = ".spz-rule-text, .spz-method-notes, #spz-does ~ *, [aria-labelledby='spz-does'], [aria-labelledby='spz-shape'], [aria-labelledby='spz-sources'], .spz-why-rationale, .spz-sources, .spz-sheet-subtitle, .spz-actions-list small"
  // The same anatomy in the 3D model's panel: what the muscle does, and how it contributes to shape with its caveats.
  + ", .sg-anatomy3d-detail .sg-anatomy3d-function, .sg-anatomy3d-detail .spz-caveats";

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

/** What the rules find wrong in these texts for this region, as readable lines. */
function problems(data: SpecializationRegionData, texts: readonly string[]): string[] {
  const { region } = data;
  const label = region.label.toLowerCase();
  const noun = label.split(" ").pop()!.replace(/s$/, "");
  const limb = region.sides.model === "paired" ? region.sides.limb : null;
  const side = /\b(left|right)\b(?! out\b| unmapped\b)/i;
  const foreign = limb === "arm" ? /\blegs?\b/i : limb === "leg" ? /\barms?\b/i : /\barms?\b|\blegs?\b/i;
  // Names are not words the page chooses: the muscles', the exercises' and, in the heading's region grid, the regions' own
  // ("Upper arms" on the core's page names a region, not a limb; wave A).
  const regionNames = registeredRegionIndex.flatMap((item) => [item.label, item.heading]);
  const names = [...data.nodes.map((node) => node.name), ...exerciseNames, ...regionNames].sort((a, b) => b.length - a.length);
  const out: string[] = [];
  for (const text of texts) {
    const twice = text.match(/\b(Plan\sWeek\s\d+)\b[\s\S]*\b(Plan\sWeek\s\d+)\b/);
    if (twice && twice[1].replace(/\s/g, " ") === twice[2].replace(/\s/g, " ")) out.push(`"${twice[1]}" twice: ${text}`);
    for (const sentence of sentences(text)) {
      const repeated = sentence.match(/\b([a-z]{3,})\s+\1\b/i);
      if (repeated) out.push(`repeated "${repeated[1]}": ${sentence}`);
      const said = withoutNames(sentence, names);
      if ((said.match(new RegExp(`\\b${noun}s?\\b`, "gi")) ?? []).length > 1) out.push(`"${noun}" twice: ${sentence}`);
      if (sentence.toLowerCase().includes(`${label} on the`)) out.push(`"${label} on the": ${sentence}`);
      if (side.test(said)) out.push(`a side named: ${sentence}`);
      if (foreign.test(said)) out.push(`limb not the region's: ${sentence}`);
      if (/kept apart|counted for neither/i.test(said)) out.push(`a side kept apart: ${sentence}`);
      // Both sides as one: nothing is read, measured or counted per arm or leg.
      if (/\b(by|per|each)\s+(arm|leg|side)s?\b/i.test(said)) out.push(`counted per side: ${sentence}`);
    }
  }
  return out;
}

const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const openDisclosure = async (name: string) => {
  // The disclosure's own heading: the 3D model's panel also has a "How this is counted" link.
  const details = screen.getAllByText(name).find((element) => element.closest("summary"))!.closest("details")!;
  await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
  return details;
};
const closeSheet = async () => { const close = screen.queryByRole("button", { name: "Close" }); if (close) await click(close); };

/** The page for one region, with its sheets and disclosures opened in turn; every text seen along the way. */
async function readEverything(data: SpecializationRegionData, mode: "completed" | "planned"): Promise<string[]> {
  render(createElement(Harness, { initial: { ...defaultSpecializationState(data.region.id), mode } }));
  await act(async () => {});
  const seen = [...pageTexts()];
  // The region's sets, and every other list of sets the page offers.
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

/**
 * The 3D model, which a phone shows by default where a region has one (the forearm): the page with
 * the model's row of muscles and its Overview, then each muscle of the row chosen in turn with the
 * model's panel and its disclosures open. jsdom has no WebGL, so the stage shows its fallback.
 */
async function readModel(data: SpecializationRegionData, mode: "completed" | "planned"): Promise<string[]> {
  render(createElement(Harness, { initial: { ...defaultSpecializationState(data.region.id), mode, figure: "model" } }));
  await act(async () => {});
  const openPanel = () => document.querySelectorAll<HTMLDetailsElement>(".sg-anatomy3d details").forEach((details) => { details.open = true; });
  openPanel();
  const seen = [...pageTexts()];
  const chips = () => Array.from(document.querySelectorAll<HTMLElement>(".sg-anatomy3d-rail-chip"));
  expect(chips().length).toBeGreaterThan(1);
  for (let index = 1; index < chips().length; index += 1) {
    await click(chips()[index]);
    openPanel();
    seen.push(...pageTexts());
  }
  cleanup();
  return seen;
}

// The forearm's rep profiles too (F1, §5.2), so its muscle sheet's starting ranges are read with everything else.
beforeAll(async () => { await loadRegionData("forearm"); await loadRegionExtras("forearm"); await preloadStackModel(); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("every page sentence that names a region, for every region shape", () => {
  for (const data of regions) {
    for (const mode of ["completed", "planned"] as const) {
      it(`${data.region.id}, ${mode}`, async () => {
        const texts = await readEverything(data, mode);
        // The page reached its sentences: the region's line names the region, and no side.
        expect(texts.some((text) => text.includes(regionLineOf(data, mode))), regionLineOf(data, mode)).toBe(true);
        expect(problems(data, texts)).toEqual([]);
      }, 60000);
    }
  }

  for (const mode of ["completed", "planned"] as const) {
    it(`forearm, ${mode}, the 3D model's row and panel for each of its muscles`, async () => {
      const texts = await readModel(forearmRegionData, mode);
      // It reached the panel of a chosen muscle, and the model's credits.
      expect(texts).toContain("Each set once per muscle");
      expect(texts.some((text) => text.startsWith("It is one model of one arm"))).toBe(true);
      expect(problems(forearmRegionData, texts)).toEqual([]);
    }, 60000);
  }

  it("finds what it is looking for: each rule catches the sentence it is there for", () => {
    const thigh = pageFixtures.fx_thigh;
    expect(problems(thigh, ["12 sets on the fixture thighs on the right thigh."])).toHaveLength(3);
    expect(problems(pageFixtures.deltoid, ["Under review: Anterior deltoid and Lateral deltoid and 2 more"])).toEqual([]);
    expect(problems(forearmRegionData, ["About Single-Leg Romanian Deadlift"])).toEqual([]);
    expect(problems(pageFixtures.fx_core, ["Nothing left out"])).toEqual([]);
    expect(problems(thigh, ["Kept apart and counted for neither arm."])).toEqual(["limb not the region's: Kept apart and counted for neither arm.", "a side kept apart: Kept apart and counted for neither arm."]);
    expect(problems(pageFixtures.fx_core, ["This week · right side"])).toHaveLength(1);
    expect(problems(forearmRegionData, ["Logged on the right arm arm: 3 bouts"])).toHaveLength(2);
    // The words the page said per arm before 20 Oct are a side named; the words it says now are not.
    expect(problems(forearmRegionData, ["12 distinct bouts touched your right forearm."])).toEqual(["a side named: 12 distinct bouts touched your right forearm."]);
    expect(problems(thigh, ["Right leg"])).toHaveLength(1);
    expect(problems(forearmRegionData, ["12 sets on the forearms."])).toEqual([]);
    expect(problems(forearmRegionData, ["Both arms count together: a set counts once, whichever arm or arms did it, and a set with no arm recorded counts like any other."])).toEqual([]);
    expect(problems(forearmRegionData, ["Plan Week 1, as written: 18 sets planned for the forearms in Plan\u00a0Week 1."])).toHaveLength(1);
    expect(problems(forearmRegionData, ["Plan Week 2, as written: 18 sets planned for the forearms in Plan Week 1."])).toEqual([]);
    // Nothing read, measured or counted by, per or each side (the release review, 22 Oct): main's words, and what the page says now.
    expect(problems(forearmRegionData, ["Circumference and grip, by arm"])).toEqual(["counted per side: Circumference and grip, by arm"]);
    expect(problems(forearmRegionData, ["Each set once per muscle, per arm"])).toEqual(["counted per side: Each set once per muscle, per arm"]);
    expect(problems(thigh, ["Each side assumed", "Measured per leg", "Counted by sides"])).toHaveLength(3);
    expect(problems(forearmRegionData, ["Circumference and grip", "Each set once per muscle", "By FCR, FCU, PL."])).toEqual([]);
  });

  /** What the page's live region says once Planned is chosen. */
  const announcedOnPlanned = async (data: SpecializationRegionData): Promise<string> => {
    render(createElement(Harness, { initial: defaultSpecializationState(data.region.id) }));
    await act(async () => {});
    await click(within(screen.getByRole("group", { name: "Planned or completed" })).getByRole("button", { name: "Planned" }));
    await act(async () => {});
    return document.querySelector(".spz-page > [aria-live='polite']")!.textContent ?? "";
  };
  for (const data of regions) {
    it(`${data.region.id}: says the plan week once when Planned is chosen`, async () => {
      const said = await announcedOnPlanned(data);
      expect(said.startsWith("Plan Week 1, as written: ")).toBe(true);
      expect(said).toContain(`for the ${data.region.label.toLowerCase()}.`);
      expect(said).not.toMatch(/in Plan\sWeek/);
      expect(problems(data, [said])).toEqual([]);
    }, 60000);
  }
});

describe("what the page model says, for every region shape", () => {
  const node = (nodeId: string, over: Partial<NodeExposure> = {}): NodeExposure => ({
    nodeId, directDynamicBouts: 0, contributingDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, incidentalBouts: 2, mixedBouts: 0, unknownBouts: 0, directDynamicReps: 0, contributingDynamicReps: 0,
    unknownSide: { bouts: 0, directDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, pendingReviewBouts: 0 }, pendingReviewBouts: 1, mappingCoverage: "reviewed", contributions: [], ...over,
  });
  const strapped = { notes: ["Strapped: grip not counted"], boutId: "b1" } as unknown as Contribution;
  const summary = (data: SpecializationRegionData, side: SummarySide, direct: number): SpecializationSummary => ({
    regionId: data.region.id, interval: { kind: "calendar_week", startAt: null, endAtExclusive: null, timezone: "UTC", planWeek: null, label: "This week" }, side, mode: "completed",
    mappingVersion: data.mappingVersion.key, ruleVersion: "x", sourceRevision: "", planRevision: null,
    nodes: data.nodes.map((item) => node(item.id, { directDynamicBouts: direct, contributions: Array.from({ length: direct }, (_, index) => ({ boutId: `${side}${index}`, nodeId: item.id, category: "direct_dynamic", parts: [], side: "bilateral", countedSide: side, recordedSide: null } as unknown as Contribution)), notCounted: [strapped] })),
    regionDistinctBouts: 4, regionUnknownSideBouts: 0, regionUnclassified: { bouts: 1, exercises: [{ name: "Dumbbell Pullover", catalogExerciseId: 24, bouts: 1 }] },
    goals: [{ goal: { id: "g", regionId: data.region.id, nodeId: data.nodes[0].id, actionId: null, side, metric: "direct_dynamic_bouts", target: 9, period: "calendar_week", startsOn: "2026-01-01", endsOn: null, timezone: "UTC", createdAt: "", updatedAt: "" }, value: 1, fraction: 1 / 9, label: "1 of your 9" }],
    completeness: { boutsConsidered: 9, boutsWithReviewedMapping: 4, boutsPendingReview: 1, boutsRegionOnly: 1, boutsNameMatched: 0, boutsUnknownSide: 0, boutsExcluded: { notCompleted: 0, warmup: 0 }, boutsListedUnmapped: 0 },
    calculatedAt: "",
  });
  for (const data of regions) {
    it(`${data.region.id}, ${pageSideOf(data)}`, () => {
      const findings = findingsFor({ data, summary: summary(data, pageSideOf(data), 5) });
      const texts = [...findings.flatMap((finding) => [finding.title, finding.detail]), exposureSentence(node(data.nodes[0].id), data.region.wording.incidentalWork)];
      // No region keeps anything apart for want of a side, or compares sides.
      expect(findings.some((finding) => finding.id === "unknown-side" || finding.id.startsWith("sides:"))).toBe(false);
      expect(findings.length).toBeGreaterThan(2);
      expect(problems(data, texts)).toEqual([]);
    });
  }
});
