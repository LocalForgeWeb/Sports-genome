/** Modern Kinetic Field Manual: compact per-exercise controls for a coach-editable training prescription. */
import { Check, ChevronDown, Copy, Info, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { muscleLabels } from "@/components/AnatomyMap";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
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
 */
export function ExercisePrescriptionRow({ exercise, index, prescription, settings, onPrescription, onSettings, onInspect, onRemove }: { exercise: Exercise; index: number; prescription: string; settings: ExerciseSettings; onPrescription: (value: string) => void; onSettings: (patch: Partial<ExerciseSettings>) => void; onInspect: () => void; onRemove: () => void }) {
  const [, rawSets = "3", rawTarget = "8–12"] = prescription.match(/^\s*(\d+)\s*(?:×|x)\s*(.+?)\s*$/i) || [];
  const updatePrescription = (sets: string, target: string) => onPrescription(`${Math.max(1, Number.parseInt(sets, 10) || 1)} × ${target.trim() || "1"}`);
  const rpes = Array.from(new Set([settings.rpe, "RPE 6", "RPE 7", "RPE 8", "RPE 9"]));
  const rests = Array.from(new Set([settings.rest, "60 sec", "90 sec", "120 sec", "180 sec"]));
  const summaryLine = [`${rawSets} × ${rawTarget}`, settings.rpe, settings.rest].filter(Boolean).join(" · ");
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

    <div className="custom-prescription-inputs">
      <label><span>Sets</span><input type="number" min="1" max="99" inputMode="numeric" value={rawSets} onChange={(event) => updatePrescription(event.target.value, rawTarget)} aria-label={`${exercise.name} sets`} /></label>
      <label><span>Reps / target</span><input value={rawTarget} onChange={(event) => updatePrescription(rawSets, event.target.value)} inputMode="text" aria-label={`${exercise.name} repetitions or target`} placeholder="8–12 or 1" /></label>
    </div>

    <div className="custom-detail-row">
      <label>RPE<select value={settings.rpe} onChange={(event) => onSettings({ rpe: event.target.value })}>{rpes.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Rest<select value={settings.rest} onChange={(event) => onSettings({ rest: event.target.value })}>{rests.map((value) => <option key={value}>{value}</option>)}</select></label>
      <button onClick={() => onSettings({ completed: !settings.completed })} aria-pressed={settings.completed} className={`completion-toggle ${settings.completed ? "completion-toggle-on" : ""}`}>{settings.completed ? <Check className="h-3.5 w-3.5" /> : <span />} {settings.completed ? "Completed" : "Mark complete"}</button>
      <details><summary>Coach note <ChevronDown className="h-3.5 w-3.5" /></summary><textarea value={settings.notes} onChange={(event) => onSettings({ notes: event.target.value })} placeholder="Technique cue, load, or substitution reason" /></details>
    </div>

    <div className="custom-row-actions">
      <button type="button" onClick={onInspect} className="inspect-prescription" aria-label={`View ${exercise.name} details`}><Info className="h-3.5 w-3.5" /> Details</button>
      <button type="button" onClick={() => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("duplicate-training-exercise", { detail: { exercise, prescription, settings } })); }} className="duplicate-prescription" aria-label={`Duplicate ${exercise.name} prescription`}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
      <button onClick={onRemove} className="remove-prescription" aria-label={`Remove ${exercise.name}`}><X className="h-4 w-4" /></button>
    </div>
  </details>;
}
