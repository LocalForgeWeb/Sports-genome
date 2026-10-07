import { displayWeightToKilograms, kilogramsToDisplayWeight, type DisplayWeightUnit } from "./weightUnits";

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
  /**
   * The measures the 50-exercise expansion needed (6 Oct brief §8), each typed rather than
   * folded into `reps` or a note: a 20-second hold is not 20 reps, and 30 metres carried is not
   * 30 reps. Which of them an exercise records is shared/exerciseMeasurement.ts's decision.
   */
  /** Seconds held, for a timed set. */
  seconds?: string;
  /** Distance covered, for a carry, drag or rope pull. */
  distance?: string;
  /** The unit the distance was typed in. */
  distanceUnit?: DistanceUnit;
  /** A named resistance setting - a band colour, a gripper model, a hub. Never a weight. */
  setting?: string;
  /** The side this set was done on, for an exercise done one side at a time. The set counts once. */
  side?: SetSide;
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
};

export type DistanceUnit = "m" | "yd";
export type SetSide = "left" | "right";

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
 * are stages: anything else stored there is dropped rather than read as load.
 */
function normalizeSet(set: DeviceSetLog): DeviceSetLog {
  const normalized: DeviceSetLog = { weight: String(set.weight || ""), reps: String(set.reps || ""), height: String(set.height || ""), completed: Boolean(set.completed), skipped: Boolean(set.skipped) };
  if (isWeightUnit(set.unit)) normalized.unit = set.unit;
  if (typeof set.id === "string" && set.id) normalized.id = set.id;
  // The expansion's measures are kept only when they hold something, and only as what they are.
  for (const field of ["seconds", "distance", "setting"] as const) {
    const value = set[field];
    if ((typeof value === "string" || typeof value === "number") && String(value).trim()) normalized[field] = String(value);
  }
  if (set.distanceUnit === "m" || set.distanceUnit === "yd") normalized.distanceUnit = set.distanceUnit;
  if (set.side === "left" || set.side === "right") normalized.side = set.side;
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
        ...exercise,
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
  const normalized = sessions.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map(normalizeSet) })) }));
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
  return !set.completed && !set.skipped && Boolean(set.weight.trim() || set.reps.trim() || (set.height || "").trim() || (set.seconds || "").trim() || (set.distance || "").trim() || (set.setting || "").trim());
}

/** True when a set records how much was done: reps, seconds held or distance covered. */
export function hasPerformedAmount(set: Pick<DeviceSetLog, "reps" | "seconds" | "distance">): boolean {
  return Boolean(set.reps.trim() || (set.seconds || "").trim() || (set.distance || "").trim());
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
    // A load-and-reps set needs both; a hold, a carry or a band set is complete with its own measure.
    const last = exercise?.sets.filter((set) => set.completed && (((set.weight.trim() || (set.height || "").trim()) && set.reps.trim()) || (set.seconds || "").trim() || (set.distance || "").trim() || ((set.setting || "").trim() && set.reps.trim()))).pop();
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
): CarriedEntry | null {
  for (let index = setIndex - 1; index >= 0; index--) {
    const set = exercise.sets[index];
    if (set.completed && (set.weight.trim() || set.reps.trim() || (set.height || "").trim() || hasPerformedAmount(set) || (set.setting || "").trim())) {
      const unit = set.unit ?? entryUnit;
      // Offered in this workout's unit; what was actually typed travels with it, so the line can say so (H08).
      return { weight: weightInUnit(set.weight, unit, entryUnit), reps: set.reps, height: set.height || "", ...carriedMeasures(set), source: "session", ...loggedIn(set.weight, unit, entryUnit) };
    }
  }
  // A set from a session logged in the other unit is offered in this session's unit.
  const previous = lastCompletedSetFor(exercise, history, entryUnit);
  if (!previous) return null;
  const unit = previous.unit ?? entryUnit;
  return { weight: weightInUnit(previous.weight, unit, entryUnit), reps: previous.reps, height: previous.height || "", ...carriedMeasures(previous), source: "history", ...loggedIn(previous.weight, unit, entryUnit) };
}

/**
 * What the next set is offered beyond load and reps. The side is never carried: an athlete
 * working one side then the other would be offered the wrong one every second set. `logged` is
 * the load as it was typed, when that was in the other unit.
 */
export type CarriedEntry = { weight: string; reps: string; height: string; seconds?: string; distance?: string; setting?: string; source: "session" | "history"; logged?: { weight: string; unit: DisplayWeightUnit } };

function loggedIn(weight: string, unit: DisplayWeightUnit, entryUnit: DisplayWeightUnit): Pick<CarriedEntry, "logged"> {
  return unit !== entryUnit && weight.trim() ? { logged: { weight, unit } } : {};
}

function carriedMeasures(set: DeviceSetLog): Pick<CarriedEntry, "seconds" | "distance" | "setting"> {
  return {
    seconds: (set.seconds || "").trim() || undefined,
    distance: (set.distance || "").trim() || undefined,
    setting: (set.setting || "").trim() || undefined,
  };
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
