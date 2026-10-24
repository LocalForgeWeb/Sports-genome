import type { ExerciseVariant } from "../../types";
import { forearmV1Variants } from "../../variants/forearm";
import { forearmResearchVariants } from "../../variants/forearmResearch";
import { versionVariants } from "./libraryVariants.generated";
import { forearmMappings } from "./mappings";

/**
 * The variants the forearm's mapping version maps, from the shared library (variants/), the
 * array its page data reads (./content.ts). The generated logging table reads the same records
 * through the library (`variantById`, `variantFor`: scripts/specialization/emit-logging-table.ts),
 * so the two can never read two versions of a variant. The records are in variants/forearm.ts (the
 * 119 v1 was published with) and variants/forearmResearch.ts (417-420, F3).
 */
export const forearmVariants: ExerciseVariant[] = (() => {
  // Its version maps its own lane's records (variants/forearm.ts, variants/forearmResearch.ts), read from those files alone so the
  // forearm's chunk does not carry the whole library, and, from forearm_mappings_v2, a few records the upper arm's lane wrote (the
  // face pulls, cable rows and kneeling pulldown whose brachioradialis it credits), copied into libraryVariants.generated.ts (`versionVariants`).
  // In library order, equal to `variantsMappedBy(forearmMappings)` (regionContent.test.ts).
  const mapped = new Set(forearmMappings.map((mapping) => mapping.variantId));
  return [...forearmV1Variants, ...forearmResearchVariants, ...versionVariants].filter((variant) => mapped.has(variant.id));
})();
