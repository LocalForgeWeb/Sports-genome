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
  completed: boolean;
  /**
   * The athlete decided not to do this one — the rack was taken, the machine
   * was busy, they ran out of time. A skip is a resolved set, not a pending
   * one, so execution moves past it; but it is not an observation either, so
   * nothing about it reaches Progress.
   */
  skipped?: boolean;
};
export type DeviceWorkoutExercise = {
  id: string;
  exerciseName: string;
  plannedPrescription: string;
  sets: DeviceSetLog[];
};
export type DeviceWorkoutSession = {
  id: string;
  title: string;
  dayLabel: string;
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

/** Keeps a set's unit only when it is one the app knows. */
function normalizeSet(set: DeviceSetLog): DeviceSetLog {
  const normalized: DeviceSetLog = { weight: String(set.weight || ""), reps: String(set.reps || ""), height: String(set.height || ""), completed: Boolean(set.completed), skipped: Boolean(set.skipped) };
  if (isWeightUnit(set.unit)) normalized.unit = set.unit;
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

export function loadDeviceWorkoutSessions(): DeviceWorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
    return Array.isArray(parsed) ? parsed.map((session) => ({
      ...session,
      exercises: Array.isArray(session.exercises) ? session.exercises.map((exercise: DeviceWorkoutExercise) => ({
        ...exercise,
        sets: Array.isArray(exercise.sets) ? exercise.sets.map(normalizeSet) : [],
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
  return !set.completed && !set.skipped && Boolean(set.weight.trim() || set.reps.trim() || (set.height || "").trim());
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
  const finalized: DeviceWorkoutSession = {
    ...session,
    status: "completed",
    completedAt,
    bodyMassKgAtCompletion: bodyMassKgAtCompletion && bodyMassKgAtCompletion > 0
      ? bodyMassKgAtCompletion
      : session.bodyMassKgAtCompletion,
    exercises: session.exercises
      .map((exercise) => ({ ...exercise, sets: exercise.sets.filter((set) => set.completed) }))
      .filter((exercise) => exercise.sets.length > 0),
  };
  return { session: finalized, excludedDrafts, skippedSets: countSkippedSets(session), completedSets: countCompletedSets(finalized) };
}

/**
 * The last confirmed observation for an exercise, across finished sessions.
 * Shown only where it helps the immediate decision, which the glance contract
 * limits previous performance to.
 */
export function lastCompletedSetFor(exerciseName: string, sessions: DeviceWorkoutSession[], fallbackUnit: DisplayWeightUnit = "lb"): DeviceSetLog | null {
  const finished = sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) => String(b.completedAt || b.startedAt).localeCompare(String(a.completedAt || a.startedAt)));
  for (const session of finished) {
    const exercise = session.exercises.find((item) => item.exerciseName === exerciseName);
    const last = exercise?.sets.filter((set) => set.completed && (set.weight.trim() || (set.height || "").trim()) && set.reps.trim()).pop();
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

/** Whether a session is currently running on this device. */
export function hasActiveDeviceSession(): boolean {
  return loadDeviceWorkoutSessions().some((session) => session.status === "active");
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
): { weight: string; reps: string; height: string; source: "session" | "history" } | null {
  for (let index = setIndex - 1; index >= 0; index--) {
    const set = exercise.sets[index];
    if (set.completed && (set.weight.trim() || set.reps.trim() || (set.height || "").trim())) {
      return { weight: weightInUnit(set.weight, set.unit ?? entryUnit, entryUnit), reps: set.reps, height: set.height || "", source: "session" };
    }
  }
  // A set from a session logged in the other unit is offered in this session's unit.
  const previous = lastCompletedSetFor(exercise.exerciseName, history, entryUnit);
  return previous ? { weight: weightInUnit(previous.weight, previous.unit ?? entryUnit, entryUnit), reps: previous.reps, height: previous.height || "", source: "history" } : null;
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
