// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { goalProgressLabel, goalsForBothArms, isGoalActive } from "@shared/specialization/goals";
import { forearmActionIds, forearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { ArmSide, SummarySide, GoalProgress, SpecializationGoal, SpecializationSummary } from "@shared/specialization/types";
import { loadSpecializationGoals, saveSpecializationGoals, useSpecializationGoals } from "@/lib/specialization/stores";
import { TargetsEditor } from "./TargetsEditor";
import { TargetsOverview, targetSubjectsFor } from "./TargetsOverview";

/**
 * Targets, rendered (brief §7): both arms saves two; removing both arms of a pair and one
 * Undo brings both back; a target is changed and ended in place, ended ones listed read-only;
 * a movement target is added from the overview and reads its progress; an arm without a
 * target says "Not targeted"; an overlapping target is refused with the reason, inline.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const TODAY = "2026-10-16";
const ZONE = "UTC";
const BR = forearmMuscleIds.brachioradialis;
const ELBOW_FLEXION = forearmActionIds.elbowFlexion;

const goal = (over: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id: "g1", regionId: "forearm", nodeId: BR, actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 20,
  period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: ZONE,
  createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z", ...over,
});
const seed = (...goals: SpecializationGoal[]) => saveSpecializationGoals(goals, null);
const stored = () => loadSpecializationGoals(null);

/** Work the summary reports this period, by subject: 8 bouts of elbow flexion, 3 for the brachioradialis. */
const values: Record<string, number> = { [ELBOW_FLEXION]: 8, [BR]: 3 };

/** A summary for one arm with each active target's progress, as the calculator shapes it. */
function summaryFor(goals: readonly SpecializationGoal[], side: SummarySide): SpecializationSummary {
  const progress: GoalProgress[] = goals.filter((item) => (side === "both" || item.side === side) && isGoalActive(item, TODAY)).map((item) => {
    const value = values[item.actionId ?? item.nodeId ?? ""] ?? 0;
    return { goal: item, value, fraction: value / item.target, label: goalProgressLabel(value, item) };
  });
  return {
    regionId: "forearm", interval: { kind: "calendar_week", startAt: null, endAtExclusive: null, timezone: ZONE, planWeek: null, label: "This week · 12–18 Oct" },
    side, mode: "completed", mappingVersion: "forearm_mappings_v1", ruleVersion: "specialization_exposure_v1", sourceRevision: "", planRevision: null,
    nodes: [], regionDistinctBouts: 0, regionUnknownSideBouts: 0, regionUnclassified: { bouts: 0, exercises: [] }, goals: progress,
    completeness: { boutsConsidered: 0, boutsWithReviewedMapping: 0, boutsPendingReview: 0, boutsRegionOnly: 0, boutsNameMatched: 0, boutsUnknownSide: 0, boutsExcluded: { notCompleted: 0, warmup: 0 } },
    calculatedAt: "2026-10-16T12:00:00.000Z",
  };
}

/** The muscle sheet's editor over the real device store, as the page wires it. */
/** The page counts both arms as one (20 Oct 2026), so the editor runs as the page runs it. */
function EditorHarness({ side = "both" as SummarySide }) {
  const { goals, save, remove } = useSpecializationGoals(null);
  const mine = goals.filter((item) => item.nodeId === BR);
  const progress = summaryFor(goals, side).goals.filter((item) => item.goal.nodeId === BR);
  return createElement(TargetsEditor, { region: forearmRegionData.region, nodeId: BR, nodeName: "Brachioradialis", canSet: true, side, goals: mine, progress, timeZone: ZONE, todayKey: TODAY, onSave: save, onRemove: remove });
}

function OverviewHarness({ side = "both" as SummarySide, onOpenMuscle = (() => {}) as (nodeId: string) => void, onOpenMovement = undefined as ((actionId: string) => void) | undefined, summaryOf = ((goals, arm) => summaryFor(goals, arm)) as (goals: readonly SpecializationGoal[], arm: SummarySide) => SpecializationSummary | null }) {
  const { goals, save, remove } = useSpecializationGoals(null);
  return createElement(TargetsOverview, { data: forearmRegionData, summary: summaryOf(goals, side), goals, side, timeZone: ZONE, todayKey: TODAY, onSave: save, onRemove: remove, onOpenMuscle, onOpenMovement });
}

const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const type = async (element: HTMLElement, value: string) => { await act(async () => { fireEvent.change(element, { target: { value } }); }); };
const status = () => screen.getAllByRole("status").map((element) => element.textContent).join(" ");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("the muscle sheet's targets", () => {
  it("says Not targeted, with no deficit, when the muscle has none", () => {
    render(createElement(EditorHarness));
    expect(screen.getByText("Not targeted.")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /^Change/ })).toBeNull();
  });

  it("saves one target for the muscle, with no arm to choose and nothing filled in but the muscle", async () => {
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: "Set a target" }));
    const form = screen.getByRole("group", { name: "New target for Brachioradialis" });
    expect((within(form).getByRole("spinbutton", { name: /Target/ }) as HTMLInputElement).value).toBe("");
    for (const control of [...within(form).getAllByRole("radio"), within(form).getByRole("spinbutton"), within(form).getByRole("combobox")]) {
      expect(control.closest("label")?.textContent?.trim(), "every input has a visible label").toBeTruthy();
    }
    expect(within(form).queryByText("Which arm")).toBeNull();
    await type(within(form).getByRole("spinbutton"), "20");
    await click(within(form).getByRole("button", { name: "Save target" }));
    // One target; its stored side is a placeholder nothing reads.
    expect(stored().map((item) => [item.target, item.nodeId, item.actionId, item.startsOn])).toEqual([[20, BR, null, TODAY]]);
    expect(screen.getByText(/3 of your 20/)).not.toBeNull();
    expect(status()).toContain("Saved: a target for Brachioradialis.");
  });

  it("reads an old target saved once per arm as one, and removes and restores it as one", async () => {
    const [left, right] = goalsForBothArms(goal({ id: "pair" }));
    seed(left, right);
    render(createElement(EditorHarness));
    expect(screen.getAllByRole("button", { name: /^Remove the target/ })).toHaveLength(1);
    await click(screen.getByRole("button", { name: /^Remove the target/ }));
    expect(stored()).toEqual([]);
    expect(status()).toContain("Target for Brachioradialis removed.");
    expect(screen.getByText("Not targeted.")).not.toBeNull();
    // The removed row held focus; Undo takes it, so it is one tap or keypress away.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" }));
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored()).toEqual([right]);
    expect(document.activeElement?.getAttribute("role")).toBe("status");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("changes a target in place, keeping its id, arm, measure and period", async () => {
    seed(goal());
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^Change the target of 20 direct dynamic bouts/ }));
    const field = screen.getByRole("spinbutton", { name: /New target/ });
    expect((field as HTMLInputElement).value).toBe("20");
    await type(field, "24");
    await click(screen.getByRole("button", { name: "Save" }));
    const [saved] = stored();
    expect(saved).toEqual({ ...goal(), target: 24, updatedAt: "2026-10-16T12:00:00.000Z" });
    expect(status()).toContain("Target for Brachioradialis changed to 24 per calendar week.");
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("refuses a change to zero inline, and keeps the target", async () => {
    seed(goal());
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^Change the target/ }));
    await type(screen.getByRole("spinbutton", { name: /New target/ }), "0");
    await click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toBe("Enter a target above zero.");
    expect(stored()[0].target).toBe(20);
  });

  it("ends a target so it stops counting from today, moves it under Ended, and Undo brings it back", async () => {
    seed(goal());
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^End the target/ }));
    expect(stored()[0]).toMatchObject({ id: "g1", endsOn: "2026-10-15", target: 20 });
    expect(screen.queryByRole("button", { name: /^Change/ })).toBeNull();
    expect(screen.getByText("Not targeted.")).not.toBeNull();
    const ended = screen.getByText("Ended targets (1)").closest("details")!;
    expect(within(ended).getByText(/1 Oct 2026 to 15 Oct 2026/)).not.toBeNull();
    expect(within(ended).queryByRole("button", { name: /Change|End|Remove/ })).toBeNull();
    expect(status()).toContain("stops counting from today");
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored()[0]).toEqual(goal());
    expect(screen.queryByText(/Ended targets/)).toBeNull();
  });

  it("removes a target that started today when it is ended, with Undo", async () => {
    seed(goal({ startsOn: TODAY }));
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^End the target/ }));
    expect(stored()).toEqual([]);
    expect(screen.queryByText(/Ended targets/)).toBeNull();
    expect(status()).toContain("It started today, so it is removed rather than kept as ended.");
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored()).toEqual([goal({ startsOn: TODAY })]);
  });

  it("removes a target that has not started yet when it is ended, and says so", async () => {
    seed(goal({ startsOn: "2026-10-19" }));
    render(createElement(EditorHarness));
    expect(screen.getByText(/starts 19 Oct 2026/)).not.toBeNull();
    await click(screen.getByRole("button", { name: /^End the target/ }));
    expect(stored()).toEqual([]);
    expect(status()).toContain("It had not started yet, so it is removed rather than kept as ended.");
  });

  it("brings Undo into view after a removal, since the message sits under the whole list", async () => {
    const scrolled: Element[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element) { scrolled.push(this); };
    try {
      seed(goal());
      render(createElement(EditorHarness));
      await click(screen.getByRole("button", { name: /^Remove the target/ }));
      const undo = screen.getByRole("button", { name: "Undo" });
      expect(document.activeElement).toBe(undo);
      expect(scrolled).toContain(undo);
      await click(undo);
      expect(scrolled[scrolled.length - 1]?.getAttribute("role")).toBe("status");
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it("lifts Undo clear of the bottom dock when it lands under it on screen (a phone at 390 × 844)", async () => {
    // Remove tapped at y = 480 with the Targets disclosure open: Undo is drawn at 795–839, under
    // the dock that starts at 774. Already on screen, so scrollIntoView and scroll-margin do nothing.
    const dock = document.createElement("nav");
    dock.className = "mobile-workspace-dock";
    document.body.appendChild(dock);
    const at = (top: number, height: number) => ({ top, bottom: top + height, left: 16, right: 374, width: 358, height, x: 16, y: top, toJSON: () => ({}) }) as DOMRect;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return this === dock ? at(774, 70) : this.textContent === "Undo" ? at(795, 44) : at(0, 0);
    });
    Object.defineProperty(window, "innerHeight", { value: 844, configurable: true });
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    try {
      seed(goal());
      render(createElement(OverviewHarness));
      await click(screen.getByRole("button", { name: /^Remove the target/ }));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" }));
      expect(scrollBy).toHaveBeenCalledWith({ top: 839 - (774 - 12), behavior: "instant" });
    } finally {
      vi.restoreAllMocks();
      dock.remove();
      Object.defineProperty(window, "innerHeight", { value: 768, configurable: true });
    }
  });

  it("keeps a pending Undo when Change is saved with the same number, and writes nothing", async () => {
    seed(goal({ id: "a", period: "rolling_7d" }), goal({ id: "b" }));
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^Remove the target of 20 direct dynamic bouts per rolling 7 days/ }));
    await click(screen.getByRole("button", { name: /^Change the target/ }));
    await click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(stored()).toEqual([goal({ id: "b" })]);
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().map((item) => item.id).sort()).toEqual(["a", "b"]);
  });

  it("gives each row's buttons a name of its own when two targets differ only by period or start", async () => {
    // The same arm, measure and number: per calendar week, per rolling 7 days until the 20th, and per rolling 7 days from the 21st.
    seed(goal({ id: "week" }), goal({ id: "now", period: "rolling_7d", endsOn: "2026-10-20" }), goal({ id: "next", period: "rolling_7d", startsOn: "2026-10-21" }));
    render(createElement(EditorHarness));
    const names = screen.getAllByRole("button", { name: /^Remove/ }).map((button) => button.getAttribute("aria-label"));
    expect(names).toEqual([
      "Remove the target of 20 direct dynamic bouts per calendar week for Brachioradialis",
      "Remove the target of 20 direct dynamic bouts per rolling 7 days for Brachioradialis",
      "Remove the target of 20 direct dynamic bouts per rolling 7 days starting 21 Oct 2026 for Brachioradialis",
    ]);
  });

  it("refuses an overlapping target with the reason, inline, and saves nothing", async () => {
    seed(goal({ startsOn: "2026-10-12" }));
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: "Set a target" }));
    await type(screen.getByRole("spinbutton", { name: /Target/ }), "15");
    await click(screen.getByRole("button", { name: "Save target" }));
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("You already have a target of 20 direct dynamic bouts per calendar week for this");
    expect(alert.textContent).toContain("Change that one, or end it before this one starts.");
    expect(alert.closest("form")).not.toBeNull();
    expect(stored()).toEqual([goal({ startsOn: "2026-10-12" })]);
  });
});

