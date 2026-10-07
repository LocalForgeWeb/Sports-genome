// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlateLoaderSheet } from "./PlateLoaderSheet";
import { MySetupSheet } from "./MySetupSheet";
import { ExerciseYoursRow } from "./ExerciseYoursRow";
import { TrainingTermsSheet } from "./TrainingTermsSheet";
import { UtilityAccountContext } from "@/lib/utilityStore";
import { UTILITY_OPEN_EVENT } from "@/lib/utilityTools";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
const byName = (name: string) => exercises.find((exercise) => exercise.name === name)!;
const as = (account: string | null, node: React.ReactElement) => createElement(UtilityAccountContext.Provider, { value: account }, node);

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

/** Utility brief §3 (PL14, PL16, PL18). */
describe("Load the bar", () => {
  it("shows each side and the total from one result, and Copy writes the same text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(createElement(PlateLoaderSheet, { onClose: vi.fn(), exerciseName: "Back Squat", initialTarget: "185", initialUnit: "lb" }));
    const result = document.getElementById("plate-loader-message")!;
    expect(result.textContent).toContain("Each side: 45 + 25 lb");
    expect(result.textContent).toContain("Total: 185 lb, including the 45 lb bar");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy loading instructions" })); });
    expect(writeText).toHaveBeenCalledWith("Back Squat — 185 lb\nEach side: 45 + 25 lb\nTotal: 185 lb, including the 45 lb bar");
  });

  it("recomputes when the plates change and keeps the target", () => {
    render(createElement(PlateLoaderSheet, { onClose: vi.fn(), initialTarget: "185", initialUnit: "lb" }));
    // No 25s: 185 is now 45 + 10 + 10 + 5 a side.
    fireEvent.click(screen.getByRole("button", { name: "Remove 25 lb plates" }));
    expect(document.getElementById("plate-loader-message")!.textContent).toContain("Each side: 45 + 10 + 10 + 5 lb");
    expect((screen.getByLabelText(/Target total/) as HTMLInputElement).value).toBe("185");
    expect(document.body.textContent).toContain("Saved on this device.");
  });

  it("explains an impossible target calmly and offers both neighbours", () => {
    render(createElement(PlateLoaderSheet, { onClose: vi.fn(), initialTarget: "182.5", initialUnit: "lb" }));
    const text = document.getElementById("plate-loader-message")!.textContent!;
    expect(text).toContain("182.5 lb can't be loaded exactly with the plates you have");
    expect(text).toContain("Lower · 180 lb");
    expect(text).toContain("Higher · 185 lb");
  });

  it("switches units without reading one unit's number as the other's", () => {
    render(createElement(PlateLoaderSheet, { onClose: vi.fn(), initialTarget: "185", initialUnit: "lb" }));
    fireEvent.click(screen.getByLabelText("kg"));
    expect((screen.getByLabelText(/Target total/) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/Bar weight/) as HTMLInputElement).value).toBe("20");
    fireEvent.click(screen.getByLabelText("lb"));
    expect((screen.getByLabelText(/Target total/) as HTMLInputElement).value).toBe("185");
  });

  it("says why a target can't be used, inline", () => {
    render(createElement(PlateLoaderSheet, { onClose: vi.fn(), initialTarget: "-5", initialUnit: "lb" }));
    expect(screen.getByRole("alert").textContent).toBe("Enter the total as a number, like 185 or 102.5.");
    fireEvent.change(screen.getByLabelText(/Target total/), { target: { value: "40" } });
    expect(document.getElementById("plate-loader-message")!.textContent).toContain("The 45 lb bar already weighs more than 40 lb.");
  });
});

