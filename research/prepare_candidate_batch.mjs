import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const inputPath = "/home/ubuntu/sports_genome_candidate_batch.json";
const outputPath = "/home/ubuntu/gym-optimizer/research/candidate_batch_raw_intake.sql";

const source = JSON.parse(await readFile(inputPath, "utf8"));
const candidates = source.results
  .map(({ input, output }) => ({ subject: input, ...output }))
  .filter(candidate => candidate.title && candidate.title !== "NOT_FOUND")
  .filter(candidate => candidate.source_url?.startsWith("https://"));

const sqlQuote = value => String(value ?? "").replaceAll("'", "''");
const normalizedUrl = value => value.replace(/\/+$/, "");
const identifier = value => {
  const pmid = value.match(/PMID:\s*([0-9]+)/i)?.[1];
  const doi = value.match(/DOI:\s*([^;\s]+)/i)?.[1];
  return pmid ?? doi ?? null;
};

const rows = candidates.map(candidate => {
  const rawPayload = JSON.stringify(candidate);
  const contentSha = createHash("sha256").update(rawPayload).digest("hex");
  const externalId = identifier(candidate.identifiers ?? "");
  return `(
  'candidate_research',
  '${sqlQuote(candidate.source_url)}',
  '${sqlQuote(normalizedUrl(candidate.source_url))}',
  ${externalId ? `'${sqlQuote(externalId)}'` : "null"},
  '${sqlQuote(rawPayload)}'::jsonb,
  '${contentSha}',
  'received',
  '${sqlQuote(`Candidate batch topic: ${candidate.subject}. Awaiting automated screening and source review.`)}'
)`;
});

const sql = `-- Generated deterministically from the ten-candidate research discovery result.
-- Raw intake only: no staging or production promotion occurs in this query.
with batch as (
  insert into public.import_batches (
    source, query, status, candidates_found, notes
  ) values (
    'candidate_research_batch',
    'Ten-candidate breadth pilot across prescription, exercise evidence, strength context, wrestling, and tennis',
    'screening',
    ${rows.length},
    'Raw-intake only. Each source requires screening, validation, duplicate review, and explicit approval before any production promotion.'
  ) returning id
)
insert into public.raw_imports (
  import_batch_id, source_type, source_url, normalized_source_url, source_external_id,
  raw_payload, content_sha256, processing_status, processing_note
)
select batch.id, candidate_rows.*
from batch cross join (
  values
${rows.join(",\n")}
) as candidate_rows(
  source_type, source_url, normalized_source_url, source_external_id,
  raw_payload, content_sha256, processing_status, processing_note
)
returning id, source_external_id, processing_status;
`;

await writeFile(outputPath, sql, "utf8");
console.log(`Prepared ${rows.length} raw candidate rows at ${outputPath}`);
