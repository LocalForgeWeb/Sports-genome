import { loadConventionFor } from "@shared/loadConventions";
import { exercises as catalog } from "./exerciseCatalog";
import { isCompletedSet, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, setWeightUnit, type DeviceSetLog, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { loadSyncedKeys, loadSyncQueue, removeQueuedLiftsForSession, saveSyncQueue } from "./strengthSyncQueue";
import { workoutObservationId } from "./workoutStrengthRecord";
import { dropSetSummary, isDropSet, performedSetLine, setVolume, volumeText } from "./dropSets";
import { swapNote } from "./workoutSwap";
import type { DisplayWeightUnit } from "./weightUnits";

/**
 * What a finished workout's recap shows (Oct 7 brief §5), built from the stored session alone -
 * never from the plan, which may have changed since. The same view model serves the "Workout
 * saved" screen right after finishing and the session detail opened from Progress later, so
 * the two cannot disagree.
 *
 * Counts follow the shared definitions: a completed set is one marked done and not skipped, and a
 * drop set is one set. Load x reps appears only inside a drop set's detail, labelled lb-reps or
 * kg-reps; there is no workout-wide "volume", calorie, effort or score figure.
 */
export type RecapSet = { index: number; set: DeviceSetLog; line: string; detail: string | null; drop: boolean };

export type RecapExercise = {
  id: string;
  name: string;
  catalogId: number | undefined;
  /** "Switched from Sissy Squat after 2 sets", "Added after …", or null. */
  note: string | null;
  completed: number;
  /** Planned sets, when the workout recorded them (finished after Oct 7); null for older records. */
  planned: number | null;
  skipped: number;
  /** Planned sets neither completed nor skipped - untouched, or typed and never logged. */
  unrecorded: number;
  sets: RecapSet[];
};

export type SessionRecap = {
  id: string;
  title: string;
  dayLabel: string;
  completedAt: Date;
  /** Minutes from start to finish, labelled as elapsed: pauses and time away are not modelled. Null when not measurable. */
  elapsedMinutes: number | null;
  exercises: RecapExercise[];
  /** Exercises that ended with nothing completed: skipped, or simply not recorded. */
  notDone: { name: string; plannedSets: number; skipped: boolean }[];
  totals: { exercises: number; workingSets: number };
  note: string;
};

const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));
const byName = new Map(catalog.map((exercise) => [exercise.name, exercise]));

export function sessionRecap(session: DeviceWorkoutSession, fallbackUnit: DisplayWeightUnit): SessionRecap {
  const completedAt = new Date(session.completedAt ?? session.startedAt);
  const started = Date.parse(session.startedAt);
  const finished = session.completedAt ? Date.parse(session.completedAt) : NaN;
  const elapsed = Number.isFinite(started) && Number.isFinite(finished) ? Math.round((finished - started) / 60000) : NaN;
  const exercises = session.exercises.map((exercise): RecapExercise => {
    const catalogEntry = (exercise.catalogId !== undefined ? byId.get(exercise.catalogId) : undefined) ?? byName.get(exercise.exerciseName);
    const convention = loadConventionFor(catalogEntry?.id);
    const done = exercise.sets.map((set, index) => ({ set, index })).filter(({ set }) => isCompletedSet(set));
    // A record from before planned counts were kept still holds any set it left open: those are
    // evidence of the plan, so they count; with none left open the plan is simply unknown.
    const leftOpen = exercise.sets.length - done.length;
    const planned = exercise.plannedSets ?? (leftOpen > 0 ? exercise.sets.length : null);
    const skipped = exercise.skippedSets ?? exercise.sets.filter((set) => set.skipped).length;
    return {
      id: exercise.id,
      name: exercise.exerciseName,
      catalogId: catalogEntry?.id,
      note: swapNote(exercise),
      completed: done.length,
      planned,
      skipped,
      unrecorded: planned === null ? 0 : Math.max(0, planned - done.length - skipped),
      sets: done.map(({ set, index }) => {
        const unit = setWeightUnit(set, session, fallbackUnit);
        const drop = isDropSet(set);
        const volume = drop ? setVolume(set, unit, convention, fallbackUnit) : null;
        return { index, set, line: performedSetLine(set, unit, convention), detail: drop ? `${dropSetSummary(set)}${volume ? ` · ${volumeText(volume)}` : ""}` : null, drop };
      }),
    };
  });
  return {
    id: session.id,
    title: session.title,
    dayLabel: session.dayLabel,
    completedAt,
    // A finish more than a day after the start is a workout left open, not a 26-hour session.
    elapsedMinutes: Number.isFinite(elapsed) && elapsed >= 1 && elapsed <= 24 * 60 ? elapsed : null,
    exercises,
    notDone: (session.notPerformed ?? []).map((item) => ({ name: item.exerciseName, plannedSets: item.plannedSets, skipped: item.skipped })),
    totals: { exercises: exercises.filter((exercise) => exercise.completed > 0).length, workingSets: exercises.reduce((sum, exercise) => sum + exercise.completed, 0) },
    note: session.note ?? "",
  };
}

