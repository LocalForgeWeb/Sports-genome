import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

/**
 * A Supabase-shaped Postgres in WASM (PGlite 0.4, Postgres 17 like production) for the
 * specialization schema tests: server/specializationSchema.test.ts,
 * server/specializationSchemaV2.test.ts and server/specializationSeed.test.ts.
 *
 * What it reproduces, and how faithfully:
 * - The three API roles. `anon` and `authenticated` are NOLOGIN without BYPASSRLS, and
 *   `service_role` has BYPASSRLS, as in production (checked read-only on 16 Oct 2026).
 *   The test session is the bootstrap superuser and switches identity with SET ROLE,
 *   which is what PostgREST does per request, so grants and policies are checked for
 *   real. One difference: production's `postgres` is not a superuser; it only applies
 *   migrations here, so nothing under test depends on it.
 * - `auth.users` (id only) and `auth.uid()` with production's own definition: the
 *   `request.jwt.claim.sub` setting, else `sub` in `request.jwt.claims`.
 * - The `extensions` schema, with btree_gist loaded from PGlite's contrib build.
 * - Stubs of the two public tables the schema references, with production's keys:
 *   `public.muscles` (canonical_name unique) and `public.exercises` (canonical_name
 *   unique, unique (source_repository, source_catalog_id)).
 * - `supabase_migrations.schema_migrations` (version, statements, name), where the
 *   production apply records each file; the replay below records each file the same way.
 * PGlite is one connection, so nothing here tests concurrent writers; the triggers that
 * guard against them are described in the migration and in 04-database.md.
 */

// Applied to production on 18 Oct 2026 and history from then: never edited (server/specializationHistory.test.ts pins them).
export const SCHEMA_MIGRATION_PATH = resolve(process.cwd(), "supabase/migrations/20261016120000_specialization_atlas_schema.sql");
export const SEED_V1_MIGRATION_PATH = resolve(process.cwd(), "supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql");
/** Schema v2 (10-multi-region.md §5.1): written for wave 0, not yet recorded by production. */
export const SCHEMA_V2_MIGRATION_PATH = resolve(process.cwd(), "supabase/migrations/20261019120000_specialization_atlas_schema_v2.sql");
/** The seed the emitter writes from the current content (scripts/specialization/emit-seed.ts), applied after every applied file. */
export const SEED_MIGRATION_PATH = resolve(process.cwd(), "supabase/migrations/20261019120100_specialization_atlas_seed_v2.sql");
/** Every specialization migration production has recorded, in the order it applied them (04-database.md §9). */
export const APPLIED_MIGRATION_PATHS = [SCHEMA_MIGRATION_PATH, SEED_V1_MIGRATION_PATH] as const;
/** Schema files written since, not yet recorded by production, in the order they will apply, before the current seed. */
export const PENDING_MIGRATION_PATHS = [SCHEMA_V2_MIGRATION_PATH] as const;

/**
 * Production's order, one named step per application (10-multi-region.md §5.2): every schema
 * file twice, to show it can be applied again, each applied seed once, then the current seed.
 */
export const MIGRATION_STEPS = [
  { step: "schema v1", path: SCHEMA_MIGRATION_PATH },
  { step: "schema v1 again", path: SCHEMA_MIGRATION_PATH },
  { step: "seed v1", path: SEED_V1_MIGRATION_PATH },
  { step: "schema v2", path: SCHEMA_V2_MIGRATION_PATH },
  { step: "schema v2 again", path: SCHEMA_V2_MIGRATION_PATH },
  { step: "current seed", path: SEED_MIGRATION_PATH },
] as const;
export type MigrationStep = (typeof MIGRATION_STEPS)[number]["step"];

export const readMigration = (path: string) => readFileSync(path, "utf8");

export const USER_A = "00000000-0000-4000-8000-00000000000a";
export const USER_B = "00000000-0000-4000-8000-00000000000b";

/** Rows of public.exercises: matched by catalog id, by the canonical-name suffix only, and not at all. */
export const stubExercises = [
  { id: "10000000-0000-4000-8000-000000000139", name: "Wrist Curl", canonical_name: "wrist_curl__catalog_139", source_catalog_id: 139, source_repository: "LocalForgeWeb/Sports-genome" },
  { id: "10000000-0000-4000-8000-000000000140", name: "Reverse Wrist Curl", canonical_name: "reverse_wrist_curl__catalog_140", source_catalog_id: null, source_repository: null },
  { id: "10000000-0000-4000-8000-000000000331", name: "Low Cable Row", canonical_name: "low_cable_row", source_catalog_id: 331, source_repository: "LocalForgeWeb/Sports-genome" },
  // Another repository's id 141 is not the app catalog's exercise 141.
  { id: "10000000-0000-4000-8000-000000009141", name: "Unrelated", canonical_name: "unrelated_research_row", source_catalog_id: 141, source_repository: "Sports Genome research" },
] as const;

