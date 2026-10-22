import type {
  Contribution,
  ExposureBout,
  NodeId,
  RegionBoutRow,
  RegionExtras,
  ReviewStatus,
  SpecializationRegionData,
  SpecializationSummary,
  SummaryInterval,
  SummaryMode,
  SummaryRequest,
  TendonGroup,
  TendonNotPlaced,
} from "./types";
import { getSpecializationSummary, indexRegion, mappingKeyIn } from "./exposure";
import { publishedExposureRules } from "./rules";
import { addDaysToDateKey, customInterval, dateRangeLabel, intervalContains, localDateKey, mondayIndexOfDateKey } from "./time";

/**
 * Tendon exposure by attachment area (docs/specialization-atlas, note 11, §4.2 and §4.6): sets
 * counted per attachment area and per group over the shipped calculator's output. Nothing here
 * changes `getSpecializationSummary`, the rule or any summary; it reads summaries and the region's
 * lazily loaded areas (`RegionExtras.tendonAreas`, note 11 §3.10), and names no region, muscle,
 * exercise or side (a test scans this file).
 *
 * The rules, and where each is kept:
 * - **Per area and per group** (`countTendonAreas`, `scopeCounts`): the distinct bouts with a
 *   counted contribution (`NodeExposure.contributions`) on any *reviewed* member, each bout once per
 *   area and once per group however many members it touched. Review status sits on each (group,
 *   member) pair, so a draft membership keeps that one node out of that one group only
 *   (`notPlacedYet`). Areas overlap, so their counts are never added together; `setsInAnyArea`
 *   is a distinct count, never a sum.
 * - **One kind per bout, per area or group** (`kindOf`): `target` when any member's parts in that
 *   area or group are `direct_dynamic`; else `hold` when any are `deliberate_isometric`; else
 *   `other` (contributing, stabilizing, incidental, mixed or unknown work).
 * - **Hold seconds** (`secondsOf`): once per hold bout from its segments, never per member; a hold
 *   with no seconds is counted in `withoutTime`, never as 0 s or an assumed time.
 * - **Kept apart, never in a column or the change line**, each list keeping its set records:
 *   withheld strapped work (`notCounted` rows of reviewed mappings) only when the set did nothing
 *   else counted in that area or group; rows still pending review, likewise only when the set is
 *   neither counted nor strapped there, so a set sits in one list per area; region-only sets, once,
 *   at section level (`regionOnly`); marked warm-ups, which the calculator already keeps out and a
 *   second pass counts on their own (`warmupPassBouts`, `TendonExposure.warmups`).
 * - **Weeks** (`tendonWeekWindows`): calendar weeks in the page's local time, from `time.ts`, so a
 *   week across a clock change is 167 or 169 hours: the last complete week and the four before,
 *   each with its count of finished workouts (`finishedWorkoutsOf`).
 * - **Change line** (`tendonChangeOf`), per area and group and per metric: the last complete week
 *   against the median of the known weeks among the four before, at least three known. A week is
 *   known when it has ended and holds at least one finished workout; a week with none is not read,
 *   never counted as zero; a partly logged week is known. States: no workout last week, building
 *   the baseline (n of 3), both zero, new, or the absolute change with both numbers and whether last
 *   week is above every known week. Structured data only: the page writes the words.
 * - **Day columns** (`tendonDays`): every local day of the window; a day still to come is its own
 *   kind (`toCome: true`), never a 0.
 * - **Planned mode**: plan-week totals per area and group; no dates, no change line, no warm-ups.
 * - Every result carries the method (`tendon_areas_v1`, a constant here, not a rule version), the
 *   mapping version and the rule version of the summary it read.
 *
 * How the page calls it (`TendonExposure.tsx`, lane T3), on first open of the section:
 * 1. `tendonExposure({ region, extras, summary, bouts, finishedWorkouts, catalogMusclesFor, now, tz })`
 *    with the page's own summary (`useSpecializationSummary`: its side, window and mode), the
 *    completed bouts the page reads (`boutsFromSessions` and `excludedRecordsFromSessions`),
 *    `finishedWorkoutsOf(sessions)`, the catalog lookup, the clock and the page's IANA name for
 *    local time (`tz`, as `calendarWeekInterval` takes it). In completed mode it computes six more
 *    summaries (the five weeks and the warm-up pass) through `summarize`
 *    (`getSpecializationSummary` unless the page passes its cached reader); in planned mode none.
 *    Memoize it on the summary, the source revision and the minute of `now`.
 * 2. "Planned in Week N": `countTendonAreas` over the plan week's planned summary (the page's pair
 *    summary in completed mode), then `tendonPlannedEntries(area.counts, plannedBouts)`.
 * 3. "Attaches at" on a muscle's sheet: `tendonPlacesOf(extras, nodeId)`.
 * 4. A day column's sets: `TendonExposure.areas[i].days[d].lists` (target, holds, other, strapped,
 *    pending), each a `RegionBoutRow[]` that `BoutListSheet` opens as it is.
 */

