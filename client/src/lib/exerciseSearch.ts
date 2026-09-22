/**
 * Finding an exercise by whatever the athlete calls it.
 *
 * Four places in the app search the same 400 names - the day picker, the Plan
 * page's finder, the lift log and the Catalog - and every one of them asked for
 * an exact substring of the canonical spelling. "reardelt fly" found nothing
 * because the catalog writes "Rear-Delt Fly". "trap bar" found nothing because
 * it writes "T-Bar". "romanain" found nothing because it is two letters off.
 * The universal search already knew how to be tolerant about all three; this
 * is that tolerance, factored out so a name typed anywhere means the same thing.
 *
 * Matching, strongest first:
 *   exact / alias   the whole name, or a curated name athletes use for it
 *   prefix          the start of it
 *   compact         the same letters with the spaces and hyphens taken out
 *   word            every word typed begins a word of the exercise, any order
 *   contains        somewhere inside the name
 *   fuzzy           a word one letter off (two, for a long one) - last, so it
 *                   can never outrank something actually called that
 */
import type { Exercise } from "./exerciseCatalog";
import { muscleLabels } from "@/components/AnatomyMap";

export type ExerciseMatchKind = "exact" | "alias" | "prefix" | "compact" | "word" | "contains" | "fuzzy";

export type ExerciseMatch<T extends Exercise = Exercise> = {
  exercise: T;
  /** Higher is a better match; 0 means the list was not filtered by a query. */
  score: number;
  kind: ExerciseMatchKind | "unfiltered";
};

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Spacing and hyphens are not spelling: "reardelt", "rear delt" and "Rear-Delt" are one word here. */
export function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/ /g, "");
}

/** Bounded Levenshtein distance: enough for the contract's "tolerant spelling". */
export function withinEditDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      best = Math.min(best, current[j]);
    }
    if (best > max) return false;
    previous = current;
  }
  return previous[b.length] <= max;
}

/**
 * Names athletes actually use for an exercise, keyed by the catalog's name.
 * Curated, not generated: each one is a real way someone asks for this lift.
 */
export const EXERCISE_ALIASES: Record<string, string[]> = {
  "Barbell Bench Press": ["bench", "bench press", "flat bench", "bp"],
  "Barbell Overhead Press": ["ohp", "overhead press", "military press", "press"],
  "Back Squat": ["squat", "back squat"],
  "Barbell Back Squat": ["squat", "back squat"],
  "Conventional Deadlift": ["deadlift", "dl", "conventional"],
  "Romanian Deadlift": ["rdl", "romanian"],
  "Barbell Hip Thrust": ["hip thrust", "thrust"],
  "Lat Pulldown": ["pulldown", "lat pull"],
  "Pull-Up": ["pullup", "pull up", "pullups"],
  "Chin-Up": ["chinup", "chin up", "chins"],
  "Barbell Curl": ["curl", "bicep curl"],
  // A trap bar and a hex bar are the same bar. The catalog's only trap-bar lift
  // is the shrug - there is no trap-bar deadlift - and athletes also say "trap
  // bar" when they mean a T-bar row, so those carry it too, ranked behind any
  // lift actually named for the bar.
  "Trap-Bar Shrug": ["hex bar shrug", "hex bar"],
  "Chest-Supported T-Bar Row": ["t bar", "tbar", "t bar row", "trap bar row", "hex bar row"],
  "Landmine T-Bar Row": ["t bar", "tbar", "t bar row", "trap bar row", "hex bar row"],
  "Bent-Over Rear-Delt Fly": ["rear delt fly", "reverse fly", "bent over fly", "rear delt raise"],
  "Cable Rear-Delt Fly": ["rear delt fly", "cable reverse fly", "reverse fly"],
  "Chest-Supported Rear-Delt Raise": ["rear delt raise", "reverse fly"],
  "Single-Arm Cable Rear-Delt Fly": ["rear delt fly", "single arm reverse fly"],
  "Face Pull": ["facepull", "rear delt pull"],
  "Dumbbell Skull Crusher": ["skullcrusher", "skull crushers", "lying triceps extension"],
  "Good Morning": ["good mornings"],
  "Hack Squat": ["hack"],
  "Goblet Squat": ["goblet"],
};

