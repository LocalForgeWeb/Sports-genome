// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { loadSpecializationGoals, saveSpecializationGoals } from "@/lib/specialization/stores";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";
import type { SpecializationGoal } from "@shared/specialization/types";
import { SpecializationPanel } from "./SpecializationPanel";

/**
 * Targets saved before targets were limited to a region's target muscles (10-multi-region.md §2.2;
 * critic experiment c7): on the forearm page, one on the anconeus (adjacent) and one on the biceps
 * (the upper arm's, listed here as external). Each is shown read-only, with End and Remove, and
 * CLAUDE.md's "Undo over confirm" holds for both: the Undo offered after End or Remove puts the
 * target back exactly as it was, although a new target on that muscle would be refused. In the
 * muscle sheet the Undo stays, with focus on it, after the muscle's last target is removed.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const READ_ONLY = "Targets are for this region's target muscles. You can end or remove this one.";
const slots = buildDaySlots(["Pull"]);

function Harness() {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), limb: "right" });
  return createElement(SpecializationPanel, {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: emptyDayStore() }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Athleticism", weightUnit: "kg",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onInspectExercise: () => {}, onOpenSession: () => {},
    backLabel: null, onBack: null,
  });
}

const goal = (id: string, nodeId: string, over: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id, regionId: "forearm", nodeId, actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 4, period: "calendar_week",
  startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z", ...over,
});
const anconeus = goal("anc", "forearm.anconeus");
const biceps = goal("bic", "upper_arm.biceps");
const stored = () => loadSpecializationGoals(null);
const storedOf = (id: string) => stored().find((item) => item.id === id) ?? null;

const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const alerts = () => screen.queryAllByRole("alert").map((element) => element.textContent);

/** The muscle's sheet, from its row in the list. */
async function sheetOf(name: RegExp): Promise<HTMLElement> {
  await click(screen.getAllByRole("button").find((button) => button.classList.contains("spz-row") && name.test(button.getAttribute("aria-label") ?? ""))!);
  return screen.getByRole("dialog");
}
/** The page's Targets disclosure, opened. */
async function overview(): Promise<HTMLElement> {
  const details = screen.getByText("Targets").closest("details")!;
  await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
  return details;
}

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("a target on a muscle that is not a target here, in its muscle sheet", () => {
  for (const [label, saved, row] of [["the anconeus (adjacent)", anconeus, /^Anconeus,/], ["the biceps (external)", biceps, /^Biceps brachii,/]] as const) {
    it(`${label}: End, then Undo, puts it back as it was`, async () => {
      saveSpecializationGoals([saved], null);
      render(createElement(Harness));
      const sheet = await sheetOf(row);
      expect(within(sheet).getByText(READ_ONLY)).toBeTruthy();
      expect(within(sheet).queryByRole("button", { name: /^Change/ })).toBeNull();
      await click(within(sheet).getByRole("button", { name: /^End the right-arm target/ }));
      expect(storedOf(saved.id)?.endsOn).toBe("2026-10-15");
      const undo = within(sheet).getByRole("button", { name: "Undo" });
      expect(document.activeElement).toBe(undo);
      await click(undo);
      expect(alerts()).toEqual([]);
      expect(stored()).toEqual([saved]);
      expect(within(sheet).getByRole("status").textContent).toBe("Target restored.");
      expect(within(sheet).getByRole("button", { name: /^End the right-arm target/ })).toBeTruthy();
    });

    it(`${label}: Remove keeps the message and its Undo in the sheet, with focus on Undo, and Undo puts it back`, async () => {
      saveSpecializationGoals([saved], null);
      render(createElement(Harness));
      const sheet = await sheetOf(row);
      await click(within(sheet).getByRole("button", { name: /^Remove the right-arm target/ }));
      expect(stored()).toEqual([]);
      expect(within(sheet).getByRole("status").textContent).toMatch(/^Right-arm target for .+ removed\.$/);
      const undo = within(sheet).getByRole("button", { name: "Undo" });
      expect(document.activeElement).toBe(undo);
      // Still no way to set a new one here.
      expect(within(sheet).queryByRole("button", { name: /Set a target/ })).toBeNull();
      await click(undo);
      expect(alerts()).toEqual([]);
      expect(stored()).toEqual([saved]);
      expect(within(sheet).getByText(READ_ONLY)).toBeTruthy();
    });
  }

  it("End on one that started today removes it, and the Undo stays to put it back", async () => {
    const today = goal("anc-today", "forearm.anconeus", { startsOn: "2026-10-16" });
    saveSpecializationGoals([today], null);
    render(createElement(Harness));
    const sheet = await sheetOf(/^Anconeus,/);
    await click(within(sheet).getByRole("button", { name: /^End the right-arm target/ }));
    expect(stored()).toEqual([]);
    expect(within(sheet).getByRole("status").textContent).toContain("It started today, so it is removed rather than kept as ended.");
    await click(within(sheet).getByRole("button", { name: "Undo" }));
    expect(alerts()).toEqual([]);
    expect(stored()).toEqual([today]);
  });

  it("still refuses a new target on that muscle: only what was there comes back", async () => {
    saveSpecializationGoals([biceps], null);
    render(createElement(Harness));
    const sheet = await sheetOf(/^Biceps brachii,/);
    await click(within(sheet).getByRole("button", { name: /^Remove the right-arm target/ }));
    await click(within(sheet).getByRole("button", { name: "Undo" }));
    expect(stored().map((item) => item.id)).toEqual(["bic"]);
    expect(within(sheet).queryByRole("button", { name: /Set a target/ })).toBeNull();
  });
});