// ---------------------------------------------------------------- constants and types

/** The method the section names in its own "How this is counted": a constant, not a rule version, and not in the database. */
export const TENDON_AREAS_METHOD = "tendon_areas_v1" as const;
/** The earlier weeks the change line reads. */
export const TENDON_EARLIER_WEEKS = 4;
/** How many of those must be known before a median is read. */
export const TENDON_KNOWN_WEEKS_NEEDED = 3;

export type TendonKind = "target" | "hold" | "other";
/** What a change line can be read on: the counted sets, each kind, and hold seconds. */
export type TendonMetric = "sets" | "target" | "holds" | "other" | "holdSeconds";
export const tendonMetrics: readonly TendonMetric[] = ["sets", "target", "holds", "other", "holdSeconds"];

/** The region's areas and its nodes in no reviewed group, as `regions/<id>/tendonAreas.ts` provides them. */
export type TendonExtras = Pick<RegionExtras, "tendonAreas" | "tendonNotPlaced">;

export interface TendonHolds {
  /** Distinct hold bouts. */
  sets: number;
  /** Seconds recorded (or planned), once per hold bout. */
  seconds: number;
  /** Hold bouts with seconds recorded. */
  withTime: number;
  /** Hold bouts with no time recorded: never read as 0 s or an assumed time. */
  withoutTime: number;
}

/** The set records behind each count, oldest first, then by bout id; each a row `BoutListSheet` opens. */
export interface TendonSetLists {
  target: RegionBoutRow[];
  holds: RegionBoutRow[];
  other: RegionBoutRow[];
  /** Kept apart: strapped sets whose withheld work was all they did in this area or group. */
  strapped: RegionBoutRow[];
  /** Kept apart: sets matched here only by mappings still pending review. */
  pending: RegionBoutRow[];
}

export interface TendonCounts {
  /** Distinct counted sets: target, holds and other together (each set has one kind). */
  sets: number;
  target: number;
  holds: TendonHolds;
  other: number;
  /** Kept apart, never in `sets`. */
  strapped: number;
  /** Kept apart, never in `sets`. */
  pending: number;
  lists: TendonSetLists;
}

export interface TendonGroupCount {
  id: string;
  label: string;
  caveat: string | null;
  /** The reviewed members, in the group's order: the only nodes counted here. */
  members: NodeId[];
  /** Members whose membership of this group is still a draft: "not placed yet" for this group only. */
  notPlacedYet: NodeId[];
  counts: TendonCounts;
}

export interface TendonAreaCount {
  id: string;
  label: string;
  description: string;
  /** The reviewed members of any of its groups, each once, in order. */
  members: NodeId[];
  counts: TendonCounts;
  groups: TendonGroupCount[];
}

export interface TendonRowList {
  sets: number;
  rows: RegionBoutRow[];
}

/** Tendon areas counted over one summary (a window, a week, a plan week or the warm-up pass). */
export interface TendonAreasCount {
  method: typeof TENDON_AREAS_METHOD;
  mappingVersion: string;
  ruleVersion: string;
  mode: SummaryMode;
  interval: SummaryInterval;
  /** In the region's order. */
  areas: TendonAreaCount[];
  /** Distinct counted sets in at least one area: a distinct count, never a sum of the areas. */
  setsInAnyArea: number;
  /** Sets that count for the region as a whole and are in no area (said once, at section level). */
  regionOnly: TendonRowList;
  /** The region's own nodes in no reviewed group, each with why. */
  notPlaced: TendonNotPlaced[];
}

/** A finished workout as the weeks read it: its id and when it was finished (else started). */
export interface FinishedWorkout {
  id: string;
  performedAt: string;
}

/** The fields of a stored workout `finishedWorkoutsOf` reads (a device session has them all). */
export interface FinishedWorkoutSource {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  exercises: readonly { sets: readonly { completed: boolean; skipped?: boolean }[] }[];
}

