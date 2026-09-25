/** Modern Kinetic Field Manual: compact per-exercise controls for a coach-editable training prescription. */
import React from "react";
import { Check, ChevronDown, Copy, Info, Minus, Plus, Undo2, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import type { ExerciseProgress } from "@/lib/liveSession";
import {
  displayPrescription,
  formatPrescription,
  maxEditableSets,
  parsePrescription,
  uniformReps,
  withSetCount,
  withSetReps,
  withUniformReps,
  withVaried,
  type SetPrescription,
} from "@/lib/setPrescription";
import "../mobile-training-card.css";

/**
 * A training day is read far more often than it is edited, and this row was
 * built the other way round: every exercise rendered its sets field, reps
 * field, RPE select, rest select, a completion button, a coach-note disclosure,
 * a full-width Duplicate and a remove button, all open, all the time. Five
 * exercises came to fifty controls and two thousand pixels, and the exercise
 * name — the one thing you actually scan for — was truncated to make room for
 * the Duplicate button.
 *
 * So the row now states the prescription and opens to edit it. Collapsed, it is
 * the name in full and "3 × 6–15 · RPE 7 · 90 sec" on one line. Everything that
 * was here is still here, one tap away, and only for the exercise being
 * changed. Native <details> carries the keyboard and screen-reader behaviour.
 *
 * Open, it asks for the two things in order: how many sets, then what they ask
 * for. One reps field covers the ordinary case where every set is the same. A
 * top set followed by back-offs is just as ordinary, and used to be impossible
 * to write - so "Vary by set" turns the single field into one field per set.
 */
export function ExercisePrescriptionRow({ exercise, index, prescription, settings, progress, onPrescription, onSettings, onInspect, onRemove }: { exercise: Exercise; index: number; prescription: string; settings: ExerciseSettings; progress?: ExerciseProgress | null; onPrescription: (value: string) => void; onSettings: (patch: Partial<ExerciseSettings>) => void; onInspect: () => void; onRemove: () => void }) {
  /**
   * The editor's model is the list of sets, not the string.
   *
   * Deriving the field values from the string the field had just written made
   * every keystroke a round trip, and the round trip is lossy for exactly the
   * values a person types on the way to a valid one. Typing the "-" of "12-15"
   * produced a target no parser would accept as a rep count, so the whole
   * prescription collapsed to a single shared field holding "10/12-/6" - and
   * the next keystroke re-joined that with slashes again, doubling it. The
   * buffer below is what the athlete typed; the string is where it is saved.
   */
  const [draft, setDraft] = React.useState<SetPrescription | null>(null);
  /** The last value this row wrote, so its own echo is not mistaken for an outside edit. */
  const echo = React.useRef<string>("");
  /** The list as it stood before "Same every set" flattened it. */
  const [flattened, setFlattened] = React.useState<SetPrescription | null>(null);

  React.useEffect(() => {
    // A day swap, an import, or a duplicate replaces the prescription from
    // outside. That always wins over whatever is half-typed in here.
    if (prescription !== echo.current) {
      setDraft(null);
      setFlattened(null);
    }
  }, [prescription]);

  const plan = draft ?? parsePrescription(prescription);
  const shared = uniformReps(plan);
  const perSet = plan.varied;

  const commit = (next: SetPrescription, keepUndo = false) => {
    setDraft(next);
    if (!keepUndo) setFlattened(null);
    const value = formatPrescription(next.sets, next.varied);
    echo.current = value;
    onPrescription(value);
  };

  const setCountNow = plan.sets.length;
  const rpes = Array.from(new Set([settings.rpe, "RPE 6", "RPE 7", "RPE 8", "RPE 9"]));
  const rests = Array.from(new Set([settings.rest, "60 sec", "90 sec", "120 sec", "180 sec"]));
  const summaryLine = [displayPrescription(prescription), settings.rpe, settings.rest].filter(Boolean).join(" · ");
  const muscles = exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ");
  const setsLabelId = `sets-label-${exercise.id}`;
  const listLabelId = `sets-list-${exercise.id}`;

  /*
   * The stepper stays focusable at its limits and clamps in the handler. Disabling
   * the button the moment it is pressed drops focus to <body>, so a keyboard user
   * who steps down to one set loses their place in the row entirely.
   */
  const atMin = setCountNow <= 1;
  const atMax = setCountNow >= maxEditableSets;
  const step = (delta: number) => {
    const next = setCountNow + delta;
    if (next < 1 || next > maxEditableSets) return;
    commit(withSetCount(plan, next));
  };

  /**
   * What the live session has done to this exercise, when one is running.
   *
   * The plan and the workout were two pictures of the same day that never
   * referred to each other: you could log four sets of Box Jump and come back to
   * a row that still read exactly as it had before you started. The row is the
   * thing an athlete scans to answer "where am I", so it answers.
   */
  const live = progress
    ? progress.state === "skipped"
      ? { tone: "skipped", text: "Skipped" }
      : progress.state === "done"
        ? { tone: "done", text: `Done ${progress.completed}/${progress.planned}` }
        : progress.state === "current"
          ? { tone: "current", text: progress.completed > 0 ? `Now · ${progress.completed}/${progress.planned}` : "Now" }
          : progress.completed > 0
            ? { tone: "todo", text: `${progress.completed}/${progress.planned}` }
            : null
    : null;

  return <details className={`custom-prescription ${settings.completed ? "custom-prescription-complete" : ""}${live ? ` custom-prescription-live-${live.tone}` : ""}`}>
    <summary className="custom-row">
      <span className="custom-row-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="custom-row-identity">
        <strong>{exercise.name}{live && <b className={`custom-row-live custom-row-live-${live.tone}`}>{live.text}</b>}</strong>
        <em>{summaryLine}</em>
        <small>{exercise.movement} · {muscles}</small>
      </span>
      <span className="custom-row-state">
        {settings.completed && <span className="custom-row-done" aria-label="Marked complete"><Check className="h-3.5 w-3.5" /></span>}
        <ChevronDown className="custom-row-chevron h-4 w-4" aria-hidden="true" />
      </span>
    </summary>

    <div className="prescription-editor">
      {/* Sets and reps are one statement, so they are written on one line and read
          back the way the summary states them: "4 × 3–5". Two stacked full-width
          fields said the same thing in twice the height and half the sense. */}
      <div className="prescription-primary">
        <div className="prescription-primary-head">
          <span className="metric-label" id={setsLabelId}>Sets &amp; reps</span>
          <div className="prescription-mode">
            {flattened && <button type="button" className="prescription-undo" onClick={() => { commit(flattened); setFlattened(null); }}>
              <Undo2 className="h-3 w-3" /> Undo
            </button>}
            {perSet
              ? <button type="button" className="prescription-vary" onClick={() => { setFlattened(plan); commit(withUniformReps(plan, plan.sets[0]?.reps ?? "8–12"), true); }}>Same every set</button>
              : <button type="button" onClick={() => { if (!atMin) commit(withVaried(plan, true)); }} aria-disabled={atMin} title={atMin ? "Add a second set first" : undefined} className={`prescription-vary ${atMin ? "is-spent" : ""}`}>Vary by set</button>}
          </div>
        </div>

        <div className="prescription-sets-row">
          <div className="set-stepper" role="group" aria-labelledby={setsLabelId}>
            <button type="button" onClick={() => step(-1)} aria-disabled={atMin} aria-label={`One fewer set of ${exercise.name}`} className={atMin ? "is-spent" : ""}><Minus className="h-4 w-4" /></button>
            <output aria-live="polite" aria-label={`${setCountNow} ${setCountNow === 1 ? "set" : "sets"}`}>{setCountNow}</output>
            <button type="button" onClick={() => step(1)} aria-disabled={atMax} aria-label={`One more set of ${exercise.name}`} className={atMax ? "is-spent" : ""}><Plus className="h-4 w-4" /></button>
          </div>
          {!perSet && <>
            <span className="prescription-times" aria-hidden="true">×</span>
            <input
              className="prescription-reps"
              id={`reps-${exercise.id}`}
              value={shared ?? ""}
              /* `/` is the per-set delimiter, so typing "8 / side" here would read
                 back as two sets. Vary by set is the way to write a slash list. */
              onChange={(event) => commit(withUniformReps(plan, event.target.value.replace(/\//g, " ")))}
              inputMode="text"
              placeholder="8–12"
              aria-label={`${exercise.name} repetitions or target, every set`}
            />
          </>}
        </div>

        {perSet && <ol className="prescription-set-list" aria-labelledby={listLabelId}>
          <li className="sr-only" id={listLabelId} aria-hidden="true">Repetitions per set</li>
          {plan.sets.map((set, position) => <li key={position}>
            <label htmlFor={`set-${exercise.id}-${position}`}>Set {position + 1}</label>
            <input
              id={`set-${exercise.id}-${position}`}
              value={set.reps}
              onChange={(event) => commit(withSetReps(plan, position, event.target.value.replace(/\//g, " ")))}
              inputMode="text"
              aria-label={`${exercise.name} set ${position + 1} repetitions`}
            />
          </li>)}
        </ol>}
      </div>

      <div className="prescription-field prescription-field-pair">
        <label className="metric-label">Effort<select value={settings.rpe} onChange={(event) => onSettings({ rpe: event.target.value })} aria-label={`${exercise.name} effort`}>{rpes.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="metric-label">Rest<select value={settings.rest} onChange={(event) => onSettings({ rest: event.target.value })} aria-label={`${exercise.name} rest`}>{rests.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>

      <details className="prescription-note"><summary>Coach note <ChevronDown className="h-3.5 w-3.5" /></summary><textarea value={settings.notes} onChange={(event) => onSettings({ notes: event.target.value })} placeholder="Technique cue, load, or substitution reason" /></details>

      <div className="prescription-actions">
        <button type="button" onClick={() => onSettings({ completed: !settings.completed })} aria-pressed={settings.completed} className={`completion-toggle ${settings.completed ? "completion-toggle-on" : ""}`}>{settings.completed ? <Check className="h-3.5 w-3.5" /> : <span className="completion-box" />} {settings.completed ? "Completed" : "Mark complete"}</button>
        <div className="prescription-action-icons">
          <button type="button" onClick={onInspect} className="inspect-prescription" aria-label={`View ${exercise.name} details`}><Info className="h-3.5 w-3.5" /> Details</button>
          <button type="button" onClick={() => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("duplicate-training-exercise", { detail: { exercise, prescription, settings } })); }} className="duplicate-prescription" aria-label={`Duplicate ${exercise.name} prescription`}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
          <button type="button" onClick={onRemove} className="remove-prescription" aria-label={`Remove ${exercise.name}`}><X className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  </details>;
}
