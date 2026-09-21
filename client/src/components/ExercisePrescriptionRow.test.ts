// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExercisePrescriptionRow } from "./ExercisePrescriptionRow";

const exercise = exercises.find((item) => item.name === "Barbell Bench Press") || exercises[0];

function renderRow(prescription: string, overrides: Partial<React.ComponentProps<typeof ExercisePrescriptionRow>> = {}) {
  const onPrescription = vi.fn();
  const onSettings = vi.fn();
  const onInspect = vi.fn();
  const onRemove = vi.fn();
  render(React.createElement(ExercisePrescriptionRow, {
    exercise,
    index: 0,
    prescription,
    settings: { rpe: "RPE 8", rest: "90 sec", notes: "", completed: false },
    onPrescription, onSettings, onInspect, onRemove,
    ...overrides,
  }));
  // The editor lives inside a <details>; jsdom renders its content either way.
  return { onPrescription, onSettings, onInspect, onRemove };
}

afterEach(() => { document.body.innerHTML = ""; });

describe("the collapsed row", () => {
  it("states the prescription without being opened", () => {
    renderRow("3 × 8–12");
    expect(screen.getByText(/3 × 8–12 · RPE 8 · 90 sec/)).toBeTruthy();
    expect(screen.getByText(exercise.name)).toBeTruthy();
  });

  it("states a varied prescription in the same one line", () => {
    renderRow("3 × 10/8/6");
    expect(screen.getByText(/3 × 10\/8\/6 · RPE 8 · 90 sec/)).toBeTruthy();
  });

  it("does not make a reader count three identical numbers", () => {
    // Stored per set so the editor reopens that way; read as the plain form.
    renderRow("3 × 8/8/8");
    expect(screen.getByText(/3 × 8 · RPE 8 · 90 sec/)).toBeTruthy();
  });
});

