import { exercises, type Exercise } from "./exerciseCatalog";
import { sportProfiles, sportMovementProfiles } from "./sportMovementDatabase";
import { muscleLabels } from "@/components/AnatomyMap";
import { strengthRegionDefinitions } from "../../../shared/strengthGenomeDefinitions";
import { EXERCISE_ALIASES, normalizeSearchText, withinEditDistance } from "./exerciseSearch";

/**
 * Universal search, per the philosophy's "Universal search and retrieval
 * contract" (information_hierarchy, adopted, FIXED):
 *
 *   "Sports Genome universal search retrieves canonical muscles, exercises,
 *    sports, Insights, workouts/programs, tests/measurements and metrics from
 *    one predictable entry. Query matching includes canonical names, curated
 *    aliases/abbreviations and tolerant spelling. Results identify object type
 *    and disambiguating context; clear exact-name navigational matches outrank
 *    inferred/personalized suggestions. ... Personalization may rank but cannot
 *    hide exact canonical matches. Empty results offer alias correction,
 *    broader scope or adjacent categories."
 *
 * The engine is deliberately pure so the ranking rules the contract fixes can
 * be tested directly rather than through the UI.
 */

export type SearchResultType = "exercise" | "muscle" | "sport" | "action" | "metric" | "destination";

export type SearchResult = {
  type: SearchResultType;
  /** Stable identity of the canonical object this result opens. */
  id: string;
  label: string;
  /** Disambiguating context, which the contract requires alongside the type. */
  context: string;
  /** Why this matched, so the ranking stays inspectable. */
  matchKind: "exact" | "alias" | "prefix" | "word" | "contains" | "fuzzy";
  score: number;
};

export type SearchGroup = { type: SearchResultType; label: string; results: SearchResult[] };

const TYPE_LABELS: Record<SearchResultType, string> = {
  exercise: "Exercises",
  muscle: "Muscles",
  sport: "Sports",
  action: "Sport actions",
  metric: "Tests and metrics",
  destination: "Places in the app",
};

/**
 * Curated aliases and abbreviations. The contract calls for these explicitly;
 * athletes type "abs", "lats", "bench", "OHP", not canonical anatomy.
 */
const ALIASES: Record<string, string[]> = {
  abs: ["abs", "core", "six pack", "stomach"],
  obliques: ["obliques", "side abs"],
  lats: ["lats", "wings", "back width"],
  upperBack: ["upper back", "rhomboids", "mid back"],
  lowerBack: ["lower back", "erectors", "spinal erectors"],
  glutes: ["glutes", "butt", "backside"],
  quads: ["quads", "thighs", "front leg"],
  hamstrings: ["hamstrings", "hams", "back of leg"],
  calves: ["calves", "calf"],
  frontDelts: ["front delts", "anterior delts"],
  sideDelts: ["side delts", "lateral delts", "medial delts"],
  rearDelts: ["rear delts", "posterior delts"],
  traps: ["traps", "trapezius"],
  chest: ["chest", "pecs", "pectorals"],
  biceps: ["biceps", "bis", "arms"],
  triceps: ["triceps", "tris", "arms"],
  forearms: ["forearms", "grip"],
  rotatorCuff: ["rotator cuff", "cuff"],
};

// The exercise aliases, the normaliser and the edit-distance live with the
// exercise matcher now, so the picker, the finder, the lift log and this search
// all understand a typed name the same way.
function normalize(value: string): string { return normalizeSearchText(value); }

type Candidate = {
  type: SearchResultType;
  id: string;
  label: string;
  context: string;
  /** Canonical name plus curated aliases, all pre-normalised. */
  terms: string[];
};

/**
 * Score a candidate against the query. Higher is better, 0 means no match.
 * The ordering here is the contract's: a clear exact-name navigational match
 * outranks anything inferred.
 */
