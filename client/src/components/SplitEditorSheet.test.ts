// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SplitEditorSheet } from "./SplitEditorSheet";
import { commitDay, emptyDayStore } from "@/lib/trainingDayPlan";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { SplitDay } from "@/lib/splitCycle";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const exercise = (id: number, name: string) => ({ id, name }) as unknown as Exercise;
const week = () => {
  let store = commitDay(emptyDayStore(), "0-Push", { workout: [exercise(1, "Bench Press"), exercise(2, "Dip")], prescriptions: {}, settings: {} });
  store = commitDay(store, "1-Pull", { workout: [exercise(3, "Cable Row")], prescriptions: {}, settings: {} });
  store = commitDay(store, "2-Legs", { workout: [exercise(4, "Back Squat")], prescriptions: {}, settings: {} });
  return store;
};

function mount(over: Partial<Parameters<typeof SplitEditorSheet>[0]> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(createElement(SplitEditorSheet, { current: ["Push", "Pull", "Legs"] as SplitDay[], store: week(), week: 1, otherWeeks: [2], onSave, onClose, ...over }));
  return { onSave, onClose, dialog: screen.getByRole("dialog", { name: "Your training days" }) };
}
const daySelect = (dialog: HTMLElement, ordinal: string) => within(dialog).getByLabelText(new RegExp(`^${ordinal}`)) as HTMLSelectElement;
const daysShown = (dialog: HTMLElement) => Array.from(dialog.querySelectorAll<HTMLSelectElement>(".se-days select")).map((select) => select.value);

afterEach(cleanup);

describe("choosing the training days", () => {
  it("opens on the current week, with what each day holds", () => {
    const { dialog } = mount();
    expect(daysShown(dialog)).toEqual(["Push", "Pull", "Legs"]);
    expect(within(dialog).getByText("2 exercises")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "No changes" })).toHaveProperty("disabled", true);
  });

  it("offers every day type on every day", () => {
    const { dialog } = mount();
    const options = Array.from(daySelect(dialog, "Day 01").options).map((option) => option.value);
    expect(options).toEqual(["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"]);
  });

  it("saves a day changed to any type, without being held to the frequency's split", () => {
    const { dialog, onSave } = mount();
    fireEvent.change(daySelect(dialog, "Day 03"), { target: { value: "Full Body" } });
    // The renamed day keeps its own exercises, and says so.
    expect(within(dialog).getByText("1 exercise · from Day 03 · Legs")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save days" }));
    expect(onSave).toHaveBeenCalledWith(["Push", "Pull", "Full Body"]);
  });

  it("applies a preset in one tap, length included", () => {
    const { dialog, onSave } = mount();
    fireEvent.click(within(dialog).getByRole("button", { name: /^Upper · Lower ×2/ }));
    expect(daysShown(dialog)).toEqual(["Upper", "Lower", "Upper", "Lower"]);
    expect(within(dialog).getByRole("button", { name: /^Upper · Lower ×2/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save days" }));
    expect(onSave).toHaveBeenCalledWith(["Upper", "Lower", "Upper", "Lower"]);
  });

  it("adds and removes days, one to seven", () => {
    const { dialog, onSave } = mount();
    fireEvent.click(within(dialog).getByRole("button", { name: "Add a day" }));
    expect(daysShown(dialog)).toHaveLength(4);
    fireEvent.change(daySelect(dialog, "Day 04"), { target: { value: "Upper" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove Day 02 · Pull" }));
    expect(daysShown(dialog)).toEqual(["Push", "Legs", "Upper"]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save days" }));
    expect(onSave).toHaveBeenCalledWith(["Push", "Legs", "Upper"]);

    cleanup();
    const one = mount({ current: ["Full Body"], store: emptyDayStore() }).dialog;
    expect(within(one).getByRole("button", { name: "Remove Day 01 · Full Body" })).toHaveProperty("disabled", true);
    cleanup();
    const seven = mount({ current: ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"], store: emptyDayStore() }).dialog;
    expect(within(seven).queryByRole("button", { name: "Add a day" })).toBeNull();
  });

  it("says which built days a shorter week hides, and that nothing is deleted", () => {
    const { dialog } = mount();
    fireEvent.click(within(dialog).getByRole("button", { name: /^Upper · Lower2 days/ }));
    expect(within(dialog).getByRole("status").textContent).toContain("Day 03 · Legs (1 exercise) has no place in this week, so it is hidden, not deleted. Add Day 03 · Legs back to see it again.");
  });

  it("says the other weeks change the same way", () => {
    const { dialog } = mount({ otherWeeks: [2, 3] });
    expect(dialog.textContent).toContain("Weeks 2 and 3 change the same way.");
  });

  it("goes back to the recommended split for the length chosen", () => {
    const { dialog, onSave } = mount({ current: ["Full Body", "Lower", "Full Body"] });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Recommended/ }));
    expect(daysShown(dialog)).toEqual(["Push", "Pull", "Legs"]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save days" }));
    expect(onSave).toHaveBeenCalledWith(["Push", "Pull", "Legs"]);
  });

  it("closes without saving on Cancel", () => {
    const { dialog, onSave, onClose } = mount();
    fireEvent.change(daySelect(dialog, "Day 01"), { target: { value: "Upper" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
