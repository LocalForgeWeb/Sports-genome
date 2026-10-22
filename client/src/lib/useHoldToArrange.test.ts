// @vitest-environment jsdom
import React, { createElement as h, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { holdToLiftMs, holdToLiftWhileArrangingMs, useHoldToArrange } from "./useHoldToArrange";
import { moveTo } from "./trainingDayPlan";

/**
 * Moving exercises like apps on the iPhone home screen (owner, 21 Oct 2026): hold still to
 * lift, drag to a new place while the others slide aside, let go to drop. A finger that moves
 * first is scrolling; a tap is still a tap; the list keeps arranging until Done.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const rowTop = 200;
const rowHeight = 100;
const centre = (index: number) => rowTop + index * rowHeight + rowHeight / 2;
const taps: number[] = [];
const moves: [number, number][] = [];

function Harness({ initial, enabled = true }: { initial: number[]; enabled?: boolean }) {
  const [ids, setIds] = useState(initial);
  const arrange = useHoldToArrange({
    ids,
    enabled,
    onMove: (id, to) => { moves.push([id, to]); setIds((current) => moveTo(current.map((value) => ({ id: value })), id, to).map((row) => row.id)); },
  });
  return h("div", null,
    h("div", { ref: arrange.listRef, "data-testid": "list", "data-arranging": arrange.arranging ? "yes" : "no", onClickCapture: arrange.onListClickCapture, onContextMenu: arrange.onListContextMenu },
      ids.map((id) => h("div", { key: id, "data-row": "", "data-testid": `row-${id}`, ref: arrange.rowRef(id), onPointerDown: arrange.onRowPointerDown(id) },
        h("details", null, h("summary", { onClick: () => taps.push(id) }, `Exercise ${id}`)),
        h("button", { type: "button", onClick: () => taps.push(-id) }, `Remove ${id}`)))),
    arrange.arranging && h("button", { type: "button", "data-arrange-keep": "", onClick: arrange.stopArranging }, "Done"),
    h("button", { type: "button" }, "Somewhere else"));
}

const row = (id: number) => screen.getByTestId(`row-${id}`);
const summary = (id: number) => row(id).querySelector("summary")!;
const order = () => [...screen.getByTestId("list").children].map((el) => Number(el.getAttribute("data-testid")!.slice(4)));
const arranging = () => screen.getByTestId("list").getAttribute("data-arranging") === "yes";
const down = (target: Element, y: number, pointerId = 1) => fireEvent.pointerDown(target, { pointerId, clientX: 120, clientY: y, button: 0, pointerType: "touch" });
const move = (y: number, pointerId = 1, x = 120) => act(() => { window.dispatchEvent(new PointerEvent("pointermove", { pointerId, clientX: x, clientY: y })); });
const up = (y: number, pointerId = 1) => act(() => { window.dispatchEvent(new PointerEvent("pointerup", { pointerId, clientX: 120, clientY: y })); });
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
/** Holds a row still, drags it in steps to `toY`, and lets go. */
const holdAndDrag = (id: number, fromY: number, toY: number, hold = holdToLiftMs) => {
  down(summary(id), fromY);
  wait(hold + 10);
  for (let step = 1; step <= 5; step += 1) move(fromY + ((toY - fromY) * step) / 5);
  up(toY);
  wait(260);
};

beforeEach(() => {
  vi.useFakeTimers();
  taps.length = 0;
  moves.length = 0;
  // Each row's box follows its place in the list, as layout would.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const rowEl = this.closest("[data-row]") as HTMLElement | null;
    const index = rowEl ? [...rowEl.parentElement!.children].indexOf(rowEl) : 0;
    const top = rowTop + index * rowHeight;
    return { top, bottom: top + rowHeight, height: rowHeight, left: 0, right: 360, width: 360, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("hold to move a row", () => {
  it("lifts a row held still, slides the others aside, and drops it where it is let go", () => {
    render(h(Harness, { initial: [1, 2, 3, 4] }));
    down(summary(1), centre(0));
    wait(holdToLiftMs - 50);
    expect(arranging()).toBe(false);
    wait(60);
    expect(arranging()).toBe(true);
    expect(row(1).hasAttribute("data-lifted")).toBe(true);

    // Past the second and third rows' middles: those two step up to make room.
    move(centre(0) + 110);
    move(centre(0) + 220);
    expect(row(2).style.transform).toBe("translate3d(0, -100px, 0)");
    expect(row(3).style.transform).toBe("translate3d(0, -100px, 0)");
    expect(row(4).style.transform).toBe("");
    expect(row(1).style.transform).toContain("translate3d(0, 220px, 0)");

    up(centre(0) + 220);
    expect(order()).toEqual([1, 2, 3, 4]);
    wait(260);
    expect(moves).toEqual([[1, 2]]);
    expect(order()).toEqual([2, 3, 1, 4]);
    // Every row is back in the flow, and the list is still arranging, as the home screen stays.
    expect([1, 2, 3, 4].map((id) => row(id).style.transform)).toEqual(["", "", "", ""]);
    expect(row(1).hasAttribute("data-lifted")).toBe(false);
    expect(arranging()).toBe(true);
  });

  it("moves a row up as well as down", () => {
    render(h(Harness, { initial: [1, 2, 3, 4] }));
    holdAndDrag(4, centre(3), centre(0) - 10);
    expect(moves).toEqual([[4, 0]]);
    expect(order()).toEqual([4, 1, 2, 3]);
  });

  it("treats a finger that moves before the hold as a scroll, and lifts nothing", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    down(summary(2), centre(1));
    wait(100);
    move(centre(1) - 20);
    wait(holdToLiftMs);
    up(centre(1) - 20);
    expect(arranging()).toBe(false);
    expect(row(2).hasAttribute("data-lifted")).toBe(false);
    expect(moves).toEqual([]);
  });

  it("leaves a tap alone: it opens the row as before", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    down(summary(2), centre(1));
    wait(120);
    up(centre(1));
    fireEvent.click(summary(2));
    expect(taps).toEqual([2]);
    expect(arranging()).toBe(false);
  });

  it("does not count the drop as a tap on the row", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    down(summary(1), centre(0));
    wait(holdToLiftMs + 10);
    up(centre(0));
    fireEvent.click(summary(1));
    expect(taps).toEqual([]);
  });

  it("while arranging: a tap on a row opens nothing, its buttons still work, and a shorter hold lifts", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    holdAndDrag(1, centre(0), centre(0));
    expect(arranging()).toBe(true);
    wait(400);
    fireEvent.click(summary(2));
    expect(taps).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Remove 2" }));
    expect(taps).toEqual([-2]);

    down(summary(3), centre(2));
    wait(holdToLiftWhileArrangingMs + 10);
    expect(row(3).hasAttribute("data-lifted")).toBe(true);
    move(centre(0) - 10);
    up(centre(0) - 10);
    wait(260);
    expect(order()).toEqual([3, 1, 2]);
  });

  it("never starts a hold on a button inside the row", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    down(screen.getByRole("button", { name: "Remove 1" }), centre(0));
    wait(holdToLiftMs + 50);
    expect(arranging()).toBe(false);
  });

  it("puts the row back where it was when the system takes the gesture", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    down(summary(1), centre(0));
    wait(holdToLiftMs + 10);
    move(centre(2));
    act(() => { window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 })); });
    wait(260);
    expect(moves).toEqual([]);
    expect(order()).toEqual([1, 2, 3]);
    expect([1, 2, 3].map((id) => row(id).style.transform)).toEqual(["", "", ""]);
  });

  it("holds the page still only while a row is lifted", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    const touchMove = () => { const event = new Event("touchmove", { bubbles: true, cancelable: true }); summary(1).dispatchEvent(event); return event.defaultPrevented; };
    expect(touchMove()).toBe(false);
    down(summary(1), centre(0));
    expect(touchMove()).toBe(false);
    wait(holdToLiftMs + 10);
    expect(touchMove()).toBe(true);
    up(centre(0));
    wait(260);
    expect(touchMove()).toBe(false);
  });

  it("keeps the browser's long-press menu off a row while holding", () => {
    render(h(Harness, { initial: [1, 2] }));
    down(summary(1), centre(0));
    expect(fireEvent.contextMenu(summary(1))).toBe(false);
  });

  it("ends arranging with Done, with Escape, or with a tap outside the list", () => {
    render(h(Harness, { initial: [1, 2, 3] }));
    const start = () => { down(summary(1), centre(0)); wait(holdToLiftMs + 10); up(centre(0)); wait(400); expect(arranging()).toBe(true); };
    start();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(arranging()).toBe(false);
    start();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(arranging()).toBe(false);
    start();
    fireEvent.click(screen.getByRole("button", { name: "Somewhere else" }));
    expect(arranging()).toBe(false);
  });

  it("lifts nothing while the list cannot be edited, or when there is only one row", () => {
    const view = render(h(Harness, { initial: [1, 2], enabled: false }));
    down(summary(1), centre(0));
    wait(holdToLiftMs + 50);
    expect(arranging()).toBe(false);
    view.unmount();
    render(h(Harness, { initial: [1] }));
    down(summary(1), centre(0));
    wait(holdToLiftMs + 50);
    expect(arranging()).toBe(false);
  });
});
