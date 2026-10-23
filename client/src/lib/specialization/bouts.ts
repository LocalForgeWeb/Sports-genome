import { isCompletedSet, isDraftSet, setWeightKg, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { stagesOf } from "@/lib/dropSets";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { isSetEffort } from "@shared/setEffort";
import { variantIdFor } from "@shared/specialization/ids";
import type { ExerciseVariant, ExposureBout, ExposureSegment, LimbSideRecord } from "@shared/specialization/types";

/**
 * The workout log as exposure bouts (01-reconciliation.md, adapter map).
 *
 * Logged workouts stay the source of truth: nothing here writes, and every bout points
 * back at the session, exercise and set it came from. A bout is one completed work set of
 * a finished workout; a drop set is one bout whose stages are its segments.
 *
 * A bout carries each limb's side exactly as the set recorded it, and nothing more: which side
 * a region counts the work on depends on the region, the exercise and the mapping, and the
 * calculator decides it (`nodeSideFor`, 10-multi-region.md §2.1). The atlas's set fields (`side`,
 * `legSide`, `holdSeconds`, `warmup`) and the exercise's `straps` are read defensively, so the
 * adapter reads history written before and after them.
 */

type SetWithAtlasFields = DeviceSetLog & { holdSeconds?: string; warmup?: boolean };
type ExerciseWithAtlasFields = DeviceWorkoutExercise & { straps?: "yes" | "no" };

export type SessionBoutDeps = {
  /** The exercise catalog, for sessions logged before catalog ids were recorded. */
  catalog: readonly Pick<Exercise, "id" | "name">[];
  /**
   * Not read. Sides are no longer settled here from the variant (the calculator reads each
   * region's), so a bout needs no variants; callers that still pass them need no change.
   */
  variants?: readonly ExerciseVariant[];
  /** The unit a set with no stamp of its own, in a session with none, was typed in. */
  fallbackUnit: DisplayWeightUnit;
};

// The same rule the tracker uses (DeviceWorkoutTracker `catalogByName`): the exact name,
// and where two catalog rows share a name, the later one. Never fuzzy.
const nameIndexes = new WeakMap<readonly Pick<Exercise, "id" | "name">[], Map<string, number>>();
function catalogIdByName(catalog: readonly Pick<Exercise, "id" | "name">[], name: string): number | undefined {
  let index = nameIndexes.get(catalog);
  if (!index) {
    index = new Map(catalog.map((exercise) => [exercise.name, exercise.id] as const));
    nameIndexes.set(catalog, index);
  }
  return index.get(name);
}

const variantIndexes = new WeakMap<readonly ExerciseVariant[], Map<number, ExerciseVariant>>();
/** The default variant (`cat-<id>`) for a catalog exercise, else the first one listed. */
export function variantLookup(variants: readonly ExerciseVariant[]): (catalogExerciseId: number | null) => ExerciseVariant | null {
  let index = variantIndexes.get(variants);
  if (!index) {
    index = new Map();
    for (const variant of variants) {
      const existing = index.get(variant.catalogExerciseId);
      if (!existing || (existing.id !== variantIdFor(variant.catalogExerciseId) && variant.id === variantIdFor(variant.catalogExerciseId))) index.set(variant.catalogExerciseId, variant);
    }
    variantIndexes.set(variants, index);
  }
  const found = index;
  return (catalogExerciseId) => (catalogExerciseId === null ? null : found.get(catalogExerciseId) ?? null);
}

/** The catalog exercise behind a logged exercise: its recorded id, else an exact name match, else none. */
export function resolveCatalogExercise(exercise: Pick<DeviceWorkoutExercise, "catalogId" | "exerciseName">, catalog: SessionBoutDeps["catalog"]): { catalogExerciseId: number | null; matchedBy: "id" | "name" | "none" } {
  if (typeof exercise.catalogId === "number" && Number.isFinite(exercise.catalogId)) return { catalogExerciseId: exercise.catalogId, matchedBy: "id" };
  const byName = catalogIdByName(catalog, exercise.exerciseName);
  return byName === undefined ? { catalogExerciseId: null, matchedBy: "none" } : { catalogExerciseId: byName, matchedBy: "name" };
}

/** A typed count ("8", " 12 ") as a number; anything else (blank, "AMRAP", negative) as null. */
function countOf(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Seconds held, when the athlete logged them; zero or blank is not a hold. */
export function holdSecondsOf(set: SetWithAtlasFields): number | null {
  const seconds = countOf(set.holdSeconds);
  return seconds !== null && seconds > 0 ? seconds : null;
}

/** One limb's side as a set stored it (`left`, `right`, `both`; `bilateral` as older imports wrote both), else null. */
function recordedSide(value: unknown): LimbSideRecord | null {
  if (value === "left" || value === "right" || value === "both") return { side: value, source: "recorded" };
  if (value === "bilateral") return { side: "both", source: "recorded" };
  return null;
}

/**
 * The sides a set recorded, each limb in its own field: the arm's (`side`) and the leg's
 * (`legSide`). Nothing is guessed: a side not recorded stays null, and history logged before
 * sides existed is never put on a side here (10-multi-region.md §2.1).
 */
export function recordedSidesOf(set: Pick<SetWithAtlasFields, "side" | "legSide">): Pick<ExposureBout, "armSide" | "legSide"> {
  return { armSide: recordedSide(set.side), legSide: recordedSide(set.legSide) };
}

function segmentsOf(set: SetWithAtlasFields, boutId: string, session: DeviceWorkoutSession, fallbackUnit: DisplayWeightUnit): ExposureSegment[] {
  const stages = stagesOf(set);
  const isDrop = set.type === "drop" && (set.stages?.length ?? 0) > 0;
  const hold = holdSecondsOf(set);
  return stages.map((stage, index) => ({
    // A drop stage keeps its own stable id where its set has one; a standard set is its own only segment.
    id: isDrop && set.id && stage.id ? stage.id : stages.length === 1 ? boutId : `${boutId}#${index + 1}`,
    reps: countOf(stage.reps),
    loadKg: setWeightKg({ weight: stage.weight, unit: stage.unit ?? set.unit }, session, fallbackUnit) ?? null,
    holdSeconds: index === 0 ? hold : null,
  }));
}

function baseBout(session: DeviceWorkoutSession, exercise: ExerciseWithAtlasFields, deps: SessionBoutDeps) {
  const { catalogExerciseId, matchedBy } = resolveCatalogExercise(exercise, deps.catalog);
  const straps: ExposureBout["straps"] = exercise.straps === "yes" || exercise.straps === "no" ? exercise.straps : "unknown";
  return {
    mode: "completed" as const,
    // A finished workout belongs to the window holding the moment it was finished.
    performedAt: session.completedAt ?? session.startedAt,
    sessionId: session.id,
    sessionLabel: session.dayLabel || session.title,
    planWeek: null,
    dayKey: null,
    exerciseEntryId: exercise.id,
    catalogExerciseId,
    exerciseName: exercise.exerciseName,
    matchedBy,
    straps,
  };
}

function boutFromSet(session: DeviceWorkoutSession, exercise: ExerciseWithAtlasFields, set: SetWithAtlasFields, index: number, deps: SessionBoutDeps): ExposureBout {
  const id = set.id || `${session.id}/${exercise.id}/${index}`;
  return {
    ...baseBout(session, exercise, deps),
    id,
    ...recordedSidesOf(set),
    warmup: set.warmup === true,
    effort: isSetEffort(set.effort) ? set.effort : null,
    kind: set.type === "drop" && (set.stages?.length ?? 0) >= 2 ? "drop" : "standard",
    segments: segmentsOf(set, id, session, deps.fallbackUnit),
  };
}

/**
 * Completed work sets of finished workouts, one bout each. A set swapped away mid-workout
 * stays under the exercise it was done on (the swap keeps it there), so the original
 * exercise's mapping credits it and the replacement's credits only what was done on it.
 */
export function boutsFromSessions(sessions: readonly DeviceWorkoutSession[], deps: SessionBoutDeps): ExposureBout[] {
  const bouts: ExposureBout[] = [];
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    for (const exercise of session.exercises as ExerciseWithAtlasFields[]) {
      exercise.sets.forEach((set, index) => {
        if (isCompletedSet(set)) bouts.push(boutFromSet(session, exercise, set as SetWithAtlasFields, index, deps));
      });
    }
  }
  return bouts;
}

// ---------------------------------------------------------------- what the adapter read but no page counts (11 §7.1)

/** Sets of one exercise the app could not identify: no catalog id recorded and no exact name match. */
export type UnidentifiedExercise = { exerciseName: string; sets: number; boutIds: string[] };
/** A set id that arrived more than once with different values: the first is counted, as the calculator reads it. */
export type ConflictingDuplicate = { boutId: string; exerciseName: string; copies: number };
export type AdapterNotes = { unidentified: UnidentifiedExercise[]; conflictingDuplicates: ConflictingDuplicate[] };

/** A record's values in a fixed key order, so two copies of one set compare equal whatever order their fields were written in. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * The two lists "How this is counted" names once on every region's page (11 §7.1), from the
 * adapter's bouts, never from a summary (so no summary and no golden number changes):
 * - **sets the app could not identify**: completed work sets (not warm-ups, not excluded) whose
 *   exercise has no catalog id and no exact name match. No page counts them; they are listed, by
 *   the name the athlete logged, so a set is never silently invisible;
 * - **conflicting duplicates**: a set id that arrived twice with different values (only an import
 *   can produce one; device data writes one record per set id). The first is counted, as the
 *   calculator reads it; the same set delivered twice with the same values is not listed.
 * `interval`, when given, keeps the sets whose first record was performed in it (start included,
 * end excluded), as the page's window does.
 */
export function adapterNotesFor(bouts: readonly ExposureBout[], interval?: { startAt: string | null; endAtExclusive: string | null }): AdapterNotes {
  const first = new Map<string, { bout: ExposureBout; text: string; copies: number; differs: boolean }>();
  for (const bout of bouts) {
    const text = canonical(bout);
    const seen = first.get(bout.id);
    if (!seen) first.set(bout.id, { bout, text, copies: 1, differs: false });
    else {
      seen.copies += 1;
      seen.differs ||= seen.text !== text;
    }
  }
  const inWindow = (bout: ExposureBout) => {
    if (!interval) return true;
    if (bout.mode !== "completed" || !bout.performedAt) return false;
    const at = Date.parse(bout.performedAt);
    if (!Number.isFinite(at)) return false;
    if (interval.startAt !== null && at < Date.parse(interval.startAt)) return false;
    return interval.endAtExclusive === null || at < Date.parse(interval.endAtExclusive);
  };
  const byName = new Map<string, UnidentifiedExercise>();
  const conflictingDuplicates: ConflictingDuplicate[] = [];
  for (const { bout, copies, differs } of Array.from(first.values())) {
    if (!inWindow(bout)) continue;
    if (differs) conflictingDuplicates.push({ boutId: bout.id, exerciseName: bout.exerciseName, copies });
    if (bout.mode !== "completed" || bout.excluded || bout.warmup || bout.catalogExerciseId !== null || bout.matchedBy !== "none") continue;
    const name = bout.exerciseName.trim() || bout.exerciseName;
    const entry = byName.get(name) ?? { exerciseName: name, sets: 0, boutIds: [] };
    entry.sets += 1;
    entry.boutIds.push(bout.id);
    byName.set(name, entry);
  }
  return {
    unidentified: Array.from(byName.values()).sort((a, b) => b.sets - a.sets || a.exerciseName.localeCompare(b.exerciseName)),
    conflictingDuplicates: conflictingDuplicates.sort((a, b) => a.boutId.localeCompare(b.boutId, "en", { numeric: true })),
  };
}

/**
 * Records that are NOT work, passed to the calculator only so its completeness can say what
 * was left out (`excluded: "not_completed"`); they are never credited:
 * - skipped sets, and sets typed but never logged, in finished workouts (finishing keeps
 *   only completed sets, so skips survive as the `skippedSets` stamp or as a fully skipped
 *   exercise in `notPerformed`);
 * - logged sets of a workout that is not finished yet: they count once it is.
 */
export function excludedRecordsFromSessions(sessions: readonly DeviceWorkoutSession[], deps: SessionBoutDeps): ExposureBout[] {
  const out: ExposureBout[] = [];
  const excluded = (session: DeviceWorkoutSession, exercise: ExerciseWithAtlasFields, set: SetWithAtlasFields, id: string): ExposureBout => (
    { ...baseBout(session, exercise, deps), id, ...recordedSidesOf(set), warmup: false, effort: null, kind: "standard", segments: [{ id, reps: null, loadKg: null, holdSeconds: null }], excluded: "not_completed" }
  );
  const blank: SetWithAtlasFields = { weight: "", reps: "", completed: false };
  for (const session of sessions) {
    for (const exercise of session.exercises as ExerciseWithAtlasFields[]) {
      let presentSkips = 0;
      exercise.sets.forEach((set, index) => {
        const id = `${set.id || `${session.id}/${exercise.id}/${index}`}`;
        if (session.status !== "completed") {
          if (isCompletedSet(set)) out.push(excluded(session, exercise, set as SetWithAtlasFields, id));
          return;
        }
        if (isCompletedSet(set)) return;
        if (set.skipped) presentSkips += 1;
        if (set.skipped || isDraftSet(set)) out.push(excluded(session, exercise, set as SetWithAtlasFields, id));
      });
      if (session.status === "completed") {
        for (let n = presentSkips; n < (exercise.skippedSets ?? 0); n += 1) out.push(excluded(session, exercise, blank, `${session.id}/${exercise.id}/skipped-${n + 1}`));
      }
    }
    if (session.status !== "completed") continue;
    (session.notPerformed ?? []).forEach((item, itemIndex) => {
      if (!item.skipped) return;
      const exercise: ExerciseWithAtlasFields = { id: `not-performed-${itemIndex}`, exerciseName: item.exerciseName, ...(item.catalogId !== undefined ? { catalogId: item.catalogId } : {}), plannedPrescription: "", sets: [] };
      for (let n = 0; n < item.plannedSets; n += 1) out.push(excluded(session, exercise, blank, `${session.id}/not-performed/${itemIndex}/${n + 1}`));
    });
  }
  return out;
}
