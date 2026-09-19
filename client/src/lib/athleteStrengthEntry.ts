import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";
import { ageAtLift } from "@/lib/normsCohort";

/**
 * Shapes a recorded lift into a row for `public.athlete_strength_entries`.
 *
 * The table already exists in the Sports Genome Supabase project, and its own
 * comment states the contract this file has to honour: "Demographic and
 * bodyweight fields are snapshots at the time of the lift so later profile
 * changes do not rewrite historical cohort context." So every value here is
 * read from what was true on the day of the lift, never from the athlete's
 * profile as it stands now.
 *
 * Nothing in this file talks to the network. It is the pure translation from
 * what the app records to what the column expects, so it can be tested against
 * the real check constraints without a database, and so the sync itself stays a
 * thin call once authentication exists.
 *
 * Column facts this mirrors, read from the live schema rather than assumed:
 *  - `user_id` defaults to `auth.uid()`, so a client insert omits it.
 *  - `load_kg` is generated from `reported_load_value` + `reported_load_unit`;
 *    it is never sent.
 *  - `reported_load_unit` is checked against lower() in ('kg','lb').
 *  - `reps` is checked 1..300, `rpe` 0..10, `rir` 0..15, `age_years` 3..120,
 *    and `bodyweight_kg` must be > 0 when present.
 */
export type AthleteStrengthEntryRow = {
  /** uuid from `public.exercises`, resolved through `app_exercise_source_mappings`. */
  exercise_id: string;
  performed_at: string;
  /** 1=working_set, 2=tested_1rm, 3=competition_result. */
  entry_type_code: 1 | 2 | 3;
  /** 1=user_manual, 2=imported, 3=device, 4=coach_entered. */
  source_code: 1 | 2 | 3 | 4;
  /** 0=bilateral/not_applicable, 1=left, 2=right. */
  side_code: 0 | 1 | 2;
  reported_load_value?: number;
  reported_load_unit: "kg" | "lb";
  reps?: number;
  rpe?: number;
  rir?: number;
  /** Snapshot: what the athlete weighed on the day of this lift. */
  bodyweight_kg?: number;
  /** Snapshot: the athlete's age on the day of this lift. */
  age_years?: number;
  /** Snapshot: 0=unspecified, 1=male, 2=female, 3=other. */
  sex_code: 0 | 1 | 2 | 3;
  /** Snapshot: uuid from `public.sports`. */
  sport_id?: string;
  load_semantics?: string;
  equipment_detail?: string;
  notes?: string;
};

/** The database's own compact norming code, mirrored so the app speaks one vocabulary. */
export const sexCodeFor = (sex: SexForReference | undefined): 0 | 1 | 2 | 3 =>
  sex === "male" ? 1 : sex === "female" ? 2 : sex === "intersex" ? 3 : 0;

const inRange = (value: number | undefined, min: number, max: number) =>
  value !== undefined && Number.isFinite(value) && value >= min && value <= max ? value : undefined;

export type RecordedLift = {
  /** The app catalog's integer id, which the mapping table resolves to a uuid. */
  catalogExerciseId: number;
  observedAt: Date | string;
  measurementType: string;
  /** As the athlete entered it, in their own unit — the generated column does the conversion. */
  reportedLoad?: number;
  reportedUnit: DisplayWeightUnit;
  repetitions?: number;
  laterality?: string | null;
  /** From the dated weight log, at this lift's date. */
  bodyMassKgAtTest?: number;
  /** From the device tracker, or typed into the Strength Genome form. */
  source: "device" | "user_manual" | "imported" | "coach_entered";
  equipmentDetail?: string;
  loadSemantics?: string;
  notes?: string;
};

export type AthleteSnapshot = {
  sexForReference?: SexForReference;
  birthYear?: number;
  /** uuid from `public.sports`; undefined until the app's sport ids are mapped. */
  sportId?: string;
};

const entryTypeCodes: Record<string, 1 | 2 | 3> = {
  MULTI_REP: 1,
  BODYWEIGHT: 1,
  MEASURED_1RM: 2,
};

const sourceCodes: Record<RecordedLift["source"], 1 | 2 | 3 | 4> = {
  user_manual: 1,
  imported: 2,
  device: 3,
  coach_entered: 4,
};

/**
 * Returns the row, or null when the lift cannot satisfy the table's own checks.
 * Refusing is the right answer: a set with no reps would fail `reps >= 1` at the
 * database anyway, and silently coercing it to 1 would put a number in the norms
 * pool that the athlete never performed.
 */
export function toAthleteStrengthEntry(
  lift: RecordedLift,
  athlete: AthleteSnapshot,
  exerciseUuid: string | undefined,
): AthleteStrengthEntryRow | null {
  if (!exerciseUuid) return null;
  const performedAt = new Date(lift.observedAt);
  if (Number.isNaN(performedAt.getTime())) return null;

  const reps = inRange(lift.repetitions, 1, 300);
  const load = lift.reportedLoad !== undefined && Number.isFinite(lift.reportedLoad) && lift.reportedLoad >= 0 ? lift.reportedLoad : undefined;
  // A row that carries neither a load nor reps describes nothing.
  if (reps === undefined && load === undefined) return null;

  return {
    exercise_id: exerciseUuid,
    performed_at: performedAt.toISOString(),
    entry_type_code: entryTypeCodes[lift.measurementType] ?? 1,
    source_code: sourceCodes[lift.source],
    side_code: lift.laterality === "LEFT" ? 1 : lift.laterality === "RIGHT" ? 2 : 0,
    reported_load_value: load,
    reported_load_unit: lift.reportedUnit === "kg" ? "kg" : "lb",
    reps,
    bodyweight_kg: lift.bodyMassKgAtTest !== undefined && lift.bodyMassKgAtTest > 0 ? Number(lift.bodyMassKgAtTest.toFixed(2)) : undefined,
    age_years: inRange(ageAtLift(athlete.birthYear, performedAt), 3, 120),
    sex_code: sexCodeFor(athlete.sexForReference),
    sport_id: athlete.sportId,
    load_semantics: lift.loadSemantics,
    equipment_detail: lift.equipmentDetail,
    notes: lift.notes,
  };
}

/**
 * Drops the keys the row leaves undefined, so an insert sends only what it
 * means and every column default (`user_id` = auth.uid(), `load_semantics` =
 * 'unknown') still applies.
 */
export function forInsert(row: AthleteStrengthEntryRow): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}
