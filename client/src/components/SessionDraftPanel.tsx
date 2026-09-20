import React from "react";
import { Clock, Sparkles } from "lucide-react";
import { gymTimeOptions, type GymTimeBudget } from "@/lib/gymTimeBudget";
import { loadoutTemplateRules, type TrainingLoadout } from "@/lib/loadoutTemplates";

/**
 * Draft a session for the day you are on, inline, with the two inputs that decide
 * what comes out.
 *
 * This replaces a floating "Session Planner" dock that sat over the page on a
 * fixed layer. It overlapped whatever was underneath it - on a phone its own
 * open/close tab covered the heading of the panel behind it - and it carried a
 * second copy of the training-day picker, so the app asked "which day?" in two
 * places that could disagree. Both problems came from it being a layer instead of
 * a part of the page.
 *
 * The bigger miss was what it left out. How long an athlete has today is the single
 * input that most changes what a session should be, and it was buried behind a
 * disclosure on Home called "Adjust plan inputs" - nowhere near the button that
 * builds the session. It belongs here, next to the draft, with its consequence
 * stated before the draft is made rather than discovered afterwards.
 */
export function SessionDraftPanel({ dayLabel, minutes, budget, loadout, exerciseCount, estimatedMinutes, replacingCount, onMinutes, onLoadout, onDraft }: {
  dayLabel: string;
  minutes: number;
  budget: GymTimeBudget;
  loadout: TrainingLoadout;
  /** How many exercises this draft would contain, at the current settings. */
  exerciseCount: number;
  /** The session-time estimate for that draft, so the time choice has a visible consequence. */
  estimatedMinutes: number;
  /** What is already in the day, because drafting replaces it. */
  replacingCount: number;
  onMinutes: (minutes: number) => void;
  onLoadout: (loadout: TrainingLoadout) => void;
  onDraft: () => void;
}) {
  const overBudget = estimatedMinutes > minutes;
  return <section className="session-draft-panel" aria-label="Draft a session">
    <div className="session-draft-head">
      <div>
        <p className="metric-label">Smart draft</p>
        <h3>Build {dayLabel} for me</h3>
      </div>
      <Sparkles className="h-5 w-5 session-draft-spark" />
    </div>

    <div className="session-draft-field">
      <label className="metric-label" id="session-draft-time">How many minutes have you got today?</label>
      <div className="session-draft-chips session-draft-chips-time" role="group" aria-labelledby="session-draft-time">
        {gymTimeOptions.map((option) => <button
          key={option}
          type="button"
          onClick={() => onMinutes(option)}
          aria-pressed={option === minutes}
          className={`session-draft-chip ${option === minutes ? "session-draft-chip-active" : ""}`}
          /* The unit is in the question above, so the row does not repeat it five
             times - but a button read on its own still has to carry it. */
          aria-label={option === 90 ? "90 or more minutes" : `${option} minutes`}
        >{option === 90 ? "90+" : option}</button>)}
      </div>
      <p className="session-draft-note">{budget.scopeCue}</p>
    </div>

    <div className="session-draft-field">
      <label className="metric-label" id="session-draft-focus">Focus</label>
      <div className="session-draft-chips session-draft-chips-focus" role="group" aria-labelledby="session-draft-focus">
        {(Object.keys(loadoutTemplateRules) as TrainingLoadout[]).map((option) => <button
          key={option}
          type="button"
          onClick={() => onLoadout(option)}
          aria-pressed={option === loadout}
          className={`session-draft-chip session-draft-chip-wide ${option === loadout ? "session-draft-chip-active" : ""}`}
        >{option}</button>)}
      </div>
      <p className="session-draft-note">{loadoutTemplateRules[loadout].description}</p>
    </div>

    <div className="session-draft-outcome">
      <div>
        <p className="metric-label">You&apos;ll get</p>
        <strong><Clock className="h-4 w-4" /> {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"} · about {estimatedMinutes} min</strong>
        <small>
          {overBudget
            ? `That is over your ${budget.label} window. Shorten the session or accept the longer one.`
            : `Inside your ${budget.label} window.`}
          {replacingCount > 0 && ` Drafting replaces the ${replacingCount} exercise${replacingCount === 1 ? "" : "s"} already in this day.`}
        </small>
      </div>
      <button type="button" onClick={onDraft} className="session-draft-button">Draft this session</button>
    </div>
  </section>;
}
