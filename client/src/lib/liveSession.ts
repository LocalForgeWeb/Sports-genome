import { useEffect, useState } from "react";
import {
  activePosition,
  countCompletedSets,
  countPlannedSets,
  deviceWorkoutHistoryEvent,
  loadDeviceWorkoutSessions,
  isExerciseSkipped,
} from "@/lib/deviceWorkoutLog";

/**
 * The workout that is happening right now, readable from anywhere.
 *
 * The live tracker knows all of this and nothing else did. Measured with a
 * session running and one set logged: Plan still read "Review the prescription,
 * then start when you are ready", the week board still read "6 exercises" for
 * the day being trained, and Home still read "0 of 5 sessions done" — three
 * screens describing a workout that was under way as one that had not started.
 * Navigate off the tracker and the session is gone from view; you have to
 * remember which tab you left it on.
 *
 * So the session stops being the tracker's private state. This is the one read
 * every surface uses, derived from the same on-device log the tracker writes, so
 * there is no second copy to drift.
 */
export type LiveSession = {
  id: string;
  dayLabel: string;
  startedAt: string;
  completedSets: number;
  plannedSets: number;
  /** 1-based, for display. Null once every exercise is done or skipped. */
  exerciseNumber: number | null;
  exerciseCount: number;
  exerciseName: string | null;
  setNumber: number | null;
  setCount: number | null;
  /** Names of the exercises with nothing left to do, in the order they appear. */
  finishedExercises: string[];
};

export function summarizeLiveSession(sessions = loadDeviceWorkoutSessions()): LiveSession | null {
  const session = sessions.find((entry) => entry.status === "active");
  if (!session) return null;
  const position = activePosition(session);
  const current = position ? session.exercises[position.exerciseIndex] : null;
  return {
    id: session.id,
    dayLabel: session.dayLabel,
    startedAt: session.startedAt,
    completedSets: countCompletedSets(session),
    plannedSets: countPlannedSets(session),
    exerciseNumber: position ? position.exerciseIndex + 1 : null,
    exerciseCount: session.exercises.length,
    exerciseName: current?.exerciseName ?? null,
    setNumber: position ? position.setIndex + 1 : null,
    setCount: current?.sets.length ?? null,
    finishedExercises: session.exercises
      .filter((exercise, index) => isExerciseSkipped(exercise) || (position ? index < position.exerciseIndex : true))
      .map((exercise) => exercise.exerciseName),
  };
}

/**
 * Which days have been trained, keyed by the label a session was started with.
 *
 * The week board read "6 exercises" for a day whether it had been trained, was
 * being trained right now, or had only ever been written down — so "see the
 * week" could not answer the first question anyone asks of a week, which is what
 * is left in it. The key is the same `Week 1 · Day 05 · Sport Transfer` string
 * the tracker stamps onto a session, so no second identity has to be invented.
 */
export type DayTrainingState = "live" | "trained";

export function trainingStateByDayLabel(sessions = loadDeviceWorkoutSessions()): Record<string, DayTrainingState> {
  const states: Record<string, DayTrainingState> = {};
  for (const session of sessions) {
    if (!session.dayLabel) continue;
    // A session running now outranks one finished earlier on the same day.
    if (session.status === "active") states[session.dayLabel] = "live";
    else if (!states[session.dayLabel]) states[session.dayLabel] = "trained";
  }
  return states;
}

/**
 * How far through a named exercise this session is.
 *
 * Matched on name because the plan holds catalog exercises and the session holds
 * its own copy of them; the name is what both carry. A day with the same
 * exercise twice would match the first, which is the same one the tracker walks
 * to first, so the two surfaces agree even when the answer is imperfect.
 */
export type ExerciseProgress = { completed: number; planned: number; state: "done" | "current" | "todo" | "skipped" };

export function exerciseProgressFor(name: string, sessions = loadDeviceWorkoutSessions()): ExerciseProgress | null {
  const session = sessions.find((entry) => entry.status === "active");
  if (!session) return null;
  const index = session.exercises.findIndex((exercise) => exercise.exerciseName === name);
  if (index < 0) return null;
  const exercise = session.exercises[index];
  const completed = exercise.sets.filter((set) => set.completed).length;
  const position = activePosition(session);
  const state = isExerciseSkipped(exercise)
    ? "skipped"
    : completed >= exercise.sets.length
      ? "done"
      : position?.exerciseIndex === index
        ? "current"
        : "todo";
  return { completed, planned: exercise.sets.length, state };
}

/**
 * Keeps a surface in step with the session without polling.
 *
 * The tracker already announces every checkpoint on `deviceWorkoutHistoryEvent`,
 * because the continuity contract makes it write to storage before it treats an
 * action as saved. `storage` covers the same session open in a second tab.
 */
export function useLiveSession(): LiveSession | null {
  const [live, setLive] = useState<LiveSession | null>(() => summarizeLiveSession());
  useEffect(() => {
    const refresh = () => setLive(summarizeLiveSession());
    refresh();
    window.addEventListener(deviceWorkoutHistoryEvent, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(deviceWorkoutHistoryEvent, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return live;
}
