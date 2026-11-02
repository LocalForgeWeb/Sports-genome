#!/usr/bin/env node
/**
 * Copies the official brand images from the public storage bucket into the app, so the build
 * bundles them (iOS readiness audit, A07). Byte for byte, under their storage names, with each
 * file's SHA-256 printed for the commit message. Run from a machine that can reach the bucket:
 *
 *   node scripts/assets/vendor-brand-assets.mjs
 *
 * It refuses anything that is not the expected image type or is implausibly small, so an error
 * page or a placeholder is never committed as the logo. Nothing else in the app changes: once
 * the files are in client/src/assets/brand/, sportsGenomeAssets.ts serves them from the app.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://qiccnqkypbhlwpmjcsri.supabase.co").replace(/\/+$/, "");
const bucket = `${supabaseUrl}/storage/v1/object/public/sports-genome-assets`;
// Kept in step with essentialBrandFiles in client/src/lib/sportsGenomeAssets.ts.
const files = [
  { name: "sports-genome-circular-header-badge_8450998e.jpg", type: "image/jpeg" },
  { name: "sports-genome-official-logo-180_8085dfd8.png", type: "image/png" },
];
const out = join(dirname(fileURLToPath(import.meta.url)), "../../client/src/assets/brand");

await mkdir(out, { recursive: true });
let failed = false;
for (const file of files) {
  const url = `${bucket}/${encodeURIComponent(file.name)}`;
  try {
    const response = await fetch(url);
    const type = (response.headers.get("content-type") || "").split(";")[0].trim();
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (type !== file.type) throw new Error(`expected ${file.type}, got ${type || "no content type"}`);
    if (bytes.length < 2_000) throw new Error(`only ${bytes.length} bytes: not the artwork`);
    await writeFile(join(out, file.name), bytes);
    console.log(`${file.name}  ${bytes.length} bytes  sha256 ${createHash("sha256").update(bytes).digest("hex")}`);
  } catch (error) {
    failed = true;
    console.error(`${file.name}: not copied (${error instanceof Error ? error.message : String(error)}) from ${url}`);
  }
}
process.exit(failed ? 1 : 0);
