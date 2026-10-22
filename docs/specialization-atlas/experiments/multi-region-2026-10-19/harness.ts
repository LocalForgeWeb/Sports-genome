import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

/**
 * A Supabase-shaped Postgres in WASM (PGlite 0.4, Postgres 17 like production) for the
 * specialization schema tests: server/specializationSchema.test.ts and
 * server/specializationSeed.test.ts.
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
 * PGlite is one connection, so nothing here tests concurrent writers; the triggers that
 * guard against them are described in the migration and in 04-database.md.
 */

// Renamed with the files after the first production apply (04-database.md §9 lists every place that names them).
export const SCHEMA_MIGRATION_PATH = resolve("/home/user/Sports-genome/supabase/migrations/20261016120000_specialization_atlas_schema.sql");
export const SEED_MIGRATION_PATH = resolve("/home/user/Sports-genome/supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql");

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

/** A complete database: bootstrap, schema twice (idempotence), seed. */
export async function createSeededDb(): Promise<PGlite> {
  const db = await createSupabaseLikeDb();
  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  await applyMigration(db, SEED_MIGRATION_PATH);
  return db;
}
