// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DayExercisePicker } from "./DayExercisePicker";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

// Under jsdom import.meta.url is an http: URL, so the stylesheet is read by path.
const styles = readFileSync(resolve(process.cwd(), "client/src/workout-planner.css"), "utf8");

const props = (sheetOpen: boolean) => ({
  exercises, activeWorkout: [] as typeof exercises, split: "Pull" as const, sheetOpen,
  onOpenSheet: () => undefined, onCloseSheet: () => undefined, onAdd: () => undefined, onReplace: () => undefined, onInspect: () => undefined,
});

/**
 * Reported from a phone: "when I type it moves me up and down the site". Two
 * causes, both measured. The sheet was bottom-anchored with a maximum height, so
 * as the results shrank from 24 rows to 2 its top edge - search box included -
 * slid 247px down the screen and back. And the page behind the fixed sheet was
 * still scrollable, so iOS scrolled the document to reveal the focused box on
 * every keystroke.
 */
describe("the picker sheet holds still while the athlete types", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    vi.stubGlobal("scrollTo", vi.fn());
    Object.defineProperty(window, "scrollY", { value: 1919, configurable: true });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.removeAttribute("style"); });

  it("keeps one height however many rows the search returns", () => {
    expect(styles).toMatch(/\.day-picker-sheet \{[^}]*\bheight: min\(92dvh, 900px\)/);
    expect(styles).not.toMatch(/\.day-picker-sheet \{[^}]*max-height/);
  });

  it("pins the page where it was while the sheet is up, and puts it back on close", () => {
    const view = render(createElement(DayExercisePicker, props(true)));
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-1919px");
    expect(document.body.style.overflow).toBe("hidden");

    view.rerender(createElement(DayExercisePicker, props(false)));
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    // The athlete's place on the day, not the top of it.
    expect(window.scrollTo).toHaveBeenCalledWith(0, 1919);
  });

  it("leaves the page alone when the sheet was never opened", () => {
    render(createElement(DayExercisePicker, props(false)));
    expect(document.body.style.position).toBe("");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
