/**
 * Writes the SQL that applies the atlas migrations to production, one statement per file
 * (docs/specialization-atlas/04-database.md §9, step 2). The seed is too large for one tool
 * argument, so each statement fetches its file at a commit already pushed to GitHub, refuses it
 * unless the HTTP status is 200 and the SHA-256 of its text equals the repository file's,
 * executes it, and records it in `supabase_migrations.schema_migrations` under the file's own
 * version and name, as `supabase migration repair` would: all in one DO block, so one
 * transaction. A failed fetch, a checksum mismatch or an error in the file leaves the database
 * as it was, history included. The `http` extension is created if missing; it is dropped
 * afterwards in a statement of its own (`drop-http.sql`), because on Supabase a DROP EXTENSION
 * in the same DO block did not return (18 Oct 2026: probes with it hung past 60 s, probes
 * without it took about a second).
 *
 * Run each file's output with the Supabase MCP `execute_sql` (the MCP `apply_migration` did not
 * return within its 60 s limit either; it ran the same SQL, DROP EXTENSION included).
 *
 *   node scripts/specialization/release/make-apply-sql.mjs <full commit sha> <output dir>
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [sha, outDir] = process.argv.slice(2);
if (!/^[0-9a-f]{40}$/.test(sha ?? "")) throw new Error("Pass the full 40-character SHA of a commit that is pushed to GitHub.");
if (!outDir) throw new Error("Pass a directory to write the SQL into.");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const files = ["20261016120000_specialization_atlas_schema.sql", "20261016120100_specialization_atlas_seed_v1.sql"];
mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const text = readFileSync(join(root, "supabase/migrations", file), "utf8");
  const digest = createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
  const [, version, name] = file.match(/^(\d{14})_(.+)\.sql$/);
  const url = `https://raw.githubusercontent.com/LocalForgeWeb/Sports-genome/${sha}/supabase/migrations/${file}`;
  // The lock timeout is transaction-local: behind a long-running write the statement fails within
  // seconds and can be run again, rather than holding sign-ins in a queue behind its locks. The
  // fetch has its own limit. `record` variables, because the http types do not exist until the
  // extension is created inside the block.
  const sql = `do $apply$
declare
  response record;
begin
  perform set_config('lock_timeout', '5000', true);
  create extension if not exists http with schema extensions;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '30');
  select status, content into response from extensions.http_get('${url}');
  if response.status <> 200 then raise exception 'Could not fetch ${file} at ${sha.slice(0, 12)}: HTTP %', response.status; end if;
  if encode(sha256(convert_to(response.content, 'UTF8')), 'hex') <> '${digest}' then
    raise exception 'Checksum mismatch for ${file}: got %', encode(sha256(convert_to(response.content, 'UTF8')), 'hex');
  end if;
  execute response.content;
  insert into supabase_migrations.schema_migrations (version, name, statements) values ('${version}', '${name}', array[response.content]);
end
$apply$;
`;
  const out = join(outDir, file.replace(/\.sql$/, ".apply.sql"));
  writeFileSync(out, sql);
  console.log(`${file}: ${text.length} characters, sha256 ${digest} -> ${out}`);
}
writeFileSync(join(outDir, "drop-http.sql"), "drop extension if exists http;\n");
