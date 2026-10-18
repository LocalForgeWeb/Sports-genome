// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearBand, revealClearOfBars, scrollToTopClear } from "./reveal";

/**
 * Where a message the athlete must see lands on a phone (CLAUDE.md: Undo in the message, every
 * control clearly visible): clear of the bottom dock and the sticky tab row, measured, since
 * Chromium ignores scroll-margin for a box that is already inside the viewport (F-phone-2).
 * jsdom draws nothing, so each box is placed by hand, as a 390 × 844 phone measured it.
 */

const box = (top: number, height: number, width = 358) => ({ top, bottom: top + height, left: 16, right: 16 + width, width, height, x: 16, y: top, toJSON: () => ({}) }) as DOMRect;
const boxes = new Map<Element, DOMRect>();
const add = (className: string, at: DOMRect | null, parent: Element = document.body) => {
  const element = document.createElement("div");
  element.className = className;
  parent.appendChild(element);
  if (at) boxes.set(element, at);
  return element;
};

let scrollBy: ReturnType<typeof vi.spyOn>;
let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  Object.defineProperty(window, "innerHeight", { value: 844, configurable: true });
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) { return boxes.get(this) ?? box(0, 0, 0); });
  Element.prototype.scrollIntoView = vi.fn();
  scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  boxes.clear();
  document.body.innerHTML = "";
  Object.defineProperty(window, "innerHeight", { value: 768, configurable: true });
});

describe("the band nothing is pinned over", () => {
  it("runs from under the sticky tab row to the top of the bottom dock", () => {
    add("workspace-top-switcher-shell", box(0, 59));
    add("mobile-workspace-dock", box(774, 70));
    expect(clearBand()).toEqual({ top: 59, bottom: 774 });
  });

  it("is the whole screen when nothing is pinned (a dock that is not drawn counts for nothing)", () => {
    add("mobile-workspace-dock", null);
    expect(clearBand()).toEqual({ top: 0, bottom: 844 });
  });
});

describe("revealing an Undo", () => {
  beforeEach(() => {
    add("workspace-top-switcher-shell", box(0, 59));
    add("mobile-workspace-dock", box(774, 70));
  });

  it("lifts an Undo drawn under the dock, though it is already on screen, 12 px clear of it", () => {
    const undo = add("undo", box(795, 44));
    revealClearOfBars(undo);
    expect(undo.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    expect(scrollBy).toHaveBeenCalledWith({ top: 839 - (774 - 12), behavior: "instant" });
  });

  it("lifts an Undo half under the dock by just as much as it takes", () => {
    const undo = add("undo", box(755, 44));
    revealClearOfBars(undo);
    expect(scrollBy).toHaveBeenCalledWith({ top: 799 - 762, behavior: "instant" });
  });

  it("brings an Undo down from under the sticky tab row", () => {
    const undo = add("undo", box(30, 44));
    revealClearOfBars(undo);
    expect(scrollBy).toHaveBeenCalledWith({ top: 30 - (59 + 12), behavior: "instant" });
  });

  it("leaves an Undo that is clear where it is", () => {
    revealClearOfBars(add("undo", box(480, 44)));
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("inside a sheet leaves it to the sheet's own scroller: nothing is pinned over a sheet's body", () => {
    const sheet = add("spz-sheet", box(100, 744));
    sheet.setAttribute("role", "dialog");
    const undo = add("undo", box(795, 44), sheet);
    revealClearOfBars(undo);
    expect(undo.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("measures nothing it cannot see (jsdom, or an element not drawn)", () => {
    revealClearOfBars(add("undo", null));
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

describe("taking the athlete to a section", () => {
  it("puts its top just under the sticky tab row, not under it", () => {
    add("workspace-top-switcher-shell", box(0, 59));
    const method = add("method", box(500, 300));
    Object.defineProperty(window, "scrollY", { value: 1000, configurable: true });
    scrollToTopClear(method);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000 + 500 - (59 + 12), behavior: "smooth" });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("does not animate under reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    try {
      scrollToTopClear(add("method", box(500, 300)));
      expect(scrollTo).toHaveBeenCalledWith({ top: 500 - 12, behavior: "auto" });
    } finally {
      window.matchMedia = original;
    }
  });
});
