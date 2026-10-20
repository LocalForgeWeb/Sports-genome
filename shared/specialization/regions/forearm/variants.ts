import type { ExerciseVariant } from "../../types";
import { variantsMappedBy } from "../../variants";
import { forearmMappings } from "./mappings";

/**
 * The variants the forearm's mapping version maps, from the shared library (variants/): the
 * very array its page data and the generated logging table read (./index.ts, shared/specialization/loggingTable.generated.ts), so the two
 * can never read two versions of a variant. The records are in variants/forearm.ts.
 */
export const forearmVariants: ExerciseVariant[] = variantsMappedBy(forearmMappings);