/** Single words athletes abbreviate or misspell, expanded before matching. */
const TOKEN_SYNONYMS: Record<string, string> = {
  db: "dumbbell", dbs: "dumbbell", dumbell: "dumbbell", dumbel: "dumbbell", dumbbel: "dumbbell",
  bb: "barbell", kb: "kettlebell", kbs: "kettlebell", bw: "bodyweight",
  tricep: "triceps", bicep: "biceps", hammy: "hamstrings", hammies: "hamstrings",
  pullup: "pull up", pullups: "pull up", chinup: "chin up", chinups: "chin up", pushup: "push up", pushups: "push up",
  rdl: "romanian deadlift", rdls: "romanian deadlift", ohp: "overhead press",
  facepull: "face pull", skullcrusher: "skull crusher", skullcrushers: "skull crusher",
};

export function queryTokens(rawQuery: string): string[] {
  return normalizeSearchText(rawQuery).split(" ").filter(Boolean).flatMap((token) => (TOKEN_SYNONYMS[token] ?? token).split(" "));
}

type Indexed = {
  /** Canonical name first, then aliases; all normalised. */
  names: string[];
  compactNames: string[];
  nameWords: string[];
  /** Name words plus movement, equipment, category, muscles and qualities. */
  allWords: string[];
};

const humanizeMuscleKey = (muscle: string) => muscle.replace(/([a-z])([A-Z])/g, "$1 $2");

const indexCache = new WeakMap<Exercise, Indexed>();

function indexOf(exercise: Exercise): Indexed {
  const cached = indexCache.get(exercise);
  if (cached) return cached;
  const names = [normalizeSearchText(exercise.name), ...(EXERCISE_ALIASES[exercise.name] || []).map(normalizeSearchText)];
  const nameWords = Array.from(new Set(names.flatMap((name) => name.split(" "))));
  const muscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
  const context = normalizeSearchText([
    exercise.movement, exercise.equipment, exercise.category,
    ...muscles.flatMap((muscle) => [humanizeMuscleKey(muscle), muscleLabels[muscle] || ""]),
    ...exercise.qualities,
  ].join(" "));
  const indexed: Indexed = {
    names,
    compactNames: names.map((name) => name.replace(/ /g, "")),
    nameWords,
    allWords: Array.from(new Set([...nameWords, ...context.split(" ")])).filter(Boolean),
  };
  indexCache.set(exercise, indexed);
  return indexed;
}

/** How well one exercise answers a query, or null when it does not. */
export function scoreExerciseMatch(exercise: Exercise, rawQuery: string): { score: number; kind: ExerciseMatchKind } | null {
  const tokens = queryTokens(rawQuery);
  if (!tokens.length) return null;
  const q = tokens.join(" ");
  const qc = tokens.join("");
  const idx = indexOf(exercise);
  const hits: { score: number; kind: ExerciseMatchKind }[] = [];
  const consider = (score: number, kind: ExerciseMatchKind) => { hits.push({ score, kind }); };

  idx.names.forEach((term, index) => {
    const canonical = index === 0;
    if (term === q) consider(canonical ? 1000 : 900, canonical ? "exact" : "alias");
    else if (term.startsWith(q)) consider(canonical ? 800 : 720, "prefix");
    else if (term.includes(q)) consider(canonical ? 500 : 440, "contains");
  });

  if (!hits.length && qc.length >= 3 && idx.compactNames.some((compact) => compact.includes(qc))) consider(650, "compact");

  if (!hits.length) {
    const inName = tokens.every((token) => idx.nameWords.some((word) => word.startsWith(token)));
    const inAll = inName || tokens.every((token) => idx.allWords.some((word) => word.startsWith(token)));
    if (inName) consider(600, "word");
    else if (inAll) consider(480, "word");
  }

  if (!hits.length && q.length >= 4) {
    // A short word has to match as written; a longer one may be a letter or two off.
    const near = tokens.every((token) => token.length < 4
      ? idx.allWords.some((word) => word.startsWith(token))
      : idx.nameWords.some((word) => word.length >= 4 && withinEditDistance(word, token, token.length >= 8 ? 2 : 1)));
    if (near && tokens.some((token) => token.length >= 4)) consider(250, "fuzzy");
    else if (idx.compactNames.some((compact) => withinEditDistance(compact, qc, qc.length >= 8 ? 2 : 1))) consider(220, "fuzzy");
  }

  if (!hits.length) return null;
  const best = hits.reduce((a, b) => (b.score > a.score ? b : a));
  // Between equal matches the shorter name is the likelier target ("Squat" before "Bulgarian Split Squat").
  const brevity = Math.max(0, 40 - idx.names[0].length) / 40;
  return { score: best.score + brevity, kind: best.kind };
}

