import { isCompletedSet, isDraftSet, setWeightKg, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { stagesOf } from "@/lib/dropSets";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { isSetEffort } from "@shared/setEffort";
import { variantIdFor } from "@shared/specialization/ids";
import type { BoutSide, ExerciseVariant, ExposureBout, ExposureSegment, SideSource } from "@shared/specialization/types";

/**
 * The workout log as exposure bouts (01-reconciliation.md, adapter map).
 *
 * Logged workouts stay the source of truth: nothing here writes, and every bout points
 * back at the session, exercise and set it came from. A bout is one completed work set of
 * a finished workout; a drop set is one bout whose stages are its segments.
 *
 * The logger is gaining three optional set fields (`side`, `holdSeconds`, `warmup`) and an
 * exercise field (`straps`) in parallel with this file. They are read through the local
 * types below, defensively, so the adapter reads history written before and after them.
 */

type SetWithAtlasFields = DeviceSetLog & { side?: "left" | "right" | "both"; holdSeconds?: string; warmup?: boolean };
type ExerciseWithAtlasFields = DeviceWorkoutExercise & { straps?: "yes" | "no" };

export type SessionBoutDeps = {
  /** The exercise catalog, for sessions logged before catalog ids were recorded. */
  catalog: readonly Pick<Exercise, "id" | "name">[];
  /** Atlas variants (any region's): a two-handed variant makes an unrecorded side bilateral. */
  variants: readonly ExerciseVariant[];
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

/**
 * Where a bout's side comes from, in order: what the athlete recorded on the set; else a
 * two-handed exercise (both arms work every set by definition); else unknown. Unknown is
 * kept as unknown — history logged before sides existed is never guessed onto an arm.
 */
export function sideOf(set: SetWithAtlasFields, variant: ExerciseVariant | null): { side: BoutSide; sideSource: SideSource } {
  const recorded = set.side as string | undefined;
  if (recorded === "left" || recorded === "right") return { side: recorded, sideSource: "recorded" };
  if (recorded === "both" || recorded === "bilateral") return { side: "bilateral", sideSource: "recorded" };
  if (variant?.laterality === "bilateral") return { side: "bilateral", sideSource: "structural" };
  return { side: "unknown", sideSource: "unknown" };
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

function baseBout(session: DeviceWorkoutSession, exercise: ExerciseWithAtlasFields, deps: SessionBoutDeps, variantOf: (id: number | null) => ExerciseVariant | null) {
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
    variant: variantOf(catalogExerciseId),
  };
}

function boutFromSet(session: DeviceWorkoutSession, exercise: ExerciseWithAtlasFields, set: SetWithAtlasFields, index: number, deps: SessionBoutDeps, variantOf: (id: number | null) => ExerciseVariant | null): ExposureBout {
  const { variant, ...base } = baseBout(session, exercise, deps, variantOf);
  const id = set.id || `${session.id}/${exercise.id}/${index}`;
  return {
    ...base,
    id,
    ...sideOf(set, variant),
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
  const variantOf = variantLookup(deps.variants);
  const bouts: ExposureBout[] = [];
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    for (const exercise of session.exercises as ExerciseWithAtlasFields[]) {
      exercise.sets.forEach((set, index) => {
        if (isCompletedSet(set)) bouts.push(boutFromSet(session, exercise, set as SetWithAtlasFields, index, deps, variantOf));
      });
    }
  }
  return bouts;
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
  const variantOf = variantLookup(deps.variants);
  const out: ExposureBout[] = [];
  const excluded = (session: DeviceWorkoutSession, exercise: ExerciseWithAtlasFields, set: SetWithAtlasFields, id: string): ExposureBout => {
    const { variant, ...base } = baseBout(session, exercise, deps, variantOf);
    return { ...base, id, ...sideOf(set, variant), warmup: false, effort: null, kind: "standard", segments: [{ id, reps: null, loadKg: null, holdSeconds: null }], excluded: "not_completed" };
  };
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
