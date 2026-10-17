import { loadConventionFor } from "@shared/loadConventions";
import { catalogMeasureOf } from "@shared/specialization/holdCatalogIds";
import { exercises as catalog } from "./exerciseCatalog";
import { isCompletedSet, isHoldSet, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, setWeightUnit, type DeviceSetLog, type DeviceWorkoutSession, type SetSide, type StrapsUsed } from "./deviceWorkoutLog";
import { loadSyncedKeys, loadSyncQueue, removeQueuedLiftsForSession, saveSyncQueue } from "./strengthSyncQueue";
import { workoutObservationId } from "./workoutStrengthRecord";
import { dropSetSummary, isDropSet, performedSetLine, setVolume, stageLoadText, volumeText } from "./dropSets";
import { swapNote } from "./workoutSwapRecord";
import type { SetDoseMeasure } from "./setEntryFields";
import type { LoadConvention } from "@shared/loadConventions";
import type { DisplayWeightUnit } from "./weightUnits";
import type { IncomingDraftDay } from "./planImport";

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
export type RecapSet = {
  index: number;
  set: DeviceSetLog;
  /** "185 lb × 5", "30 s", "70 lb × 30 s · Left": what was done, with the arm where it was recorded. */
  line: string;
  detail: string | null;
  drop: boolean;
  /** A hold: its dose is seconds, so a correction edits seconds rather than reps. */
  hold: boolean;
  /** "Left", "Right" or "Both arms", only where the side was recorded. */
  side: string | null;
};

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
  /** "Straps used" / "Straps not used", only where the athlete said. */
  straps: string | null;
  sets: RecapSet[];
};

const sideLabels: Record<SetSide, string> = { left: "Left", right: "Right", both: "Both arms" };
/** "Left", "Right" or "Both arms" for a recorded side; null when none was recorded. */
export function sideLabel(side: SetSide | undefined): string | null {
  return side ? sideLabels[side] ?? null : null;
}

/** What an exercise's straps record says, or null when nothing was recorded. */
export function strapsLabel(straps: StrapsUsed | undefined): string | null {
  return straps === "yes" ? "Straps used" : straps === "no" ? "Straps not used" : null;
}

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

/**
 * What an exercise's sets are measured in, by its catalog id. By default the light list of
 * exercises the atlas measures in seconds (shared/specialization/holdCatalogIds, kept equal to
 * the atlas's variants by a test): this module loads with the app's first screens and does not
 * import the atlas's region data. Every reader here - the recap, the session detail, Correct a
 * set and an exercise's history - reads holds the same way.
 */
export type MeasureOf = (catalogExerciseId: number | undefined) => SetDoseMeasure;

/**
 * Whether a logged set is a hold: it holds seconds, or it is on an exercise measured in seconds and
 * holds no reps (a hold logged before its seconds were required).
 *
 * The rule for reps on a hold (07-logger.md, "Reps logged before stay reps"; the owner can change
 * it): a set of such an exercise that holds reps was logged in reps before the exercise was
 * measured in seconds. It stays a rep set everywhere - its line reads reps, Correct a set edits
 * its reps, the strength record reads it as before - and its reps are never read as seconds.
 */
function isHoldOn(set: DeviceSetLog, measure: SetDoseMeasure | undefined): boolean {
  return isHoldSet(set) || (measure === "seconds" && !set.reps.trim() && !isDropSet(set));
}

/**
 * "40 reps", or "70 lb · 40 reps": a set logged in reps on an exercise now measured in seconds, worded
 * as the live card words it ("Last set: 70 lb · 40 reps"), so it can never be read as 40 seconds.
 */
function repsOnHoldLine(set: DeviceSetLog, unit: DisplayWeightUnit, convention: LoadConvention): string {
  const loaded = set.weight.trim() !== "" && Number(set.weight) > 0;
  const reps = `${set.reps.trim()} ${set.reps.trim() === "1" ? "rep" : "reps"}`;
  return loaded ? `${stageLoadText({ weight: set.weight, unit: set.unit }, unit, convention)} · ${reps}` : reps;
}

