import { anatomyViews, type AnatomyView } from "@/components/anatomy/figureGeometry";

/**
 * The mapping between Body Lab's canonical muscle keys and the regions the
 * figure draws.
 *
 * This used to be implicit. `keyToIds` mapped catalog keys onto third-party
 * library path IDs, several keys claimed the same ID, and a tap resolved with
 * `Object.entries(...).find(...)` — so whichever key happened to be declared
 * first won and six keys (`shoulders`, `brachialis`, `tfl`, `peroneals`,
 * `rhomboids`, `rotatorCuff`) could never be selected at all. Insertion order
 * is not a hit-priority rule.
 *
 * Now each drawn region carries exactly one canonical key, so the tap direction
 * is unambiguous by construction. Only the colouring direction needs a map, and
 * it is stated here rather than inferred.
 */

export type AnatomyRole = "primary" | "supporting" | "neutral";

/**
 * Input keys that colour regions drawn under a different key.
 *
 * `shoulders` is an umbrella the catalog uses when it does not distinguish
 * heads. `rhomboids` is the anatomical name the enriched movement records use
 * for the region the exercise catalog calls `upperBack`; they are the same
 * interscapular region, so they light the same geometry.
 */
export const umbrellaRegionKeys: Record<string, string[]> = {
  shoulders: ["frontDelts", "sideDelts", "rearDelts"],
  rhomboids: ["upperBack"],
};

/** Spellings that have reached this component from catalog and movement data. */
const regionSynonyms: Record<string, string[]> = {
  chest: ["chest", "pectoral", "pectoralis", "pec"],
  frontDelts: ["frontdelts", "anteriordelt"],
  sideDelts: ["sidedelts", "lateraldelt"],
  rearDelts: ["reardelts", "posteriordelt"],
  biceps: ["biceps"], brachialis: ["brachialis"], brachioradialis: ["brachioradialis"],
  triceps: ["triceps"], forearms: ["forearms", "grip", "wristflexors", "wristextensors"],
  abs: ["abs", "rectusabdominis"], obliques: ["obliques", "externaloblique"],
  serratusAnterior: ["serratus", "serratusanterior"],
  hipFlexors: ["hipflexors", "iliopsoas"], tfl: ["tfl", "tensorfasciaelatae"],
  quads: ["quads", "quadriceps"], adductors: ["adductors"],
  abductors: ["abductors", "glutemedius"], glutes: ["glutes", "gluteusmaximus"],
  hamstrings: ["hamstrings"], calves: ["calves", "gastrocnemius"], soleus: ["soleus"],
  tibialis: ["tibialis"], peroneals: ["peroneals", "peroneus", "fibularis"],
  lats: ["lats", "latissimus"], traps: ["traps", "trapezius"],
  upperBack: ["upperback", "rhomboid"],
  lowerBack: ["lowerback", "erectors", "erectorspinae"],
  rotatorCuff: ["rotatorcuff", "infraspinatus"],
  feet: ["feet", "foot"],
};

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

/** Every region key a single incoming muscle value should colour. */
export function regionKeysForValue(value: string): string[] {
  const normalised = normalise(value);
  if (umbrellaRegionKeys[value]) return umbrellaRegionKeys[value];
  const direct = Object.keys(regionSynonyms).find((key) => normalise(key) === normalised);
  if (direct) return [direct];
  const umbrella = Object.entries(umbrellaRegionKeys).find(([key]) => normalise(key) === normalised);
  if (umbrella) return umbrella[1];
  // Synonym match is last, and deliberately exact per synonym rather than a
  // substring test: `includes` is what made "upperBack" match nothing while
  // quietly letting unrelated values light regions up.
  const viaSynonym = Object.entries(regionSynonyms)
    .filter(([, synonyms]) => synonyms.some((synonym) => normalised === synonym || normalised.startsWith(synonym)))
    .map(([key]) => key);
  return viaSynonym;
}

/** Region key → role, from Body Lab's primary and supporting muscle lists. */
export function roleMapForLists(primary: readonly string[], supporting: readonly string[]): Record<string, AnatomyRole> {
  const roles: Record<string, AnatomyRole> = {};
  supporting.forEach((value) => regionKeysForValue(value).forEach((key) => { roles[key] = "supporting"; }));
  // Primary is applied second so it always wins a region claimed by both.
  primary.forEach((value) => regionKeysForValue(value).forEach((key) => { roles[key] = "primary"; }));
  return roles;
}

/**
 * The incoming values that resolved onto a region, so the inspector can find a
 * role record filed under `rhomboids` when the athlete tapped `upperBack`.
 */
