import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, Check, ChevronRight, Layers, Play, Plus, Save, Settings, SkipForward, SlidersHorizontal, Timer, Undo2, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings, TrainingGoal } from "@/lib/workoutPlanner";
import { prescriptionOf } from "@/lib/specialization/planBouts";
import { WarmupPanel } from "@/components/WarmupPanel";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { exercisePhotoSet } from "@/lib/exercisePhotos";
import {
  activePosition, carriedEntryFor, countCompletedSets, countPlannedSets, finalizeSession, freshId, hasArmLoads, newSetId,
  deviceWorkoutHistoryKey, isCompletedSet, isCompletedWorkout, isDraftSet, isDropInProgress, isExerciseSkipped, lastCompletedSetFor, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, setWeightUnit, skipExercise,
  unknownSetFields, unskipExercise, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession, type StrapsUsed,
} from "@/lib/deviceWorkoutLog";
import {
  declaresLoadBasis, headDirectionActionOf, headDirectionPrompt, headDirectionWords, isLoadUnmeasured, isPlatesPerArm, MANUAL_RESISTANCE_LINE, normalizeSetup,
  setupFieldSpecs, setupNumberText, smithLoadBasisOf, type ExerciseSetup, type HeadDirection,
} from "@/lib/exerciseLogging";
import type { SetupField } from "@/lib/exerciseExecution";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import type { Limb } from "@shared/specialization/types";
import { noLoggerGates, type LoggerGates } from "@/lib/specialization/loggerGates";
import { addAfter, applySwap, assessSwap, canUndoSwap, catalogIdOf, rowsLimbOf, swapNote, undoSwap, type SwapReceipt, type SwapTarget } from "@/lib/workoutSwap";
import { dropSetLine, dropSetSummary, newStageId, performedSetLine, setVolume, stageLoadText, stageNote, stageProblem, volumeText } from "@/lib/dropSets";
import { loadConventionFor } from "@shared/loadConventions";
import { SetEffortChoice } from "@/components/SetEffortChoice";
import { ExerciseSwapSheet, type ExerciseSwapChoice, type SwapPlanOption } from "@/components/ExerciseSwapSheet";
import { ExerciseHistoryList } from "@/components/ExerciseHistoryList";
import { ExerciseSetupDisclosure } from "@/components/ExerciseSetupDisclosure";
import { exerciseHistoryCount, legSideLabel, sideLabel } from "@/lib/sessionRecap";
import { WorkoutSessionDetail } from "@/components/WorkoutSessionDetail";
import { startOfTrainingWeek } from "@/lib/trainingWeekSummary";
import { currentBodyWeightKg, loadBodyWeightLog } from "@/lib/bodyWeightLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { isHoldEntry, setEntryFieldsFor, type SetEntryMeasure } from "@/lib/setEntryFields";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { renderableSetCount, repsForSet } from "@/lib/setPrescription";
import { toast } from "sonner";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";
import { decimalEntryText } from "@/lib/numericEntry";
import "../set-side.css";
import "../exercise-setup.css";

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

/**
 * One plan entry as the workout reads it: its prescription. A planned set is one row, whatever the
 * exercise: both sides are counted as one (owner, 20 Oct 2026), so a one-side set is not laid out
 * per side, and the logged week matches the planned week (planBouts.ts counts it as one bout).
 */
type PlannedEntry = { prescription: string };

/**
 * "Left", "Right", "Both arms" or "Both legs": the side a set already holds, on the limb its
 * exercise is sided by. Only a set logged before 20 Oct 2026, or a row of a workout left open from
 * then (built per side), holds one; nothing asks for one now.
 */
function sideWordsOf(set: DeviceSetLog, limb: Limb): string | null {
  return limb === "arm" ? sideLabel(set.side) : legSideLabel(set.legSide);
}

/** The two directions a set of a lateral flexion or rotation exercise can be done to, in reading order. */
const HEAD_DIRECTIONS: readonly HeadDirection[] = ["left", "right"];

function makeSession(workout: Exercise[], plannedFor: (exercise: Exercise, index: number) => PlannedEntry, dayLabel: string, restSeconds: number, weightUnit: DisplayWeightUnit): DeviceWorkoutSession {
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
      // The saved prescription, else the default for this place in the day, the same one the Plan
      // shows (TR-05): the goal's for a rep exercise, a hold's for one measured in seconds.
      const { prescription: plannedPrescription } = plannedFor(exercise, index);
      const plannedSets = renderableSetCount(plannedPrescription);
      return {
        id: `${exercise.id}-${index}`,
        exerciseName: exercise.name,
        // The catalog identity the logged sets keep, whatever the catalog later calls it. A
        // duplicated plan entry has an id of its own and names its catalog exercise separately.
        catalogId: catalogIdOf(exercise),
        plannedPrescription,
        // Each set has its id from the start, so it can be referred to as itself, not by position.
        sets: Array.from({ length: plannedSets }, () => ({ id: newSetId(), weight: "", reps: "", completed: false })),
      };
    }),
  };
}

/** Whole seconds, at least 1: what a hold needs before it can be logged. */
const holdSecondsReady = (value: string | undefined) => /^\d+$/.test((value ?? "").trim()) && Number(value) >= 1;

/**
 * These are text inputs, not type="number", so the athlete keeps what they
 * typed. A controlled type="number" reports value="" for anything not yet a
 * valid number — "2." while reaching for 2.5 — which wipes the keystroke on the
 * next render. Filtering the characters ourselves keeps the decimal keypad and
 * the half-typed value. A set card's boxes are the load, the height and the dose,
 * and, on a plate-loaded press with its arms loaded differently, each arm's plates.
 */
type EntryField = SetEntryMeasure | "reps" | "leftLoad" | "rightLoad";

/** Where a box's value is stored on the set: the Seconds box writes `holdSeconds`. */
const setKeyOf = (field: EntryField): "weight" | "height" | "reps" | "holdSeconds" | "leftLoad" | "rightLoad" => (field === "seconds" ? "holdSeconds" : field);

