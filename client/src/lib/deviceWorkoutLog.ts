import { displayWeightToKilograms, kilogramsToDisplayWeight, type DisplayWeightUnit } from "./weightUnits";
import { isSetEffort, type SetEffort } from "@shared/setEffort";

export type DeviceSetLog = {
  weight: string;
  reps: string;
  /**
   * The unit `weight` was typed in, stamped when the weight is written. Sets logged
   * before units were recorded have none and read through their session's unit.
   */
  unit?: DisplayWeightUnit;
  /** Box height, for the jumps and step-ups where that is the real variable. */
  height?: string;
  completed: boolean;
  /**
   * The athlete decided not to do this one — the rack was taken, the machine
   * was busy, they ran out of time. A skip is a resolved set, not a pending
   * one, so execution moves past it; but it is not an observation either, so
   * nothing about it reaches Progress.
   */
  skipped?: boolean;
  /** A stable id, given to a set when it first needs one (a drop set's stages refer to their set). */
  id?: string;
  /**
   * "drop": one set done as several ordered stages, each lighter than the last, without rest
   * between them (Oct 6 brief §4). It counts once, as one set, everywhere. Absent means standard.
   */
  type?: "standard" | "drop";
  /**
   * A drop set's stages in the order they were done. `weight` and `reps` above mirror stage 1,
   * so a reader that knows nothing of stages still reads one real, unfatigued set - never the
   * stages added together. See lib/dropSets.ts for what each reader does with the rest.
   */
  stages?: DropStage[];
  /**
   * How hard the set was taken, when the athlete said (shared/setEffort.ts). A set stopped short
   * of failure is a floor: it may raise a rank, never lower it. Absent means not said.
   */
  effort?: SetEffort;
  /**
   * Which arm did the set (specialization atlas, 02-design.md §6): asked only on exercises the
   * atlas knows can be done one arm at a time. "both" is one set done with both arms, which
   * counts once for each arm. Absent means not asked or not said, and stays unknown: it is
   * never guessed from the exercise afterwards.
   */
  side?: SetSide;
  /**
   * How long a hold lasted, in whole seconds as typed, on exercises measured in seconds (dead
   * hangs, farmer holds, pinches). A hold set has no reps: `reps` stays empty, so every reader
   * of reps reads it as "no reps" rather than a number, and none of them turns seconds into
   * reps, an estimated max or volume (isHoldSet).
   */
  holdSeconds?: string;
  /**
   * A warm-up set, kept out of completed work totals. Nothing in the logger asks for it yet;
   * it is read and kept so a set marked elsewhere (an import, a later control) is never
   * counted as work. Only `true` is stored: false is the same as absent.
   */
  warmup?: boolean;
};

/** Which arm a set was done with. */
export type SetSide = "left" | "right" | "both";
const isSetSide = (value: unknown): value is SetSide => value === "left" || value === "right" || value === "both";
/** Whether straps were used on an exercise in a workout: recorded only when the athlete said. */
export type StrapsUsed = "yes" | "no";
const isStrapsUsed = (value: unknown): value is StrapsUsed => value === "yes" || value === "no";

/** One stage of a drop set: the load and the reps done at it, in the unit it was typed in. */
export type DropStage = { id: string; weight: string; reps: string; unit?: DisplayWeightUnit };

/**
 * Who an exercise in a session was swapped from or to (Oct 6 brief §3). Written once, when the
 * swap happens, and never recomputed: the history says what was actually done, under the name
 * it was done under.
 */
export type ExerciseSwapRecord = {
  /** One per confirmed swap: applying the same swap twice changes nothing. */
  swapId: string;
  exerciseName: string;
  catalogId?: number;
  /** Sets of the original exercise completed before the swap. */
  afterSets: number;
  at: string;
};

