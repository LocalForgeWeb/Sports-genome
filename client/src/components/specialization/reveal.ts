/**
 * Where the page puts a message the athlete has to see (an Undo, the line after it), or the
 * part of the page a sheet sent them to: in view, clear of what is pinned over the page on a
 * phone. Phone first (CLAUDE.md): the bottom dock (`.mobile-workspace-dock`, which holds
 * `.mobile-bottom-nav` and pads itself with the bottom safe area), the bar above it while a
 * workout is open (`.session-resume-bar`), and the sticky tab row at the top
 * (`.workspace-top-switcher-shell`, which pads itself with the top safe area).
 *
 * The page cannot leave this to `scroll-margin` with `scrollIntoView({ block: "nearest" })`:
 * Chromium ignores the margin when the element's box is already inside the viewport, which is
 * exactly the case of an Undo drawn under the dock. So the element is brought into view first,
 * then measured against the bars, and the page is scrolled by the difference.
 *
 * Inside a sheet (`role="dialog"`) the sheet's own body is the scroller and nothing is pinned
 * over it (its footer, when it has one, is outside the body), so "nearest" is all it takes.
 */

const BOTTOM_BARS = ".mobile-workspace-dock, .mobile-bottom-nav, .session-resume-bar";
const TOP_BARS = ".workspace-top-switcher-shell";
/** Room between the element and a bar, so it does not sit flush against it. */
const GAP = 12;

const drawn = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.height > 0 && box.width > 0 && getComputedStyle(element).visibility !== "hidden" ? box : null;
};

/** The band of the screen nothing is pinned over: from under the top bars to above the bottom ones. */
export function clearBand(): { top: number; bottom: number } {
  const bottoms = Array.from(document.querySelectorAll(BOTTOM_BARS)).map(drawn).filter((box): box is DOMRect => box !== null);
  const tops = Array.from(document.querySelectorAll(TOP_BARS)).map(drawn).filter((box): box is DOMRect => box !== null);
  return {
    // A bar pinned to the bottom starts where the clear band ends; with none, the screen's edge does.
    bottom: Math.min(window.innerHeight, ...bottoms.map((box) => box.top)),
    // The tab row sticks to the top once the page scrolls under it; before that its bottom is where the page begins anyway.
    top: Math.max(0, ...tops.map((box) => box.bottom)),
  };
}

const motion = (): ScrollBehavior => (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

/** Brings an element into view, clear of the bottom dock and the sticky tab row. Focus is the caller's (with `preventScroll`). */
export function revealClearOfBars(element: HTMLElement): void {
  // Optional call: jsdom has no scrollIntoView.
  element.scrollIntoView?.({ block: "nearest" });
  if (element.closest('[role="dialog"]')) return;
  const box = element.getBoundingClientRect();
  // Nothing drawn (jsdom, or display: none): nothing to measure.
  if (box.height <= 0) return;
  const band = clearBand();
  if (box.bottom > band.bottom - GAP) window.scrollBy({ top: box.bottom - (band.bottom - GAP), behavior: "instant" });
  else if (box.top < band.top + GAP) window.scrollBy({ top: box.top - (band.top + GAP), behavior: "instant" });
}

/** Scrolls the page so an element's top sits just under the sticky tab row (a section a sheet sent the athlete to). */
export function scrollToTopClear(element: HTMLElement): void {
  const box = element.getBoundingClientRect();
  if (box.height <= 0) { element.scrollIntoView?.({ block: "start" }); return; }
  window.scrollTo({ top: Math.max(0, window.scrollY + box.top - (clearBand().top + GAP)), behavior: motion() });
}
