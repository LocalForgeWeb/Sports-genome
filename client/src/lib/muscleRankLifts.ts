import { bodyWeightKgAt, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName } from "@/lib/strengthPercentileCard";
import { ageAtLift } from "@/lib/normsCohort";
import { estimateOneRepMaxKg } from "@shared/oneRepMaxEstimation";
import { strengthLevelAgeFactor } from "@shared/strengthPercentile";
import { loadConventionFor } from "@shared/loadConventions";
import type { MuscleEvidence } from "@shared/capabilityRank";

export type RankableObservation = {
  /** The record the lift was read from, so a rank can name the lift behind it. */
  id?: string | number;
  exerciseName: string;
  loadKg?: number | string | null;
  repetitions?: number | string | null;
  measurementType?: string | null;
  bodyMassKgAtTest?: number | string | null;
  observedAt: string | Date;
  /** "workout" when the lift was carried across from a finished workout rather than typed into the log. */
  source?: string | null;
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
 * A lift sent to be ranked against the profile weight, and whether it came from a finished
 * workout. Only a typed lift's record can take the weight of its day; a workout's lift is read
 * against the weight saved for that day, and there is no form to add one afterwards.
 */
export type ProfileWeightLift = { exerciseName: string; fromWorkout: boolean };

/**
 * Where one sent lift came from: the record, its date, what was lifted and the body weight it
 * was read against. One per sent lift, in the same order. It stays on this device: the route
 * is sent the lifts alone, and a rank is traced back to its lifts here.
 */
export type MuscleRankLiftSource = {
  observationId: string | null;
  exerciseName: string;
  catalogExerciseId: number | null;
  observedAt: string;
  loadKg: number;
  repetitions: number;
  /** Sent as its best set of reps, without load (a pull-up, a dip). */
  repsOnly: boolean;
  bodyMassKg: number | null;
  bodyMassSource: LiftBodyMassSource | null;
  fromWorkout: boolean;
};

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
 * Beside the lifts comes each one sent with no weight of its own day, read against the profile
 * weight instead, and whether it was typed or came from a workout - so the map can name the
 * records to complete, and send the athlete only to the ones that can take a weight. It rides
 * beside the lifts, not on them: the lifts travel in the request URL.
 */
export function muscleRankLiftSelection(observations: readonly RankableObservation[], history: readonly BodyWeightEntry[], profileBodyMassKg: number | null | undefined, birthYear?: number | null): { lifts: MuscleRankLift[]; profileWeightLifts: ProfileWeightLift[]; sources: MuscleRankLiftSource[] } {
  type Candidate = { lift: MuscleRankLift; observedAt: number; adjustedKg: number; relative: number | null; repsOnly: boolean; bodyMassSource: LiftBodyMassSource | null; fromWorkout: boolean; observationId: string | null; observedOn: string };
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
    const observedAt = new Date(observation.observedAt);
    list.push({ lift, observedAt: observedAt.getTime() || 0, adjustedKg, relative: !repsOnly && lift.bodyMassKg ? adjustedKg / lift.bodyMassKg : null, repsOnly, bodyMassSource: bodyMass?.source ?? null, fromWorkout: observation.source === "workout", observationId: observation.id == null ? null : String(observation.id), observedOn: Number.isNaN(observedAt.getTime()) ? String(observation.observedAt) : observedAt.toISOString() });
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
  const profileWeightLifts: ProfileWeightLift[] = [];
  const sources: MuscleRankLiftSource[] = [];
  const seen = new Set<string>();
  for (const { lift, bodyMassSource, fromWorkout, repsOnly, observationId, observedOn } of [...leaders, ...runnersUp]) {
    // The same lift twice tells the aggregation nothing new, and costs URL.
    const key = `${lift.catalogExerciseId ?? lift.exerciseName.trim().toLowerCase()}|${lift.loadKg}|${lift.repetitions}|${lift.bodyMassKg}|${lift.ageYears}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lifts.push(lift);
    sources.push({ observationId, exerciseName: lift.exerciseName, catalogExerciseId: lift.catalogExerciseId, observedAt: observedOn, loadKg: lift.loadKg, repetitions: lift.repetitions, repsOnly, bodyMassKg: lift.bodyMassKg, bodyMassSource, fromWorkout });
    if (bodyMassSource === "profile") profileWeightLifts.push({ exerciseName: lift.exerciseName, fromWorkout });
    if (lifts.length === MUSCLE_RANK_LIFT_LIMIT) break;
  }
  return { lifts, profileWeightLifts, sources };
}

/** One exercise behind a muscle's rank, and the lifts of it that were sent to be ranked. */
export type RankProvenance = {
  /** As the rank names it. */
  exerciseName: string;
  role: string | null;
  /** Where the exercise placed on its own; the muscle's rank weighs these. */
  exercisePercentile: number;
  /**
   * The lifts of this exercise that were sent, strongest first. The server keeps whichever
   * of them places best and does not say which, so more than one is "best of N lifts", not
   * a claim about one of them.
   */
  lifts: MuscleRankLiftSource[];
};

const comparableExerciseName = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Which lifts produced a rank, traced on this device.
 *
 * A muscle's evidence names its exercises and where each placed, but not the dated lifts: the
 * route is sent load, reps and body weight, never a record id or a date. Every lift sent is
 * known here, so each exercise with a placement is matched back to the lifts sent for it, by
 * catalog id first and by name otherwise. Exercises the rank could not place are left out:
 * they are not behind it. The strongest placement leads.
 */
export function rankProvenance(evidence: readonly MuscleEvidence[], sources: readonly MuscleRankLiftSource[]): RankProvenance[] {
  const entries: RankProvenance[] = [];
  const named = new Set<string>();
  for (const item of evidence) {
    if (item.exercisePercentile == null || !Number.isFinite(item.exercisePercentile)) continue;
    const name = comparableExerciseName(item.exerciseName);
    if (named.has(name)) continue;
    named.add(name);
    const catalogId = catalogExerciseIdForName(item.exerciseName) ?? null;
    const lifts = sources.filter((source) => (catalogId !== null && source.catalogExerciseId === catalogId) || comparableExerciseName(source.exerciseName) === name);
    entries.push({ exerciseName: item.exerciseName, role: item.role, exercisePercentile: item.exercisePercentile, lifts });
  }
  return entries.sort((a, b) => b.exercisePercentile - a.exercisePercentile);
}

/**
 * What the muscle-rank query keeps on screen while new ranks load: the previous answer, so the
 * map keeps its colours under "Updating ranks…" instead of dropping back to coverage - but only
 * when that answer was for the same comparison group. Ranks read against men are no stand-in
 * for ranks against women. Reads the group from the previous query's key, which tRPC writes as
 * `[path, { input }]`.
 */
export function previousRanksForSameGroup(sex: "male" | "female" | null) {
  return <T>(previous: T | undefined, previousQuery?: { queryKey: readonly unknown[] }): T | undefined => {
    const key = previousQuery?.queryKey?.[1] as { input?: { sex?: unknown } } | undefined;
    return key?.input?.sex === sex ? previous : undefined;
  };
}