export type DeviceWorkoutExercise = {
  id: string;
  /** The exercise as it was named when the session was built: the identity its logged sets keep. */
  exerciseName: string;
  /** The catalog exercise behind the name, when known. Sessions before Oct 6 have only the name. */
  catalogId?: number;
  plannedPrescription: string;
  sets: DeviceSetLog[];
  /**
   * The rows were built per arm: a one-arm exercise planned for an athlete with a specialization
   * target, where "3 × 12" is three sets for each arm, so each planned set is two rows, Right then
   * Left (components/DeviceWorkoutTracker.tsx `perArmSets`). Row `n` follows planned set
   * `floor(n / 2)`. Absent on every other exercise, and on workouts from before it existed.
   */
  perArm?: boolean;
  /** This exercise took over the rest of another one's work mid-workout. */
  swappedFrom?: ExerciseSwapRecord;
  /** The rest of this exercise's work was handed to another one; what it holds stays its own. */
  replacedBy?: ExerciseSwapRecord;
  /** Added during the workout, after every planned set of another exercise was done. */
  addedDuringWorkout?: { at: string; afterExerciseName: string };
  /**
   * Stamped when the workout is finished (Oct 7 brief R04): how many sets the exercise had planned
   * and how many were deliberately skipped. Finishing keeps only completed sets, so without these a
   * recap could not tell "3 of 4 done, 1 skipped" from "3 done".
   */
  plannedSets?: number;
  skippedSets?: number;
  /**
   * Straps on this exercise in this workout, when the athlete said (02-design.md §6). Asked only
   * where a grip mapping is not earned by a strapped set, and only once the athlete has a forearm
   * goal. Absent is "not recorded", which is not the same as "no".
   */
  straps?: StrapsUsed;
};

/**
 * An exercise of a finished workout with no completed set: kept on the record so the recap can
 * say it was skipped or simply not recorded, without turning any of it into completed work.
 */
export type NotPerformedExercise = {
  exerciseName: string;
  catalogId?: number;
  plannedSets: number;
  /** Every set was deliberately skipped; otherwise the sets were left unrecorded (untouched or typed but not logged). */
  skipped: boolean;
};
export type DeviceWorkoutSession = {
  id: string;
  title: string;
  dayLabel: string;
  /** The athlete's own note on the workout, added from its recap. Optional, never required. */
  note?: string;
  /** Exercises that ended with nothing completed, recorded at finish (see NotPerformedExercise). */
  notPerformed?: NotPerformedExercise[];
  /** When a set of this finished workout was last corrected from its recap. */
  correctedAt?: string;
  startedAt: string;
  completedAt?: string;
  status: "active" | "completed";
  exercises: DeviceWorkoutExercise[];
  /**
   * Rest state lives on the session because the continuity contract counts a
   * "timer transition that affects execution" among the consequential actions
   * that must checkpoint on-device — a reload mid-rest resumes mid-rest.
   */
  restSeconds?: number;
  restEndsAt?: string;
  /**
   * The athlete's body weight when this session was finished, stamped once and never re-read.
   *
   * The weight log answers "what did they weigh that day" for any day it covers, and that answer
   * cannot move afterwards. This is the fallback for the days it does not cover — a first
   * session logged before any weight was entered. Without it those sessions fell through to
   * whatever the profile says *now*, so editing a weight months later silently rewrote what
   * every one of them had been measured against.
   */
  bodyMassKgAtCompletion?: number;
  /**
   * The unit this session's weights are entered in, fixed when it starts. A later change
   * of the profile's unit does not reach it: a set typed as 100 lb stays 100 lb.
   */
  weightUnit?: DisplayWeightUnit;
  /**
   * True when `weightUnit` was not recorded at the time but assigned once, from the
   * profile's unit, to history logged before units were stored (decision D-005).
   */
  weightUnitInferred?: boolean;
};

const isWeightUnit = (value: unknown): value is DisplayWeightUnit => value === "lb" || value === "kg";

/**
 * Keeps a set's unit only when it is one the app knows, and a drop set's stages only when they
 * are stages: anything else stored there is dropped rather than read as load. The atlas's set
 * fields are kept the same way: a side only when it is one of the three, hold seconds only when
 * they are a whole number, and a warm-up mark only when it is `true`.
 */
function normalizeSet(set: DeviceSetLog): DeviceSetLog {
  const normalized: DeviceSetLog = { weight: String(set.weight || ""), reps: String(set.reps || ""), height: String(set.height || ""), completed: Boolean(set.completed), skipped: Boolean(set.skipped) };
  if (isWeightUnit(set.unit)) normalized.unit = set.unit;
  if (typeof set.id === "string" && set.id) normalized.id = set.id;
  if (isSetEffort(set.effort)) normalized.effort = set.effort;
  if (isSetSide(set.side)) normalized.side = set.side;
  const seconds = holdSecondsText(set.holdSeconds);
  if (seconds) normalized.holdSeconds = seconds;
  if (set.warmup === true) normalized.warmup = true;
  if (set.type === "drop") {
    normalized.type = "drop";
    normalized.stages = (Array.isArray(set.stages) ? set.stages : [])
      .filter((stage): stage is DropStage => typeof stage === "object" && stage !== null)
      .map((stage, index) => {
        const kept: DropStage = { id: typeof stage.id === "string" && stage.id ? stage.id : `${normalized.id ?? "set"}-stage-${index + 1}`, weight: String(stage.weight || ""), reps: String(stage.reps || "") };
        if (isWeightUnit(stage.unit)) kept.unit = stage.unit;
        return kept;
      });
  }
  return normalized;
}

