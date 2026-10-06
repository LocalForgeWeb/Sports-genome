import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { bodyWeightKgAt, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { setWeightKg, setWeightUnit, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { estimateOneRepMaxKg } from "@shared/oneRepMaxEstimation";
import { loadConventionFor, type LoadConvention } from "@shared/loadConventions";
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
  /** The weight exactly as it was typed, and the unit it was typed in - what is sent to the account. */
  reportedLoad?: number;
  reportedUnit?: DisplayWeightUnit;
  /**
   * What the weight means for this exercise under the scoring policy - one dumbbell, the pair's
   * bar, the stack, or load added to a bodyweight movement - sent with the lift (EN-07, EN-09).
   */
  loadSemantics: LoadConvention | "additional_load";
  repetitions?: number;
  /** Where the athlete saw this happen, so the record can say so. */
  sessionLabel: string;
  sessionId: string;
  /** How many sets of this exercise the session recorded, of which this is the strongest by estimated 1RM. */
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

/**
 * How centrally a logged exercise measures one region.
 *
 * A route's `regionIds` is written primary-first and always has been: a squat reads
 * `["quadriceps", "glutes", "hamstrings"]`, a bench `["chest", "triceps", "shoulders"]`,
 * a lat pulldown `["lats", "upper_back", "biceps"]`. So the position already says whether
 * this region is what the test is about or something the test happens to involve, and the
 * count says how thinly the lift is spread across regions. The catalog fallback lists
 * primary muscles, which carries the same meaning.
 *
 * Lower is more direct, so these sort ascending. A lift that does not reach the region at
 * all sorts last rather than first, which is what an unfound index would otherwise do.
 */
export type RegionRelevance = { position: number; breadth: number };

export function regionRelevanceForExerciseName(exerciseName: string, regionId: string): RegionRelevance {
  const regionIds = strengthRegionIdsForExerciseName(exerciseName);
  const position = regionIds.indexOf(regionId);
  return { position: position < 0 ? Number.MAX_SAFE_INTEGER : position, breadth: regionIds.length };
}

/**
 * Which of an athlete's logged lifts speaks for a region, most direct first and most recent
 * among equals.
 *
 * Recency alone put whatever was logged last in front of the region, so a lat pulldown -
 * whose own boundary says it "does not directly measure lat, upper-back, or biceps force" -
 * took the biceps record from a preacher curl, a targeted elbow-flexion test with a reviewed
 * reference behind it. The athlete reads a number about their biceps that came from a back
 * exercise, and the curl that should have answered is pushed down the list.
 */
export function compareRegionRecordRelevance(
  regionId: string,
  left: { exerciseName: string; observedAt: string | Date },
  right: { exerciseName: string; observedAt: string | Date },
): number {
  const a = regionRelevanceForExerciseName(left.exerciseName, regionId);
  const b = regionRelevanceForExerciseName(right.exerciseName, regionId);
  if (a.position !== b.position) return a.position - b.position;
  if (a.breadth !== b.breadth) return a.breadth - b.breadth;
  return new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime();
}

/**
 * The id a finished session's exercise is recorded under, here and in the account outbox
 * (strengthSyncQueue), so a workout taken back can be found in both.
 */
export function workoutObservationId(sessionId: string, exerciseId: string): string {
  return `workout-${sessionId}-${exerciseId}`;
}

function numeric(value: string | undefined) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * One observation per exercise per finished session: the set with the highest estimated
 * one-rep max, by the app's one estimator. A session is a single training event, so
 * collapsing it this way keeps 33 logged sets from arriving as 33 entries in a record meant
 * to be read at a glance — while still recording every exercise the athlete trained.
 *
 * It used to be the heaviest set, so a strong 100 x 10 lost to a lighter-effort 105 x 1 and
 * the rank read the weaker performance (EN-02, D-007). Sets the estimator cannot read (past
 * 15 reps, or no weight) are chosen only when no set can be read, heaviest then most reps.
 */
export function workoutStrengthObservations(
  sessions: readonly DeviceWorkoutSession[],
  /** Only for sets logged before units were stored and not yet stamped; every other set carries its own unit. */
  fallbackUnit: DisplayWeightUnit = "lb",
  bodyWeightLog: readonly BodyWeightEntry[] = [],
): WorkoutStrengthObservation[] {
  const observations: WorkoutStrengthObservation[] = [];
  sessions.filter((session) => session.status === "completed").forEach((session) => {
    const observedAt = session.completedAt || session.startedAt;
    // Read once per session, at the session's own date — not at today's. Where the log does not
    // reach back that far, the weight stamped on the session when it was finished stands in;
    // both are frozen values, so a later weight change cannot reach a lift already recorded.
    const bodyMassKgAtTest = bodyWeightKgAt(bodyWeightLog, observedAt) ?? session.bodyMassKgAtCompletion;
    session.exercises.forEach((exercise) => {
      // Each set is read in the unit it was typed in, and compared in kilograms, so a
      // session that mixed units still finds its heaviest set.
      // A drop set is one set and is read by its first stage alone (lib/dropSets): the later
      // stages are done fatigued, straight after the one before, and adding them up would credit
      // 21 reps at the first stage's load. Stage 1 is mirrored into the set's own weight and reps.
      const logged = exercise.sets
        .filter((set) => set.completed && !set.skipped)
        .map((set) => (set.type === "drop" && set.stages?.length ? { ...set, weight: set.stages[0].weight, reps: set.stages[0].reps, unit: set.stages[0].unit ?? set.unit } : set))
        .map((set) => ({ weightKg: setWeightKg(set, session, fallbackUnit), weight: numeric(set.weight), unit: setWeightUnit(set, session, fallbackUnit), reps: numeric(set.reps) }))
        .filter((set) => set.reps !== undefined);
      if (!logged.length) return;
      const withE1rm = logged.map((set) => ({ ...set, e1rmKg: set.weightKg === undefined || set.reps === undefined ? null : estimateOneRepMaxKg(set.weightKg, set.reps) }));
      const best = withE1rm.reduce((leader, set) => {
        if ((set.e1rmKg !== null) !== (leader.e1rmKg !== null)) return set.e1rmKg !== null ? set : leader;
        if (set.e1rmKg !== null && leader.e1rmKg !== null && set.e1rmKg !== leader.e1rmKg) return set.e1rmKg > leader.e1rmKg ? set : leader;
        const leaderWeight = leader.weightKg ?? 0;
        const setWeight = set.weightKg ?? 0;
        if (setWeight !== leaderWeight) return setWeight > leaderWeight ? set : leader;
        return (set.reps ?? 0) > (leader.reps ?? 0) ? set : leader;
      });
      // The exercise actually performed: after a swap, each part is read as the exercise it was.
      const convention = loadConventionFor(exercise.catalogId ?? catalogByName.get(exercise.exerciseName.trim().toLowerCase())?.id);
      observations.push({
        id: workoutObservationId(session.id, exercise.id),
        exerciseName: exercise.exerciseName,
        observedAt,
        measurementType: "MULTI_REP",
        loadKg: best.weightKg,
        reportedLoad: best.weightKg === undefined ? undefined : best.weight,
        reportedUnit: best.weightKg === undefined ? undefined : best.unit,
        // Weight on a movement scored by reps is load added to the body, not the whole load.
        loadSemantics: convention === "bodyweight_reps" && best.weightKg !== undefined ? "additional_load" : convention,
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