/** Utility brief §4 (SN05, SN07, SN11-SN13). */
describe("My setup", () => {
  const row = byName("Seated Cable Row");

  it("creates, reloads, duplicates and switches between two setups for one exercise", () => {
    const { unmount } = render(as("athlete-1", createElement(MySetupSheet, { catalogExerciseId: row.id, exerciseName: row.name, onClose: vi.fn() })));
    fireEvent.change(screen.getByLabelText("Setup name"), { target: { value: "School gym" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Seat" }));
    fireEvent.change(screen.getByLabelText("Seat value"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Add a note" }));
    fireEvent.change(screen.getByLabelText(/My note/), { target: { value: "Keep the same foot position" } });
    fireEvent.click(screen.getByRole("button", { name: "Save setup" }));
    expect(screen.getByRole("status").textContent).toContain("Saved “School gym”");
    unmount();
    // Reloaded: read back from storage.
    render(as("athlete-1", createElement(MySetupSheet, { catalogExerciseId: row.id, exerciseName: row.name, onClose: vi.fn() })));
    const list = screen.getByRole("list", { name: `Setups for ${row.name}` });
    expect(list.textContent).toContain("School gym");
    expect(list.textContent).toContain("Seat 4");
    expect(list.textContent).toContain("Keep the same foot position");
    fireEvent.click(within(list).getByRole("button", { name: "Duplicate" }));
    fireEvent.change(screen.getByLabelText("Setup name"), { target: { value: "Home gym" } });
    fireEvent.change(screen.getByLabelText("Seat value"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Save setup" }));
    expect(screen.getByRole("list", { name: `Setups for ${row.name}` }).textContent).toContain("Home gym");
    fireEvent.click(screen.getByRole("button", { name: "Use School gym" }));
    expect(screen.getByRole("status").textContent).toBe("Using “School gym”.");
    const stored = JSON.parse(window.localStorage.getItem("sg-setup-notebook-v1::athlete-1")!);
    expect(stored.setups.map((setup: { label: string; settings: { value: string }[] }) => `${setup.label}:${setup.settings[0].value}`).sort()).toEqual(["Home gym:6", "School gym:4"]);
  });

  it("keeps another account's setups out of view", () => {
    window.localStorage.setItem("sg-setup-notebook-v1::athlete-1", JSON.stringify({ version: 1, setups: [{ id: "s1", catalogExerciseId: row.id, label: "Private setup", settings: [], createdAt: "t", updatedAt: "t" }], selected: { [row.id]: "s1" } }));
    render(as("athlete-2", createElement(ExerciseYoursRow, { catalogExerciseId: row.id, exerciseName: row.name, equipment: row.equipment })));
    expect(document.body.textContent).toContain("Nothing saved yet");
    expect(document.body.textContent).not.toContain("Private setup");
  });

  it("keeps the typing when a save fails, and says so", () => {
    render(as("athlete-1", createElement(MySetupSheet, { catalogExerciseId: row.id, exerciseName: row.name, onClose: vi.fn() })));
    fireEvent.change(screen.getByLabelText("Setup name"), { target: { value: "Away gym" } });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    fireEvent.click(screen.getByRole("button", { name: "Save setup" }));
    setItem.mockRestore();
    expect(screen.getByRole("status").textContent).toContain("Couldn't save on this device");
    expect((screen.getByLabelText("Setup name") as HTMLInputElement).value).toBe("Away gym");
  });

  it("asks before discarding typed changes, and not otherwise", () => {
    const onClose = vi.fn();
    render(as(null, createElement(MySetupSheet, { catalogExerciseId: row.id, exerciseName: row.name, onClose })));
    fireEvent.change(screen.getByLabelText("Setup name"), { target: { value: "Draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog").textContent).toContain("Discard what you typed?");
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("labels it the athlete's own, and offers Load the bar only for a barbell exercise", () => {
    const listener = vi.fn();
    window.addEventListener(UTILITY_OPEN_EVENT, listener);
    render(createElement(ExerciseYoursRow, { catalogExerciseId: row.id, exerciseName: row.name, equipment: row.equipment }));
    expect(screen.queryByRole("button", { name: "Load the bar" })).toBeNull();
    cleanup();
    const squat = byName("Back Squat");
    render(createElement(ExerciseYoursRow, { catalogExerciseId: squat.id, exerciseName: squat.name, equipment: squat.equipment }));
    fireEvent.click(screen.getByRole("button", { name: "Load the bar" }));
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ tool: "plates", exerciseName: "Back Squat" });
    window.removeEventListener(UTILITY_OPEN_EVENT, listener);
  });
});

/** Utility brief §7 (GL04, GL09, GL11). */
describe("Training terms", () => {
  it("lists every term, finds one by alias, and says when nothing matches", () => {
    render(createElement(TrainingTermsSheet, { onClose: vi.fn() }));
    expect(screen.getByRole("status").textContent).toBe("31 terms");
    fireEvent.change(screen.getByLabelText("Search training terms"), { target: { value: "estimated one-rep max" } });
    expect(screen.getAllByRole("button", { name: /Estimated 1RM/ })[0]).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search training terms"), { target: { value: "zzqx" } });
    expect(document.body.textContent).toContain("No term matches “zzqx”");
  });

  it("opens straight at a linked term, and All terms returns to the row with the search kept", () => {
    render(createElement(TrainingTermsSheet, { termId: "rir", onClose: vi.fn() }));
    expect(screen.getByRole("heading", { name: "RIR (reps in reserve)" })).toBeTruthy();
    expect(document.activeElement?.textContent).toContain("All terms");
    fireEvent.click(screen.getByRole("button", { name: "All terms" }));
    expect(document.activeElement?.textContent).toContain("RIR");
    fireEvent.change(screen.getByLabelText("Search training terms"), { target: { value: "rpe" } });
    fireEvent.click(screen.getAllByRole("button", { name: /^RPE/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "All terms" }));
    expect((screen.getByLabelText("Search training terms") as HTMLInputElement).value).toBe("rpe");
  });

  it("ignores a link to a term that doesn't exist and shows the list", () => {
    render(createElement(TrainingTermsSheet, { termId: "no-such-term", onClose: vi.fn() }));
    expect(screen.getByRole("status").textContent).toBe("31 terms");
  });
});
