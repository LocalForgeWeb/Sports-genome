import { displayWeightToKilograms, type DisplayWeightUnit } from "@/lib/weightUnits";
import { bodyWeightKgAt, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { resolveStrengthObservationRoute, strengthRegionIdsForCatalogMuscles } from "../../../shared/strengthGenomeDefinitions";

/**
 * Carries a finished workout into the Strength Genome.
 *
 * Until now the two lived apart: the tracker wrote sessions to this device and
 * the Strength Genome only ever read lifts typed into its own form, so an
 * athlete could log a whole leg day and still be told they had no record for
 * legs. A set you actually did is the best observation the app has — it just
 * has to be carried across as what it is.
 *
 * What it is: a working set, not a test. Everything here keeps that boundary.
 * A set becomes a MULTI_REP observation with the load and reps as recorded,
 * marked as coming from a workout, and nothing infers a maximum, a tier, or a
 * rank from it. Sets that were skipped, or typed but never logged, were already
 * dropped at finalization and never arrive here.
 */
export type WorkoutStrengthObservation = {
  id: string;
  exerciseName: string;
  observedAt: string;
  measurementType: "MULTI_REP";
  loadKg?: number;
  repetitions?: number;
  /** Where the athlete saw this happen, so the record can say so. */
  sessionLabel: string;
  sessionId: string;
  /** How many sets of this exercise the session recorded, of which this is the heaviest. */
  setCount: number;
  /**
   * The athlete's body mass on the day of this session, stamped here so a later
   * weight change cannot rewrite what this lift was measured against.
   */
  bodyMassKgAtTest?: number;
  source: "workout";
};

const catalogByName = new Map(exerciseCatalog.map((exercise) => [exercise.name.trim().toLowerCase(), exercise]));

/**
 * Where a logged exercise belongs on the body map. The reviewed alias routes
 * answer first because they were written deliberately; anything they do not
 * name falls back to the catalog's own primary muscles, which is the same
 * classification the catalog already shows on the exercise itself.
 *
 * Primary muscles only. Secondary muscles would light up nearly every region
 * for nearly every lift — `abs` alone is listed on 222 catalog exercises — and
 * a body map where everything is covered says nothing.
 */
export function strengthRegionIdsForExerciseName(exerciseName: string): string[] {
  const route = resolveStrengthObservationRoute(exerciseName);
  if (route) return route.regionIds;
  const exercise = catalogByName.get(exerciseName.trim().toLowerCase());
  return exercise ? strengthRegionIdsForCatalogMuscles(exercise.primaryMuscles) : [];
}

function numeric(value: string | undefined) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * One observation per exercise per finished session: the heaviest set that was
 * actually logged, tie-broken by reps. A session is a single training event, so
 * collapsing it this way keeps 33 logged sets from arriving as 33 entries in a
 * record meant to be read at a glance — while still recording every exercise
 * the athlete trained.
 */
export function workoutStrengthObservations(
  sessions: readonly DeviceWorkoutSession[],
  weightUnit: DisplayWeightUnit = "lb",
  bodyWeightLog: readonly BodyWeightEntry[] = [],
): WorkoutStrengthObservation[] {
  const observations: WorkoutStrengthObservation[] = [];
  sessions.filter((session) => session.status === "completed").forEach((session) => {
    const observedAt = session.completedAt || session.startedAt;
    // Read once per session, at the session's own date — not at today's.
    const bodyMassKgAtTest = bodyWeightKgAt(bodyWeightLog, observedAt);
    session.exercises.forEach((exercise) => {
      const logged = exercise.sets
        .filter((set) => set.completed && !set.skipped)
        .map((set) => ({ weight: numeric(set.weight), reps: numeric(set.reps) }))
        .filter((set) => set.reps !== undefined);
      if (!logged.length) return;
      const best = logged.reduce((leader, set) => {
        const leaderWeight = leader.weight ?? 0;
        const setWeight = set.weight ?? 0;
        if (setWeight !== leaderWeight) return setWeight > leaderWeight ? set : leader;
        return (set.reps ?? 0) > (leader.reps ?? 0) ? set : leader;
      });
      observations.push({
        id: `workout-${session.id}-${exercise.id}`,
        exerciseName: exercise.exerciseName,
        observedAt,
        measurementType: "MULTI_REP",
        loadKg: best.weight === undefined ? undefined : displayWeightToKilograms(best.weight, weightUnit),
        repetitions: best.reps,
        sessionLabel: session.dayLabel || session.title,
        sessionId: session.id,
        setCount: logged.length,
        bodyMassKgAtTest,
        source: "workout",
      });
    });
  });
  return observations.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
}

/** Whether any observation in the record belongs to this region. */
export function regionHasRecordedWork(regionId: string, exerciseNames: readonly string[]): boolean {
  return exerciseNames.some((name) => strengthRegionIdsForExerciseName(name).includes(regionId));
}
