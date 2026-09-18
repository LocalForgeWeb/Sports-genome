import { describe, expect, it } from "vitest";
import { forInsert, sexCodeFor, toAthleteStrengthEntry, type RecordedLift } from "./athleteStrengthEntry";
import { normsCohortFor, ageAtLift } from "./normsCohort";

const UUID = "11111111-2222-3333-4444-555555555555";
const lift = (over: Partial<RecordedLift> = {}): RecordedLift => ({
  catalogExerciseId: 1,
  observedAt: "2026-06-10T18:00:00.000Z",
  measurementType: "MULTI_REP",
  reportedLoad: 225,
  reportedUnit: "lb",
  repetitions: 8,
  bodyMassKgAtTest: 81.65,
  source: "device",
  ...over,
});
const athlete = { sexForReference: "male" as const, birthYear: 1998, sportId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" };

describe("shaping a lift for public.athlete_strength_entries", () => {
  it("sends the load as entered and lets the generated column convert it", () => {
    const row = toAthleteStrengthEntry(lift(), athlete, UUID)!;
    expect(row.reported_load_value).toBe(225);
    expect(row.reported_load_unit).toBe("lb");
    // load_kg is generated in Postgres; sending it would fight the column.
    expect(Object.keys(row)).not.toContain("load_kg");
    expect(Object.keys(row)).not.toContain("user_id");
  });

  it("snapshots demographics at the lift, not at today", () => {
    const row = toAthleteStrengthEntry(lift({ observedAt: "2020-06-10T18:00:00.000Z" }), athlete, UUID)!;
    expect(row.age_years).toBe(2020 - 1998);
    expect(row.sex_code).toBe(1);
    expect(row.bodyweight_kg).toBe(81.65);
    expect(row.sport_id).toBe(athlete.sportId);
  });

  it("uses the database's own compact norming code for sex", () => {
    expect(sexCodeFor("male")).toBe(1);
    expect(sexCodeFor("female")).toBe(2);
    expect(sexCodeFor("intersex")).toBe(3);
    expect(sexCodeFor(undefined)).toBe(0);
    expect(sexCodeFor("unspecified")).toBe(0);
  });

  it("maps measurement and provenance onto the smallint codes the checks allow", () => {
    expect(toAthleteStrengthEntry(lift(), athlete, UUID)!.entry_type_code).toBe(1);
    expect(toAthleteStrengthEntry(lift({ measurementType: "MEASURED_1RM" }), athlete, UUID)!.entry_type_code).toBe(2);
    expect(toAthleteStrengthEntry(lift({ source: "user_manual" }), athlete, UUID)!.source_code).toBe(1);
    expect(toAthleteStrengthEntry(lift({ source: "device" }), athlete, UUID)!.source_code).toBe(3);
    expect(toAthleteStrengthEntry(lift({ laterality: "LEFT" }), athlete, UUID)!.side_code).toBe(1);
    expect(toAthleteStrengthEntry(lift({ laterality: null }), athlete, UUID)!.side_code).toBe(0);
  });

  it("refuses a row the table's own checks would reject rather than coercing it", () => {
    // reps is CHECK (reps >= 1 AND reps <= 300).
    expect(toAthleteStrengthEntry(lift({ repetitions: 0, reportedLoad: undefined }), athlete, UUID)).toBeNull();
    expect(toAthleteStrengthEntry(lift({ repetitions: 500, reportedLoad: undefined }), athlete, UUID)).toBeNull();
    // Nothing recorded at all describes nothing.
    expect(toAthleteStrengthEntry(lift({ repetitions: undefined, reportedLoad: undefined }), athlete, UUID)).toBeNull();
    // An unmapped exercise has no uuid to reference, and exercise_id is a foreign key.
    expect(toAthleteStrengthEntry(lift(), athlete, undefined)).toBeNull();
  });

  it("keeps an unloaded but repped set, which is a real bodyweight record", () => {
    const row = toAthleteStrengthEntry(lift({ reportedLoad: undefined, repetitions: 12 }), athlete, UUID)!;
    expect(row.reps).toBe(12);
    expect(row.reported_load_value).toBeUndefined();
  });

  it("drops undefined keys so every column default still applies on insert", () => {
    const row = toAthleteStrengthEntry(lift({ reportedLoad: undefined }), { }, UUID)!;
    const payload = forInsert(row);
    expect(payload).not.toHaveProperty("reported_load_value");
    expect(payload).not.toHaveProperty("sport_id");
    expect(payload).toHaveProperty("sex_code", 0);
  });

  it("omits a body weight the athlete never recorded rather than inventing one", () => {
    const row = toAthleteStrengthEntry(lift({ bodyMassKgAtTest: undefined }), athlete, UUID)!;
    expect(row.bodyweight_kg).toBeUndefined();
  });
});

describe("the norms cohort a lift contributes to", () => {
  it("bands age and body mass, and names no individual", () => {
    const cohort = normsCohortFor({ sexForReference: "male", birthYear: 1998, bodyMassKg: 81.65, sportId: "wrestling", observedAt: "2026-06-10" });
    expect(cohort.ageBandStart).toBe(25);
    expect(cohort.ageBandEnd).toBe(29);
    expect(cohort.bodyMassBandStartKg).toBe(80);
    expect(cohort.code).toBe("s1-2529-080-wrestling");
    expect(cohort.complete).toBe(true);
  });

  it("freezes the cohort at the lift, so ageing does not move last year's lift", () => {
    expect(ageAtLift(1998, "2026-06-10")).toBe(28);
    expect(ageAtLift(1998, "2020-06-10")).toBe(22);
    const then = normsCohortFor({ sexForReference: "male", birthYear: 1998, bodyMassKg: 90, sportId: "wrestling", observedAt: "2020-06-10" });
    const now = normsCohortFor({ sexForReference: "male", birthYear: 1998, bodyMassKg: 81, sportId: "wrestling", observedAt: "2026-06-10" });
    expect(then.code).not.toBe(now.code);
  });

  it("marks a partial descriptor incomplete instead of guessing the missing part", () => {
    const cohort = normsCohortFor({ observedAt: "2026-06-10" });
    expect(cohort.complete).toBe(false);
    expect(cohort.code).toBe("s0-xxxx-xxx-unspecified");
    expect(cohort.ageBandStart).toBeUndefined();
    expect(cohort.bodyMassBandStartKg).toBeUndefined();
  });
});