/** One calendar week, Monday to Sunday in the page's local time. */
export interface TendonWeekWindow {
  /** Local Monday, YYYY-MM-DD. */
  firstDay: string;
  /** Local Sunday, YYYY-MM-DD. */
  lastDay: string;
  /** "12–18 Oct". */
  label: string;
  interval: SummaryInterval;
}

export interface TendonWeek extends TendonWeekWindow {
  finishedWorkouts: number;
  /** Its end is at or before now. */
  ended: boolean;
  /** Ended, with at least one finished workout: only a known week is compared. */
  known: boolean;
}

/** One earlier week as a change line shows it beside the median. */
export interface TendonBaselineWeek {
  firstDay: string;
  lastDay: string;
  label: string;
  finishedWorkouts: number;
  known: boolean;
  /** The week's value; null for a week that is not known (not read, never zero). */
  value: number | null;
}

/**
 * A change line's state, for one area or group and one metric (note 11 §4.2). Every state but the
 * first carries the earlier weeks, oldest first, each with its finished workouts.
 * - `no_workout_last_week`: no finished workout logged last week; nothing to compare, no numbers.
 * - `building_baseline`: fewer than `neededWeeks` of the earlier weeks are known.
 * - `none`: last week and the median are both 0.
 * - `new`: the median is 0 and last week has some.
 * - `change`: last week and the median, and `change` = last − median (absolute, signed).
 * `aboveEveryKnownWeek` is true when last week is above every known earlier week. The median of four
 * known weeks is the mean of the middle two, so it (and the change) can end in .5.
 */
export type TendonChange =
  | { state: "no_workout_last_week" }
  | { state: "building_baseline"; last: number; knownWeeks: number; neededWeeks: number; baseline: TendonBaselineWeek[] }
  | { state: "none"; last: 0; median: 0; knownWeeks: number; baseline: TendonBaselineWeek[] }
  | { state: "new"; last: number; median: 0; knownWeeks: number; aboveEveryKnownWeek: boolean; baseline: TendonBaselineWeek[] }
  | { state: "change"; last: number; median: number; change: number; knownWeeks: number; aboveEveryKnownWeek: boolean; baseline: TendonBaselineWeek[] };

export type TendonChangeSet = Record<TendonMetric, TendonChange>;

/** A day column: a day still to come is its own kind, never a count of 0. */
export type TendonDay = { dayKey: string; toCome: true } | ({ dayKey: string; toCome: false } & TendonCounts);

export interface TendonGroupView extends TendonGroupCount {
  /** Completed mode only. */
  change: TendonChangeSet | null;
}

export interface TendonAreaView extends Omit<TendonAreaCount, "groups"> {
  groups: TendonGroupView[];
  /** Completed mode only. */
  change: TendonChangeSet | null;
  /** Completed mode, a window with dates: each local day of the window. */
  days: TendonDay[] | null;
}

/** The section's numbers for one open: the page's window, and in completed mode the weeks and the warm-up pass. */
export interface TendonExposure extends Omit<TendonAreasCount, "areas"> {
  areas: TendonAreaView[];
  /** Completed mode only: the last complete week and the four before (oldest first). */
  weeks: { last: TendonWeek; earlier: TendonWeek[] } | null;
  /** Completed mode only: the window's marked warm-ups, counted the same way and kept out of every count above. */
  warmups: TendonAreasCount | null;
}

export interface TendonExposureInput {
  region: SpecializationRegionData;
  extras: TendonExtras;
  /** The page's own summary: its side, window (or plan week) and mode. */
  summary: SpecializationSummary;
  /** Completed bouts as the page reads them (excluded records may be included; they are never counted). */
  bouts: readonly ExposureBout[];
  /** `finishedWorkoutsOf(sessions)`. */
  finishedWorkouts: readonly FinishedWorkout[];
  catalogMusclesFor: SummaryRequest["catalogMusclesFor"];
  /** ISO instant: the page's clock. */
  now: string;
  /** The IANA name of the page's local time, as `calendarWeekInterval` takes it. */
  tz: string;
  /** How a summary is computed; `getSpecializationSummary` unless the page passes its cached reader. */
  summarize?: (request: SummaryRequest) => SpecializationSummary;
}

/** One plan entry that loads an area: what "Planned in Week N" lists, one row each. */
export interface TendonPlannedEntry {
  planWeek: number | null;
  dayKey: string | null;
  exerciseEntryId: string;
  catalogExerciseId: number | null;
  exerciseName: string;
  /** Distinct planned sets of this entry counted in the area, and by kind. */
  sets: number;
  target: number;
  holds: number;
  other: number;
}