/**
 * Hold seconds as stored: whole seconds written as digits ("30"). A number from an older or
 * foreign writer is read as its digits; anything else (text, a negative, a fraction) is not a
 * hold time and is dropped, never read as zero.
 */
function holdSecondsText(value: unknown): string | null {
  const text = typeof value === "number" && Number.isInteger(value) && value >= 0 ? String(value) : typeof value === "string" ? value.trim() : "";
  return /^\d{1,5}$/.test(text) ? String(Number(text)) : null;
}

/** An exercise's own fields as stored: straps only when it is "yes" or "no". */
function normalizeExercise<T extends object>(exercise: T): T {
  const straps = (exercise as { straps?: unknown }).straps;
  if (straps === undefined || isStrapsUsed(straps)) return exercise;
  const { straps: _dropped, ...rest } = exercise as T & { straps?: unknown };
  return rest as T;
}

/**
 * A hold: a set whose dose is seconds, not reps. Readers of reps, load and volume use this to
 * leave it out of anything counted in reps (an estimated max, load x reps) while every count
 * of completed sets still counts it.
 */
export function isHoldSet(set: Pick<DeviceSetLog, "holdSeconds">): boolean {
  return Boolean((set.holdSeconds ?? "").trim());
}

/** A hold's seconds as a number, or null for a set that is not a hold. Never NaN. */
export function holdSecondsOf(set: Pick<DeviceSetLog, "holdSeconds">): number | null {
  if (!isHoldSet(set)) return null;
  const value = Number((set.holdSeconds ?? "").trim());
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * An id no other set or exercise in the session has: time plus a random tail. Every new set
 * gets one when it is created (a new session, an added or swapped-in exercise), so a bout can
 * be referred to by id rather than by its place in the list. History logged before set ids
 * keeps none: nothing is migrated, and readers fall back to the set's position.
 */
export const freshId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const newSetId = () => freshId("set");

/** The unit a set's weight was entered in: its own stamp, then its session's, then the caller's fallback. */
export function setWeightUnit(set: Pick<DeviceSetLog, "unit">, session: Pick<DeviceWorkoutSession, "weightUnit">, fallback: DisplayWeightUnit): DisplayWeightUnit {
  return set.unit ?? session.weightUnit ?? fallback;
}

/** A set's weight in kilograms, converted exactly from the unit it was entered in. Undefined when no positive weight was entered. */
export function setWeightKg(set: Pick<DeviceSetLog, "weight" | "unit">, session: Pick<DeviceWorkoutSession, "weightUnit">, fallback: DisplayWeightUnit): number | undefined {
  const value = Number(String(set.weight || "").trim());
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return displayWeightToKilograms(value, setWeightUnit(set, session, fallback));
}

/**
 * Gives every session logged before units were stored a unit, once.
 *
 * Nothing recorded which unit those weights were typed in, and every screen has been
 * reading them in the profile's unit of the day. They are assigned that unit now and
 * marked as inferred, so they read exactly as they did before this change - and a
 * later switch between lb and kg can no longer turn 225 lb into 225 kg.
 */
export function stampLegacyWeightUnits(sessions: DeviceWorkoutSession[], unit: DisplayWeightUnit): { sessions: DeviceWorkoutSession[]; stamped: number } {
  let stamped = 0;
  const next = sessions.map((session) => {
    if (isWeightUnit(session.weightUnit)) return session;
    stamped += 1;
    return { ...session, weightUnit: unit, weightUnitInferred: true };
  });
  return { sessions: next, stamped };
}

export const deviceWorkoutHistoryKey = "sports-genome-device-workout-history-v1";
export const deviceWorkoutHistoryEvent = "sports-genome:device-workout-history";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * A null entry used to throw at any level, so the whole history loaded as empty and the next
 * checkpoint wrote that over every workout; a string, number or array was read as a junk
 * object. Entries that are not objects are now skipped at each level. Anything that is an
 * object is kept as it is, whatever its status: dropping it here would erase it on the next save.
 */
export function loadDeviceWorkoutSessions(): DeviceWorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecord).map((session) => ({
      ...session,
      exercises: Array.isArray(session.exercises) ? session.exercises.filter(isRecord).map((exercise) => ({
        ...normalizeExercise(exercise),
        sets: Array.isArray(exercise.sets) ? exercise.sets.filter(isRecord).map((set) => normalizeSet(set as DeviceSetLog)) : [],
      })) : [],
      weightUnit: isWeightUnit(session.weightUnit) ? session.weightUnit : undefined,
    })) as DeviceWorkoutSession[] : [];
  } catch {
    return [];
  }
}

