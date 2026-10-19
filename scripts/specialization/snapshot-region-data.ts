/**
 * Writes the forearm's region data and the deltoid fixture's, exactly as the page and the seed
 * read them, to JSON files under client/src/lib/specialization/__fixtures__/.
 *
 *   npx tsx scripts/specialization/snapshot-region-data.ts
 *
 * Run once at 6738eeb, before the multi-region model moved the forearm's records into shared
 * libraries (docs/specialization-atlas/10-multi-region.md §1.3). The snapshots are history:
 * client/src/lib/specialization/regionContent.test.ts requires the composed data to equal them,
 * ignoring only the fields the model added since, so the move is shown to change nothing.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { forearmRegionData } from "../../shared/specialization/regions/forearm";
import { deltoidRegionData } from "../../client/src/lib/specialization/__fixtures__/deltoidRegion";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../client/src/lib/specialization/__fixtures__");

for (const [name, data] of [["forearmRegionData", forearmRegionData], ["deltoidRegionData", deltoidRegionData]] as const) {
  const path = resolve(out, `${name}.6738eeb.json`);
  const text = `${JSON.stringify(data, null, 1)}\n`;
  writeFileSync(path, text);
  console.log(`Wrote ${path} (${text.length} characters).`);
}