/** Where a node is a reviewed member: the "Attaches at" line. */
export interface TendonPlace {
  areaId: string;
  areaLabel: string;
  groupId: string;
  groupLabel: string;
}

// ---------------------------------------------------------------- small readers

/** Natural order, so "…/2" sorts before "…/10": `localeCompare(b, "en", { numeric: true })`, with one collator built once. */
const naturalCollator = new Intl.Collator("en", { numeric: true });
const naturalCompare = (a: string, b: string) => naturalCollator.compare(a, b);

function byTimeThenId(a: Pick<RegionBoutRow, "performedAt" | "boutId">, b: Pick<RegionBoutRow, "performedAt" | "boutId">): number {
  if (a.performedAt !== b.performedAt) {
    if (a.performedAt === null) return 1;
    if (b.performedAt === null) return -1;
    const difference = Date.parse(a.performedAt) - Date.parse(b.performedAt);
    if (difference !== 0) return difference;
  }
  return naturalCompare(a.boutId, b.boutId);
}

/** A contribution as a set record: the bout, with no node and no category. */
function rowOf(row: Contribution): RegionBoutRow {
  return {
    boutId: row.boutId,
    side: row.side,
    sideSource: row.sideSource,
    countedSide: row.countedSide,
    recordedSide: row.recordedSide,
    catalogExerciseId: row.catalogExerciseId,
    exerciseName: row.exerciseName,
    matchedBy: row.matchedBy,
    sessionId: row.sessionId,
    sessionLabel: row.sessionLabel,
    performedAt: row.performedAt,
    kind: row.kind,
    segments: row.segments.map((segment) => ({ ...segment })),
  };
}

/** Seconds once per bout from its segments; null when no segment recorded a time. */
function secondsOf(row: Pick<RegionBoutRow, "segments">): number | null {
  const recorded = row.segments.map((segment) => segment.holdSeconds).filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);
  return recorded.length ? recorded.reduce((total, value) => total + value, 0) : null;
}

/** The kind of one bout over the members of one area or group: target, else hold, else other. */
function kindOf(parts: { target: boolean; hold: boolean }): TendonKind {
  return parts.target ? "target" : parts.hold ? "hold" : "other";
}

const membersWith = (group: TendonGroup, status: ReviewStatus): NodeId[] => group.members.filter((member) => member.reviewStatus === status).map((member) => member.nodeId);
const unique = <T>(items: readonly T[]): T[] => Array.from(new Set(items));

/** One record per bout id, the first kept, as the calculator reads a list (a replayed import is read once). */
function firstRecords(bouts: readonly ExposureBout[]): ExposureBout[] {
  const seen = new Set<string>();
  const out: ExposureBout[] = [];
  for (const bout of bouts) {
    if (seen.has(bout.id)) continue;
    seen.add(bout.id);
    out.push(bout);
  }
  return out;
}

const reviewedKeyCache = new WeakMap<SpecializationRegionData, ReadonlySet<string>>();
/**
 * The ledger keys (`mappingKeyIn`) of the reviewed mappings that can credit the region's nodes. A
 * `notCounted` row made of reviewed mappings is withheld strapped work; one made of drafts is
 * pending review (exposure.ts writes no other kind).
 */
function reviewedKeysOf(region: SpecializationRegionData): ReadonlySet<string> {
  let keys = reviewedKeyCache.get(region);
  if (!keys) {
    const found = new Set<string>();
    for (const mappings of Array.from(indexRegion(region).mappingsByVariant.values())) {
      for (const mapping of mappings) if (mapping.reviewStatus === "reviewed") found.add(mappingKeyIn(region, mapping));
    }
    keys = found;
    reviewedKeyCache.set(region, keys);
  }
  return keys;
}

/** Counts and holds from the lists, each list already holding each set once. */
function countsFrom(lists: TendonSetLists): TendonCounts {
  const holds: TendonHolds = { sets: lists.holds.length, seconds: 0, withTime: 0, withoutTime: 0 };
  for (const row of lists.holds) {
    const seconds = secondsOf(row);
    if (seconds === null) holds.withoutTime += 1;
    else {
      holds.withTime += 1;
      holds.seconds += seconds;
    }
  }
  return {
    sets: lists.target.length + lists.holds.length + lists.other.length,
    target: lists.target.length,
    holds,
    other: lists.other.length,
    strapped: lists.strapped.length,
    pending: lists.pending.length,
    lists,
  };
}

