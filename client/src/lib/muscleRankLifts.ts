import { bodyWeightKgAt, type BodyWeightEntry } from "@/lib/bodyWeightLog";
import { catalogExerciseIdForName } from "@/lib/strengthPercentileCard";

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
 * What the muscle-rank route is sent: the most recent lifts with a load, newest first, up to
 * the route's cap. Every lift goes, not one per exercise - which of an exercise's lifts
 * counts is the database aggregation's decision (it keeps the best-supported one), and making
 * that choice here as well would be a second policy for the same thing.
 */
export function muscleRankLifts(observations: readonly RankableObservation[], history: readonly BodyWeightEntry[], profileBodyMassKg: number | null | undefined): MuscleRankLift[] {
  const lifts: MuscleRankLift[] = [];
  const seen = new Set<string>();
  const newestFirst = [...observations].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
  for (const observation of newestFirst) {
    const loadKg = Number(observation.loadKg);
    if (observation.loadKg == null || !Number.isFinite(loadKg) || loadKg <= 0 || loadKg > 1000) continue;
    const repetitions = observation.measurementType === "MEASURED_1RM" ? 1 : Math.round(Number(observation.repetitions));
    if (!Number.isFinite(repetitions) || repetitions < 1 || repetitions > 100) continue;
    const lift: MuscleRankLift = {
      catalogExerciseId: catalogExerciseIdForName(observation.exerciseName) ?? null,
      exerciseName: observation.exerciseName,
      loadKg,
      repetitions,
      bodyMassKg: liftBodyMassKg(observation, history, profileBodyMassKg),
    };
    // The same lift twice tells the aggregation nothing new, and costs URL.
    const key = `${lift.catalogExerciseId ?? lift.exerciseName.trim().toLowerCase()}|${loadKg}|${repetitions}|${lift.bodyMassKg}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lifts.push(lift);
    if (lifts.length === MUSCLE_RANK_LIFT_LIMIT) break;
  }
  return lifts;
}
