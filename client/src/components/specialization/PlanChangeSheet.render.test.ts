// @vitest-environment jsdom
import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { applyPlanChangeToRecord } from "@/lib/specialization/planChange";
import type { RecommendationCandidate } from "@/lib/specialization/recommendations";
import type { SpecializationPlanChange } from "@/lib/specialization/viewState";
import { buildDaySlots, commitDay, emptyDayStore, loadDay, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription } from "@/lib/workoutPlanner";
import { regionDataFor } from "@shared/specialization/registry";
import { PlanChangeSheet } from "./PlanChangeSheet";
import { SpecializationSheet } from "./SpecializationSheet";

/**
 * The add-or-swap sheet (brief §7, "Choose exact week/day and exercise slot before save"):
 * the athlete chooses the day before Save, the slot of an add reaches Home, "already in"
 * names the week chosen here, rewording the title keeps focus where it was, and Save hands
 * Home exactly the change the preview ran.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const data = regionDataFor("forearm")!;
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(["Push", "Pull", "Legs"]);
const dayOf = (ids: number[]) => ({ workout: ids.map(byId), prescriptions: {}, settings: {}, context: [] });
const weekOf = (days: Record<number, number[]>): WeeklyDayStore => Object.entries(days).reduce((store, [index, ids]) => commitDay(store, slots[Number(index)].key, dayOf(ids)), emptyDayStore());
// Week 1 has Hammer Curl on Pull; week 2 has Reverse Wrist Curl on Legs instead.
const weeks = {
  1: weekOf({ 0: [1, 139], 1: [45, 132] }),
  2: weekOf({ 0: [1], 1: [45], 2: [140] }),
};
const candidate = (id: number, alreadyPlanned: boolean): RecommendationCandidate => ({
  catalogExerciseId: id, name: byId(id).name, variantId: `v${id}`, equipment: byId(id).equipment ?? null, relevance: "direct_dynamic",
  mappingIds: [], equipmentAvailable: true, alreadyPlanned, laterality: "bilateral", why: "", alsoLoads: [],
});
// As the page computes them for its own week (week 1): Hammer Curl planned, Reverse Wrist Curl not.
const candidates = [candidate(132, true), candidate(140, false)];

function open(options: { week?: number; initialExerciseId?: number; onApply?: (change: SpecializationPlanChange) => { ok: true; undo: () => void } | { ok: false; reason: string } } = {}) {
  const onApply = vi.fn(options.onApply ?? (() => ({ ok: true as const, undo: () => {} })));
  const onClose = vi.fn();
  render(createElement(PlanChangeSheet, {
    data, side: "right", nodeId: "forearm.br", candidates, initialExerciseId: options.initialExerciseId ?? 140, catalog: exercises,
    plan: { slots, weeks, week: options.week ?? 1 }, goal: "Athleticism", onApply, onClose,
  }));
  return { sheet: screen.getByRole("dialog"), onApply, onClose };
}
const click = (element: Element) => act(async () => { fireEvent.click(element); });
const save = (sheet: HTMLElement) => within(sheet).getByRole("button", { name: /^Save/ }) as HTMLButtonElement;
const where = (sheet: HTMLElement) => sheet.querySelector(".spz-change-where")!.textContent;
const detailOf = (sheet: HTMLElement, name: string) => within(sheet).getAllByRole("radio").map((radio) => radio.closest("label")!).find((label) => label.querySelector("b")?.textContent === name)!.querySelector("small")?.textContent ?? "";

afterEach(() => { cleanup(); });

describe("the add-or-swap sheet", () => {
  it("starts on the page's week, named under the title, and waits for the athlete to choose the day before Save", async () => {
    const { sheet, onApply } = open({ week: 2 });
    expect(within(sheet).getByRole("button", { name: "Week 2" }).getAttribute("aria-pressed")).toBe("true");
    expect(where(sheet)).toBe("Week 2 · Choose a day");
    // No day is chosen for the athlete.
    for (const slot of slots) expect(within(sheet).getByRole("button", { name: new RegExp(slot.label) }).getAttribute("aria-pressed")).toBe("false");
    expect(save(sheet).disabled).toBe(true);
    expect(within(sheet).getByText("Choose a day")).not.toBeNull();
    expect(save(sheet).getAttribute("aria-describedby")).toBe("spz-change-hint");
    await click(save(sheet));
    expect(onApply).not.toHaveBeenCalled();

    await click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ }));
    expect(save(sheet).disabled).toBe(false);
    expect(within(sheet).queryByText("Choose a day")).toBeNull();
    expect(where(sheet)).toBe("Week 2 · Day 02 · Pull · At the end");
  });

  it("hands Home exactly the change it previewed: the week and day chosen, no slot for the end, and no prescription", async () => {
    const { sheet, onApply, onClose } = open();
    await click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ }));
    // An empty day: the add is its only exercise, so there is no slot to choose.
    expect(within(sheet).queryByRole("group", { name: "Where it goes" })).toBeNull();
    expect(within(sheet).getByText("Day 03 · Legs is empty, so this adds it as the day's only exercise.")).not.toBeNull();
    await click(save(sheet));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toEqual({ week: 1, slotIndex: 2, dayKey: slots[2].key, catalogExerciseId: 140 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers the slot of an add once the day is chosen, and the slot reaches Home as insertAt", async () => {
    const choose = async (option: string | null) => {
      const { sheet, onApply } = open();
      await click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ }));
      const slotGroup = within(sheet).getByRole("group", { name: "Where it goes" });
      const radios = within(slotGroup).getAllByRole("radio").map((radio) => radio.closest("label")!.querySelector("b")!.textContent);
      expect(radios).toEqual(["First", "After Underhand Barbell Row", "At the end"]);
      expect((within(slotGroup).getByRole("radio", { name: /At the end/ }) as HTMLInputElement).checked).toBe(true);
      if (option) await click(within(slotGroup).getByRole("radio", { name: new RegExp(`^${option}`) }));
      const shown = { where: where(sheet), plannedAs: within(sheet).getByText(/^Planned as /).textContent, moved: within(sheet).queryAllByText(/moves down a place/).map((note) => note.textContent) };
      await click(save(sheet));
      const sent = onApply.mock.calls[0][0];
      cleanup();
      return { sent, ...shown };
    };
    const first = await choose("First");
    expect(first.sent).toEqual({ week: 1, slotIndex: 1, dayKey: slots[1].key, catalogExerciseId: 140, insertAt: 0 });
    expect(first.where).toBe("Week 1 · Day 02 · Pull · First");
    // The slot sets what it is planned as: the goal's default for that place, pinned by nothing.
    expect(first.plannedAs).toBe(`Planned as ${getGoalPrescription("Athleticism", 0)}, the default for that place in the day.`);
    // Hammer Curl, with no prescription of its own, moves from the second place to the third, whose default differs: said, not hidden.
    const moved = `Hammer Curl moves down a place, so it is planned as ${getGoalPrescription("Athleticism", 2)} instead of ${getGoalPrescription("Athleticism", 1)}.`;
    expect(first.moved).toEqual([moved]);
    const middle = await choose("After Underhand Barbell Row");
    expect(middle.sent).toEqual({ week: 1, slotIndex: 1, dayKey: slots[1].key, catalogExerciseId: 140, insertAt: 1 });
    expect(middle.where).toBe("Week 1 · Day 02 · Pull · After Underhand Barbell Row");
    expect(middle.moved).toEqual([moved]);
    const end = await choose(null);
    expect(end.sent).toEqual({ week: 1, slotIndex: 1, dayKey: slots[1].key, catalogExerciseId: 140 });
    expect(end.plannedAs).toBe(`Planned as ${getGoalPrescription("Athleticism", 2)}, the default for that place in the day.`);
    expect(end.moved).toEqual([]);
  });

  it("says what is already planned in the week chosen in the sheet, not the page's week", async () => {
    const { sheet } = open({ initialExerciseId: 141 });
    expect(detailOf(sheet, "Hammer Curl")).toBe("Free weights · already in Week 1 (Day 02 · Pull)");
    expect(detailOf(sheet, "Reverse Wrist Curl")).toBe("Barbell");
    await click(within(sheet).getByRole("button", { name: "Week 2" }));
    // Hammer Curl is not in week 2 (the candidate's own flag still says the page's week has it).
    expect(detailOf(sheet, "Hammer Curl")).toBe("Free weights");
    expect(detailOf(sheet, "Reverse Wrist Curl")).toBe("Barbell · already in Week 2 (Day 03 · Legs)");
    expect(where(sheet)).toBe("Week 2 · Choose a day");
  });

  it("keeps focus on Swap one out when pressing it rewords the title", async () => {
    const { sheet } = open();
    // On open the heading has focus.
    expect(document.activeElement).toBe(within(sheet).getByRole("heading", { level: 2 }));
    await click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ }));
    const swap = within(sheet).getByRole("button", { name: "Swap one out" });
    swap.focus();
    await click(swap);
    expect(screen.getByRole("dialog", { name: "Swap into your plan" })).toBe(sheet);
    expect(document.activeElement).toBe(swap);
  });

  it("swaps one out in its place: Save waits for the choice, then hands Home the entry it replaces", async () => {
    const { sheet, onApply } = open();
    await click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ }));
    await click(within(sheet).getByRole("button", { name: "Swap one out" }));
    expect(save(sheet).disabled).toBe(true);
    expect(within(sheet).getByText("Choose the exercise to swap out")).not.toBeNull();
    expect(where(sheet)).toBe("Week 1 · Day 02 · Pull · Choose one to swap out");
    await click(within(within(sheet).getByRole("group", { name: "Swap out" })).getByRole("radio", { name: /^Hammer Curl/ }));
    expect(where(sheet)).toBe("Week 1 · Day 02 · Pull · In place of Hammer Curl");
    await click(save(sheet));
    expect(onApply.mock.calls[0][0]).toEqual({ week: 1, slotIndex: 1, dayKey: slots[1].key, catalogExerciseId: 140, replaceEntryId: 132 });
  });

  it("previews on the record Home would write, so a swap of an unprescribed exercise keeps its sets", async () => {
    // Home's side of Save: the same pure edit on the same day.
    let written: ReturnType<typeof applyPlanChangeToRecord> | null = null;
    const { sheet } = open({ onApply: (change) => { written = applyPlanChangeToRecord(loadDay(weeks[1], change.dayKey), change, byId(change.catalogExerciseId)); return { ok: true, undo: () => {} }; } });
    await click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ }));
    await click(within(sheet).getByRole("button", { name: "Swap one out" }));
    await click(within(within(sheet).getByRole("group", { name: "Swap out" })).getByRole("radio", { name: /^Underhand Barbell Row/ }));
    const row = (name: string) => {
      const item = Array.from(sheet.querySelectorAll(".spz-preview-list li")).find((li) => li.querySelector("b")?.textContent === name);
      return item?.querySelector("span")?.textContent?.replace(/\s+/g, " ").trim();
    };
    // Reverse Wrist Curl takes the first place's default sets (4 × 3–6: four bouts), as the
    // Underhand Barbell Row it replaces had; pinned to the day's last place it read as three.
    const sets = Number.parseInt(getGoalPrescription("Athleticism", 0), 10);
    expect(sets).not.toBe(Number.parseInt(getGoalPrescription("Athleticism", 2), 10));
    expect(row("Extensor carpi radialis longus")).toBe(`none ${sets} direct`);
    expect(row("Distinct bouts in the forearms")).toBe("12 12");
    await click(save(sheet));
    expect(written).not.toBeNull();
    const outcome = written as unknown as Extract<ReturnType<typeof applyPlanChangeToRecord>, { ok: true }>;
    expect(outcome.ok).toBe(true);
    expect(outcome.record.workout.map((exercise) => exercise.id)).toEqual([140, 132]);
    expect(outcome.record.prescriptions).toEqual({});
  });

  it("says beside a disabled Save why a change cannot be saved, not only further down in the preview", async () => {
    const { sheet, onApply } = open({ initialExerciseId: 132 });
    // Hammer Curl is already on Pull in week 1.
    await click(within(sheet).getByRole("button", { name: /Day 02 · Pull/ }));
    expect(save(sheet).disabled).toBe(true);
    const hint = sheet.querySelector(".spz-sheet-foot #spz-change-hint");
    expect(hint?.textContent).toBe("Hammer Curl is already in that day.");
    expect(save(sheet).getAttribute("aria-describedby")).toBe("spz-change-hint");
    await click(save(sheet));
    expect(onApply).not.toHaveBeenCalled();
    // Another day takes it: Save is ready and the hint is gone.
    await click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ }));
    expect(save(sheet).disabled).toBe(false);
    expect(sheet.querySelector("#spz-change-hint")).toBeNull();
  });

  it("keeps the sheet open with Home's reason when the change is refused", async () => {
    const { sheet, onClose } = open({ onApply: () => ({ ok: false, reason: "Week 1 is not built yet. Build it in Plan first." }) });
    await click(within(sheet).getByRole("button", { name: /Day 03 · Legs/ }));
    await click(save(sheet));
    expect(within(sheet).getByRole("alert").textContent).toBe("Week 1 is not built yet. Build it in Plan first.");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("the page's sheet", () => {
  const sheetWith = (props: { title: string; focusKey?: string; footer?: boolean }) => createElement(SpecializationSheet, {
    id: "t", eyebrow: "Eyebrow", title: props.title, focusKey: props.focusKey, onClose: () => {},
    footer: props.footer ? createElement("button", { type: "button" }, "Save") : undefined,
    children: createElement("button", { type: "button" }, "Inside"),
  });

  it("refocuses its heading when its subject changes, not when its title is reworded", () => {
    const { rerender } = render(sheetWith({ title: "Add to your plan", focusKey: "forearm.br" }));
    const inside = screen.getByRole("button", { name: "Inside" });
    inside.focus();
    rerender(sheetWith({ title: "Swap into your plan", focusKey: "forearm.br" }));
    expect(document.activeElement).toBe(inside);
    rerender(sheetWith({ title: "Swap into your plan", focusKey: "forearm.fds" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2 }));
  });

  it("without a key, still refocuses on a new title (the muscle sheet, until it passes one)", () => {
    const { rerender } = render(sheetWith({ title: "Brachioradialis" }));
    screen.getByRole("button", { name: "Inside" }).focus();
    rerender(sheetWith({ title: "Pronator teres" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2 }));
  });

  it("clears the home indicator with its body when it has no footer", () => {
    render(sheetWith({ title: "Brachioradialis" }));
    expect(screen.getByRole("dialog").hasAttribute("data-footless")).toBe(true);
    cleanup();
    render(sheetWith({ title: "Add to your plan", footer: true }));
    expect(screen.getByRole("dialog").hasAttribute("data-footless")).toBe(false);
    const css = readFileSync(resolve(process.cwd(), "client/src/components/specialization/plan-change.css"), "utf8");
    expect(css).toMatch(/\.spz-sheet\[data-footless\] > \.spz-sheet-body \{ padding-bottom: calc\([^)]*env\(safe-area-inset-bottom, 0px\)\); \}/);
  });
});
