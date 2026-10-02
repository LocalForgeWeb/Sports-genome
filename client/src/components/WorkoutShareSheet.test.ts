// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildWorkoutExport, workoutSummaryText } from "@/lib/workoutExport";

vi.mock("@/lib/pdfBrandLogo", () => ({ loadPdfLogo: async () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const { WorkoutShareSheet } = await import("./WorkoutShareSheet");

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const plan = buildWorkoutExport({
  workout: exercises.filter((exercise) => /pull/i.test(exercise.movement)).slice(0, 8), week: 1, dayOrdinal: "Day 02", dayName: "Pull", sport: "Wrestling", goal: "Athleticism",
  prescriptionFor: () => "4 × 3–6", settingsFor: () => ({ rpe: "RPE 7", rest: "90 sec", notes: "" }), muscleLabel: (key) => key, now: new Date("2026-10-02T15:00:00Z"),
});
type Nav = Navigator & { share?: unknown; canShare?: unknown };
const nav = navigator as Nav;

/**
 * Oct 2 brief §5–7: one Share that says what it sends - the PDF and a short note -
 * before it sends it, a PDF to save, a summary to copy, and nothing that touches
 * the plan.
 */
describe("Share workout", () => {
  let share: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    share = vi.fn(async () => undefined);
    nav.share = share;
    nav.canShare = (data: ShareData) => Boolean(data.files?.length);
  });
  afterEach(() => { cleanup(); delete nav.share; delete nav.canShare; });

  const open = async () => {
    const onClose = vi.fn();
    render(createElement(WorkoutShareSheet, { plan, weightUnit: "lb", onClose }));
    await waitFor(() => expect((screen.getByRole("button", { name: /Share workout/ }) as HTMLButtonElement).disabled).toBe(false));
    return onClose;
  };

  it("says what will be sent before anything is: the named PDF and the note", async () => {
    await open();
    const dialog = screen.getByRole("dialog", { name: "Share workout" });
    expect(dialog.textContent).toContain("Sports Genome - Week 1 Pull.pdf");
    expect(dialog.textContent).toContain("Full workout attached.");
    expect(dialog.textContent).toContain("+ 5 more");
  });

  it("hands the system share sheet the PDF and two short lines, never the workout written out", async () => {
    const onClose = await open();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Share workout/ })); });
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0] as ShareData;
    expect(data.files).toHaveLength(1);
    expect(data.files![0].name).toBe("Sports Genome - Week 1 Pull.pdf");
    expect(data.files![0].type).toBe("application/pdf");
    expect(data.text).toBe("Week 1 · Pull — Sports Genome\n8 exercises · Wrestling · Athleticism\nFull workout attached.");
    for (const exercise of plan.exercises) expect(data.text).not.toContain(exercise.name);
    expect(onClose).toHaveBeenCalled();
  });

  it("treats a dismissed share sheet as a choice: it stays open and reports nothing", async () => {
    share.mockRejectedValueOnce(new DOMException("Share canceled", "AbortError"));
    const onClose = await open();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Share workout/ })); });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("saves the PDF instead where the browser cannot attach files to a share", async () => {
    nav.canShare = () => false;
    const created = vi.fn(() => "blob:test");
    URL.createObjectURL = created as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await open();
    expect(screen.getByRole("button", { name: /Share workout as PDF/ })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Share workout/ })); });
    expect(share).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("Saved Sports Genome - Week 1 Pull.pdf");
    click.mockRestore();
  });

  it("copies the plain-text summary", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await open();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Copy workout summary/ })); });
    expect(writeText).toHaveBeenCalledWith(workoutSummaryText(plan));
    expect(screen.getByRole("button", { name: /Summary copied/ })).toBeTruthy();
  });

  it("closes on Escape and lives in the modal layer, on an opaque dark surface", async () => {
    const onClose = await open();
    const dialog = screen.getByRole("dialog", { name: "Share workout" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog.className).toContain("sg-surface-dark");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
