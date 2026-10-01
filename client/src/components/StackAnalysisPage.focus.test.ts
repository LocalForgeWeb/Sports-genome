// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StackAnalysisPage } from "./StackAnalysisPage";
import { UniversalSearch } from "./UniversalSearch";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { exercises } from "@/lib/exerciseCatalog";

/**
 * The full stack analysis is a layer over the Train page: focus moves into it,
 * Escape closes it, the page behind holds still, and focus goes back to Open
 * full analysis when it closes.
 */
const workout = ["Barbell Bench Press", "Seated Barbell Overhead Press", "Dumbbell Lateral Raise"]
  .map((name) => exercises.find((exercise) => exercise.name === name))
  .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise));

function props(onClose: () => void) {
  const analysis = analyzeSplitStack(workout, exercises, "Push");
  return {
    workout,
    split: "Push" as const,
    dayLabel: "Active Training Day",
    targetIndex: analysis.score,
    suggestions: analysis.suggestions,
    catalog: exercises,
    sportId: "baseball",
    prescriptions: Object.fromEntries(workout.map((exercise, index) => [exercise.id, `${index + 3} x 8`])),
    onAddSuggestion: () => undefined,
    onClose,
  };
}

describe("StackAnalysisPage as a layer", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    document.body.style.overflow = "";
  });

  it("focuses Close, locks the page behind, closes on Escape, and unlocks on close", () => {
    const onClose = vi.fn();
    const { unmount } = render(React.createElement(StackAnalysisPage, props(onClose)));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close stack analysis" }));
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("gives focus back to Open full analysis on close", () => {
    const opener = document.createElement("button");
    opener.textContent = "Open full analysis";
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(React.createElement(StackAnalysisPage, props(vi.fn())));
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
  });

  it("keeps focus and the lock when the panel re-renders it, and Escape uses the latest close", () => {
    const { rerender } = render(React.createElement(StackAnalysisPage, props(vi.fn())));
    const close = screen.getByRole("button", { name: "Close stack analysis" });
    expect(document.activeElement).toBe(close);
    // Somewhere else inside the analysis, as after adding a suggested fix.
    const row = screen.getAllByRole("button").find((button) => button !== close)!;
    row.focus();
    const latestClose = vi.fn();
    rerender(React.createElement(StackAnalysisPage, props(latestClose)));
    expect(document.activeElement).toBe(row);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(latestClose).toHaveBeenCalledTimes(1);
  });

  it("lets search opened over it close first, and leaves the page scrollable once both are closed", () => {
    function TrainWithAnalysis() {
      const [open, setOpen] = React.useState(true);
      return React.createElement(React.Fragment, null,
        React.createElement(UniversalSearch, { onOpenResult: () => undefined }),
        open ? React.createElement(StackAnalysisPage, props(() => setOpen(false))) : null);
    }
    render(React.createElement(TrainWithAnalysis));
    const analysis = () => screen.queryByRole("dialog", { name: "Training Day stack analysis" });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByRole("combobox");
    expect(document.activeElement).toBe(input);

    // The first Escape is for the search in front, not the analysis under it.
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(analysis()).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document.activeElement ?? window, { key: "Escape" });
    expect(analysis()).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});
