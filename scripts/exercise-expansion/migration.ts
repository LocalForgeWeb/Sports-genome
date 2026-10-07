/**
 * Writes the prepared expansion migration and its rollback from the app catalog.
 *
 *   npx tsx scripts/exercise-expansion/migration.ts
 *
 * PREPARED, NOT APPLIED (B009). See migrationSql.ts for what it contains.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildExpansionMigration, MIGRATION_NAME, unmappedKeys } from "./migrationSql";

const missing = unmappedKeys();
if (missing.length) throw new Error(`catalog keys with no database muscles: ${missing.join(", ")}`);
const dir = resolve(import.meta.dirname, "../../supabase/prepared/exercise_expansion_v1");
mkdirSync(dir, { recursive: true });
const { up, down } = buildExpansionMigration();
writeFileSync(resolve(dir, `${MIGRATION_NAME}.sql`), up);
writeFileSync(resolve(dir, `${MIGRATION_NAME}.rollback.sql`), down);
console.log(`wrote ${MIGRATION_NAME}.sql (${up.length} bytes) and its rollback`);
