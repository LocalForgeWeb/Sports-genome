import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CURRENT_SEED_MIGRATION_PATH } from "../scripts/specialization/emit-seed";
import { APPLIED_MIGRATION_PATHS, SEED_MIGRATION_PATH } from "./fixtures/specializationPg";

/**
 * Migration files production has recorded are history: the database ran exactly these bytes,
 * and `supabase_migrations.schema_migrations` holds them under these names (04-database.md §9).
 * A change to one would make the repository disagree with production without anything
 * running again, so this pins each by its full SHA-256 (10-multi-region.md §5.2). A file joins
 * the list in the first commit to main after production records it.
 */
const applied: Record<string, string> = {
  "20261016120000_specialization_atlas_schema.sql": "b67a9cd7a90383c205686e17b029a55ffd5a59ee4d928189d3a7d16296da542d",
  "20261016120100_specialization_atlas_seed_v1.sql": "a267fdc4997699401822c2f4166a97b427fe28d8081bebcba037f963a35189f8",
  // Recorded on 22 Oct 2026 (wave 0), from commit 14c0010.
  "20261019120000_specialization_atlas_schema_v2.sql": "3de6e262939c25d15ba47a6cdd48d1f0527e7dedbb0775beeb7c98a81b9531fa",
  "20261019120100_specialization_atlas_seed_v2.sql": "b3798fd6d35999789d6c0f790e80a24f9a32a7b96e70d986f9e88c5a007cfea8",
  // Recorded on 24 Oct 2026 (wave A), from commit 068ed73.
  "20261022120100_specialization_atlas_seed_v3.sql": "302f865dff4442d032678a6862dab412b6a2f0cae548a2a5cd05c1970ebc2967",
};

const migrations = resolve(process.cwd(), "supabase/migrations");
const sha256 = (name: string) => createHash("sha256").update(readFileSync(resolve(migrations, name))).digest("hex");

describe("applied specialization migrations", () => {
  it.each(Object.entries(applied))("%s is byte for byte what production ran", (name, digest) => {
    expect(sha256(name)).toBe(digest);
  });

  it("the test database replays exactly the applied files, in production's order", () => {
    expect(APPLIED_MIGRATION_PATHS.map((path) => basename(path))).toEqual(Object.keys(applied));
  });

  it("the emitter writes a seed production has not recorded, after every applied file", () => {
    const current = basename(CURRENT_SEED_MIGRATION_PATH);
    expect(SEED_MIGRATION_PATH).toBe(CURRENT_SEED_MIGRATION_PATH);
    expect(Object.keys(applied)).not.toContain(current);
    const specialization = readdirSync(migrations).filter((name) => name.includes("_specialization_atlas_")).sort();
    expect(specialization.slice(0, Object.keys(applied).length)).toEqual(Object.keys(applied));
    expect(specialization).toContain(current);
  });
});
