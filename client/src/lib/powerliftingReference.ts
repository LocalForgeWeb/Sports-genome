import type { PowerliftingNormRow } from "@shared/powerliftingNormsReference";
import { estimateOneRepMaxKg } from "@shared/oneRepMaxEstimation";

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
  if (exact) return `${exact[0]}th percentile`;
  if (relativeStrength < deciles[0][1]) return "Below the 10th percentile";
  if (relativeStrength > deciles[deciles.length - 1][1]) return "Above the 90th percentile";
  const upperIndex = deciles.findIndex(([, cutPoint]) => relativeStrength < cutPoint);
  const lower = deciles[upperIndex - 1][0];
  const upper = deciles[upperIndex][0];
  return `${lower}th–${upper}th percentile`;
}

function ageBandLabel(ageMin: number, ageMax: number) {
  return ageMax >= 100 ? `${Math.round(ageMin)}+` : `${Math.round(ageMin)}–${Math.round(ageMax)}`;
}

/**
 * Prefers the full reported decile table from the Sports Genome research registry
 * (all age bands van den Hoek et al. 2024 actually published) when it's available.
 * Falls back to the hand-transcribed 18-35 table below when the registry is
 * unreachable, so this comparison keeps working offline for its original range.
 */
export function getVanDenHoek2024PowerliftingReference(
  context: ReferenceContext,
  registryNorms: readonly PowerliftingNormRow[] = []
): PowerliftingReferenceResult {
  const lift = liftForExerciseName[context.exerciseName];
  if (!lift) return { status: "unavailable", reason: "exercise_not_in_reference" };
  if (context.measurementType !== "MEASURED_1RM" || !context.declaration.maximumSuccessfulLiftConfirmed) return { status: "unavailable", reason: "maximum_lift_required" };
  if (!Number.isFinite(context.loadKg) || !Number.isFinite(context.bodyMassKgAtTest) || !context.bodyMassKgAtTest || context.bodyMassKgAtTest <= 0) return { status: "unavailable", reason: "body_mass_required" };
  if (!context.declaration.sex) return { status: "unavailable", reason: "comparison_sex_required" };
  if (!context.declaration.ageYears) return { status: "unavailable", reason: "age_group_not_in_initial_route" };
  if (!context.declaration.drugTestedCompetitionConfirmed || !context.declaration.unequippedCompetitionConfirmed) return { status: "unavailable", reason: "competition_context_required" };

  const sex = context.declaration.sex;
  const ageYears = context.declaration.ageYears;
  const matchedBand = registryNorms
    .filter(row => row.exerciseName === context.exerciseName && row.sex === sex && ageYears >= row.ageMin && ageYears <= row.ageMax)
    .sort((a, b) => a.percentile - b.percentile);
  const usingRegistryBand = matchedBand.length >= 3;
  const deciles: readonly [number, number][] = usingRegistryBand
    ? matchedBand.map(row => [row.percentile, row.relativeStrength])
    : ageYears >= 18 && ageYears <= 35
      ? decilesBySexAndLift[sex][lift]
      : [];
  if (!deciles.length) return { status: "unavailable", reason: "age_group_not_in_initial_route" };

  const relativeStrength = Number((Number(context.loadKg) / Number(context.bodyMassKgAtTest)).toFixed(2));
  const ageLabel = usingRegistryBand ? ageBandLabel(matchedBand[0].ageMin, matchedBand[0].ageMax) : "18–35";
  return {
    status: "matched",
    referenceId: vanDenHoek2024ReferenceId,
    lift,
    relativeStrength,
    percentileBandLabel: decileBandLabel(relativeStrength, deciles),
    sourceLabel: `van den Hoek et al. 2024 · drug-tested, unequipped powerlifting competitors · ${sex === "male" ? "males" : "females"} ${ageLabel}`,
    sourceUrl: "https://www.sciencedirect.com/science/article/pii/S1440244024002469",
  };
}

/* ── Ranking an ordinary gym lift ─────────────────────────────────────────────
 *
 * The function above answers a narrow question: does this log match van den Hoek
 * et al.'s population exactly? It requires a measured 1RM, and a confirmation
 * that the lift happened in drug-tested, unequipped competition. Almost no gym
 * log can satisfy that, so the screen showed a paragraph explaining why there
 * was no number - on a lift whose number was sitting right there in the table.
 *
 * A 175 lb bench at 1.21x body weight lands between the 10th and 20th percentile
 * of that reference. Refusing to say so is not caution; it withholds the one
 * thing the athlete came to the screen for.
 *
 * So the strict route stays exactly as it is, for the audited declaration path,
 * and this one ranks what the athlete actually has. The difference is carried in
 * the result rather than used to suppress it: a rank from an estimated 1RM says
 * it is estimated, and every rank names the population it is against. A
 * percentile without its population is the misleading thing - not the percentile.
 */

