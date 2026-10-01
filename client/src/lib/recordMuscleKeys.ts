/**
 * One table from the muscle names the enriched movement records use
 * ("gluteus maximus", "obliquus externus abdominis", "triceps surae") to the
 * app's muscle keys.
 *
 * There used to be three. Body Lab drew roles with one, the catalog's action
 * links and the coverage panel matched exercises with another, and the Matches
 * engine read the legacy profile text with a third. They disagreed: the
 * catalog's table had no "obliquus", so Bridge's oblique prime mover matched no
 * exercise while Body Lab drew it; Body Lab's bare "triceps" and "biceps" read
 * "triceps surae" as the arm and "biceps femoris" as the biceps. The Matches
 * engine (movementRecommendations) still reads the legacy free-text profile with
 * its own list and is deliberately unchanged in this correction.
 *
 * Keys are the body map's keys. Five of them name regions the figure draws but
 * the 400-exercise catalog never tags; `catalogKeysForRecordMuscle` folds those
 * into the catalog key that tags the same tissue (the same grouping
 * anatomyRegions uses: soleus with the calves, the rhomboids as the upper back,
 * brachioradialis with the forearm, TFL with the hip abductors). Peroneals have
 * no catalog key, so they fold to nothing.
 *
 * Matching is substring on a lower-cased name with hyphens read as spaces, so
 * "rotator-cuff muscles" finds the rotator cuff. Group words that are not a
 * muscle ("trunk", "scapular stabilizers", "foot stabilizers") map to nothing on
 * purpose: no exercise can be said to train them.
 */
export const recordMuscleAliases: Record<string, readonly string[]> = {
  chest: ["pectoralis major", "pectoralis minor", "chest"],
  frontDelts: ["anterior deltoid"],
  sideDelts: ["middle deltoid", "lateral deltoid"],
  rearDelts: ["posterior deltoid"],
  shoulders: ["deltoid"],
  // Qualified on purpose: a bare "triceps" also reads "triceps surae" (the calf),
  // and a bare "biceps" reads "biceps femoris" (a hamstring).
  triceps: ["triceps brachii"],
  biceps: ["biceps brachii"],
  brachialis: ["brachialis"],
  brachioradialis: ["brachioradialis"],
  // The named forearm muscles too: grip records list them as prime movers.
  forearms: ["forearm", "wrist", "finger flexor", "finger extensor", "flexor digitorum", "extensor digitorum", "flexor carpi", "extensor carpi", "pronator"],
  abs: ["rectus abdominis", "transversus abdominis", "abdominal wall", "abdominals"],
  obliques: ["oblique", "obliquus"],
  serratusAnterior: ["serratus"],
  hipFlexors: ["iliopsoas", "psoas", "iliacus", "hip flexor"],
  tfl: ["tensor fasciae latae", "tfl"],
  quads: ["quadriceps", "rectus femoris", "vastus"],
  adductors: ["adductor", "gracilis", "pectineus"],
  // Gluteus medius and minimus are the hip abductors the figure draws; the
  // glutes key is the gluteus maximus region.
  abductors: ["abductor", "gluteus medius", "gluteus minimus"],
  glutes: ["gluteus maximus", "gluteal"],
  hamstrings: ["hamstring", "biceps femoris", "semitendinosus", "semimembranosus"],
  // Triceps surae is the gastrocnemius and soleus together.
  calves: ["gastrocnemius", "plantar flexor", "triceps surae"],
  soleus: ["soleus", "triceps surae"],
  tibialis: ["tibialis"],
  peroneals: ["perone"],
  lats: ["latissimus"],
  traps: ["trapezius"],
  rhomboids: ["rhomboid"],
  lowerBack: ["erector spinae", "multifidus", "lower back", "spinal erector"],
  rotatorCuff: ["rotator cuff", "infraspinatus", "supraspinatus", "teres minor", "subscapularis"],
};

/** Body-map keys the catalog never tags, and the catalog key that tags the same tissue. */
const catalogKeyForMapOnlyKey: Record<string, string | null> = {
  soleus: "calves",
  rhomboids: "upperBack",
  brachioradialis: "forearms",
  tfl: "abductors",
  peroneals: null,
};

const readable = (name: string) => name.toLowerCase().replace(/[-‐–]/g, " ");

/**
 * Body-map keys for one record muscle name. A value that is already a key
 * (the legacy fallback lists pass keys) comes back as itself.
 */
export function bodyMapKeysForRecordMuscle(name: string): string[] {
  if (name in recordMuscleAliases) return [name];
  const lower = readable(name);
  return Object.entries(recordMuscleAliases)
    .filter(([, aliases]) => aliases.some((alias) => lower.includes(alias)))
    .map(([key]) => key);
}

/** Catalog muscle keys (the vocabulary of `exercise.primaryMuscles`) for one record muscle name. */
export function catalogKeysForRecordMuscle(name: string): string[] {
  const keys = bodyMapKeysForRecordMuscle(name).flatMap((key) => {
    if (!(key in catalogKeyForMapOnlyKey)) return [key];
    const folded = catalogKeyForMapOnlyKey[key];
    return folded ? [folded] : [];
  });
  return Array.from(new Set(keys));
}
