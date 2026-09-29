import { bodyWeightKgAt, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName } from "@/lib/strengthPercentileCard";
import { ageAtLift } from "@/lib/normsCohort";
import { estimateOneRepMaxKg } from "@shared/oneRepMaxEstimation";
import { strengthLevelAgeFactor } from "@shared/strengthPercentile";
import { loadConventionFor } from "@shared/loadConventions";

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

/** Where a lift's body weight came from: saved with it, the weight log for that day, or the profile. */
export type LiftBodyMassSource = "recorded" | "dated" | "profile";

/**
 * The body weight a lift is read against, in the same order the record detail uses: the
 * weight saved with the lift, then what the weight log says for that day, then the profile
 * weight. The first is the rule - a later weight change must not re-read an old lift - and
 * the other two only fill in for lifts that were saved without one.
 */
export function liftBodyMass(observation: RankableObservation, history: readonly BodyWeightEntry[], profileBodyMassKg: number | null | undefined): { kg: number; source: LiftBodyMassSource } | null {
  const recorded = Number(observation.bodyMassKgAtTest);
  if (observation.bodyMassKgAtTest != null && Number.isFinite(recorded) && recorded > 0) return { kg: recorded, source: "recorded" };
  const dated = bodyWeightKgAt(history, observation.observedAt);
  if (dated !== undefined && dated > 0) return { kg: dated, source: "dated" };
  return profileBodyMassKg != null && profileBodyMassKg > 0 ? { kg: profileBodyMassKg, source: "profile" } : null;
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
 *
 * A movement the scoring policy reads on reps (a pull-up, a dip, a push-up) is sent without
 * load, as its best set of reps - those never reached the ranks before (EN-09). A loaded set
 * of one goes too, as the runner-up, so the server can say its added load is not scored.
 *
 * Beside the lifts comes the exercise of each one sent with no weight of its own day, read
 * against the profile weight instead - so the map can name the records to complete. It rides
 * beside the lifts, not on them: the lifts travel in the request URL.
 */
export function muscleRankLiftSelection(observations: readonly RankableObservation[], history: readonly BodyWeightEntry[], profileBodyMassKg: number | null | undefined, birthYear?: number | null): { lifts: MuscleRankLift[]; profileWeightExercises: string[] } {
  type Candidate = { lift: MuscleRankLift; observedAt: number; adjustedKg: number; relative: number | null; repsOnly: boolean; bodyMassSource: LiftBodyMassSource | null };
  const byExercise = new Map<string, Candidate[]>();
  for (const observation of observations) {
    const catalogExerciseId = catalogExerciseIdForName(observation.exerciseName) ?? null;
    const scoredOnReps = loadConventionFor(catalogExerciseId) === "bodyweight_reps";
    const loadKg = observation.loadKg == null || observation.loadKg === "" ? 0 : Number(observation.loadKg);
    if (!Number.isFinite(loadKg) || loadKg < 0 || loadKg > 1000) continue;
    if (loadKg === 0 && !scoredOnReps) continue;
    const repetitions = observation.measurementType === "MEASURED_1RM" ? 1 : Math.round(Number(observation.repetitions));
    if (!Number.isFinite(repetitions) || repetitions < 1 || repetitions > 100) continue;
    const repsOnly = scoredOnReps && loadKg === 0;
    const e1rmKg = repsOnly ? null : estimateOneRepMaxKg(loadKg, repetitions);
    if (!repsOnly && e1rmKg === null) continue;
    const bodyMass = liftBodyMass(observation, history, profileBodyMassKg);
    const lift: MuscleRankLift = {
      catalogExerciseId,
      exerciseName: observation.exerciseName,
      loadKg,
      repetitions,
      bodyMassKg: bodyMass?.kg ?? null,
      ageYears: ageAtLift(birthYear ?? undefined, observation.observedAt) ?? null,
    };
    // Age scales the comparison the way the database will: divide by the published factor.
    const factor = strengthLevelAgeFactor(lift.ageYears);
    // A rep test is ranked by its reps; a loaded lift by its age-adjusted e1RM.
    const adjustedKg = repsOnly ? repetitions : e1rmKg! / (factor.status === "ok" ? factor.factor : 1);
    const key = String(lift.catalogExerciseId ?? lift.exerciseName.trim().toLowerCase());
    const list = byExercise.get(key) ?? [];
    list.push({ lift, observedAt: new Date(observation.observedAt).getTime() || 0, adjustedKg, relative: !repsOnly && lift.bodyMassKg ? adjustedKg / lift.bodyMassKg : null, repsOnly, bodyMassSource: bodyMass?.source ?? null });
    byExercise.set(key, list);
  }

  const leaders: Candidate[] = [];
  const runnersUp: Candidate[] = [];
  const strongest = (candidates: Candidate[], by: (candidate: Candidate) => number | null) =>
    candidates.filter((c) => by(c) !== null).sort((a, b) => by(b)! - by(a)! || b.observedAt - a.observedAt)[0];
  const exercises = Array.from(byExercise.values()).map((candidates) => {
    const lastTrained = Math.max(...candidates.map((c) => c.observedAt));
    const repTests = candidates.filter((c) => c.repsOnly);
    if (repTests.length) {
      const loaded = candidates.filter((c) => !c.repsOnly);
      return { lastTrained, first: strongest(repTests, (c) => c.adjustedKg)!, second: loaded.length ? strongest(loaded, (c) => c.adjustedKg)! : null };
    }
    const byRelative = strongest(candidates, (c) => c.relative);
    const byAbsolute = strongest(candidates, (c) => c.adjustedKg)!;
    return { lastTrained, first: byRelative ?? byAbsolute, second: byRelative && byRelative !== byAbsolute ? byAbsolute : null };
  }).sort((a, b) => b.lastTrained - a.lastTrained);
  for (const exercise of exercises) {
    leaders.push(exercise.first);
    if (exercise.second) runnersUp.push(exercise.second);
  }

  const lifts: MuscleRankLift[] = [];
  const profileWeightExercises: string[] = [];
  const seen = new Set<string>();
  for (const { lift, bodyMassSource } of [...leaders, ...runnersUp]) {
    // The same lift twice tells the aggregation nothing new, and costs URL.
    const key = `${lift.catalogExerciseId ?? lift.exerciseName.trim().toLowerCase()}|${lift.loadKg}|${lift.repetitions}|${lift.bodyMassKg}|${lift.ageYears}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lifts.push(lift);
    if (bodyMassSource === "profile") profileWeightExercises.push(lift.exerciseName);
    if (lifts.length === MUSCLE_RANK_LIFT_LIMIT) break;
  }
  return { lifts, profileWeightExercises };
}
