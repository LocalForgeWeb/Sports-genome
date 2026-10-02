/**
 * Exercise discovery scoped to a sport action.
 *
 * The Body Lab's primary action used to open the catalog filtered by a single
 * muscle - the selected one, or failing that the action's first muscle - so
 * "Wrestling / Hand fighting" led to "Find pectoralis major exercises". The
 * action being explored never reached the catalog at all; the catalog measured
 * its action links against the profile's selected action, which could still be
 * whatever Body Lab had shown before.
 *
 * Discovery now carries its own context, kept apart from the inspected muscle
 * and from the add destination:
 *
 *   movement - exercises that support one sport action, named by stable ids;
 *   muscle   - exercises that use one muscle, entered deliberately from a
 *              muscle's detail;
 *   all      - the whole catalog.
 *
 * Movement results come from the movement record itself, in three tiers that
 * are never mixed: exercises the record names, exercises that train the demands
 * the record describes, and exercises that only share a muscle with it. A
 * shared muscle on its own is listed as that, never as a movement match.
 */
import type { Exercise } from "@/lib/exerciseCatalog";
import { getEnrichedMovement, type EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import { sportMovementProfiles, sportProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";
import { exerciseMatchesSignal, getMovementMuscles, getMovementSignals, movementSignalLabels, muscleWords, type MovementSignal } from "@/lib/movementRecommendations";
import { movementDisplayLabel } from "@/lib/movementLabel";

export type DiscoveryContext =
  | { mode: "movement"; sportId: string; movementId: string }
  | { mode: "muscle"; muscleId: string }
  | { mode: "all" };

export const browseAllExercises: DiscoveryContext = { mode: "all" };

export type MovementMatchTier = "named" | "demand" | "muscle";

export type MovementExerciseMatch = {
  exercise: Exercise;
  tier: MovementMatchTier;
  /** One line from the mapping data: what the record names, or which demands and muscles are shared. */
  reason: string;
  /** Demand-tier ordering: shared demands first, then shared muscles. */
  weight: number;
};

export type MovementDiscovery = {
  sportId: string;
  movementId: string;
  /** "Hand fighting" */
  label: string;
  sportLabel: string;
  /** False when neither the movement record nor the sport profile knows this action. */
  mapped: boolean;
  /** True when a reviewed movement record exists; false when only the sport profile does. */
  hasRecord: boolean;
  named: MovementExerciseMatch[];
  demand: MovementExerciseMatch[];
  muscleOnly: MovementExerciseMatch[];
  /** The action's muscles as catalog keys, for the muscle-mode fallback when nothing is mapped. */
  muscles: string[];
};

const tierOrder: Record<MovementMatchTier, number> = { named: 0, demand: 1, muscle: 2 };

/**
 * Words a record uses for a thing the catalog names differently. A farmer carry is
 * the catalog's Farmer's Walk; a record's "pull-up" is spelt the same way here.
 */
const nameSynonyms: Record<string, string[]> = { carry: ["carry", "walk"], walk: ["walk", "carry"], throw: ["throw", "toss"] };

/** Whole phrases the catalog spells another way; keys are the record's phrase, normalised by `words`. */
const phraseAliases: Record<string, string[]> = {
  "rear foot elevated split squat": ["bulgarian split squat"],
  "nordic hamstring curl": ["nordic curl"],
  "trap bar deadlift": ["trap bar deadlift", "hex bar deadlift"],
  "single leg rdl": ["single leg romanian deadlift"],
  "medicine ball rotational throw": ["medicine ball rotational throw", "rotational medicine ball throw"],
  "pallof press": ["pallof press", "cable anti rotation press"],
};

/** "Farmer's Walk" → ["farmer", "walk"]: lower case, no apostrophes, a plain plural folded. */
const words = (text: string) => text.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9]+/).filter((word) => word.length >= 2).map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word));

/**
 * Whether a catalog exercise is the one a record names: the record's phrase
 * appears in the exercise's name as consecutive words ("cable row" → Seated
 * Cable Row and Single-Arm Cable Row, not Cable Upright Row; "push-up" → every
 * push-up variant; "farmer carry" → Farmer's Walk). The looser matcher this
 * replaces needed only two words of a phrase to land anywhere, so
 * "rear-foot-elevated split squat" named a cable press.
 */
