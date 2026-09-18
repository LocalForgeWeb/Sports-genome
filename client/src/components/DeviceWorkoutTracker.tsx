import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Play, Save, SkipForward, Timer, Undo2 } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import {
  activePosition, carriedEntryFor, countCompletedSets, countDraftSets, countPlannedSets, finalizeSession,
  isDraftSet, isExerciseSkipped, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, skipExercise,
  unskipExercise, type DeviceWorkoutSession,
} from "@/lib/deviceWorkoutLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { setEntryFieldsFor, type SetEntryMeasure } from "@/lib/setEntryFields";
import { toast } from "sonner";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

/**
 * The live execution surface, governed by four adopted philosophy contracts:
 *
 * - "Live workout glance contract" (FIXED): "The first view must make active
 *   exercise/set, prescribed or entered progression variable, completion/rest
 *   state, and one dominant next action immediately legible. ... The rest timer
 *   remains persistent and easy to adjust, but is visually and physically
 *   subordinate to set entry/completion; timer controls may not overlap,
 *   occlude, or create a competing tap target beside reps/load/completion.
 *   Secondary ... history ... use explicit drill-down that preserves active-set
 *   context."
 * - "Live-session control priority": the between-sets loop is "view next set ->
 *   edit only if necessary -> mark set complete -> manage rest", and that loop
 *   is a protected interaction zone with 44x44pt targets.
 * - "Live-set commitment semantics contract" (FIXED): editing, completion,
 *   durability and finalization are separate states.
 * - "Active workout continuity contract" (FIXED): checkpoint on-device before
 *   the UI treats an action as saved; restore the last confirmed position.
 *
 * The state machine itself lives in lib/deviceWorkoutLog so it can be tested
 * against those contracts without the DOM.
 */

const DEFAULT_REST_SECONDS = 90;
const REST_STEP_SECONDS = 15;

function plannedSetCount(prescription: string) {
  return Math.max(1, Math.min(12, Number(prescription.match(/(\d+)\s*(?:x|×)/i)?.[1] || 3)));
}

function makeSession(workout: Exercise[], prescriptions: Record<number, string>, dayLabel: string): DeviceWorkoutSession {
  return {
    id: `device-${Date.now()}`,
    title: `${dayLabel} workout`,
    dayLabel,
    startedAt: new Date().toISOString(),
    status: "active",
    restSeconds: DEFAULT_REST_SECONDS,
    exercises: workout.map((exercise, index) => {
      const plannedPrescription = prescriptions[exercise.id] || "3 × 8–12";
      return {
        id: `${exercise.id}-${index}`,
        exerciseName: exercise.name,
        plannedPrescription,
        sets: Array.from({ length: plannedSetCount(plannedPrescription) }, () => ({ weight: "", reps: "", completed: false })),
      };
    }),
  };
}

/**
 * These are text inputs, not type="number", so the athlete keeps what they
 * typed. A controlled type="number" reports value="" for anything not yet a
 * valid number — "2." while reaching for 2.5 — which wipes the keystroke on the
 * next render. Filtering the characters ourselves keeps the decimal keypad and
 * the half-typed value.
 */
type EntryField = SetEntryMeasure | "reps";

function sanitiseEntry(field: EntryField, value: string) {
  if (field === "reps") return value.replace(/[^0-9]/g, "").slice(0, 4);
  const digitsAndDot = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = digitsAndDot.split(".");
  return (rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole).slice(0, 7);
}

