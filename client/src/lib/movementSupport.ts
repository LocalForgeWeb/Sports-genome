/**
 * Which catalog exercises support a sport movement, and why.
 *
 * The one source is the movement's enriched record (enrichedSportMovementDatabase,
 * keyed `${sportId}/${movementId}`): the exercises it names, its prime movers, its
 * confidence and its sources. Nothing else places an exercise in a tier - not the
 * catalog's group-copied `qualities`, not the Matches engine's regex signals, not
 * exerciseGenome's derived fields, not `muscleGrade`, `sportFit` or the sport-level
 * research registry.
 *
 *   Movement-specific  the exercise's name contains, as a run of whole words, an
 *                      exercise the record names ("Barbell Hip Thrust" for "hip
 *                      thrust"), or an exact same-exercise synonym of one, unless
 *                      the pair is listed in NOT_THE_SAME_EXERCISE.
 *   Related pattern    not movement-specific; its catalog `movement` pattern is the
 *                      pattern of a movement-specific exercise, that pattern is not
 *                      one of the BROAD_PATTERNS, and it trains a prime mover.
 *   Muscle support     neither of those; its primary muscles include a prime mover.
 *                      Shown apart and never counted as a match.
 *
 * No number, percentage or grade is produced: the tier and its reason are the
 * whole answer. Matching is by exercise name to the record, which is what the
 * reasons say; nothing here has been reviewed by a person exercise by exercise.
 */
import { exercises as catalogExercises, type Exercise } from "@/lib/exerciseCatalog";
import { getEnrichedMovement, type EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import { sportMovementProfiles, sportProfiles } from "@/lib/sportMovementDatabase";
import { movementDisplayLabel } from "@/lib/movementLabel";
import { catalogKeysForRecordMuscle } from "@/lib/recordMuscleKeys";

export type SupportTier = "specific" | "related" | "muscle";

/** The words each tier is shown with. No number or letter grade goes with them. */
export const supportTierLabel = { specific: "Movement-specific", related: "Related pattern", muscle: "Muscle support" } as const satisfies Record<SupportTier, string>;

export type SupportRow = {
  exercise: Exercise;
  tier: SupportTier;
  /** The "Why it appears" line, in plain words. */
  reason: string;
  /** Movement-specific rows: the record's phrase the name contains, as the record writes it. */
  phrase?: string;
  /** Movement-specific rows matched through SAME_EXERCISE_SYNONYMS: the catalog's name for the phrase. */
  sameAs?: string;
  /** Related-pattern rows: the movement-specific exercise whose pattern this one shares. */
  anchorExerciseId?: number;
  /** The record's prime movers (as the record names them) that this exercise trains as a primary muscle. */
  sharedPrimeMovers: string[];
};

export type MovementSupportStatus = "ok" | "no-record" | "no-named-matches";

export type MovementSupport = {
  /** "no-record": the movement has no enriched record. "no-named-matches": it has one, but no catalog exercise is named in it. */
  status: MovementSupportStatus;
  sportId: string;
  movementId: string;
  /** Display label, e.g. "Bridge". */
  movementLabel: string;
  sportLabel: string;
  record: { confidence: string; sourceCount: number } | null;
  specific: SupportRow[];
  related: SupportRow[];
  muscle: SupportRow[];
  /** Exercises the record names that resolve to nothing in the catalog, as the record writes them. */
  unmatchedPhrases: string[];
  /** Catalog muscle keys of the record's prime movers, in record order. The first is what "Browse exercises for its muscles" opens. */
  primeMoverKeys: string[];
};

/**
 * Lower case; apostrophes dropped so "farmer's" reads as "farmers"; hyphens and
 * other punctuation become spaces; a simple plural becomes singular ("lunges" ->
 * "lunge", "presses" -> "press", "carries" -> "carry", while "press", "obliquus"
 * and "pelvis" stay); spaces collapse. The plural rule starts at three letters,
 * not four, so the records' "step-ups" meet the catalog's "Step-Up"; the only other
 * three-letter word it touches is "abs". Record phrases and catalog names go through
 * the same function, so the rule only has to be consistent.
 */
export function normalizeExercisePhrase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(singularWord)
    .join(" ");
}