/**
 * Returns whether the checkpoint actually reached the device. The "Active
 * workout continuity contract" requires a consequential action to be
 * checkpointed on-device "before the UI treats it as safely saved", so a failed
 * write (quota exhausted, private-mode storage, storage disabled) has to be
 * reportable rather than swallowed — the surface tells the athlete instead of
 * claiming a durability it does not have.
 */
export function saveDeviceWorkoutSessions(sessions: DeviceWorkoutSession[]): boolean {
  if (typeof window === "undefined") return false;
  const normalized = sessions.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => ({ ...normalizeExercise(exercise), sets: exercise.sets.map(normalizeSet) })) }));
  try {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(normalized));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(deviceWorkoutHistoryEvent));
  return true;
}

/**
 * Takes back a finished workout recorded on this device, the way a typed lift can be
 * (removeDeviceStrengthObservation): a test run, a weight typed ten times too heavy or a
 * workout finished by accident would otherwise count forever. Only a finished session
 * can go, so the running one is never lost; the change reaches only this device.
 */
export function removeDeviceWorkoutSession(sessions: DeviceWorkoutSession[], sessionId: string): DeviceWorkoutSession[] {
  return sessions.filter((session) => !(session.id === sessionId && session.status === "completed"));
}

/**
 * Live-session semantics, per three FIXED philosophy contracts that all govern
 * the active workout surface:
 *
 * - "Live-set commitment semantics contract": "Editing, completion, local
 *   durability, synchronization, and workout finalization are separate states.
 *   Edited values remain drafts until explicit completion. Only completed
 *   observations feed performance history and derived models. Completion is
 *   unmistakable and reversible. Edited-but-uncompleted sets are excluded by
 *   default at workout finish."
 * - "Active workout continuity contract": "Every consequential athlete
 *   action ... must checkpoint on-device before the UI treats it as safely
 *   saved ... On interruption or reconnect, restore last confirmed execution
 *   position ... the resume cue says what is confirmed and what needs
 *   verification."
 * - "Live workout glance contract": the first view must make "active
 *   exercise/set, prescribed or entered progression variable, completion/rest
 *   state, and one dominant next action immediately legible."
 *
 * These live here rather than in the component so the state machine can be
 * tested against the contracts directly.
 */

/** A set the athlete typed into but never completed. Never an observation. */
export function isDraftSet(set: DeviceSetLog): boolean {
  return !set.completed && !set.skipped && Boolean(set.weight.trim() || set.reps.trim() || (set.height || "").trim() || (set.holdSeconds || "").trim());
}

/**
 * A drop set under way: at least one stage added, not yet finished. Its stages were each
 * confirmed with Add drop, so they are performed work, not drafts - only the next stage's
 * boxes, if typed in, are a draft.
 */
export function isDropInProgress(set: DeviceSetLog): boolean {
  return set.type === "drop" && !set.completed && !set.skipped && (set.stages?.length ?? 0) > 0;
}

/**
 * A drop set closed where it stands - the workout finished, or the exercise swapped, with
 * stages added but Finish never tapped. Two or more stages are a drop set; one stage is an
 * ordinary set of that load and reps, because a drop set needs at least one drop.
 */
export function settleDropSet(set: DeviceSetLog): DeviceSetLog {
  const stages = (set.stages ?? []).filter((stage) => stage.reps.trim());
  if (!stages.length) return { ...set, type: undefined, stages: undefined };
  if (stages.length === 1) return { ...set, type: undefined, stages: undefined, weight: stages[0].weight, reps: stages[0].reps, unit: stages[0].unit ?? set.unit, completed: true };
  return { ...set, stages, weight: stages[0].weight, reps: stages[0].reps, unit: stages[0].unit ?? set.unit, completed: true };
}

export function countDraftSets(session: DeviceWorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.filter(isDraftSet).length, 0);
}