/**
 * The counts over a set of members of one summary. Each set sits in one list: counted (by its
 * kind), else strapped, else pending, in the order a node row reads them. A per-side summary's rows
 * kept apart with no side (`countedSide: "unknown"`) are in no list; the page's summary has none.
 */
function scopeCounts(nodes: ReadonlyMap<NodeId, SpecializationSummary["nodes"][number]>, reviewed: ReadonlySet<string>, members: readonly NodeId[]): TendonCounts {
  const counted = new Map<string, { row: RegionBoutRow; target: boolean; hold: boolean }>();
  const strapped = new Map<string, RegionBoutRow>();
  const pending = new Map<string, RegionBoutRow>();
  for (const nodeId of members) {
    const node = nodes.get(nodeId);
    if (!node) continue;
    for (const row of node.contributions) {
      if (row.countedSide === "unknown") continue;
      const entry = counted.get(row.boutId) ?? { row: rowOf(row), target: false, hold: false };
      entry.target ||= row.parts.some((part) => part.category === "direct_dynamic");
      entry.hold ||= row.parts.some((part) => part.category === "deliberate_isometric");
      counted.set(row.boutId, entry);
    }
    for (const row of node.notCounted ?? []) {
      if (row.countedSide === "unknown") continue;
      const into = row.parts.some((part) => reviewed.has(part.mappingId)) ? strapped : pending;
      if (!into.has(row.boutId)) into.set(row.boutId, rowOf(row));
    }
  }
  const lists: TendonSetLists = { target: [], holds: [], other: [], strapped: [], pending: [] };
  for (const entry of Array.from(counted.values())) {
    const kind = kindOf(entry);
    (kind === "target" ? lists.target : kind === "hold" ? lists.holds : lists.other).push(entry.row);
  }
  for (const [boutId, row] of Array.from(strapped)) if (!counted.has(boutId)) lists.strapped.push(row);
  for (const [boutId, row] of Array.from(pending)) if (!counted.has(boutId) && !strapped.has(boutId)) lists.pending.push(row);
  for (const list of Object.values(lists)) list.sort(byTimeThenId);
  return countsFrom(lists);
}

// ---------------------------------------------------------------- one summary

/**
 * Tendon areas over one summary: the page's window, one week, a plan week or the warm-up pass. Pure
 * and cheap: it reads the summary's rows, computes no summary and reads no clock.
 */
export function countTendonAreas(input: { region: SpecializationRegionData; extras: TendonExtras; summary: SpecializationSummary }): TendonAreasCount {
  const { region, extras, summary } = input;
  const nodes = new Map(summary.nodes.map((node) => [node.nodeId, node] as const));
  const reviewed = reviewedKeysOf(region);
  const inAnyArea = new Set<string>();
  const areas = (extras.tendonAreas ?? []).map((area): TendonAreaCount => {
    const groups = area.groups.map((group): TendonGroupCount => {
      const members = membersWith(group, "reviewed");
      return { id: group.id, label: group.label, caveat: group.caveat, members, notPlacedYet: membersWith(group, "draft"), counts: scopeCounts(nodes, reviewed, members) };
    });
    const members = unique(groups.flatMap((group) => group.members));
    const counts = scopeCounts(nodes, reviewed, members);
    for (const row of [...counts.lists.target, ...counts.lists.holds, ...counts.lists.other]) inAnyArea.add(row.boutId);
    return { id: area.id, label: area.label, description: area.description, members, counts, groups };
  });
  const regionOnlyRows = [...(summary.regionUnclassifiedRows ?? [])].sort(byTimeThenId);
  return {
    method: TENDON_AREAS_METHOD,
    mappingVersion: summary.mappingVersion,
    ruleVersion: summary.ruleVersion,
    mode: summary.mode,
    interval: summary.interval,
    areas,
    setsInAnyArea: inAnyArea.size,
    regionOnly: { sets: summary.regionUnclassified.bouts, rows: regionOnlyRows },
    notPlaced: (extras.tendonNotPlaced ?? []).map((entry) => ({ ...entry })),
  };
}

