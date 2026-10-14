// REC04: copy the public media bucket (database backups never include Storage objects).
// Downloads every object in storage-manifest.json from its public URL and checks its size.
// No credentials: the bucket is public. Exits non-zero if any object is missing or the wrong size.
//   node scripts/ops/storage-backup.mjs <output directory>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: node scripts/ops/storage-backup.mjs <output directory>'); process.exit(2); }
const manifest = JSON.parse(readFileSync(new URL('./storage-manifest.json', import.meta.url), 'utf8'));
// For a local test only: serve the same paths from another origin.
if (process.env.SG_STORAGE_ORIGIN) manifest.project = process.env.SG_STORAGE_ORIGIN;
mkdirSync(out, { recursive: true });

let failed = 0;
for (const { name, bytes } of manifest.objects) {
  const url = `${manifest.project}/storage/v1/object/public/${manifest.bucket}/${encodeURIComponent(name)}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length !== bytes) throw new Error(`size ${body.length}, manifest says ${bytes}`);
    writeFileSync(join(out, name), body);
    console.log(`OK   ${name} (${bytes} bytes)`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}
console.log(failed ? `\n${failed} of ${manifest.objects.length} objects not copied` : `\nall ${manifest.objects.length} objects copied`);
process.exit(failed ? 1 : 0);
