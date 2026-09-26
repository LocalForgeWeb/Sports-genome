import { Check } from "lucide-react";
import type { DaySlot } from "@/lib/trainingDayPlan";
import type { DayTrainingState } from "@/lib/liveSession";

/**
 * Which week, which day, and what that day is — in three rows.
 *
 * It used to be five blocks and roughly 900px before the first exercise: a hero
 * ("Design the day. See the week."), a week generator with three cards and its
 * own heading, a day header with prev/next arrows, a weekly board with five more
 * cards and a second Save button, and a "Build it, run it, print it" card. Three
 * of them named the same day. Picking a different day meant scrolling past the
 * one you were on to a grid below it.
 *
 * Weeks are pills and days are tabs, so both choices are one tap and both are
 * visible at once. The day states itself once, with the fact that it is already
 * saved — there is nothing to press, because the draft is written through to its
 * day on every change and has been for some time; the two Save buttons were
 * telling an athlete to do something the app had already done.
 */
export function TrainingPlanHeader({
  weeks, activeWeek, onSelectWeek, onGenerateWeek, nextWeekToGenerate,
  slots, activeIndex, exerciseCountFor, trainingStateFor, onChooseDay,
}: {
  weeks: { week: number; ready: boolean; savedDays: number }[];
  activeWeek: number;
  onSelectWeek: (week: number) => void;
  onGenerateWeek: () => void;
  nextWeekToGenerate: number | null;
  slots: DaySlot[];
  activeIndex: number;
  exerciseCountFor: (slot: DaySlot) => number;
  trainingStateFor?: (index: number) => DayTrainingState | null;
  onChooseDay: (index: number) => void;
}) {
  const active = slots[activeIndex] || slots[0];
  if (!active) return null;
  const count = exerciseCountFor(active);

  return <section className="training-plan-header" aria-label="Training plan selection">
    <div className="training-plan-title">
      <p className="metric-label">04 / saved training-day plans</p>
      <h1>Training plan</h1>
    </div>

    <div className="training-plan-weeks" role="tablist" aria-label="Training week">
      {weeks.map(({ week, ready, savedDays }) => {
        const selected = week === activeWeek;
        // An ungenerated week is not disabled: the pill is how you make it,
        // which is what the separate "Generate the weeks" block was for.
        const generates = !ready && week === nextWeekToGenerate;
        return <button
          key={week}
          type="button"
          role="tab"
          aria-selected={selected}
          disabled={!ready && !generates}
          onClick={() => (ready ? onSelectWeek(week) : onGenerateWeek())}
          className={`training-plan-week${selected ? " training-plan-week-active" : ""}`}
        >
          Week {week}
          <small>{ready ? (savedDays ? `${savedDays} saved` : "Empty") : generates ? "Generate" : "Locked"}</small>
        </button>;
      })}
    </div>

    <div className="training-plan-days" role="tablist" aria-label="Day of the week">
      {slots.map((slot, index) => {
        const selected = index === activeIndex;
        const trained = trainingStateFor?.(index) || null;
        const planned = exerciseCountFor(slot);
        return <button
          key={slot.key}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChooseDay(index)}
          className={`training-plan-day${selected ? " training-plan-day-active" : ""}${trained ? ` training-plan-day-${trained}` : ""}`}
        >
          {slot.day}
          <small>{trained === "live" ? "Training now" : trained === "trained" ? "Trained" : planned ? `${planned}` : "—"}</small>
        </button>;
      })}
    </div>

    <div className="training-plan-identity">
      <div>
        <h2>{active.day}</h2>
        <p>Week {activeWeek} · {active.ordinal} · {count ? `${count} exercise${count === 1 ? "" : "s"}` : "Empty"}</p>
      </div>
      {/* A status, not a control. Every edit is already written to this day. */}
      <span className="training-plan-saved"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved</span>
    </div>
  </section>;
}
