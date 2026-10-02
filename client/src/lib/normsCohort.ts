/**
 * The athlete's age as it stood when a lift happened, never read back from
 * today. An athlete who turns 30 does not retroactively make last year's lift a
 * 30-year-old's lift.
 *
 * A lift's context travels as raw snapshot fields on its strength entry
 * (`age_years`, `sex_code`, `bodyweight_kg`, `sport_id` in
 * athleteStrengthEntry.ts), each frozen on the day of the lift. Nothing here
 * groups them into cohorts or bands.
 */

/**
 * Age in the calendar year of the lift, from a birth year. Not the athlete's age
 * today. Undefined when the birth year is missing or the age falls outside 5–100.
 */
export function ageAtLift(birthYear: number | undefined, observedAt: Date | string): number | undefined {
  if (!birthYear || !Number.isFinite(birthYear)) return undefined;
  const year = new Date(observedAt).getFullYear();
  if (!Number.isFinite(year)) return undefined;
  const age = year - birthYear;
  return age >= 5 && age <= 100 ? age : undefined;
}
