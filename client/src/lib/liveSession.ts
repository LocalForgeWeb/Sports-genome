import { useEffect, useState } from "react";
import {
  activePosition,
  countCompletedSets,
  countPlannedSets,
  deviceWorkoutHistoryEvent,
  deviceWorkoutHistoryKey,
  loadDeviceWorkoutSessions,
  isCompletedWorkout,
  isExerciseSkipped,
} from "@/lib/deviceWorkoutLog";
import { slotOfDayLabel } from "@/lib/nextWorkout";
import { startOfTrainingWeek } from "@/lib/trainingWeekSummary";

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
 * Which days have been trained this week, keyed by the label a session was started with.
 *
 * The week board read "6 exercises" for a day whether it had been trained, was
 * being trained right now, or had only ever been written down — so "see the
 * week" could not answer the first question anyone asks of a week, which is what
 * is left in it. The key is the same `Week 1 · Day 05 · Sport Transfer` string
 * the tracker stamps onto a session, so no second identity has to be invented.
 *
 * A label carries the plan's week, not a date, so an athlete repeating Week 1
 * trains the same labels again. A finish counts only from Monday of this week,
 * the same rule Home's week strip reads (summarizeAthleteRecord), so a day done
 * weeks ago is not "Trained" here while Home calls it next up.
 */
export type DayTrainingState = "live" | "trained";

export function trainingStateByDayLabel(sessions = loadDeviceWorkoutSessions(), now: Date = new Date()): Record<string, DayTrainingState> {
  const weekStart = startOfTrainingWeek(now);
  const states: Record<string, DayTrainingState> = {};
  for (const session of sessions) {
    if (!session.dayLabel) continue;
    // A session running now outranks one finished earlier on the same day.
    if (session.status === "active") states[session.dayLabel] = "live";
    // A finish with nothing logged did not train the day.
    else if (!states[session.dayLabel] && isCompletedWorkout(session)) {
      const marker = new Date(session.completedAt ?? session.startedAt);
      if (!Number.isNaN(marker.getTime()) && marker >= weekStart) states[session.dayLabel] = "trained";
    }
  }
  return states;
}

/**
 * Plan days by slot ("Day 02 · Pull"): running now, or finished this calendar week.
 *
 * `trainingStateByDayLabel` above never looks at dates, so Plan's tabs said "Trained" for a day
 * finished weeks ago while Home's strip, which counts this week, said it was still to do (Sep 28
 * regression brief §5). This reads the same rule as Home (nextWorkout.ts slotsDoneThisWeek): the
 * week starts Monday 00:00 local, a finish with nothing logged is not a workout, and a session
 * counts for the slot it was started from whichever plan week that was.
 */
export function trainingStateBySlot(sessions = loadDeviceWorkoutSessions(), now: Date = new Date()): Record<string, DayTrainingState> {
  const weekStart = startOfTrainingWeek(now);
  const states: Record<string, DayTrainingState> = {};
  for (const session of sessions) {
    if (!session.dayLabel) continue;
    const slot = slotOfDayLabel(session.dayLabel);
    if (session.status === "active") { states[slot] = "live"; continue; }
    const finished = new Date(session.completedAt ?? session.startedAt);
    if (!states[slot] && isCompletedWorkout(session) && !Number.isNaN(finished.getTime()) && finished >= weekStart) states[slot] = "trained";
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
 * Whether two summaries say the same thing. Compared whole rather than field by
 * field, so a field added to LiveSession later cannot be left out of the check
 * and quietly stop a surface updating. Both sides come from the one literal in
 * summarizeLiveSession, so their keys are always in the same order.
 */
export function sameLiveSession(a: LiveSession | null, b: LiveSession | null): boolean {
  return a === b || (a !== null && b !== null && JSON.stringify(a) === JSON.stringify(b));
}

/**
 * Keeps a surface in step with the session without polling.
 *
 * The tracker already announces every checkpoint on `deviceWorkoutHistoryEvent`,
 * because the continuity contract makes it write to storage before it treats an
 * action as saved. `storage` covers the same session open in a second tab.
 *
 * Most of those checkpoints change nothing a summary shows (every keystroke in a
 * weight box is one, and so is every return to the app), so an unchanged summary
 * keeps the object it had and whoever reads it does not render again.
 */
export function useLiveSession(): LiveSession | null {
  const [live, setLive] = useState<LiveSession | null>(() => summarizeLiveSession());
  useEffect(() => {
    const refresh = () => setLive((previous) => {
      const next = summarizeLiveSession();
      return sameLiveSession(previous, next) ? previous : next;
    });
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

/**
 * A count of saves to the workout log, for a reader that parses the log once
 * and keys that parse on the count.
 *
 * useLiveSession keeps its summary through a save that changes nothing the
 * summary shows, such as a weight typed into a set. So the summary's identity
 * says the summary changed, not that the log did, and a parse keyed on it keeps
 * the log as it was before that save. The count moves on every save in this
 * tab and on every change another tab makes to the log.
 *
 * Every keystroke in the tracker's weight box is a save, and each move of the
 * count renders whoever holds it, so it counts only while `listening`. While
 * not listening it is null, so a reader keyed on it parses the log again as
 * soon as it listens again, rather than keeping a copy from before the gap.
 */
export function useWorkoutLogWrites(listening: boolean): number | null {
  const [writes, setWrites] = useState(0);
  useEffect(() => {
    if (!listening) return;
    const count = () => setWrites((current) => current + 1);
    const countLogChange = (event: StorageEvent) => {
      // A null key is another tab clearing its storage, the log with it.
      if (event.key === null || event.key === deviceWorkoutHistoryKey) count();
    };
    window.addEventListener(deviceWorkoutHistoryEvent, count);
    window.addEventListener("storage", countLogChange);
    return () => {
      window.removeEventListener(deviceWorkoutHistoryEvent, count);
      window.removeEventListener("storage", countLogChange);
    };
  }, [listening]);
  return listening ? writes : null;
}

function sameDayTrainingStates(left: Record<string, DayTrainingState>, right: Record<string, DayTrainingState>) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

/**
 * Keeps the Plan's day strip in step with the workout log.
 *
 * It used to be recomputed only when the live session changed. With no workout
 * running, removing a finished one from Progress left the live session null
 * before and after, so nothing reran and the Plan went on calling the day
 * "Trained" while Home's week strip already had it as not done. It now listens
 * to the log itself, like every other reader of it; `focus` also picks up a
 * new week starting while the app sat open.
 */
export function useDayTrainingStates(): Record<string, DayTrainingState> {
  // Keyed by slot ("Day 02 · Pull"), whatever plan week the session named: a day trained this
  // calendar week is done in every plan week (Sep 28 regression brief §5; trainingStateBySlot).
  const [states, setStates] = useState<Record<string, DayTrainingState>>(() => trainingStateBySlot());
  useEffect(() => {
    const refresh = () => {
      const next = trainingStateBySlot();
      // Every tracker checkpoint announces itself; most change no day's state.
      setStates((current) => (sameDayTrainingStates(current, next) ? current : next));
    };
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
  return states;
}
