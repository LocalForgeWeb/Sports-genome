// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { AnatomyMap } from "./AnatomyMap";
import { ExerciseGenomePanel } from "./ExerciseGenomePanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

/**
 * Sep 30 brief §8: one icon family for functional controls. Two close buttons drew a "×"
 * character and the search-return bar a "←" entity, beside lucide icons everywhere else.
 * They are lucide icons now, hidden from assistive technology, with the button's own
 * accessible name unchanged.
 */
const iconOnly = (button: HTMLElement) => {
  const icon = button.querySelector("svg");
  expect(icon, "a lucide icon").toBeTruthy();
  expect(icon!.getAttribute("aria-hidden")).toBe("true");
  expect(button.textContent?.trim()).toBe("");
};

describe("glyph icons on functional controls", () => {
  it("closes a Genome term explanation with an icon, still named for screen readers", () => {
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const view = render(createElement(ExerciseGenomePanel, { exercise, context: { goal: "Muscle growth", currentWorkout: [exercise] }, compactHead: true }));
    fireEvent.click(view.getByRole("button", { name: "Learn about Hypertrophy potential" }));
    iconOnly(view.getByRole("button", { name: "Close term explanation" }));
  });

  it("clears a Body Lab muscle selection with an icon, still named for screen readers", () => {
    const { container, getByRole } = render(createElement(AnatomyMap, { primary: ["hamstrings"], secondary: [], onSelect: vi.fn() }));
    const hit = () => container.querySelector('.anatomy-hit[aria-label^="Hamstrings"]');
    if (!hit()) fireEvent.click(container.querySelector('.atlas-side-tab[aria-pressed="false"]')!);
    fireEvent.click(hit()!);
    iconOnly(getByRole("button", { name: "Clear muscle selection" }));
  });

  /** The components this correction touched keep no character standing in for an icon. */
  it.each([
    "../pages/Home.tsx",
    "./AnatomyMap.tsx",
    "./ExerciseGenomePanel.tsx",
    "./TrainingPlanHeader.tsx",
    "./DayCapacityNote.tsx",
  ])("leaves no glyph icon in a button in %s", (path) => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    const glyph = "(?:×|✕|✖|&times;|&#215;|&larr;|&rarr;|←|→|‹|›)";
    expect(source).not.toMatch(new RegExp(`<button[^>]*>\\s*${glyph}`));
    expect(source).not.toMatch(new RegExp(`${glyph}\\s*</button>`));
    expect(source).not.toMatch(/&larr;|&rarr;|&times;/);
  });
});
