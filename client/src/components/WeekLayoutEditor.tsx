import { Check, ChevronsUpDown } from "lucide-react";
import type { SplitDay } from "@/lib/splitCycle";
import { dayTypes, describeDays, matchingPreset, maxTrainingDays, splitPresets } from "@/lib/weekLayout";

/**
 * Setting up the week, in place under the week row (owner, 22 Oct 2026): how many days, what
 * each day is, and ready-made splits to start from. Every option is on the page at once,
 * so "five Upper days" is two taps away rather than out of reach. The day tabs right below
 * follow every change as it is made, and a day keeps its exercises when its type changes.
 *
 * It is laid out as the iPhone's own settings are: a segmented control for the number, then
 * grouped lists with the value on the right. A day's row is its picker: the native select
 * covers the whole row, so a tap anywhere on it opens the iPhone's wheel.
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
      <h2 id="week-layout-title">Training days</h2>
      <button type="button" className="week-layout-done" onClick={onDone}>Done</button>
    </div>

    <div className="week-layout-group">
      <h3 id="week-layout-count">Days a week</h3>
      <div className="week-layout-segments" role="group" aria-labelledby="week-layout-count">
        {Array.from({ length: maxTrainingDays }, (_, index) => index + 1).map((days) => <button
          key={days}
          type="button"
          aria-pressed={days === split.length}
          aria-label={`${days} ${days === 1 ? "day" : "days"} a week`}
          onClick={() => onDays(days)}
        >{days}</button>)}
      </div>
    </div>

    <div className="week-layout-group">
      <h3 id="week-layout-each">Each day</h3>
      <ol className="week-layout-list" aria-labelledby="week-layout-each">
        {split.map((day, index) => {
          const count = exerciseCountFor(index);
          return <li key={index} className="week-layout-row week-layout-pick">
            <label htmlFor={`week-layout-day-${index}`} className="week-layout-text"><b>Day {index + 1}</b><small>{count ? `${count} exercise${count === 1 ? "" : "s"}` : "No exercises yet"}</small></label>
            <span className="week-layout-value" aria-hidden="true">{day}<ChevronsUpDown className="h-4 w-4" /></span>
            <select id={`week-layout-day-${index}`} value={day} onChange={(event) => onDayType(index, event.target.value as SplitDay)}>
              {dayTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </li>;
        })}
      </ol>
    </div>

    <div className="week-layout-group">
      <h3 id="week-layout-splits">Quick splits</h3>
      <ul className="week-layout-list" aria-labelledby="week-layout-splits">
        {presets.map((preset) => {
          const chosen = current?.id === preset.id;
          return <li key={preset.id}>
            <button type="button" className="week-layout-row" aria-pressed={chosen} onClick={() => onPreset(preset.days, preset.name)}>
              <span className="week-layout-text"><b>{preset.name}{preset.suggested && <em>Suggested</em>}</b><small>{describeDays(preset.days)}</small></span>
              {chosen && <Check className="week-layout-check h-5 w-5" aria-hidden="true" />}
            </button>
          </li>;
        })}
      </ul>
    </div>
    <p className="week-layout-note">Every week uses these days. A day keeps its exercises when you change what it is.</p>
  </section>;
}
