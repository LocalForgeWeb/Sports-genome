import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildExpansionMigration, canonicalNameFor, expansionExercises, MIGRATION_NAME, NEW_MUSCLES, plannedMappings, unmappedKeys } from "../../../scripts/exercise-expansion/migrationSql";
import { muscleCanonicalNameToRegionId, preparedMigrationMuscles } from "@shared/capabilityRank";
import { catalogIdFromCanonicalName } from "../../../server/supabaseStrengthCurves";

const dir = resolve(process.cwd(), "supabase/prepared/exercise_expansion_v1");

describe("the prepared expansion migration (brief §7)", () => {
  it("is exactly what the generator writes from the catalog, so the rows cannot drift", () => {
    const { up, down } = buildExpansionMigration();
    expect(readFileSync(resolve(dir, `${MIGRATION_NAME}.sql`), "utf8")).toBe(up);
    expect(readFileSync(resolve(dir, `${MIGRATION_NAME}.rollback.sql`), "utf8")).toBe(down);
    expect(up).toMatch(/PREPARED, NOT APPLIED/);
  });

  it("is idempotent: every insert stops on conflict", () => {
    const { up } = buildExpansionMigration();
    const inserts = up.match(/insert into/g) ?? [];
    const guarded = up.match(/on conflict \([a-z_, ]+\) do nothing;/g) ?? [];
    expect(inserts.length).toBe(5);
    expect(guarded.length).toBe(inserts.length);
  });

  it("gives every record one canonical name that resolves back to its own catalog id", () => {
    const names = expansionExercises().map(canonicalNameFor);
    expect(new Set(names).size).toBe(50);
    expansionExercises().forEach((exercise) => expect(catalogIdFromCanonicalName(canonicalNameFor(exercise))).toBe(exercise.id));
  });

  it("maps every tagged key to real muscles, with the documented weights and roles", () => {
    expect(unmappedKeys()).toEqual([]);
    const rows = plannedMappings();
    expect(rows.every((row) => ["primary", "secondary", "stabilizer"].includes(row.role))).toBe(true);
    for (const exercise of expansionExercises()) expect(rows.some((row) => row.catalogId === exercise.id && row.role === "primary"), exercise.name).toBe(true);
    // Every muscle named is one the database already has or the migration adds, and the region map decides it.
    expect(rows.every((row) => row.muscle in muscleCanonicalNameToRegionId)).toBe(true);
    expect(NEW_MUSCLES.map((muscle) => muscle.canonical).sort()).toEqual([...preparedMigrationMuscles].sort());
    // The forearm-rotation records name their own muscles, not the generic flexor group.
    expect(rows.filter((row) => row.catalogId === 409).map((row) => row.muscle)).toEqual(["pronator_teres", "pronator_quadratus"]);
    expect(rows.filter((row) => row.catalogId === 410).map((row) => row.muscle)).toEqual(["supinator", "biceps_brachii"]);
  });

  it("routes every record to the explicit unsupported scoring policy", () => {
    const { up } = buildExpansionMigration();
    expect(up).toMatch(/'unsupported', v\.load_semantics, null/);
    expect(up).not.toMatch(/'loaded_e1rm'/);
    // The database vocabulary has no assistance or setting value: those read not_applicable.
    expect(up).toMatch(/\('assisted_pull_up_machine__catalog_421', 'not_applicable'\)/);
    expect(up).toMatch(/\('suitcase_carry__catalog_441', 'per_hand'\)/);
  });
});
