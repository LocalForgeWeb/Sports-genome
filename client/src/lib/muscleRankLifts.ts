import { bodyWeightKgAt, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName } from "@/lib/strengthPercentileCard";
import { ageAtLift } from "@/lib/normsCohort";
import { estimateOneRepMaxKg } from "@shared/oneRepMaxEstimation";
import { strengthLevelAgeFactor } from "@shared/strengthPercentile";

export type RankableObservation = {
  exerciseName: string;
  loadKg?: number | string | null;
  repetitions?: number | string | null;
  measurementType?: string | null;
  bodyMassKgAtTest?: number | string | null;
  observedAt: string | Date;
};

export type MuscleRankLift = {
  catalogExerciseId: number | null;
  exerciseName: string;
  loadKg: number;
  repetitions: number;
  bodyMassKg: number | null;
  /**
   * Age on the day of this lift, worked out from the birth year whenever it was given - so a
   * year entered today re-reads a lift from last spring at the age it was lifted at.
   */
  ageYears: number | null;
};

/**
 * How many lifts one request carries. Queries travel as GET, so the lifts ride in the URL:
 * about 180 bytes each once encoded, against a 16 KB limit that the request line shares with
 * every header and cookie. Thirty keeps the worst case near 5 KB, and is also the route's cap.
 */
export const MUSCLE_RANK_LIFT_LIMIT = 30;

/**
 * The body weight a lift is read against, in the same order the record detail uses: the
 * weight saved with the lift, then what the weight log says for that day, then the profile
 * weight. The first is the rule - a later weight change must not re-read an old lift - and
 * the other two only fill in for lifts that were saved without one.
 */
export function liftBodyMassKg(observation: RankableObservation, history: readonly BodyWeightEntry[], profileBodyMassKg: number | null | undefined): number | null {
  const recorded = Number(observation.bodyMassKgAtTest);
  if (observation.bodyMassKgAtTest != null && Number.isFinite(recorded) && recorded > 0) return recorded;
  const dated = bodyWeightKgAt(history, observation.observedAt);
  if (dated !== undefined && dated > 0) return dated;
  return profileBodyMassKg != null && profileBodyMassKg > 0 ? profileBodyMassKg : null;
}

/**
 * What the muscle-rank route is sent: each exercise's strongest lifts, however long ago they
 * were logged.
 *
 * It used to send the newest 30 lifts and let the database pick among them, so a best lift
 * from months back dropped out once 30 newer ones were logged (EN-02), and the database picks
 * the most confident rather than the best (EN-01). Now, per exercise, the lifts are ranked by
 * the shared e1RM read at the age they were lifted at - once per body mass (the relative
 * curves most exercises use) and once without it (the absolute ones) - and the leader of each
 * is sent. The server then keeps whichever of an exercise's lifts places best.
 *
 * Every exercise's leader goes before any exercise's runner-up; when there are more exercises
 * than the route's cap, the ones trained most recently are kept. Lifts the estimator cannot
 * read (past 15 reps) are not sent: the database refuses them too.
 */
export function muscleRankLifts(observations: readonly RankableObservation[], history: readonly BodyWeightEntry[], profileBodyMassKg: number | null | undefined, birthYear?: number | null): MuscleRankLift[] {
  type Candidate = { lift: MuscleRankLift; observedAt: number; adjustedKg: number; relative: number | null };
  const byExercise = new Map<string, Candidate[]>();
  for (const observation of observations) {
    const loadKg = Number(observation.loadKg);
    if (observation.loadKg == null || !Number.isFinite(loadKg) || loadKg <= 0 || loadKg > 1000) continue;
    const repetitions = observation.measurementType === "MEASURED_1RM" ? 1 : Math.round(Number(observation.repetitions));
    if (!Number.isFinite(repetitions) || repetitions < 1 || repetitions > 100) continue;
    const e1rmKg = estimateOneRepMaxKg(loadKg, repetitions);
    if (e1rmKg === null) continue;
    const lift: MuscleRankLift = {
      catalogExerciseId: catalogExerciseIdForName(observation.exerciseName) ?? null,
      exerciseName: observation.exerciseName,
      loadKg,
      repetitions,
      bodyMassKg: liftBodyMassKg(observation, history, profileBodyMassKg),
      ageYears: ageAtLift(birthYear ?? undefined, observation.observedAt) ?? null,
    };
    // Age scales the comparison the way the database will: divide by the published factor.
    const factor = strengthLevelAgeFactor(lift.ageYears);
    const adjustedKg = e1rmKg / (factor.status === "ok" ? factor.factor : 1);
    const key = String(lift.catalogExerciseId ?? lift.exerciseName.trim().toLowerCase());
    const list = byExercise.get(key) ?? [];
    list.push({ lift, observedAt: new Date(observation.observedAt).getTime() || 0, adjustedKg, relative: lift.bodyMassKg ? adjustedKg / lift.bodyMassKg : null });
    byExercise.set(key, list);
  }

  const leaders: Candidate[] = [];
  const runnersUp: Candidate[] = [];
  const exercises = Array.from(byExercise.values()).map((candidates) => {
    const byRelative = [...candidates].filter((c) => c.relative !== null).sort((a, b) => b.relative! - a.relative! || b.observedAt - a.observedAt)[0];
    const byAbsolute = [...candidates].sort((a, b) => b.adjustedKg - a.adjustedKg || b.observedAt - a.observedAt)[0];
    return { lastTrained: Math.max(...candidates.map((c) => c.observedAt)), first: byRelative ?? byAbsolute, second: byRelative && byRelative !== byAbsolute ? byAbsolute : null };
  }).sort((a, b) => b.lastTrained - a.lastTrained);
  for (const exercise of exercises) {
    leaders.push(exercise.first);
    if (exercise.second) runnersUp.push(exercise.second);
  }

  const lifts: MuscleRankLift[] = [];
  const seen = new Set<string>();
  for (const { lift } of [...leaders, ...runnersUp]) {
    // The same lift twice tells the aggregation nothing new, and costs URL.
    const key = `${lift.catalogExerciseId ?? lift.exerciseName.trim().toLowerCase()}|${lift.loadKg}|${lift.repetitions}|${lift.bodyMassKg}|${lift.ageYears}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lifts.push(lift);
    if (lifts.length === MUSCLE_RANK_LIFT_LIMIT) break;
  }
  return lifts;
}
