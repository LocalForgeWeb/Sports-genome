export type DeviceSetLog = {
  weight: string;
  reps: string;
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
};

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
        sets: Array.isArray(exercise.sets) ? exercise.sets.map((set: DeviceSetLog) => ({ weight: String(set.weight || ""), reps: String(set.reps || ""), height: String(set.height || ""), completed: Boolean(set.completed), skipped: Boolean(set.skipped) })) : [],
      })) : [],
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
  const normalized = sessions.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ weight: set.weight, reps: set.reps, height: set.height || "", completed: set.completed, skipped: Boolean(set.skipped) })) })) }));
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

export function finalizeSession(session: DeviceWorkoutSession, completedAt = new Date().toISOString()) {
  const excludedDrafts = countDraftSets(session);
  const finalized: DeviceWorkoutSession = {
    ...session,
    status: "completed",
    completedAt,
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
export function lastCompletedSetFor(exerciseName: string, sessions: DeviceWorkoutSession[]): DeviceSetLog | null {
  const finished = sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) => String(b.completedAt || b.startedAt).localeCompare(String(a.completedAt || a.startedAt)));
  for (const session of finished) {
    const exercise = session.exercises.find((item) => item.exerciseName === exerciseName);
    const last = exercise?.sets.filter((set) => set.completed && (set.weight.trim() || (set.height || "").trim()) && set.reps.trim()).pop();
    if (last) return last;
  }
  return null;
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
): { weight: string; reps: string; height: string; source: "session" | "history" } | null {
  for (let index = setIndex - 1; index >= 0; index--) {
    const set = exercise.sets[index];
    if (set.completed && (set.weight.trim() || set.reps.trim() || (set.height || "").trim())) {
      return { weight: set.weight, reps: set.reps, height: set.height || "", source: "session" };
    }
  }
  const previous = lastCompletedSetFor(exercise.exerciseName, history);
  return previous ? { weight: previous.weight, reps: previous.reps, height: previous.height || "", source: "history" } : null;
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