describe("a target on a muscle that is not a target here, in the Targets overview", () => {
  for (const action of ["End", "Remove"] as const) {
    it(`${action} on the biceps and on the anconeus, then one Undo, puts both back`, async () => {
      saveSpecializationGoals([anconeus, biceps], null);
      render(createElement(Harness));
      const targets = await overview();
      expect(within(targets).getAllByText(READ_ONLY).length).toBe(2);
      await click(within(targets).getByRole("button", { name: new RegExp(`^${action} the right-arm target of 4 direct dynamic bouts per calendar week for Biceps brachii`) }));
      await click(within(targets).getByRole("button", { name: new RegExp(`^${action} the right-arm target of 4 direct dynamic bouts per calendar week for Anconeus`) }));
      expect(within(targets).getByRole("status").textContent).toBe(action === "End" ? "2 targets ended." : "2 targets removed.");
      await click(within(targets).getByRole("button", { name: "Undo" }));
      expect(alerts()).toEqual([]);
      expect(stored().sort((left, right) => left.id.localeCompare(right.id))).toEqual([anconeus, biceps]);
      expect(within(targets).getByRole("status").textContent).toBe("2 targets restored.");
    });
  }
});

describe("a target on a muscle that is not a target here, in Coverage to review", () => {
  /** This week: a wrist curl, and a one-arm wrist curl logged with no arm, so the page has a finding about the records. */
  const week = [{
    id: "w", title: "Pull", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
    exercises: [
      { id: "e1", exerciseName: exercises.find((exercise) => exercise.id === 139)!.name, catalogId: 139, plannedPrescription: "3 × 12", sets: [1, 2, 3].map(() => ({ weight: "20", reps: "12", unit: "kg", completed: true })) },
      { id: "e2", exerciseName: exercises.find((exercise) => exercise.id === 410)!.name, catalogId: 410, plannedPrescription: "1 × 12", sets: [{ weight: "8", reps: "12", unit: "kg", completed: true }] },
    ],
  }];
  const findingTitles = () => Array.from(document.querySelectorAll(".spz-finding strong")).map((item) => item.textContent);
  const findingOf = (title: string) => Array.from(document.querySelectorAll<HTMLElement>(".spz-finding")).find((item) => item.querySelector("strong")?.textContent === title)!;

  it("is said last, once per muscle, as one to end or remove, never as a target behind with exercises for it", async () => {
    window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(week));
    saveSpecializationGoals([biceps, anconeus, goal("anc-holds", "forearm.anconeus", { metric: "deliberate_hold_bouts", target: 2 }), goal("fcr", "forearm.fcr", { target: 6 })], null);
    render(createElement(Harness));
    await act(async () => {});
    const more = screen.queryByRole("button", { name: /^Show \d+ more$/ });
    if (more) await click(more);
    // A target on a target muscle leads; the records' findings follow; the targets saved earlier come last, once per muscle.
    expect(findingTitles()).toEqual([
      "Flexor carpi radialis: 3 of your 6",
      "1 set with no arm recorded",
      "Biceps brachii: a target saved earlier",
      "Anconeus: a target saved earlier",
    ]);
    for (const title of ["Biceps brachii: a target saved earlier", "Anconeus: a target saved earlier"]) {
      expect(findingOf(title).querySelector("p")?.textContent).toBe(READ_ONLY);
      expect(within(findingOf(title)).getByRole("button").textContent?.trim()).toBe("End or remove it");
    }
    expect(screen.getAllByRole("button", { name: /^See exercises for it/ })).toHaveLength(1);
    // Its action opens the muscle's sheet at its targets, which can be ended or removed there.
    await click(within(findingOf("Anconeus: a target saved earlier")).getByRole("button"));
    const sheet = screen.getByRole("dialog", { name: "Anconeus" });
    expect(within(sheet).getByText(READ_ONLY)).toBeTruthy();
    expect(within(sheet).getAllByRole("button", { name: /^End the right-arm target/ })).toHaveLength(2);
  });

  it("says nothing can be counted for a muscle with no mapping, never 0 of the target: in the strip, the sheet and the Targets overview", async () => {
    window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(week));
    saveSpecializationGoals([anconeus, biceps], null);
    render(createElement(Harness));
    await act(async () => {});
    const sheet = await sheetOf(/^Anconeus,/);
    expect(within(sheet).getByText("No exercise is mapped to this muscle yet, so there is nothing to count. That is missing mapping, not missing training.")).toBeTruthy();
    expect(within(sheet).getByText(/4 per calendar week · cannot be counted yet/)).toBeTruthy();
    expect(sheet.textContent).not.toMatch(/0 of your 4/);
    await click(within(sheet).getByRole("button", { name: /^Close/ }));
    expect(document.querySelector(".spz-strip-goal")?.textContent).toBe("Direct bouts: cannot be counted yet");
    // The biceps is counted here (the forearm's own rows credit it until the upper arm has a version): its target reads as a count.
    await sheetOf(/^Biceps brachii,/);
    await click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Close/ }));
    expect(document.querySelector(".spz-strip-goal")?.textContent).toMatch(/^Direct bouts: \d+ of your 4$/);
    const targets = await overview();
    expect(within(targets).getByText(/4 per calendar week · cannot be counted yet/)).toBeTruthy();
    expect(within(targets).getAllByText(/of your 4/)).toHaveLength(1);
  });
});