function sanitiseEntry(field: EntryField, value: string) {
  // Reps and hold seconds are whole numbers; a load may be a decimal.
  if (field === "reps" || field === "seconds") return value.replace(/[^0-9]/g, "").slice(0, 4);
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

export function DeviceWorkoutTracker({ workout, prescriptions, settings, goal, dayLabel, weightUnit = "lb", onEditInPlan, onReviewDay, onInspect, onOpenProgress, onOpenSession, onOpenHome, daySwitch, onReplaceInPlan, loggerGates = noLoggerGates }: {
  workout: Exercise[];
  /**
   * What the athlete's targets switch on, per exercise (lib/specialization/loggerGates.ts, built
   * by Home from the athlete's goals):
   * - "Straps · Used / Not used" on an exercise whose grip credit depends on a bare hand, only for
   *   an athlete with an active target in a region with such a mapping of it (02-design.md §6);
   * - a planned set of an exercise done one arm, or one leg, at a time laid out as two rows, Right
   *   then Left, when a workout starts: "3 × 12" is three sets for each side, which is how the
   *   atlas counts the plan (planBouts), for an athlete with an active target in a region that
   *   maps it.
   * Without gates (the default), every set card and every workout is built as before, and an
   * exercise done with both sides, or either, is never split.
   */
  loggerGates?: LoggerGates;
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
  /**
   * What the atlas asks of this exercise (shared/specialization/loggingPolicy): seconds instead of
   * reps, which arm, straps. An exercise the atlas does not map asks nothing new.
   */
  const policyFor = (exercise: Pick<DeviceWorkoutExercise, "catalogId" | "exerciseName">) => loggingPolicyFor(exercise.catalogId ?? catalogFor(exercise)?.id);
  /** The catalog id a session exercise is read by: the one it kept, else its name's. */
  const catalogIdIn = (exercise: Pick<DeviceWorkoutExercise, "catalogId" | "exerciseName">) => exercise.catalogId ?? catalogFor(exercise)?.id;
  /**
   * The prescription as this release reads it. A workout started before the release keeps the
   * goal's rep default it was built with ("3 × 6–10") on a hold; read through the same
   * `prescriptionOf` a new session is built with, that is "3 × 30 sec", and athlete text stays as
   * typed. Nothing stored is rewritten.
   */
  const shownPrescription = (exercise: DeviceWorkoutExercise) => (exercise.plannedPrescription ? prescriptionOf(exercise.plannedPrescription, 0, goal, policyFor(exercise).measure, catalogIdIn(exercise)) : exercise.plannedPrescription);
  /**
   * A set typed in but not logged. On an exercise measured in seconds there is no Reps box, so
   * reps typed before it was (a workout left open across the release) are not a draft the
   * athlete could see or finish; the stored set keeps them.
   */
  const isTypedDraft = (exercise: DeviceWorkoutExercise, set: DeviceSetLog) => (policyFor(exercise).measure === "seconds"
    ? !set.completed && !set.skipped && Boolean(set.weight.trim() || (set.height || "").trim() || (set.holdSeconds || "").trim())
    : isDraftSet(set));
  /**
   * A plan entry as the workout is built from it, read once for the prestart counts, the rows and
   * the session: its saved prescription, else the default for its place (a hold's default on an
   * exercise measured in seconds, through the same `prescriptionOf` the atlas reads the plan with).
   */
  const plannedFor = (exercise: Exercise, index: number): PlannedEntry => {
    const policy = policyFor({ catalogId: catalogIdOf(exercise), exerciseName: exercise.name });
    return { prescription: prescriptionOf(prescriptions[exercise.id], index, goal, policy.measure, catalogIdOf(exercise)) };
  };
  /** The limb a session exercise's sides are recorded on: the arm when it records none. */
  const limbOf = (exercise: Pick<DeviceWorkoutExercise, "catalogId" | "exerciseName">): Limb => policyFor(exercise).sideLimb ?? "arm";
  /**
   * The limb a session exercise's rows name their sides on: for rows laid out per side, the limb
   * they were built on (`rowsLimbOf`: a workout left open across a release can hold rows built per
   * leg on an exercise this release does not know), else the exercise's own.
   */
  const rowLimbOf = (exercise: DeviceWorkoutExercise): Limb => rowsLimbOf(exercise) ?? limbOf(exercise);
  /**
   * The plan entry a session exercise was built from, in the day open in the plan: its own, or,
   * for one swapped in, the one it took the place of. -1 when there is none, or when this
   * workout is from another day.
   */
  const planSlotOf = (from: DeviceWorkoutExercise) => {
    if ((activeSessionRef.current ?? activeSession)?.dayLabel !== dayLabel) return -1;
    const ids = [from.catalogId ?? catalogFor(from)?.id, from.swappedFrom?.catalogId].filter((id): id is number => id !== undefined);
    for (const id of ids) {
      const slot = workout.findIndex((item) => catalogIdOf(item) === id);
      if (slot >= 0) return slot;
    }
    return -1;
  };
  /**
   * An exercise swapped in or added mid-workout is built the way a planned one is (lib/workoutSwap):
   * one row per planned set, starting from the sets and reps it takes over, read by its own measure. Both ways round, so the incoming exercise reads what the plan entry says
   * as `planOptionFor` reads it: a goal's rep default pinned on the plan entry (or none) is a
   * hold's "4 × 30 sec" for a hold coming in, and, where `from` still holds what its plan entry
   * gave it, a hold's default is the goal's reps again ("4 × 3–6") for a rep exercise coming in,
   * never "30 sec" on a rep exercise. Text the athlete wrote is kept as written.
   */
  const incomingFor = (target: SwapTarget, from: DeviceWorkoutExercise) => {
    const policy = policyFor({ catalogId: target.id, exerciseName: target.name });
    const slot = planSlotOf(from);
    const saved = slot >= 0 ? prescriptions[workout[slot].id] : undefined;
    const fromPlan = slot >= 0 && prescriptionOf(saved, slot, goal, policyFor(from).measure, catalogIdIn(from)) === from.plannedPrescription;
    return { prescription: fromPlan ? prescriptionOf(saved, slot, goal, policy.measure, target.id) : prescriptionOf(from.plannedPrescription, 0, goal, policy.measure, target.id) };
  };
  const completed = useMemo(() => (activeSession ? countCompletedSets(activeSession) : 0), [activeSession]);
  const planned = useMemo(() => (activeSession ? countPlannedSets(activeSession) : 0), [activeSession]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const drafts = useMemo(() => (activeSession ? activeSession.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => isTypedDraft(exercise, set)).length, 0) : 0), [activeSession]);
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
    const stored = set[setKeyOf(field)] || "";
    if (touchedEntries[entryKey(field)]) return stored;
    // A drop's next stage starts empty: the last set's load is exactly what it is not.
    if (isDropInProgress(set)) return stored;
    return stored || carried?.[field] || "";
  };
  const shownEntries: Record<EntryField, string> = {
    weight: shownEntry("weight"),
    height: shownEntry("height"),
    reps: shownEntry("reps"),
    seconds: shownEntry("seconds"),
    leftLoad: shownEntry("leftLoad"),
    rightLoad: shownEntry("rightLoad"),
  };
  /** True while a field shows the carried value rather than something typed or stored for this set. */
  const isCarried = (field: EntryField) => {
    if (!activeSession || !position || touchedEntries[entryKey(field)]) return false;
    const set = activeSession.exercises[position.exerciseIndex].sets[position.setIndex];
    return !isDropInProgress(set) && !set[setKeyOf(field)] && Boolean(carried?.[field]);
  };

  /**
   * A box jump has a box height, not a weight; a weighted box jump has both.
   * The boxes on screen come from the catalog entry behind the session, so each
   * one names exactly what it records.
   */
  const entryFieldsFor = (exercise: DeviceWorkoutExercise) => setEntryFieldsFor(catalogFor(exercise), sessionUnit, policyFor(exercise).measure, exercise.setup);
  const activeEntryFields = activeSession && position
    ? entryFieldsFor(activeSession.exercises[position.exerciseIndex])
    : setEntryFieldsFor(undefined, sessionUnit);
  /** A hold: the dose is seconds, typed in the last box, and the set has no reps box. */
  const activeHold = isHoldEntry(activeEntryFields);
  /** The boxes before the dose box: the load and, on a box jump, the height. */
  const activeLoadFields = activeEntryFields.filter((field) => field.measure !== "seconds");
  const activeEntryExercise = activeSession && position ? activeSession.exercises[position.exerciseIndex] : null;
  const activeEntrySet = activeEntryExercise && position ? activeEntryExercise.sets[position.setIndex] : null;
  /**
   * The way the head goes on this set, on a lateral flexion or rotation exercise (handoff §3.2):
   * the one chosen on this set, else the one the last set of this exercise in this workout was
   * logged with, shown chosen, so the choice carries to the next set and is always in view on the
   * current one. None before the first set: the athlete picks Left or Right, and the set logs only
   * then. Never an arm, never both: one set is one direction.
   */
  const activeDirected = Boolean(activeEntryExercise && headDirectionActionOf(catalogIdIn(activeEntryExercise)));
  const shownDirection: HeadDirection | null = !activeDirected || !activeEntrySet ? null : activeEntrySet.headDirection ?? (carried?.source === "session" ? carried.headDirection ?? null : null);
  const directionMissing = activeDirected && !shownDirection;
  /** A plate-loaded press with each arm's plates typed apart ("Arms loaded differently"). */
  const activeArmLoads = Boolean(activeEntrySet && hasArmLoads(activeEntrySet));

  const editEntry = (field: EntryField, value: string) => {
    if (!activeSession || !position) return;
    setTouchedEntries((current) => ({ ...current, [entryKey(field)]: true }));
    updateSet(activeSession.exercises[position.exerciseIndex].id, position.setIndex, { [setKeyOf(field)]: sanitiseEntry(field, value) });
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
      persist(makeSession(workout, plannedFor, dayLabel, startRestSeconds, weightUnit));
    } finally {
      starting.current = false;
    }
  };

  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DeviceWorkoutSession["exercises"][number]["sets"][number]>) => {
    commit((session) => {
      // Writing a weight, or an arm's load, writes the unit it was typed in with it.
      const stamp = "weight" in patch || "leftLoad" in patch || "rightLoad" in patch ? { unit: session.weightUnit ?? weightUnit } : {};
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
    const hold = activeHold;
    // A hold is its seconds: without whole seconds of at least 1 there is nothing to log yet, and
    // the card says so beside the button (02-design.md §6, "a set completes with seconds").
    if (hold && !holdSecondsReady(shownEntries.seconds)) return;
    // A set of a lateral flexion or rotation exercise is logged with the way the head went, or not yet.
    if (directionMissing) return;
    const direction = shownDirection;
    const armLoads = activeArmLoads;
    commit((session) => ({
      ...session,
      restEndsAt: new Date(Date.now() + (session.restSeconds || DEFAULT_REST_SECONDS) * 1000).toISOString(),
      exercises: session.exercises.map((item, exerciseIndex) => {
        if (exerciseIndex !== position.exerciseIndex) return item;
        // A Smith machine's number is the plates alone unless the athlete said otherwise: said once, explicitly.
        const setup = declaresLoadBasis(catalogIdIn(item)) && !smithLoadBasisOf(item.setup) ? { ...item.setup, load_convention: "plates_only" } : item.setup;
        return { ...item, ...(setup ? { setup } : {}), sets: item.sets.map((set, setIndex) => {
          // The next set starts with its arms apart too, when this one had them apart: the boxes offer this set's plates.
          if (armLoads && setIndex === position.setIndex + 1 && !set.completed && !set.skipped && !set.weight.trim() && !hasArmLoads(set)) return { ...set, leftLoad: "", rightLoad: "" };
          if (setIndex !== position.setIndex) return set;
          return {
            // What this release does not understand stays as stored (a later release's field).
            ...unknownSetFields(set),
            // The set keeps the id it was created with.
            ...(set.id ? { id: set.id } : {}),
            // What you see in the box is what gets logged, including a field
            // the athlete deliberately emptied. Arms loaded differently keep a load each, and no total.
            weight: armLoads ? "" : shownEntries.weight,
            ...(armLoads ? { leftLoad: shownEntries.leftLoad, rightLoad: shownEntries.rightLoad } : {}),
            unit: sessionUnit,
            height: shownEntries.height,
            // A hold is logged in seconds and has no reps box, so it records no reps.
            reps: hold ? "" : shownEntries.reps,
            ...(hold ? { holdSeconds: String(Number(shownEntries.seconds)) } : {}),
            completed: true,
            // How hard it was taken, when said before logging (shared/setEffort.ts).
            ...(set.effort ? { effort: set.effort } : {}),
            // No side is asked (both sides as one, 20 Oct 2026); a side the row already holds is kept.
            ...(set.side ? { side: set.side } : {}),
            ...(set.legSide ? { legSide: set.legSide } : {}),
            ...(set.warmup ? { warmup: true } : {}),
            // The way the head went, shown on the card when the set was logged.
            ...(direction ? { headDirection: direction } : {}),
          };
        }) };
      }),
    }));
  };


  /**
   * Straps on this exercise in this workout. Tapping the choice already made takes it back to
   * "not recorded", which is different from "not used".
   */
  const chooseStraps = (exerciseId: string, straps: StrapsUsed) => {
    commit((session) => ({
      ...session,
      exercises: session.exercises.map((item) => {
        if (item.id !== exerciseId) return item;
        if (item.straps === straps) { const { straps: _cleared, ...rest } = item; return rest; }
        return { ...item, straps };
      }),
    }));
  };

  /** The way the head goes on the active set: chosen on the card, kept until another is chosen. */
  const chooseDirection = (direction: HeadDirection) => {
    if (!activeSession || !position) return;
    updateSet(activeSession.exercises[position.exerciseIndex].id, position.setIndex, { headDirection: direction });
  };

  /** The way the head went on a set in the full workout list: to log it there, or to correct a logged one. */
  const chooseRowDirection = (exerciseId: string, setIndex: number, direction: HeadDirection) => updateSet(exerciseId, setIndex, { headDirection: direction });

  /**
   * "Arms loaded differently" on a plate-loaded press: the set takes a load per arm, typed apart and
   * kept apart. Turned on, both arms start empty, never copied from one number; turned off, the
   * single per-arm box is back with what was in it.
   */
  const setArmLoads = (on: boolean) => {
    if (!activeSession || !position) return;
    updateSet(activeSession.exercises[position.exerciseIndex].id, position.setIndex, on ? { leftLoad: "", rightLoad: "" } : { leftLoad: undefined, rightLoad: undefined });
  };

  /** One setup value of a session exercise, as typed; an emptied one is removed, and so is a setup left empty. */
  const updateSetup = (exerciseId: string, field: SetupField, raw: string) => {
    const value = setupFieldSpecs[field].kind === "number" ? setupNumberText(raw) : raw.slice(0, 80);
    commit((session) => ({
      ...session,
      exercises: session.exercises.map((item) => {
        if (item.id !== exerciseId) return item;
        const setup: ExerciseSetup = { ...item.setup, [field]: value };
        if (!value) delete setup[field];
        if (Object.keys(setup).length) return { ...item, setup };
        const { setup: _cleared, ...rest } = item;
        return rest;
      }),
    }));
  };

  /**
   * The setup this exercise was last done with in a finished workout on this device, when it is
   * not already this workout's: offered as "Same as last time", reused only when tapped.
   */
  const lastSetupFor = (exercise: DeviceWorkoutExercise): ExerciseSetup | null => {
    const id = catalogIdIn(exercise);
    if (id === undefined) return null;
    const finished = history
      .filter((session) => session.status === "completed" && session.id !== activeSession?.id)
      .sort((a, b) => String(b.completedAt || b.startedAt).localeCompare(String(a.completedAt || a.startedAt)));
    for (const session of finished) {
      const match = session.exercises.find((item) => catalogIdIn(item) === id && item.setup && item.sets.some(isCompletedSet));
      const last = normalizeSetup(match?.setup);
      if (last) return JSON.stringify(last) === JSON.stringify(normalizeSetup(exercise.setup)) ? null : last;
    }
    return null;
  };

  /** "Same as last time": the last workout's setup becomes this exercise's, every field of it. */
  const repeatSetup = (exerciseId: string, setup: ExerciseSetup) => {
    commit((session) => ({ ...session, exercises: session.exercises.map((item) => (item.id === exerciseId ? { ...item, setup: { ...setup } } : item)) }));
    toast("Setup copied from last time", { id: `setup-repeat-${exerciseId}`, description: "Change any value in Setup if this workout's differs." });
  };

  /**
   * One logged set as the records show it, with what these rows add: the head's direction first
   * ("Right · 20 s"), and the plates on one arm said as such ("40 kg per arm × 8").
   */
  const setLineOf = (exercise: Pick<DeviceWorkoutExercise, "catalogId" | "exerciseName">, set: DeviceSetLog, unit: DisplayWeightUnit) => {
    const id = catalogIdIn(exercise);
    const line = performedSetLine(set, unit, loadConventionFor(id), { perArm: isPlatesPerArm(id) });
    return headDirectionActionOf(id) && set.headDirection ? `${headDirectionWords[set.headDirection]} · ${line}` : line;
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
    // A hold with no seconds yet stays open, keyboard up, on the box the card asks to fill; so does a set with no direction yet.
    if (activeHold && !holdSecondsReady(shownEntries.seconds)) return;
    if (directionMissing) return;
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
  /** "Add exercise": the sheet opened to add straight after this session exercise. */
  const [addAfterId, setAddAfterId] = useState<string | null>(null);
  /** The workout just finished, shown as its saved recap until the athlete is done with it. */
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const swapping = useRef(false);
  const dayNameOf = (label: string) => label.split(" · ").map((part) => part.trim()).filter(Boolean).pop() || label;

  /** The candidate's own last logged set on this device - never the exercise it replaces. */
  const lastLoggedText = (exercise: Exercise) => {
    const last = lastCompletedSetFor({ exerciseName: exercise.name, catalogId: exercise.id }, history, sessionUnit);
    return last ? setLineOf({ exerciseName: exercise.name, catalogId: exercise.id }, last, last.unit ?? sessionUnit) : null;
  };

  /** Whether the plan's open day can take the same swap, and exactly which slot it changes. */
  const planOptionFor = (from: DeviceWorkoutExercise) => (target: Exercise): SwapPlanOption | null => {
    if (!onReplaceInPlan || !activeSession) return null;
    if (activeSession.dayLabel !== dayLabel) return { available: false, reason: "this workout is from a different day than the one open in your plan." };
    const fromEntry = catalogFor(from);
    const slot = fromEntry ? workout.findIndex((item) => catalogIdOf(item) === fromEntry.id) : -1;
    if (!fromEntry || slot < 0) return { available: false, reason: `${from.exerciseName} isn't in this day of your plan.` };
    if (workout.some((item) => catalogIdOf(item) === target.id)) return { available: false, reason: `${target.name} is already in this day of your plan.` };
    // What the slot's sets and reps will read as for the exercise coming in: a hold's pinned rep
    // default is a hold default only while a hold holds the slot, and back to reps for a rep exercise.
    const prescription = prescriptionOf(prescriptions[workout[slot].id], slot, goal, policyFor({ catalogId: target.id, exerciseName: target.name }).measure, target.id);
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
        const original = session.exercises.find((exercise) => exercise.id === exerciseId);
        const target = { name: choice.target.name, id: choice.target.id };
        const incoming = original ? incomingFor(target, original) : null;
        const result = applySwap(session, exerciseId, target, {
          swapId, newExerciseId: freshId(String(choice.target.id)), at: new Date().toISOString(), draft: choice.draft, partialDrop: choice.partialDrop, newSetId,
          measureOf: (item) => policyFor({ catalogId: item.id, exerciseName: item.name }).measure,
          sideLimbOf: (item) => policyFor({ catalogId: item.id, exerciseName: item.name }).sideLimb,
          ...(incoming ? { prescription: incoming.prescription } : {}),
        }, exerciseCatalog);
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
      // Where the rows it replaced were laid out per side (a workout left open from before 20 Oct
      // 2026), the count the new exercise got, one row per planned set, as the sheet said it.
      const rows = receipt.replacement.sets.length;
      const count = receipt.before.perArm ? `${rows} ${rows === 1 ? "set" : "sets"}` : "";
      toast(`Swapped to ${choice.target.name}`, {
        id: `swap-${swapId}`,
        description: `${kept ? `Your ${kept} logged ${kept === 1 ? "set stays" : "sets stay"} with ${fromName}.${count ? ` ${choice.target.name} has ${count}.` : ""}` : `${choice.target.name} takes ${fromName}'s place${count ? ` with ${count}` : ""}.`}${planLine}`,
        action: { label: "Undo", onClick: () => undoSwapFrom(receipt, revertPlan) },
      });
    } finally {
      swapping.current = false;
    }
  };

  const addAfterExercise = (exerciseId: string, target: Exercise) => {
    const anchor = activeSessionRef.current?.exercises.find((exercise) => exercise.id === exerciseId);
    const newExerciseId = freshId(String(target.id));
    const incoming = anchor ? incomingFor({ name: target.name, id: target.id }, anchor) : null;
    commit((session) => addAfter(session, exerciseId, { name: target.name, id: target.id }, { newExerciseId, at: new Date().toISOString(), newSetId, ...(incoming ? { prescription: incoming.prescription } : {}) }));
    setSwapForId(null);
    setAddAfterId(null);
    focusNextLogAction();
    toast(`Added ${target.name}`, {
      id: `add-${newExerciseId}`,
      description: `After ${anchor?.exerciseName ?? "the last exercise"}, starting from ${incoming && anchor && incoming.prescription !== anchor.plannedPrescription ? incoming.prescription : "the same sets and reps"}.`,
      // Taken back while nothing is logged or typed on it; after that, Remove in the full workout.
      action: { label: "Undo", onClick: () => commit((session) => {
        const added = session.exercises.find((exercise) => exercise.id === newExerciseId);
        return added && !added.sets.some((set) => set.completed || isDraftSet(set)) ? { ...session, exercises: session.exercises.filter((exercise) => exercise.id !== newExerciseId) } : session;
      }) },
    });
  };

  /**
   * Takes an exercise out of this workout - one added by mistake, or one that will not happen - with
   * whatever it holds. The message says what went with it, and its Undo puts it back where it was.
   * An exercise in a swap stays: the other half of the swap refers to it. The last exercise stays
   * too; a workout with nothing in it is finished, not emptied.
   */
  const removeFromWorkout = (exerciseId: string) => {
    const current = activeSessionRef.current;
    if (!current) return;
    const index = current.exercises.findIndex((exercise) => exercise.id === exerciseId);
    if (index < 0 || current.exercises.length < 2) return;
    const removed = current.exercises[index];
    if (removed.swappedFrom || removed.replacedBy) return;
    commit((session) => ({ ...session, exercises: session.exercises.filter((exercise) => exercise.id !== exerciseId) }));
    const logged = removed.sets.filter(isCompletedSet).length;
    toast(`Removed ${removed.exerciseName}`, {
      id: `remove-${exerciseId}`,
      description: logged ? `Its ${logged} logged ${logged === 1 ? "set went" : "sets went"} with it.` : "Nothing was logged for it.",
      action: { label: "Undo", onClick: () => commit((session) => session.exercises.some((exercise) => exercise.id === exerciseId) ? session : {
        ...session,
        exercises: [...session.exercises.slice(0, index), removed, ...session.exercises.slice(index)],
      }) },
    });
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
    // A drop set starts from its own stages, never from those of a set type a later release added.
    // A drop set's stages hold one load each, so a set with its arms apart becomes one per-arm load again.
    updateSet(exercise.id, position.setIndex, type === "drop" ? { type: "drop", id: set.id ?? freshId("set"), stages: set.type === "drop" ? set.stages ?? [] : [], leftLoad: undefined, rightLoad: undefined } : { type: undefined, stages: undefined });
  };

  const forgetTouched = () => setTouchedEntries((current) => {
    const next = { ...current };
    for (const field of ["weight", "reps", "height", "seconds", "leftLoad", "rightLoad"] as const) delete next[entryKey(field)];
    return next;
  });

  const addDropStage = (finish: boolean) => {
    if (!activeSession || !position) return;
    const exercise = activeSession.exercises[position.exerciseIndex];
    const set = exercise.sets[position.setIndex];
    const stages = set.stages ?? [];
    const setId = set.id ?? freshId("set");
    // A drop set on a lateral flexion or rotation exercise is one set, done to one side.
    if (directionMissing) { setDropProblem("Choose Left or Right for this set first."); return; }
    const direction = shownDirection ? { headDirection: shownDirection } : {};
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
      exercises: session.exercises.map((item) => {
        if (item.id !== exercise.id) return item;
        return {
          ...item,
          sets: item.sets.map((entry, index): DeviceSetLog => {
            if (index !== position.setIndex) return entry;
            if (!finish) return { ...entry, ...direction, id: setId, type: "drop", stages: next, weight: "", reps: "", unit: sessionUnit };
            // A side the row already holds is kept with it, as on a standard set.
            return { ...entry, ...direction, id: setId, type: "drop", stages: next, weight: next[0].weight, reps: next[0].reps, unit: next[0].unit ?? sessionUnit, height: entry.height || "", completed: true };
          }),
        };
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

  /**
   * Un-logging a drop set reopens it with its stages, and empty boxes for another drop. A hold's
   * row logs only with its seconds in: the row says "Add the seconds" until then.
   */
  const toggleSetLogged = (exerciseId: string, setIndex: number, set: DeviceSetLog, hold = false, directed = false) => {
    if (!set.completed && hold && !holdSecondsReady(set.holdSeconds)) return;
    if (!set.completed && directed && !set.headDirection) return;
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
          // A hold's rows take seconds where other rows take reps.
          const queueHold = isHoldEntry(queueFields);
          const queueLoadFields = queueFields.filter((field) => field.measure !== "seconds");
          const exerciseSkipped = isExerciseSkipped(exercise);
          const catalogEntry = catalogFor(exercise);
          const convention = loadConventionFor(catalogEntry?.id);
          const note = swapNote(exercise);
          // A lateral flexion or rotation exercise: each row names the way the head went, and logs only with one.
          const directionPrompt = headDirectionPrompt(catalogIdIn(exercise));
          const perArm = isPlatesPerArm(catalogIdIn(exercise));
          // Drop sets are about load and reps; a hold has no reps to drop.
          const canDrop = !queueHold && queueFields.some((field) => field.measure === "weight") && !exercise.replacedBy;
          return <article key={exercise.id} className={`session-exercise ${exerciseSkipped ? "session-exercise-skipped" : ""} ${exercise.replacedBy ? "session-exercise-replaced" : ""}`}>
          <div className="exercise-media-dense">
            <span>{String(exerciseIndex + 1).padStart(2, "0")}</span>
            {/* The photograph confirms which exercise and variant this is; the catalog
                entry is found by the id the session was built with (or, for a session
                from before ids were kept, its name), and a name the catalog no longer
                has gets the placeholder frame rather than a guess. */}
            <ExerciseMedia exerciseId={catalogEntry?.id ?? -1} exerciseName={exercise.exerciseName} equipment={catalogEntry?.equipment} variant="thumb" />
            <div><strong>{exercise.exerciseName}</strong><small>{exerciseSkipped ? "Skipped · nothing recorded" : `${shownPrescription(exercise)}${exercise.perArm ? ` · each ${rowLimbOf(exercise)}` : ""}`}</small>{note && <small className="session-swap-note">{note}</small>}</div>
            {!exercise.replacedBy && <span className="session-exercise-actions">
              <button type="button" className="session-exercise-skip" onClick={() => setSwapForId(exercise.id)} aria-label={`Swap ${exercise.exerciseName}`}>
                <ArrowLeftRight className="h-3.5 w-3.5" /><span>Swap</span>
              </button>
              <button type="button" className="session-exercise-skip" onClick={() => toggleExerciseSkip(exerciseIndex)} aria-pressed={exerciseSkipped}>
                {exerciseSkipped ? <Undo2 className="h-3.5 w-3.5" /> : <SkipForward className="h-3.5 w-3.5" />}
                <span>{exerciseSkipped ? "Put back" : "Skip"}</span>
              </button>
              {!exercise.swappedFrom && activeSession.exercises.length > 1 && <button type="button" className="session-exercise-skip session-exercise-remove" onClick={() => removeFromWorkout(exercise.id)} aria-label={`Remove ${exercise.exerciseName} from this workout`}>
                <X className="h-3.5 w-3.5" /><span>Remove</span>
              </button>}
            </span>}
          </div>
          <div className="session-set-list">{exercise.sets.map((set, setIndex) => {
            // A drop set is one row: its stages in order, collapsed, with the set's totals under them.
            if (set.type === "drop" && (set.stages?.length ?? 0) > 0) {
              const unit = setWeightUnit(set, activeSession, sessionUnit);
              const volume = setVolume(set, unit, convention, sessionUnit, { perArm });
              const inProgress = isDropInProgress(set);
              return <div key={set.id ?? setIndex} className={`session-set-row session-set-drop ${set.completed ? "session-set-complete" : ""}`}>
                <strong>Set {setIndex + 1}{inProgress ? " · drop set, in progress" : ""}</strong>
                <p className="session-drop-line">{set.headDirection && directionPrompt ? `${headDirectionWords[set.headDirection]} · ` : ""}{dropSetLine(set, unit, convention, { perArm })}</p>
                <small className="session-drop-detail">{dropSetSummary(set)}{volume ? ` · ${volumeText(volume)}` : ""}</small>
                {set.completed && <button type="button" onClick={() => toggleSetLogged(exercise.id, setIndex, set)} aria-pressed={true} aria-label={`Undo set ${setIndex + 1}, drop set of ${exercise.exerciseName}`}>
                  <Undo2 className="h-3.5 w-3.5" /><span>Undo</span>
                </button>}
              </div>;
            }
            // A row laid out per side names its side before it is logged too: logging it here records that side.
            const side = set.completed || exercise.perArm ? sideWordsOf(set, rowLimbOf(exercise)) : null;
            // A hold's row logs only with its seconds in, and says so in the row.
            const secondsMissing = queueHold && !set.completed && !holdSecondsReady(set.holdSeconds);
            const directionMissingHere = Boolean(directionPrompt) && !set.completed && !set.headDirection;
            const hintId = `${exercise.id}-${setIndex}-seconds-hint`;
            const directionHintId = `${exercise.id}-${setIndex}-direction-hint`;
            // Arms loaded differently: each arm's plates in a box of its own, never one total.
            const rowLoadFields = hasArmLoads(set)
              ? [{ key: "leftLoad" as const, label: "Left arm", unit: sessionUnit }, { key: "rightLoad" as const, label: "Right arm", unit: sessionUnit }, ...queueLoadFields.filter((field) => field.measure !== "weight").map((field) => ({ key: field.measure, label: field.label, unit: field.unit }))]
              : queueLoadFields.map((field) => ({ key: field.measure as EntryField, label: field.label, unit: field.unit }));
            return <div key={set.id ?? setIndex} className={`session-set-row ${set.completed ? "session-set-complete" : ""} ${isTypedDraft(exercise, set) ? "session-set-draft" : ""} ${set.skipped ? "session-set-skipped" : ""}`}>
            <strong>Set {setIndex + 1}{side ? ` · ${side}` : ""}{isTypedDraft(exercise, set) ? " · typed, not logged" : ""}{set.skipped ? " · skipped" : ""}</strong>
            {directionPrompt && <div className="session-set-direction" role="group" aria-label={`${directionPrompt}, set ${setIndex + 1} of ${exercise.exerciseName}`}>
              <span aria-hidden="true">{directionPrompt}</span>
              {HEAD_DIRECTIONS.map((direction) => <button key={direction} type="button" aria-pressed={set.headDirection === direction} onClick={() => chooseRowDirection(exercise.id, setIndex, direction)}>{headDirectionWords[direction]}</button>)}
            </div>}
            {rowLoadFields.map((field) => <label key={field.key}>
              <span>{field.label}</span>
              <input value={set[setKeyOf(field.key)] || ""} inputMode="decimal" type="text" autoComplete="off" onChange={(event) => updateSet(exercise.id, setIndex, { [setKeyOf(field.key)]: sanitiseEntry(field.key, event.target.value) })} placeholder="—" />
              <em>{field.unit}</em>
            </label>)}
            {queueHold
              ? <label>
                <span>Seconds</span>
                <input value={set.holdSeconds || ""} inputMode="numeric" type="text" autoComplete="off" onChange={(event) => updateSet(exercise.id, setIndex, { holdSeconds: sanitiseEntry("seconds", event.target.value), reps: "" })} placeholder="—" />
              </label>
              : <label>
                <span>Reps</span>
                <input value={set.reps} inputMode="numeric" type="text" autoComplete="off" onChange={(event) => updateSet(exercise.id, setIndex, { reps: sanitiseEntry("reps", event.target.value) })} placeholder="—" />
              </label>}
            <button className="session-set-log" onClick={() => toggleSetLogged(exercise.id, setIndex, set, queueHold, Boolean(directionPrompt))} aria-pressed={set.completed} disabled={secondsMissing || directionMissingHere} aria-describedby={[secondsMissing ? hintId : "", directionMissingHere ? directionHintId : ""].filter(Boolean).join(" ") || undefined}>
              {set.completed ? <Undo2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              <span>{set.completed ? "Undo" : "Log set"}</span>
            </button>
            {directionMissingHere && <small className="session-set-dose-hint" id={directionHintId}>Choose Left or Right</small>}
            {secondsMissing && <small className="session-set-dose-hint" id={hintId}>Add the seconds</small>}
            {set.completed && canDrop && <button type="button" className="session-set-to-drop" onClick={() => convertToDropSet(exercise.id, setIndex)} aria-label={`Make set ${setIndex + 1} of ${exercise.exerciseName} a drop set`}>
              <Layers className="h-3.5 w-3.5" /><span>Make drop set</span>
            </button>}
            {set.completed && <SetEffortChoice variant="chip" exerciseName={exercise.exerciseName} catalogExerciseId={catalogEntry?.id} effort={set.effort}
              onChange={(effort) => updateSet(exercise.id, setIndex, { effort })} />}
          </div>; })}</div>
        </article>; })}</div>
        <button type="button" className="session-add-exercise" onClick={() => setAddAfterId(activeSession.exercises[activeSession.exercises.length - 1]?.id ?? null)}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add exercise
        </button>
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
    const entries = workout.map(plannedFor);
    // The sets the workout will hold, row for row: one row per planned set.
    const plannedSets = entries.reduce((total, entry) => total + renderableSetCount(entry.prescription), 0);
    const plannedText = (entry: PlannedEntry) => entry.prescription;
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
                <small>{plannedText(entries[index])}</small>
              </span>
              {onInspect && <ChevronRight className="h-5 w-5" aria-hidden />}
            </>;
            return <li key={exercise.id}>
              {onInspect
                ? <button type="button" className="session-prestart-row" onClick={() => onInspect(exercise)} aria-label={`${exercise.name}, ${plannedText(entries[index])}: open details`}>{row}</button>
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
  /** Drop sets are about load and reps: offered wherever the set has a weight box, never on a hold. */
  const canDropActive = !activeHold && activeEntryFields.some((field) => field.measure === "weight");
  /**
   * The atlas's question for this set, asked only where it matters (02-design.md §6): straps where
   * a grip mapping depends on a bare hand and the athlete has a target in a region with that
   * mapping. No arm or leg is asked: both sides are counted as one (owner, 20 Oct 2026). Every
   * other set card is exactly as it was.
   */
  const activePolicy = activeExercise ? policyFor(activeExercise) : null;
  const askStrapsHere = Boolean(activePolicy && loggerGates.of(activePolicy).askStraps);
  /** The last hold's seconds; reps only for a set logged in reps, which are never passed off as seconds. */
  const carriedDose = carried?.seconds ? `${carried.seconds} sec` : carried?.reps.trim() ? `${carried.reps} reps` : "— sec";
  /**
   * "30", "45" on a hold's target: the bare number is seconds there, not reps. On rows laid out per
   * side, rows 1 and 2 are planned set 1 (once per side), so "3 × 10/8/6" reads 10, 10, 8, 8, 6, 6.
   */
  const activeTarget = position && activeExercise ? repsForSet(shownPrescription(activeExercise), activeExercise.perArm ? Math.floor(position.setIndex / 2) : position.setIndex) : "";
  /** A hold waiting for its seconds: Log set stays off, and the card says what it needs. */
  const secondsMissing = Boolean(activeHold && !dropMode && !holdSecondsReady(shownEntries.seconds));
  const swapExercise = swapForId ? activeSession.exercises.find((exercise) => exercise.id === swapForId) ?? null : null;
  const addAnchor = addAfterId ? activeSession.exercises.find((exercise) => exercise.id === addAfterId) ?? null : null;

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
        <strong>{activeTarget}{bareCount(activeTarget) ? <em>{activeHold ? " sec" : " reps"}</em> : null}</strong>
      </p>
      {/* Once a drop set has a stage, the last set's numbers are exactly what the next stage is not. */}
      {carried && activeStages.length === 0 && <p className="live-set-last">
        {carried.source === "session" ? "Last set" : "Last logged"}: {activeDirected && carried.headDirection ? `${headDirectionWords[carried.headDirection]} · ` : ""}{activeHold
          // A hold's last time: the load where there was one, then the seconds. A set logged in reps
          // before this exercise was measured in seconds says reps: they are never read as seconds.
          ? (carried.logged
            ? <>{carried.logged.weight} {carried.logged.unit} · {carriedDose} <small>({carried.weight} {sessionUnit} in this workout's unit)</small></>
            : <>{[...activeLoadFields.filter((field) => carried[field.measure]).map((field) => `${carried[field.measure]} ${field.unit}`), carriedDose].join(" · ")}</>)
          : carried.leftLoad !== undefined || carried.rightLoad !== undefined
            // Arms loaded differently: each arm as it was, never one number.
            ? <>Left {carried.leftLoad || "—"} {sessionUnit} · Right {carried.rightLoad || "—"} {sessionUnit} × {carried.reps}</>
            : carried.logged
              ? <>{carried.logged.weight} {carried.logged.unit} × {carried.reps} <small>({carried.weight} {sessionUnit} in this workout's unit)</small></>
              : <>{activeEntryFields.map((field) => `${carried[field.measure] || "—"} ${field.unit}`).join(" · ")} × {carried.reps}</>}
      </p>}
      {/* "Last time" in full (H07): this exercise's earlier workouts, read-only, between sets. */}
      {(() => { const entry = catalogFor(activeExercise); const pastCount = exerciseHistoryCount({ exerciseName: activeExercise.exerciseName, catalogId: activeExercise.catalogId ?? entry?.id }, history, activeSession.id); return pastCount > 0 ? <details className="live-set-history">
        <summary>Earlier {activeExercise.exerciseName} workouts ({pastCount}) <ChevronRight className="h-4 w-4" aria-hidden /></summary>
        <ExerciseHistoryList exerciseId={activeExercise.catalogId ?? entry?.id} exerciseName={activeExercise.exerciseName} weightUnit={sessionUnit} limit={3} excludeSessionId={activeSession.id} />
      </details> : null; })()}
      {/* The photographs of the current exercise, collapsed: a reference to open between sets,
          never a frame the athlete must scroll past to log one. The set fields keep their values
          either way; this is a disclosure, not a route. */}
      {(() => { const catalogEntry = catalogFor(activeExercise); return catalogEntry && exercisePhotoSet(catalogEntry.id) ? <details className="live-set-media">
        <summary>Show {activeExercise.exerciseName} photos <ChevronRight className="h-4 w-4" aria-hidden /></summary>
        <ExerciseMedia exerciseId={catalogEntry.id} exerciseName={catalogEntry.name} equipment={catalogEntry.equipment} variant="detail" />
      </details> : null; })()}
      {/* The setup it is done with, closed and optional: never a step before Log set. */}
      {(() => { const last = lastSetupFor(activeExercise); return <ExerciseSetupDisclosure key={activeExercise.id} catalogId={catalogIdIn(activeExercise)} exerciseName={activeExercise.exerciseName} setup={activeExercise.setup} lastSetup={last}
        onChange={(field, value) => updateSetup(activeExercise.id, field, value)} onRepeat={() => { if (last) repeatSetup(activeExercise.id, last); }} />; })()}
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
      {/* Left or Right before the set, always in view: the head's direction, never an arm. */}
      {activeDirected && <div className="live-set-direction" role="group" aria-label={`${headDirectionPrompt(catalogIdIn(activeExercise))}, set ${position.setIndex + 1}`}>
        <span className="live-set-direction-label" aria-hidden="true">{headDirectionPrompt(catalogIdIn(activeExercise))}</span>
        <span className="live-set-direction-choices">{HEAD_DIRECTIONS.map((direction) => <button key={direction} type="button" aria-pressed={shownDirection === direction} onClick={() => chooseDirection(direction)}>{headDirectionWords[direction]}</button>)}</span>
      </div>}
      {/* The athlete's own hand is the resistance: there is no load to type, and none is invented. */}
      {isLoadUnmeasured(catalogIdIn(activeExercise)) && <p className="live-set-load-note">{MANUAL_RESISTANCE_LINE}</p>}
      {(() => {
        // Arms loaded differently: a box per arm in place of the one per-arm box.
        const cardLoadFields: { key: EntryField; label: string; unit: string }[] = activeArmLoads
          ? [{ key: "leftLoad", label: "Left arm", unit: sessionUnit }, { key: "rightLoad", label: "Right arm", unit: sessionUnit }, ...activeLoadFields.filter((field) => field.measure !== "weight").map((field) => ({ key: field.measure, label: field.label, unit: field.unit }))]
          : activeLoadFields.map((field) => ({ key: field.measure, label: field.label, unit: field.unit }));
        return <div className="live-set-entry" data-fields={cardLoadFields.length + 1}>
        {/* A value carried from the last set is an offer until the athlete touches
            the field: it is marked so it never passes for something already typed. */}
        {cardLoadFields.map((field) => <label key={field.key}>
          <span>{field.label}</span>
          <input value={shownEntries[field.key]} inputMode="decimal" type="text" autoComplete="off" enterKeyHint="next" data-carried={isCarried(field.key) ? "" : undefined}
            onChange={(event) => editEntry(field.key, event.target.value)} onKeyDown={onEntryKeyDown} placeholder="—" />
          <em>{field.unit}</em>
        </label>)}
        {/* The last box is the set's dose: seconds on a hold, reps on everything else. Done logs the set. */}
        {activeHold
          ? <label>
            <span>Seconds</span>
            <input value={shownEntries.seconds} inputMode="numeric" type="text" autoComplete="off" enterKeyHint="done" data-carried={isCarried("seconds") ? "" : undefined}
              onChange={(event) => editEntry("seconds", event.target.value)} onKeyDown={onEntryKeyDown} placeholder="—" />
            <em>sec</em>
          </label>
          : <label>
            <span>Reps</span>
            <input value={shownEntries.reps} inputMode="numeric" type="text" autoComplete="off" enterKeyHint="done" data-carried={isCarried("reps") ? "" : undefined}
              onChange={(event) => editEntry("reps", event.target.value)} onKeyDown={onEntryKeyDown} placeholder="—" />
          </label>}
      </div>; })()}
      {/* A plate-loaded press may carry different plates on each arm: both are kept, never added up. */}
      {isPlatesPerArm(catalogIdIn(activeExercise)) && !dropMode && <button type="button" className="live-set-arms" aria-pressed={activeArmLoads} onClick={() => setArmLoads(!activeArmLoads)}>
        Arms loaded differently
      </button>}
      {/* How hard the set was taken, said in place: asked only of a usually-light exercise, a quiet toggle otherwise. */}
      {!dropMode && <SetEffortChoice exerciseName={activeExercise.exerciseName} catalogExerciseId={catalogFor(activeExercise)?.id} effort={activeSet.effort}
        onChange={(effort) => updateSet(activeExercise.id, position.setIndex, { effort })} />}
      {/* Straps, once per exercise and quietly: unanswered is "not recorded", never "no". */}
      {askStrapsHere && <div className="live-set-straps" role="group" aria-label={`Straps on ${activeExercise.exerciseName}`}>
        <span className="live-set-straps-label" aria-hidden="true">Straps</span>
        <button type="button" aria-pressed={activeExercise.straps === "yes"} onClick={() => chooseStraps(activeExercise.id, "yes")}>Used</button>
        <button type="button" aria-pressed={activeExercise.straps === "no"} onClick={() => chooseStraps(activeExercise.id, "no")}>Not used</button>
      </div>}
      {dropMode
        ? <div className="live-drop-actions">
          <button type="button" className="live-drop-add" onClick={() => addDropStage(false)}><Plus className="h-4 w-4" aria-hidden /> Add drop</button>
          <button type="button" className="live-set-commit" onClick={() => addDropStage(true)}><Check className="h-4 w-4" /> Finish drop set</button>
        </div>
        : <>
          {/* Said in place, at rest, beside the button it explains: no popup, no error after a tap. */}
          {directionMissing && <p className="live-set-dose-hint" id="live-set-direction-hint">Choose Left or Right</p>}
          {secondsMissing && <p className="live-set-dose-hint" id="live-set-dose-hint">{shownEntries.seconds.trim() ? "Add the seconds: at least 1" : "Add the seconds"}</p>}
          <button type="button" className="live-set-commit" onClick={completeActiveSet} disabled={secondsMissing || directionMissing} aria-describedby={[directionMissing ? "live-set-direction-hint" : "", secondsMissing ? "live-set-dose-hint" : ""].filter(Boolean).join(" ") || undefined}>
            <Check className="h-4 w-4" /> Log set {position.setIndex + 1}
          </button>
        </>}
      {dropMode && dropProblem && <p className="live-drop-problem" role="alert">{dropProblem}</p>}
      {dropMode && !dropProblem && dropNote && <p className="live-drop-note" role="status">{dropNote}</p>}
      {/* Secondary by design: the dominant action is logging the set. Swap, Skip and Add sit
          under it as one row of three equal outlined buttons - unfilled, so Log set stays the
          one thing to press, but each a full thumb-sized target that reads at a glance on a
          phone. Short labels on screen; the full action in each name. */}
      <div className="live-set-secondary">
        <button type="button" className="live-set-skip live-set-swap" onClick={() => setSwapForId(activeExercise.id)} aria-label="Swap exercise">
          <ArrowLeftRight className="h-5 w-5" aria-hidden="true" /><span>Swap</span>
        </button>
        <button type="button" className="live-set-skip" onClick={skipActiveExercise} aria-label={`Skip ${activeExercise.exerciseName}`}>
          <SkipForward className="h-5 w-5" aria-hidden="true" /><span>Skip</span>
        </button>
        <button type="button" className="live-set-skip live-set-add" onClick={() => setAddAfterId(activeExercise.id)} aria-label="Add exercise">
          <Plus className="h-5 w-5" aria-hidden="true" /><span>Add</span>
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
              const volume = set.type === "drop" && (set.stages?.length ?? 0) >= 2 ? setVolume(set, unit, convention, sessionUnit, { perArm: isPlatesPerArm(catalogIdIn(exercise)) }) : null;
              const side = sideWordsOf(set, rowLimbOf(exercise));
              return <li key={set.id ?? index}>{setLineOf(exercise, set, unit)}{side ? ` · ${side}` : ""}{set.type === "drop" && (set.stages?.length ?? 0) >= 2 && <small>{dropSetSummary(set)}{volume ? ` · ${volumeText(volume)}` : ""}</small>}</li>;
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
      {/* One more before finishing: it goes after the last exercise and becomes the set card. */}
      <button type="button" className="live-done-add" onClick={() => setAddAfterId(activeSession.exercises[activeSession.exercises.length - 1]?.id ?? null)}>
        <Plus className="h-5 w-5" aria-hidden="true" /> Add another exercise
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

    {addAnchor && <ExerciseSwapSheet
      addOnly
      exercise={addAnchor}
      catalogEntry={catalogFor(addAnchor)}
      catalog={exerciseCatalog}
      assessment={assessSwap(addAnchor)}
      inWorkout={new Set(activeSession.exercises.map((exercise) => exercise.exerciseName))}
      lastLoggedFor={lastLoggedText}
      incomingFor={(target) => incomingFor({ name: target.name, id: target.id }, addAnchor)}
      onConfirm={() => undefined}
      onAdd={(target) => addAfterExercise(addAnchor.id, target)}
      onClose={() => setAddAfterId(null)}
    />}
    {swapExercise && <ExerciseSwapSheet
      exercise={swapExercise}
      catalogEntry={catalogFor(swapExercise)}
      catalog={exerciseCatalog}
      assessment={assessSwap(swapExercise)}
      inWorkout={new Set(activeSession.exercises.map((exercise) => exercise.exerciseName))}
      lastLoggedFor={lastLoggedText}
      incomingFor={(target) => incomingFor({ name: target.name, id: target.id }, swapExercise)}
      planOptionFor={planOptionFor(swapExercise)}
      onConfirm={(choice) => confirmSwap(swapExercise.id, choice)}
      onAdd={(target) => addAfterExercise(swapExercise.id, target)}
      onClose={() => setSwapForId(null)}
    />}
  </section>;
}