/**
 * The exercises that answer a query, best first; ties keep the order they came
 * in, so a caller's own ordering still decides among equals. An empty query
 * returns everything, unscored and in place.
 */
export function rankExerciseMatches<T extends Exercise>(list: readonly T[], rawQuery: string): ExerciseMatch<T>[] {
  if (!queryTokens(rawQuery).length) return list.map((exercise) => ({ exercise, score: 0, kind: "unfiltered" as const }));
  return list
    .map((exercise, index) => ({ exercise, index, hit: scoreExerciseMatch(exercise, rawQuery) }))
    .filter((entry): entry is { exercise: T; index: number; hit: { score: number; kind: ExerciseMatchKind } } => entry.hit !== null)
    .sort((left, right) => right.hit.score - left.hit.score || left.index - right.index)
    .map(({ exercise, hit }) => ({ exercise, score: hit.score, kind: hit.kind }));
}

export function searchExercises<T extends Exercise>(list: readonly T[], rawQuery: string): T[] {
  return rankExerciseMatches(list, rawQuery).map((match) => match.exercise);
}

/** True when nothing is actually called this and every result is a spelling guess. */
export function matchesAreGuesses(matches: readonly ExerciseMatch[]): boolean {
  return matches.length > 0 && matches[0].kind === "fuzzy";
}

/**
 * When nothing matched at all: the names nearest to what was typed, reaching
 * further than matching does (up to three edits), so an empty list can still
 * point somewhere.
 */
export function suggestExerciseNames(list: readonly Exercise[], rawQuery: string, limit = 3): string[] {
  const all = queryTokens(rawQuery);
  const tokens = all.filter((token) => token.length >= 4);
  const qc = all.join("");
  if (qc.length < 4) return [];
  const FAR = 99;
  const nearest = (candidates: readonly string[], target: string, max: number) => {
    for (let distance = 0; distance <= max; distance++) if (candidates.some((word) => withinEditDistance(word, target, distance))) return distance;
    return FAR;
  };
  const scored: { name: string; whole: number; matched: number; total: number }[] = [];
  for (const exercise of list) {
    const idx = indexOf(exercise);
    const whole = nearest(idx.compactNames, qc, 3);
    // A name that is near every word typed is a better guess than one near a
    // single word: "rmnian dedlft" is Romanian Deadlift, not Face Pull for
    // having "delt" in an alias.
    const longWords = idx.nameWords.filter((word) => word.length >= 4);
    let matched = 0;
    let total = 0;
    for (const token of tokens) {
      const distance = nearest(longWords, token, 3);
      if (distance !== FAR) { matched++; total += distance; }
    }
    if (whole === FAR && !matched) continue;
    scored.push({ name: exercise.name, whole, matched, total });
  }
  scored.sort((a, b) => a.whole - b.whole || b.matched - a.matched || a.total - b.total || a.name.length - b.name.length);
  return Array.from(new Set(scored.map((entry) => entry.name))).slice(0, limit);
}
