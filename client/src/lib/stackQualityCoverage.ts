/**
 * What athletic qualities a stack actually trains, against what the sport asks for.
 *
 * Two vocabularies already existed and had never been put side by side. Every
 * catalog exercise carries `qualities` tags - antiRotation, bracing, deceleration,
 * grip, elasticity - and every sport in the demand register carries a list of
 * `SportDemandKey`s. Nothing joined them, so an athlete building a Push day for
 * baseball could not see that the register asks for trunk bracing and their stack
 * contains none.
 *
 * The join is deliberately narrow. A quality maps to a demand only where the two
 * name the same thing; anything requiring interpretation is left unmapped rather
 * than stretched, because a wrong mapping here becomes a confident, wrong
 * sentence on the athlete's screen.
 */

import type { Exercise } from "@/lib/exerciseCatalog";
import { matchesTrainingSplit, type TrainingSplit } from "@/lib/splitAssignment";
import { getSportDemandModel, type SportDemandKey } from "@/lib/hierarchicalSportModel";

/**
 * Direct correspondences only.
 *
 * `bracing` maps to `antiRotation` because the register's own label for that
 * demand is "Trunk bracing" - the two are the same concept under two names.
 */
export const qualityToDemand: Readonly<Record<string, SportDemandKey>> = {
  antiRotation: "antiRotation",
  bracing: "antiRotation",
  rotation: "rotationalPower",
  deceleration: "deceleration",
  power: "power",
  grip: "grip",
  elasticity: "elasticStrength",
  eccentric: "eccentricStrength",
  jumping: "plyometricAbility",
  balance: "balance",
  coordination: "coordination",
  mobility: "mobility",
  stability: "stability",
  strength: "maxStrength",
  endurance: "strengthEndurance",
  lateralControl: "changeOfDirection",
};

/**
 * Tags with no direct equivalent in the demand register, listed so the omission
 * reads as a decision rather than an oversight. `hypertrophy` is an adaptation,
 * not a sport quality; `sprintSupport` and `locomotion` describe a contribution
 * rather than a demand; `scapularControl`, `unilateral`, `posture`, `overhead`,
 * `throwing` and `conditioning` each span several register entries.
 */
export const unmappedQualities = [
  "hypertrophy", "scapularControl", "unilateral", "posture",
  "locomotion", "conditioning", "throwing", "overhead", "sprintSupport",
] as const;

export type DemandCoverage = {
  key: SportDemandKey;
  label: string;
  /** Exercises in this stack carrying a quality that maps to this demand. */
  exercises: number;
  /** Of the split-compatible catalog, the share carrying it - the honest baseline. */
  splitShare: number;
  /** Whether the sport's own register lists this demand, not an inference. */
  sportAsks: boolean;
};

function demandsForExercise(exercise: Exercise): Set<SportDemandKey> {
  const demands = new Set<SportDemandKey>();
  for (const quality of exercise.qualities || []) {
    const demand = qualityToDemand[quality];
    if (demand) demands.add(demand);
  }
  return demands;
}

export type StackQualityAnalysis = {
  /** Demands the sport's register asks for, most-covered first. */
  covered: DemandCoverage[];
  /** Register demands this stack does not touch at all. */
  absent: DemandCoverage[];
  /** Qualities the stack trains that the sport register does not ask for. */
  extra: DemandCoverage[];
};

export function analyzeStackQualities({ workout, catalog, split, sportId }: {
  workout: readonly Exercise[];
  catalog: readonly Exercise[];
  split: TrainingSplit;
  sportId: string;
}): StackQualityAnalysis {
  // Only what the register actually lists. `getSportDemandModel` scores all 24
  // keys and fills the rest with model estimates; treating those as "your sport
  // asks for this" would invent a demand.
  const model = getSportDemandModel(sportId);
  const asked = new Set(model.demands.filter((demand) => demand.evidenceType === "literature-derived").map((demand) => demand.key));
  const labelOf = new Map(model.demands.map((demand) => [demand.key, demand.label]));

  const pool = catalog.filter((exercise) => matchesTrainingSplit(exercise, split));
  const stackCounts = new Map<SportDemandKey, number>();
  const poolCounts = new Map<SportDemandKey, number>();
  for (const exercise of workout) {
    Array.from(demandsForExercise(exercise)).forEach((demand) => stackCounts.set(demand, (stackCounts.get(demand) || 0) + 1));
  }
  for (const exercise of pool) {
    Array.from(demandsForExercise(exercise)).forEach((demand) => poolCounts.set(demand, (poolCounts.get(demand) || 0) + 1));
  }

  const rowFor = (key: SportDemandKey): DemandCoverage => ({
    key,
    label: labelOf.get(key) || key,
    exercises: stackCounts.get(key) || 0,
    splitShare: pool.length ? Math.round(((poolCounts.get(key) || 0) / pool.length) * 100) : 0,
    sportAsks: asked.has(key),
  });

  const askedRows = Array.from(asked).map(rowFor);
  const extraRows = Array.from(stackCounts.keys())
    .filter((key) => !asked.has(key))
    .map(rowFor)
    .sort((left, right) => right.exercises - left.exercises);

  return {
    covered: askedRows.filter((row) => row.exercises > 0).sort((left, right) => right.exercises - left.exercises),
    // A demand the split's own catalog cannot serve is not the stack's failure,
    // so the ones this split can actually cover come first.
    absent: askedRows.filter((row) => row.exercises === 0).sort((left, right) => right.splitShare - left.splitShare),
    extra: extraRows,
  };
}
