/** Modern Kinetic Field Manual: compact per-exercise controls for a coach-editable training prescription. */
import React from "react";
import { Check, ChevronDown, Copy, Info, Minus, Plus, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import {
  formatPrescription,
  parsePrescription,
  uniformReps,
  withSetCount,
  withSetReps,
  withUniformReps,
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
 * to write - so "Vary by set" turns the single field into one field per set, and
 * "Same every set" turns it back. The simple case stays one field; the harder
 * case is one tap away rather than unavailable.
 */
export function ExercisePrescriptionRow({ exercise, index, prescription, settings, onPrescription, onSettings, onInspect, onRemove }: { exercise: Exercise; index: number; prescription: string; settings: ExerciseSettings; onPrescription: (value: string) => void; onSettings: (patch: Partial<ExerciseSettings>) => void; onInspect: () => void; onRemove: () => void }) {
  const plan = parsePrescription(prescription);
  const shared = uniformReps(plan);
  const write = (next: ReturnType<typeof parsePrescription>) => onPrescription(formatPrescription(next.sets));

  /**
   * Asking for a field per set is a decision about the editor, not about the
   * numbers: "3 × 8" and "3 × 8/8/8" say the same thing, so per-set mode cannot
   * be read back out of the prescription. It is held here, against the exercise
   * it was opened for, so a row that is later reused for a different exercise
   * starts from that exercise's own shape rather than the last one's.
   */
  const [varyingFor, setVaryingFor] = React.useState<number | null>(null);
  const perSet = plan.varied || varyingFor === exercise.id;
  const rpes = Array.from(new Set([settings.rpe, "RPE 6", "RPE 7", "RPE 8", "RPE 9"]));
  const rests = Array.from(new Set([settings.rest, "60 sec", "90 sec", "120 sec", "180 sec"]));
  const summaryLine = [formatPrescription(plan.sets), settings.rpe, settings.rest].filter(Boolean).join(" · ");
  const muscles = exercise.primaryMuscles.map((muscle) => muscleLabels[muscle] || muscle).join(", ");

  return <details className={`custom-prescription ${settings.completed ? "custom-prescription-complete" : ""}`}>
    <summary className="custom-row">
      <span className="custom-row-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="custom-row-identity">
        <strong>{exercise.name}</strong>
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
          <span className="metric-label" id={`sets-${exercise.id}`}>Sets &amp; reps</span>
          {perSet
            /* Undoing it takes the first set's target across the rest, which is
               the one answer that is never a surprise. */
            ? <button type="button" className="prescription-vary" onClick={() => { setVaryingFor(null); write(withUniformReps(plan, plan.sets[0]?.reps ?? "8–12")); }}>Same every set</button>
            : <button type="button" className="prescription-vary" onClick={() => setVaryingFor(exercise.id)} disabled={plan.sets.length < 2}>Vary by set</button>}
        </div>

        <div className="prescription-sets-row">
          <div className="set-stepper" role="group" aria-labelledby={`sets-${exercise.id}`}>
            <button type="button" onClick={() => write(withSetCount(plan, plan.sets.length - 1))} disabled={plan.sets.length <= 1} aria-label={`One fewer set of ${exercise.name}`}><Minus className="h-4 w-4" /></button>
            <output aria-live="polite">{plan.sets.length}</output>
            <button type="button" onClick={() => write(withSetCount(plan, plan.sets.length + 1))} disabled={plan.sets.length >= 12} aria-label={`One more set of ${exercise.name}`}><Plus className="h-4 w-4" /></button>
          </div>
          {!perSet && <>
            <span className="prescription-times" aria-hidden="true">×</span>
            <input
              className="prescription-reps"
              id={`reps-${exercise.id}`}
              value={shared ?? ""}
              onChange={(event) => write(withUniformReps(plan, event.target.value))}
              inputMode="text"
              placeholder="8–12"
              aria-label={`${exercise.name} repetitions or target, every set`}
            />
          </>}
        </div>

        {perSet && <ol className="prescription-set-list">
          {plan.sets.map((set, position) => <li key={position}>
            <span>Set {position + 1}</span>
            <input
              value={set.reps}
              onChange={(event) => write(withSetReps(plan, position, event.target.value))}
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
