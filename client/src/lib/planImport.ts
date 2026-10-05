import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { getExerciseSettings } from "@/lib/workoutPlanner";
import type { ImportedRoutineContext } from "@/components/StackImportPanel";
import type { DayRecord } from "@/lib/trainingDayPlan";
import { formatPrescription, parsePrescription } from "@/lib/setPrescription";
import { exercises as catalog } from "@/lib/exerciseCatalog";
import type { ShareSnapshot } from "@shared/workoutShare";

/**
 * Putting someone else's workout into your plan: a pasted one or a shared link.
 *
 * Both arrive as days of exercises with their own planned prescription, RPE, rest and
 * note, and both land the same way: into a day the athlete chose, after what is
 * already there unless they asked to replace it. The old paste replaced the day it
 * landed on, said so afterwards in a toast, and filled every missing RPE and rest
 * with "RPE 7" and "90 sec" - values nobody had written.
 */
export type IncomingItem = { exercise: Exercise; prescription: string; rpe?: string; rest?: string; notes?: string };
export type IncomingDay = { label: string; items: IncomingItem[]; context?: ImportedRoutineContext[] };
/** An entry that names an exercise this catalog does not hold: kept by name until the athlete resolves it. */
export type UnresolvedItem = { key: string; name: string; prescription: string; rpe?: string; rest?: string; notes?: string; candidates: Exercise[] };
export type IncomingDraftDay = { label: string; items: IncomingItem[]; unresolved: UnresolvedItem[]; context?: ImportedRoutineContext[] };
export type DayWriteMode = "append" | "replace";

const catalogIdOf = (exercise: Exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id;

/** The settings a row is saved with: what was given, and the app's own default for anything that was not. */
function settingsFor(item: IncomingItem): ExerciseSettings | null {
  if (!item.rpe && !item.rest && !item.notes) return null;
  const defaults = getExerciseSettings({}, 0);
  return { ...defaults, rpe: item.rpe || defaults.rpe, rest: item.rest || defaults.rest, notes: item.notes || "", completed: false };
}

/**
 * One incoming day written into one existing day.
 *
 * Append keeps everything already there and adds the new exercises after it, in
 * their order; an exercise the day already has is not added twice (the app keeps
 * one of each per day) and is reported back. Replace keeps only the incoming day.
 * A prescription is written only when one was given; otherwise the row shows the
 * plan's own default, exactly as an exercise added from the catalog does.
 */
export function writeIncomingDay(existing: DayRecord, day: IncomingDay, mode: DayWriteMode): { record: DayRecord; added: Exercise[]; alreadyThere: Exercise[] } {
  const base: DayRecord = mode === "replace" ? { workout: [], prescriptions: {}, settings: {}, context: [] } : existing;
  const present = new Set(base.workout.map(catalogIdOf));
  const added: Exercise[] = [];
  const alreadyThere: Exercise[] = [];
  const prescriptions = { ...base.prescriptions };
  const settings = { ...base.settings };
  for (const item of day.items) {
    const id = catalogIdOf(item.exercise);
    if (present.has(id)) { if (!added.some((exercise) => catalogIdOf(exercise) === id)) alreadyThere.push(item.exercise); continue; }
    present.add(id);
    added.push(item.exercise);
    if (item.prescription.trim()) prescriptions[item.exercise.id] = item.prescription.trim();
    const saved = settingsFor(item);
    if (saved) settings[item.exercise.id] = saved;
  }
  return {
    record: { workout: [...base.workout, ...added], prescriptions, settings, context: [...base.context, ...(day.context ?? [])] },
    added,
    alreadyThere,
  };
}

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Close catalog names for an exercise this catalog does not hold, for the athlete to choose from. */
export function nameCandidates(name: string, limit = 5): Exercise[] {
  const wanted = normalise(name);
  const tokens = wanted.split(" ").filter((token) => token.length > 2);
  return catalog
    .map((exercise) => {
      const candidate = normalise(exercise.name);
      const overlap = tokens.filter((token) => candidate.includes(token)).length;
      return { exercise, score: candidate === wanted ? 100 : candidate.includes(wanted) || wanted.includes(candidate) ? 70 : tokens.length ? Math.round((overlap / tokens.length) * 60) : 0 };
    })
    .filter((entry) => entry.score >= 30)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, limit)
    .map((entry) => entry.exercise);
}

/** A prescription as the editor stores it ("3 × 10/8/6" keeps its per-set form). */
export function storedPrescription(value: string): string {
  const trimmed = value.trim();
  if (!/^\d+\s*(?:×|x)\s*\S/i.test(trimmed)) return "";
  return formatPrescription(parsePrescription(trimmed).sets, /\//.test(trimmed));
}

/**
 * A shared snapshot as days to save. Each exercise is found by the catalog id it was
 * shared with; failing that, by its exact name (an older record); failing
 * both, it stays by name, with its prescription, until the athlete chooses what to
 * do - it is never dropped and never swapped for another exercise silently.
 */
export function draftDaysFromSnapshot(snapshot: ShareSnapshot): IncomingDraftDay[] {
  return snapshot.days.map((day) => {
    const items: IncomingItem[] = [];
    const unresolved: UnresolvedItem[] = [];
    day.exercises.forEach((entry) => {
      // The canonical id first (a renamed catalog entry is still the same exercise); an older
      // record without one, or with an id this catalog lacks, by its exact name.
      const byId = entry.catalogId != null ? catalog.find((exercise) => exercise.id === entry.catalogId) : undefined;
      const exercise = byId ?? catalog.find((exercise) => normalise(exercise.name) === normalise(entry.name));
      const fields = { prescription: storedPrescription(entry.prescription), rpe: entry.rpe || undefined, rest: entry.rest || undefined, notes: entry.notes || undefined };
      if (exercise) items.push({ exercise, ...fields });
      else unresolved.push({ key: `${day.order}-${entry.order}`, name: entry.name, ...fields, candidates: nameCandidates(entry.name) });
    });
    return { label: day.label, items, unresolved };
  });
}