export function sourceValuesForRegion(regionKey: string, values: readonly string[]): string[] {
  return values.filter((value) => regionKeysForValue(value).includes(regionKey));
}

export const anatomyView = (view: "front" | "back"): AnatomyView => anatomyViews[view];

/**
 * Drawn regions that belong to a Strength Genome region's anatomical area but
 * are not catalog muscle keys, so `catalogMuscleRegionIds` has no row for them.
 *
 * These four never appear in the 400-exercise catalog at all — they reach the
 * app only through enriched movement records — so they can never be *observed*
 * in Strength Genome. Without this they would sit neutral inside an otherwise
 * highlighted area: a grey soleus below a highlighted gastrocnemius. This is
 * presentation grouping for the figure, not a second taxonomy, and it never
 * routes a lift anywhere.
 */
const strengthDisplayCompanions: Record<string, string[]> = {
  calves: ["soleus", "peroneals"],
  forearms_grip: ["brachioradialis"],
  hip_abductors: ["tfl"],
};

/**
 * Strength Genome region → the region keys this figure draws for it, inverted
 * from the canonical `catalogMuscleRegionIds` rather than restated.
 */
export function buildStrengthRegionMap(catalogMuscleRegionIds: Record<string, string>): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  Object.entries(catalogMuscleRegionIds).forEach(([catalogKey, strengthRegionId]) => {
    // `shoulders` is an umbrella over the three deltoid regions; expanding it
    // here keeps the figure lighting the geometry that actually exists.
    const keys = umbrellaRegionKeys[catalogKey] ?? [catalogKey];
    map[strengthRegionId] = Array.from(new Set([...(map[strengthRegionId] ?? []), ...keys]));
  });
  Object.entries(strengthDisplayCompanions).forEach(([strengthRegionId, companions]) => {
    if (!map[strengthRegionId]) return;
    map[strengthRegionId] = Array.from(new Set([...map[strengthRegionId], ...companions]));
  });
  return map;
}

/** Which view a region is drawn on, for telling an athlete where to look. */
export function viewsForRegion(regionKey: string): ("front" | "back")[] {
  return (["front", "back"] as const).filter((view) =>
    anatomyViews[view].muscles.some((muscle) => muscle.key === regionKey));
}

/**
 * The precise name of a drawn sub-region.
 *
 * The figure draws the pectoralis in two heads and the quadriceps in three, but
 * selection resolves to the parent catalog key — so without this, tapping the
 * clavicular head and the sternal head both read "Pectoralis major" and the
 * distinction the artwork is drawing carries no meaning. The parent key still
 * drives roles and evidence, which are catalogued per muscle rather than per
 * head; this only names what is under the finger.
 *
 * Sides are deliberately absent: the app has no per-side state, so claiming one
 * would be naming something the selection does not actually distinguish.
 */
const partNames: Record<string, string> = {
  "chest__clavicular": "Clavicular head (upper chest)",
  "chest__sternal": "Sternocostal head (mid and lower chest)",
  "biceps__long_head": "Long head",
  "biceps__short_head": "Short head",
  "triceps__long_head": "Long head",
  "triceps__lateral_head": "Lateral head",
  "triceps__medial_head": "Medial head",
  "quads__rectus_femoris": "Rectus femoris",
  "quads__vastus_lateralis": "Vastus lateralis",
  "quads__vastus_medialis": "Vastus medialis",
  "hamstrings__biceps_femoris": "Biceps femoris",
  "hamstrings__semimembranosus": "Semimembranosus and semitendinosus",
  "calves__gastrocnemius": "Gastrocnemius",
  "calves__gastrocnemius_medial": "Medial head",
  "abs__upper": "Upper segments",
  "abs__lower": "Lower segments",
  "traps__upper": "Upper fibres",
  "traps__lower": "Lower fibres",
  "forearms__flexors": "Flexor compartment",
  "forearms__extensors": "Extensor compartment",
  "forearms__ulnar": "Ulnar compartment",
  "adductors__magnus": "Adductor magnus",
  "lowerBack__erector_spinae": "Erector spinae",
  "upperBack__interscapular": "Interscapular (rhomboids and mid trapezius)",
};

/** The name of the exact region a path id refers to, or nothing. */
export function regionPartName(pathId: string | undefined): string | undefined {
  if (!pathId) return undefined;
  const parts = pathId.split("__");
  // muscle__<key>__<part>__<side> — anything shorter carries no subdivision.
  if (parts.length < 4) return undefined;
  return partNames[`${parts[1]}__${parts.slice(2, -1).join("__")}`];
}
