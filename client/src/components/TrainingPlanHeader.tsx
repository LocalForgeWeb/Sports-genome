import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Pencil, SlidersHorizontal } from "lucide-react";
import type { DaySlot } from "@/lib/trainingDayPlan";
import type { DayTrainingState } from "@/lib/liveSession";
import { weekNameMaxLength } from "@/lib/weekNames";

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
 *
 * The open week can be named ("Heavy", "Deload"). "Name week" sits at the end of the
 * week row and opens a one-line field right under it, in place: no dialog. A named
 * week's pill leads with its name and keeps its number under it.
 */
export function TrainingPlanHeader({
  weeks, activeWeek, onSelectWeek, onGenerateWeek, nextWeekToGenerate, onRenameWeek,
  slots, activeIndex, exerciseCountFor, trainingStateFor, onChooseDay, onEditDays,
}: {
  weeks: { week: number; ready: boolean; savedDays: number; name?: string }[];
  activeWeek: number;
  onSelectWeek: (week: number) => void;
  /** Saves the open week's name; a blank name removes it. Without it, weeks cannot be named here. */
  onRenameWeek?: (week: number, name: string) => void;
  onGenerateWeek: () => void;
  nextWeekToGenerate: number | null;
  slots: DaySlot[];
  activeIndex: number;
  exerciseCountFor: (slot: DaySlot) => number;
  trainingStateFor?: (index: number) => DayTrainingState | null;
  onChooseDay: (index: number) => void;
  /** Opens the day editor, where the athlete picks what each day trains. */
  onEditDays?: () => void;
}) {
  const active = slots[activeIndex] || slots[0];
  const count = active ? exerciseCountFor(active) : 0;
  // The day row scrolls sideways when the labels outgrow the screen (large text,
  // narrow widths). The selected day is the one the athlete is editing, so it is
  // never left clipped off the edge: it is brought into view whenever it changes.
  const daysRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = daysRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    selected?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeIndex, activeWeek]);

  const activeName = weeks.find((option) => option.week === activeWeek)?.name ?? "";
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");
  const nameButtonRef = useRef<HTMLButtonElement>(null);
  const nameFieldRef = useRef<HTMLInputElement>(null);
  // The field names the open week, so another week closes it rather than renaming that one.
  useEffect(() => { setNaming(false); }, [activeWeek]);
  useEffect(() => { if (naming) nameFieldRef.current?.focus(); }, [naming]);
  const closeNaming = () => {
    setNaming(false);
    nameButtonRef.current?.focus();
  };
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    onRenameWeek?.(activeWeek, draft);
    closeNaming();
  };
  if (!active) return null;

  return <section className="training-plan-header" aria-label="Training plan selection">
    <div className="training-plan-title">
      <div>
        <p className="metric-label">Saved training days</p>
        <h1>Training plan</h1>
      </div>
      {/* The days are the athlete's to choose: what each one trains, and how many. The
          frequency used to decide every day's type, with no way to change one. */}
      {onEditDays && <button type="button" className="training-plan-edit-days" onClick={onEditDays}><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Edit days</button>}
    </div>

    <div className="training-plan-week-bar">
      <div className="training-plan-weeks" role="group" aria-label="Training week">
        {weeks.map(({ week, ready, savedDays, name }) => {
          const selected = week === activeWeek;
          // An ungenerated week is not disabled: the pill is how you make it, which
          // is what the separate "Generate the weeks" block was for. So the weeks are
          // buttons, not tabs: a tab only shows a place, and this one builds a week.
          const generates = !ready && week === nextWeekToGenerate;
          return <button
            key={week}
            type="button"
            aria-current={selected ? "true" : undefined}
            disabled={!ready && !generates}
            onClick={ready ? () => onSelectWeek(week) : generates ? onGenerateWeek : undefined}
            className={`training-plan-week${selected ? " training-plan-week-active" : ""}`}
          >
            {name ? <span className="training-plan-week-name">{name}</span> : <>Week {week}</>}
            <small>{name ? `Week ${week} · ` : ""}{ready ? (savedDays ? `${savedDays} saved` : "Empty") : generates ? "Generate" : "Locked"}</small>
          </button>;
        })}
      </div>
      {onRenameWeek && <button
        ref={nameButtonRef}
        type="button"
        className="training-plan-rename"
        aria-expanded={naming}
        aria-controls="training-plan-naming"
        aria-label={activeName ? `Rename Week ${activeWeek}, ${activeName}` : `Name Week ${activeWeek}`}
        onClick={() => { if (naming) { closeNaming(); return; } setDraft(activeName); setNaming(true); }}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />{activeName ? "Rename" : "Name week"}
      </button>}
    </div>

    {onRenameWeek && naming && <form id="training-plan-naming" className="training-plan-naming" onSubmit={saveName}>
      <label htmlFor="training-plan-week-name">Name for Week {activeWeek}</label>
      <div className="training-plan-naming-row">
        <input
          ref={nameFieldRef}
          id="training-plan-week-name"
          type="text"
          value={draft}
          maxLength={weekNameMaxLength}
          placeholder="Heavy, Deload, Peak…"
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          aria-describedby="training-plan-naming-hint"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeNaming(); } }}
        />
        <button type="submit" className="training-plan-naming-save">Save</button>
        <button type="button" className="training-plan-naming-cancel" onClick={closeNaming}>Cancel</button>
      </div>
      <small id="training-plan-naming-hint">{activeName ? `Clear it and save to go back to “Week ${activeWeek}”.` : "It shows beside the week's number."}</small>
    </form>}

    <div ref={daysRef} className="training-plan-days" role="tablist" aria-label="Day of the week">
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
          <small>{trained === "live" ? "Training now" : trained === "trained" ? "Done this week" : planned ? `${planned}` : "—"}</small>
        </button>;
      })}
    </div>

    <div className="training-plan-identity">
      <div>
        <h2>{active.day}</h2>
        {/* The confirmation of a week or day switch: announced politely here, instead
            of a "Week N loaded" toast covering the rows it just loaded. Only the week
            and day are live. The count stays outside the status: an add or a removal
            already has its toast, and the Add-exercises sheet says it as well. */}
        <p><span role="status" aria-live="polite">Week {activeWeek}{activeName ? `: ${activeName}` : ""} · {active.ordinal}</span> · {count ? `${count} exercise${count === 1 ? "" : "s"}` : "Empty"}</p>
      </div>
      {/* A status, not a control. Every edit is already written to this day. Not said of an
          empty day, where "Empty · Saved" read as if nothing were a saved plan. */}
      {count > 0 && <span className="training-plan-saved"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved</span>}
    </div>
  </section>;
}
