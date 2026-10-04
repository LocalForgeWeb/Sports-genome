// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";
import { UniversalSearch } from "./UniversalSearch";

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
    // The help control beside the profile row (October 4: an icon with a name, not an underlined label).
    const opener = view.getAllByRole("button", { name: /Hypertrophy potential/ }).find((node) => node.classList.contains("ei-help"));
    expect(opener).toBeTruthy();
    opener!.focus();
    fireEvent.click(opener!);
    const close = view.getByRole("button", { name: "Close term explanation" });
    expect(document.activeElement).toBe(close);
    fireEvent.click(close);
    expect(view.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  // Search opens over anything with Cmd/Ctrl+K. While it holds focus, its keys
  // are its own: the explanation behind it must not pull Tab onto its close
  // button, and one Escape must close search, not the explanation underneath.
  it("leaves Tab and Escape to search opened over it, then closes on the next Escape", () => {
    const view = render(createElement(React.Fragment, null,
      createElement(UniversalSearch, { onOpenResult: vi.fn() }),
      createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] }, compactHead: true })));
    fireEvent.click(view.getByRole("button", { name: "Learn about Hypertrophy potential" }));
    const term = view.getByRole("dialog", { name: "Hypertrophy potential explained" });
    expect(document.activeElement).toBe(view.getByRole("button", { name: "Close term explanation" }));

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = view.getByRole("combobox", { name: /search muscles/i });
    expect(document.activeElement).toBe(input);
    expect(fireEvent.keyDown(input, { key: "Tab" })).toBe(true);
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });
    expect(view.queryByRole("combobox", { name: /search muscles/i })).toBeNull();
    expect(term.isConnected).toBe(true);
    expect(view.getByRole("dialog", { name: "Hypertrophy potential explained" })).toBe(term);

    fireEvent.keyDown(document.activeElement ?? window, { key: "Escape" });
    expect(view.queryByRole("dialog", { name: "Hypertrophy potential explained" })).toBeNull();
  });

  it("says which analysis view is showing, and moves that when another is chosen", () => {
    // October 4: the views are tabs in the ARIA pattern, each controlling its panel.
    const view = renderPanel();
    expect(view.getByRole("tab", { name: "Fingerprint", selected: true })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Context", selected: false })).toBeTruthy();
    fireEvent.click(view.getByRole("tab", { name: "Context" }));
    expect(view.getByRole("tab", { name: "Context", selected: true })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Fingerprint", selected: false })).toBeTruthy();
    expect(view.getByRole("tabpanel", { name: "Context" })).toBeTruthy();
  });

  it("moves between the views with the arrow keys, Home and End, with one tab stop", () => {
    const view = renderPanel();
    const fingerprint = view.getByRole("tab", { name: "Fingerprint" });
    expect(view.getAllByRole("tab").filter((tab) => tab.getAttribute("tabindex") === "0")).toEqual([fingerprint]);
    fingerprint.focus();
    fireEvent.keyDown(fingerprint, { key: "ArrowRight" });
    expect(view.getByRole("tab", { name: "Muscle Genome", selected: true })).toBe(document.activeElement);
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(view.getByRole("tab", { name: "Context", selected: true })).toBe(document.activeElement);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(view.getByRole("tab", { name: "Fingerprint", selected: true })).toBe(document.activeElement);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(view.getByRole("tab", { name: "Context", selected: true })).toBe(document.activeElement);
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(view.getByRole("tab", { name: "Fingerprint", selected: true })).toBe(document.activeElement);
  });
});
