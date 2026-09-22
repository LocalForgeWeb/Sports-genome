import type { ComparableStrengthObservation, WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";
import { catalogExerciseIdForName, strengthPercentileCard, strengthPercentileGapCopy, type StrengthPercentileCard } from "@/lib/strengthPercentileCard";

/**
 * The Progress section's side of the beta percentile route.
 *
 * The engine, the curves and the card copy all existed, and were wired to exactly
 * one screen: the Strength Genome's record sheet, one lift at a time, after a
 * "Review" tap. The Progress section computed a trend for every lift and never
 * asked where any of them sat. This turns each trend's latest log into the same
 * request that sheet makes, so the two screens describe one lift with one number.
 *
 * Pure, so the request-building and the summary can be checked without a panel.
 */

export type PercentileLiftRequest = {
  catalogExerciseId: number | null;
  exerciseName: string;
  sex: "male" | "female" | null;
  bodyMassKg: number | null;
  measuredOneRmKg: number | null;
  loadKg: number | null;
  repetitions: number | null;
};

export type PercentileLift = {
  /** Matches the trend card it belongs to. */
  key: string;
  exerciseName: string;
  request: PercentileLiftRequest;
  /** Which weight the lift is read against, so the card can say when it is borrowed. */
  bodyMassSource: "recorded" | "profile" | null;
};

/** The two answers the curves are split by; anything else is not placed rather than guessed. */
export function percentileSexFor(sexForReference?: string | null): "male" | "female" | null {
  return sexForReference === "male" || sexForReference === "female" ? sexForReference : null;
}

export function trendKey(change: Pick<WithinAthleteStrengthChange, "exerciseName" | "laterality">): string {
  return `${change.exerciseName}-${change.laterality}`;
}

/**
 * One request per trend, from the log the trend's latest point came from.
 *
 * The trend keeps only an estimated 1RM; the route wants what was actually lifted,
 * because its own estimate (the mean of two formulas, with its own confidence) is
 * part of what the version defines. So the latest point is traced back to the raw
 * observation and the load, reps and measurement type travel from there.
 */
export function liftsToPlace(
  changes: readonly WithinAthleteStrengthChange[],
  history: readonly ComparableStrengthObservation[],
  bodyMassKgById: ReadonlyMap<string, number>,
  context: { sex: "male" | "female" | null; fallbackBodyMassKg?: number | null }
): PercentileLift[] {
  const byId = new Map(history.map((observation) => [String(observation.id), observation]));
  const lifts: PercentileLift[] = [];
  for (const change of changes) {
    const observation = byId.get(String(change.latestPoint.id));
    if (!observation) continue;
    const loadKg = Number(observation.loadKg);
    if (!Number.isFinite(loadKg) || loadKg <= 0) continue;
    const measured = observation.measurementType === "MEASURED_1RM";
    const repetitions = observation.repetitions ?? null;
    if (!measured && (repetitions === null || repetitions < 1)) continue;

    const recorded = bodyMassKgById.get(String(observation.id));
    const fallback = context.fallbackBodyMassKg ?? null;
    const bodyMassSource: PercentileLift["bodyMassSource"] = recorded && recorded > 0 ? "recorded" : fallback && fallback > 0 ? "profile" : null;
    const bodyMassKg = bodyMassSource === "recorded" ? recorded! : bodyMassSource === "profile" ? fallback! : null;

    lifts.push({
      key: trendKey(change),
      exerciseName: change.exerciseName,
      bodyMassSource,
      request: {
        catalogExerciseId: catalogExerciseIdForName(change.exerciseName) ?? null,
        exerciseName: change.exerciseName,
        sex: context.sex,
        bodyMassKg,
        measuredOneRmKg: measured ? loadKg : null,
        loadKg: measured ? null : loadKg,
        repetitions: measured ? null : repetitions,
      },
    });
  }
  return lifts;
}

export type ProgressPercentileSummary = {
  /** A card per trend that was placed, keyed like the trend. */
  cards: Map<string, StrengthPercentileCard & { percentile: number; bodyMassSource: PercentileLift["bodyMassSource"] }>;
  placed: number;
  /** The strongest placement, for the headline. */
  best: { exerciseName: string; percentile: number; headline: string } | null;
  /**
   * The one thing the athlete could give to get placements, when nothing was placed and
   * that is the reason. Sex first: it unlocks every lift; body weight only the relative ones.
   */
  gap: string | null;
};

export function summarizeProgressPercentiles(
  lifts: readonly PercentileLift[],
  results: readonly StrengthPercentileResult[] | undefined,
  sex: "male" | "female" | null
): ProgressPercentileSummary {
  const cards: ProgressPercentileSummary["cards"] = new Map();
  let best: ProgressPercentileSummary["best"] = null;
  const reasons = new Set<string>();
  (results ?? []).forEach((result, index) => {
    const lift = lifts[index];
    if (!lift) return;
    if (result.status === "resolved" && sex) {
      const card = strengthPercentileCard(result, { sex, bodyMassKg: lift.request.bodyMassKg });
      if (!card) return;
      cards.set(lift.key, { ...card, percentile: result.percentile, bodyMassSource: lift.bodyMassSource });
      if (!best || result.percentile > best.percentile) best = { exerciseName: lift.exerciseName, percentile: result.percentile, headline: card.headline };
    } else if (result.status === "unavailable") {
      reasons.add(result.reason);
    }
  });
  const gap = cards.size === 0
    ? reasons.has("sex_required") ? strengthPercentileGapCopy.sex_required ?? null
      : reasons.has("body_mass_required") ? strengthPercentileGapCopy.body_mass_required ?? null
      : null
    : null;
  return { cards, placed: cards.size, best, gap };
}