const BOOTSTRAP = `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');

create table public.muscles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  canonical_name text not null unique
);
insert into public.muscles (name, canonical_name) values
  ('Brachioradialis', 'brachioradialis'), ('Forearm flexors', 'forearm_flexors'), ('Forearm extensors', 'forearm_extensors'),
  ('Biceps brachii', 'biceps_brachii'), ('Brachialis', 'brachialis');

create table public.exercises (
  id uuid primary key,
  name text not null,
  canonical_name text not null unique,
  source_catalog_id integer,
  source_repository text,
  unique (source_repository, source_catalog_id)
);
insert into public.exercises (id, name, canonical_name, source_catalog_id, source_repository) values
${stubExercises.map((row) => `  ('${row.id}', '${row.name}', '${row.canonical_name}', ${row.source_catalog_id ?? "null"}, ${row.source_repository ? `'${row.source_repository}'` : "null"})`).join(",\n")};

create schema supabase_migrations;
create table supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
`;

/** A fresh database with the Supabase-like bootstrap and nothing of ours applied. */
export async function createSupabaseLikeDb(): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { btree_gist } });
  await db.exec(BOOTSTRAP);
  return db;
}

/** Runs a migration file the way the SQL editor does: one script, one implicit transaction. */
export async function applyMigration(db: PGlite, path: string): Promise<void> {
  await db.exec(readMigration(path));
}

/** A migration file's version and name as `supabase_migrations.schema_migrations` records them. */
export function migrationRecord(path: string): { version: string; name: string } {
  const match = /^(\d{14})_(.+)\.sql$/.exec(basename(path));
  if (!match) throw new Error(`Not a migration file name: ${basename(path)}`);
  return { version: match[1], name: match[2] };
}

/** Records a file as applied, as the production apply does (scripts/specialization/release/make-apply-sql.mjs); once per file. */
export async function recordMigration(db: PGlite, path: string): Promise<void> {
  const { version, name } = migrationRecord(path);
  await db.query("insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, array[$3]) on conflict (version) do nothing", [version, name, readMigration(path)]);
}

/** Applies the steps of MIGRATION_STEPS in order up to and including `through`, leaving out `without`, recording each file. */
export async function replayMigrations(db: PGlite, through: MigrationStep = "current seed", without: readonly MigrationStep[] = []): Promise<void> {
  const last = MIGRATION_STEPS.findIndex((entry) => entry.step === through);
  for (const { step, path } of MIGRATION_STEPS.slice(0, last + 1)) {
    if (without.includes(step)) continue;
    await applyMigration(db, path);
    await recordMigration(db, path);
  }
}

/** A dollar-quote tag (`$name$`, `$name1$`, ...) whose opening `$name` the text never contains. */
function freeTag(text: string, name: string): string {
  for (let n = 0; ; n += 1) {
    const tag = `$${name}${n || ""}$`;
    if (!text.includes(tag.slice(0, -1))) return tag;
  }
}

/**
 * A migration's text as ONE statement, the way it is applied to production through a
 * single SQL call: `do $outer$ declare body text := $body$<file>$body$; begin execute body;
 * end $outer$`. The file runs inside a function's EXECUTE, so it must hold no transaction
 * control and nothing a function cannot run; server/specializationSchema.test.ts checks
 * that this gives the same database as applying the file directly.
 */
export function asDoBlock(sql: string): string {
  const body = freeTag(sql, "body");
  const outer = freeTag(sql + body, "outer");
  return `do ${outer} declare body text := ${body}${sql}${body}; begin execute body; end ${outer};`;
}

/** Applies a migration file as the one DO block above. */
export async function applyMigrationAsDoBlock(db: PGlite, path: string): Promise<void> {
  await db.exec(asDoBlock(readMigration(path)));
}

export type Identity = "postgres" | "anon" | "service_role" | { user: string };

/**
 * Acts as an API caller, the way PostgREST does: the JWT subject in
 * `request.jwt.claim.sub`, then SET ROLE. "postgres" is the migration owner.
 */
export async function actAs(db: PGlite, identity: Identity): Promise<void> {
  await db.exec("reset role");
  const sub = typeof identity === "object" ? identity.user : "";
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [sub]);
  if (identity === "postgres") return;
  await db.exec(`set role ${typeof identity === "object" ? "authenticated" : identity}`);
}

/** Runs `fn` as `identity`, then returns to the migration owner whatever happens. */
export async function as<T>(db: PGlite, identity: Identity, fn: () => Promise<T>): Promise<T> {
  await actAs(db, identity);
  try {
    return await fn();
  } finally {
    await actAs(db, "postgres");
  }
}

export async function rows<T = Record<string, unknown>>(db: PGlite, sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows;
}

export async function count(db: PGlite, sql: string, params: unknown[] = []): Promise<number> {
  const [row] = await rows<{ n: number | string }>(db, `select count(*)::int as n from (${sql}) as counted`, params);
  return Number(row.n);
}