/** Where a node is a reviewed member, area by area, in the region's order: the "Attaches at" line. */
export function tendonPlacesOf(extras: TendonExtras, nodeId: NodeId): TendonPlace[] {
  return (extras.tendonAreas ?? []).flatMap((area) => area.groups
    .filter((group) => group.members.some((member) => member.nodeId === nodeId && member.reviewStatus === "reviewed"))
    .map((group) => ({ areaId: area.id, areaLabel: area.label, groupId: group.id, groupLabel: group.label })));
}

/**
 * The plan entries whose planned sets an area (or group) counts, in the plan's order (the order
 * `boutsFromPlan` writes: day, then entry), each with its counted sets by kind. `counts` is read
 * over a planned summary of the same plan bouts.
 */
export function tendonPlannedEntries(counts: TendonCounts, plannedBouts: readonly ExposureBout[]): TendonPlannedEntry[] {
  const kinds = new Map<string, TendonKind>();
  for (const row of counts.lists.target) kinds.set(row.boutId, "target");
  for (const row of counts.lists.holds) kinds.set(row.boutId, "hold");
  for (const row of counts.lists.other) kinds.set(row.boutId, "other");
  const entries = new Map<string, TendonPlannedEntry>();
  for (const bout of firstRecords(plannedBouts)) {
    const kind = kinds.get(bout.id);
    if (bout.mode !== "planned" || !kind) continue;
    const key = `${bout.planWeek ?? ""}|${bout.dayKey ?? ""}|${bout.exerciseEntryId}`;
    const entry = entries.get(key) ?? { planWeek: bout.planWeek, dayKey: bout.dayKey, exerciseEntryId: bout.exerciseEntryId, catalogExerciseId: bout.catalogExerciseId, exerciseName: bout.exerciseName, sets: 0, target: 0, holds: 0, other: 0 };
    entry.sets += 1;
    if (kind === "target") entry.target += 1;
    else if (kind === "hold") entry.holds += 1;
    else entry.other += 1;
    entries.set(key, entry);
  }
  return Array.from(entries.values());
}

// ---------------------------------------------------------------- days

/**
 * The window's local days, first to last, each with the counts of the sets done that day: the
 * seven columns of a calendar week. A day after today with nothing recorded is `toCome`, never a
 * 0; a day with records is always a day, whatever the clock says. Null for a window with no dates
 * (a plan week).
 */
export function tendonDays(counts: TendonCounts, window: { interval: Pick<SummaryInterval, "startAt" | "endAtExclusive">; now: string; tz: string }): TendonDay[] | null {
  const { startAt, endAtExclusive } = window.interval;
  if (startAt === null || endAtExclusive === null) return null;
  const first = localDateKey(startAt, window.tz);
  const last = localDateKey(new Date(Date.parse(endAtExclusive) - 1).toISOString(), window.tz);
  const today = localDateKey(window.now, window.tz);
  // The sets of one workout share their instant, so each instant's local day is found once.
  const dayKeys = new Map<string, string>();
  const dayKeyOf = (instant: string) => {
    let key = dayKeys.get(instant);
    if (key === undefined) {
      key = localDateKey(instant, window.tz);
      dayKeys.set(instant, key);
    }
    return key;
  };
  const byDay = new Map<string, TendonSetLists>();
  for (const [name, rows] of Object.entries(counts.lists) as [keyof TendonSetLists, RegionBoutRow[]][]) {
    for (const row of rows) {
      if (row.performedAt === null) continue;
      const key = dayKeyOf(row.performedAt);
      const lists = byDay.get(key) ?? { target: [], holds: [], other: [], strapped: [], pending: [] };
      lists[name].push(row);
      byDay.set(key, lists);
    }
  }
  const days: TendonDay[] = [];
  for (let key = first; key <= last; key = addDaysToDateKey(key, 1)) {
    const lists = byDay.get(key);
    if (!lists && key > today) days.push({ dayKey: key, toCome: true });
    else days.push({ dayKey: key, toCome: false, ...countsFrom(lists ?? { target: [], holds: [], other: [], strapped: [], pending: [] }) });
  }
  return days;
}

// ---------------------------------------------------------------- weeks

/**
 * The last complete calendar week and the four before it, oldest first, in the page's local time.
 * Each runs from its Monday's first instant to the next Monday's (`time.ts` finds local midnight,
 * so a week across a clock change is 167 or 169 hours).
 */
