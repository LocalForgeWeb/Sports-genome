import type { SexForReference } from "@/components/AthleteBaselineQuiz";

/**
 * The de-identified descriptor a lift carries into the norms pool.
 *
 * Every field is frozen at the moment of the lift, never read back from the
 * athlete's current profile. An athlete who turns 30, gains 8kg, or switches
 * sport does not retroactively move last year's lifts into a different cohort —
 * that would quietly corrupt the very distribution the pool exists to measure.
 *
 * Bands, not values. A 24-year-old 81.2kg male wrestler contributes to
 * "M-2024-080-wrestling", not to a row that identifies him. That is what makes
 * the pool usable for norms without it being a register of individuals.
 *
 * This produces a cohort label and nothing else. It does not compute a
 * percentile, a rank, or a tier — the app states a comparison only on an exact
 * source match, and a pool the app gathered itself is not one of those until it
 * has been reviewed and qualified like any other source.
 */
export type NormsCohort = {
  /** The stable code stored beside the lift. */
  code: string;
  /** The database's compact norming code: 0=unspecified, 1=male, 2=female, 3=other. */
  sexCode: 0 | 1 | 2 | 3;
  /** Inclusive lower bound of the five-year age band; undefined when age is unknown. */
  ageBandStart?: number;
  ageBandEnd?: number;
  /** Inclusive lower bound of the 5kg body-mass band; undefined when weight is unknown. */
  bodyMassBandStartKg?: number;
  bodyMassBandEndKg?: number;
  sportId?: string;
  /** Whether every part of the descriptor is present. A partial cohort is still stored, but it cannot carry a body-mass-relative comparison later. */
  complete: boolean;
};

const AGE_BAND_YEARS = 5;
const BODY_MASS_BAND_KG = 5;

/** Mirrors the `sex_code` comment on athlete_strength_entries so the app and the
 *  database never disagree about what a 2 means. */
const sexCodes: Record<string, NormsCohort["sexCode"]> = {
  male: 1,
  female: 2,
  intersex: 3,
  unspecified: 0,
};

/** Age on the day of the lift, from a birth year. Not the athlete's age today. */
export function ageAtLift(birthYear: number | undefined, observedAt: Date | string): number | undefined {
  if (!birthYear || !Number.isFinite(birthYear)) return undefined;
  const year = new Date(observedAt).getFullYear();
  if (!Number.isFinite(year)) return undefined;
  const age = year - birthYear;
  return age >= 5 && age <= 100 ? age : undefined;
}

function band(value: number, width: number) {
  const start = Math.floor(value / width) * width;
  return { start, end: start + width - 1 };
}

export function normsCohortFor(input: {
  sexForReference?: SexForReference;
  birthYear?: number;
  bodyMassKg?: number;
  sportId?: string;
  observedAt: Date | string;
}): NormsCohort {
  const sexCode = sexCodes[String(input.sexForReference)] ?? 0;
  const age = ageAtLift(input.birthYear, input.observedAt);
  const ageBand = age === undefined ? undefined : band(age, AGE_BAND_YEARS);
  const mass = Number.isFinite(input.bodyMassKg) && (input.bodyMassKg ?? 0) > 0 ? Number(input.bodyMassKg) : undefined;
  const massBand = mass === undefined ? undefined : band(mass, BODY_MASS_BAND_KG);
  const sportId = input.sportId?.trim() || undefined;

  const parts = [
    `s${sexCode}`,
    ageBand ? `${String(ageBand.start).padStart(2, "0")}${String(ageBand.end).padStart(2, "0")}` : "xxxx",
    massBand ? String(massBand.start).padStart(3, "0") : "xxx",
    sportId ?? "unspecified",
  ];

  return {
    code: parts.join("-"),
    sexCode,
    ageBandStart: ageBand?.start,
    ageBandEnd: ageBand?.end,
    bodyMassBandStartKg: massBand?.start,
    bodyMassBandEndKg: massBand?.end,
    sportId,
    complete: sexCode !== 0 && ageBand !== undefined && massBand !== undefined && sportId !== undefined,
  };
}

/** A human-readable rendering of the cohort, for anywhere the athlete is shown what their lift contributes to. */
export function describeNormsCohort(cohort: NormsCohort): string {
  const sex = ["Unspecified", "Male", "Female", "Other"][cohort.sexCode];
  const age = cohort.ageBandStart === undefined ? "age not set" : `${cohort.ageBandStart}–${cohort.ageBandEnd}`;
  const mass = cohort.bodyMassBandStartKg === undefined ? "weight not set" : `${cohort.bodyMassBandStartKg}–${cohort.bodyMassBandEndKg} kg`;
  return [sex, age, mass, cohort.sportId ?? "sport not set"].join(" · ");
}
