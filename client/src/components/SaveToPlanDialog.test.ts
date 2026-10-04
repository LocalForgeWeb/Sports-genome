// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots } from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import type { IncomingDraftDay } from "@/lib/planImport";
import { SaveToPlanDialog, type SaveOutcome, type SaveRequest, type SaveWeekOption } from "./SaveToPlanDialog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const slots = buildDaySlots(splitDaysForFrequency(3));
const [first, second] = exercises;
const counts = (values: number[]) => Object.fromEntries(slots.map((slot, index) => [slot.key, values[index] ?? 0]));
const weeks: SaveWeekOption[] = [
  { week: 1, exists: true, current: true, dayCounts: counts([4, 0, 2]) },
  { week: 2, exists: false, current: false, dayCounts: counts([]) },
];
const day = (label: string, extra: Partial<IncomingDraftDay> = {}): IncomingDraftDay => ({ label, items: [{ exercise: first, prescription: "4 × 3–6", rpe: "RPE 8" }], unresolved: [], ...extra });
const done: SaveOutcome = { ok: true, week: 1, slotIndex: 0, destination: `Week 1 · ${slots[0].ordinal} · ${slots[0].day}`, added: 1, alreadyThere: [] };

const open = (props: Partial<Parameters<typeof SaveToPlanDialog>[0]> = {}) => {
  const onSave = vi.fn((_request: SaveRequest) => done);
  const onOpen = vi.fn();
  const onClose = vi.fn();
  render(createElement(SaveToPlanDialog, { heading: "Save a copy", sourceTitle: "Pull · Week 1", sourceLine: "1 exercise", days: [day(slots[0].day)], slots, weeks, defaultWeek: 1, onSave, onOpen, onClose, ...props }));
  return { onSave, onOpen, onClose };
};

/**
 * Oct 4 sharing brief, Save a copy: the athlete sees where it goes before anything
 * changes; adding is the default; replacing is confirmed against what it removes;
 * nothing the catalog lacks is dropped or swapped silently; one save, once.
 */
describe("Save to your plan", () => {
  afterEach(cleanup);

  it("names the destination first and adds after what is planned by default", () => {
    const { onSave } = open();
    expect((screen.getByRole("radio", { name: /Week 1/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("radio", { name: /Add after them/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("combobox", { name: /Day in Week 1 for/ }) as HTMLSelectElement).value).toBe(String(slots[0].index));
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ week: 1, mode: "append", writes: [{ slotIndex: slots[0].index, day: { items: [{ exercise: first, prescription: "4 × 3–6", rpe: "RPE 8" }] } }] });
    expect(screen.getByRole("heading", { name: "Saved to your plan" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(`Saved to ${done.ok && done.destination}. 1 exercise added.`);
  });

  it("asks before replacing, naming each day and how much goes - and saves nothing until confirmed", () => {
    const { onSave } = open();
    fireEvent.click(screen.getByRole("radio", { name: /Replace them/ }));
    fireEvent.click(screen.getByRole("button", { name: "Replace and save…" }));
    expect(onSave).not.toHaveBeenCalled();
    const confirm = screen.getByRole("alertdialog", { name: "Replace what's planned?" });
    expect(confirm.textContent).toContain(`Week 1 · ${slots[0].ordinal} · ${slots[0].day}: 4 exercises will be removed`);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Replace and save…" }));
    fireEvent.click(screen.getByRole("button", { name: "Replace and save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].mode).toBe("replace");
  });

  it("doesn't ask about replacing a day that is empty", () => {
    const { onSave } = open({ days: [day(slots[1].day)] });
    fireEvent.click(screen.getByRole("radio", { name: /Replace them/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("puts a week's days in the athlete's matching days, into an empty new week when chosen", () => {
    const { onSave } = open({ days: slots.map((slot) => day(slot.day)), sourceLine: "3 days · 3 exercises" });
    fireEvent.click(screen.getByRole("radio", { name: /Week 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 2" }));
    expect(onSave.mock.calls[0][0].week).toBe(2);
    expect(onSave.mock.calls[0][0].writes.map((write) => write.slotIndex)).toEqual(slots.map((slot) => slot.index));
  });

  it("won't save while an exercise the catalog lacks is unresolved, and saves the athlete's choice for it", () => {
    const { onSave } = open({ days: [day(slots[0].day, { unresolved: [{ key: "1-2", name: "Towel Grip Hang", prescription: "3 × 30–45 sec", candidates: [second] }] })] });
    const save = screen.getByRole("button", { name: "Save to Week 1" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Resolve 1 exercise above to save.")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "What to do with Towel Grip Hang" }), { target: { value: String(second.id) } });
    fireEvent.click(save);
    expect(onSave.mock.calls[0][0].writes[0].day.items.map((item) => [item.exercise.id, item.prescription])).toEqual([[first.id, "4 × 3–6"], [second.id, "3 × 30–45 sec"]]);
  });

  it("leaves an exercise out only when the athlete says so", () => {
    const { onSave } = open({ days: [day(slots[0].day, { unresolved: [{ key: "1-2", name: "Towel Grip Hang", prescription: "", candidates: [] }] })] });
    fireEvent.change(screen.getByRole("combobox", { name: "What to do with Towel Grip Hang" }), { target: { value: "omit" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(onSave.mock.calls[0][0].writes[0].day.items.map((item) => item.exercise.id)).toEqual([first.id]);
  });

  it("asks for a day for a workout that didn't fit the week, and waits for it", () => {
    const { onSave } = open({ days: [...slots.map((slot) => day(slot.day)), day("Arms")] });
    expect(screen.getByRole("alert").textContent).toContain("Choose a day for every workout.");
    expect((screen.getByRole("button", { name: "Save to Week 1" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByRole("combobox", { name: "Day in Week 1 for Arms" }), { target: { value: String(slots[2].index) } });
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("saves once however many times Save is pressed", () => {
    const { onSave } = open();
    const save = screen.getByRole("button", { name: "Save to Week 1" });
    act(() => { fireEvent.click(save); fireEvent.click(save); });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("says where a share was already saved and offers it, before offering another copy", () => {
    const { onOpen, onSave } = open({ alreadySaved: { destination: "Week 1 · Day 01 · Push", savedAt: "2026-10-04T10:00:00Z", week: 1, slotIndex: 0 } });
    expect(screen.getByRole("dialog").textContent).toContain("to Week 1 · Day 01 · Push");
    expect(screen.queryByRole("button", { name: "Save to Week 1" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open saved copy" }));
    expect(onOpen).toHaveBeenCalledWith(1, 0);
    fireEvent.click(screen.getByRole("button", { name: "Save another copy" }));
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("keeps the form and says why when the plan can't take the save yet", () => {
    const onSave = vi.fn(() => ({ ok: false as const, message: "Your plan is still loading, so nothing was saved. Try again in a moment." }));
    open({ onSave });
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(screen.getByRole("alert").textContent).toContain("still loading");
    fireEvent.click(screen.getByRole("button", { name: "Save to Week 1" }));
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("closes on Escape", () => {
    const { onClose } = open();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