export function countCompletedSets(session: DeviceWorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0);
}

/**
 * The shared definitions every count on Home, Progress and Strength reads
 * (Backend V1 B155, B156; docs/backend-v1/contracts.md § Counts).
 *
 * A completed set is one the athlete marked done and did not skip. A completed workout is a
 * finished session holding at least one completed set: finishing with nothing logged is not
 * a workout, and a planned set is never a completed one. A logged lift is one per exercise
 * per completed workout (its heaviest completed set with at least one rep) plus each typed test.
 */
export function isCompletedSet(set: Pick<DeviceSetLog, "completed" | "skipped">): boolean {
  return set.completed && !set.skipped;
}

export function isCompletedWorkout(session: Pick<DeviceWorkoutSession, "status" | "exercises">): boolean {
  return session.status === "completed" && session.exercises.some((exercise) => exercise.sets.some(isCompletedSet));
}

export function countPlannedSets(session: DeviceWorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

/**
 * The position the glance surface leads with, and the one a resumed session
 * restores to: the first set that is not yet confirmed complete.
 */
export type ActivePosition = { exerciseIndex: number; setIndex: number };

export function activePosition(session: DeviceWorkoutSession): ActivePosition | null {
  for (let exerciseIndex = 0; exerciseIndex < session.exercises.length; exerciseIndex++) {
    // An exercise swapped out mid-way has handed its remaining work on; anything it still holds
    // unlogged is reviewed in the full workout list, never made the next set to do.
    if (session.exercises[exerciseIndex].replacedBy) continue;
    const sets = session.exercises[exerciseIndex].sets;
    for (let setIndex = 0; setIndex < sets.length; setIndex++) {
      if (!sets[setIndex].completed && !sets[setIndex].skipped) return { exerciseIndex, setIndex };
    }
  }
  return null;
}

/**
 * Finalization drops drafts rather than promoting them, and reports what it
 * dropped so the exclusion is never silent.
 */
export function countSkippedSets(session: DeviceWorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.skipped).length, 0);
}

/** Every planned set of this exercise is either done or deliberately passed. */
export function isExerciseSkipped(exercise: DeviceWorkoutExercise): boolean {
  return exercise.sets.length > 0 && exercise.sets.every((set) => set.skipped);
}

export function finalizeSession(
  session: DeviceWorkoutSession,
  completedAt = new Date().toISOString(),
  bodyMassKgAtCompletion?: number,
) {
  const excludedDrafts = countDraftSets(session);
  // A drop set with stages added but never finished keeps the stages that were done.
  const settledDropSets = session.exercises.reduce((total, exercise) => total + exercise.sets.filter(isDropInProgress).length, 0);
  const finalized: DeviceWorkoutSession = {
    ...session,
    status: "completed",
    completedAt,
    bodyMassKgAtCompletion: bodyMassKgAtCompletion && bodyMassKgAtCompletion > 0
      ? bodyMassKgAtCompletion
      : session.bodyMassKgAtCompletion,
    exercises: [],
  };
  const notPerformed: NotPerformedExercise[] = [];
  for (const exercise of session.exercises) {
    const sets = exercise.sets.map((set) => (isDropInProgress(set) || (set.type === "drop" && set.completed && (set.stages?.length ?? 0) < 2) ? settleDropSet(set) : set)).filter((set) => set.completed);
    const skipped = exercise.sets.filter((set) => set.skipped).length;
    if (sets.length > 0) {
      finalized.exercises.push({ ...exercise, sets, plannedSets: exercise.plannedSets ?? exercise.sets.length, skippedSets: skipped });
      continue;
    }
    // Work handed to a replacement mid-workout is the replacement's, not missing work.
    if (exercise.replacedBy) continue;
    notPerformed.push({ exerciseName: exercise.exerciseName, ...(exercise.catalogId !== undefined ? { catalogId: exercise.catalogId } : {}), plannedSets: exercise.sets.length, skipped: exercise.sets.length > 0 && skipped === exercise.sets.length });
  }
  if (notPerformed.length) finalized.notPerformed = notPerformed;
  return { session: finalized, excludedDrafts, skippedSets: countSkippedSets(session), completedSets: countCompletedSets(finalized), settledDropSets };
}

/**
 * The last confirmed observation for an exercise, across finished sessions.
 * Shown only where it helps the immediate decision, which the glance contract
 * limits previous performance to.
 */
