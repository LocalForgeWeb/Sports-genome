import { useMemo, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { UtilitySheet } from "@/components/UtilitySheet";
import { isRecommendedSplit, maxTrainingDays, splitDayTypes, splitDaysForFrequency, splitPresets, type SplitDay } from "@/lib/splitCycle";
import { dayOrdinal, previewSplitChange, sameSplit, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import "../split-editor.css";

const exercisesLabel = (count: number) => `${count} exercise${count === 1 ? "" : "s"}`;

/**
 * The days of the week, chosen by the athlete.
 *
 * The number of training days used to decide every day's type: three was always Push /
 * Pull / Legs, four always Upper / Lower twice. Here each day is whatever the athlete picks,
 * a type can repeat, and the week can be one to seven days long.
 *
 * Nothing is applied until Save, and what Save will do to the week is shown first, worked
 * out by the same remap that applies it: how many exercises each day will hold, where they
 * come from when a day moved, and which built days the new week has no place for (hidden,
 * not deleted, as when the frequency changes).
 */
export function SplitEditorSheet({ current, store, week, otherWeeks, onSave, onClose }: {
  current: SplitDay[];
  /** The open week as it stands, the day being edited included. */
  store: WeeklyDayStore;
  week: number;
  /** The other generated weeks, which change the same way. */
  otherWeeks: number[];
  onSave: (days: SplitDay[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SplitDay[]>(() => [...current]);
  const preview = useMemo(() => previewSplitChange(store, current, draft), [store, current, draft]);
  const unchanged = sameSplit(current, draft);
  const recommended = splitDaysForFrequency(draft.length);

  const setDay = (index: number, day: SplitDay) => setDraft((days) => days.map((value, position) => (position === index ? day : value)));
  const removeDay = (index: number) => setDraft((days) => (days.length > 1 ? days.filter((_, position) => position !== index) : days));
  // A new day starts as the one the recommendation puts there; it is a select away from anything else.
  const addDay = () => setDraft((days) => (days.length < maxTrainingDays ? [...days, splitDaysForFrequency(days.length + 1)[days.length]] : days));

  return <UtilitySheet eyebrow="Training plan" title="Your training days" labelId="split-editor-title" onClose={onClose}>
    <div className="stp-body se-body">
      <p className="stp-note">Choose what each day trains. Any day can be any type, and a type can repeat.</p>

      <fieldset className="stp-field">
        <legend>Start from a common week</legend>
        <div className="ut-chips se-presets">
          {splitPresets.map((preset) => {
            const on = sameSplit(draft, preset.days);
            return <button key={preset.id} type="button" className={on ? "is-on" : undefined} aria-pressed={on} onClick={() => setDraft([...preset.days])}>
              {preset.label}<small>{preset.days.length} days</small>
            </button>;
          })}
          <button type="button" className={isRecommendedSplit(draft) ? "is-on" : undefined} aria-pressed={isRecommendedSplit(draft)} onClick={() => setDraft(recommended)}>
            Recommended<small>for {draft.length} day{draft.length === 1 ? "" : "s"}</small>
          </button>
        </div>
      </fieldset>

      <fieldset className="stp-field">
        <legend>Your week · {draft.length} day{draft.length === 1 ? "" : "s"}</legend>
        <ol className="se-days">
          {draft.map((day, index) => {
            const count = preview.counts[index] ?? 0;
            const from = preview.from[index];
            return <li key={index}>
              <label htmlFor={`se-day-${index}`}>
                <b>{dayOrdinal(index)}</b>
                <small>{count ? exercisesLabel(count) : "Empty"}{from ? ` · from ${from}` : ""}</small>
              </label>
              <select id={`se-day-${index}`} value={day} onChange={(event) => setDay(index, event.target.value as SplitDay)}>
                {splitDayTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <button type="button" className="se-remove" aria-label={`Remove ${dayOrdinal(index)} · ${day}`} disabled={draft.length === 1} onClick={() => removeDay(index)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>;
          })}
        </ol>
        {draft.length < maxTrainingDays && <button type="button" className="stp-secondary se-add" onClick={addDay}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Add a day</button>}
      </fieldset>

      <div role="status" aria-live="polite">
        {preview.hidden.length > 0 && <p className="stp-warn"><AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span>{preview.hidden.map((day) => `${day.label} (${exercisesLabel(day.count)})`).join(", ")} {preview.hidden.length === 1 ? "has" : "have"} no place in this week, so {preview.hidden.length === 1 ? "it is" : "they are"} hidden, not deleted. Add {preview.hidden.length === 1 ? `${preview.hidden[0].label} back to see it` : "those days back to see them"} again.</span>
        </p>}
      </div>
      <p className="stp-note">Counts are for Week {week}.{otherWeeks.length ? ` ${otherWeeks.length === 1 ? `Week ${otherWeeks[0]} changes` : `Weeks ${otherWeeks.join(" and ")} change`} the same way.` : ""} A renamed day keeps its exercises, and a day moved to another place takes its exercises with it.</p>

      <div className="stp-actions">
        <button type="button" className="stp-primary" disabled={unchanged} onClick={() => onSave(draft)}>{unchanged ? "No changes" : "Save days"}</button>
        <button type="button" className="stp-secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </UtilitySheet>;
}
