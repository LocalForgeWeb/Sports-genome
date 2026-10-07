import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, Check, ChevronRight, Layers, Play, Plus, Save, Settings, SkipForward, SlidersHorizontal, Timer, Undo2, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getGoalPrescription, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { WarmupPanel } from "@/components/WarmupPanel";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { exercisePhotoSet } from "@/lib/exercisePhotos";
import {
  activePosition, carriedEntryFor, countCompletedSets, countDraftSets, countPlannedSets, finalizeSession,
  deviceWorkoutHistoryKey, isCompletedSet, isCompletedWorkout, isDraftSet, isDropInProgress, isExerciseSkipped, lastCompletedSetFor, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, setWeightUnit, skipExercise,
  unskipExercise, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession,
} from "@/lib/deviceWorkoutLog";
import { addAfter, applySwap, assessSwap, canUndoSwap, catalogIdOf, swapNote, undoSwap, type SwapReceipt } from "@/lib/workoutSwap";
import { dropSetLine, dropSetSummary, newStageId, performedSetLine, setVolume, stageLoadText, stageNote, stageProblem, volumeText } from "@/lib/dropSets";
import { loadConventionFor } from "@shared/loadConventions";
import { ExerciseSwapSheet, type ExerciseSwapChoice, type SwapPlanOption } from "@/components/ExerciseSwapSheet";
import { WorkoutSessionDetail } from "@/components/WorkoutSessionDetail";
import { startOfTrainingWeek } from "@/lib/trainingWeekSummary";
import { currentBodyWeightKg, loadBodyWeightLog } from "@/lib/bodyWeightLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { setEntryFieldsFor, type SetEntryMeasure } from "@/lib/setEntryFields";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { renderableSetCount, repsForSet } from "@/lib/setPrescription";
import { toast } from "sonner";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { decimalEntryText } from "@/lib/numericEntry";

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

/**
 * "90 sec", "2 min", "120s": a rest setting from the plan, in seconds. Null when
 * the setting does not say.
 */
function restSecondsOf(rest: string | undefined): number | null {
  const match = rest?.match(/(\d+(?:\.\d+)?)\s*(min|m|sec|s)?/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!value) return null;
  return Math.round(/^m/i.test(match[2] || "") ? value * 60 : value);
}

/**
 * The rest the plan asks for most often across the day. The Plan writes a rest
 * per exercise and the session keeps one rest for the whole workout, so the
 * session starts on the plan's usual answer rather than on a constant the plan
 * never saw.
 */
function plannedRestSeconds(workout: Exercise[], settings: Record<number, ExerciseSettings>): number | null {
  const tally = new Map<number, number>();
  workout.forEach((exercise) => {
    const seconds = restSecondsOf(settings[exercise.id]?.rest);
    if (seconds) tally.set(seconds, (tally.get(seconds) || 0) + 1);
  });
  let best: number | null = null;
  let count = 0;
  tally.forEach((occurrences, seconds) => { if (occurrences > count) { best = seconds; count = occurrences; } });
  return best;
}

