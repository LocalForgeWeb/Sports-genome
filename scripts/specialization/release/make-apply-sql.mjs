/**
 * Writes the SQL that applies atlas migrations to production, one statement per file
 * (docs/specialization-atlas/04-database.md §9 and §10). A seed is too large for one tool
 * argument, so each statement fetches its file at a commit already pushed to GitHub, refuses it
 * unless the HTTP status is 200 and the SHA-256 of its text equals the repository file's, refuses
 * it unless every earlier specialization migration is recorded in
 * `supabase_migrations.schema_migrations` with the text this commit holds (its SHA-256) and this
 * one is not recorded, executes it, and records it there under the file's own version and name
 * with its text, as `supabase migration repair` would: all in one DO block, so one transaction. A
 * failed fetch, a checksum mismatch, a file out of order, an earlier file recorded with other text
 * or an error in the file leaves the database as it was, history included.
 *
 * Once production records a file it is history, even when a later file of the same release
 * then fails: a fix never edits it (the apply of a later file refuses a commit that did), it pins
 * it in server/specializationHistory.test.ts and puts any correction in a new file.
 *
 * The `http` extension is created if missing and never dropped: on Supabase a DROP EXTENSION did
 * not return, in the same DO block or on its own (18 Oct 2026: probes with it hung past 60 s,
 * probes without it took about a second); the owner removes it in the dashboard.
 *
 * Run each file's output with the Supabase MCP `execute_sql`, one file per call, in the order
 * given (the MCP `apply_migration` did not return within its 60 s limit; it ran the same SQL).
 *
 *   node scripts/specialization/release/make-apply-sql.mjs <full commit sha> <output dir> <migration file>…
 *
 * Files are named as in supabase/migrations (a path to one works too).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [sha, outDir, ...given] = process.argv.slice(2);
if (!/^[0-9a-f]{40}$/.test(sha ?? "")) throw new Error("Pass the full 40-character SHA of a commit that is pushed to GitHub.");
if (!outDir) throw new Error("Pass a directory to write the SQL into.");
if (given.length === 0) throw new Error("Pass the migration files to apply, in order.");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const migrations = join(root, "supabase/migrations");
const isAtlasMigration = (name) => /^\d{14}_specialization_atlas_[a-z0-9_]+\.sql$/.test(name);
// Production applies them in name order: each file's version is its timestamp.
const atlas = readdirSync(migrations).filter(isAtlasMigration).sort();
const files = given.map((file) => basename(file));
for (const file of files) if (!atlas.includes(file)) throw new Error(`${file} is not a specialization migration in supabase/migrations.`);
mkdirSync(outDir, { recursive: true });

const parse = (file) => {
  const [, version, name] = file.match(/^(\d{14})_(.+)\.sql$/);
  return { version, name };
};
const textArray = (values) => `array[${values.map((value) => `'${value}'`).join(", ")}]::text[]`;

for (const file of files) {
  const text = readFileSync(join(migrations, file), "utf8");
  const digest = createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
  const { version, name } = parse(file);
  const earlier = atlas.slice(0, atlas.indexOf(file)).map((name) => ({
    ...parse(name),
    digest: createHash("sha256").update(readFileSync(join(migrations, name))).digest("hex"),
  }));
  const url = `https://raw.githubusercontent.com/LocalForgeWeb/Sports-genome/${sha}/supabase/migrations/${file}`;
  // The lock timeout is transaction-local: behind a long-running write the statement fails within
  // seconds and can be run again, rather than holding sign-ins in a queue behind its locks. The
  // fetch has its own limit. `record` variables, because the http types do not exist until the
  // extension is created inside the block. An earlier file must be recorded with the text this
  // commit holds: one recorded from another commit is history this commit no longer has.
  const sql = `do $apply$
declare
  response record;
  missing text;
  changed text;
begin
  perform set_config('lock_timeout', '5000', true);
  create extension if not exists http with schema extensions;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '30');
  select status, content into response from extensions.http_get('${url}');
  if response.status <> 200 then raise exception 'Could not fetch ${file} at ${sha.slice(0, 12)}: HTTP %', response.status; end if;
  if encode(sha256(convert_to(response.content, 'UTF8')), 'hex') <> '${digest}' then
    raise exception 'Checksum mismatch for ${file}: got %', encode(sha256(convert_to(response.content, 'UTF8')), 'hex');
  end if;
  select string_agg(e.version || ' ' || e.name, ', ' order by e.version) into missing
  from unnest(${textArray(earlier.map((entry) => entry.version))}, ${textArray(earlier.map((entry) => entry.name))}) as e (version, name)
  where not exists (select 1 from supabase_migrations.schema_migrations m where m.version = e.version);
  if missing is not null then raise exception '${file} applies after %, which production has not recorded', missing; end if;
  select string_agg(e.version || ' ' || e.name, ', ' order by e.version) into changed
  from unnest(${textArray(earlier.map((entry) => entry.version))}, ${textArray(earlier.map((entry) => entry.name))}, ${textArray(earlier.map((entry) => entry.digest))}) as e (version, name, digest)
  join supabase_migrations.schema_migrations m on m.version = e.version
  where m.statements is null or cardinality(m.statements) <> 1 or encode(sha256(convert_to(m.statements[1], 'UTF8')), 'hex') <> e.digest;
  if changed is not null then
    raise exception '${file} applies after %, which production recorded with other text than this commit holds: a recorded file is history, so correct it in a new file', changed;
  end if;
  if exists (select 1 from supabase_migrations.schema_migrations m where m.version = '${version}') then
    raise exception '${file} is already recorded in supabase_migrations.schema_migrations';
  end if;
  execute response.content;
  insert into supabase_migrations.schema_migrations (version, name, statements) values ('${version}', '${name}', array[response.content]);
end
$apply$;
`;
  const out = join(outDir, file.replace(/\.sql$/, ".apply.sql"));
  writeFileSync(out, sql);
  console.log(`${file}: ${text.length} characters, sha256 ${digest}, after ${earlier.length} recorded files -> ${out}`);
}