describe("the Targets overview", () => {
  it("offers the region's target muscles and only the movements a reviewed node action uses", () => {
    const { muscles, movements } = targetSubjectsFor(forearmRegionData);
    expect(muscles.map((item) => item.id)).toContain(BR);
    expect(muscles.every((item) => forearmRegionData.nodes.find((node) => node.id === item.id)?.role === "target")).toBe(true);
    const reviewed = new Set(forearmRegionData.claims.filter((claim) => claim.reviewStatus === "reviewed").map((claim) => claim.id));
    for (const movement of movements) {
      expect(forearmRegionData.nodeActions.some((row) => row.actionId === movement.id && reviewed.has(row.claimId)), movement.id).toBe(true);
    }
    expect(movements.map((item) => item.id)).toContain(ELBOW_FLEXION);
  });

  it("adds a movement target with the subject chosen, and shows its progress", async () => {
    render(createElement(OverviewHarness));
    expect(screen.getByText("No targets.")).not.toBeNull();
    await click(screen.getByRole("button", { name: "Add a target" }));
    const subject = screen.getByRole("combobox", { name: "Muscle or movement" }) as HTMLSelectElement;
    expect(subject.value).toBe("");
    await type(screen.getByRole("spinbutton", { name: /Target/ }), "20");
    await click(screen.getByRole("button", { name: "Save target" }));
    expect(screen.getByRole("alert").textContent).toBe("Choose a muscle or a movement.");
    expect(stored()).toEqual([]);
    await type(subject, `movement:${ELBOW_FLEXION}`);
    await click(screen.getByRole("button", { name: "Save target" }));
    expect(stored().map((item) => [item.actionId, item.nodeId, item.target])).toEqual([[ELBOW_FLEXION, null, 20]]);
    const group = screen.getByText("Elbow flexion").closest("li")!;
    expect(within(group).getByText("Movement")).not.toBeNull();
    expect(within(group).getByText(/8 of your 20/)).not.toBeNull();
    // Without a movement view to open, no Open is offered.
    expect(within(group).queryByRole("button", { name: /^Open/ })).toBeNull();
  });

  it("opens a movement target as the page wires it: the sets behind its number and exercises for it", async () => {
    const onOpenMovement = vi.fn();
    seed(goal({ id: "move", nodeId: null, actionId: ELBOW_FLEXION }));
    render(createElement(OverviewHarness, { onOpenMovement }));
    const group = screen.getByText("Elbow flexion").closest("li")!;
    await click(within(group).getByRole("button", { name: "Open Elbow flexion" }));
    expect(onOpenMovement).toHaveBeenCalledWith(ELBOW_FLEXION);
  });

  // Main (4dac1ae) kept this case for a one-arm overview it no longer shows ("Not targeted on the
  // right arm."). The reconciliation removes that sentence with every side word (10-multi-region.md,
  // appendix "Both sides as one"), so the case is what the page does: a target saved earlier for
  // one arm is the muscle's target, read for both, naming no arm.
  it("reads a target saved earlier for one arm as the muscle's, names no arm, and opens the muscle", async () => {
    const onOpenMuscle = vi.fn();
    seed(goal({ side: "left" }));
    render(createElement(OverviewHarness, { onOpenMuscle }));
    const group = screen.getByText("Brachioradialis").closest("li")!;
    expect(within(group).getByText(/3 of your 20/)).not.toBeNull();
    expect(group.textContent).not.toMatch(/\b(left|right)\b|Not targeted/i);
    await click(within(group).getByRole("button", { name: "Open Brachioradialis" }));
    expect(onOpenMuscle).toHaveBeenCalledWith(BR);
  });

  it("shows no progress while the summary is not ready, or when it is for the other arm", async () => {
    seed(goal({ id: "move", nodeId: null, actionId: ELBOW_FLEXION }));
    const { unmount } = render(createElement(OverviewHarness, { summaryOf: () => null }));
    const group = () => screen.getByText("Elbow flexion").closest("li")!;
    expect(within(group()).getByText(/20 per calendar week/)).not.toBeNull();
    expect(within(group()).queryByText(/of your/)).toBeNull();
    unmount();
    render(createElement(OverviewHarness, { summaryOf: (goals) => summaryFor(goals, "left") }));
    expect(within(group()).queryByText(/of your/)).toBeNull();
  });

  it("restores every removal since the last other change with one Undo, across subjects", async () => {
    const weekly = goal({ id: "weekly" });
    const rolling = goal({ id: "rolling", period: "rolling_7d" });
    const movement = goal({ id: "move", nodeId: null, actionId: ELBOW_FLEXION });
    seed(weekly, rolling, movement);
    render(createElement(OverviewHarness));
    await click(screen.getByRole("button", { name: /^Remove the target of 20 direct dynamic bouts per calendar week for Brachioradialis/ }));
    await click(screen.getByRole("button", { name: /^Remove the target of 20 direct dynamic bouts per rolling 7 days for Brachioradialis/ }));
    await click(screen.getByRole("button", { name: /^End the target of 20 direct dynamic bouts per calendar week for Elbow flexion/ }));
    expect(status()).toContain("2 targets removed and 1 ended.");
    expect(screen.getByText("Ended targets (1)")).not.toBeNull();
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().sort((a, b) => a.id.localeCompare(b.id))).toEqual([movement, rolling, weekly]);
  });

  it("makes earlier removals final once another change is saved", async () => {
    seed(goal({ id: "a", period: "rolling_7d" }), goal({ id: "b" }));
    render(createElement(OverviewHarness));
    await click(screen.getByRole("button", { name: /^Remove the target of 20 direct dynamic bouts per rolling 7 days/ }));
    await click(screen.getByRole("button", { name: /^Change the target/ }));
    await type(screen.getByRole("spinbutton", { name: /New target/ }), "30");
    await click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(stored()).toEqual([{ ...goal({ id: "b" }), target: 30, updatedAt: "2026-10-16T12:00:00.000Z" }]);
  });
});