describe("how many sets", () => {
  it("nudges the count up and down rather than asking anyone to type it", () => {
    const { onPrescription } = renderRow("3 × 8");
    fireEvent.click(screen.getByLabelText(`One more set of ${exercise.name}`));
    expect(onPrescription).toHaveBeenLastCalledWith("4 × 8");
    // The editor holds its own list while open, so the second nudge starts from the
    // four sets just added rather than from the prop this harness never updates.
    fireEvent.click(screen.getByLabelText(`One fewer set of ${exercise.name}`));
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 8");
  });

  /**
   * Marked spent rather than `disabled`: a button that disables itself under the
   * pointer drops focus to <body>, so a keyboard user stepping down to one set lost
   * their place in the row entirely.
   */
  it("will not go below one set, and keeps the control focusable while saying so", () => {
    const { onPrescription } = renderRow("1 × 8");
    const minus = screen.getByLabelText(`One fewer set of ${exercise.name}`);
    expect(minus.hasAttribute("disabled")).toBe(false);
    expect(minus.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(minus);
    expect(onPrescription).not.toHaveBeenCalled();
  });

  it("carries the last set's target onto a set that is added to a varied plan", () => {
    const { onPrescription } = renderRow("3 × 10/8/6");
    fireEvent.click(screen.getByLabelText(`One more set of ${exercise.name}`));
    expect(onPrescription).toHaveBeenLastCalledWith("4 × 10/8/6/6");
  });
});

describe("what the sets ask for", () => {
  it("uses one field when every set is the same, because that is the ordinary case", () => {
    renderRow("3 × 8–12");
    const field = screen.getByLabelText(`${exercise.name} repetitions or target, every set`) as HTMLInputElement;
    expect(field.value).toBe("8–12");
    expect(screen.queryByLabelText(`${exercise.name} set 1 repetitions`)).toBeNull();
  });

  it("writes one field across every set", () => {
    const { onPrescription } = renderRow("3 × 8–12");
    fireEvent.change(screen.getByLabelText(`${exercise.name} repetitions or target, every set`), { target: { value: "5" } });
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 5");
  });

  /** The ask: a top set of 6 and back-offs of 10, in one exercise. */
  it("opens a field per set on request, and keeps each set's own target", () => {
    renderRow("3 × 10/8/6");
    expect((screen.getByLabelText(`${exercise.name} set 1 repetitions`) as HTMLInputElement).value).toBe("10");
    expect((screen.getByLabelText(`${exercise.name} set 2 repetitions`) as HTMLInputElement).value).toBe("8");
    expect((screen.getByLabelText(`${exercise.name} set 3 repetitions`) as HTMLInputElement).value).toBe("6");
  });

  it("edits one set without touching the others", () => {
    const { onPrescription } = renderRow("3 × 10/8/6");
    fireEvent.change(screen.getByLabelText(`${exercise.name} set 2 repetitions`), { target: { value: "12" } });
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 10/12/6");
  });

  /**
   * "3 × 8" and "3 × 8/8/8" are the same prescription, so asking for a field per
   * set cannot be answered by changing the numbers — it has to open the fields
   * and wait to be told what they should say.
   */
  it("opens a field per set on request without changing a single target", () => {
    const { onPrescription } = renderRow("3 × 8");
    fireEvent.click(screen.getByRole("button", { name: "Vary by set" }));
    // The targets are untouched; what is recorded is that this prescription is now
    // written set by set, which is the part that has to survive a reload.
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 8/8/8");
    expect((screen.getByLabelText(`${exercise.name} set 1 repetitions`) as HTMLInputElement).value).toBe("8");
    expect((screen.getByLabelText(`${exercise.name} set 3 repetitions`) as HTMLInputElement).value).toBe("8");

    fireEvent.change(screen.getByLabelText(`${exercise.name} set 1 repetitions`), { target: { value: "6" } });
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 6/8/8");
  });

  it("goes back to one field, carrying the first set's target across", () => {
    const { onPrescription } = renderRow("3 × 10/8/6");
    fireEvent.click(screen.getByRole("button", { name: "Same every set" }));
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 10");
  });

  /** Editing every set back to the same number must not yank the fields away mid-edit. */
  it("keeps the per-set fields open when the numbers happen to agree again", () => {
    const { onPrescription } = renderRow("3 × 8");
    fireEvent.click(screen.getByRole("button", { name: "Vary by set" }));
    fireEvent.change(screen.getByLabelText(`${exercise.name} set 2 repetitions`), { target: { value: "8" } });
    expect(screen.getByLabelText(`${exercise.name} set 2 repetitions`)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Same every set" })).toBeTruthy();
    // ...and it is still written set by set, so reopening the day keeps the fields.
    expect(onPrescription).toHaveBeenLastCalledWith("3 × 8/8/8");
  });

  it("does not offer to vary a single set, because there is nothing to vary against", () => {
    const { onPrescription } = renderRow("1 × 8");
    const vary = screen.getByRole("button", { name: "Vary by set" });
    expect(vary.getAttribute("aria-disabled")).toBe("true");
    expect(vary.getAttribute("title")).toBe("Add a second set first");
    fireEvent.click(vary);
    expect(onPrescription).not.toHaveBeenCalled();
  });
});

describe("the rest of the controls", () => {
  it("keeps effort, rest, the note, completion and the row actions reachable", () => {
    const { onSettings, onInspect, onRemove } = renderRow("3 × 8");
    fireEvent.change(screen.getByLabelText(`${exercise.name} effort`), { target: { value: "RPE 9" } });
    expect(onSettings).toHaveBeenLastCalledWith({ rpe: "RPE 9" });
    fireEvent.change(screen.getByLabelText(`${exercise.name} rest`), { target: { value: "120 sec" } });
    expect(onSettings).toHaveBeenLastCalledWith({ rest: "120 sec" });

    fireEvent.click(screen.getByRole("button", { name: /Mark complete/ }));
    expect(onSettings).toHaveBeenLastCalledWith({ completed: true });

    fireEvent.click(screen.getByLabelText(`View ${exercise.name} details`));
    expect(onInspect).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(`Remove ${exercise.name}`));
    expect(onRemove).toHaveBeenCalled();
    expect(screen.getByLabelText(`Duplicate ${exercise.name} prescription`)).toBeTruthy();
  });

  it("puts the actions in their own row rather than through the middle of the fields", () => {
    // "Mark complete" used to be a full-width slab between the inputs, and the remove
    // button ran off the right edge of a phone.
    renderRow("3 × 8");
    const actions = document.querySelector(".prescription-actions");
    expect(actions).toBeTruthy();
    expect(actions!.querySelector(".remove-prescription")).toBeTruthy();
    expect(actions!.querySelector(".completion-toggle")).toBeTruthy();
  });
});