export function exerciseNamedBy(exercise: Exercise, phrase: string): boolean {
  const have = words(exercise.name);
  const spellings = [phrase, ...(phraseAliases[words(phrase).join(" ")] ?? [])];
  return spellings.some((spelling) => {
    const need = words(spelling);
    if (!need.length || need.length > have.length) return false;
    const fits = (word: string, at: number) => (nameSynonyms[word] ?? [word]).includes(have[at]);
    for (let start = 0; start + need.length <= have.length; start += 1) {
      if (need.every((word, offset) => fits(word, start + offset))) return true;
    }
    return false;
  });
}

/** The record's own phrase this exercise answers to, for the reason line. */
function namedBy(exercise: Exercise, record: EnrichedSportMovement | undefined): string | null {
  if (!record) return null;
  return record.recommendedExercises.find((name) => exerciseNamedBy(exercise, name)) ?? null;
}

/**
 * Which of the action's muscles the exercise works: the ones it trains directly
 * first, then the supporting ones. "shoulders" covers any deltoid, and is dropped
 * when a specific deltoid is already listed, so a reason never reads "anterior
 * deltoids, deltoids".
 */
function sharedMuscles(exercise: Exercise, actionMuscles: readonly string[]): string[] {
  const primary = new Set(exercise.primaryMuscles);
  const used = new Set([...exercise.primaryMuscles, ...exercise.secondaryMuscles]);
  const deltoids = ["frontDelts", "sideDelts", "rearDelts"];
  const shared = actionMuscles.filter((muscle) => used.has(muscle) || (muscle === "shoulders" && deltoids.some((key) => used.has(key))));
  const specificDeltoid = shared.some((muscle) => deltoids.includes(muscle));
  return shared
    .filter((muscle) => !(muscle === "shoulders" && specificDeltoid))
    .sort((a, b) => Number(primary.has(b) || (b === "shoulders" && deltoids.some((key) => primary.has(key)))) - Number(primary.has(a) || (a === "shoulders" && deltoids.some((key) => primary.has(key)))));
}

const list = (words: string[]) => words.join(", ");

export function discoverMovementExercises(sportId: string, movementId: string, catalog: readonly Exercise[]): MovementDiscovery {
  const profile: SportMovementProfile | undefined = sportMovementProfiles.find((movement) => movement.sportId === sportId && movement.id === movementId);
  const record = getEnrichedMovement(sportId, movementId);
  const sportLabel = sportProfiles.find((sport) => sport.id === sportId)?.label || profile?.sportLabel || sportId;
  const label = movementDisplayLabel(record?.label || profile?.label || movementId);
  const base: MovementDiscovery = { sportId, movementId, label, sportLabel, mapped: Boolean(profile || record), hasRecord: Boolean(record), named: [], demand: [], muscleOnly: [], muscles: profile ? getMovementMuscles(profile) : [] };
  if (!profile && !record) return base;

  const signals: MovementSignal[] = profile ? getMovementSignals(profile) : [];
  const actionMuscles = base.muscles;
  const matches: MovementExerciseMatch[] = [];
  for (const exercise of catalog) {
    const named = namedBy(exercise, record);
    const matchedSignals = signals.filter((signal) => exerciseMatchesSignal(exercise, signal));
    const muscles = sharedMuscles(exercise, actionMuscles);
    if (named) {
      matches.push({ exercise, tier: "named", reason: `Named in the ${label.toLowerCase()} record as "${named}".`, weight: 0 });
      continue;
    }
    if (matchedSignals.length) {
      const demands = matchedSignals.map((signal) => movementSignalLabels[signal]);
      const reason = muscles.length
        ? `Trains its ${list(demands)} demand · works ${list(muscles.slice(0, 2).map(muscleWords))}.`
        : `Trains its ${list(demands)} demand.`;
      matches.push({ exercise, tier: "demand", reason, weight: matchedSignals.length * 2 + muscles.length });
      continue;
    }
    if (muscles.length) {
      matches.push({ exercise, tier: "muscle", reason: `Shares a muscle only: ${list(muscles.slice(0, 3).map(muscleWords))}. Not a movement match.`, weight: muscles.length });
    }
  }
  matches.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.weight - a.weight || a.exercise.id - b.exercise.id);
  return {
    ...base,
    named: matches.filter((match) => match.tier === "named"),
    demand: matches.filter((match) => match.tier === "demand"),
    muscleOnly: matches.filter((match) => match.tier === "muscle"),
  };
}

/** The exercises a movement context lists by default: named and demand matches, in that order. */
export function movementResultSet(discovery: MovementDiscovery): MovementExerciseMatch[] {
  return [...discovery.named, ...discovery.demand];
}
