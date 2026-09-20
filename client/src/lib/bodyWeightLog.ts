import { displayWeightToKilograms, kilogramsToDisplayWeight, type DisplayWeightUnit } from "@/lib/weightUnits";

/**
 * Body weight is not a setting. It is a measurement with a date.
 *
 * The profile carried a single mutable `bodyWeight`, and every surface that
 * needed a ratio read whatever was in it *now* — so an athlete who dropped ten
 * pounds silently rewrote the meaning of every lift they had ever recorded. The
 * Strength Genome's own copy admitted the hazard and pushed it onto the athlete:
 * "Change it first only if your test-day weight differed."
 *
 * So weight is an append-only log. Changing it records a new entry; nothing
 * overwrites what an earlier lift was measured against. A lift is stamped with
 * the weight in effect on the day it happened, and that stamp stays put
 * afterwards.
 *
 * Kilograms is the stored unit, because that is what every consumer computes in
 * and what the server's `bodyMassObservations` column already holds. The
 * athlete's chosen display unit is recorded alongside so their own entry can be
 * shown back to them exactly as they typed it.
 */
export type BodyWeightEntry = {
  /** The measurement, always in kilograms. */
  bodyMassKg: number;
  /** The unit the athlete typed it in, for display only. */
  enteredUnit: DisplayWeightUnit;
  /** The day this weight was true from, as an ISO instant. */
  observedAt: string;
  /** Whether the athlete typed it or it arrived with an imported record. */
  source: "athlete_entry" | "onboarding" | "workout_import";
};

export const bodyWeightLogKey = "sports-genome-body-weight-log-v1";
export const bodyWeightLogEvent = "sports-genome:body-weight-log";

function sortedByDate(entries: readonly BodyWeightEntry[]): BodyWeightEntry[] {
  return [...entries].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
}

export function loadBodyWeightLog(): BodyWeightEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(bodyWeightLogKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return sortedByDate(parsed.filter((entry): entry is BodyWeightEntry =>
      Boolean(entry) && Number.isFinite(Number(entry.bodyMassKg)) && Number(entry.bodyMassKg) > 0 && typeof entry.observedAt === "string"
    ).map((entry) => ({
      bodyMassKg: Number(entry.bodyMassKg),
      enteredUnit: entry.enteredUnit === "kg" ? "kg" : "lb",
      observedAt: entry.observedAt,
      source: entry.source === "onboarding" || entry.source === "workout_import" ? entry.source : "athlete_entry",
    })));
  } catch {
    return [];
  }
}

/** Returns whether the write reached the device, the way the workout log does. */
export function saveBodyWeightLog(entries: readonly BodyWeightEntry[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(bodyWeightLogKey, JSON.stringify(sortedByDate(entries)));
    window.dispatchEvent(new Event(bodyWeightLogEvent));
    return true;
  } catch {
    return false;
  }
}

/**
 * Appends a measurement. Two entries on the same day are one correction rather
 * than two weigh-ins — the later value replaces the earlier one, so fixing a
 * typo does not leave a phantom weight in the history.
 */
export function recordBodyWeight(
  existing: readonly BodyWeightEntry[],
  displayWeight: number,
  unit: DisplayWeightUnit,
  observedAt: Date | string = new Date(),
  source: BodyWeightEntry["source"] = "athlete_entry",
): BodyWeightEntry[] {
  if (!Number.isFinite(displayWeight) || displayWeight <= 0) return sortedByDate(existing);
  const stamp = typeof observedAt === "string" ? observedAt : observedAt.toISOString();
  const day = stamp.slice(0, 10);
  const entry: BodyWeightEntry = {
    bodyMassKg: displayWeightToKilograms(displayWeight, unit),
    enteredUnit: unit,
    observedAt: stamp,
    source,
  };
  return sortedByDate([...existing.filter((item) => item.observedAt.slice(0, 10) !== day), entry]);
}

/**
 * The weight in effect on a given date: the most recent measurement at or
 * before it. A lift recorded before the athlete ever entered a weight has no
 * body mass, and this returns undefined rather than reaching forward to a
 * number that was not true yet.
 */
export function bodyWeightKgAt(entries: readonly BodyWeightEntry[], when: Date | string): number | undefined {
  const at = new Date(when).getTime();
  if (!Number.isFinite(at)) return undefined;
  const inEffect = sortedByDate(entries).filter((entry) => new Date(entry.observedAt).getTime() <= at);
  return inEffect.length ? inEffect[inEffect.length - 1].bodyMassKg : undefined;
}

/** The athlete's weight right now, for prefilling a new entry. */
export function currentBodyWeightKg(entries: readonly BodyWeightEntry[]): number | undefined {
  const sorted = sortedByDate(entries);
  return sorted.length ? sorted[sorted.length - 1].bodyMassKg : undefined;
}

/** The latest entry rendered in the athlete's own unit, for the profile field. */
export function currentBodyWeightDisplay(entries: readonly BodyWeightEntry[]): { value: number; unit: DisplayWeightUnit } | undefined {
  const sorted = sortedByDate(entries);
  const latest = sorted[sorted.length - 1];
  if (!latest) return undefined;
  return { value: Number(kilogramsToDisplayWeight(latest.bodyMassKg, latest.enteredUnit).toFixed(1)), unit: latest.enteredUnit };
}

/**
 * Seeds the log from a profile that predates it, so an athlete who entered a
 * weight during onboarding does not appear to have no history. Runs once: if
 * the log already holds anything, the profile value is not re-applied.
 */
export function seedBodyWeightLog(
  existing: readonly BodyWeightEntry[],
  profileWeight: number | undefined,
  unit: DisplayWeightUnit,
  observedAt: Date | string = new Date(),
): BodyWeightEntry[] {
  if (existing.length || !profileWeight || profileWeight <= 0) return sortedByDate(existing);
  return recordBodyWeight(existing, profileWeight, unit, observedAt, "onboarding");
}
