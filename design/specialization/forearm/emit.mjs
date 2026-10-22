/**
 * Writes shared/specialization/regions/forearm/diagram.generated.ts from the authored views.
 *
 *   node design/specialization/forearm/emit.mjs           # rewrite the file
 *   node design/specialization/forearm/emit.mjs --check   # exit 1 if the committed file is stale
 *
 * After a change, regenerate the database seed too (`npx tsx scripts/specialization/emit-seed.ts`):
 * the seed carries the drawing, and its drift guard fails until it is regenerated.
 */
// The shared generator with the forearm's config: the same as
// `node design/specialization/shared/emit.mjs forearm [--check]`, kept so these commands, the
// header of the generated file and forearmDiagram.test.ts's import stay as they were.
import { emit, renderModule as renderRegionModule } from "../shared/emit.mjs";
import * as config from "./config.mjs";
import { buildViews } from "./views/index.mjs";

/** The module's text, exactly as committed; `members` are the forearm's nodes (forearmRegionData.nodes). */
export const renderModule = (members) => renderRegionModule(config, buildViews(), members);

if (import.meta.url === `file://${process.argv[1]}`) await emit(config.REGION, process.argv.includes("--check"));
