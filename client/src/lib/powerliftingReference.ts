export const vanDenHoek2024ReferenceId = "van_den_hoek_2024_powerlifting_relative_strength" as const;

export type PowerliftingComparisonSex = "female" | "male";
export type PowerliftingLift = "Squat" | "Bench press" | "Deadlift";
export type PowerliftingReferenceDeclaration = {
  sex?: PowerliftingComparisonSex;
  ageYears?: number;
  drugTestedCompetitionConfirmed: boolean;
  unequippedCompetitionConfirmed: boolean;
  maximumSuccessfulLiftConfirmed: boolean;
};

type ReferenceContext = {
  exerciseName: string;
  measurementType: string;
  loadKg?: number | null;
  bodyMassKgAtTest?: number | null;
  declaration: PowerliftingReferenceDeclaration;
};

type UnavailableReference = {
  status: "unavailable";
  reason:
    | "exercise_not_in_reference"
    | "maximum_lift_required"
    | "body_mass_required"
    | "comparison_sex_required"
    | "age_group_not_in_initial_route"
    | "competition_context_required";
};

type MatchedReference = {
  status: "matched";
  referenceId: typeof vanDenHoek2024ReferenceId;
  lift: PowerliftingLift;
  relativeStrength: number;
  percentileBandLabel: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type PowerliftingReferenceResult = UnavailableReference | MatchedReference;

const liftForExerciseName: Record<string, PowerliftingLift> = {
  "Back Squat": "Squat",
  "Barbell Bench Press": "Bench press",
  "Conventional Deadlift": "Deadlift",
};

// van den Hoek et al. (2024), Table 3 (females) and Table 4 (males).
// All values are reported cut points for drug-tested, unequipped competition
// entries aged 18–35; the app deliberately does not interpolate a percentile.
const decilesBySexAndLift: Record<PowerliftingComparisonSex, Record<PowerliftingLift, readonly [number, number][]>> = {
  female: {
    Squat: [[10, 1.23], [20, 1.4], [30, 1.52], [40, 1.62], [50, 1.72], [60, 1.82], [70, 1.93], [80, 2.07], [90, 2.26]],
    "Bench press": [[10, 0.67], [20, 0.77], [30, 0.84], [40, 0.9], [50, 0.96], [60, 1.03], [70, 1.1], [80, 1.2], [90, 1.35]],
    Deadlift: [[10, 1.49], [20, 1.68], [30, 1.82], [40, 1.94], [50, 2.06], [60, 2.17], [70, 2.3], [80, 2.45], [90, 2.66]],
  },
  male: {
    Squat: [[10, 1.75], [20, 1.93], [30, 2.06], [40, 2.17], [50, 2.28], [60, 2.38], [70, 2.5], [80, 2.63], [90, 2.83]],
    "Bench press": [[10, 1.19], [20, 1.31], [30, 1.4], [40, 1.48], [50, 1.56], [60, 1.63], [70, 1.71], [80, 1.81], [90, 1.96]],
    Deadlift: [[10, 2.03], [20, 2.24], [30, 2.4], [40, 2.51], [50, 2.63], [60, 2.75], [70, 2.87], [80, 3.03], [90, 3.25]],
  },
};

function decileBandLabel(relativeStrength: number, deciles: readonly [number, number][]) {
  const exact = deciles.find(([, cutPoint]) => Math.abs(relativeStrength - cutPoint) < 0.005);
  if (exact) return `${exact[0]}th percentile cut point`;
  if (relativeStrength < deciles[0][1]) return "Below the reported 10th-percentile cut point";
  if (relativeStrength > deciles[deciles.length - 1][1]) return "Above the reported 90th-percentile cut point";
  const upperIndex = deciles.findIndex(([, cutPoint]) => relativeStrength < cutPoint);
  const lower = deciles[upperIndex - 1][0];
  const upper = deciles[upperIndex][0];
  return `${lower}th–${upper}th percentile band`;
}

export function getVanDenHoek2024PowerliftingReference(context: ReferenceContext): PowerliftingReferenceResult {
  const lift = liftForExerciseName[context.exerciseName];
  if (!lift) return { status: "unavailable", reason: "exercise_not_in_reference" };
  if (context.measurementType !== "MEASURED_1RM" || !context.declaration.maximumSuccessfulLiftConfirmed) return { status: "unavailable", reason: "maximum_lift_required" };
  if (!Number.isFinite(context.loadKg) || !Number.isFinite(context.bodyMassKgAtTest) || !context.bodyMassKgAtTest || context.bodyMassKgAtTest <= 0) return { status: "unavailable", reason: "body_mass_required" };
  if (!context.declaration.sex) return { status: "unavailable", reason: "comparison_sex_required" };
  if (!context.declaration.ageYears || context.declaration.ageYears < 18 || context.declaration.ageYears > 35) return { status: "unavailable", reason: "age_group_not_in_initial_route" };
  if (!context.declaration.drugTestedCompetitionConfirmed || !context.declaration.unequippedCompetitionConfirmed) return { status: "unavailable", reason: "competition_context_required" };

  const relativeStrength = Number((Number(context.loadKg) / Number(context.bodyMassKgAtTest)).toFixed(2));
  const deciles = decilesBySexAndLift[context.declaration.sex][lift];
  return {
    status: "matched",
    referenceId: vanDenHoek2024ReferenceId,
    lift,
    relativeStrength,
    percentileBandLabel: decileBandLabel(relativeStrength, deciles),
    sourceLabel: `van den Hoek et al. 2024 · drug-tested, unequipped powerlifting competitors · ${context.declaration.sex === "male" ? "males" : "females"} 18–35`,
    sourceUrl: "https://www.sciencedirect.com/science/article/pii/S1440244024002469",
  };
}