/** The error message a statement fails with, or null when it succeeds. */
export async function failure(db: PGlite, sql: string, params: unknown[] = []): Promise<string | null> {
  try {
    await db.query(sql, params);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** The error a multi-statement script fails with (it runs as one transaction), or null. */
export async function scriptFailure(db: PGlite, sql: string): Promise<string | null> {
  try {
    await db.exec(sql);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Everything the migrations decide, comparable across two databases: random uuids become the
 * keys of the rows they name, and a frozen attribute's time becomes "frozen" (it is the publish's own).
 */
export async function snapshot(database: PGlite) {
  const q = <T = Record<string, unknown>>(sql: string) => rows<T>(database, sql);
  const ns = "n.nspname = 'specialization'";
  const catalog = {
    schema: await q("select nspacl::text as acl, obj_description(oid, 'pg_namespace') as comment from pg_namespace where nspname = 'specialization'"),
    relations: await q<{ relname: string; relkind: string }>(
      `select c.relname, c.relkind::text as relkind, c.relrowsecurity, c.relforcerowsecurity, c.relacl::text as acl, obj_description(c.oid, 'pg_class') as comment
       from pg_class c join pg_namespace n on n.oid = c.relnamespace where ${ns} order by 1`,
    ),
    columns: await q(
      `select table_name, column_name, ordinal_position, data_type, is_nullable, column_default, is_generated, generation_expression,
              col_description(format('specialization.%I', table_name)::regclass, ordinal_position) as comment
       from information_schema.columns where table_schema = 'specialization' order by 1, 3`,
    ),
    constraints: await q(`select t.relname, c.conname, pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace where ${ns} order by 1, 2`),
    indexes: await q("select tablename, indexname, indexdef from pg_indexes where schemaname = 'specialization' order by 1, 2"),
    triggers: await q(`select c.relname, t.tgname, pg_get_triggerdef(t.oid) as def, t.tgenabled::text as enabled from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where ${ns} and not t.tgisinternal order by 1, 2`),
    functions: await q(`select p.oid::regprocedure::text as fn, pg_get_functiondef(p.oid) as def, p.proacl::text as acl, obj_description(p.oid, 'pg_proc') as comment from pg_proc p join pg_namespace n on n.oid = p.pronamespace where ${ns} order by 1`),
    policies: await q("select tablename, policyname, permissive, roles::text as roles, cmd, qual, with_check from pg_policies where schemaname = 'specialization' order by 1, 2"),
    defaultAcls: await q("select defaclrole::regrole::text as role, defaclnamespace::regnamespace::text as schema, defaclobjtype::text as kind, defaclacl::text as acl from pg_default_acl order by 1, 2, 3"),
    extensions: await q("select extname, extnamespace::regnamespace::text as schema from pg_extension order by 1"),
  };
  const tables = catalog.relations.filter((relation) => relation.relkind === "r").map((relation) => relation.relname);
  const raw: Record<string, Record<string, unknown>[]> = {};
  for (const table of tables) raw[table] = (await q<{ row: Record<string, unknown> }>(`select to_jsonb(t) as row from specialization.${table} t`)).map((entry) => entry.row);
  const names = new Map<unknown, string>();
  for (const row of raw.sources) names.set(row.id, `source ${row.source_key}`);
  for (const row of raw.claims) names.set(row.id, `claim ${row.claim_key}`);
  for (const row of raw.diagram_assets) names.set(row.id, `asset ${row.asset_key} v${row.version}`);
  for (const row of raw.mapping_versions) names.set(row.id, `version ${row.version_key}`);
  for (const row of raw.variant_mappings) names.set(row.id, `mapping ${names.get(row.version_id)} ${row.mapping_key}`);
  const value = (key: string, field: unknown) => (key === "frozen_at" && field !== null ? "frozen" : names.get(field) ?? field);
  const data = Object.fromEntries(
    tables.map((table) => [table, raw[table].map((row) => JSON.stringify(Object.fromEntries(Object.entries(row).map(([key, field]) => [key, value(key, field)])))).sort()]),
  );
  return { catalog, data };
}

/** Every row's physical version, table by table: a row is unchanged only if no statement touched it. */
export async function rowVersions(db: PGlite): Promise<Record<string, string[]>> {
  const tables = (await rows<{ relname: string }>(db, "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relkind = 'r' order by 1")).map((row) => row.relname);
  const out: Record<string, string[]> = {};
  for (const table of tables) out[table] = (await rows<{ v: string }>(db, `select xmin::text || '@' || ctid::text as v from specialization.${table} order by ctid`)).map((row) => row.v);
  return out;
}

/**
 * Schema v1 twice (idempotence), the applied seed, then the current seed over it, without
 * schema v2: the seed tests' database until the emitter writes schema v2's columns and rows
 * (10-multi-region.md §5.2), when they move to createReleaseDb.
 */
export async function createSeededDb(): Promise<PGlite> {
  const db = await createSupabaseLikeDb();
  await replayMigrations(db, "current seed", ["schema v2", "schema v2 again"]);
  return db;
}

/** A complete database as production will hold it after this release: every step of MIGRATION_STEPS. */
export async function createReleaseDb(): Promise<PGlite> {
  const db = await createSupabaseLikeDb();
  await replayMigrations(db);
  return db;
}
