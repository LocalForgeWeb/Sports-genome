// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { specializationGoalsKeyBase } from "@/lib/specialization/stores";
import { specializationExclusionsKeyBase } from "@/lib/specialization/exclusions";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { buildDaySlots, commitDay, emptyDayStore } from "@/lib/trainingDayPlan";
import { parseSetCount } from "@/lib/sessionVolume";
import { getGoalPrescription } from "@/lib/workoutPlanner";

/**
 * The specialization page, rendered (design §7): the list and the sheet say the same thing,
 * a muscle without a target is "Not targeted", a target for both arms is two targets, and an
 * add is previewed in planned totals and handed to Home as one exact day.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(["Push", "Pull", "Legs"]);
const store = commitDay(commitDay(emptyDayStore(), slots[0].key, { workout: [byId(1), byId(139)], prescriptions: {}, settings: {}, context: [] }), slots[1].key, { workout: [byId(45), byId(132)], prescriptions: {}, settings: {}, context: [] });
const set = (weight: number, reps: number) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const sessions = [{
  id: "s-tue", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-13T17:00:00.000Z", completedAt: "2026-10-13T18:00:00.000Z", status: "completed",
  exercises: [{ id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] }],
}];

let lastState: SpecializationViewState | null = null;
function Harness(props: { initial?: Partial<SpecializationViewState>; onApply?: SpecializationPanelProps["onApplyPlanChange"] }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...props.initial });
  lastState = state;
  return createElement(SpecializationPanel, {
    state,
    onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1 },
    catalog: exercises,
    equipmentProfile: defaultEquipmentProfile,
    accountId: null,
    goal: "Athleticism",
    weightUnit: "lb",
    onApplyPlanChange: props.onApply ?? (() => ({ ok: true, undo: () => {} })),
    onInspectExercise: () => {},
    onOpenSession: () => {},
    backLabel: null,
    onBack: null,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const row = (name: RegExp) => screen.getByRole("button", { name });

describe("the specialization page", () => {
  it("lists the muscles with what this week's logged work gave them", () => {
    render(createElement(Harness));
    expect(screen.getByRole("heading", { level: 1, name: "Forearm specialization" })).not.toBeNull();
    // Three two-handed hammer curls: three direct bouts for the right arm, never six.
    expect(row(/^Brachioradialis, Surface\. 3 direct dynamic bouts/)).not.toBeNull();
    expect(screen.getByText(/3 distinct bouts touched the forearms on the right arm/)).not.toBeNull();
  });

  it("opens a muscle's sheet from the list, in the brief's order, and says Not targeted rather than a gap", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(row(/^Brachioradialis,/)); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const headings = within(sheet).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["What it does", "How it contributes to shape", "Completed · This week · 12–18 Oct · right arm", "Where the numbers come from", "Your target", "Exercises for this muscle", "Sources and method"]);
    expect(within(sheet).getByText("Not targeted.")).not.toBeNull();
    expect(within(sheet).getByText("Hammer Curl")).not.toBeNull();
    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("saves a target for both arms as two targets, one per arm", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Set a target/ })); });
    await act(async () => { fireEvent.change(within(sheet).getByRole("spinbutton"), { target: { value: "20" } }); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save target" })); });
    const saved = JSON.parse(window.localStorage.getItem(specializationGoalsKeyBase) ?? "[]");
    expect(saved.map((goal: { side: string; target: number; nodeId: string }) => [goal.side, goal.target, goal.nodeId])).toEqual([["left", 20, "forearm.br"], ["right", 20, "forearm.br"]]);
    // The right arm's progress, on this muscle's right-arm target row.
    expect(within(sheet).getAllByText(/3 of your 20/).length).toBeGreaterThan(0);
  });

  it("previews an add in planned totals and hands Home one exact day", async () => {
    const onApply = vi.fn(() => ({ ok: true as const, undo: () => {} }));
    render(createElement(Harness, { initial: { nodeId: "forearm.br" }, onApply }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const first = within(screen.getByRole("dialog")).getAllByRole("button", { name: /Add or swap/ })[0];
    await act(async () => { fireEvent.click(first); });
    const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ })); });
    expect(within(sheet).getByRole("heading", { name: "Planned totals, Week 1, right arm" })).not.toBeNull();
    const focus = sheet.querySelector(".spz-preview-list li[data-focus]");
    expect(focus?.textContent).toMatch(/^Brachioradialis/);
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatchObject({ week: 1, dayKey: slots[2].key, slotIndex: 2 });
    expect(onApply.mock.calls[0][0]).not.toHaveProperty("replaceEntryId");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the sheet open with Home's reason when the change is refused", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" }, onApply: () => ({ ok: false, reason: "Your plan is still loading, so nothing was changed." }) }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    await act(async () => { fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: /Add or swap/ })[0]); });
    const sheet = screen.getByRole("dialog", { name: "Add to your plan" });
    // The day is the athlete's to choose: Save waits for it.
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ })); });
    await act(async () => { fireEvent.click(within(sheet).getByRole("button", { name: "Save to plan" })); });
    expect(within(sheet).getByRole("alert").textContent).toBe("Your plan is still loading, so nothing was changed.");
  });

  it("switches arm and mode through the page state, and reads the plan as written in planned mode", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Planned" })); });
    expect(screen.getByText("Plan Week 1, as written")).not.toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Left arm" })); });
    expect(screen.getByRole("button", { name: "Left arm" }).getAttribute("aria-pressed")).toBe("true");
    // Planned: Hammer Curl's sets as the goal's default prescription writes them for its place in the day, on each arm.
    const planned = parseSetCount(getGoalPrescription("Athleticism", 1));
    expect(row(new RegExp(`^Brachioradialis, Surface\\. ${planned} direct dynamic bouts`))).not.toBeNull();
  });
  it("starts an add from Add targeted exercise when the muscle has no work", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.fcr" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Add targeted exercise/ })); });
    expect(screen.getByRole("dialog", { name: "Add to your plan" })).not.toBeNull();
  });

  it("leaves an exercise out of suggestions with Not for me, and Undo brings it back", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.br" } }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Brachioradialis" });
    const first = within(sheet).getAllByRole("button", { name: /^Do not suggest / })[0];
    const name = first.getAttribute("aria-label")!.replace("Do not suggest ", "");
    await act(async () => { fireEvent.click(first); });
    expect(within(sheet).queryByRole("button", { name: `Do not suggest ${name}` })).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(specializationExclusionsKeyBase) ?? "{}").catalogExerciseIds).toHaveLength(1);
    const notice = within(sheet).getAllByRole("status").find((element) => element.textContent?.startsWith(`${name} will not be suggested`))!;
    expect(notice).toBeTruthy();
    await act(async () => { fireEvent.click(within(notice).getByRole("button", { name: "Undo" })); });
    expect(within(sheet).getByRole("button", { name: `Do not suggest ${name}` })).not.toBeNull();
  });

  it("sets this week's logged work beside the plan week as written", () => {
    render(createElement(Harness));
    const line = document.querySelector(".spz-window")!.textContent!;
    expect(line).toMatch(/^This week · \d+–\d+ Oct · right arm: 3 bouts logged for the forearms · \d+ planned in Plan Week 1$/);
  });

  it("drops a muscle the region does not have from the address", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.nonexistent" } }));
    await act(async () => {});
    expect(lastState?.nodeId).toBeNull();
  });
});
