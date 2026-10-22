import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";

/**
 * Hold a row, then drag it: the iPhone home screen's way of moving things (owner, 21 Oct 2026).
 *
 * Holding still on a row for a moment lifts it under the finger, and the list starts arranging:
 * the rows wiggle, and any of them can be picked up again with a shorter hold until Done. While
 * one is lifted, the others slide out of its way to show where it will land, and the page scrolls
 * when it is dragged near the top or bottom of the screen. Letting go drops it into that place.
 *
 * Moving before the hold completes is a scroll, as it always was, so the list still scrolls under
 * a thumb. A tap is still a tap until the list is arranging; then a tap on a row does nothing, as
 * on the home screen. Buttons, fields and an open editor never start a hold.
 *
 * While a row is dragged the transforms are written straight to the rows, so nothing re-renders
 * per finger movement. The new order is handed to `onMove` once, on the drop, and the rows are
 * put back in the same frame React draws them in their new places.
 */

/** How long a still finger has to rest on a row to lift it: about the home screen's. */
export const holdToLiftMs = 450;
/** Shorter once the list is already arranging, as on the home screen, but still long enough to tell from a scroll. */
export const holdToLiftWhileArrangingMs = 180;
/** A finger that travels further than this before the hold completes is scrolling. */
const slopPx = 8;
/** Within this distance of the screen's usable top or bottom, a dragged row scrolls the page. */
const scrollZonePx = 72;
const maxScrollStepPx = 16;
/** The bars that cover the screen's edges: the page's tab row above, the navigation dock below. */
const coveredTopPx = 64;
const coveredBottomPx = 88;
/** Never start a hold on these: they have work of their own. */
const ownControls = "button, a, input, select, textarea, label, [contenteditable], .prescription-editor";

type Row = { id: number; el: HTMLElement; top: number; height: number };
type Pending = { id: number; pointerId: number; x: number; y: number; timer: number };
type Drag = { id: number; pointerId: number; from: number; over: number; rows: Row[]; gap: number; startY: number; startScroll: number; clientY: number; frame: number };
type Handlers = { move: (event: PointerEvent) => void; up: (event: PointerEvent) => void; cancel: (event: PointerEvent) => void; lift: () => void; unlisten: () => void };

