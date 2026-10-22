// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { specializationGoalsKeyBase } from "@/lib/specialization/stores";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, specializationRegionKeyBase, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";
import { specializationRegionIndex } from "@shared/specialization/regionIndex";
import type { SpecializationGoal } from "@shared/specialization/types";
import { pageFixtures } from "./__fixtures__/pageRegions";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";

/**
 * The page with several regions (docs/specialization-atlas/10-multi-region.md §6.1–§6.3), before a
 * second region ships: the test regions reach the page through the light index and the loader,
 * mocked here to hand them out as production regions (never registered, no prop for them). The
 * heading becomes the region picker; each region loads on its own; no region names a side (both
 * sides are one count, owner 20 Oct 2026, every paired region; a midline region has none);
 * another region's muscle links to its home's page when that page exists.
 */

/** A region the test holds back while it loads, or makes fail. */
const loader = vi.hoisted(() => ({
  held: new Map<string, "held" | "failing">(),
  settle: new Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>(),
  /** Regions whose data lands between the page's next render and its effect (a load Home started beside the page's chunk). */
  late: new Set<string>(),
}));

vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("./__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["deltoid", "fx_thigh", "fx_back", "fx_shoulder", "fx_core"]);
});
vi.mock("@/lib/specialization/loadRegion", async (importOriginal) => {
  const { loaderWith } = await import("./__fixtures__/pageRegions");
  const base = loaderWith(await importOriginal(), ["deltoid", "fx_thigh", "fx_back", "fx_shoulder", "fx_core"]);
  return {
    ...base,
    loadedRegionData: (id: string) => {
      if (loader.late.delete(id)) return null;
      return loader.held.has(id) ? null : base.loadedRegionData(id);
    },
    loadRegionData: (id: string) => {
      const how = loader.held.get(id);
      if (!how) return base.loadRegionData(id);
      return new Promise((resolve, reject) => { loader.settle.set(id, { resolve, reject }); });
    },
  };
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const set = (over: Record<string, unknown> = {}) => ({ weight: "30", reps: "10", unit: "kg", completed: true, ...over });
const hold = (seconds: number, over: Record<string, unknown> = {}) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "kg", completed: true, ...over });
const ex = (id: string, catalogId: number, sets: Record<string, unknown>[]) => ({ id, exerciseName: byId(catalogId).name, catalogId, plannedPrescription: `${sets.length} × 10`, sets });
/** Wednesday of the clock's week: squats and a single-leg RDL on the left leg, a one-arm row and a suitcase carry in the left hand, sit-ups, wrist curls. */
const sessions = [{
  id: "s-wed", title: "Full", dayLabel: "Week 1 · Day 01 · Full", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
  exercises: [
    ex("e1", 161, [set(), set()]),
    ex("e2", 188, [set({ legSide: "left" })]),
    ex("e3", 46, [set({ side: "right" })]),
    ex("e4", 409, [hold(40, { side: "left" })]),
    ex("e5", 241, [set()]),
    ex("e6", 132, [set(), set()]),
  ],
}];
const slots = buildDaySlots(["Full"]);

let lastState: SpecializationViewState | null = null;
function Harness({ initial, chooseRegion = false }: { initial: Partial<SpecializationViewState>; chooseRegion?: boolean }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...initial });
  lastState = state;
  const props: SpecializationPanelProps = {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: emptyDayStore() }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Athleticism", weightUnit: "kg",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onInspectExercise: () => {}, onOpenSession: () => {},
    backLabel: "Muscles", onBack: () => {}, chooseRegion,
  };
  return createElement(SpecializationPanel, props);
}
const show = async (initial: Partial<SpecializationViewState> = {}, chooseRegion = false) => {
  render(createElement(Harness, { initial, chooseRegion }));
  await act(async () => {});
};

const goal = (over: Partial<SpecializationGoal>): SpecializationGoal => ({
  id: "g", regionId: "forearm", nodeId: "forearm.fcr", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week",
  startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", ...over,
});
const storeGoals = (goals: SpecializationGoal[]) => window.localStorage.setItem(specializationGoalsKeyBase, JSON.stringify(goals));