function singularWord(word: string): string {
  if (word.length < 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(ss|ch|sh|x)es$/.test(word)) return word.slice(0, -2);
  if (/(ss|us|is)$/.test(word)) return word;
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** True when the normalized phrase appears in the normalized name as a contiguous run of whole words. */
export function nameContainsPhrase(name: string, phrase: string): boolean {
  const target = normalizeExercisePhrase(phrase);
  return target !== "" && ` ${normalizeExercisePhrase(name)} `.includes(` ${target} `);
}

/**
 * Exact same-exercise synonyms only: two names for one exercise, where the record
 * uses one and the catalog the other. A related or merely similar exercise does
 * not belong here; phrases with no catalog equivalent stay unmatched and are
 * reported (docs/movement-support/README.md) rather than guessed.
 */
export const SAME_EXERCISE_SYNONYMS: readonly { phrase: string; sameAs: string; why: string }[] = [
  { phrase: "rear-foot-elevated split squat", sameAs: "Bulgarian split squat", why: "A Bulgarian split squat is the split squat with the rear foot raised on a bench; the two names describe one exercise." },
  { phrase: "farmer carry", sameAs: "farmer's walk", why: "Farmer's carry and farmer's walk are two names for one exercise: a heavy weight in each hand, walked for distance." },
  { phrase: "one-arm cable row", sameAs: "single-arm cable row", why: "One-arm and single-arm mean the same thing; it is one unilateral cable row." },
  { phrase: "single-leg RDL", sameAs: "single-leg Romanian deadlift", why: "RDL is the standard abbreviation of Romanian deadlift." },
  { phrase: "cable woodchop", sameAs: "cable wood chop", why: "Woodchop and wood chop are one word written two ways." },
  { phrase: "neutral-grip pulldown", sameAs: "neutral-grip lat pulldown", why: "A pulldown is the lat pulldown; the catalog writes the muscle into the name." },
  { phrase: "barbell back squat", sameAs: "back squat", why: "The back squat is a barbell lift; the catalog leaves the barbell implied." },
];

/**
 * The other direction: catalog exercises whose name contains a phrase a record
 * names, but which are a different exercise from the one named ("row" is in
 * "Cable Upright Row"). The name rule alone would call them movement-specific.
 * A listed pair is skipped by the name match only, so the exercise falls to
 * related pattern or muscle support on its own pattern and muscles, or to
 * nothing. Read by hand from the phrases that reach the most catalog names
 * (docs/movement-support/README.md, "Phrases the name rule stretches").
 */
export const NOT_THE_SAME_EXERCISE: readonly { phrase: string; catalogId: number; why: string }[] = [
  { phrase: "leg press", catalogId: 223, why: "A leg-press calf raise is a calf raise done on the leg-press machine with the knees held straight; it is not the leg press." },
  { phrase: "row", catalogId: 317, why: "An upright row pulls the bar up the front of the body to the chest for the shoulders and traps; a row pulls toward the trunk." },
  { phrase: "push-up", catalogId: 120, why: "A handstand push-up is an overhead press done upside down, a vertical push, not the horizontal push-up." },
  { phrase: "split squat", catalogId: 294, why: "A split-squat jump is a plyometric jump from the split stance, not the loaded split squat." },
  { phrase: "cable press", catalogId: 310, why: "A cable press-out is an anti-rotation press for the trunk, like the Pallof press, not a cable chest or shoulder press." },
  { phrase: "plank", catalogId: 397, why: "A side plank with hip adduction works the adductors from a side plank, in the manner of a Copenhagen plank; it is not the plank named." },
];

/** True when the catalog exercise is listed in NOT_THE_SAME_EXERCISE for this record phrase. */
export function isNotTheSameExercise(phrase: string, exerciseId: number): boolean {
  const normalized = normalizeExercisePhrase(phrase);
  return NOT_THE_SAME_EXERCISE.some((entry) => entry.catalogId === exerciseId && normalizeExercisePhrase(entry.phrase) === normalized);
}

/**
 * Catalog `movement` patterns too broad to relate two exercises on their own.
 *
 * Rule: a pattern is broad when it labels more than 15 of the 400 catalog exercises
 * (more than one in 25). Every pattern above that size names a direction of force
 * or a single joint action rather than one exercise family: "Horizontal push" holds
 * bench presses, flys, push-ups, dips, the landmine presses and the mis-tagged
 * Pallof Press and Leg-Press Calf Raise; "Squat / knee dominant" holds squats, the
 * leg press, leg extensions and split squats; "Trunk flexion / anti-extension" holds
 * crunches and planks; the pull, elbow-flexion and elbow-extension labels cover every
 * row, pulldown, curl or triceps variant. Sharing one of these says little about a
 * sport movement, so it never makes a related-pattern match. The largest pattern
 * below the line, "Hip hinge" (15), is one family: deadlifts, good mornings, back
 * extensions, swings. movementSupport.test.ts recomputes the rule against the
 * catalog, so a catalog change that moves a pattern across it is caught.
 */
export const BROAD_PATTERN_MIN_EXERCISES = 16;
export const BROAD_PATTERNS: readonly string[] = [
  "Horizontal push",
  "Horizontal pull",
  "Vertical pull",
  "Elbow flexion",
  "Trunk flexion / anti-extension",
  "Squat / knee dominant",
  "Elbow extension",
];

type NamedPhrase = { text: string; matchers: string[]; synonym?: string; notTheSame: ReadonlySet<number> };
type PrimeMover = { name: string; keys: string[] };

type MovementContext = {
  movementLabel: string;
  phrases: NamedPhrase[];
  primeMovers: PrimeMover[];
  /** Pattern -> the first movement-specific exercise with it; broad patterns are never anchors. */
  anchors: Map<string, Exercise>;
};

const contexts = new WeakMap<EnrichedSportMovement, MovementContext>();

function displayLabelFor(record: Pick<EnrichedSportMovement, "sportId" | "id" | "label">): string {
  const profile = sportMovementProfiles.find((entry) => entry.id === record.id && entry.sportId === record.sportId);
  return movementDisplayLabel(profile?.label ?? record.label);
}

/** The record's prime movers one muscle at a time: some entries list several, comma-separated. */
function primeMoversOf(record: EnrichedSportMovement): PrimeMover[] {
  const names = record.primeMovers
    .flatMap((entry) => entry.split(","))
    .map((name) => name.trim().replace(/\.+$/, "").toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(names)).map((name) => ({ name, keys: catalogKeysForRecordMuscle(name) }));
}

function namedPhrasesOf(record: EnrichedSportMovement): NamedPhrase[] {
  const seen = new Set<string>();
  const phrases: NamedPhrase[] = [];
  for (const text of record.recommendedExercises) {
    const normalized = normalizeExercisePhrase(text);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    const synonym = SAME_EXERCISE_SYNONYMS.find((entry) => normalizeExercisePhrase(entry.phrase) === normalized);
    const notTheSame = new Set(NOT_THE_SAME_EXERCISE.filter((entry) => normalizeExercisePhrase(entry.phrase) === normalized).map((entry) => entry.catalogId));
    phrases.push({ text, matchers: synonym ? [normalized, normalizeExercisePhrase(synonym.sameAs)] : [normalized], synonym: synonym?.sameAs, notTheSame });
  }
  return phrases;
}

const containsNormalized = (normalizedName: string, normalizedPhrase: string) => ` ${normalizedName} `.includes(` ${normalizedPhrase} `);

/** The record phrase names this exercise: its name contains the phrase (or a synonym), and the pair is not listed as a different exercise. */
const phraseNames = (phrase: NamedPhrase, exercise: Exercise) => !phrase.notTheSame.has(exercise.id) && phrase.matchers.some((matcher) => containsNormalized(normalizedNameOf(exercise), matcher));

const normalizedNames = new WeakMap<Exercise, string>();
function normalizedNameOf(exercise: Exercise): string {
  let name = normalizedNames.get(exercise);
  if (name === undefined) {
    name = normalizeExercisePhrase(exercise.name);
    normalizedNames.set(exercise, name);
  }
  return name;
}

function phraseIndexFor(exercise: Exercise, phrases: NamedPhrase[]): number {
  return phrases.findIndex((phrase) => phraseNames(phrase, exercise));
}

function contextFor(record: EnrichedSportMovement): MovementContext {
  const cached = contexts.get(record);
  if (cached) return cached;
  const phrases = namedPhrasesOf(record);
  const anchors = new Map<string, Exercise>();
  catalogExercises
    .map((exercise) => ({ exercise, index: phraseIndexFor(exercise, phrases) }))
    .filter((entry) => entry.index >= 0)
    .sort((left, right) => left.index - right.index || left.exercise.id - right.exercise.id)
    .forEach(({ exercise }) => {
      if (!BROAD_PATTERNS.includes(exercise.movement) && !anchors.has(exercise.movement)) anchors.set(exercise.movement, exercise);
    });
  const context = { movementLabel: displayLabelFor(record), phrases, primeMovers: primeMoversOf(record), anchors };
  contexts.set(record, context);
  return context;
}

const joinNames = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

/**
 * Where one exercise stands for one movement record, or null when it is neither
 * named in the record nor trains a prime mover. getMovementSupport builds its tiers
 * from this, and getExerciseActionConnection reads it, so every surface agrees.
 */
export function classifyExerciseForMovement(exercise: Exercise, record: EnrichedSportMovement): SupportRow | null {
  const context = contextFor(record);
  const sharedPrimeMovers = context.primeMovers
    .filter((mover) => mover.keys.some((key) => exercise.primaryMuscles.includes(key)))
    .map((mover) => mover.name);
  const phraseIndex = phraseIndexFor(exercise, context.phrases);
  if (phraseIndex >= 0) {
    const phrase = context.phrases[phraseIndex];
    const sameAs = phrase.synonym && !containsNormalized(normalizedNameOf(exercise), phrase.matchers[0]) ? phrase.synonym : undefined;
    const synonymNote = sameAs ? ` (the same exercise as the ${sameAs})` : "";
    return { exercise, tier: "specific", reason: `Named in the ${context.movementLabel} movement record: ${phrase.text}${synonymNote}`, phrase: phrase.text, ...(sameAs ? { sameAs } : {}), sharedPrimeMovers };
  }
  if (!sharedPrimeMovers.length) return null;
  const anchor = context.anchors.get(exercise.movement);
  if (anchor) {
    return { exercise, tier: "related", reason: `Same ${exercise.movement.toLowerCase()} pattern as ${anchor.name}`, anchorExerciseId: anchor.id, sharedPrimeMovers };
  }
  const subject = sharedPrimeMovers.length === 1 ? `${sharedPrimeMovers[0]}, a prime mover` : `${joinNames(sharedPrimeMovers)}, prime movers`;
  return { exercise, tier: "muscle", reason: `Trains ${subject} in ${context.movementLabel}; not specific to the movement.`, sharedPrimeMovers };
}

/**
 * How one exercise's tier was reached, for "How this match was made" in the
 * exercise details: the rule that placed it, in plain words, then the record's
 * confidence and source count. Null when the exercise is in no tier. It never
 * says "reviewed": no person has checked these matches exercise by exercise.
 */
export function supportMatchMethod(exercise: Exercise, record: EnrichedSportMovement): string | null {
  const row = classifyExerciseForMovement(exercise, record);
  if (!row) return null;
  const movement = contextFor(record).movementLabel;
  const movers = row.sharedPrimeMovers.length === 1 ? `${row.sharedPrimeMovers[0]}, a prime mover` : `${joinNames(row.sharedPrimeMovers)}, prime movers`;
  let how: string;
  if (row.tier === "specific") {
    how = `Matched by exercise name to the ${movement} movement record (${row.phrase}${row.sameAs ? `, the same exercise as the ${row.sameAs}` : ""}).`;
  } else if (row.tier === "related") {
    const anchor = catalogExercises.find((candidate) => candidate.id === row.anchorExerciseId);
    how = `Not named in the ${movement} movement record. It has the same ${exercise.movement.toLowerCase()} pattern as ${anchor?.name ?? "a movement-specific exercise"}, which the record names, and trains ${movers} in ${movement}.`;
  } else {
    how = `Not named in the ${movement} movement record, and its pattern does not relate it to an exercise the record names. It trains ${movers} in ${movement}.`;
  }
  const sources = record.sources.length;
  return `${how} Record rated ${record.evidenceConfidence} confidence, from ${sources} ${sources === 1 ? "source" : "sources"}.`;
}

type CatalogTiers = Pick<MovementSupport, "specific" | "related" | "muscle" | "unmatchedPhrases" | "primeMoverKeys">;
const catalogTiers = new WeakMap<EnrichedSportMovement, CatalogTiers>();

/**
 * The three tiers for one enriched record over the whole catalog, worked out once
 * per record. getMovementSupport reads them by id; getMovementAssistance reads them
 * for the record it is handed.
 */
export function catalogSupportForRecord(record: EnrichedSportMovement): CatalogTiers {
  const cached = catalogTiers.get(record);
  if (cached) return cached;
  const context = contextFor(record);
  const rows = catalogExercises.map((exercise) => classifyExerciseForMovement(exercise, record)).filter((row): row is SupportRow => row !== null);
  const phraseOrder = (row: SupportRow) => context.phrases.findIndex((phrase) => phrase.text === row.phrase);
  const firstPrimeMover = (row: SupportRow) => context.primeMovers.findIndex((mover) => mover.name === row.sharedPrimeMovers[0]);
  const tiers: CatalogTiers = {
    specific: rows.filter((row) => row.tier === "specific").sort((left, right) => phraseOrder(left) - phraseOrder(right) || left.exercise.id - right.exercise.id),
    // Within related, more shared prime movers first; this orders a tier, it never decides one.
    related: rows.filter((row) => row.tier === "related").sort((left, right) => right.sharedPrimeMovers.length - left.sharedPrimeMovers.length || left.exercise.id - right.exercise.id),
    // Muscle support follows the record's own prime-mover order, so an exercise tagged with many muscles is not lifted by its breadth.
    muscle: rows.filter((row) => row.tier === "muscle").sort((left, right) => firstPrimeMover(left) - firstPrimeMover(right) || left.exercise.id - right.exercise.id),
    unmatchedPhrases: context.phrases
      .filter((phrase) => !catalogExercises.some((exercise) => phraseNames(phrase, exercise)))
      .map((phrase) => phrase.text),
    primeMoverKeys: Array.from(new Set(context.primeMovers.flatMap((mover) => mover.keys))),
  };
  catalogTiers.set(record, tiers);
  return tiers;
}

const supportCache = new Map<string, MovementSupport>();

/**
 * The tiers for one sport movement over the whole catalog, worked out once per
 * movement. Refinements (equipment, search, favorites) are applied afterwards and
 * only ever remove rows: see refineMovementSupport in catalogDiscovery.
 */
export function getMovementSupport(sportId: string, movementId: string): MovementSupport {
  const key = `${sportId}/${movementId}`;
  const cached = supportCache.get(key);
  if (cached) return cached;
  const profile = sportMovementProfiles.find((entry) => entry.id === movementId && entry.sportId === sportId);
  const record = getEnrichedMovement(sportId, movementId);
  const sportLabel = sportProfiles.find((entry) => entry.id === sportId)?.label ?? profile?.sportLabel ?? sportId;
  const base = { sportId, movementId, movementLabel: movementDisplayLabel(profile?.label ?? record?.label ?? movementId), sportLabel };
  let support: MovementSupport;
  if (!record) {
    support = { ...base, status: "no-record", record: null, specific: [], related: [], muscle: [], unmatchedPhrases: [], primeMoverKeys: [] };
  } else {
    const tiers = catalogSupportForRecord(record);
    support = {
      ...base,
      status: tiers.specific.length ? "ok" : "no-named-matches",
      record: { confidence: record.evidenceConfidence, sourceCount: record.sources.length },
      ...tiers,
    };
  }
  supportCache.set(key, support);
  return support;
}

/** What a movement-mode count counts: movement-specific and related-pattern rows. Muscle support is never a match. */
export function movementMatchCount(support: Pick<MovementSupport, "specific" | "related">): number {
  return support.specific.length + support.related.length;
}
