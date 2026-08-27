export type ComparableStrengthObservation = {
  id: number;
  exerciseName: string;
  measurementType: string;
  observedAt: Date | string;
  loadKg: string | number | null;
  repetitions: number | null;
  laterality: string;
  equipment?: string | null;
  romStandard?: string | null;
  techniqueVariant?: string | null;
  tempo?: string | null;
  externalAssistance?: string | null;
  dataQuality?: string | null;
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

export type NonComparableStrengthObservationSet = {
  exerciseName: string;
  measurementType: string;
  repetitions: number | null;
  observationCount: number;
  latestObservedAt: Date;
  differingConditions: string[];
};

export type WithinAthleteStrengthComparisonSummary = {
  comparable: WithinAthleteStrengthChange[];
  nonComparable: NonComparableStrengthObservationSet[];
};

const conditionFields = [
  { key: "equipment", label: "equipment" },
  { key: "romStandard", label: "range/test standard" },
  { key: "techniqueVariant", label: "technique/variation" },
  { key: "tempo", label: "tempo" },
  { key: "externalAssistance", label: "assistance/support" },
  { key: "dataQuality", label: "data quality" },
] as const;

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizedCondition(value: string | null | undefined) {
  return normalized(value || "");
}

function validLoad(value: ComparableStrengthObservation["loadKg"]) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function baseTestKey(observation: ComparableStrengthObservation) {
  const repetitionKey = observation.measurementType === "MULTI_REP" ? String(observation.repetitions ?? "unknown") : "one-repetition";
  return [normalized(observation.exerciseName), observation.measurementType, observation.laterality, repetitionKey].join("|");
}

function conditionKey(observation: ComparableStrengthObservation) {
  return conditionFields.map(({ key }) => normalizedCondition(observation[key])).join("|");
}

function orderedObservations(observations: ComparableStrengthObservation[]) {
  return [...observations].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
}

/**
 * A comparison is shown only when athlete-entered results share the same named
 * test, test type, side, working-set repetition count, and recorded conditions.
 * A condition mismatch produces an explicit no-comparison record; neither
 * result is an estimated strength change, tier, or population comparison.
 */
export function summarizeWithinAthleteStrengthComparisons(observations: ComparableStrengthObservation[]): WithinAthleteStrengthComparisonSummary {
  const byBaseTest = new Map<string, ComparableStrengthObservation[]>();
  for (const observation of observations) {
    if (!validLoad(observation.loadKg) || !["MEASURED_1RM", "MULTI_REP"].includes(observation.measurementType)) continue;
    const key = baseTestKey(observation);
    byBaseTest.set(key, [...(byBaseTest.get(key) || []), observation]);
  }

  const comparable: WithinAthleteStrengthChange[] = [];
  const nonComparable: NonComparableStrengthObservationSet[] = [];

  byBaseTest.forEach((baseObservations) => {
    const byConditions = new Map<string, ComparableStrengthObservation[]>();
    for (const observation of baseObservations) {
      const key = conditionKey(observation);
      byConditions.set(key, [...(byConditions.get(key) || []), observation]);
    }

    byConditions.forEach((conditionObservations) => {
      const ordered = orderedObservations(conditionObservations);
      const first = ordered[0];
      const latest = ordered[ordered.length - 1];
      const firstLoadKg = validLoad(first.loadKg);
      const latestLoadKg = validLoad(latest.loadKg);
      if (!firstLoadKg || !latestLoadKg || ordered.length < 2) return;
      comparable.push({
        exerciseName: latest.exerciseName,
        measurementType: latest.measurementType,
        repetitions: latest.repetitions,
        firstObservedAt: new Date(first.observedAt),
        latestObservedAt: new Date(latest.observedAt),
        firstLoadKg,
        latestLoadKg,
        loadChangeKg: latestLoadKg - firstLoadKg,
        relativeLoadChangePercent: ((latestLoadKg - firstLoadKg) / firstLoadKg) * 100,
      });
    });

    if (baseObservations.length < 2 || byConditions.size < 2) return;
    const differingConditions = conditionFields
      .filter(({ key }) => new Set(baseObservations.map(observation => normalizedCondition(observation[key]))).size > 1)
      .map(({ label }) => label);
    const latest = orderedObservations(baseObservations).at(-1)!;
    nonComparable.push({
      exerciseName: latest.exerciseName,
      measurementType: latest.measurementType,
      repetitions: latest.repetitions,
      observationCount: baseObservations.length,
      latestObservedAt: new Date(latest.observedAt),
      differingConditions,
    });
  });

  const byNewestDate = <T extends { latestObservedAt: Date }>(a: T, b: T) => b.latestObservedAt.getTime() - a.latestObservedAt.getTime();
  return { comparable: comparable.sort(byNewestDate), nonComparable: nonComparable.sort(byNewestDate) };
}

export function findWithinAthleteStrengthChanges(observations: ComparableStrengthObservation[]) {
  return summarizeWithinAthleteStrengthComparisons(observations).comparable;
}