export function useHoldToArrange({ ids, onMove, enabled = true, resetKey }: {
  /** The rows, in their current order. */
  ids: readonly number[];
  /** A row was dropped at a new place: `to` is its index in the new order. */
  onMove: (id: number, to: number) => void;
  /** False while the list cannot be edited: nothing lifts. */
  enabled?: boolean;
  /** Arranging stops when this changes (another day, another week). */
  resetKey?: string;
}) {
  const [arranging, setArranging] = useState(false);
  const listRef = useRef<HTMLElement | null>(null);
  const rowEls = useRef(new Map<number, HTMLElement>());
  const pending = useRef<Pending | null>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const arrangingRef = useRef(arranging);
  arrangingRef.current = arranging;

  const stopArranging = useCallback(() => setArranging(false), []);

  // The window listeners are made once, and read everything through refs.
  const handlers = useRef<Handlers | null>(null);
  if (!handlers.current) {
    const unlisten = () => {
      const h = handlers.current!;
      window.removeEventListener("pointermove", h.move);
      window.removeEventListener("pointerup", h.up);
      window.removeEventListener("pointercancel", h.cancel);
    };
    const cancelPending = () => {
      if (pending.current) window.clearTimeout(pending.current.timer);
      pending.current = null;
    };
    /** Where the lifted row is now, where it would land, and every other row's way out of its path. */
    const paint = () => {
      const d = drag.current;
      if (!d) return;
      const self = d.rows[d.from];
      const first = d.rows[0];
      const last = d.rows[d.rows.length - 1];
      const raw = d.clientY + window.scrollY - d.startY - d.startScroll;
      // It may be dragged a little past either end of the list, never off into the page.
      const dy = Math.min(last.top + last.height - self.top - self.height + 24, Math.max(first.top - self.top - 24, raw));
      const centre = self.top + self.height / 2 + dy;
      let over = d.from;
      for (let index = d.from + 1; index < d.rows.length; index += 1) if (centre > d.rows[index].top + d.rows[index].height / 2) over = index;
      for (let index = d.from - 1; index >= 0; index -= 1) if (centre < d.rows[index].top + d.rows[index].height / 2) over = index;
      d.over = over;
      const span = self.height + d.gap;
      d.rows.forEach((row, index) => {
        if (index === d.from) { row.el.style.transform = `translate3d(0, ${dy}px, 0) scale(1.02)`; return; }
        const shift = d.from < index && index <= over ? -span : over <= index && index < d.from ? span : 0;
        row.el.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
      });
    };
    /** Scrolls the page while the lifted row is held near the top or bottom of the screen. */
    const autoScroll = () => {
      const d = drag.current;
      if (!d) return;
      const top = coveredTopPx + scrollZonePx;
      const bottom = window.innerHeight - coveredBottomPx - scrollZonePx;
      const first = d.rows[0];
      const last = d.rows[d.rows.length - 1];
      let step = 0;
      // Only while part of the list is still hidden that way: past its ends there is nowhere to go.
      if (d.clientY < top && first.top - window.scrollY < coveredTopPx) step = -Math.min(maxScrollStepPx, Math.ceil(((top - d.clientY) / scrollZonePx) * maxScrollStepPx));
      else if (d.clientY > bottom && last.top + last.height - window.scrollY > window.innerHeight - coveredBottomPx) step = Math.min(maxScrollStepPx, Math.ceil(((d.clientY - bottom) / scrollZonePx) * maxScrollStepPx));
      if (step) {
        const before = window.scrollY;
        window.scrollBy(0, step);
        if (window.scrollY !== before) paint();
      }
      d.frame = window.requestAnimationFrame(autoScroll);
    };
    const lift = () => {
      const p = pending.current;
      pending.current = null;
      if (!p) return;
      const order = idsRef.current;
      const from = order.indexOf(p.id);
      const rows = order.map((id) => {
        const el = rowEls.current.get(id);
        const rect = el?.getBoundingClientRect();
        return el && rect ? { id, el, top: rect.top + window.scrollY, height: rect.height } : null;
      });
      if (from < 0 || order.length < 2 || rows.some((row) => !row)) { unlisten(); return; }
      const measured = rows as Row[];
      const gap = Math.max(0, measured[1].top - (measured[0].top + measured[0].height));
      drag.current = { id: p.id, pointerId: p.pointerId, from, over: from, rows: measured, gap, startY: p.y, startScroll: window.scrollY, clientY: p.y, frame: 0 };
      // The finger comes up on the row it lifted: that is not a tap on the row.
      suppressClick.current = true;
      listRef.current?.setAttribute("data-dragging", "");
      measured[from].el.setAttribute("data-lifted", "");
      try { navigator.vibrate?.(10); } catch { /* Not every browser lets a page buzz. */ }
      setArranging(true);
      paint();
      drag.current.frame = window.requestAnimationFrame(autoScroll);
    };
    /** Puts the lifted row down: in its new place when `commit`, back where it was otherwise. */
    const drop = (commit: boolean) => {
      const d = drag.current;
      drag.current = null;
      unlisten();
      if (!d) return;
      window.cancelAnimationFrame(d.frame);
      const self = d.rows[d.from];
      const to = commit ? d.over : d.from;
      const slot = to > d.from
        ? d.rows.slice(d.from + 1, to + 1).reduce((sum, row) => sum + row.height + d.gap, 0)
        : to < d.from ? -d.rows.slice(to, d.from).reduce((sum, row) => sum + row.height + d.gap, 0) : 0;
      if (!commit) d.rows.forEach((row, index) => { if (index !== d.from) row.el.style.transform = ""; });
      self.el.style.transition = "transform var(--sg-motion-fast) var(--sg-ease)";
      self.el.style.transform = `translate3d(0, ${slot}px, 0)`;
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        const list = listRef.current;
        list?.setAttribute("data-settling", "");
        // One task, so one frame: the new order is drawn and every row is put back in it together.
        if (to !== d.from) flushSync(() => onMoveRef.current(self.id, to));
        d.rows.forEach((row) => { row.el.style.transition = ""; row.el.style.transform = ""; row.el.removeAttribute("data-lifted"); });
        list?.removeAttribute("data-dragging");
        window.requestAnimationFrame(() => list?.removeAttribute("data-settling"));
      };
      self.el.addEventListener("transitionend", settle, { once: true });
      // A transition that never runs (reduced motion, no change) still has to settle.
      window.setTimeout(settle, 220);
      // The click that follows this pointerup is the drop, not a tap; after it, taps are taps.
      window.setTimeout(() => { suppressClick.current = false; }, 350);
    };
    handlers.current = {
      move: (event) => {
        const p = pending.current;
        if (p && event.pointerId === p.pointerId) {
          if (Math.hypot(event.clientX - p.x, event.clientY - p.y) > slopPx) { cancelPending(); unlisten(); }
          return;
        }
        const d = drag.current;
        if (!d || event.pointerId !== d.pointerId) return;
        d.clientY = event.clientY;
        paint();
      },
      up: (event) => {
        if (pending.current?.pointerId === event.pointerId) { cancelPending(); unlisten(); return; }
        if (drag.current?.pointerId === event.pointerId) drop(true);
      },
      cancel: (event) => {
        if (pending.current?.pointerId === event.pointerId) { cancelPending(); unlisten(); return; }
        if (drag.current?.pointerId === event.pointerId) drop(false);
      },
      lift,
      unlisten,
    };
  }

  const onRowPointerDown = useCallback((id: number) => (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || pending.current || drag.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as Element).closest(ownControls)) return;
    if (idsRef.current.length < 2) return;
    const h = handlers.current!;
    suppressClick.current = false;
    const timer = window.setTimeout(h.lift, arrangingRef.current ? holdToLiftWhileArrangingMs : holdToLiftMs);
    pending.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, timer };
    window.addEventListener("pointermove", h.move, { passive: true });
    window.addEventListener("pointerup", h.up);
    window.addEventListener("pointercancel", h.cancel);
  }, [enabled]);

  /** Keeps the drop's click, and any tap on a row while arranging, from opening the row. */
  const onListClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    const onRow = Boolean((event.target as Element).closest("summary"));
    const swallow = suppressClick.current || (arrangingRef.current && onRow);
    suppressClick.current = false;
    if (!swallow) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /** A long press on a row is this gesture, never the browser's menu for the photograph. */
  const onListContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (pending.current || drag.current || arrangingRef.current) event.preventDefault();
  }, []);

  /**
   * The ref for the list, which is also where touch scrolling is held still once a row is lifted.
   * That listener is not passive, and it is on the list before any touch starts there, so iOS
   * Safari honours its preventDefault in the middle of a gesture. Before the lift it does nothing.
   */
  const holdScroll = useRef((event: TouchEvent) => { if (drag.current && event.cancelable) event.preventDefault(); });
  const listRefCallback = useCallback((el: HTMLElement | null) => {
    listRef.current?.removeEventListener("touchmove", holdScroll.current);
    listRef.current = el;
    el?.addEventListener("touchmove", holdScroll.current, { passive: false });
  }, []);

  // Escape, a tap anywhere outside the list, another day, or too few rows to arrange: Done.
  useEffect(() => {
    if (!arranging) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setArranging(false); };
    const onOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      // The move's own message (and its Undo) belongs to arranging, as the Done bar does.
      if (!target || listRef.current?.contains(target) || target.closest("[data-arrange-keep], [data-sonner-toaster]")) return;
      setArranging(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onOutside, true);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("click", onOutside, true); };
  }, [arranging]);
  useEffect(() => { setArranging(false); }, [resetKey]);
  useEffect(() => { if (ids.length < 2) setArranging(false); }, [ids.length]);

  // Leaving mid-gesture drops nothing and leaves no listener behind.
  useEffect(() => () => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    if (drag.current) window.cancelAnimationFrame(drag.current.frame);
    pending.current = null;
    drag.current = null;
    handlers.current?.unlisten();
  }, []);

  const rowRef = useCallback((id: number) => (el: HTMLElement | null) => {
    if (el) rowEls.current.set(id, el);
    else rowEls.current.delete(id);
  }, []);

  return { arranging, stopArranging, listRef: listRefCallback, onListClickCapture, onListContextMenu, rowRef, onRowPointerDown };
}
