import { estimateOneRepMaxKg, maxValidEstimationReps, oneRepMaxEstimationMethod } from "@shared/oneRepMaxEstimation";

export type ComparableStrengthObservation = {
  id: number | string;
  exerciseName: string;
  measurementType: string;
  observedAt: Date | string;
  loadKg: string | number | null;
  repetitions: number | null;
  laterality?: string | null;
};

export type ChangeState = "insufficient_history" | "stable" | "directional_signal_emerging" | "meaningful_change_supported";

export type EstimatedOneRepMaxPoint = {
  id: number | string;
  observedAt: Date;
  estimatedOneRmKg: number;
  repetitions: number | null;
};

export type WithinAthleteStrengthChange = {
  exerciseName: string;
  laterality: string;
  changeState: ChangeState;
  observationCount: number;
  firstPoint: EstimatedOneRepMaxPoint;
  latestPoint: EstimatedOneRepMaxPoint;
  relativeChangePercent: number;
  estimationMethod: typeof oneRepMaxEstimationMethod;
};

export type ExcludedStrengthObservationSet = {
  exerciseName: string;
  observationCount: number;
  reason: "reps_outside_estimation_range" | "missing_load_or_reps";
};

export type WithinAthleteStrengthComparisonSummary = {
  comparable: WithinAthleteStrengthChange[];
  excluded: ExcludedStrengthObservationSet[];
};

/** The change-state bands below are calibrated to sit outside typical Epley-formula
 * estimation error (commonly cited in the ~5-10% range for reps in this window), so a
 * "meaningful change" claim reflects a real strength change, not estimator noise -
 * per the philosophy blueprint's Trend credibility and change-state contract. */
const stableThresholdPercent = 6;
const meaningfulChangeThresholdPercent = 15;

function validLoad(value: ComparableStrengthObservation["loadKg"]): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function groupKey(observation: ComparableStrengthObservation) {
  return `${normalized(observation.exerciseName)}|${observation.laterality || "BILATERAL"}`;
}

function toEstimatedPoint(observation: ComparableStrengthObservation): EstimatedOneRepMaxPoint | null {
  const loadKg = validLoad(observation.loadKg);
  if (!loadKg) return null;
  if (observation.measurementType === "MEASURED_1RM") {
    return { id: observation.id, observedAt: new Date(observation.observedAt), estimatedOneRmKg: loadKg, repetitions: 1 };
  }
  if (observation.measurementType !== "MULTI_REP") return null;
  const reps = observation.repetitions;
  if (!reps || reps < 1 || reps > maxValidEstimationReps) return null;
  const estimatedOneRmKg = estimateOneRepMaxKg(loadKg, reps);
  if (!estimatedOneRmKg) return null;
  return { id: observation.id, observedAt: new Date(observation.observedAt), estimatedOneRmKg, repetitions: reps };
}

function changeStateFor(relativeChangePercent: number): ChangeState {
  const magnitude = Math.abs(relativeChangePercent);
  if (magnitude < stableThresholdPercent) return "stable";
  if (magnitude < meaningfulChangeThresholdPercent) return "directional_signal_emerging";
  return "meaningful_change_supported";
}

/**
 * Compares an athlete's own estimated one-rep max over time for the same exercise,
 * using the Epley formula to make different rep ranges comparable (30x10 vs. a later
 * 50x12 both become an estimated 1RM, rather than requiring an identical rep count).
 * Never a population comparison, tier, or percentile - only a within-athlete trend
 * with an explicit insufficient-history/stable/emerging/confirmed change state.
 */
export function summarizeWithinAthleteStrengthComparisons(observations: ComparableStrengthObservation[]): WithinAthleteStrengthComparisonSummary {
  const byGroup = new Map<string, ComparableStrengthObservation[]>();
  for (const observation of observations) {
    if (!["MEASURED_1RM", "MULTI_REP"].includes(observation.measurementType)) continue;
    const key = groupKey(observation);
    byGroup.set(key, [...(byGroup.get(key) || []), observation]);
  }

  const comparable: WithinAthleteStrengthChange[] = [];
  const excluded: ExcludedStrengthObservationSet[] = [];

  byGroup.forEach(groupObservations => {
    const points = groupObservations
      .map(observation => ({ observation, point: toEstimatedPoint(observation) }))
      .filter((entry): entry is { observation: ComparableStrengthObservation; point: EstimatedOneRepMaxPoint } => entry.point !== null)
      .sort((a, b) => a.point.observedAt.getTime() - b.point.observedAt.getTime());

    const excludedCount = groupObservations.length - points.length;
    if (excludedCount > 0) {
      const missingLoadOrReps = groupObservations.some(observation => !validLoad(observation.loadKg) || (observation.measurementType === "MULTI_REP" && !observation.repetitions));
      excluded.push({
        exerciseName: groupObservations[0].exerciseName,
        observationCount: excludedCount,
        reason: missingLoadOrReps ? "missing_load_or_reps" : "reps_outside_estimation_range",
      });
    }

    if (points.length < 2) return;
    const first = points[0].point;
    const latest = points[points.length - 1].point;
    const relativeChangePercent = ((latest.estimatedOneRmKg - first.estimatedOneRmKg) / first.estimatedOneRmKg) * 100;

    comparable.push({
      exerciseName: points[points.length - 1].observation.exerciseName,
      laterality: points[points.length - 1].observation.laterality || "BILATERAL",
      changeState: changeStateFor(relativeChangePercent),
      observationCount: points.length,
      firstPoint: first,
      latestPoint: latest,
      relativeChangePercent,
      estimationMethod: oneRepMaxEstimationMethod,
    });
  });

  const byNewestDate = (a: WithinAthleteStrengthChange, b: WithinAthleteStrengthChange) => b.latestPoint.observedAt.getTime() - a.latestPoint.observedAt.getTime();
  return { comparable: comparable.sort(byNewestDate), excluded };
}

export function findWithinAthleteStrengthChanges(observations: ComparableStrengthObservation[]) {
  return summarizeWithinAthleteStrengthComparisons(observations).comparable;
}
