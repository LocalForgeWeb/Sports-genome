export type ComparableStrengthObservation = {
  id: number;
  exerciseName: string;
  measurementType: string;
  observedAt: Date | string;
  loadKg: string | number | null;
  repetitions: number | null;
  laterality: string;
};

export type WithinAthleteStrengthChange = {
  exerciseName: string;
  measurementType: string;
  repetitions: number | null;
  firstObservedAt: Date;
  latestObservedAt: Date;
  firstLoadKg: number;
  latestLoadKg: number;
  loadChangeKg: number;
  relativeLoadChangePercent: number;
};

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function validLoad(value: ComparableStrengthObservation["loadKg"]) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

/**
 * Comparisons are intentionally limited to repeated tests with the same named
 * exercise, test type, laterality, and, for working sets, repetition count.
 * The result is a recorded-load change, not an estimated strength change.
 */
export function findWithinAthleteStrengthChanges(observations: ComparableStrengthObservation[]) {
  const grouped = new Map<string, ComparableStrengthObservation[]>();
  for (const observation of observations) {
    const load = validLoad(observation.loadKg);
    if (!load || !["MEASURED_1RM", "MULTI_REP"].includes(observation.measurementType)) continue;
    const repetitionKey = observation.measurementType === "MULTI_REP" ? String(observation.repetitions ?? "unknown") : "one-repetition";
    const key = [normalized(observation.exerciseName), observation.measurementType, observation.laterality, repetitionKey].join("|");
    grouped.set(key, [...(grouped.get(key) || []), observation]);
  }

  return Array.from(grouped.values()).flatMap(group => {
    const ordered = [...group].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
    const first = ordered[0];
    const latest = ordered[ordered.length - 1];
    const firstLoadKg = validLoad(first.loadKg);
    const latestLoadKg = validLoad(latest.loadKg);
    if (!firstLoadKg || !latestLoadKg || ordered.length < 2) return [];
    return [{
      exerciseName: latest.exerciseName,
      measurementType: latest.measurementType,
      repetitions: latest.repetitions,
      firstObservedAt: new Date(first.observedAt),
      latestObservedAt: new Date(latest.observedAt),
      firstLoadKg,
      latestLoadKg,
      loadChangeKg: latestLoadKg - firstLoadKg,
      relativeLoadChangePercent: ((latestLoadKg - firstLoadKg) / firstLoadKg) * 100,
    } satisfies WithinAthleteStrengthChange];
  }).sort((a, b) => b.latestObservedAt.getTime() - a.latestObservedAt.getTime());
}