const toggle = () => within(screen.getByRole("heading", { level: 1 })).getByRole("button");
const grid = () => document.getElementById("spz-regions")!;
const cells = () => within(grid()).getAllByRole("button", { hidden: true });
const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const live = () => document.querySelector<HTMLElement>(".spz-page > [aria-live='polite']")!.textContent;
const openSheetOf = async (name: RegExp) => {
  // The muscle's row in the list (the drawing names the same muscle).
  await click(Array.from(document.querySelectorAll<HTMLElement>("button.spz-row")).find((row) => name.test(row.getAttribute("aria-label") ?? ""))!);
  const sheet = screen.getByRole("dialog");
  sheet.querySelectorAll("details").forEach((details) => { details.open = true; });
  return sheet;
};

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
  loader.held.clear();
  loader.settle.clear();
  loader.late.clear();
  lastState = null;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("the heading row with more than one region", () => {
  it("makes the heading a toggle that says what it opens, with Back by its short name before it", async () => {
    await show();
    const button = toggle();
    expect(button.textContent).toBe("Forearms");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe("spz-regions");
    expect(document.getElementById(button.getAttribute("aria-describedby")!)!.textContent).toBe("Choose a body region");
    expect(screen.getByRole("button", { name: "Back to Muscles" }).textContent).toBe("Muscles");
    expect(grid().hidden).toBe(true);
  });

  it("opens a grid of the production regions in body order, the current one pressed, each with its active targets", async () => {
    // The forearm's "a" and "b" are an old pair, one per arm, read as one target (both arms as one); "d" is another.
    storeGoals([goal({ id: "a", side: "left" }), goal({ id: "b", side: "right" }), goal({ id: "d", nodeId: "forearm.br" }), goal({ id: "c", regionId: "fx_thigh", nodeId: "fx_thigh.quads", side: "left" }), goal({ id: "ended", regionId: "fx_core", nodeId: "fx_core.rectus", side: "midline", endsOn: "2026-10-10" })]);
    await show();
    await click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(grid().hidden).toBe(false);
    const group = screen.getByRole("group", { name: "Body region" });
    expect(group.id).toBe("spz-regions");
    const labels = within(group).getAllByRole("button").map((button) => button.querySelector("span")!.textContent);
    expect(labels).toEqual(specializationRegionIndex.map((region) => region.label));
    expect(labels).toEqual(["Forearms", "Deltoids", "Fixture thighs", "Fixture back", "Fixture shoulders", "Fixture core"]);
    // The reference upper arm (a home of the forearm's biceps) has no page, so it is not offered.
    expect(labels).not.toContain("Upper arm");
    const pressed = within(group).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true");
    expect(pressed.map((button) => button.querySelector("span")!.textContent)).toEqual(["Forearms"]);
    const targetsOf = (label: string) => within(group).getAllByRole("button").find((button) => button.querySelector("span")!.textContent === label)!.querySelector("small")?.textContent ?? null;
    expect([targetsOf("Forearms"), targetsOf("Fixture thighs"), targetsOf("Fixture core"), targetsOf("Deltoids")]).toEqual(["2 targets", "1 target", null, null]);
  });

  it("picks a region: the page is replaced, the grid closes, focus stays on the toggle, and the count is said", async () => {
    await show({ nodeId: "forearm.fcr" });
    await click(toggle());
    await click(within(grid()).getByRole("button", { name: /Fixture thighs/ }));
    expect(lastState).toMatchObject({ regionId: "fx_thigh", nodeId: null, view: null, layer: "surface" });
    expect(lastState).not.toHaveProperty("limb");
    expect(toggle().textContent).toBe("Fixture thighs");
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(grid().hidden).toBe(true);
    expect(document.activeElement).toBe(toggle());
    expect(live()).toMatch(/^Fixture thighs: \d+ distinct bouts? touched the fixture thighs\.$/);
    // The page below is the thigh's: its muscles, nothing the forearm's page had open.
    expect(screen.getByRole("button", { name: /^Fixture quadriceps/ })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on the current region, on the toggle and on Escape, focus back on the toggle each time", async () => {
    await show();
    await click(toggle());
    await click(within(grid()).getByRole("button", { name: /Forearms/ }));
    expect([grid().hidden, document.activeElement === toggle(), lastState!.regionId]).toEqual([true, true, "forearm"]);
    await click(toggle());
    await click(toggle());
    expect(grid().hidden).toBe(true);
    await click(toggle());
    const cell = within(grid()).getByRole("button", { name: /Deltoids/ });
    cell.focus();
    await act(async () => { fireEvent.keyDown(cell, { key: "Escape" }); });
    expect([grid().hidden, document.activeElement === toggle(), lastState!.regionId]).toEqual([true, true, "forearm"]);
  });

  it("starts with the grid open when Home asks it to choose (no region named, none remembered)", async () => {
    await show({}, true);
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(grid().hidden).toBe(false);
  });

  it("remembers the region opened on this device for the account", async () => {
    await show({ regionId: "fx_back" });
    expect(window.localStorage.getItem(specializationRegionKeyBase)).toBe("fx_back");
  });

  it("names the region it cannot show, with the heading kept", async () => {
    await show({ regionId: "nowhere" as SpecializationViewState["regionId"] });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Specialize");
    expect(screen.getByText("That body region is not available.")).toBeTruthy();
  });
});

describe("a region's data, loaded on its own", () => {
  it("shows one loading line while it loads, never zeros, then the page", async () => {
    loader.held.set("fx_core", "held");
    await show({ regionId: "fx_core" });
    expect(screen.getByRole("status").textContent).toBe("Loading the fixture core…");
    expect(document.querySelector(".spz-row")).toBeNull();
    expect(document.body.textContent).not.toMatch(/\b0 distinct|No work/);
    // The heading row is there while it loads.
    expect(toggle().textContent).toBe("Fixture core");
    loader.held.delete("fx_core");
    await act(async () => { loader.settle.get("fx_core")!.resolve(pageFixtures.fx_core); });
    expect(screen.getByRole("button", { name: /^Fixture rectus abdominis/ })).toBeTruthy();
  });

  it("shows the page when its data lands between the page's render and its effect, never a loading line left with nothing to end it", async () => {
    await loadRegionData("fx_core");
    loader.late.add("fx_core");
    await show({ regionId: "fx_core" });
    expect(screen.queryByText("Loading the fixture core…")).toBeNull();
    expect(screen.getByRole("button", { name: /^Fixture rectus abdominis/ })).toBeTruthy();
  });

  it("says when it could not be loaded, and offers a reload: a failed import is never tried again in place", async () => {
    loader.held.set("fx_core", "failing");
    await show({ regionId: "fx_core" });
    await act(async () => { loader.settle.get("fx_core")!.reject(new Error("offline")); });
    expect(within(screen.getByRole("alert")).getByText("The page for the fixture core could not be loaded. Reloading usually fixes this.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    // The browser keeps a failed import for the visit (in headless Chromium no second request is
    // made), so only a reload loads it; the address keeps the region.
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    try {
      await click(screen.getByRole("button", { name: "Reload" }));
      expect(reload).toHaveBeenCalledTimes(1);
      // Nothing was imported again in place.
      expect(loader.settle.size).toBe(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("says a region this build has no data for is not available, with nothing to retry", async () => {
    loader.held.set("fx_core", "held");
    await show({ regionId: "fx_core" });
    await act(async () => { loader.settle.get("fx_core")!.resolve(null); });
    expect(screen.getByText("That body region is not available.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Reload|Try again/ })).toBeNull();
    expect(toggle().textContent).toBe("Fixture core");
  });
});

describe("a midline region", () => {
  it("has no side switch, no side in its sentences, nothing kept apart for want of a side, and no side in a target", async () => {
    await show({ regionId: "fx_core" });
    for (const name of ["Arm", "Side", "Leg"]) expect(screen.queryByRole("group", { name })).toBeNull();
    // The page's own words; the published rule's text under How this is counted is the same on every region.
    const page = document.body.cloneNode(true) as HTMLElement;
    page.querySelector("#spz-method")?.remove();
    expect(page.textContent).toMatch(/touched the fixture core\./);
    expect(page.textContent).not.toMatch(/recorded|\bleft\b|\bright\b|\barms?\b|\blegs?\b/i);
    const targets = screen.getByText("Targets").closest("details")!;
    await act(async () => { targets.open = true; fireEvent(targets, new Event("toggle")); });
    await click(within(targets).getByRole("button", { name: /Add a target/ }));
    expect(within(targets).queryByText(/^Which /)).toBeNull();
    expect(within(targets).queryByText(/Both /)).toBeNull();
  });
});

describe("another region's muscle", () => {
  it("is grouped under its home's own heading, and its sheet links to its home's page when that page exists", async () => {
    await show({ regionId: "fx_back" });
    expect(screen.getByText("Fixture shoulders muscles credited here")).toBeTruthy();
    const sheet = await openSheetOf(/^Fixture rear deltoid/);
    expect(within(sheet).getByText("Targets for this muscle are set on the fixture shoulders page.")).toBeTruthy();
    expect(within(sheet).queryByRole("button", { name: /Set a target/ })).toBeNull();
    await click(within(sheet).getByRole("button", { name: "Open the fixture shoulders page" }));
    expect(lastState).toMatchObject({ regionId: "fx_shoulder", nodeId: "fx_shoulder.rear_delt" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(toggle().textContent).toBe("Fixture shoulders");
    expect(document.activeElement).toBe(toggle());
    expect(live()).toMatch(/^Fixture shoulders: /);
  });

  it("on the forearm, says its home's page is not available yet, and keeps an existing target read-only", async () => {
    storeGoals([goal({ id: "biceps", nodeId: "upper_arm.biceps", side: "right" })]);
    await show();
    expect(screen.getByText("Upper-arm muscles credited here")).toBeTruthy();
    const sheet = await openSheetOf(/^Biceps brachii/);
    expect(within(sheet).getByText("Targets for this muscle are set on the upper arm page, which is not available yet.")).toBeTruthy();
    expect(within(sheet).queryByRole("button", { name: /Open the/ })).toBeNull();
    expect(within(sheet).getByText("Targets are for this region's target muscles. You can end or remove this one.")).toBeTruthy();
    expect(within(sheet).queryByRole("button", { name: /^Change/ })).toBeNull();
    expect(within(sheet).getByRole("button", { name: /^End/ })).toBeTruthy();
    expect(within(sheet).queryByRole("button", { name: /Set a target/ })).toBeNull();
  });

  it("on the core, is the back's, under the back's heading", async () => {
    await show({ regionId: "fx_core" });
    expect(screen.getByText("Fixture back muscles credited here")).toBeTruthy();
    const sheet = await openSheetOf(/^Fixture quadratus lumborum/);
    expect(within(sheet).getByRole("button", { name: "Open the fixture back page" })).toBeTruthy();
  });
});

describe("a ledger row", () => {
  // Both sides are one count (owner, 20 Oct 2026): a row says what was done, never which side, hand or leg.
  const ledgerText = (sheet: HTMLElement) => sheet.textContent ?? "";
  it("names no side or hand for a one-hand carry on a region paired by the arm", async () => {
    await show({ regionId: "fx_back" });
    const sheet = await openSheetOf(/^Fixture quadratus lumborum/);
    expect(ledgerText(sheet)).toContain(byId(409).name);
    // "Nothing left out" is the suggestions' heading, not a side.
    expect(ledgerText(sheet)).not.toMatch(/\b(left(?! out)|right)\b|\bhand\b|opposite side|Both sides/i);
  });

  it("names no leg for a single-leg exercise on a region paired by the leg", async () => {
    await show({ regionId: "fx_thigh" });
    const sheet = await openSheetOf(/^Fixture hamstrings/);
    expect(ledgerText(sheet)).toContain(byId(188).name);
    expect(ledgerText(sheet)).not.toMatch(/\b(left(?! out)|right)\b|Standing leg|Both legs/i);
  });
});

