// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { goalProgressLabel, goalsForBothArms, isGoalActive } from "@shared/specialization/goals";
import { forearmActionIds, forearmMuscleIds } from "@shared/specialization/ids";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { ArmSide, GoalProgress, SpecializationGoal, SpecializationSummary } from "@shared/specialization/types";
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
function summaryFor(goals: readonly SpecializationGoal[], side: ArmSide): SpecializationSummary {
  const progress: GoalProgress[] = goals.filter((item) => item.side === side && isGoalActive(item, TODAY)).map((item) => {
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
function EditorHarness({ side = "right" as ArmSide }) {
  const { goals, save, remove } = useSpecializationGoals(null);
  const mine = goals.filter((item) => item.nodeId === BR);
  const progress = summaryFor(goals, side).goals.filter((item) => item.goal.nodeId === BR);
  return createElement(TargetsEditor, { regionId: "forearm", nodeId: BR, nodeName: "Brachioradialis", side, goals: mine, progress, timeZone: ZONE, todayKey: TODAY, onSave: save, onRemove: remove });
}

function OverviewHarness({ side = "right" as ArmSide, onOpenMuscle = (() => {}) as (nodeId: string) => void }) {
  const { goals, save, remove } = useSpecializationGoals(null);
  return createElement(TargetsOverview, { data: forearmRegionData, summary: summaryFor(goals, side), goals, side, timeZone: ZONE, todayKey: TODAY, onSave: save, onRemove: remove, onOpenMuscle });
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

  it("saves a target for both arms as two targets, one per arm, with nothing filled in but the muscle", async () => {
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: "Set a target" }));
    const form = screen.getByRole("group", { name: "New target for Brachioradialis" });
    expect((within(form).getByRole("spinbutton", { name: /Target/ }) as HTMLInputElement).value).toBe("");
    for (const control of [...within(form).getAllByRole("radio"), within(form).getByRole("spinbutton"), within(form).getByRole("combobox")]) {
      expect(control.closest("label")?.textContent?.trim(), "every input has a visible label").toBeTruthy();
    }
    await type(within(form).getByRole("spinbutton"), "20");
    await click(within(form).getByRole("button", { name: "Save target" }));
    expect(stored().map((item) => [item.side, item.target, item.nodeId, item.actionId, item.startsOn])).toEqual([["left", 20, BR, null, TODAY], ["right", 20, BR, null, TODAY]]);
    expect(screen.getByText(/3 of your 20/)).not.toBeNull();
    expect(status()).toContain("Saved: one target per arm for Brachioradialis.");
  });

  it("restores both arms with one Undo after removing the left and then the right", async () => {
    const [left, right] = goalsForBothArms(goal({ id: "pair" }));
    seed(left, right);
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^Remove the left-arm target/ }));
    await click(screen.getByRole("button", { name: /^Remove the right-arm target/ }));
    expect(stored()).toEqual([]);
    expect(status()).toContain("2 targets removed.");
    expect(screen.getByText("Not targeted.")).not.toBeNull();
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().map((item) => item.id).sort()).toEqual(["pair:left", "pair:right"]);
    expect(stored().find((item) => item.side === "left")).toEqual(left);
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(status()).toContain("2 targets restored.");
  });

  it("changes a target in place, keeping its id, arm, measure and period", async () => {
    seed(goal());
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^Change the right-arm target of 20 direct dynamic bouts/ }));
    const field = screen.getByRole("spinbutton", { name: /New target/ });
    expect((field as HTMLInputElement).value).toBe("20");
    await type(field, "24");
    await click(screen.getByRole("button", { name: "Save" }));
    const [saved] = stored();
    expect(saved).toEqual({ ...goal(), target: 24, updatedAt: "2026-10-16T12:00:00.000Z" });
    expect(status()).toContain("Right-arm target for Brachioradialis changed to 24 per calendar week.");
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("refuses a change to zero inline, and keeps the target", async () => {
    seed(goal());
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^Change the right-arm/ }));
    await type(screen.getByRole("spinbutton", { name: /New target/ }), "0");
    await click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toBe("Enter a target above zero.");
    expect(stored()[0].target).toBe(20);
  });

  it("ends a target so it stops counting from today, moves it under Ended, and Undo brings it back", async () => {
    seed(goal());
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: /^End the right-arm target/ }));
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
    await click(screen.getByRole("button", { name: /^End the right-arm target/ }));
    expect(stored()).toEqual([]);
    expect(screen.queryByText(/Ended targets/)).toBeNull();
    expect(status()).toContain("It started today, so it is removed rather than kept as ended.");
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored()).toEqual([goal({ startsOn: TODAY })]);
  });

  it("refuses an overlapping target with the reason, inline, and saves nothing", async () => {
    seed(goal({ startsOn: "2026-10-12" }));
    render(createElement(EditorHarness));
    await click(screen.getByRole("button", { name: "Set a target" }));
    await click(screen.getByRole("button", { name: "Right arm only" }));
    await type(screen.getByRole("spinbutton", { name: /Target/ }), "15");
    await click(screen.getByRole("button", { name: "Save target" }));
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("You already have a right-arm target of 20 direct dynamic bouts per calendar week for this");
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

  it("adds a movement target with the subject chosen, and shows its progress on this arm", async () => {
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
    await click(screen.getByRole("button", { name: "Right arm only" }));
    await click(screen.getByRole("button", { name: "Save target" }));
    expect(stored().map((item) => [item.actionId, item.nodeId, item.side, item.target])).toEqual([[ELBOW_FLEXION, null, "right", 20]]);
    const group = screen.getByText("Elbow flexion").closest("li")!;
    expect(within(group).getByText("Movement")).not.toBeNull();
    expect(within(group).getByText(/8 of your 20/)).not.toBeNull();
    expect(within(group).queryByRole("button", { name: /^Open/ })).toBeNull();
  });

  it("says Not targeted on an arm without a target, and opens the muscle", async () => {
    const onOpenMuscle = vi.fn();
    seed(goal({ side: "left" }));
    render(createElement(OverviewHarness, { side: "right", onOpenMuscle }));
    const group = screen.getByText("Brachioradialis").closest("li")!;
    expect(within(group).getByText("Not targeted on the right arm.")).not.toBeNull();
    expect(within(group).queryByText(/of your/)).toBeNull();
    await click(within(group).getByRole("button", { name: "Open Brachioradialis" }));
    expect(onOpenMuscle).toHaveBeenCalledWith(BR);
  });

  it("restores every removal since the last other change with one Undo, across subjects", async () => {
    const [left, right] = goalsForBothArms(goal({ id: "pair" }));
    const movement = goal({ id: "move", nodeId: null, actionId: ELBOW_FLEXION });
    seed(left, right, movement);
    render(createElement(OverviewHarness));
    await click(screen.getByRole("button", { name: /^Remove the left-arm target of 20 direct dynamic bouts for Brachioradialis/ }));
    await click(screen.getByRole("button", { name: /^Remove the right-arm target of 20 direct dynamic bouts for Brachioradialis/ }));
    await click(screen.getByRole("button", { name: /^End the right-arm target of 20 direct dynamic bouts for Elbow flexion/ }));
    expect(status()).toContain("2 targets removed and 1 ended.");
    expect(screen.getByText("Ended targets (1)")).not.toBeNull();
    await click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().sort((a, b) => a.id.localeCompare(b.id))).toEqual([movement, left, right]);
  });

  it("makes earlier removals final once another change is saved", async () => {
    seed(goal({ id: "a", side: "left" }), goal({ id: "b", side: "right" }));
    render(createElement(OverviewHarness));
    await click(screen.getByRole("button", { name: /^Remove the left-arm/ }));
    await click(screen.getByRole("button", { name: /^Change the right-arm/ }));
    await type(screen.getByRole("spinbutton", { name: /New target/ }), "30");
    await click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(stored()).toEqual([{ ...goal({ id: "b", side: "right" }), target: 30, updatedAt: "2026-10-16T12:00:00.000Z" }]);
  });
});