/** What produced the one-rep max being ranked. */
export type PowerliftingRankBasis = "measured" | "estimated";

/** Something the athlete can supply that would produce a rank. */
export type PowerliftingRankMissing = "load" | "body_mass" | "sex" | "age";

export type PowerliftingRank =
  | { status: "ranked"; lift: PowerliftingLift; relativeStrength: number; percentileBandLabel: string; basis: PowerliftingRankBasis; population: string; sourceUrl: string }
  | { status: "needs"; missing: PowerliftingRankMissing }
  | { status: "unsupported" };

type RankContext = {
  exerciseName: string;
  measurementType: string;
  loadKg?: number | null;
  repetitions?: number | null;
  bodyMassKgAtTest?: number | null;
  sex?: PowerliftingComparisonSex;
  ageYears?: number;
};

const vanDenHoekSourceUrl = "https://www.sciencedirect.com/science/article/pii/S1440244024002469";

/**
 * The one-rep max to rank, and how it was arrived at.
 *
 * A single measured max is used as-is. A multi-rep set is converted with the
 * app's own Epley estimator, which refuses past twelve reps rather than
 * extrapolating - so a high-rep set produces no rank instead of a wrong one.
 */
export function rankableOneRepMaxKg(context: RankContext): { kg: number; basis: PowerliftingRankBasis } | null {
  const load = Number(context.loadKg);
  if (!Number.isFinite(load) || load <= 0) return null;
  if (context.measurementType === "MEASURED_1RM") return { kg: load, basis: "measured" };
  const reps = Number(context.repetitions);
  if (!Number.isFinite(reps) || reps < 1) return null;
  const estimated = estimateOneRepMaxKg(load, reps);
  return estimated == null ? null : { kg: estimated, basis: reps === 1 ? "measured" : "estimated" };
}

/**
 * Where this lift sits in the reference, or the one thing still missing.
 *
 * The order of the checks is the order in which the athlete can act: a lift that
 * is not in the table can never be ranked, and after that each answer names a
 * single field to fill rather than a list of conditions to satisfy.
 */
export function rankAgainstPowerliftingNorms(
  context: RankContext,
  registryNorms: readonly PowerliftingNormRow[] = []
): PowerliftingRank {
  const lift = liftForExerciseName[context.exerciseName];
  if (!lift) return { status: "unsupported" };

  const oneRepMax = rankableOneRepMaxKg(context);
  if (!oneRepMax) return { status: "needs", missing: "load" };

  const bodyMass = Number(context.bodyMassKgAtTest);
  if (!Number.isFinite(bodyMass) || bodyMass <= 0) return { status: "needs", missing: "body_mass" };
  if (!context.sex) return { status: "needs", missing: "sex" };
  if (!context.ageYears || !Number.isFinite(context.ageYears)) return { status: "needs", missing: "age" };

  const matchedBand = registryNorms
    .filter((row) => row.exerciseName === context.exerciseName && row.sex === context.sex && context.ageYears! >= row.ageMin && context.ageYears! <= row.ageMax)
    .sort((a, b) => a.percentile - b.percentile);
  const usingRegistryBand = matchedBand.length >= 3;
  /**
   * Outside 18-35 the registry's own age band is used when it reaches us. When it
   * does not, the published 18-35 table is still the closest reference there is,
   * and the population label says so rather than the rank being withheld.
   */
  const deciles: readonly [number, number][] = usingRegistryBand
    ? matchedBand.map((row) => [row.percentile, row.relativeStrength])
    : decilesBySexAndLift[context.sex][lift];

  const relativeStrength = Number((oneRepMax.kg / bodyMass).toFixed(2));
  const ageLabel = usingRegistryBand ? ageBandLabel(matchedBand[0].ageMin, matchedBand[0].ageMax) : "18–35";
  return {
    status: "ranked",
    lift,
    relativeStrength,
    percentileBandLabel: decileBandLabel(relativeStrength, deciles),
    basis: oneRepMax.basis,
    population: `${context.sex === "male" ? "Male" : "Female"} drug-tested, unequipped powerlifting competitors aged ${ageLabel}`,
    sourceUrl: vanDenHoekSourceUrl,
  };
}

/** What to ask for, in the athlete's words. */
export const powerliftingRankMissingCopy: Record<PowerliftingRankMissing, string> = {
  load: "Add the weight you lifted to see where this ranks.",
  body_mass: "Add your body weight on that day to see where this ranks.",
  sex: "Add the sex to compare against in About Me to see where this ranks.",
  age: "Add your birth year in About Me to see where this ranks.",
};
