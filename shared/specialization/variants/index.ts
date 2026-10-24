import type { ExerciseVariant, VariantId, VariantMapping } from "../types";
import { forearmV1Variants } from "./forearm";
import { forearmResearchVariants } from "./forearmResearch";
import { upperArmVariants } from "./upperArm";

/**
 * The shared variant library (docs/specialization-atlas/10-multi-region.md §3): one variant per
 * catalog exercise, `cat-<id>`, read by every region, the calculator and the logger alike, so an
 * exercise is never read two ways. A region references variants by id and never declares its own.
 *
 * One variant is current per catalog id. A variant may be replaced (`cat-<id>.v2` with
 * `replaces: "cat-<id>"`) only in a release that also publishes a new mapping version for every
 * region whose current version maps the old key; the old record stays here, behind the link.
 */
export const variantLibrary: readonly ExerciseVariant[] = [...forearmV1Variants, ...forearmResearchVariants, ...upperArmVariants];

/**
 * The records each region's own lane wrote, for a region whose page reads its own records rather
 * than the whole library: the forearm's 119 and its research rows (417-420). The library's other
 * records its version maps reach its page through its generated list (`versionVariants`,
 * scripts/specialization/emit-logging-table.ts), so the page never loads every region's records.
 */
export const regionVariantRecords: Readonly<Partial<Record<string, readonly ExerciseVariant[]>>> = {
  forearm: [...forearmV1Variants, ...forearmResearchVariants],
};

export const variantById: ReadonlyMap<VariantId, ExerciseVariant> = new Map(variantLibrary.map((variant) => [variant.id, variant]));

const replaced = new Set(variantLibrary.flatMap((variant) => (variant.replaces ? [variant.replaces] : [])));

/** Whether no other variant in the library replaces this one. */
export const isCurrentVariant = (variant: ExerciseVariant): boolean => !replaced.has(variant.id);

const currentByCatalogId = new Map<number, ExerciseVariant>();
for (const variant of variantLibrary) {
  if (isCurrentVariant(variant) && !currentByCatalogId.has(variant.catalogExerciseId)) currentByCatalogId.set(variant.catalogExerciseId, variant);
}

/** The current variant of a catalog exercise, or null when no region maps the exercise. */
export function variantFor(catalogExerciseId: number | null | undefined): ExerciseVariant | null {
  if (catalogExerciseId === null || catalogExerciseId === undefined) return null;
  return currentByCatalogId.get(catalogExerciseId) ?? null;
}

/**
 * The library's records of the variants these mappings name, each once, in library order. A
 * region's content lists exactly these (regionContent.test.ts). An id the library does not hold
 * is an error.
 */
export function variantsMappedBy(...mappingLists: readonly (readonly VariantMapping[])[]): ExerciseVariant[] {
  const mapped = new Set(mappingLists.flatMap((mappings) => mappings.map((mapping) => mapping.variantId)));
  const missing = Array.from(mapped).filter((id) => !variantById.has(id));
  if (missing.length) throw new Error(`Variants ${missing.join(", ")} are not in the shared library (shared/specialization/variants/)`);
  return variantLibrary.filter((variant) => mapped.has(variant.id));
}