export function tendonWeekWindows(now: string, tz: string): TendonWeekWindow[] {
  const today = localDateKey(now, tz);
  const thisMonday = addDaysToDateKey(today, -mondayIndexOfDateKey(today));
  const windows: TendonWeekWindow[] = [];
  for (let weeksAgo = TENDON_EARLIER_WEEKS + 1; weeksAgo >= 1; weeksAgo -= 1) {
    const firstDay = addDaysToDateKey(thisMonday, -7 * weeksAgo);
    const lastDay = addDaysToDateKey(firstDay, 6);
    windows.push({ firstDay, lastDay, label: dateRangeLabel(firstDay, lastDay), interval: { ...customInterval(firstDay, lastDay, tz), kind: "calendar_week" } });
  }
  return windows;
}

/**
 * The finished workouts of a workout log, read as the app reads a completed workout everywhere
 * else: status `completed` with at least one completed set, at the moment it was finished (else
 * started), each id once, in time order.
 */
export function finishedWorkoutsOf(sessions: readonly FinishedWorkoutSource[]): FinishedWorkout[] {
  const seen = new Set<string>();
  const out: FinishedWorkout[] = [];
  for (const session of sessions) {
    if (session.status !== "completed" || seen.has(session.id)) continue;
    if (!session.exercises.some((exercise) => exercise.sets.some((set) => set.completed && !set.skipped))) continue;
    const performedAt = session.completedAt ?? session.startedAt;
    if (typeof performedAt !== "string" || !Number.isFinite(Date.parse(performedAt))) continue;
    seen.add(session.id);
    out.push({ id: session.id, performedAt });
  }
  return out.sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt) || naturalCompare(a.id, b.id));
}

/** A week with its finished workouts, whether it has ended, and whether it is known. */
export function tendonWeekOf(window: TendonWeekWindow, finishedWorkouts: readonly FinishedWorkout[], now: string): TendonWeek {
  const ids = new Set(finishedWorkouts.filter((workout) => intervalContains(window.interval, workout.performedAt)).map((workout) => workout.id));
  const ended = window.interval.endAtExclusive !== null && Date.parse(window.interval.endAtExclusive) <= Date.parse(now);
  return { ...window, finishedWorkouts: ids.size, ended, known: ended && ids.size > 0 };
}

