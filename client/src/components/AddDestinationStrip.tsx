import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { DaySlot } from "@/lib/trainingDayPlan";
import { feedbackSurfaceRef } from "@/lib/feedbackClearance";

/**
 * Where a plus button on this screen puts an exercise.
 *
 * Matches and the catalog add to the active training day, which is state
 * chosen on Plan. Without this line the plus was an act of faith: it added to
 * a day named nowhere on the screen. The strip names the day, and Change opens
 * the same day choice Plan offers - the week stays the one Plan has open,
 * because generating or switching a week is Plan's job.
 *
 * One line and no card (Sep 30 brief, section 5): never wrapped. When the line is
 * short of room, "Adding to" gives way before the day does. It rides above the dock while the list scrolls and comes
 * to rest below the last row, so it never covers that row or the dock.
 */
export function AddDestinationStrip({ week, slots, activeIndex, exerciseCountFor, onChoose }: {
  week: number;
  slots: DaySlot[];
  activeIndex: number;
  exerciseCountFor: (slot: DaySlot) => number;
  onChoose: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = slots[activeIndex] || slots[0];
  if (!active) return null;
  /**
   * Opened and closed by this component, not by the element's own toggle: the
   * native `toggle` event is delivered asynchronously, so a choice made right
   * after opening could land before the open state did and fail to close it.
   * Toasts are lifted clear of it, open or closed (lib/feedbackClearance.ts).
   */
  return <details ref={feedbackSurfaceRef} className="add-destination" open={open}>
    <summary onClick={(event) => { event.preventDefault(); setOpen((current) => !current); }}>
      <CalendarDays className="h-5 w-5" aria-hidden="true" />
      <span><span className="add-destination-lead">Adding to</span> <b>Week {week} · {active.day}</b></span>
      <em>{open ? "Close" : "Change"} <ChevronDown className="h-4 w-4" aria-hidden="true" /></em>
    </summary>
    <div className="add-destination-options" role="group" aria-label="Day to add to">
      {slots.map((slot) => {
        const count = exerciseCountFor(slot);
        return <button key={slot.key} type="button" aria-pressed={slot.index === active.index} onClick={() => { onChoose(slot.index); setOpen(false); }}>
          {slot.ordinal} · {slot.day}<small>{count ? `${count} planned` : "Empty"}</small>
        </button>;
      })}
    </div>
  </details>;
}
