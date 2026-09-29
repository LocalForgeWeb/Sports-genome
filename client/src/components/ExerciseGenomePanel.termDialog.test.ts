// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
const renderPanel = () => render(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] }, compactHead: true }));

/**
 * A term explanation opens over the panel, and the panel itself lives inside the
 * Exercise intelligence sheet, which closes on Escape through a window keydown
 * listener. The explanation used to leave focus on the label behind it, and one
 * Escape closed the whole sheet instead of just the explanation.
 */
describe("Exercise Genome term explanation", () => {
  const inspectorEscape = vi.fn();
  // Stands in for Home's inspector handler: bubble phase, on window, Escape only.
  const inspectorKeydown = (event: KeyboardEvent) => { if (event.key === "Escape") inspectorEscape(); };
  afterEach(() => { cleanup(); window.removeEventListener("keydown", inspectorKeydown); inspectorEscape.mockReset(); });

  it("takes focus, closes only itself on Escape, and hands focus back to the label", () => {
    window.addEventListener("keydown", inspectorKeydown);
    const view = renderPanel();
    const opener = view.getByRole("button", { name: "Learn about Hypertrophy potential" });
    opener.focus();
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);

    expect(view.getByRole("dialog", { name: "Hypertrophy potential explained" })).toBeTruthy();
    const close = view.getByRole("button", { name: "Close term explanation" });
    expect(document.activeElement).toBe(close);

    // The close button is the only control in the card, so Tab stays on it.
    // jsdom never moves focus on a synthetic Tab, so check that the key was
    // cancelled: fireEvent returns false once preventDefault has been called.
    expect(fireEvent.keyDown(close, { key: "Tab" })).toBe(false);
    expect(fireEvent.keyDown(close, { key: "Tab", shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    expect(view.queryByRole("dialog")).toBeNull();
    expect(inspectorEscape).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });

  it("gives focus back to a bar's term button after the close button is pressed", () => {
    const view = renderPanel();
    const opener = view.getAllByRole("button", { name: /Hypertrophy potential/ }).find((node) => node.classList.contains("genome-term-button"));
    expect(opener).toBeTruthy();
    opener!.focus();
    fireEvent.click(opener!);
    const close = view.getByRole("button", { name: "Close term explanation" });
    expect(document.activeElement).toBe(close);
    fireEvent.click(close);
    expect(view.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("says which analysis view is showing, and moves that when another is chosen", () => {
    const view = renderPanel();
    expect(view.getByRole("button", { name: "Fingerprint", pressed: true })).toBeTruthy();
    expect(view.getByRole("button", { name: "Context", pressed: false })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Context" }));
    expect(view.getByRole("button", { name: "Context", pressed: true })).toBeTruthy();
    expect(view.getByRole("button", { name: "Fingerprint", pressed: false })).toBeTruthy();
  });
});