function scoreCandidate(candidate: Candidate, query: string): { score: number; matchKind: SearchResult["matchKind"] } | null {
  const canonical = candidate.terms[0];
  type Hit = { score: number; matchKind: SearchResult["matchKind"] };
  const found: Hit[] = [];
  const consider = (score: number, matchKind: SearchResult["matchKind"]) => { found.push({ score, matchKind }); };

  candidate.terms.forEach((term, index) => {
    const isCanonical = index === 0;
    if (term === query) consider(isCanonical ? 1000 : 900, isCanonical ? "exact" : "alias");
    else if (term.startsWith(query)) consider(isCanonical ? 800 : 700, "prefix");
    else if (term.split(" ").some((word) => word.startsWith(query))) consider(isCanonical ? 600 : 520, "word");
    else if (term.includes(query)) consider(isCanonical ? 400 : 320, "contains");
  });

  if (!found.length && query.length >= 4) {
    // Tolerant spelling, last resort so it can never outrank a real match.
    const words = canonical.split(" ");
    if (withinEditDistance(canonical, query, query.length >= 8 ? 2 : 1)) consider(200, "fuzzy");
    else if (words.some((word) => word.length >= 4 && withinEditDistance(word, query, 1))) consider(150, "fuzzy");
  }

  if (!found.length) return null;
  const best = found.reduce((a, b) => (b.score > a.score ? b : a));
  // Shorter canonical names are the more likely navigational target for the
  // same match kind ("Squat" before "Bulgarian Split Squat" for "squat").
  const brevity = Math.max(0, 40 - canonical.length) / 40;
  return { score: best.score + brevity, matchKind: best.matchKind };
}

function exerciseCandidates(): Candidate[] {
  return exercises.map((exercise: Exercise) => ({
    type: "exercise" as const,
    id: String(exercise.id),
    label: exercise.name,
    context: [exercise.movement, exercise.equipment].filter(Boolean).join(" · "),
    terms: [normalize(exercise.name), ...(EXERCISE_ALIASES[exercise.name] || []).map(normalize)],
  }));
}

function muscleCandidates(): Candidate[] {
  return Object.entries(muscleLabels).map(([key, label]) => ({
    type: "muscle" as const,
    id: key,
    label,
    context: "Body Lab region",
    terms: [normalize(label), normalize(key), ...(ALIASES[key] || []).map(normalize)],
  }));
}

function sportCandidates(): Candidate[] {
  return sportProfiles.map((sport) => ({
    type: "sport" as const,
    id: sport.id,
    label: sport.label,
    context: `${sport.movementFamilies.length} movement families`,
    terms: [normalize(sport.label), normalize(sport.id)],
  }));
}

function actionCandidates(): Candidate[] {
  return sportMovementProfiles.map((action) => ({
    type: "action" as const,
    id: action.id,
    label: action.label,
    context: `${action.sportLabel} · ${action.family}`,
    terms: [normalize(action.label), normalize(action.family)],
  }));
}

function metricCandidates(): Candidate[] {
  return strengthRegionDefinitions.map((region) => ({
    type: "metric" as const,
    id: region.id,
    label: `${region.label} strength record`,
    context: region.bodyArea,
    terms: [normalize(region.label), normalize(`${region.label} strength`), normalize(region.id)],
  }));
}

/** Destinations keep search an accelerator to places, not a replacement for nav. */
const DESTINATIONS: Candidate[] = [
  { type: "destination", id: "day-plan", label: "Training day", context: "Train", terms: ["training day", "today", "workout"] },
  { type: "destination", id: "tracker", label: "Workout tracker", context: "Train", terms: ["workout tracker", "tracker", "log sets"] },
  // "Builder" was a second copy of Training Day and is gone; the words people search
  // for are kept here so the old name still finds the page that now owns the job.
  { type: "destination", id: "day-plan", label: "Build a workout", context: "Train", terms: ["workout builder", "builder", "build a workout", "plan"] },
  { type: "destination", id: "review", label: "Review this day", context: "Train", terms: ["review", "stack review", "prep", "warm up", "warmup", "programming", "volume"] },
  { type: "destination", id: "progress", label: "Progress", context: "Progress", terms: ["progress", "history"] },
  { type: "destination", id: "strength", label: "Strength Genome", context: "Body Lab", terms: ["strength genome", "strength", "lifts"] },
  { type: "destination", id: "catalog", label: "Exercise catalog", context: "Body Lab", terms: ["exercise catalog", "catalog", "exercises"] },
  { type: "destination", id: "body", label: "Body Lab", context: "Body Lab", terms: ["body lab", "body map", "anatomy"] },
  { type: "destination", id: "movement", label: "Movement atlas", context: "Body Lab", terms: ["movement atlas", "movements", "actions"] },
  { type: "destination", id: "profile", label: "About me", context: "Profile", terms: ["about me", "profile", "settings", "account"] },
];

