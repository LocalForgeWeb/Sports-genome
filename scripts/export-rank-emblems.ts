/**
 * Writes client/public/rank-emblems/<rank>.svg from client/src/lib/rankEmblems.ts.
 *
 *   npx tsx scripts/export-rank-emblems.ts
 *
 * The geometry file is the source; these are its exports, for Figma, docs and anywhere
 * outside the React tree. A test fails if a committed file stops matching its source.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { RANKS } from "../shared/capabilityRank";
import { emblemSvgMarkup } from "../client/src/lib/rankEmblems";

for (const rank of RANKS) {
  const path = resolve(import.meta.dirname, "../client/public/rank-emblems", `${rank.id}.svg`);
  writeFileSync(path, emblemSvgMarkup(rank.id, `${rank.fullName} rank emblem`));
  console.log(`wrote ${path}`);
}
