import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { deviceWorkoutHistoryEvent, deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { correctSet, elapsedText, exerciseOutcomeLine, removeSet, sessionRecap, updateFinishedSession, withNote } from "@/lib/sessionRecap";
import { decimalEntryText } from "@/lib/numericEntry";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import "../session-detail.css";

/**
 * One finished workout (Oct 7 brief §5, §6): the recap right after Finish and the session detail
 * opened from Progress are this one component reading the one stored record, so they cannot say
 * different things. It is built from what was recorded, never from the plan.
 *
 * At most three summary numbers (exercises, working sets, elapsed time), then one row per exercise
 * that opens to its sets - a drop set stays one set with its stages - then anything not done,
 * skipped or simply not recorded. The note is optional. Corrections go through here and update
 * every reader at once, because Progress, Strength and Home all read this record.
 */
export type SessionDetailVariant = "saved" | "history";

const findSession = (id: string) => loadDeviceWorkoutSessions().find((session) => session.id === id && session.status === "completed") ?? null;

export function WorkoutSessionDetail({ sessionId, weightUnit, variant, onDone, onOpenProgress, onOpenNext, onBack, onRemove, onRepeat }: {
  sessionId: string;
  weightUnit: DisplayWeightUnit;
  variant: SessionDetailVariant;
  /** "Done": back to what the athlete was doing (the saved variant). */
  onDone?: () => void;
  /** This same record in Progress, where it stays (the saved variant). */
  onOpenProgress?: () => void;
  /** Home, where the next workout is (the saved variant). */
  onOpenNext?: () => void;
  /** Back to the list of workouts (the history variant). */
  onBack?: () => void;
  /** Remove the whole workout, with Progress's own confirmation (the history variant). */
  onRemove?: (session: DeviceWorkoutSession) => void;
  /** Put this workout's exercises and prescriptions into a plan day the athlete chooses (H10). */
  onRepeat?: (session: DeviceWorkoutSession) => void;
}) {
  const [session, setSession] = useState<DeviceWorkoutSession | null>(() => findSession(sessionId));
  const [noteDraft, setNoteDraft] = useState(session?.note ?? "");
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [editing, setEditing] = useState<{ exerciseId: string; index: number; weight: string; reps: string } | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<string | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ids = useId();

  useEffect(() => {
    const refresh = () => setSession(findSession(sessionId));
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key === deviceWorkoutHistoryKey) refresh(); };
    refresh();
    window.addEventListener(deviceWorkoutHistoryEvent, refresh);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(deviceWorkoutHistoryEvent, refresh); window.removeEventListener("storage", onStorage); };
  }, [sessionId]);
  useEffect(() => { setNoteDraft(session?.note ?? ""); }, [session?.id]);
  // The saved screen replaces the live card the athlete just tapped Finish on, and the detail replaces
  // the list row that opened it: either way the heading takes focus, at the top of the page.
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); headingRef.current?.scrollIntoView?.({ block: "nearest" }); }, [variant, sessionId]);

  if (!session) {
    return <section className="session-detail" aria-labelledby={`${ids}-title`} data-session-detail="missing">
      {onBack && <button type="button" className="session-detail-back" onClick={onBack}><ArrowLeft aria-hidden="true" /> All workouts</button>}
      <h2 id={`${ids}-title`} ref={headingRef} tabIndex={-1}>Workout not found</h2>
      <p className="session-detail-meta">This workout isn't on this device. It may have been removed, or recorded on another device.</p>
    </section>;
  }

  const recap = sessionRecap(session, weightUnit);
  const date = recap.completedAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const dayName = recap.dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean).pop() || recap.title;

  const apply = (change: (current: DeviceWorkoutSession) => DeviceWorkoutSession, done: string) => {
    const result = updateFinishedSession(session.id, change);
    if (!result) { setCorrectionError("This device would not save the change. Nothing was changed; try again."); return false; }
    setCorrectionError(null);
    setSession(result.session);
    setCorrectionStatus(result.alreadySent ? `${done} Your account already holds this workout's top sets as they were; this correction changes the record on this device.` : done);
    emitInteractionFeedback();
    return true;
  };
  const saveNote = () => {
    const result = updateFinishedSession(session.id, (current) => withNote(current, noteDraft));
    if (!result) { setNoteStatus("This device would not save the note. Your text is still here."); return; }
    setSession(result.session);
    setNoteStatus(noteDraft.trim() ? "Note saved with this workout." : "Note removed.");
  };
  const repsValid = editing ? /^\d{1,4}$/.test(editing.reps) && Number(editing.reps) >= 1 : false;
  const weightValid = editing ? editing.weight.trim() === "" || Number.isFinite(Number(editing.weight)) : false;

  return <section className="session-detail" aria-labelledby={`${ids}-title`} data-session-detail={variant} data-session-id={session.id}>
    {variant === "history" && onBack && <button type="button" className="session-detail-back" onClick={onBack}><ArrowLeft aria-hidden="true" /> All workouts</button>}
    <header className="session-detail-head">
      <p className="metric-label">{variant === "saved" ? recap.dayLabel : date}</p>
      <h2 id={`${ids}-title`} ref={headingRef} tabIndex={-1}>{variant === "saved" ? "Workout saved" : dayName}</h2>
      <p className="session-detail-meta">{variant === "saved" ? `${date} · Saved on this device` : `${recap.dayLabel} · Saved on this device`}{session.correctedAt ? " · Corrected" : ""}</p>
    </header>

    <dl className="session-detail-summary">
      <div><dt>Exercises</dt><dd>{recap.totals.exercises}</dd></div>
      <div><dt>Working sets</dt><dd>{recap.totals.workingSets}</dd></div>
      {recap.elapsedMinutes !== null && <div><dt>Start to finish</dt><dd>{elapsedText(recap.elapsedMinutes)}</dd></div>}
    </dl>

    <ul className="session-detail-exercises">
      {recap.exercises.map((exercise) => <li key={exercise.id}>
        <details open={correcting || undefined}>
          <summary>
            <span className="session-detail-exercise-name"><strong>{exercise.name}</strong><small>{exerciseOutcomeLine(exercise)}</small>{exercise.note && <small className="session-detail-swap">{exercise.note}</small>}</span>
            <ChevronRight aria-hidden="true" />
          </summary>
          <ol className="session-detail-sets">
            {exercise.sets.map((row, position) => {
              const isEditing = editing?.exerciseId === exercise.id && editing.index === row.index;
              return <li key={row.index}>
                {isEditing && editing ? <form className="session-detail-edit" onSubmit={(event) => {
                  event.preventDefault();
                  if (!repsValid || !weightValid) return;
                  if (apply((current) => correctSet(current, exercise.id, row.index, { weight: editing.weight, reps: editing.reps }), `Set ${position + 1} of ${exercise.name} corrected.`)) setEditing(null);
                }}>
                  <label><span>Weight</span><input inputMode="decimal" value={editing.weight} onChange={(event) => setEditing({ ...editing, weight: decimalEntryText(event.target.value) })} aria-invalid={!weightValid || undefined} /></label>
                  <label><span>Reps</span><input inputMode="numeric" value={editing.reps} onChange={(event) => setEditing({ ...editing, reps: event.target.value.replace(/[^0-9]/g, "").slice(0, 4) })} aria-invalid={!repsValid || undefined} /></label>
                  <button type="submit" disabled={!repsValid || !weightValid}><Check aria-hidden="true" /> Save set</button>
                  <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                  {!repsValid && <p className="session-detail-error" role="alert">Reps are a whole number, at least 1.</p>}
                </form> : <>
                  <span className="session-detail-set-line"><span>Set {position + 1}</span><b>{row.line}</b>{row.detail && <small>{row.detail}</small>}</span>
                  {correcting && <span className="session-detail-set-actions">
                    {!row.drop && <button type="button" onClick={() => setEditing({ exerciseId: exercise.id, index: row.index, weight: row.set.weight, reps: row.set.reps })} aria-label={`Edit set ${position + 1} of ${exercise.name}`}><Pencil aria-hidden="true" /> Edit</button>}
                    <button type="button" disabled={recap.totals.workingSets <= 1} onClick={() => apply((current) => removeSet(current, exercise.id, row.index), `Set ${position + 1} of ${exercise.name} removed.`)} aria-label={`Remove set ${position + 1} of ${exercise.name}`}><Trash2 aria-hidden="true" /> Remove</button>
                  </span>}
                </>}
              </li>;
            })}
          </ol>
        </details>
      </li>)}
    </ul>

    {recap.notDone.length > 0 && <div className="session-detail-not-done">
      <h3>Not done</h3>
      <ul>{recap.notDone.map((item) => <li key={item.name}><strong>{item.name}</strong> · {item.skipped ? "skipped" : "not recorded"}{item.plannedSets ? ` (${item.plannedSets} planned ${item.plannedSets === 1 ? "set" : "sets"})` : ""}</li>)}</ul>
    </div>}

    <form className="session-detail-note" onSubmit={(event) => { event.preventDefault(); saveNote(); }}>
      <label htmlFor={`${ids}-note`}>Note <small>optional</small></label>
      <textarea id={`${ids}-note`} value={noteDraft} maxLength={2000} rows={2} placeholder="How it went, what to change next time" onChange={(event) => { setNoteDraft(event.target.value); setNoteStatus(null); }} />
      <div className="session-detail-note-row">
        <button type="submit" disabled={noteDraft.trim() === (session.note ?? "")}>Save note</button>
        {noteStatus && <p role="status">{noteStatus}</p>}
      </div>
    </form>

    <div className="session-detail-correct">
      <button type="button" aria-pressed={correcting} onClick={() => { setCorrecting((value) => !value); setEditing(null); setCorrectionStatus(null); }}>{correcting ? "Done correcting" : "Correct a set"}</button>
      {correcting && <p className="session-detail-hint">Edit a set's weight or reps, or remove a set logged by mistake. Your progress, strength record and Home read the corrected workout. A drop set can be removed, not edited.</p>}
      {correctionStatus && <p role="status" className="session-detail-status">{correctionStatus}</p>}
      {correctionError && <p role="alert" className="session-detail-error">{correctionError}</p>}
    </div>

    <div className="session-detail-actions">
      {variant === "saved" && <>
        {onDone && <button type="button" className="session-detail-primary" onClick={onDone}>Done</button>}
        {onOpenProgress && <button type="button" onClick={onOpenProgress}>View in Progress</button>}
        {onOpenNext && <button type="button" onClick={onOpenNext}>See what's next</button>}
      </>}
      {variant === "history" && onRepeat && <button type="button" className="session-detail-primary" onClick={() => onRepeat(session)}>Repeat in your plan</button>}
      {variant === "history" && onRemove && <button type="button" className="session-detail-remove" onClick={() => onRemove(session)}>Remove this workout</button>}
    </div>
  </section>;
}