let cachedCandidates: Candidate[] | null = null;
function allCandidates(): Candidate[] {
  if (!cachedCandidates) {
    cachedCandidates = [
      ...DESTINATIONS,
      ...muscleCandidates(),
      ...sportCandidates(),
      ...metricCandidates(),
      ...exerciseCandidates(),
      ...actionCandidates(),
    ];
  }
  return cachedCandidates;
}

/** Type order when scores tie: the shorter, more navigational objects first. */
const TYPE_PRIORITY: Record<SearchResultType, number> = {
  destination: 0, muscle: 1, sport: 2, metric: 3, exercise: 4, action: 5,
};

export function searchEverything(rawQuery: string, limitPerType = 5): SearchGroup[] {
  const query = normalize(rawQuery);
  if (query.length < 2) return [];

  const scored: SearchResult[] = [];
  for (const candidate of allCandidates()) {
    const hit = scoreCandidate(candidate, query);
    if (!hit) continue;
    scored.push({
      type: candidate.type, id: candidate.id, label: candidate.label,
      context: candidate.context, matchKind: hit.matchKind, score: hit.score,
    });
  }

  scored.sort((a, b) => b.score - a.score || TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] || a.label.localeCompare(b.label));

  const groups = new Map<SearchResultType, SearchResult[]>();
  for (const result of scored) {
    const bucket = groups.get(result.type) || [];
    // An exact or alias match is a clear navigational target and is never
    // truncated away, even past the per-type limit.
    if (bucket.length < limitPerType || result.matchKind === "exact" || result.matchKind === "alias") {
      bucket.push(result);
      groups.set(result.type, bucket);
    }
  }

  return Array.from(groups.entries())
    .sort((a, b) => {
      const topA = a[1][0]?.score ?? 0;
      const topB = b[1][0]?.score ?? 0;
      return topB - topA || TYPE_PRIORITY[a[0]] - TYPE_PRIORITY[b[0]];
    })
    .map(([type, results]) => ({ type, label: TYPE_LABELS[type], results } as SearchGroup));
}

/**
 * Empty-result recovery. The contract requires alias correction, a broader
 * scope, or adjacent categories rather than a dead end.
 */
export function searchSuggestions(rawQuery: string, limit = 4): string[] {
  const query = normalize(rawQuery);
  if (!query) return [];
  // Recovery has to reach FURTHER than matching does, otherwise anything it
  // could suggest would already have matched and the empty state stays a dead
  // end. Matching tolerates up to 2 edits; suggestions tolerate up to 4.
  const near: { term: string; distance: number }[] = [];
  for (const candidate of allCandidates()) {
    const canonical = candidate.terms[0];
    for (let d = 1; d <= 4; d++) {
      if (withinEditDistance(canonical, query, d)) { near.push({ term: candidate.label, distance: d }); break; }
      const word = canonical.split(" ").find((w) => w.length >= 4 && withinEditDistance(w, query, d));
      if (word) { near.push({ term: candidate.label, distance: d + 1 }); break; }
    }
  }
  near.sort((a, b) => a.distance - b.distance || a.term.length - b.term.length);
  return Array.from(new Set(near.map((n) => n.term))).slice(0, limit);
}

export const searchResultTypeLabels = TYPE_LABELS;