function medianOf(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return (sorted.length & 1) === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * The change line for one metric (note 11 §4.2): last week against the median of the known weeks
 * among the earlier ones, at least `TENDON_KNOWN_WEEKS_NEEDED` known. A week that is not known is
 * not read (its value is null), never counted as zero.
 */
export function tendonChangeOf(last: { week: TendonWeek; value: number }, earlier: readonly { week: TendonWeek; value: number }[]): TendonChange {
  if (!last.week.known) return { state: "no_workout_last_week" };
  const baseline: TendonBaselineWeek[] = earlier.map(({ week, value }) => ({ firstDay: week.firstDay, lastDay: week.lastDay, label: week.label, finishedWorkouts: week.finishedWorkouts, known: week.known, value: week.known ? value : null }));
  const known = baseline.flatMap((week) => (week.value === null ? [] : [week.value]));
  if (known.length < TENDON_KNOWN_WEEKS_NEEDED) return { state: "building_baseline", last: last.value, knownWeeks: known.length, neededWeeks: TENDON_KNOWN_WEEKS_NEEDED, baseline };
  const median = medianOf(known);
  const aboveEveryKnownWeek = known.every((value) => last.value > value);
  if (median === 0 && last.value === 0) return { state: "none", last: 0, median: 0, knownWeeks: known.length, baseline };
  if (median === 0) return { state: "new", last: last.value, median: 0, knownWeeks: known.length, aboveEveryKnownWeek, baseline };
  return { state: "change", last: last.value, median, change: last.value - median, knownWeeks: known.length, aboveEveryKnownWeek, baseline };
}

const valueOf = (counts: TendonCounts, metric: TendonMetric): number => {
  switch (metric) {
    case "sets": return counts.sets;
    case "target": return counts.target;
    case "holds": return counts.holds.sets;
    case "other": return counts.other;
    case "holdSeconds": return counts.holds.seconds;
  }
};

/** One change line per metric, from the same area or group in each week's count (oldest first, last week at the end). */
function changeSetOf(weeks: readonly TendonWeek[], countsByWeek: readonly TendonCounts[]): TendonChangeSet {
  const lastIndex = weeks.length - 1;
  const set = {} as TendonChangeSet;
  for (const metric of tendonMetrics) {
    set[metric] = tendonChangeOf(
      { week: weeks[lastIndex], value: valueOf(countsByWeek[lastIndex], metric) },
      weeks.slice(0, lastIndex).map((week, index) => ({ week, value: valueOf(countsByWeek[index], metric) })),
    );
  }
  return set;
}

// ---------------------------------------------------------------- the warm-up pass

/**
 * The window's sets marked as warm-ups, with the flag cleared so the calculator counts them: the
 * second pass the section shows only as its warm-ups line. Each bout id is read once, the first
 * record kept, as the calculator reads the page's list.
 */
export function warmupPassBouts(bouts: readonly ExposureBout[], interval: Pick<SummaryInterval, "startAt" | "endAtExclusive">): ExposureBout[] {
  return firstRecords(bouts)
    .filter((bout) => bout.mode === "completed" && bout.warmup && !bout.excluded && intervalContains(interval, bout.performedAt))
    .map((bout) => ({ ...bout, warmup: false }));
}

// ---------------------------------------------------------------- the section, on first open

/**
 * Each week's work (completed, not excluded, not a warm-up), in one pass with each instant read
 * once: a week's summary then reads only its own bouts, which gives the same numbers as the whole
 * list (the calculator keeps a bout only inside its window) with no other week's bouts to skip.
 * Start included, end excluded, as `intervalContains` reads a window.
 */
function workByWeek(records: readonly ExposureBout[], weeks: readonly TendonWeekWindow[]): ExposureBout[][] {
  const bounds = weeks.map((week) => [Date.parse(week.interval.startAt!), Date.parse(week.interval.endAtExclusive!)] as const);
  const out = weeks.map((): ExposureBout[] => []);
  for (const bout of records) {
    if (bout.mode !== "completed" || bout.excluded || bout.warmup || !bout.performedAt) continue;
    const instant = Date.parse(bout.performedAt);
    if (!Number.isFinite(instant)) continue;
    const index = bounds.findIndex(([start, end]) => instant >= start && instant < end);
    if (index >= 0) out[index].push(bout);
  }
  return out;
}

function viewOf(window: TendonAreasCount): TendonExposure {
  return {
    ...window,
    areas: window.areas.map((area) => ({ ...area, groups: area.groups.map((group) => ({ ...group, change: null })), change: null, days: null })),
    weeks: null,
    warmups: null,
  };
}

/**
 * The section's numbers for one open. The page's window (or plan week) is counted from the page's
 * own summary. In completed mode six more summaries are made, on the page's side: one per week
 * (the last complete week and the four before, each over that week's work only) and one for the
 * window's warm-ups; then each area and group gets its change line per metric and its day columns.
 * Planned mode makes no summary and has no dates, change line or warm-ups.
 */
export function tendonExposure(input: TendonExposureInput): TendonExposure {
  const { region, extras, summary, now, tz } = input;
  const window = countTendonAreas({ region, extras, summary });
  if (summary.mode !== "completed") return viewOf(window);

  const summarize = input.summarize ?? getSpecializationSummary;
  const rule = publishedExposureRules.find((candidate) => candidate.id === summary.ruleVersion);
  const records = firstRecords(input.bouts);
  const summaryOf = (bouts: readonly ExposureBout[], interval: SummaryInterval) => summarize({
    region,
    bouts,
    interval,
    side: summary.side,
    mode: "completed",
    ...(rule ? { rule } : {}),
    goals: [],
    catalogMusclesFor: input.catalogMusclesFor,
    sourceRevision: summary.sourceRevision,
    planRevision: null,
    now,
  });

  const weeks = tendonWeekWindows(now, tz).map((week) => tendonWeekOf(week, input.finishedWorkouts, now));
  const byWeek = workByWeek(records, weeks).map((bouts, index) => countTendonAreas({ region, extras, summary: summaryOf(bouts, weeks[index].interval) }));
  const warmups = countTendonAreas({ region, extras, summary: summaryOf(warmupPassBouts(records, summary.interval), summary.interval) });

  const view = viewOf(window);
  view.areas = window.areas.map((area, areaIndex) => ({
    ...area,
    groups: area.groups.map((group, groupIndex) => ({ ...group, change: changeSetOf(weeks, byWeek.map((count) => count.areas[areaIndex].groups[groupIndex].counts)) })),
    change: changeSetOf(weeks, byWeek.map((count) => count.areas[areaIndex].counts)),
    days: tendonDays(area.counts, { interval: summary.interval, now, tz }),
  }));
  view.weeks = { last: weeks[weeks.length - 1], earlier: weeks.slice(0, -1) };
  view.warmups = warmups;
  return view;
}
