/**
 * Writes the SQL that applies the atlas migrations to production, one Supabase `apply_migration`
 * call per file (docs/specialization-atlas/04-database.md §9, step 2). The seed is too large for
 * one tool argument, so each call fetches its file at a commit already pushed to GitHub, refuses
 * it unless the HTTP status is 200 and the SHA-256 of its text equals the repository file's, and
 * executes it, all in the call's one transaction: a failed fetch, a checksum mismatch or an error
 * in the file leaves the database as it was. The `http` extension is created for the call and
 * dropped at its end.
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
  const url = `https://raw.githubusercontent.com/LocalForgeWeb/Sports-genome/${sha}/supabase/migrations/${file}`;
  // `set local`: behind a long-running write the call fails and can be run again, rather than
  // holding sign-ins in a queue behind its locks; it ends with the call's transaction.
  const sql = `set local lock_timeout = '5s';
create extension if not exists http with schema extensions;
do $apply$
declare
  response extensions.http_response;
  body text;
begin
  response := extensions.http_get('${url}');
  if response.status <> 200 then raise exception 'Could not fetch ${file} at ${sha.slice(0, 12)}: HTTP %', response.status; end if;
  body := response.content;
  if encode(sha256(convert_to(body, 'UTF8')), 'hex') <> '${digest}' then
    raise exception 'Checksum mismatch for ${file}: got %', encode(sha256(convert_to(body, 'UTF8')), 'hex');
  end if;
  execute body;
end
$apply$;
drop extension http;
`;
  const out = join(outDir, file.replace(/\.sql$/, ".apply.sql"));
  writeFileSync(out, sql);
  console.log(`${file}: ${text.length} characters, sha256 ${digest} -> ${out}`);
}