/** "3 of 4 planned sets · 1 skipped", or "3 sets" for a record that predates planned counts. */
export function exerciseOutcomeLine(exercise: RecapExercise): string {
  const sets = (count: number) => `${count} ${count === 1 ? "set" : "sets"}`;
  if (exercise.planned === null) return sets(exercise.completed);
  const parts = [`${exercise.completed} of ${exercise.planned} planned ${exercise.planned === 1 ? "set" : "sets"}`];
  if (exercise.skipped) parts.push(`${exercise.skipped} skipped`);
  if (exercise.unrecorded) parts.push(`${exercise.unrecorded} not recorded`);
  return parts.join(" · ");
}

/** "52 min elapsed" / "1 h 05 min elapsed". */
export function elapsedText(minutes: number): string {
  if (minutes < 60) return `${minutes} min elapsed`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min elapsed`;
}

/**
 * Corrections to a finished workout, through its recap (R12). Each returns a new session, or the
 * same one when the change cannot apply. A correction never removes a workout's last completed
 * set: that is removing the workout, which Progress does with its own confirmation.
 */
export function correctSet(session: DeviceWorkoutSession, exerciseId: string, setIndex: number, patch: { weight: string; reps: string }, at = new Date().toISOString()): DeviceWorkoutSession {
  const reps = Number(patch.reps);
  const weight = patch.weight.trim() === "" ? 0 : Number(patch.weight);
  if (!Number.isInteger(reps) || reps < 1 || reps > 1000 || !Number.isFinite(weight) || weight < 0) return session;
  let changed = false;
  const exercises = session.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : {
    ...exercise,
    sets: exercise.sets.map((set, index) => {
      if (index !== setIndex || !isCompletedSet(set) || set.type === "drop") return set;
      changed = true;
      return { ...set, weight: patch.weight.trim(), reps: String(reps) };
    }),
  });
  return changed ? { ...session, exercises, correctedAt: at } : session;
}

export function removeSet(session: DeviceWorkoutSession, exerciseId: string, setIndex: number, at = new Date().toISOString()): DeviceWorkoutSession {
  const remaining = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter(isCompletedSet).length, 0);
  if (remaining <= 1) return session;
  let changed = false;
  const exercises = session.exercises
    .map((exercise) => {
      if (exercise.id !== exerciseId || !exercise.sets[setIndex]) return exercise;
      changed = true;
      return { ...exercise, sets: exercise.sets.filter((_, index) => index !== setIndex) };
    })
    .filter((exercise) => exercise.sets.length > 0);
  return changed ? { ...session, exercises, correctedAt: at } : session;
}

/** A workout's own note, trimmed; an empty note removes it. */
export function withNote(session: DeviceWorkoutSession, note: string): DeviceWorkoutSession {
  const trimmed = note.trim().slice(0, 2000);
  if ((session.note ?? "") === trimmed) return session;
  const { note: _previous, ...rest } = session;
  return trimmed ? { ...rest, note: trimmed } : rest;
}

/**
 * Applies a change to one finished workout as stored now, and keeps the account outbox honest:
 * lifts of this workout still waiting to be sent are dropped, so the next sync sends the corrected
 * numbers instead. Lifts already sent stay as they were in the account (its rows are insert-only),
 * which the caller says out loud. Returns the stored session after the change, or null when it is
 * gone or the device refused the write.
 */
export function updateFinishedSession(sessionId: string, change: (session: DeviceWorkoutSession) => DeviceWorkoutSession): { session: DeviceWorkoutSession; alreadySent: boolean } | null {
  const sessions = loadDeviceWorkoutSessions();
  const current = sessions.find((session) => session.id === sessionId && session.status === "completed");
  if (!current) return null;
  const next = change(current);
  if (next === current) return { session: current, alreadySent: false };
  if (!saveDeviceWorkoutSessions(sessions.map((session) => (session.id === sessionId ? next : session)))) return null;
  const correctsLifts = next.exercises !== current.exercises;
  if (correctsLifts) saveSyncQueue(removeQueuedLiftsForSession(loadSyncQueue(), current));
  const sent = new Set(loadSyncedKeys());
  return { session: next, alreadySent: correctsLifts && current.exercises.some((exercise) => sent.has(workoutObservationId(current.id, exercise.id))) };
}
