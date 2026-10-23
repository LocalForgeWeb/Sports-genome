import type { ExerciseVariant } from "../../types";
import { forearmV1Variants } from "../../variants/forearm";
import { forearmMappings } from "./mappings";

/**
 * The variants the forearm's mapping version maps, from the shared library (variants/), the
 * array its page data reads (./content.ts). The generated logging table reads the same records
 * through the library (`variantById`, `variantFor`: scripts/specialization/emit-logging-table.ts),
 * so the two can never read two versions of a variant. The records are in variants/forearm.ts.
 */
export const forearmVariants: ExerciseVariant[] = (() => {
  // Its version maps only its own frozen records (variants/forearm.ts), read from that file alone so the forearm's chunk does not
  // carry the whole library; equal to `variantsMappedBy(forearmMappings)` (regionContent.test.ts).
  const mapped = new Set(forearmMappings.map((mapping) => mapping.variantId));
  return forearmV1Variants.filter((variant) => mapped.has(variant.id));
})();
