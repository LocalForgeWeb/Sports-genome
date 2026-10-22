import type { SplitDay } from "@/lib/splitCycle";
import { dayTypes, describeDays, matchingPreset, maxTrainingDays, splitPresets } from "@/lib/weekLayout";

/**
 * Setting up the week, in place under the week row (owner, 22 Oct 2026): how many days, what
 * each day is, and ready-made splits to start from. Every option is on the page at once,
 * so "five Upper days" is two taps away rather than out of reach. The day tabs right below
 * follow every change as it is made, and a day keeps its exercises when its type changes.
 */
export function WeekLayoutEditor({ split, exerciseCountFor, onDays, onPreset, onDayType, onDone }: {
  /** This week's days, in order. */
  split: readonly SplitDay[];
  /** Exercises on a day of the week being looked at, by position. */
  exerciseCountFor: (index: number) => number;
  onDays: (days: number) => void;
  onPreset: (days: SplitDay[], name: string) => void;
  onDayType: (index: number, type: SplitDay) => void;
  onDone: () => void;
}) {
  const presets = splitPresets(split.length);
  const current = matchingPreset(split);
  return <section id="training-plan-layout" className="week-layout" aria-labelledby="week-layout-title">
    <div className="week-layout-head">
      <h2 id="week-layout-title">Your training days</h2>
      <button type="button" className="week-layout-done" onClick={onDone}>Done</button>
    </div>

    <fieldset className="week-layout-field">
      <legend>Days a week</legend>
      <div className="week-layout-count">
        {Array.from({ length: maxTrainingDays }, (_, index) => index + 1).map((days) => <button
          key={days}
          type="button"
          aria-pressed={days === split.length}
          aria-label={`${days} ${days === 1 ? "day" : "days"} a week`}
          onClick={() => onDays(days)}
        >{days}</button>)}
      </div>
    </fieldset>

    <fieldset className="week-layout-field">
      <legend>Each day</legend>
      <ol className="week-layout-days">
        {split.map((day, index) => {
          const count = exerciseCountFor(index);
          return <li key={index}>
            <label htmlFor={`week-layout-day-${index}`}><b>Day {index + 1}</b><small>{count ? `${count} exercise${count === 1 ? "" : "s"}` : "Empty"}</small></label>
            <select id={`week-layout-day-${index}`} value={day} onChange={(event) => onDayType(index, event.target.value as SplitDay)}>
              {dayTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </li>;
        })}
      </ol>
    </fieldset>

    <fieldset className="week-layout-field">
      <legend>Quick splits</legend>
      <div className="week-layout-presets">
        {presets.map((preset) => <button key={preset.id} type="button" aria-pressed={current?.id === preset.id} onClick={() => onPreset(preset.days, preset.name)}>
          <b>{preset.name}{preset.suggested && <em>Suggested</em>}</b>
          <small>{describeDays(preset.days)}</small>
        </button>)}
      </div>
    </fieldset>
    <p className="week-layout-note">Every week uses these days. A day keeps its exercises when you change what it is.</p>
  </section>;
}