/** "Seconds not recorded", or "70 lb · seconds not recorded" with a load: a hold with no time on it. */
function holdWithoutSecondsLine(set: DeviceSetLog, unit: DisplayWeightUnit, convention: LoadConvention): string {
  const loaded = set.weight.trim() !== "" && Number(set.weight) > 0;
  return loaded ? `${stageLoadText({ weight: set.weight, unit: set.unit }, unit, convention)} · seconds not recorded` : "Seconds not recorded";
}

export function sessionRecap(session: DeviceWorkoutSession, fallbackUnit: DisplayWeightUnit, measureOf: MeasureOf = catalogMeasureOf): SessionRecap {
  const completedAt = new Date(session.completedAt ?? session.startedAt);
  const started = Date.parse(session.startedAt);
  const finished = session.completedAt ? Date.parse(session.completedAt) : NaN;
  const elapsed = Number.isFinite(started) && Number.isFinite(finished) ? Math.round((finished - started) / 60000) : NaN;
  const exercises = session.exercises.map((exercise): RecapExercise => {
    const catalogEntry = (exercise.catalogId !== undefined ? byId.get(exercise.catalogId) : undefined) ?? byName.get(exercise.exerciseName);
    const convention = loadConventionFor(catalogEntry?.id);
    const measure = measureOf(catalogEntry?.id ?? exercise.catalogId);
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
      straps: strapsLabel(exercise.straps),
      sets: done.map(({ set, index }) => {
        const unit = setWeightUnit(set, session, fallbackUnit);
        const drop = isDropSet(set);
        const volume = drop ? setVolume(set, unit, convention, fallbackUnit) : null;
        const side = sideLabel(set.side);
        const hold = isHoldOn(set, measure);
        // A hold logged with no seconds says so, rather than "— lb × —"; Correct a set adds them.
        // Reps logged before the exercise was measured in seconds say "reps".
        const performed = hold && !isHoldSet(set) ? holdWithoutSecondsLine(set, unit, convention)
          : !hold && !drop && measure === "seconds" ? repsOnHoldLine(set, unit, convention)
          : performedSetLine(set, unit, convention);
        return { index, set, line: `${performed}${side ? ` · ${side}` : ""}`, detail: drop ? `${dropSetSummary(set)}${volume ? ` · ${volumeText(volume)}` : ""}` : null, drop, hold, side };
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
/**
 * A hold is corrected in seconds and keeps no reps; any other set in reps. Everything else on the
 * set - its side, its unit, its effort, its id - and the exercise's straps record stay as they were.
 *
 * Whether a set is a hold is read from the set and from its exercise's measure (`measureOf`, the
 * light list of holds by default): a set with no reps on an exercise measured in seconds is a hold
 * whose seconds were never typed, so it is corrected in seconds and a reps patch is refused.
 * Seconds never become reps. A set of that exercise logged in reps before it was measured in
 * seconds keeps its reps, and is corrected in reps (`isHoldOn`).
 */
export function correctSet(session: DeviceWorkoutSession, exerciseId: string, setIndex: number, patch: { weight: string; reps?: string; holdSeconds?: string }, at = new Date().toISOString(), measureOf: MeasureOf = catalogMeasureOf): DeviceWorkoutSession {
  const weight = patch.weight.trim() === "" ? 0 : Number(patch.weight);
  if (!Number.isFinite(weight) || weight < 0) return session;
  const wholeIn = (value: string | undefined, max: number) => {
    const parsed = Number((value ?? "").trim());
    return (value ?? "").trim() !== "" && Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : null;
  };
  let changed = false;
  const exercises = session.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : {
    ...exercise,
    sets: exercise.sets.map((set, index) => {
      if (index !== setIndex || !isCompletedSet(set) || set.type === "drop") return set;
      // The exercise as the recap reads it: by the id it kept, else by its name.
      const entry = (exercise.catalogId !== undefined ? byId.get(exercise.catalogId) : undefined) ?? byName.get(exercise.exerciseName);
      if (isHoldOn(set, measureOf(entry?.id ?? exercise.catalogId))) {
        const seconds = wholeIn(patch.holdSeconds, 86_400);
        if (seconds === null) return set;
        changed = true;
        return { ...set, weight: patch.weight.trim(), reps: "", holdSeconds: String(seconds) };
      }
      const reps = wholeIn(patch.reps, 1000);
      if (reps === null) return set;
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

/**
 * Repeat a finished workout (H10): its exercises and their prescriptions as a plan day, for the
 * Save to plan dialog to place in a week and day the athlete chooses. Only the prescription is
 * copied - never a logged weight, a completion, a timestamp or a note - so the copy is future
 * planned work and the history stays the history's. Exercises done in the workout are taken in
 * order, once each (a swap gives the exercise actually done after it); one no longer in the
 * catalog is named in `leftOut` rather than guessed at.
 */
export function repeatDayFrom(session: DeviceWorkoutSession): { day: IncomingDraftDay; leftOut: string[] } {
  const seen = new Set<number>();
  const items: IncomingDraftDay["items"] = [];
  const leftOut: string[] = [];
  for (const exercise of session.exercises) {
    if (!exercise.sets.some(isCompletedSet)) continue;
    const entry = (exercise.catalogId !== undefined ? byId.get(exercise.catalogId) : undefined) ?? byName.get(exercise.exerciseName);
    if (!entry) { leftOut.push(exercise.exerciseName); continue; }
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    items.push({ exercise: entry, prescription: exercise.plannedPrescription });
  }
  const label = session.dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean).pop() || session.title;
  return { day: { label, items, unresolved: [] }, leftOut };
}

export type ExerciseHistoryEntry = { sessionId: string; completedAt: Date; dayName: string; sets: { line: string; detail: string | null }[] };

/**
 * One exercise's past (H07, H08): each finished workout that did it, newest first, with its sets
 * in the units they were logged in. The same identity rule as "Last logged": the catalog ID where
 * both sides kept one, the name only for records older than IDs. Read-only - opening it never
 * puts a value into a workout being logged (H09).
 */
const sameExercise = (target: { exerciseName: string; catalogId?: number }) => (exercise: DeviceWorkoutSession["exercises"][number]) =>
  target.catalogId !== undefined && exercise.catalogId !== undefined ? exercise.catalogId === target.catalogId : exercise.exerciseName === target.exerciseName;

/** How many finished workouts did this exercise: the cheap count, for a screen that redraws every second. */
export function exerciseHistoryCount(target: { exerciseName: string; catalogId?: number }, sessions: readonly DeviceWorkoutSession[], excludeSessionId?: string): number {
  const matches = sameExercise(target);
  return sessions.filter((session) => session.status === "completed" && session.id !== excludeSessionId && session.exercises.some((exercise) => matches(exercise) && exercise.sets.some(isCompletedSet))).length;
}

/**
 * Each set reads as the recap and the session detail read it (`sessionRecap`, with the same
 * measure): a hold in seconds ("30 s", "70 lb × 30 s"), a hold logged without its seconds as
 * "Seconds not recorded", never "— lb × —".
 */
export function exerciseHistory(target: { exerciseName: string; catalogId?: number }, sessions: readonly DeviceWorkoutSession[], fallbackUnit: DisplayWeightUnit, limit = 5, measureOf: MeasureOf = catalogMeasureOf): { entries: ExerciseHistoryEntry[]; total: number } {
  const matches = sameExercise(target);
  const all = sessions
    .filter((session) => session.status === "completed")
    .flatMap((session) => {
      const done = session.exercises.filter((exercise) => matches(exercise) && exercise.sets.some(isCompletedSet));
      if (!done.length) return [];
      const recap = sessionRecap(session, fallbackUnit, measureOf);
      const ids = new Set(done.map((exercise) => exercise.id));
      const sets = recap.exercises.filter((exercise) => ids.has(exercise.id)).flatMap((exercise) => exercise.sets.map((set) => ({ line: set.line, detail: set.detail })));
      const dayName = session.dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean).pop() || session.title;
      return [{ sessionId: session.id, completedAt: recap.completedAt, dayName, sets }];
    })
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  return { entries: all.slice(0, limit), total: all.length };
}