function makeSession(workout: Exercise[], prescriptions: Record<number, string>, dayLabel: string, restSeconds: number, weightUnit: DisplayWeightUnit, goal: TrainingGoal): DeviceWorkoutSession {
  return {
    id: `device-${Date.now()}`,
    title: `${dayLabel} workout`,
    dayLabel,
    startedAt: new Date().toISOString(),
    status: "active",
    restSeconds,
    // Fixed for the life of the session: what the boxes say, and what every set is stored in.
    weightUnit,
    exercises: workout.map((exercise, index) => {
      // The goal's default for this place in the day, the same one the Plan shows (TR-05).
      const plannedPrescription = prescriptions[exercise.id] || getGoalPrescription(goal, index);
      return {
        id: `${exercise.id}-${index}`,
        exerciseName: exercise.name,
        // The catalog identity the logged sets keep, whatever the catalog later calls it. A
        // duplicated plan entry has an id of its own and names its catalog exercise separately.
        catalogId: catalogIdOf(exercise),
        plannedPrescription,
        sets: Array.from({ length: renderableSetCount(plannedPrescription) }, () => ({ weight: "", reps: "", completed: false })),
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
  return decimalEntryText(value).slice(0, 7);
}

/** True when a target is a bare count or range, so the word "reps" belongs after it. */
function bareCount(target: string) {
  return /^\s*\d+(\s*[–—-]\s*\d+)?\s*$/.test(target);
}

function clockFor(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/** An id no other set or exercise in the session has: time plus a random tail. */
const freshId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function DeviceWorkoutTracker({ workout, prescriptions, settings, goal, dayLabel, weightUnit = "lb", onEditInPlan, onReviewDay, onInspect, onOpenProgress, onOpenSession, onOpenHome, daySwitch, onReplaceInPlan }: {
  workout: Exercise[];
  /** The profile's unit. A session takes it when it starts and keeps it. */
  weightUnit?: DisplayWeightUnit;
  prescriptions: Record<number, string>;
  settings: Record<number, ExerciseSettings>;
  goal: TrainingGoal;
  dayLabel: string;
  /** Session shows the prescription; changing it is Plan's job, one tap away. */
  onEditInPlan?: () => void;
  /** Opens Train → Review on this day: its warm-up, planning guide and Coach scan. Reading, never starting. */
  onReviewDay?: () => void;
  /** Where a finished workout's record lives; offered as the next step once it is written. */
  onOpenProgress?: () => void;
  /** A row opens the exercise's own detail, as anywhere else in the app. */
  onInspect?: (exercise: Exercise) => void;
  /** The owner's day chooser, rendered under the day it names - only before a session starts. */
  daySwitch?: ReactNode;
  /**
   * "Also update this day in my plan" after a swap: puts `toId` in `fromId`'s place in the open
   * day, keeping its sets, reps and settings. False when the plan could not take the change.
   */
  onReplaceInPlan?: (fromId: number, toId: number) => boolean;
  /** A finished workout's detail in Progress, by its session id: the recap's "View in Progress". */
  onOpenSession?: (sessionId: string) => void;
  /** Home, where the next workout is: the recap's "See what's next". */
  onOpenHome?: () => void;
}) {
  const [activeSession, setActiveSession] = useState<DeviceWorkoutSession | null>(null);
  const [durable, setDurable] = useState(true);
  const [resumed, setResumed] = useState(false);
  /**
   * The rest length the next session starts with. The plan's usual rest is the
   * default; an athlete who changes it here is setting it for the session
   * about to start, so a change survives the plan re-rendering under it but
   * is not written back to the plan.
   */
  const [restOverride, setRestOverride] = useState<number | null>(null);
  const plannedRest = plannedRestSeconds(workout, settings);
  const startRestSeconds = restOverride ?? plannedRest ?? DEFAULT_REST_SECONDS;
  /**
   * Start is a real write. A second tap while the first is being persisted -
   * two thumbs, a double-tap - must not open two sessions for the same day.
   */
  const starting = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState<DeviceWorkoutSession[]>([]);
  /**
   * Which entry fields the athlete has typed in. A carried-forward value is an
   * input default, so it may only fill a field the athlete has not touched:
   * without this, clearing the box wrote "" to the set, "" is falsy, and the
   * carry fell straight back in — the field could never be emptied at all.
   */
  const [touchedEntries, setTouchedEntries] = useState<Record<string, boolean>>({});

  /**
   * Read by handlers that outlive a render - a toast's Undo, a storage event - so they
   * act on the session as it is now, not as it was when they were created.
   */
  const activeSessionRef = useRef<DeviceWorkoutSession | null>(null);
  activeSessionRef.current = activeSession;
  const weightUnitRef = useRef(weightUnit);
  weightUnitRef.current = weightUnit;
  /** A session started before units were stored takes the profile's unit, marked as inferred (decision D-005). */
  const withUnit = (session: DeviceWorkoutSession): DeviceWorkoutSession =>
    session.weightUnit ? session : { ...session, weightUnit: weightUnitRef.current, weightUnitInferred: true };

  useEffect(() => {
    const stored = loadDeviceWorkoutSessions();
    setHistory(stored);
    const found = stored.find((session) => session.status === "active") || null;
    const running = found ? withUnit(found) : null;
    setActiveSession(running);
    // An active session already on the device means this mount is a resume, not
    // a fresh start: the contract asks the resume cue to say what is confirmed.
    setResumed(Boolean(running));
  }, []);

  /**
   * The same session open in a second tab. Each tab used to hold its own copy and write
   * the whole of it back, so a set logged in one tab was un-logged by the next write
   * from the other (inventory PS-11). Now a write from the other tab is picked up here,
   * and a workout finished there closes here instead of being resurrected.
   */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== deviceWorkoutHistoryKey) return;
      const stored = loadDeviceWorkoutSessions();
      setHistory(stored);
      const current = activeSessionRef.current;
      if (current) {
        const latest = stored.find((session) => session.id === current.id);
        if (latest?.status === "active") { setActiveSession(withUnit(latest)); return; }
        setActiveSession(null);
        setResumed(false);
        toast("This workout was closed in another tab", { id: "session-closed-elsewhere", description: latest ? "It was finished there, and its record is saved." : "Nothing more is recorded here." });
        return;
      }
      const running = stored.find((session) => session.status === "active");
      if (running) { setActiveSession(withUnit(running)); setResumed(true); }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** The unit this session records in: its own once started, the profile's before that. */
  const sessionUnit: DisplayWeightUnit = activeSession?.weightUnit ?? weightUnit;
  /** The catalog entry behind a session exercise: by the id it was built with, else by the name it stores. */
  const catalogByName = useMemo(() => new Map(exerciseCatalog.map((exercise) => [exercise.name, exercise])), []);
  const catalogById = useMemo(() => new Map(exerciseCatalog.map((exercise) => [exercise.id, exercise])), []);
  const catalogFor = (exercise: Pick<DeviceWorkoutExercise, "catalogId" | "exerciseName">) =>
    (exercise.catalogId !== undefined ? catalogById.get(exercise.catalogId) : undefined) ?? catalogByName.get(exercise.exerciseName);
  const completed = useMemo(() => (activeSession ? countCompletedSets(activeSession) : 0), [activeSession]);
  const planned = useMemo(() => (activeSession ? countPlannedSets(activeSession) : 0), [activeSession]);
  const drafts = useMemo(() => (activeSession ? countDraftSets(activeSession) : 0), [activeSession]);
  const position = useMemo(() => (activeSession ? activePosition(activeSession) : null), [activeSession]);
  const carried = useMemo(
    () => (activeSession && position ? carriedEntryFor(activeSession.exercises[position.exerciseIndex], position.setIndex, history, sessionUnit) : null),
    [activeSession, position, history, sessionUnit],
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
    // A drop's next stage starts empty: the last set's load is exactly what it is not.
    if (isDropInProgress(set)) return stored;
    return stored || carried?.[field] || "";
  };
  const shownEntries: Record<EntryField, string> = {
    weight: shownEntry("weight"),
    height: shownEntry("height"),
    reps: shownEntry("reps"),
  };
  /** True while a field shows the carried value rather than something typed or stored for this set. */
  const isCarried = (field: EntryField) => {
    if (!activeSession || !position || touchedEntries[entryKey(field)]) return false;
    const set = activeSession.exercises[position.exerciseIndex].sets[position.setIndex];
    return !isDropInProgress(set) && !set[field] && Boolean(carried?.[field]);
  };

  /**
   * A box jump has a box height, not a weight; a weighted box jump has both.
   * The boxes on screen come from the catalog entry behind the session, so each
   * one names exactly what it records.
   */
  const entryFieldsFor = (exercise: DeviceWorkoutExercise) => setEntryFieldsFor(catalogFor(exercise), sessionUnit);
  const activeEntryFields = activeSession && position
    ? entryFieldsFor(activeSession.exercises[position.exerciseIndex])
    : setEntryFieldsFor(undefined, sessionUnit);

  const editEntry = (field: EntryField, value: string) => {
    if (!activeSession || !position) return;
    setTouchedEntries((current) => ({ ...current, [entryKey(field)]: true }));
    updateSet(activeSession.exercises[position.exerciseIndex].id, position.setIndex, { [field]: sanitiseEntry(field, value) });
  };

  const restEndsAt = activeSession?.restEndsAt ? Date.parse(activeSession.restEndsAt) : null;
  const restRemaining = restEndsAt ? Math.max(0, Math.round((restEndsAt - now) / 1000)) : 0;
  const resting = Boolean(restEndsAt && restRemaining > 0);
  const restComplete = Boolean(restEndsAt && restRemaining === 0);

  /**
   * `now` only ticks while resting, so it is stale whenever a rest starts or
   * moves: a set logged minutes after the last rest ended showed the gap added
   * to the clock, and +15s on a finished rest briefly read "Resting". Resync
   * before paint, whether the rest came from this tab, another one or a resume.
   */
  useLayoutEffect(() => {
    if (restEndsAt) setNow(Date.now());
  }, [restEndsAt]);

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
    activeSessionRef.current = next;
    setActiveSession(next);
    setHistory([next, ...prior]);
    // The resume cue has done its job once the athlete acts on the session.
    setResumed(false);
  };

  /**
   * Applies a change to the session as it is stored now, not to this tab's copy of it,
   * so a change made in another tab is kept rather than overwritten. A session that has
   * been finished or removed meanwhile takes no more changes.
   */
  const commit = (change: (session: DeviceWorkoutSession) => DeviceWorkoutSession) => {
    const current = activeSessionRef.current;
    if (!current) return;
    const latest = loadDeviceWorkoutSessions().find((session) => session.id === current.id);
    if (latest && latest.status !== "active") {
      setHistory(loadDeviceWorkoutSessions());
      setActiveSession(null);
      setResumed(false);
      toast("This workout was closed in another tab", { id: "session-closed-elsewhere", description: "It was finished there, and its record is saved." });
      return;
    }
    persist(change(withUnit(latest ?? current)));
  };

  const start = () => {
    if (!workout.length || starting.current) return;
    starting.current = true;
    try {
      // One workout at a time on a device. A session already running - started in
      // another tab, or before a reload - is picked up rather than joined by a second.
      const running = loadDeviceWorkoutSessions().find((session) => session.status === "active");
      if (running) {
        setHistory(loadDeviceWorkoutSessions());
        activeSessionRef.current = withUnit(running);
        setActiveSession(withUnit(running));
        setResumed(true);
        toast("A workout is already running", { id: "session-already-running", description: `${running.dayLabel || running.title} is open on this device, so it was picked up here instead of starting a second one.` });
        return;
      }
      setResumed(false);
      persist(makeSession(workout, prescriptions, dayLabel, startRestSeconds, weightUnit, goal));
    } finally {
      starting.current = false;
    }
  };

  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DeviceWorkoutSession["exercises"][number]["sets"][number]>) => {
    commit((session) => {
      // Writing a weight writes the unit it was typed in with it.
      const stamp = "weight" in patch ? { unit: session.weightUnit ?? weightUnit } : {};
      return {
        ...session,
        exercises: session.exercises.map((exercise) => exercise.id !== exerciseId
          ? exercise
          : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, ...patch, ...stamp } : set) }),
      };
    });
  };

  /**
   * Completion is the only thing that turns a draft into an observation, and
   * the only moment a carried-forward default becomes a real recorded value.
   */
  const completeActiveSet = () => {
    if (!activeSession || !position) return;
    commit((session) => ({
      ...session,
      restEndsAt: new Date(Date.now() + (session.restSeconds || DEFAULT_REST_SECONDS) * 1000).toISOString(),
      exercises: session.exercises.map((item, exerciseIndex) => exerciseIndex !== position.exerciseIndex
        ? item
        : { ...item, sets: item.sets.map((set, setIndex) => setIndex !== position.setIndex ? set : {
            // What you see in the box is what gets logged, including a field
            // the athlete deliberately emptied.
            weight: shownEntries.weight,
            unit: sessionUnit,
            height: shownEntries.height,
            reps: shownEntries.reps,
            completed: true,
          }) }),
    }));
  };

  /** The keyboard's return key does what its label says: Next moves to the following box, Done on the last box logs the set. */
  const onEntryKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const inputs = Array.from(event.currentTarget.closest(".live-set-entry")?.querySelectorAll("input") ?? []);
    const next = inputs[inputs.indexOf(event.currentTarget) + 1];
    if (next) { next.focus(); return; }
    if (event.repeat) return; // a held key must not log several sets
    // In a drop set, Done adds the stage and goes back to the first box for the next one.
    if (activeSession && position && activeSession.exercises[position.exerciseIndex].sets[position.setIndex].type === "drop") { addDropStage(false); inputs[0]?.focus(); return; }
    event.currentTarget.blur(); // close the keyboard so the rest row is visible
    completeActiveSet();
  };

  /**
   * "I didn't get to do the hip thrust" — the rack was taken, time ran out.
   * Skipping resolves the exercise's remaining sets and moves execution on,
   * without recording anything the athlete did not do.
   */
  const skipActiveExercise = () => {
    if (!activeSession || !position) return;
    const name = activeSession.exercises[position.exerciseIndex].exerciseName;
    const exerciseIndex = position.exerciseIndex;
    commit((session) => ({ ...skipExercise(session, exerciseIndex), restEndsAt: undefined }));
    toast(`Skipped ${name}`, {
      description: "Nothing was recorded for it. Reopen the full session to put it back.",
      action: { label: "Undo", onClick: () => commit((session) => unskipExercise(session, exerciseIndex)) },
    });
  };

  const toggleExerciseSkip = (exerciseIndex: number) => {
    if (!activeSession) return;
    commit((session) => isExerciseSkipped(session.exercises[exerciseIndex]) ? unskipExercise(session, exerciseIndex) : skipExercise(session, exerciseIndex));
  };

  const adjustRest = (delta: number) => {
    if (!activeSession) return;
    commit((session) => {
      const endsAt = session.restEndsAt ? Date.parse(session.restEndsAt) : null;
      return {
        ...session,
        restSeconds: Math.max(REST_STEP_SECONDS, (session.restSeconds || DEFAULT_REST_SECONDS) + delta),
        restEndsAt: endsAt ? new Date(endsAt + delta * 1000).toISOString() : session.restEndsAt,
      };
    });
  };

  const endRest = () => {
    if (!activeSession) return;
    commit((session) => ({ ...session, restEndsAt: undefined }));
  };

  /**
   * Swapping an exercise mid-workout (lib/workoutSwap). The sheet is opened for one session
   * exercise; the swap is one checkpointed write, carrying an id so the same confirm can never
   * apply twice; and the toast's Undo takes it back while nothing new is logged on it.
   */
  const [swapForId, setSwapForId] = useState<string | null>(null);
  /** The workout just finished, shown as its saved recap until the athlete is done with it. */
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const swapping = useRef(false);
  const dayNameOf = (label: string) => label.split(" · ").map((part) => part.trim()).filter(Boolean).pop() || label;

  /** The candidate's own last logged set on this device - never the exercise it replaces. */
  const lastLoggedText = (exercise: Exercise) => {
    const last = lastCompletedSetFor({ exerciseName: exercise.name, catalogId: exercise.id }, history, sessionUnit);
    return last ? performedSetLine(last, last.unit ?? sessionUnit, loadConventionFor(exercise.id)) : null;
  };

  /** Whether the plan's open day can take the same swap, and exactly which slot it changes. */
  const planOptionFor = (from: DeviceWorkoutExercise) => (target: Exercise): SwapPlanOption | null => {
    if (!onReplaceInPlan || !activeSession) return null;
    if (activeSession.dayLabel !== dayLabel) return { available: false, reason: "this workout is from a different day than the one open in your plan." };
    const fromEntry = catalogFor(from);
    const slot = fromEntry ? workout.findIndex((item) => catalogIdOf(item) === fromEntry.id) : -1;
    if (!fromEntry || slot < 0) return { available: false, reason: `${from.exerciseName} isn't in this day of your plan.` };
    if (workout.some((item) => catalogIdOf(item) === target.id)) return { available: false, reason: `${target.name} is already in this day of your plan.` };
    const prescription = prescriptions[workout[slot].id] || getGoalPrescription(goal, slot);
    return { available: true, slot: `${dayNameOf(dayLabel)}, exercise ${slot + 1} of ${workout.length}: ${from.exerciseName} becomes ${target.name}. Its sets and reps (${prescription}) stay.` };
  };

  /**
   * After a swap, focus goes to the next logging action rather than back to Swap exercise. The
   * sheet hands focus back to its opener as it closes, so this runs once it has.
   */
  const focusNextLogAction = () => window.setTimeout(() => document.querySelector<HTMLElement>(".live-set-card .live-set-commit")?.focus({ preventScroll: false }), 0);

  const undoSwapFrom = (receipt: SwapReceipt, revertPlan: (() => void) | null) => {
    const current = activeSessionRef.current;
    if (!current || !canUndoSwap(current, receipt)) {
      toast("This swap can't be undone now", { id: `swap-undo-${receipt.swapId}`, description: `Something has been logged or typed since. Swap ${receipt.replacement.exerciseName} again instead.` });
      return;
    }
    commit((session) => undoSwap(session, receipt));
    revertPlan?.();
    toast(`Back to ${receipt.before.exerciseName}`, { id: `swap-undo-${receipt.swapId}`, description: revertPlan ? "The workout and your plan are as they were." : "The workout is as it was." });
  };

  const confirmSwap = (exerciseId: string, choice: ExerciseSwapChoice) => {
    if (swapping.current) return;
    swapping.current = true;
    try {
      const swapId = freshId("swap");
      const out: { receipt: SwapReceipt | null } = { receipt: null };
      commit((session) => {
        const result = applySwap(session, exerciseId, { name: choice.target.name, id: choice.target.id }, { swapId, newExerciseId: freshId(String(choice.target.id)), at: new Date().toISOString(), draft: choice.draft, partialDrop: choice.partialDrop }, exerciseCatalog);
        out.receipt = result.receipt;
        return result.session;
      });
      setSwapForId(null);
      focusNextLogAction();
      const receipt = out.receipt;
      if (!receipt) return;
      const fromName = receipt.before.exerciseName;
      const fromCatalogId = catalogFor(receipt.before)?.id;
      let planLine = "";
      let revertPlan: (() => void) | null = null;
      if (choice.alsoPlan && fromCatalogId !== undefined && onReplaceInPlan) {
        if (onReplaceInPlan(fromCatalogId, choice.target.id)) {
          planLine = ` Your plan's ${dayNameOf(dayLabel)} now has ${choice.target.name} in its place.`;
          revertPlan = () => { onReplaceInPlan(choice.target.id, fromCatalogId); };
        } else planLine = " Your plan couldn't be changed just now, so it is as it was.";
      }
      const kept = receipt.original ? receipt.original.sets.filter(isCompletedSet).length : 0;
      toast(`Swapped to ${choice.target.name}`, {
        id: `swap-${swapId}`,
        description: `${kept ? `Your ${kept} logged ${kept === 1 ? "set stays" : "sets stay"} with ${fromName}.` : `${choice.target.name} takes ${fromName}'s place.`}${planLine}`,
        action: { label: "Undo", onClick: () => undoSwapFrom(receipt, revertPlan) },
      });
    } finally {
      swapping.current = false;
    }
  };

  const addAfterExercise = (exerciseId: string, target: Exercise) => {
    const anchor = activeSessionRef.current?.exercises.find((exercise) => exercise.id === exerciseId);
    commit((session) => addAfter(session, exerciseId, { name: target.name, id: target.id }, { newExerciseId: freshId(String(target.id)), at: new Date().toISOString() }));
    setSwapForId(null);
    focusNextLogAction();
    toast(`Added ${target.name}`, { description: `After ${anchor?.exerciseName ?? "the last exercise"}, starting from the same sets and reps.` });
  };

  /**
   * Drop sets (lib/dropSets). The active set becomes a drop set from the set-type switch; each
   * stage is confirmed with Add drop and starts no rest; Finish drop set logs the parent set,
   * which needs two stages at least, and only then starts the rest.
   */
  const [dropProblem, setDropProblem] = useState<string | null>(null);
  /** A clarification that blocks nothing: a stage that is not lighter than the one before. */
  const [dropNote, setDropNote] = useState<string | null>(null);

  const setActiveSetType = (type: "standard" | "drop") => {
    if (!activeSession || !position) return;
    const exercise = activeSession.exercises[position.exerciseIndex];
    const set = exercise.sets[position.setIndex];
    if (type === "standard" && (set.stages?.length ?? 0) > 0) return;
    setDropProblem(null);
    setDropNote(null);
    updateSet(exercise.id, position.setIndex, type === "drop" ? { type: "drop", id: set.id ?? freshId("set"), stages: set.stages ?? [] } : { type: undefined, stages: undefined });
  };

  const forgetTouched = () => setTouchedEntries((current) => {
    const next = { ...current };
    for (const field of ["weight", "reps", "height"] as const) delete next[entryKey(field)];
    return next;
  });

  const addDropStage = (finish: boolean) => {
    if (!activeSession || !position) return;
    const exercise = activeSession.exercises[position.exerciseIndex];
    const set = exercise.sets[position.setIndex];
    const stages = set.stages ?? [];
    const setId = set.id ?? freshId("set");
    const typed = { weight: shownEntries.weight, reps: shownEntries.reps };
    const weightField = activeEntryFields.find((field) => field.measure === "weight");
    let next = stages;
    let note: string | null = null;
    if (!finish || typed.weight.trim() || typed.reps.trim()) {
      const problem = stageProblem(typed, stages[stages.length - 1], { loadOptional: !weightField || weightField.optional, unit: sessionUnit });
      if (problem) { setDropProblem(problem); return; }
      note = stageNote(typed, stages[stages.length - 1], sessionUnit);
      next = [...stages, { id: newStageId(setId, stages), weight: typed.weight, reps: typed.reps, unit: sessionUnit }];
    }
    if (finish && next.length < 2) { setDropProblem("A drop set needs at least two stages. Add a drop, or switch back to Standard."); return; }
    setDropProblem(null);
    setDropNote(note ? `Stage ${next.length}: ${note}` : null);
    commit((session) => ({
      ...session,
      // Rest starts when the whole set is done, never between its stages.
      ...(finish ? { restEndsAt: new Date(Date.now() + (session.restSeconds || DEFAULT_REST_SECONDS) * 1000).toISOString() } : {}),
      exercises: session.exercises.map((item) => item.id !== exercise.id ? item : {
        ...item,
        sets: item.sets.map((entry, index): DeviceSetLog => index !== position.setIndex ? entry : finish
          ? { ...entry, id: setId, type: "drop", stages: next, weight: next[0].weight, reps: next[0].reps, unit: next[0].unit ?? sessionUnit, height: entry.height || "", completed: true }
          : { ...entry, id: setId, type: "drop", stages: next, weight: "", reps: "", unit: sessionUnit }),
      }),
    }));
    forgetTouched();
  };

  /** Takes the last stage back into the boxes, to correct it. */
  const editLastStage = () => {
    if (!activeSession || !position) return;
    const exercise = activeSession.exercises[position.exerciseIndex];
    const stages = exercise.sets[position.setIndex].stages ?? [];
    const last = stages[stages.length - 1];
    if (!last) return;
    setDropProblem(null);
    setDropNote(null);
    updateSet(exercise.id, position.setIndex, { stages: stages.slice(0, -1), weight: last.weight, reps: last.reps });
  };

  /**
   * Removes one stage - an accidental one - and keeps the parent set and every other stage. The
   * message's Undo puts it back where it was, with its id, while the set is still open.
   */
  const removeStage = (stageId: string) => {
    if (!activeSession || !position) return;
    const exercise = activeSession.exercises[position.exerciseIndex];
    const setIndex = position.setIndex;
    const stages = exercise.sets[setIndex].stages ?? [];
    const index = stages.findIndex((stage) => stage.id === stageId);
    if (index < 0) return;
    const removed = stages[index];
    setDropNote(null);
    updateSet(exercise.id, setIndex, { stages: stages.filter((stage) => stage.id !== stageId) });
    toast(`Removed stage ${index + 1}`, {
      id: `drop-remove-${stageId}`,
      description: `${stageLoadText(removed, sessionUnit, loadConventionFor(catalogFor(exercise)?.id))} × ${removed.reps}. The set and its other stages are kept.`,
      action: { label: "Undo", onClick: () => commit((session) => ({
        ...session,
        exercises: session.exercises.map((item) => item.id !== exercise.id ? item : {
          ...item,
          sets: item.sets.map((set, at): DeviceSetLog => {
            if (at !== setIndex || set.completed || set.stages?.some((stage) => stage.id === stageId)) return set;
            const restored = [...(set.stages ?? [])];
            restored.splice(Math.min(index, restored.length), 0, removed);
            return { ...set, stages: restored };
          }),
        }),
      })) },
    });
  };

  /**
   * A set already logged turns into a drop set: what it recorded becomes stage 1, and it is
   * reopened as the active set so its drops are added the same way. Left unfinished, it stays
   * the set it was (deviceWorkoutLog.settleDropSet).
   */
  const convertToDropSet = (exerciseId: string, setIndex: number) => {
    commit((session) => ({
      ...session,
      exercises: session.exercises.map((item) => item.id !== exerciseId ? item : {
        ...item,
        sets: item.sets.map((set, index): DeviceSetLog => {
          if (index !== setIndex || !set.completed || set.type === "drop") return set;
          const id = set.id ?? freshId("set");
          return { ...set, id, type: "drop", stages: [{ id: `${id}-stage-1`, weight: set.weight, reps: set.reps, unit: set.unit ?? session.weightUnit }], weight: "", reps: "", completed: false };
        }),
      }),
    }));
    toast(`Set ${setIndex + 1} is now a drop set`, { id: "drop-convert", description: "What it recorded is stage 1. Add its drops in the set card, then Finish drop set." });
  };

  /** Un-logging a drop set reopens it with its stages, and empty boxes for another drop. */
  const toggleSetLogged = (exerciseId: string, setIndex: number, set: DeviceSetLog) => {
    if (set.type === "drop" && set.completed) updateSet(exerciseId, setIndex, { completed: false, weight: "", reps: "" });
    else updateSet(exerciseId, setIndex, { completed: !set.completed });
  };

  const finish = () => {
    const current = activeSessionRef.current;
    if (!current) return;
    // Finish what is stored now, which includes sets logged in another tab.
    const latest = loadDeviceWorkoutSessions().find((item) => item.id === current.id);
    if (latest && latest.status !== "active") {
      setHistory(loadDeviceWorkoutSessions());
      setActiveSession(null);
      setResumed(false);
      toast("This workout was already finished", { id: "session-closed-elsewhere", description: "It was finished in another tab, and its record is saved." });
      return;
    }
    // Read now, stored with the session: what the athlete weighs today is what this workout was
    // done at, and no later weight change gets to rewrite it.
    const { session, completedSets, settledDropSets } = finalizeSession(
      withUnit(latest ?? current),
      undefined,
      currentBodyWeightKg(loadBodyWeightLog()),
    );
    const prior = loadDeviceWorkoutSessions().filter((item) => item.id !== session.id);
    /*
     * Nothing logged is not a workout (B155, B156). A finish with no completed set used to
     * be stored as a completed session and counted on Home and Progress as a workout done.
     * It now ends the session and records nothing.
     */
    if (completedSets === 0) {
      const cleared = saveDeviceWorkoutSessions(prior);
      setDurable(cleared);
      if (!cleared) {
        toast.error("This workout could not be closed yet", { id: "finish-not-saved", description: "The device refused the save, so the workout is still open here. Free up storage, then try again.", action: { label: "Try again", onClick: () => finish() } });
        return;
      }
      setHistory(prior);
      activeSessionRef.current = null;
      setActiveSession(null);
      setResumed(false);
      toast("Workout ended, nothing recorded", { id: "finish-empty", description: "No set was logged, so it does not count as a workout." });
      return;
    }
    const written = saveDeviceWorkoutSessions([session, ...prior]);
    setDurable(written);
    /*
     * A finish the device refused is not a finished workout. It used to close the live
     * view, hide the storage warning with it and announce "1 set added to Progress"
     * while storage still held the session as active. The workout now stays open, the
     * warning stays up, and the message says what happened and offers the retry.
     */
    if (!written) {
      toast.error("This workout could not be saved yet", {
        id: "finish-not-saved",
        description: "The device refused the save, so the workout is still open here and nothing was lost. Free up storage, then finish again.",
        action: { label: "Try again", onClick: () => finish() },
      });
      return;
    }
    setHistory([session, ...prior]);
    activeSessionRef.current = null;
    setActiveSession(null);
    setResumed(false);
    setConfirmingFinish(false);
    /*
     * The record is written, so the screen says so: "Workout saved", built from the stored record
     * (WorkoutSessionDetail) - the same detail Progress opens later. What did not count is in it:
     * skipped and not-recorded work is listed, never turned into completed sets. Only a drop set
     * closed with the stages it had is worth a word more, since the athlete never tapped Finish on it.
     */
    setSavedSessionId(session.id);
    if (settledDropSets) toast(`${settledDropSets === 1 ? "A drop set left open was" : `${settledDropSets} drop sets left open were`} recorded with the stages added`, { id: "finish-settled-drop" });
  };

  /**
   * Finishing with planned sets still open asks once, in place (R13): Keep going returns to the same
   * set with every draft, and the rest timer untouched. Nothing is asked when every set is resolved.
   */
  const requestFinishEarly = () => {
    const current = activeSessionRef.current;
    if (!current) return;
    const open = current.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => !set.completed && !set.skipped).length, 0);
    if (open === 0) { finish(); return; }
    setConfirmingFinish(true);
  };

  /** Explicit drill-down. Opening it does not move the active set, so the athlete keeps their place while checking or correcting earlier work. */
  const queue = useMemo(() => !activeSession ? null : (
      <details className="live-session-queue">
        <summary>
          <span>Full workout</span>
          <small>every exercise and set{drafts ? ` · ${drafts} typed, not logged` : ""}</small>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </summary>
        <div className="session-exercise-list">{activeSession.exercises.map((exercise, exerciseIndex) => {
          const queueFields = entryFieldsFor(exercise);
          const exerciseSkipped = isExerciseSkipped(exercise);
          const catalogEntry = catalogFor(exercise);
          const convention = loadConventionFor(catalogEntry?.id);
          const note = swapNote(exercise);
          const canDrop = queueFields.some((field) => field.measure === "weight") && !exercise.replacedBy;
          return <article key={exercise.id} className={`session-exercise ${exerciseSkipped ? "session-exercise-skipped" : ""} ${exercise.replacedBy ? "session-exercise-replaced" : ""}`}>
          <div className="exercise-media-dense">
            <span>{String(exerciseIndex + 1).padStart(2, "0")}</span>
            {/* The photograph confirms which exercise and variant this is; the catalog
                entry is found by the id the session was built with (or, for a session
                from before ids were kept, its name), and a name the catalog no longer
                has gets the placeholder frame rather than a guess. */}
            <ExerciseMedia exerciseId={catalogEntry?.id ?? -1} exerciseName={exercise.exerciseName} equipment={catalogEntry?.equipment} variant="thumb" />
            <div><strong>{exercise.exerciseName}</strong><small>{exerciseSkipped ? "Skipped · nothing recorded" : exercise.plannedPrescription}</small>{note && <small className="session-swap-note">{note}</small>}</div>
            {!exercise.replacedBy && <span className="session-exercise-actions">
              <button type="button" className="session-exercise-skip" onClick={() => setSwapForId(exercise.id)} aria-label={`Swap ${exercise.exerciseName}`}>
                <ArrowLeftRight className="h-3.5 w-3.5" /><span>Swap</span>
              </button>
              <button type="button" className="session-exercise-skip" onClick={() => toggleExerciseSkip(exerciseIndex)} aria-pressed={exerciseSkipped}>
                {exerciseSkipped ? <Undo2 className="h-3.5 w-3.5" /> : <SkipForward className="h-3.5 w-3.5" />}
                <span>{exerciseSkipped ? "Put back" : "Skip"}</span>
              </button>
            </span>}
          </div>
          <div className="session-set-list">{exercise.sets.map((set, setIndex) => {
            // A drop set is one row: its stages in order, collapsed, with the set's totals under them.
            if (set.type === "drop" && (set.stages?.length ?? 0) > 0) {
              const unit = setWeightUnit(set, activeSession, sessionUnit);
              const volume = setVolume(set, unit, convention, sessionUnit);
              const inProgress = isDropInProgress(set);
              return <div key={set.id ?? setIndex} className={`session-set-row session-set-drop ${set.completed ? "session-set-complete" : ""}`}>
                <strong>Set {setIndex + 1}{inProgress ? " · drop set, in progress" : ""}</strong>
                <p className="session-drop-line">{dropSetLine(set, unit, convention)}</p>
                <small className="session-drop-detail">{dropSetSummary(set)}{volume ? ` · ${volumeText(volume)}` : ""}</small>
                {set.completed && <button type="button" onClick={() => toggleSetLogged(exercise.id, setIndex, set)} aria-pressed={true} aria-label={`Undo set ${setIndex + 1}, drop set of ${exercise.exerciseName}`}>
                  <Undo2 className="h-3.5 w-3.5" /><span>Undo</span>
                </button>}
              </div>;
            }
            return <div key={set.id ?? setIndex} className={`session-set-row ${set.completed ? "session-set-complete" : ""} ${isDraftSet(set) ? "session-set-draft" : ""} ${set.skipped ? "session-set-skipped" : ""}`}>
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
            <button onClick={() => toggleSetLogged(exercise.id, setIndex, set)} aria-pressed={set.completed}>
              {set.completed ? <Undo2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              <span>{set.completed ? "Undo" : "Log set"}</span>
            </button>
            {set.completed && canDrop && <button type="button" className="session-set-to-drop" onClick={() => convertToDropSet(exercise.id, setIndex)} aria-label={`Make set ${setIndex + 1} of ${exercise.exerciseName} a drop set`}>
              <Layers className="h-3.5 w-3.5" /><span>Make drop set</span>
            </button>}
          </div>; })}</div>
        </article>; })}</div>
      </details>
  ), [activeSession, catalogByName, sessionUnit]);

  if (!activeSession && savedSessionId) {
    return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker session-saved">
      <WorkoutSessionDetail
        sessionId={savedSessionId}
        weightUnit={weightUnit}
        variant="saved"
        onDone={() => setSavedSessionId(null)}
        onOpenProgress={onOpenSession ? () => { const id = savedSessionId; setSavedSessionId(null); onOpenSession(id); } : undefined}
        onOpenNext={onOpenHome ? () => { setSavedSessionId(null); onOpenHome(); } : undefined}
      />
    </section>;
  }

  if (!activeSession) {
    const plannedSets = workout.reduce((total, exercise, index) => total + renderableSetCount(prescriptions[exercise.id] || getGoalPrescription(goal, index)), 0);
    /**
     * "Week 2 · Day 02 · Pull": the day's name is the title of this screen and
     * its position in the plan is the line under it. The label is kept whole on
     * the session itself, which is what Plan, Home and Progress match on.
     */
    const labelParts = dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean);
    const dayName = labelParts[labelParts.length - 1] || dayLabel;
    const dayPosition = labelParts.slice(0, -1).join(" · ");
    const planned = workout.length > 0;
    /**
     * The day's latest finished workout this week, by the rule Home's week strip
     * reads (trainingStateByDayLabel): the same label, at least one completed set,
     * finished since Monday. The finish toast fades; this line stays, so the
     * screen still says the day was trained and where its record lives.
     */
    const weekStart = startOfTrainingWeek(new Date());
    const trained = history
      .map((session) => ({ session, at: new Date(session.completedAt ?? session.startedAt) }))
      .filter(({ session, at }) => session.dayLabel === dayLabel && isCompletedWorkout(session) && at >= weekStart)
      .sort((a, b) => b.at.getTime() - a.at.getTime())[0] ?? null;
    const trainedSets = trained ? trained.session.exercises.flatMap((exercise) => exercise.sets).filter(isCompletedSet).length : 0;
    const trainedWhen = trained && trained.at.toDateString() === new Date().toDateString()
      ? "today"
      : trained?.at.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    /**
     * Prestart, and nothing else. What the athlete is about to do, stated once:
     * the day, where it sits in the plan, how much it is, and one action. The
     * prescription follows as rows to read - not the Plan editor, so no reorder
     * handles, no set fields, no completion marks before a set has happened.
     * Preparation and the session's own options wait behind their own lines.
     *
     * The reference draws an equipment illustration beside the hero. No such
     * asset exists in this build (docs/design-handoff/missing-illustrations.md
     * records the slot), so the hero runs full width rather than carrying a
     * placeholder.
     */
    return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker session-prestart">
      <div className="session-prestart-hero">
        <p className="metric-label">Workout</p>
        <h1 className="session-prestart-day">{dayName}</h1>
        {dayPosition && <p className="session-prestart-position">{dayPosition}</p>}
        <p className="session-prestart-counts">{planned
          ? `${workout.length} ${workout.length === 1 ? "exercise" : "exercises"} · ${plannedSets} ${plannedSets === 1 ? "set" : "sets"}`
          : "Nothing planned for this day yet"}</p>
        {trained && <p className="session-prestart-done" role="status">
          <Check className="h-4 w-4" aria-hidden /> Done {trainedWhen} · {trainedSets} {trainedSets === 1 ? "set" : "sets"} recorded
          {onOpenProgress && <button type="button" className="session-prestart-edit" onClick={onOpenProgress}>View record <ArrowRight className="h-4 w-4" aria-hidden /></button>}
        </p>}
        <div className="session-prestart-actions">
          <button type="button" className="session-prestart-start" onClick={start} disabled={!planned}><Play className="h-4 w-4" aria-hidden /> Start workout <ArrowRight className="h-4 w-4" aria-hidden /></button>
          {onEditInPlan && <button type="button" className="session-prestart-edit" onClick={onEditInPlan}>{planned ? "Edit in Plan" : "Build it in Plan"} <ArrowRight className="h-4 w-4" aria-hidden /></button>}
          {onReviewDay && planned && <button type="button" className="session-prestart-edit" onClick={onReviewDay}>Review this day <ArrowRight className="h-4 w-4" aria-hidden /></button>}
        </div>
        {daySwitch}
      </div>

      {planned && <div className="session-prestart-list">
        <p className="metric-label">Your exercises</p>
        <ol>
          {workout.map((exercise, index) => {
            const row = <>
              <span className="session-prestart-index">{String(index + 1).padStart(2, "0")}</span>
              <ExerciseMedia exerciseId={exercise.id} exerciseName={exercise.name} equipment={exercise.equipment} variant="thumb" />
              <span className="session-prestart-name">
                <strong>{exercise.name}</strong>
                <small>{prescriptions[exercise.id] || getGoalPrescription(goal, index)}</small>
              </span>
              {onInspect && <ChevronRight className="h-5 w-5" aria-hidden />}
            </>;
            return <li key={exercise.id}>
              {onInspect
                ? <button type="button" className="session-prestart-row" onClick={() => onInspect(exercise)} aria-label={`${exercise.name}, ${prescriptions[exercise.id] || getGoalPrescription(goal, index)}: open details`}>{row}</button>
                : <div className="session-prestart-row">{row}</div>}
            </li>;
          })}
        </ol>
      </div>}

      {planned && <details className="session-prestart-disclosure">
        <summary><Settings className="h-5 w-5" aria-hidden /><span>Preparation</span><ChevronRight className="h-5 w-5" aria-hidden /></summary>
        <div className="session-prestart-disclosure-body"><WarmupPanel workout={workout} goal={goal} /></div>
      </details>}

      {planned && <details className="session-prestart-disclosure">
        <summary><SlidersHorizontal className="h-5 w-5" aria-hidden /><span>Workout options</span><ChevronRight className="h-5 w-5" aria-hidden /></summary>
        <div className="session-prestart-disclosure-body">
          <div className="session-prestart-option">
            <div>
              <strong>Rest between sets</strong>
              <small>{restOverride !== null ? "Set for this session. " : plannedRest ? "From your plan. " : "The default. "}You can change it mid-workout too.</small>
            </div>
            <div className="session-prestart-stepper" role="group" aria-label="Rest between sets">
              <button type="button" onClick={() => setRestOverride(Math.max(REST_STEP_SECONDS, startRestSeconds - REST_STEP_SECONDS))} aria-label="Shorter rest">−{REST_STEP_SECONDS}s</button>
              <b aria-live="polite">{clockFor(startRestSeconds)}</b>
              <button type="button" onClick={() => setRestOverride(startRestSeconds + REST_STEP_SECONDS)} aria-label="Longer rest">+{REST_STEP_SECONDS}s</button>
            </div>
          </div>
        </div>
      </details>}
    </section>;
  }

  const activeExercise = position ? activeSession.exercises[position.exerciseIndex] : null;
  const nextExerciseName = position ? activeSession.exercises.slice(position.exerciseIndex + 1).find((exercise) => !isExerciseSkipped(exercise))?.exerciseName ?? null : null;
  const activeSet = position && activeExercise ? activeExercise.sets[position.setIndex] : null;
  const dropMode = activeSet?.type === "drop";
  const activeStages = activeSet?.stages ?? [];
  const activeConvention = loadConventionFor(activeExercise ? catalogFor(activeExercise)?.id : undefined);
  /** Drop sets are about load: offered wherever the set has a weight box. */
  const canDropActive = activeEntryFields.some((field) => field.measure === "weight");
  const swapExercise = swapForId ? activeSession.exercises.find((exercise) => exercise.id === swapForId) ?? null : null;

  return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker">
    <div className="execution-head">
      {/*
        * Measured at 393x852 mid-workout: the first 400px of this screen - half
        * of it, above the fold - was the day label, the day label again, and a
        * set tally set in the largest type on the page. The thing an athlete
        * actually reads between sets (which lift, which set, what target) began
        * below all of it.
        *
        * A tally is orientation, not instruction. It is a bar and a count now,
        * and the sentence explaining that sets save on this device is gone - it
        * described a mechanism you learn by doing it once.
        */}
      <div>
        <p className="metric-label">{activeSession.dayLabel}</p>
        <div className="session-progress">
          <span className="session-progress-track" aria-hidden="true">
            <i style={{ width: `${planned ? Math.round((completed / planned) * 100) : 0}%` }} />
          </span>
          <strong>{completed}<span>/{planned} sets</span></strong>
        </div>
      </div>
      {/* No finish button here. It was a full-width control at the top of every
          view of a session that is, by definition, not finished; the first view
          held three full-width buttons and the contract allows one dominant
          action. Finishing lives where it becomes the next thing to do - the
          completion card - and, for a session cut short, below the queue. */}
    </div>

    {!durable && <p className="tracker-storage-warning" role="alert">
      This device would not store the last change. Your sets are still on screen, but they will not survive a reload — free up storage or leave private browsing before you finish.
    </p>}

    {resumed && <p className="tracker-resume-cue">
      Picked up where you left off. {completed} {completed === 1 ? "set is" : "sets are"} confirmed
      {drafts ? `, and ${drafts} ${drafts === 1 ? "set was" : "sets were"} typed but never logged — check ${drafts === 1 ? "it" : "them"} before you finish.` : "."}
    </p>}

    {/* Where the athlete now stands, said once per move. It sits outside the card so it
        stays mounted when the card swaps for the done card: that swap unmounts the
        focused Log button, and a live region mounted with its text is often not read. */}
    <p className="sr-only" role="status">{activeExercise && activeSet && position ? `${activeExercise.exerciseName}, set ${position.setIndex + 1} of ${activeExercise.sets.length}` : "Every planned set is logged."}</p>

    {activeExercise && activeSet && position ? <div className="live-set-card">
      <p className="metric-label">Now · exercise {position.exerciseIndex + 1} of {activeSession.exercises.length}</p>
      <h4>{activeExercise.exerciseName}</h4>
      {activeExercise.swappedFrom && <p className="live-set-swap-note">{swapNote(activeExercise)}</p>}
      {/* The instruction, at the size of an instruction. "Set 2 of 4 · 3–5" was
          the smallest line in the card, under an exercise name twice its size
          and a tally three times it - so the one thing you read between sets
          was the quietest thing on the screen. The target is for *this* set,
          not the whole prescription: on set 2 of "3 × 10/8/6" the athlete needs
          "8", not a string to count through. */}
      <p className="live-set-prescription">
        <span>Set {position.setIndex + 1} of {activeExercise.sets.length}</span>
        <strong>{repsForSet(activeExercise.plannedPrescription, position.setIndex)}{bareCount(repsForSet(activeExercise.plannedPrescription, position.setIndex)) ? <em> reps</em> : null}</strong>
      </p>
      {/* Once a drop set has a stage, the last set's numbers are exactly what the next stage is not. */}
      {carried && activeStages.length === 0 && <p className="live-set-last">
        {carried.source === "session" ? "Last set" : "Last logged"}: {activeEntryFields.map((field) => `${carried[field.measure] || "—"} ${field.unit}`).join(" · ")} × {carried.reps}
      </p>}
      {/* The photographs of the current exercise, collapsed: a reference to open between sets,
          never a frame the athlete must scroll past to log one. The set fields keep their values
          either way; this is a disclosure, not a route. */}
      {(() => { const catalogEntry = catalogFor(activeExercise); return catalogEntry && exercisePhotoSet(catalogEntry.id) ? <details className="live-set-media">
        <summary>Show {activeExercise.exerciseName} photos <ChevronRight className="h-4 w-4" aria-hidden /></summary>
        <ExerciseMedia exerciseId={catalogEntry.id} exerciseName={catalogEntry.name} equipment={catalogEntry.equipment} variant="detail" />
      </details> : null; })()}
      {canDropActive && <div className="live-set-type" role="group" aria-label="Set type">
        <button type="button" aria-pressed={!dropMode} onClick={() => setActiveSetType("standard")} disabled={dropMode && activeStages.length > 0}>Standard</button>
        <button type="button" aria-pressed={dropMode} onClick={() => setActiveSetType("drop")}><Layers className="h-4 w-4" aria-hidden /> Drop set</button>
      </div>}
      {dropMode && <div className="live-drop">
        {activeStages.length > 0 && <ol className="live-drop-stages" aria-label="Stages done">
          {activeStages.map((stage, index) => <li key={stage.id}>
            <span>Stage {index + 1}</span>
            <b>{stageLoadText(stage, sessionUnit, activeConvention)} × {stage.reps}</b>
            <span className="live-drop-stage-actions">
              {index === activeStages.length - 1 && <button type="button" onClick={editLastStage} aria-label={`Edit stage ${index + 1}: put its numbers back in the boxes`}><Undo2 className="h-3.5 w-3.5" aria-hidden /> Edit</button>}
              <button type="button" onClick={() => removeStage(stage.id)} aria-label={`Remove stage ${index + 1}`}><X className="h-3.5 w-3.5" aria-hidden /> Remove</button>
            </span>
          </li>)}
        </ol>}
        <p className="live-drop-next">Stage {activeStages.length + 1}{activeStages.length ? ` · lighter than ${stageLoadText(activeStages[activeStages.length - 1], sessionUnit, activeConvention)}` : ""} · no rest between stages</p>
      </div>}
      <div className="live-set-entry" data-fields={activeEntryFields.length + 1}>
        {/* A value carried from the last set is an offer until the athlete touches
            the field: it is marked so it never passes for something already typed. */}
        {activeEntryFields.map((field) => <label key={field.measure}>
          <span>{field.label}</span>
          <input value={shownEntries[field.measure]} inputMode="decimal" type="text" autoComplete="off" enterKeyHint="next" data-carried={isCarried(field.measure) ? "" : undefined}
            onChange={(event) => editEntry(field.measure, event.target.value)} onKeyDown={onEntryKeyDown} placeholder="—" />
          <em>{field.unit}</em>
        </label>)}
        <label>
          <span>Reps</span>
          <input value={shownEntries.reps} inputMode="numeric" type="text" autoComplete="off" enterKeyHint="done" data-carried={isCarried("reps") ? "" : undefined}
            onChange={(event) => editEntry("reps", event.target.value)} onKeyDown={onEntryKeyDown} placeholder="—" />
        </label>
      </div>
      {dropMode
        ? <div className="live-drop-actions">
          <button type="button" className="live-drop-add" onClick={() => addDropStage(false)}><Plus className="h-4 w-4" aria-hidden /> Add drop</button>
          <button type="button" className="live-set-commit" onClick={() => addDropStage(true)}><Check className="h-4 w-4" /> Finish drop set</button>
        </div>
        : <button type="button" className="live-set-commit" onClick={completeActiveSet}>
          <Check className="h-4 w-4" /> Log set {position.setIndex + 1}
        </button>}
      {dropMode && dropProblem && <p className="live-drop-problem" role="alert">{dropProblem}</p>}
      {dropMode && !dropProblem && dropNote && <p className="live-drop-note" role="status">{dropNote}</p>}
      {/* Secondary by design: the dominant action is logging the set. Skipping
          is the escape hatch for the rack being taken or time running out. */}
      <div className="live-set-secondary">
        <button type="button" className="live-set-skip live-set-swap" onClick={() => setSwapForId(activeExercise.id)}>
          <ArrowLeftRight className="h-4 w-4" /> Swap exercise
        </button>
        <button type="button" className="live-set-skip" onClick={skipActiveExercise}>
          <SkipForward className="h-4 w-4" /> Skip {activeExercise.exerciseName}
        </button>
      </div>
      {/* What follows, as quiet supporting information: the athlete can rack the
          next station during the rest without opening the full session. */}
      {nextExerciseName && <p className="live-set-next">Next · {nextExerciseName}</p>}
    </div> : <div className="live-set-card live-set-card-done">
      <p className="metric-label">Workout complete</p>
      <h4>Every planned set is logged.</h4>
      {/* The summary of what Finish will record, in the same lines Progress shows. */}
      <ul className="live-done-summary">
        {activeSession.exercises.filter((exercise) => exercise.sets.some(isCompletedSet)).map((exercise) => {
          const convention = loadConventionFor(catalogFor(exercise)?.id);
          const note = swapNote(exercise);
          return <li key={exercise.id}>
            <strong>{exercise.exerciseName}</strong>
            {note && <small>{note}</small>}
            <ol>{exercise.sets.filter(isCompletedSet).map((set, index) => {
              const unit = setWeightUnit(set, activeSession, sessionUnit);
              const volume = set.type === "drop" && (set.stages?.length ?? 0) >= 2 ? setVolume(set, unit, convention, sessionUnit) : null;
              return <li key={set.id ?? index}>{performedSetLine(set, unit, convention)}{set.type === "drop" && (set.stages?.length ?? 0) >= 2 && <small>{dropSetSummary(set)}{volume ? ` · ${volumeText(volume)}` : ""}</small>}</li>;
            })}</ol>
          </li>;
        })}
      </ul>
      {/* Now the dominant action: nothing is left to log, so finishing is the
          one thing this card is for, and the button is here rather than a scroll
          away at the top. */}
      <button type="button" className="live-session-finish live-session-finish-primary" onClick={finish}>
        <Save className="h-4 w-4" /> Finish workout · add {completed} {completed === 1 ? "set" : "sets"} to Progress
      </button>
    </div>}

    {/* Persistent and adjustable, but its own row below the logging zone: the
        glance contract forbids a timer control sitting beside reps, load, or
        completion as a competing tap target. Persistent while there is a next
        set to rest for - once every set is logged it counted down to nothing,
        beside a finish button, so it goes with the last set. */}
    {activeExercise && activeSet && <div className={`live-rest-row ${restComplete ? "live-rest-row-done" : ""}`}>
      <span className="live-rest-clock"><Timer className="h-4 w-4" aria-hidden />{resting ? clockFor(restRemaining) : clockFor(activeSession.restSeconds || DEFAULT_REST_SECONDS)}</span>
      <span className="live-rest-state" aria-live="polite">{resting ? "Resting" : restComplete ? "Rest complete" : "Rest length"}</span>
      <span className="live-rest-controls">
        <button type="button" onClick={() => adjustRest(-REST_STEP_SECONDS)} aria-label={`Shorten rest by ${REST_STEP_SECONDS} seconds`}>−{REST_STEP_SECONDS}s</button>
        <button type="button" onClick={() => adjustRest(REST_STEP_SECONDS)} aria-label={`Lengthen rest by ${REST_STEP_SECONDS} seconds`}>+{REST_STEP_SECONDS}s</button>
        {(resting || restComplete) && <button type="button" onClick={endRest} aria-label={restComplete ? "Clear the finished rest" : "End rest now"}>{restComplete ? "Clear" : "Skip"}</button>}
      </span>
    </div>}

    {/* The full workout list, memoised on the session: the rest clock ticks once a
        second and must not redraw every set row to do it (PERF-06). */}
    {queue}

    {/* Cutting a session short. Below the queue and set quietly, because it is
        the rare exit, not the next step; it says what it will keep so the tap
        is a decision rather than a guess. */}
    {activeExercise && activeSet && !confirmingFinish && <button type="button" className="live-session-finish" onClick={requestFinishEarly}>
      Finish workout early<small>{completed ? ` · keeps the ${completed} logged ${completed === 1 ? "set" : "sets"}` : " · nothing logged yet"}</small>
    </button>}
    {activeExercise && activeSet && confirmingFinish && (() => {
      const open = activeSession.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => !set.completed && !set.skipped).length, 0);
      return <div className="live-finish-confirm" role="group" aria-labelledby="live-finish-confirm-title">
        <p id="live-finish-confirm-title"><strong>Finish now?</strong> {completed ? `The ${completed} logged ${completed === 1 ? "set is" : "sets are"} saved. ` : "Nothing is logged yet, so nothing will be recorded. "}{open} planned {open === 1 ? "set stays" : "sets stay"} not done{drafts ? `, and ${drafts} typed but not logged ${drafts === 1 ? "is" : "are"} left out` : ""}.</p>
        <div>
          <button type="button" className="live-finish-confirm-go" onClick={() => { setConfirmingFinish(false); finish(); }}>Finish now</button>
          {/* The safe choice holds focus, as in every confirmation here; Keep going hands it back to the set. */}
          <button type="button" ref={(node) => node?.focus({ preventScroll: true })} onClick={() => { setConfirmingFinish(false); requestAnimationFrame(() => document.querySelector<HTMLElement>(".live-set-commit")?.focus({ preventScroll: true })); }}>Keep going</button>
        </div>
      </div>;
    })()}

    {swapExercise && <ExerciseSwapSheet
      exercise={swapExercise}
      catalogEntry={catalogFor(swapExercise)}
      catalog={exerciseCatalog}
      assessment={assessSwap(swapExercise)}
      inWorkout={new Set(activeSession.exercises.map((exercise) => exercise.exerciseName))}
      lastLoggedFor={lastLoggedText}
      planOptionFor={planOptionFor(swapExercise)}
      onConfirm={(choice) => confirmSwap(swapExercise.id, choice)}
      onAdd={(target) => addAfterExercise(swapExercise.id, target)}
      onClose={() => setSwapForId(null)}
    />}
  </section>;
}
