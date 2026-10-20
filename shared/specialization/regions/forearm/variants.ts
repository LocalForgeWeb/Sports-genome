import type { ExerciseVariant } from "../../types";
import { variantsMappedBy } from "../../variants";
import { forearmMappings } from "./mappings";

/**
 * The variants the forearm's mapping version maps, from the shared library (variants/), the
 * array its page data reads (./content.ts). The generated logging table reads the same records
 * through the library (`variantById`, `variantFor`: scripts/specialization/emit-logging-table.ts),
 * so the two can never read two versions of a variant. The records are in variants/forearm.ts.
 */
export const forearmVariants: ExerciseVariant[] = variantsMappedBy(forearmMappings);
