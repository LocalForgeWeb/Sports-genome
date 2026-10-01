// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AddDestinationStrip } from "./AddDestinationStrip";
import type { DaySlot } from "@/lib/trainingDayPlan";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const slots = [
  { key: "0-Push", ordinal: "Day 01", day: "Push", index: 0, label: "Day 01 · Push" },
  { key: "1-Pull", ordinal: "Day 02", day: "Pull", index: 1, label: "Day 02 · Pull" },
  { key: "2-Legs", ordinal: "Day 03", day: "Legs", index: 2, label: "Day 03 · Legs" },
] as unknown as DaySlot[];

const counts: Record<string, number> = { "0-Push": 5, "1-Pull": 6 };

function mount(over: Partial<Parameters<typeof AddDestinationStrip>[0]> = {}) {
  return render(createElement(AddDestinationStrip, {
    week: 2, slots, activeIndex: 1, exerciseCountFor: (slot) => counts[slot.key] || 0, onChoose: () => undefined, ...over,
  }));
}

afterEach(cleanup);

/**
 * A plus button adds to the active training day, which is chosen on Plan and
 * was named nowhere on the screens that carry plus buttons.
 */
describe("the add-destination strip", () => {
  it("names the week and day a plus will add to", () => {
    mount();
    expect(document.querySelector(".add-destination > summary")!.textContent).toContain("Adding to Week 2 · Pull");
    expect(screen.getByText(/change/i)).toBeTruthy();
  });

  it("offers the same days Plan does, with what each already holds, and marks the current one", () => {
    mount();
    fireEvent.click(document.querySelector(".add-destination > summary")!);
    const options = screen.getAllByRole("button");
    expect(options.map((option) => option.textContent)).toEqual(["Day 01 · Push5 planned", "Day 02 · Pull6 planned", "Day 03 · LegsEmpty"]);
    expect(options.map((option) => option.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
  });

  it("changes the day through the owner's handler and closes", () => {
    const onChoose = vi.fn();
    mount({ onChoose });
    const details = document.querySelector<HTMLDetailsElement>(".add-destination")!;
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Day 03 · Legs/ }));
    expect(onChoose).toHaveBeenCalledWith(2);
    expect(details.open).toBe(false);
  });

  it("renders nothing for a plan with no days", () => {
    mount({ slots: [] });
    expect(document.querySelector(".add-destination")).toBeNull();
  });
});

/**
 * Sep 30 brief §5: the strip is one concise line, not a card, and it never covers
 * the last row or the dock. jsdom has no layout, so the clearance is read from the
 * rules that produce it (measured in the browser at 320-430px: the strip rests
 * 22.8px above the dock at the end of the list).
 */
describe("the strip stays one line and out of the way", () => {
  const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
  const rule = (selector: string) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";
  const rem = (value: string) => parseFloat(value);

  it("draws the day on a single line with the change control beside it", () => {
    mount({ slots: [{ ...slots[1], day: "Sport Transfer and Conditioning" } as DaySlot, slots[0]], activeIndex: 0 });
    const summary = document.querySelector(".add-destination > summary")!;
    expect(Array.from(summary.children).map((node) => node.tagName)).toEqual(["svg", "SPAN", "EM"]);
    expect(summary.querySelector("span")!.textContent).toBe("Adding to Week 2 · Sport Transfer and Conditioning");
    expect(rule(".add-destination > summary > span")).toContain("white-space: nowrap");
    expect(rule(".add-destination > summary > span > *")).toContain("text-overflow: ellipsis");
    // Short of room, "Adding to" gives way long before the day does (measured at 320px with 125% text).
    expect(summary.querySelector(".add-destination-lead")?.textContent).toBe("Adding to");
    expect(Number(rule(".add-destination-lead").match(/flex: 0 (\d+) auto/)?.[1])).toBeGreaterThan(Number(rule(".add-destination > summary b").match(/flex: 0 (\d+) auto/)?.[1]));
  });

  it("is a flat bar: no gradient, no lifted shadow, a control's small radius", () => {
    const bar = rule(".add-destination");
    expect(bar).not.toContain("gradient");
    expect(bar).not.toContain("box-shadow");
    expect(bar).toContain("border-radius: var(--sg-radius-sm)");
    expect(rule(".add-destination > summary")).toContain("min-height: 2.75rem");
  });

  it("rides below the dock's layer and comes to rest in the flow above it at the end of the list", () => {
    const bar = rule(".add-destination");
    expect(Number(bar.match(/z-index: (\d+)/)?.[1])).toBeLessThan(46);
    expect(css).toContain(".mobile-workspace-dock { position: fixed; z-index: 46;");
    // Sticky line: dock height + .5rem. The page's own bottom padding is taller, so
    // when the list ends the strip sits in the flow after the last row, not over it.
    const stickyOffset = rem("4.375rem") + rem(".5rem");
    const contentPadding = rem(css.match(/\.apex-content \{ padding-bottom: calc\(([\d.]+rem)/)![1]);
    expect(bar).toContain("bottom: calc(var(--sg-dock-height, 4.375rem) + env(safe-area-inset-bottom, 0px) + .5rem)");
    expect(contentPadding).toBeGreaterThan(stickyOffset);
  });
});