export function lastCompletedSetFor(target: string | { exerciseName: string; catalogId?: number }, sessions: DeviceWorkoutSession[], fallbackUnit: DisplayWeightUnit = "lb"): DeviceSetLog | null {
  const wanted = typeof target === "string" ? { exerciseName: target } : target;
  const finished = sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) => String(b.completedAt || b.startedAt).localeCompare(String(a.completedAt || a.startedAt)));
  // The same exercise by identity (Oct 7 brief H11): two catalog entries that share a name stay
  // apart. The name decides only where one side predates catalog IDs.
  const sameExercise = (item: DeviceWorkoutExercise) =>
    wanted.catalogId !== undefined && item.catalogId !== undefined ? item.catalogId === wanted.catalogId : item.exerciseName === wanted.exerciseName;
  for (const session of finished) {
    const exercise = session.exercises.find(sameExercise);
    // A hold has seconds where other sets have reps, with or without a load (a bodyweight hang).
    const last = exercise?.sets.filter((set) => set.completed && (((set.weight.trim() || (set.height || "").trim()) && set.reps.trim()) || isHoldSet(set))).pop();
    // The unit travels with the set, so whoever shows it can convert rather than guess.
    if (last) return { ...last, unit: setWeightUnit(last, session, fallbackUnit) };
  }
  return null;
}

/** A weight typed in one unit, written as it would be typed in another: exact conversion, rounded to 0.01 only for the box. */
export function weightInUnit(weight: string, from: DisplayWeightUnit, to: DisplayWeightUnit): string {
  if (from === to || !weight.trim()) return weight;
  const value = Number(weight.trim());
  if (!Number.isFinite(value)) return weight;
  const converted = kilogramsToDisplayWeight(displayWeightToKilograms(value, from), to);
  return String(Math.round(converted * 100) / 100);
}

/**
 * The load/reps to offer for the next set: the last set the athlete confirmed
 * for this exercise in this session, falling back to the last confirmed
 * observation from a finished session.
 *
 * It is offered as an input default, never written into the stored set. A
 * prefill the athlete never touched must not read back as a draft — the
 * commitment contract counts only what they edited or completed.
 */
export function carriedEntryFor(
  exercise: DeviceWorkoutExercise,
  setIndex: number,
  history: DeviceWorkoutSession[],
  entryUnit: DisplayWeightUnit = "lb",
): { weight: string; reps: string; height: string; /** A hold's seconds, present only when the set carried from was a hold. */ seconds?: string; source: "session" | "history"; logged?: { weight: string; unit: DisplayWeightUnit } } | null {
  for (let index = setIndex - 1; index >= 0; index--) {
    const set = exercise.sets[index];
    if (set.completed && (set.weight.trim() || set.reps.trim() || (set.height || "").trim() || isHoldSet(set))) {
      const unit = set.unit ?? entryUnit;
      // Offered in this workout's unit; what was actually typed travels with it, so the line can say so (H08).
      return { weight: weightInUnit(set.weight, unit, entryUnit), reps: set.reps, height: set.height || "", ...(isHoldSet(set) ? { seconds: set.holdSeconds } : {}), source: "session", ...(unit !== entryUnit && set.weight.trim() ? { logged: { weight: set.weight, unit } } : {}) };
    }
  }
  // A set from a session logged in the other unit is offered in this session's unit.
  const previous = lastCompletedSetFor(exercise, history, entryUnit);
  if (!previous) return null;
  const unit = previous.unit ?? entryUnit;
  return { weight: weightInUnit(previous.weight, unit, entryUnit), reps: previous.reps, height: previous.height || "", ...(isHoldSet(previous) ? { seconds: previous.holdSeconds } : {}), source: "history", ...(unit !== entryUnit && previous.weight.trim() ? { logged: { weight: previous.weight, unit } } : {}) };
}


/**
 * Skipping an exercise resolves only the sets that are still pending: anything
 * already logged stays logged, because a skip is about what remains.
 */
export function skipExercise(session: DeviceWorkoutSession, exerciseIndex: number): DeviceWorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise, index) => index !== exerciseIndex ? exercise : {
      ...exercise,
      sets: exercise.sets.map((set) => set.completed ? set : { ...set, skipped: true }),
    }),
  };
}

export function unskipExercise(session: DeviceWorkoutSession, exerciseIndex: number): DeviceWorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise, index) => index !== exerciseIndex ? exercise : {
      ...exercise,
      sets: exercise.sets.map((set) => set.skipped ? { ...set, skipped: false } : set),
    }),
  };
}
