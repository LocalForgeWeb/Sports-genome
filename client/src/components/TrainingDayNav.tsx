import React, { useEffect, useRef } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { DaySlot } from "@/lib/trainingDayPlan";

/**
 * The one control that says which day you are building, and moves you to another.
 *
 * Training Day used to state the active day in a heading halfway down the page while
 * the only way to change it was a card grid in a side rail that collapses below the
 * fold on a phone - so on the screen most athletes use, the day you were editing and
 * the way to change it were never visible at the same time.
 *
 * This renders as two siblings, not one block, and only the second one follows you.
 * As one sticky unit it was 219px tall, which on a phone joined a topbar and a tab row
 * already pinned above it: 354px of the 852px screen was chrome that never moved, and
 * the page showed through a 428px slot. The title, the count and the saved-state note
 * are worth reading once and are not worth a quarter of the screen thereafter, so they
 * scroll away. The day strip stays, because it is the part you reach for - and it still
 * answers "which day am I on" by which chip is lit.
 *
 * They are siblings because a sticky child can only travel inside its own container: a
 * strip nested in the header would unstick the moment the header scrolled past.
 */
export function TrainingDayNav({ week, slots, activeIndex, exerciseCountFor, onOpen, onCycle }: {
  week: number;
  slots: DaySlot[];
  activeIndex: number;
  exerciseCountFor: (slot: DaySlot) => number;
  onOpen: (index: number) => void;
  onCycle: (direction: -1 | 1) => void;
}) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const active = slots[activeIndex] || slots[0];
  const activeCount = active ? exerciseCountFor(active) : 0;

  // Moving to a day that sits off the end of the strip should not look like moving nowhere.
  useEffect(() => {
    const current = stripRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    // Not every environment implements scrolling; the strip stays usable without it.
    if (typeof current?.scrollIntoView === "function") current.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [activeIndex, slots.length]);

  if (!active) return null;

  return <>
    <section className="training-day-nav" aria-label="Training day selection">
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
    </section>
    <div className="training-day-nav-strip" ref={stripRef} role="tablist" aria-label={`Week ${week} training days`}>
      {slots.map((slot) => {
        const count = exerciseCountFor(slot);
        const current = slot.index === activeIndex;
        return <button
          key={slot.key}
          type="button"
          role="tab"
          aria-selected={current}
          aria-current={current}
          onClick={() => onOpen(slot.index)}
          className={`training-day-chip ${current ? "training-day-chip-active" : ""} ${count ? "training-day-chip-filled" : ""}`}
        >
          <span>{slot.ordinal}</span>
          <strong>{slot.day}</strong>
          <small>{count ? `${count} exercise${count === 1 ? "" : "s"}` : "Empty"}</small>
        </button>;
      })}
    </div>
  </>;
}
