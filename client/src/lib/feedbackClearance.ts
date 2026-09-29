/**
 * Where toasts sit: one owner for how far they lift (Sep 28 regression brief §7 and §12).
 *
 * Toasts are pinned above the bottom navigation by index.css. Anything else that pins
 * controls to the bottom of the screen registers here, and the toaster is lifted clear of the
 * highest one on screen through `--sg-feedback-clear` (px from the viewport's bottom edge).
 *
 * It used to be two rules that disagreed: sonner's `mobileOffset`, overridden with !important
 * by a CSS rule whose lift knew only the add-destination strip and the resume bar, through
 * one `body:has()` per surface. The Strength region sheet was not on the list, so a toast sat
 * over its "Set focus" button at every phone width.
 *
 * Register with a ref: `ref={feedbackSurfaceRef}`. React 19 calls the cleanup it returns.
 */

const surfaces = new Set<Element>();
let frame = 0;
let resizeObserver: ResizeObserver | null = null;
/** Space kept between a toast and the surface it clears. */
const gap = 8;

function measure() {
  frame = 0;
  const height = window.innerHeight;
  let clear = 0;
  surfaces.forEach((surface) => {
    const rect = surface.getBoundingClientRect();
    if (!rect.height || rect.top >= height || rect.bottom <= 0) return;
    clear = Math.max(clear, height - rect.top + gap);
  });
  // A surface taller than the lower two thirds would push toasts off a short screen.
  clear = Math.min(clear, Math.round(height * 2 / 3));
  document.documentElement.style.setProperty("--sg-feedback-clear", `${Math.ceil(clear)}px`);
}

function schedule() {
  if (!frame) frame = window.requestAnimationFrame(measure);
}

/** Also listened for: a sheet that slides in or a sticky strip that scrolls moves without resizing. */
const moves = ["resize", "scroll", "transitionend", "animationend"] as const;

export function registerFeedbackSurface(surface: Element) {
  if (!surfaces.size) moves.forEach((type) => window.addEventListener(type, schedule, { passive: true, capture: true }));
  surfaces.add(surface);
  if (!resizeObserver && typeof ResizeObserver !== "undefined") resizeObserver = new ResizeObserver(schedule);
  resizeObserver?.observe(surface);
  schedule();
  return () => {
    surfaces.delete(surface);
    resizeObserver?.unobserve(surface);
    if (!surfaces.size) moves.forEach((type) => window.removeEventListener(type, schedule, { capture: true }));
    schedule();
  };
}

/** A stable callback ref for any element that pins controls to the bottom of the screen. */
export const feedbackSurfaceRef = (surface: Element | null) => (surface ? registerFeedbackSurface(surface) : undefined);