function clockFor(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function DeviceWorkoutTracker({ workout, prescriptions, dayLabel }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; dayLabel: string }) {
  const [activeSession, setActiveSession] = useState<DeviceWorkoutSession | null>(null);
  const [durable, setDurable] = useState(true);
  const [resumed, setResumed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState<DeviceWorkoutSession[]>([]);
  /**
   * Which entry fields the athlete has typed in. A carried-forward value is an
   * input default, so it may only fill a field the athlete has not touched:
   * without this, clearing the box wrote "" to the set, "" is falsy, and the
   * carry fell straight back in — the field could never be emptied at all.
   */
  const [touchedEntries, setTouchedEntries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = loadDeviceWorkoutSessions();
    setHistory(stored);
    const running = stored.find((session) => session.status === "active") || null;
    setActiveSession(running);
    // An active session already on the device means this mount is a resume, not
    // a fresh start: the contract asks the resume cue to say what is confirmed.
    setResumed(Boolean(running));
  }, []);

  const completed = useMemo(() => (activeSession ? countCompletedSets(activeSession) : 0), [activeSession]);
  const planned = useMemo(() => (activeSession ? countPlannedSets(activeSession) : 0), [activeSession]);
  const drafts = useMemo(() => (activeSession ? countDraftSets(activeSession) : 0), [activeSession]);
  const position = useMemo(() => (activeSession ? activePosition(activeSession) : null), [activeSession]);
  const carried = useMemo(
    () => (activeSession && position ? carriedEntryFor(activeSession.exercises[position.exerciseIndex], position.setIndex, history) : null),
    [activeSession, position, history],
  );

  /**
   * What the entry fields actually show — and therefore exactly what gets
   * recorded when the set is logged. An untouched field offers the carry; a
   * touched one is the athlete's, empty included.
   */
  const entryKey = (field: EntryField) =>
    activeSession && position ? `${activeSession.exercises[position.exerciseIndex].id}:${position.setIndex}:${field}` : "";
  const shownEntry = (field: EntryField) => {
    if (!activeSession || !position) return "";
    const set = activeSession.exercises[position.exerciseIndex].sets[position.setIndex];
    const stored = set[field] || "";
    if (touchedEntries[entryKey(field)]) return stored;
    return stored || carried?.[field] || "";
  };
  const shownEntries: Record<EntryField, string> = {
    weight: shownEntry("weight"),
    height: shownEntry("height"),
    reps: shownEntry("reps"),
  };

  /**
   * A box jump has a box height, not a weight; a weighted box jump has both.
   * The boxes on screen come from the catalog entry behind the session, so each
   * one names exactly what it records.
   */
  const entryFieldsFor = (exerciseName: string) => setEntryFieldsFor(exerciseCatalog.find((item) => item.name === exerciseName));
  const activeEntryFields = activeSession && position
    ? entryFieldsFor(activeSession.exercises[position.exerciseIndex].exerciseName)
    : setEntryFieldsFor(undefined);

  const editEntry = (field: EntryField, value: string) => {
    if (!activeSession || !position) return;
    setTouchedEntries((current) => ({ ...current, [entryKey(field)]: true }));
    updateSet(activeSession.exercises[position.exerciseIndex].id, position.setIndex, { [field]: sanitiseEntry(field, value) });
  };

  const restEndsAt = activeSession?.restEndsAt ? Date.parse(activeSession.restEndsAt) : null;
  const restRemaining = restEndsAt ? Math.max(0, Math.round((restEndsAt - now) / 1000)) : 0;
  const resting = Boolean(restEndsAt && restRemaining > 0);
  const restComplete = Boolean(restEndsAt && restRemaining === 0);

  useEffect(() => {
    if (!resting) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [resting]);

  // A rest that ends silently is a rest the athlete misses. Haptics are
  // best-effort (iOS Safari ignores them), so the visible state change is the
  // real cue and the pulse is the bonus.
  const signalledRestRef = useRef<number | null>(null);
  useEffect(() => {
    if (!restComplete || !restEndsAt) return;
    if (signalledRestRef.current === restEndsAt) return;
    signalledRestRef.current = restEndsAt;
    emitInteractionFeedback([90, 60, 90]);
  }, [restComplete, restEndsAt]);

  /**
   * Checkpoint first, then render: the continuity contract does not let the UI
   * treat an action as saved until the device has it. A failed write still
   * updates the view — losing what the athlete typed would be worse — but the
   * surface stops claiming durability it does not have.
   */
  const persist = (next: DeviceWorkoutSession) => {
    const prior = loadDeviceWorkoutSessions().filter((session) => session.id !== next.id);
    const written = saveDeviceWorkoutSessions([next, ...prior]);
    setDurable(written);
    setActiveSession(next);
    setHistory([next, ...prior]);
    // The resume cue has done its job once the athlete acts on the session.
    setResumed(false);
  };

  const start = () => {
    if (!workout.length) return;
    setResumed(false);
    persist(makeSession(workout, prescriptions, dayLabel));
  };

  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DeviceWorkoutSession["exercises"][number]["sets"][number]>, session = activeSession) => {
    if (!session) return;
    persist({
      ...session,
      exercises: session.exercises.map((exercise) => exercise.id !== exerciseId
        ? exercise
        : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, ...patch } : set) }),
    });
  };

  /**
   * Completion is the only thing that turns a draft into an observation, and
   * the only moment a carried-forward default becomes a real recorded value.
   */
  const completeActiveSet = () => {
    if (!activeSession || !position) return;
    const restSeconds = activeSession.restSeconds || DEFAULT_REST_SECONDS;
    persist({
      ...activeSession,
      restEndsAt: new Date(Date.now() + restSeconds * 1000).toISOString(),
      exercises: activeSession.exercises.map((item, exerciseIndex) => exerciseIndex !== position.exerciseIndex
        ? item
        : { ...item, sets: item.sets.map((set, setIndex) => setIndex !== position.setIndex ? set : {
            // What you see in the box is what gets logged, including a field
            // the athlete deliberately emptied.
            weight: shownEntries.weight,
            height: shownEntries.height,
            reps: shownEntries.reps,
            completed: true,
          }) }),
    });
  };

  /**
   * "I didn't get to do the hip thrust" — the rack was taken, time ran out.
   * Skipping resolves the exercise's remaining sets and moves execution on,
   * without recording anything the athlete did not do.
   */
  const skipActiveExercise = () => {
    if (!activeSession || !position) return;
    const name = activeSession.exercises[position.exerciseIndex].exerciseName;
    persist({ ...skipExercise(activeSession, position.exerciseIndex), restEndsAt: undefined });
    toast(`Skipped ${name}`, {
      description: "Nothing was recorded for it. Reopen the full session to put it back.",
      action: { label: "Undo", onClick: () => setActiveSession((current) => {
        if (!current) return current;
        const restored = unskipExercise(current, position.exerciseIndex);
        persist(restored);
        return restored;
      }) },
    });
  };

  const toggleExerciseSkip = (exerciseIndex: number) => {
    if (!activeSession) return;
    const exercise = activeSession.exercises[exerciseIndex];
    persist(isExerciseSkipped(exercise) ? unskipExercise(activeSession, exerciseIndex) : skipExercise(activeSession, exerciseIndex));
  };

  const adjustRest = (delta: number) => {
    if (!activeSession) return;
    const next = Math.max(REST_STEP_SECONDS, (activeSession.restSeconds || DEFAULT_REST_SECONDS) + delta);
    persist({
      ...activeSession,
      restSeconds: next,
      restEndsAt: restEndsAt ? new Date(restEndsAt + delta * 1000).toISOString() : activeSession.restEndsAt,
    });
  };

  const endRest = () => {
    if (!activeSession) return;
    persist({ ...activeSession, restEndsAt: undefined });
  };

  const finish = () => {
    if (!activeSession) return;
    const { session, excludedDrafts, skippedSets, completedSets } = finalizeSession(activeSession);
    const prior = loadDeviceWorkoutSessions().filter((item) => item.id !== session.id);
    const written = saveDeviceWorkoutSessions([session, ...prior]);
    setDurable(written);
    setHistory([session, ...prior]);
    setActiveSession(null);
    setResumed(false);
    // The exclusion is never silent: the contract drops uncompleted edits by
    // default, so the athlete is told exactly what did not count.
    const leftOut = [
      excludedDrafts ? `${excludedDrafts} typed but never logged` : "",
      skippedSets ? `${skippedSets} skipped` : "",
    ].filter(Boolean).join(" · ");
    toast(`${completedSets} ${completedSets === 1 ? "set" : "sets"} added to Progress`, {
      description: leftOut ? `Left out: ${leftOut}.` : "Every logged set was recorded.",
    });
  };

  if (!activeSession) {
    return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker">
      <div className="execution-head">
        <div>
          <p className="metric-label">Workout tracker</p>
          <h3>Ready to train.</h3>
          <p>Start the selected day, then log actual weight and reps as you go. During temporary direct access, completed sets stay on this device and appear in Progress.</p>
        </div>
        <button onClick={start} disabled={!workout.length}><Play className="h-4 w-4" /> Start workout</button>
      </div>
      {!workout.length && <p className="tracker-empty-state">Select a saved Training Day before starting a workout.</p>}
    </section>;
  }

  const activeExercise = position ? activeSession.exercises[position.exerciseIndex] : null;
  const activeSet = position && activeExercise ? activeExercise.sets[position.setIndex] : null;

  return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker">
    <div className="execution-head">
      <div>
        <p className="metric-label">Live workout / {activeSession.dayLabel}</p>
        <h3>{completed} / {planned} sets logged</h3>
        <p>Each logged set is saved on this device. Finish the session when the workout is done to add it to Progress.</p>
      </div>
      <button onClick={finish} className="execution-secondary-action"><Save className="h-4 w-4" /> Finish workout</button>
    </div>

    {!durable && <p className="tracker-storage-warning" role="alert">
      This device would not store the last change. Your sets are still on screen, but they will not survive a reload — free up storage or leave private browsing before you finish.
    </p>}

    {resumed && <p className="tracker-resume-cue">
      Picked up where you left off. {completed} {completed === 1 ? "set is" : "sets are"} confirmed
      {drafts ? `, and ${drafts} ${drafts === 1 ? "set was" : "sets were"} typed but never logged — check ${drafts === 1 ? "it" : "them"} before you finish.` : "."}
    </p>}

    {activeExercise && activeSet && position ? <div className="live-set-card">
      <p className="metric-label">Now · exercise {position.exerciseIndex + 1} of {activeSession.exercises.length}</p>
      <h4>{activeExercise.exerciseName}</h4>
      <p className="live-set-prescription">Set {position.setIndex + 1} of {activeExercise.sets.length} · {activeExercise.plannedPrescription}</p>
      {carried && <p className="live-set-last">
        {carried.source === "session" ? "Last set" : "Last logged"}: {activeEntryFields.map((field) => `${carried[field.measure] || "—"} ${field.unit}`).join(" · ")} × {carried.reps}
      </p>}
      <div className="live-set-entry" data-fields={activeEntryFields.length + 1}>
        {activeEntryFields.map((field) => <label key={field.measure}>
          <span>{field.label}</span>
          <input value={shownEntries[field.measure]} inputMode="decimal" type="text" autoComplete="off" enterKeyHint="done"
            onChange={(event) => editEntry(field.measure, event.target.value)} placeholder="—" />
          <em>{field.unit}</em>
        </label>)}
        <label>
          <span>Reps</span>
          <input value={shownEntries.reps} inputMode="numeric" type="text" autoComplete="off" enterKeyHint="done"
            onChange={(event) => editEntry("reps", event.target.value)} placeholder="—" />
        </label>
      </div>
      <button type="button" className="live-set-commit" onClick={completeActiveSet}>
        <Check className="h-4 w-4" /> Log set {position.setIndex + 1}
      </button>
      {/* Secondary by design: the dominant action is logging the set. Skipping
          is the escape hatch for the rack being taken or time running out. */}
      <button type="button" className="live-set-skip" onClick={skipActiveExercise}>
        <SkipForward className="h-4 w-4" /> Skip {activeExercise.exerciseName}
      </button>
    </div> : <div className="live-set-card live-set-card-done">
      <p className="metric-label">Session complete</p>
      <h4>Every planned set is logged.</h4>
      <p className="live-set-prescription">Finish the workout to add {completed} {completed === 1 ? "set" : "sets"} to Progress.</p>
    </div>}

    {/* Persistent and adjustable, but its own row below the logging zone: the
        glance contract forbids a timer control sitting beside reps, load, or
        completion as a competing tap target. */}
    <div className={`live-rest-row ${restComplete ? "live-rest-row-done" : ""}`}>
      <span className="live-rest-clock"><Timer className="h-4 w-4" aria-hidden />{resting ? clockFor(restRemaining) : clockFor(activeSession.restSeconds || DEFAULT_REST_SECONDS)}</span>
      <span className="live-rest-state" aria-live="polite">{resting ? "Resting" : restComplete ? "Rest complete" : "Rest length"}</span>
      <span className="live-rest-controls">
        <button type="button" onClick={() => adjustRest(-REST_STEP_SECONDS)} aria-label={`Shorten rest by ${REST_STEP_SECONDS} seconds`}>−{REST_STEP_SECONDS}s</button>
        <button type="button" onClick={() => adjustRest(REST_STEP_SECONDS)} aria-label={`Lengthen rest by ${REST_STEP_SECONDS} seconds`}>+{REST_STEP_SECONDS}s</button>
        {(resting || restComplete) && <button type="button" onClick={endRest} aria-label={restComplete ? "Clear the finished rest" : "End rest now"}>{restComplete ? "Clear" : "Skip"}</button>}
      </span>
    </div>

    {/* Explicit drill-down. Opening it does not move the active set, so the
        athlete keeps their place while checking or correcting earlier work. */}
    <details className="live-session-queue">
      <summary>
        <span>Full session</span>
        <small>{completed} of {planned} sets logged{drafts ? ` · ${drafts} typed, not logged` : ""}</small>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </summary>
      <div className="session-exercise-list">{activeSession.exercises.map((exercise, exerciseIndex) => { const queueFields = entryFieldsFor(exercise.exerciseName); const exerciseSkipped = isExerciseSkipped(exercise); return <article key={exercise.id} className={`session-exercise ${exerciseSkipped ? "session-exercise-skipped" : ""}`}>
        <div>
          <span>{String(exerciseIndex + 1).padStart(2, "0")}</span>
          <div><strong>{exercise.exerciseName}</strong><small>{exerciseSkipped ? "Skipped · nothing recorded" : exercise.plannedPrescription}</small></div>
          <button type="button" className="session-exercise-skip" onClick={() => toggleExerciseSkip(exerciseIndex)} aria-pressed={exerciseSkipped}>
            {exerciseSkipped ? <Undo2 className="h-3.5 w-3.5" /> : <SkipForward className="h-3.5 w-3.5" />}
            <span>{exerciseSkipped ? "Put back" : "Skip"}</span>
          </button>
        </div>
        <div className="session-set-list">{exercise.sets.map((set, setIndex) => <div key={setIndex} className={`session-set-row ${set.completed ? "session-set-complete" : ""} ${isDraftSet(set) ? "session-set-draft" : ""} ${set.skipped ? "session-set-skipped" : ""}`}>
          <strong>Set {setIndex + 1}{isDraftSet(set) ? " · typed, not logged" : ""}{set.skipped ? " · skipped" : ""}</strong>
          {queueFields.map((field) => <label key={field.measure}>
            <span>{field.label}</span>
            <input value={set[field.measure] || ""} inputMode="decimal" type="text" autoComplete="off" onChange={(event) => updateSet(exercise.id, setIndex, { [field.measure]: sanitiseEntry(field.measure, event.target.value) })} placeholder="—" />
            <em>{field.unit}</em>
          </label>)}
          <label>
            <span>Reps</span>
            <input value={set.reps} inputMode="numeric" type="text" autoComplete="off" onChange={(event) => updateSet(exercise.id, setIndex, { reps: sanitiseEntry("reps", event.target.value) })} placeholder="—" />
          </label>
          <button onClick={() => updateSet(exercise.id, setIndex, { completed: !set.completed })} aria-pressed={set.completed}>
            {set.completed ? <Undo2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
            <span>{set.completed ? "Undo" : "Log set"}</span>
          </button>
        </div>)}</div>
      </article>; })}</div>
    </details>
  </section>;
}
