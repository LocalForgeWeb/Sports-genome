// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExercisePrescriptionRow } from "./ExercisePrescriptionRow";

const exercise = exercises.find((item) => item.name === "Barbell Bench Press") || exercises[0];

/**
 * The row is controlled: it renders what its parent gives it. Testing it against a
 * `vi.fn()` therefore proves nothing about typing, because the value never comes
 * back — which is exactly why every one of the defects below was green. This wrapper
 * feeds `onPrescription` back in as `prescription`, the way Home does.
 */
function Harness({ initial }: { initial: string }) {
  const [prescription, setPrescription] = React.useState(initial);
  return React.createElement("div", null,
    React.createElement("output", { "data-testid": "stored" }, prescription),
    React.createElement(ExercisePrescriptionRow, {
      exercise, index: 0, prescription,
      settings: { rpe: "RPE 8", rest: "90 sec", notes: "", completed: false },
      onPrescription: setPrescription,
      onSettings: () => {}, onInspect: () => {}, onRemove: () => {},
    }),
  );
}

const mount = (initial: string) => render(React.createElement(Harness, { initial }));
const stored = () => screen.getByTestId("stored").textContent;
const setsShown = () => document.querySelectorAll(".prescription-set-list li input").length;

/** Type into a field one character at a time, as a person does. */
function type(field: HTMLInputElement, text: string) {
  for (const character of text) {
    const live = document.getElementById(field.id) as HTMLInputElement | null;
    const target = live || field;
    fireEvent.change(target, { target: { value: target.value + character } });
  }
}

afterEach(cleanup);

describe("typing a target one character at a time", () => {
  /**
   * The bug this exists for: every keystroke used to be written out as a string and
   * read straight back, and the round trip is lossy for exactly the half-written
   * values a person passes through. "12-" is not a rep count, so the whole plan
   * collapsed into one field holding "10/12-/6" — and the next keystroke re-joined
   * that with slashes, doubling it on every press.
   */
  it("survives a half-written range in a per-set field", () => {
    mount("3 × 10/8/6");
    const field = screen.getByLabelText(`${exercise.name} set 2 repetitions`) as HTMLInputElement;
    fireEvent.change(field, { target: { value: "" } });
    type(field, "12-15");

    expect(setsShown(), "the per-set fields survived being typed into").toBe(3);
    expect((screen.getByLabelText(`${exercise.name} set 2 repetitions`) as HTMLInputElement).value).toBe("12-15");
    expect(stored()).toBe("3 × 10/12-15/6");
  });

  it("keeps the other sets untouched while one is being retyped", () => {
    mount("3 × 10/8/6");
    const field = screen.getByLabelText(`${exercise.name} set 1 repetitions`) as HTMLInputElement;
    fireEvent.change(field, { target: { value: "" } });
    type(field, "5");
    expect((screen.getByLabelText(`${exercise.name} set 3 repetitions`) as HTMLInputElement).value).toBe("6");
    expect(stored()).toBe("3 × 5/8/6");
  });

  it("lets a field be emptied, instead of answering Backspace with a 1", () => {
    mount("3 × 8");
    const field = screen.getByLabelText(`${exercise.name} repetitions or target, every set`) as HTMLInputElement;
    fireEvent.change(field, { target: { value: "" } });
    expect(field.value, "the field shows what was typed, not what was stored").toBe("");
    type(field, "12");
    expect((screen.getByLabelText(`${exercise.name} repetitions or target, every set`) as HTMLInputElement).value).toBe("12");
    expect(stored()).toBe("3 × 12");
  });

  it("does not let a typed slash invent or destroy a set", () => {
    // "8 / side" in the shared field used to be read back as two sets of "8" and
    // "side", silently dropping a set from the workout.
    mount("3 × 8–12");
    const field = screen.getByLabelText(`${exercise.name} repetitions or target, every set`) as HTMLInputElement;
    fireEvent.change(field, { target: { value: "" } });
    type(field, "8 / side");
    expect(stored()).toMatch(/^3 × /);
    expect(document.querySelectorAll(".prescription-set-list li input").length).toBe(0);
    expect(stored()!.startsWith("3 ×"), `set count survived: ${stored()}`).toBe(true);
  });

  it("does not let a typed slash inside one set become a set boundary", () => {
    mount("3 × 10/8/6");
    const field = screen.getByLabelText(`${exercise.name} set 1 repetitions`) as HTMLInputElement;
    type(field, "/5");
    expect(setsShown(), "still three sets, not four").toBe(3);
    expect(stored()).toBe("3 × 10 5/8/6");
  });
});

describe("the per-set choice is part of the prescription", () => {
  /**
   * It used to be component state, so it evaporated on any remount — switching tabs
   * and coming back showed one shared field again — and, being keyed on exercise id
   * alone, it leaked onto the same exercise on a different training day.
   */
  it("is written into the stored value, so it survives a remount", () => {
    const first = mount("3 × 8");
    fireEvent.click(screen.getByRole("button", { name: "Vary by set" }));
    const afterVarying = stored();
    expect(afterVarying).toBe("3 × 8/8/8");
    first.unmount();

    mount(afterVarying!);
    expect(setsShown(), "the row reopened in per-set mode").toBe(3);
    expect(screen.getByRole("button", { name: "Same every set" })).toBeTruthy();
  });

  it("does not leak onto a row that was never put in that mode", () => {
    const first = mount("3 × 8");
    fireEvent.click(screen.getByRole("button", { name: "Vary by set" }));
    first.unmount();
    // The same exercise on another day, with its own uniform prescription.
    mount("4 × 5");
    expect(setsShown()).toBe(0);
    expect(screen.getByRole("button", { name: "Vary by set" })).toBeTruthy();
  });

  it("reads back as a plain prescription when every set agrees", () => {
    mount("3 × 8/8/8");
    // Stored per set, but nobody wants to read "8/8/8" in a list of exercises.
    expect(screen.getByText(/3 × 8 · RPE 8 · 90 sec/)).toBeTruthy();
  });
});

describe("flattening is recoverable", () => {
  it("offers an undo rather than silently discarding the targets", () => {
    mount("4 × 10/8/6/6");
    fireEvent.click(screen.getByRole("button", { name: "Same every set" }));
    expect(stored()).toBe("4 × 10");

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    expect(stored()).toBe("4 × 10/8/6/6");
    expect(setsShown()).toBe(4);
  });
});

describe("the stepper", () => {
  it("stays focusable at its limits instead of dropping focus when it disables", () => {
    mount("1 × 8");
    const minus = screen.getByLabelText(`One fewer set of ${exercise.name}`);
    expect(minus.hasAttribute("disabled"), "a disabled button loses focus mid-interaction").toBe(false);
    expect(minus.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(minus);
    expect(stored(), "still one set").toBe("1 × 8");
  });

  it("will not build more controls than the editor caps at", () => {
    mount("12 × 5");
    const plus = screen.getByLabelText(`One more set of ${exercise.name}`);
    expect(plus.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(plus);
    expect(stored()).toBe("12 × 5");
  });
});
