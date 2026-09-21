import React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { DaySlot } from "@/lib/trainingDayPlan";

/**
 * The one control that says which day you are building, and moves you to another.
 *
 * It was two: this header, and a pinned strip of day chips beneath it. The strip
 * was a third pinned band stacked under a topbar and a tab row, and content
 * scrolled beneath it into a gap too small to read - the week cards passed
 * behind it half-covered. Asked for directly: get rid of it.
 *
 * So the header is the whole control again, and it scrolls with the page like
 * everything else. Which day you are on is the heading; moving is the pair of
 * arrows beside the count. What the strip added over that was the other days'
 * names and exercise counts at a glance, which is a real loss and the reason it
 * existed - the weekly board further down the page is where that lives now.
 */
export function TrainingDayNav({ week, slots, activeIndex, exerciseCountFor, onCycle }: {
  week: number;
  slots: DaySlot[];
  activeIndex: number;
  exerciseCountFor: (slot: DaySlot) => number;
  onCycle: (direction: -1 | 1) => void;
}) {
  const active = slots[activeIndex] || slots[0];
  const activeCount = active ? exerciseCountFor(active) : 0;

  if (!active) return null;

  return <section className="training-day-nav" aria-label="Training day selection">
    <div className="training-day-nav-head">
      <div className="training-day-nav-current">
        <p className="metric-label">Week {week} · building</p>
        <h2>{active.ordinal} <span>/</span> {active.day}</h2>
        <p className="training-day-nav-state">{activeCount ? `${activeCount} exercise${activeCount === 1 ? "" : "s"} in this day` : "Empty — add exercises below"}<span className="training-day-nav-autosave"><Check className="h-3 w-3" /> Saved to this day as you edit</span></p>
      </div>
      <div className="training-day-nav-cycle">
        <button type="button" onClick={() => onCycle(-1)} aria-label="Previous training day" disabled={slots.length < 2}><ChevronLeft className="h-4 w-4" /></button>
        <span aria-live="polite">{active.ordinal} of {String(slots.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => onCycle(1)} aria-label="Next training day" disabled={slots.length < 2}><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  </section>;
}
