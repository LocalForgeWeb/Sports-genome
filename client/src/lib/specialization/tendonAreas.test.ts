import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, commitDay, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { currentExposureRule } from "@shared/specialization/rules";
import {
  TENDON_AREAS_METHOD,
  countTendonAreas,
  finishedWorkoutsOf,
  tendonChangeOf,
  tendonDays,
  tendonExposure,
  tendonMetrics,
  tendonPlacesOf,
  tendonPlannedEntries,
  tendonWeekCounts,
  tendonWeekCountsKey,
  tendonWeekOf,
  tendonWeekWindows,
  warmupPassBouts,
  type TendonAreasCount,
  type TendonCounts,
  type TendonDay,
  type TendonExposure,
  type TendonExtras,
} from "@shared/specialization/tendonAreas";
import { addDaysToDateKey, calendarWeekInterval, customInterval, planWeekInterval, rolling7dInterval } from "@shared/specialization/time";
import type { ExposureBout, SpecializationRegionData, SummaryInterval, SummaryRequest, TendonArea, TendonGroup, TendonMember, VariantMapping } from "@shared/specialization/types";
import { boutsFromSessions, excludedRecordsFromSessions } from "./bouts";
import { boutsFromPlan } from "./planBouts";
import { catalogMusclesLookup, planningVariantsFor } from "./useSpecializationSummary";
import { deltoidIds, deltoidRegionData } from "./__fixtures__/deltoidRegion";
import { exercise, finished, workSet, type AtlasSet } from "./__fixtures__/syntheticForearm";

/**
 * Tendon exposure's calculation (11-forearm-research-and-stack.md §4.2, §7.3, §7.4), over the real
 * forearm data and the deltoid fixture, through `boutsFromSessions`, `boutsFromPlan` and
 * `getSpecializationSummary` with side `both`, as the page reads them. The areas are test-local
 * (lane T2 writes the forearm's own): they follow §4.1's table so the cases read like it, with the
 * same draft memberships (ECU in the common extensor origin, the supinator, PQ), but they are test
 * assumptions, not reviewed content.
 */

const TZ = "Europe/London";
/** Thursday 22 Oct 2026: this week is 19–25 Oct, the last complete week 12–18 Oct. */
const NOW = "2026-10-22T12:00:00.000Z";
const MON = "2026-10-19T09:00:00.000Z";
const WED = "2026-10-21T18:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(exercises);
const deps = { catalog: exercises, fallbackUnit: "kg" as const };
const byId = new Map(exercises.map((item) => [item.id, item] as const));

const member = (nodeId: string, reviewStatus: TendonMember["reviewStatus"] = "reviewed"): TendonMember => ({
  nodeId,
  citations: [{ sourceId: "TEST", locator: "test", qualification: null }],
  packageGroups: [],
  reviewStatus,
  reviewNote: "Test-local membership.",
  singleSource: false,
});
const group = (id: string, members: TendonMember[]): TendonGroup => ({ id, label: id, members, caveat: null });
const reviewed = (...ids: string[]) => ids.map((id) => member(id));

const forearmAreas: TendonArea[] = [
  { id: "inner", label: "Inner", description: "", groups: [group("cfo", reviewed(m.pronatorTeres, m.flexorCarpiRadialis, m.palmarisLongus, m.flexorCarpiUlnaris, m.flexorDigitorumSuperficialis))] },
  {
    id: "outer",
    label: "Outer",
    description: "",
    groups: [
      group("ceo", [...reviewed(m.extensorCarpiRadialisBrevis, m.extensorDigitorum, m.extensorDigitiMinimi), member(m.extensorCarpiUlnaris, "draft")]),
      group("ridge", reviewed(m.extensorCarpiRadialisLongus, m.brachioradialis)),
      group("sup", [member(m.supinator, "draft")]),
    ],
  },
  {
    id: "distal",
    label: "Distal",
    description: "",
    groups: [
      group("front", reviewed(m.flexorCarpiRadialis, m.flexorCarpiUlnaris, m.palmarisLongus)),
      group("dorsal", reviewed(m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris)),
      group("radial", reviewed(m.abductorPollicisLongus, m.extensorPollicisBrevis)),
      group("pollex", reviewed(m.flexorPollicisLongus, m.extensorPollicisLongus)),
      group("styloid", reviewed(m.brachioradialis)),
      group("deep", [member(m.pronatorQuadratus, "draft")]),
    ],
  },
  { id: "digits", label: "Digits", description: "", groups: [group("flexors", reviewed(m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus)), group("extensors", reviewed(m.extensorDigitorum, m.extensorDigitiMinimi, m.extensorIndicis))] },
];
const extras: TendonExtras = { tendonAreas: forearmAreas, tendonNotPlaced: [{ nodeId: m.supinator, reason: "Test: its attachments are not reviewed." }] };

const boutsOf = (sessions: readonly DeviceWorkoutSession[]): ExposureBout[] => [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)];

function windowSummary(region: SpecializationRegionData, bouts: readonly ExposureBout[], interval: SummaryInterval = calendarWeekInterval(NOW, TZ), now = NOW) {
  return getSpecializationSummary({ region, bouts, interval, side: "both", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "src", planRevision: null, now });
}

function counted(sessions: readonly DeviceWorkoutSession[], options: { region?: SpecializationRegionData; extras?: TendonExtras } = {}): TendonAreasCount {
  const region = options.region ?? forearmRegionData;
  return countTendonAreas({ region, extras: options.extras ?? extras, summary: windowSummary(region, boutsOf(sessions)) });
}

type ExposureOptions = { now?: string; tz?: string; interval?: SummaryInterval; summarize?: (request: SummaryRequest) => ReturnType<typeof getSpecializationSummary>; bouts?: ExposureBout[]; region?: SpecializationRegionData; extras?: TendonExtras; planned?: { summary: ReturnType<typeof getSpecializationSummary>; bouts: readonly ExposureBout[] } };
function exposureOf(sessions: readonly DeviceWorkoutSession[], options: ExposureOptions = {}): TendonExposure {
  const now = options.now ?? NOW;
  const region = options.region ?? forearmRegionData;
  const bouts = options.bouts ?? boutsOf(sessions);
  // The page's local time is the summary's own (`interval.timezone`).
  const summary = windowSummary(region, bouts, options.interval ?? calendarWeekInterval(now, options.tz ?? TZ), now);
  return tendonExposure({ region, extras: options.extras ?? extras, summary, bouts, finishedWorkouts: finishedWorkoutsOf(sessions), catalogMusclesFor, now, summarize: options.summarize, planned: options.planned });
}
const daysIn = (days: ReturnType<typeof tendonDays>) => days as TendonDay[];

type Areas = Pick<TendonAreasCount, "areas">;
const area = (result: Areas, id: string) => result.areas.find((item) => item.id === id)!;
const groupIn = (result: Areas, areaId: string, groupId: string) => area(result, areaId).groups.find((item) => item.id === groupId)!;
const brief = (counts: TendonCounts) => ({ sets: counts.sets, target: counts.target, holds: counts.holds.sets, other: counts.other, strapped: counts.strapped, pending: counts.pending });
const none = { sets: 0, target: 0, holds: 0, other: 0, strapped: 0, pending: 0 };
const sets = (count: number, over: Partial<AtlasSet> = {}) => Array.from({ length: count }, () => workSet(over));
const nodeOf = (summary: ReturnType<typeof windowSummary>, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;

describe("per area and per group: distinct sets, each once", () => {
  const sessions = [finished("s1", WED, [exercise("e1", "Wrist Curl", 139, sets(3))])];
  const result = counted(sessions);

  it("counts a set once in a group however many of its members it touches", () => {
    // 139 Wrist Curl credits FCR, FCU, PL and FDS of the common flexor origin: 12 rows, 3 sets.
    const summary = windowSummary(forearmRegionData, boutsOf(sessions));
    expect([m.flexorCarpiRadialis, m.flexorCarpiUlnaris, m.palmarisLongus, m.flexorDigitorumSuperficialis].map((id) => nodeOf(summary, id).contributions.length)).toEqual([3, 3, 3, 3]);
    expect(brief(groupIn(result, "inner", "cfo").counts)).toEqual({ ...none, sets: 3, target: 3 });
    expect(brief(area(result, "inner").counts)).toEqual({ ...none, sets: 3, target: 3 });
  });

  it("counts a set touching three members of a group once, and once in its area across groups", () => {
    // 140 Reverse Wrist Curl: ECRL, ECRB and ECU of the back of the wrist, all direct.
    const reverse = counted([finished("s2", WED, [exercise("e1", "Reverse Wrist Curl", 140, sets(2))])]);
    expect(brief(groupIn(reverse, "distal", "dorsal").counts)).toEqual({ ...none, sets: 2, target: 2 });
    // At the outer elbow it touches two groups (ECRB and ED in the common extensor origin, ECRL on the ridge): still 2.
    expect(brief(groupIn(reverse, "outer", "ceo").counts)).toEqual({ ...none, sets: 2, target: 2 });
    expect(brief(groupIn(reverse, "outer", "ridge").counts)).toEqual({ ...none, sets: 2, target: 2 });
    expect(brief(area(reverse, "outer").counts)).toEqual({ ...none, sets: 2, target: 2 });
  });

  it("counts a set in every area it loads, so overlapping areas each count it and are never added", () => {
    expect(brief(area(result, "distal").counts)).toEqual({ ...none, sets: 3, target: 3 });
    expect(brief(area(result, "digits").counts)).toEqual({ ...none, sets: 3, other: 3 });
    expect(brief(area(result, "outer").counts)).toEqual(none);
    // A distinct count across areas, never their sum (3 + 3 + 3).
    expect(result.setsInAnyArea).toBe(3);
  });

  it("keeps each set's record, oldest first, for the sheet", () => {
    const rows = area(result, "inner").counts.lists.target;
    expect(rows.map((row) => [row.exerciseName, row.performedAt, row.sessionId])).toEqual(Array.from({ length: 3 }, () => ["Wrist Curl", WED, "s1"]));
    expect(rows.map((row) => row.boutId)).toEqual(["s1/e1/0", "s1/e1/1", "s1/e1/2"]);
  });

  it("carries the method, the mapping version and the rule version", () => {
    expect(result).toMatchObject({ method: "tendon_areas_v1", mappingVersion: forearmRegionData.mappingVersion.key, ruleVersion: currentExposureRule.id, mode: "completed" });
    expect(TENDON_AREAS_METHOD).toBe("tendon_areas_v1");
  });
});

describe("one kind per set: target, else hold, else other", () => {
  // Test assumptions on the real data: a direct moving FCR mapping on 142 Plate Pinch (a deliberate
  // hold), a contributing moving FDS one on it (so FDS reads the set as mixed: hold and moving), and
  // a contributing moving FDS one on 43 Barbell Bent-Over Row (mixed: incidental and moving).
  const base = (id: string) => forearmRegionData.mappings.find((mapping) => mapping.id === id && mapping.versionKey === forearmRegionData.mappingVersion.key)!;
  const extra: VariantMapping[] = [
    { ...base("cat-139:forearm.fcr"), id: "test-142-fcr-moving", variantId: "cat-142" },
    { ...base("cat-142:forearm.fds"), id: "test-142-fds-moving", relationship: "contributing", muscleMode: "dynamic" },
    { ...base("cat-43:forearm.fds"), id: "test-43-fds-moving", relationship: "contributing", muscleMode: "dynamic", requiresNoStraps: false },
  ];
  const region: SpecializationRegionData = { ...forearmRegionData, mappings: [...forearmRegionData.mappings, ...extra] };
  const sessions = [finished("s1", WED, [exercise("e1", "Plate Pinch", 142, [workSet({ holdSeconds: "30" })]), exercise("e2", "Barbell Bent-Over Row", 43, [workSet()])])];
  const result = counted(sessions, { region });

  it("reads the test assumptions as intended", () => {
    const summary = windowSummary(region, boutsOf(sessions));
    const fds = nodeOf(summary, m.flexorDigitorumSuperficialis).contributions;
    expect(fds.map((row) => [row.boutId, row.category, row.parts.map((part) => part.category).sort()])).toEqual([
      ["s1/e1/0", "mixed", ["contributing_dynamic", "deliberate_isometric"]],
      ["s1/e2/0", "mixed", ["contributing_dynamic", "incidental_isometric"]],
    ]);
    expect(nodeOf(summary, m.flexorCarpiRadialis).contributions.map((row) => row.category)).toEqual(["direct_dynamic"]);
  });

  it("is target when any member in the area or group has a direct moving part, whatever else the set did", () => {
    expect(brief(groupIn(result, "distal", "front").counts)).toEqual({ ...none, sets: 1, target: 1 });
    // The pinch is a hold for FPL, but the area also holds FCR's direct moving work: target.
    expect(brief(area(result, "distal").counts)).toMatchObject({ target: 1, holds: 0 });
    expect(brief(area(result, "inner").counts)).toMatchObject({ target: 1, holds: 0 });
  });

  it("is a hold when a member's parts include a deliberate hold and none is direct moving, a mixed row included", () => {
    expect(brief(groupIn(result, "distal", "pollex").counts)).toEqual({ ...none, sets: 1, holds: 1 });
    expect(area(result, "digits").counts.lists.holds.map((row) => row.exerciseName)).toEqual(["Plate Pinch"]);
  });

  it("is other for contributing, incidental or mixed work with neither", () => {
    expect(area(result, "digits").counts.lists.other.map((row) => row.exerciseName)).toEqual(["Barbell Bent-Over Row"]);
    expect(brief(groupIn(result, "outer", "ridge").counts)).toEqual({ ...none, sets: 1, other: 1 });
    expect(brief(area(result, "digits").counts)).toEqual({ ...none, sets: 2, holds: 1, other: 1 });
  });
});

describe("review sits on each (group, member) pair", () => {
  // 408 Lever Ulnar Deviation: FCU and ECU direct. ECU is a draft member of the common extensor origin only.
  const result = counted([finished("s1", WED, [exercise("e1", "Lever Ulnar Deviation", 408, sets(2))])]);

  it("keeps a draft member out of that group only", () => {
    expect(brief(groupIn(result, "outer", "ceo").counts)).toEqual(none);
    expect(brief(area(result, "outer").counts)).toEqual(none);
    expect(groupIn(result, "outer", "ceo").notPlacedYet).toEqual([m.extensorCarpiUlnaris]);
    expect(groupIn(result, "outer", "ceo").members).not.toContain(m.extensorCarpiUlnaris);
    // Where ECU's membership is reviewed, its work counts.
    expect(brief(groupIn(result, "distal", "dorsal").counts)).toEqual({ ...none, sets: 2, target: 2 });
    expect(brief(area(result, "distal").counts)).toEqual({ ...none, sets: 2, target: 2 });
  });

  it("still counts the group's reviewed members", () => {
    const reverse = counted([finished("s1", WED, [exercise("e1", "Reverse Wrist Curl", 140, sets(1))])]);
    expect(brief(groupIn(reverse, "outer", "ceo").counts)).toEqual({ ...none, sets: 1, target: 1 });
  });

  it("names the region's nodes in no group once, and where a node is a reviewed member", () => {
    expect(result.notPlaced).toEqual([{ nodeId: m.supinator, reason: "Test: its attachments are not reviewed." }]);
    expect(groupIn(result, "outer", "sup")).toMatchObject({ members: [], notPlacedYet: [m.supinator] });
    expect(tendonPlacesOf(extras, m.flexorCarpiRadialis).map((place) => `${place.areaId}/${place.groupId}`)).toEqual(["inner/cfo", "distal/front"]);
    expect(tendonPlacesOf(extras, m.extensorCarpiUlnaris).map((place) => `${place.areaId}/${place.groupId}`)).toEqual(["distal/dorsal"]);
    expect(tendonPlacesOf(extras, m.supinator)).toEqual([]);
  });

  it("ignores a rejected membership entirely", () => {
    const rejected: TendonExtras = { tendonAreas: [{ id: "x", label: "X", description: "", groups: [group("g", [member(m.flexorCarpiUlnaris, "rejected")])] }] };
    const count = counted([finished("s1", WED, [exercise("e1", "Lever Ulnar Deviation", 408, sets(1))])], { extras: rejected });
    expect(count.areas[0].groups[0]).toMatchObject({ members: [], notPlacedYet: [] });
    expect(brief(count.areas[0].counts)).toEqual(none);
  });
});

describe("hold seconds", () => {
  const sessions = [finished("s1", WED, [exercise("e1", "Plate Pinch", 142, [workSet({ holdSeconds: "30" }), workSet({ holdSeconds: "45" }), workSet()])])];
  const result = counted(sessions);

  it("sums seconds once per hold set, never per member", () => {
    // FDS and FDP both hold every set: the calculator gives each muscle 75 s; the group has 75 s, not 150.
    const summary = windowSummary(forearmRegionData, boutsOf(sessions));
    expect([m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus].map((id) => nodeOf(summary, id).deliberateHoldSeconds)).toEqual([75, 75]);
    expect(groupIn(result, "digits", "flexors").counts.holds).toEqual({ sets: 3, seconds: 75, withTime: 2, withoutTime: 1 });
    expect(area(result, "digits").counts.holds).toEqual({ sets: 3, seconds: 75, withTime: 2, withoutTime: 1 });
    expect(area(result, "inner").counts.holds).toEqual({ sets: 3, seconds: 75, withTime: 2, withoutTime: 1 });
  });

  it("counts a hold with no seconds as no time recorded, never as 0 s", () => {
    const untimed = counted([finished("s1", WED, [exercise("e1", "Plate Pinch", 142, [workSet(), workSet({ holdSeconds: "0" })])])]);
    expect(groupIn(untimed, "distal", "pollex").counts.holds).toEqual({ sets: 2, seconds: 0, withTime: 0, withoutTime: 2 });
  });
});

describe("kept apart: strapped, pending review and region-only sets", () => {
  it("lists a strapped set's withheld work only where the set did nothing else counted", () => {
    // 43 Barbell Bent-Over Row, strapped: BR contributing (counted), FDS and FDP grip withheld.
    const result = counted([finished("s1", WED, [exercise("e1", "Barbell Bent-Over Row", 43, sets(2), { straps: "yes" })])]);
    expect(brief(area(result, "digits").counts)).toEqual({ ...none, strapped: 2 });
    expect(brief(area(result, "inner").counts)).toEqual({ ...none, strapped: 2 });
    expect(area(result, "digits").counts.lists.strapped.map((row) => row.boutId)).toEqual(["s1/e1/0", "s1/e1/1"]);
    expect(brief(area(result, "outer").counts)).toEqual({ ...none, sets: 2, other: 2 });

    // An area holding both the withheld and the counted work counts the set and does not list it as strapped.
    const mixedArea: TendonExtras = { tendonAreas: [{ id: "both", label: "Both", description: "", groups: [group("flexors", reviewed(m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus)), group("ridge", reviewed(m.brachioradialis))] }] };
    const both = counted([finished("s1", WED, [exercise("e1", "Barbell Bent-Over Row", 43, sets(2), { straps: "yes" })])], { extras: mixedArea });
    expect(brief(both.areas[0].counts)).toEqual({ ...none, sets: 2, other: 2 });
    expect(brief(both.areas[0].groups[0].counts)).toEqual({ ...none, strapped: 2 });
    expect(brief(both.areas[0].groups[1].counts)).toEqual({ ...none, sets: 2, other: 2 });
  });

  it("counts the same set unstrapped, with nothing kept apart", () => {
    const result = counted([finished("s1", WED, [exercise("e1", "Barbell Bent-Over Row", 43, sets(2), { straps: "no" })])]);
    expect(brief(area(result, "digits").counts)).toEqual({ ...none, sets: 2, other: 2 });
  });

  it("lists rows pending review apart, in one list per set", () => {
    // 299 Farmer's Walk: FDS and FDP holds; ECRL, ECRB and ECU incidental; from forearm_mappings_v2 FPL incidental grip (v1's draft,
    // reviewed) and FCR and FCU incidental too. 317 Cable Upright Row: BR a draft mapping (v2's one draft), FDS and FDP incidental.
    const result = counted([finished("s1", WED, [exercise("e1", "Farmer’s Walk", 299, [workSet({ holdSeconds: "40" })]), exercise("e2", "Cable Upright Row", 317, [workSet()])])]);
    expect(brief(groupIn(result, "distal", "pollex").counts)).toEqual({ ...none, sets: 1, other: 1 });
    expect(groupIn(result, "distal", "pollex").counts.lists.pending).toEqual([]);
    expect(brief(groupIn(result, "distal", "styloid").counts)).toEqual({ ...none, pending: 1 });
    // The walk counted at the back of the wrist, so the area counts it and lists only the upright row as pending.
    expect(brief(area(result, "distal").counts)).toEqual({ ...none, sets: 1, other: 1, pending: 1 });
    expect(area(result, "distal").counts.lists.pending.map((row) => row.exerciseName)).toEqual(["Cable Upright Row"]);
    // At the outer elbow the walk counts too (ECRL and ECRB incidental); the upright row, with only BR's draft there, is pending.
    expect(brief(area(result, "outer").counts)).toEqual({ ...none, sets: 1, other: 1, pending: 1 });
    expect(area(result, "outer").counts.lists.pending.map((row) => row.exerciseName)).toEqual(["Cable Upright Row"]);
    expect(brief(area(result, "digits").counts)).toEqual({ ...none, sets: 2, holds: 1, other: 1 });
  });

  it("says region-only sets once, at section level, in no area", () => {
    const result = counted([finished("s1", WED, [exercise("e1", "Kettlebell Clean", 387, sets(2))])]);
    expect(result.regionOnly.sets).toBe(2);
    expect(result.regionOnly.rows.map((row) => row.exerciseName)).toEqual(["Kettlebell Clean", "Kettlebell Clean"]);
    expect(result.areas.every((item) => item.counts.sets === 0 && item.counts.strapped === 0 && item.counts.pending === 0)).toBe(true);
    expect(result.setsInAnyArea).toBe(0);
  });
});

describe("marked warm-ups: a second pass, kept out of every count above", () => {
  const sessions = [finished("s1", WED, [exercise("e1", "Wrist Curl", 139, [workSet({ warmup: true }), workSet(), workSet()])])];
  const result = exposureOf(sessions);

  it("keeps a warm-up out of the window and counts it in the warm-up pass only", () => {
    expect(brief(area(result, "inner").counts)).toEqual({ ...none, sets: 2, target: 2 });
    expect(result.warmups).not.toBeNull();
    expect(brief(area(result.warmups!, "inner").counts)).toEqual({ ...none, sets: 1, target: 1 });
    expect(area(result.warmups!, "inner").counts.lists.target.map((row) => row.boutId)).toEqual(["s1/e1/0"]);
    expect(result.warmups!.setsInAnyArea).toBe(1);
    expect(result.warmups!.interval).toEqual(result.interval);
  });

  it("clears the flag only on the window's warm-ups, each set once", () => {
    const bouts = boutsOf(sessions);
    const pass = warmupPassBouts([...bouts, ...bouts], calendarWeekInterval(NOW, TZ));
    expect(pass.map((bout) => [bout.id, bout.warmup])).toEqual([["s1/e1/0", false]]);
    expect(warmupPassBouts(bouts, calendarWeekInterval("2026-11-05T12:00:00.000Z", TZ))).toEqual([]);
  });

  it("keeps warm-ups out of the change line", () => {
    const history = weeks([2, 2, 2, 2, 2]).concat(finished("wu", at("2026-10-14"), [exercise("e", "Wrist Curl", 139, sets(5, { warmup: true }))]));
    const change = area(exposureOf(history), "inner").change!;
    expect(change.sets).toMatchObject({ state: "change", last: 2, median: 2, change: 0 });
  });
});

// ---------------------------------------------------------------- weeks and the change line

/** The Mondays of the four weeks before the last complete one and of that week, oldest first, for NOW. */
const MONDAYS = ["2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"];
const at = (dayKey: string, time = "12:00:00") => `${dayKey}T${time}.000Z`;
/** A week's history: a number of wrist-curl sets in one finished workout, a finished workout with no area work ("legs"), or no workout (null). */
type WeekEntry = number | "legs" | null;
function weeks(entries: readonly WeekEntry[]): DeviceWorkoutSession[] {
  return entries.flatMap((entry, index) => {
    const when = at(addDaysToDateKey(MONDAYS[index], 2));
    if (entry === null) return [];
    if (entry === "legs") return [finished(`w${index}`, when, [exercise(`w${index}e`, "Back Squat", 161, sets(3))])];
    return [finished(`w${index}`, when, [exercise(`w${index}e`, "Wrist Curl", 139, sets(entry))])];
  });
}
const innerSets = (entries: readonly WeekEntry[]) => area(exposureOf(weeks(entries)), "inner").change!.sets;

describe("weeks: the last complete week and the four before", () => {
  it("are calendar weeks in local time, oldest first, each with its finished workouts", () => {
    const sessions = [...weeks([1, null, "legs", 2, 3]), finished("extra", at("2026-10-16"), [exercise("x", "Back Squat", 161, sets(1))])];
    const result = exposureOf(sessions);
    expect(result.weeks!.earlier.map((week) => [week.firstDay, week.lastDay, week.label, week.finishedWorkouts, week.known])).toEqual([
      ["2026-09-14", "2026-09-20", "14–20 Sep", 1, true],
      ["2026-09-21", "2026-09-27", "21–27 Sep", 0, false],
      ["2026-09-28", "2026-10-04", "28 Sep – 4 Oct", 1, true],
      ["2026-10-05", "2026-10-11", "5–11 Oct", 1, true],
    ]);
    expect(result.weeks!.last).toMatchObject({ firstDay: "2026-10-12", lastDay: "2026-10-18", label: "12–18 Oct", finishedWorkouts: 2, ended: true, known: true });
    expect(result.weeks!.last.interval).toMatchObject({ kind: "calendar_week", startAt: "2026-10-11T23:00:00.000Z", endAtExclusive: "2026-10-18T23:00:00.000Z" });
  });

  it("reads a finished workout as the app does: finished, with a completed set, once", () => {
    const empty = finished("empty", at("2026-10-14"), [exercise("e", "Wrist Curl", 139, [{ ...workSet(), completed: false, skipped: true }])]);
    const running = { ...finished("running", at("2026-10-14"), [exercise("e", "Wrist Curl", 139, sets(1))]), status: "active" as const };
    const done = finished("done", at("2026-10-14"), [exercise("e", "Wrist Curl", 139, sets(1))]);
    expect(finishedWorkoutsOf([empty, running, done, done])).toEqual([{ id: "done", performedAt: at("2026-10-14") }]);
  });

  it("are made with six summaries on first open in completed mode, on the page's side, and none in planned mode", () => {
    const calls: SummaryRequest[] = [];
    const summarize = (request: SummaryRequest) => { calls.push(request); return getSpecializationSummary(request); };
    exposureOf(weeks([1, 1, 1, 1, 1]), { summarize });
    expect(calls).toHaveLength(6);
    expect(calls.every((request) => request.side === "both" && request.mode === "completed" && request.goals.length === 0)).toBe(true);
    // Each week's summary reads only that week's work.
    expect(calls.slice(0, 5).map((request) => request.bouts.length)).toEqual([1, 1, 1, 1, 1]);
    expect(calls[5].interval).toEqual(calendarWeekInterval(NOW, TZ));

    const plannedCalls: SummaryRequest[] = [];
    tendonExposure({ region: forearmRegionData, extras, summary: plannedSummary([[{ id: 139, prescription: "3 × 10–25" }]]).summary, bouts: [], finishedWorkouts: [], catalogMusclesFor, now: NOW, summarize: (request) => { plannedCalls.push(request); return getSpecializationSummary(request); } });
    expect(plannedCalls).toHaveLength(0);
  });
});

describe("the change line, every state", () => {
  it("says nothing to compare when last week has no finished workout, with no numbers", () => {
    const change = area(exposureOf(weeks([3, 4, 5, 6, null])), "inner").change!;
    for (const metric of tendonMetrics) expect(change[metric]).toEqual({ state: "no_workout_last_week" });
  });

  it("is building the baseline with fewer than three known earlier weeks", () => {
    expect(innerSets([null, 4, null, 5, 6])).toMatchObject({ state: "building_baseline", last: 6, knownWeeks: 2, neededWeeks: 3 });
  });

  it("leaves a week with no finished workout out of the median, never as zero", () => {
    const change = innerSets([5, null, 3, 4, 6]);
    // The median of 5, 3 and 4, not of 5, 0, 3 and 4.
    expect(change).toMatchObject({ state: "change", last: 6, median: 4, change: 2, knownWeeks: 3, aboveEveryKnownWeek: true });
    expect(change.state === "change" && change.baseline.map((week) => [week.label, week.finishedWorkouts, week.known, week.value])).toEqual([
      ["14–20 Sep", 1, true, 5],
      ["21–27 Sep", 0, false, null],
      ["28 Sep – 4 Oct", 1, true, 3],
      ["5–11 Oct", 1, true, 4],
    ]);
  });

  it("counts a partly logged week as known, so it can lower the median", () => {
    // Week 3 holds a finished workout with no area work: known, at 0.
    const change = innerSets([6, 6, "legs", 2, 3]);
    expect(change).toMatchObject({ state: "change", last: 3, median: 4, change: -1, knownWeeks: 4, aboveEveryKnownWeek: false });
    expect(change.state === "change" && change.baseline[2]).toMatchObject({ known: true, value: 0, finishedWorkouts: 1 });
  });

  it("is New only when every known earlier week is 0 and last week has sets", () => {
    expect(innerSets(["legs", "legs", null, "legs", 3])).toMatchObject({ state: "new", last: 3, median: 0, knownWeeks: 3, aboveEveryKnownWeek: true });
  });

  it("is none only when last week and every known earlier week are 0", () => {
    expect(innerSets(["legs", "legs", "legs", "legs", "legs"])).toMatchObject({ state: "none", last: 0, median: 0, knownWeeks: 4 });
  });

  it("reads a median of 0 beside a known week above 0 as a change, never New or none", () => {
    // Earlier weeks 0, 0 and 5 (one not known): something was done, so the median of 0 is compared.
    const three = innerSets(["legs", "legs", 5, null, 3]);
    expect(three).toMatchObject({ state: "change", last: 3, median: 0, change: 3, aboveEveryKnownWeek: false });
    expect(three.state === "change" && three.baseline.map((week) => week.value)).toEqual([0, 0, 5, null]);
    expect(innerSets(["legs", "legs", 5, null, "legs"])).toMatchObject({ state: "change", last: 0, median: 0, change: 0, aboveEveryKnownWeek: false });
    // Four known, 0, 6, 5, 0: the middle two give 2.5, kept exact.
    expect(innerSets(["legs", 6, 5, "legs", 3])).toMatchObject({ state: "change", last: 3, median: 2.5, change: 0.5 });
  });

  it("is building the baseline before reading any median, a median of 0 included", () => {
    expect(innerSets(["legs", null, null, null, 3])).toMatchObject({ state: "building_baseline", last: 3, knownWeeks: 1, neededWeeks: 3 });
  });

  it("gives both numbers and the absolute change, and whether last week is above every known week", () => {
    expect(innerSets([4, null, 6, 8, 9])).toMatchObject({ state: "change", last: 9, median: 6, change: 3, aboveEveryKnownWeek: true });
    expect(innerSets([4, null, 6, 8, 8])).toMatchObject({ state: "change", last: 8, median: 6, change: 2, aboveEveryKnownWeek: false });
    // An even number of known weeks reads the middle two.
    expect(innerSets([4, 5, 7, 8, 6])).toMatchObject({ state: "change", median: 6, change: 0 });
  });

  it("is read per metric and per group: each kind and hold seconds", () => {
    const pinch = (id: string, when: string, seconds: string[]) => exercise(id, "Plate Pinch", 142, seconds.map((value) => workSet({ holdSeconds: value })));
    const history = MONDAYS.map((monday, index) => {
      const last = index === MONDAYS.length - 1;
      const when = at(addDaysToDateKey(monday, 2));
      return finished(`w${index}`, when, [exercise(`c${index}`, "Wrist Curl", 139, sets(last ? 3 : 2)), pinch(`p${index}`, when, last ? ["30", "40"] : ["30"])]);
    });
    const flexors = groupIn(exposureOf(history), "digits", "flexors").change!;
    expect(flexors.sets).toMatchObject({ state: "change", last: 5, median: 3, change: 2 });
    expect(flexors.other).toMatchObject({ state: "change", last: 3, median: 2, change: 1 });
    expect(flexors.holds).toMatchObject({ state: "change", last: 2, median: 1, change: 1 });
    expect(flexors.holdSeconds).toMatchObject({ state: "change", last: 70, median: 30, change: 40, aboveEveryKnownWeek: true });
    expect(flexors.target).toMatchObject({ state: "none", last: 0, median: 0 });
  });

  it("is a pure function of the weeks and their values", () => {
    const windows = tendonWeekWindows(NOW, TZ);
    const known = windows.map((window) => tendonWeekOf(window, [{ id: "a", performedAt: window.interval.startAt! }], NOW));
    const change = tendonChangeOf("sets", { week: known[4], value: 25, holdsWithoutTime: 0 }, [16, 15, 17, 30].map((value, index) => ({ week: known[index], value, holdsWithoutTime: 0 })));
    expect(change).toMatchObject({ state: "change", last: 25, median: 16.5, change: 8.5, aboveEveryKnownWeek: false });
    // A week that has not ended is never known, whatever it holds.
    const thisWeek = tendonWeekOf({ ...windows[4], interval: calendarWeekInterval(NOW, TZ) }, [{ id: "a", performedAt: NOW }], NOW);
    expect(thisWeek).toMatchObject({ ended: false, known: false, finishedWorkouts: 1 });
  });
});

describe("weeks across a clock change", () => {
  it("counts the autumn week as 169 hours, its first and last hour included", () => {
    // London leaves summer time on Sunday 25 Oct 2026. From Wednesday 28 Oct the last complete week is 19–25 Oct.
    const now = "2026-10-28T12:00:00.000Z";
    const windows = tendonWeekWindows(now, TZ);
    const hours = (interval: SummaryInterval) => (Date.parse(interval.endAtExclusive!) - Date.parse(interval.startAt!)) / 3_600_000;
    expect(windows.map((window) => [window.label, hours(window.interval)])).toEqual([["21–27 Sep", 168], ["28 Sep – 4 Oct", 168], ["5–11 Oct", 168], ["12–18 Oct", 168], ["19–25 Oct", 169]]);
    const one = (id: string, when: string) => finished(id, when, [exercise(`${id}e`, "Wrist Curl", 139, sets(1))]);
    const sessions = [
      one("sunEarlier", "2026-10-18T22:30:00.000Z"), // Sun 18 Oct 23:30 BST: the week before
      one("monFirst", "2026-10-18T23:30:00.000Z"), // Mon 19 Oct 00:30 BST
      one("sunLast", "2026-10-25T23:30:00.000Z"), // Sun 25 Oct 23:30 GMT
      one("monNext", "2026-10-26T00:30:00.000Z"), // Mon 26 Oct 00:30 GMT: this week
    ];
    const result = exposureOf(sessions, { now });
    expect(result.weeks!.last).toMatchObject({ label: "19–25 Oct", finishedWorkouts: 2 });
    expect(result.weeks!.earlier[3]).toMatchObject({ label: "12–18 Oct", finishedWorkouts: 1 });
    expect(area(result, "inner").change!.sets).toMatchObject({ state: "building_baseline", last: 2, knownWeeks: 1 });

    // That week's seven day columns, the late Sunday set on Sunday.
    const lastWeek = windowSummary(forearmRegionData, boutsOf(sessions), windows[4].interval, now);
    const days = daysIn(tendonDays(countTendonAreas({ region: forearmRegionData, extras, summary: lastWeek }).areas[0].counts, { interval: windows[4].interval, now }));
    expect(days.map((day) => [day.dayKey, day.toCome ? "to come" : day.sets])).toEqual([["2026-10-19", 1], ["2026-10-20", 0], ["2026-10-21", 0], ["2026-10-22", 0], ["2026-10-23", 0], ["2026-10-24", 0], ["2026-10-25", 1]]);
  });

  it("counts the spring week as 167 hours", () => {
    // New York enters daylight time on Sunday 8 Mar 2026; from Wednesday 11 Mar the last complete week is 2–8 Mar.
    const now = "2026-03-11T17:00:00.000Z";
    const tz = "America/New_York";
    const last = tendonWeekWindows(now, tz)[4];
    expect(last.label).toBe("2–8 Mar");
    expect((Date.parse(last.interval.endAtExclusive!) - Date.parse(last.interval.startAt!)) / 3_600_000).toBe(167);
    const one = (id: string, when: string) => finished(id, when, [exercise(`${id}e`, "Wrist Curl", 139, sets(1))]);
    const result = exposureOf([one("sunLate", "2026-03-09T03:30:00.000Z"), one("monEarly", "2026-03-09T04:30:00.000Z")], { now, tz });
    // 23:30 EDT on Sunday 8 Mar is last week; 00:30 EDT on Monday 9 Mar is this week.
    expect(result.weeks!.last.finishedWorkouts).toBe(1);
  });
});

describe("day columns", () => {
  const sessions = [
    finished("mon", MON, [exercise("e1", "Wrist Curl", 139, sets(2))]),
    finished("wed", WED, [exercise("e2", "Plate Pinch", 142, [workSet({ holdSeconds: "30" })]), exercise("e3", "Barbell Bent-Over Row", 43, sets(1), { straps: "yes" })]),
  ];
  const result = exposureOf(sessions);

  it("has every day of the week, today included, and the days still to come apart from 0", () => {
    const days = daysIn(area(result, "inner").days);
    expect(days.map((day) => (day.toCome ? [day.dayKey, "to come"] : [day.dayKey, day.target, day.holds.sets, day.other, day.strapped, day.partial]))).toEqual([
      ["2026-10-19", 2, 0, 0, 0, false],
      ["2026-10-20", 0, 0, 0, 0, false],
      ["2026-10-21", 0, 1, 0, 1, false],
      ["2026-10-22", 0, 0, 0, 0, false],
      ["2026-10-23", "to come"],
      ["2026-10-24", "to come"],
      ["2026-10-25", "to come"],
    ]);
  });

  it("gives a rolling window its eight days, the first partial, counting only the sets inside it", () => {
    // Rolling 7 days from Thu 22 Oct 13:00 BST: from Thu 15 Oct 13:00 BST. On the 15th one set at 09:00 (outside) and one at 15:00 (inside).
    const rolling = exposureOf([
      finished("a", "2026-10-15T08:00:00.000Z", [exercise("e", "Wrist Curl", 139, sets(1))]),
      finished("b", "2026-10-15T14:00:00.000Z", [exercise("e", "Wrist Curl", 139, sets(1))]),
    ], { interval: rolling7dInterval(NOW, TZ) });
    const days = daysIn(area(rolling, "inner").days);
    expect(days.map((day) => (day.toCome ? [day.dayKey, "to come"] : [day.dayKey, day.sets, day.partial]))).toEqual([
      ["2026-10-15", 1, true],
      ["2026-10-16", 0, false],
      ["2026-10-17", 0, false],
      ["2026-10-18", 0, false],
      ["2026-10-19", 0, false],
      ["2026-10-20", 0, false],
      ["2026-10-21", 0, false],
      ["2026-10-22", 0, false],
    ]);
  });

  it("gives a custom window each of its days, and says too long past 31", () => {
    const custom = exposureOf([finished("a", "2026-10-02T12:00:00.000Z", [exercise("e", "Wrist Curl", 139, sets(2))])], { interval: customInterval("2026-10-01", "2026-10-31", TZ) });
    const days = daysIn(area(custom, "inner").days);
    expect(days).toHaveLength(31);
    expect(days[0]).toMatchObject({ dayKey: "2026-10-01", toCome: false, sets: 0, partial: false });
    expect(days[1]).toMatchObject({ dayKey: "2026-10-02", toCome: false, sets: 2, target: 2 });
    expect(days.slice(22).every((day) => day.toCome)).toBe(true);
    expect(area(exposureOf([], { interval: customInterval("2026-09-30", "2026-10-31", TZ) }), "inner").days).toBe("too_long");
  });

  it("keeps each day's sets in the sheet's lists", () => {
    const wednesday = daysIn(area(result, "inner").days).find((day) => day.dayKey === "2026-10-21")!;
    expect(wednesday.toCome).toBe(false);
    if (wednesday.toCome) return;
    expect(wednesday.lists.holds.map((row) => row.exerciseName)).toEqual(["Plate Pinch"]);
    expect(wednesday.lists.strapped.map((row) => row.exerciseName)).toEqual(["Barbell Bent-Over Row"]);
    expect(wednesday.holds).toEqual({ sets: 1, seconds: 30, withTime: 1, withoutTime: 0 });
  });

  it("has none for a window with no dates", () => {
    expect(tendonDays(area(result, "inner").counts, { interval: planWeekInterval(1), now: NOW })).toBeNull();
  });
});

// ---------------------------------------------------------------- planned mode

function plannedSummary(days: { id: number; prescription?: string }[][]) {
  const slots = buildDaySlots(days.map((_, index) => (["Push", "Pull", "Legs", "Upper", "Lower"] as const)[index]));
  let store: WeeklyDayStore = emptyDayStore();
  slots.forEach((slot, index) => {
    const workout = days[index].map((item) => byId.get(item.id)!);
    const prescriptions = Object.fromEntries(days[index].filter((item) => item.prescription).map((item) => [item.id, item.prescription!]));
    store = commitDay(store, slot.key, { workout, prescriptions, settings: {}, context: [] });
  });
  const bouts = boutsFromPlan({ week: 2, slots, store, variants: planningVariantsFor(forearmRegionData), goal: "Muscle growth" });
  const summary = getSpecializationSummary({ region: forearmRegionData, bouts, interval: planWeekInterval(2, TZ), side: "both", mode: "planned", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: "plan", now: NOW });
  return { bouts, summary, slots };
}

describe("planned mode: plan-week totals per area only", () => {
  const { bouts, summary, slots } = plannedSummary([[{ id: 139, prescription: "3 × 10–25" }, { id: 140, prescription: "2 × 10–25" }], [{ id: 142, prescription: "3 × 30 sec" }]]);
  const result = tendonExposure({ region: forearmRegionData, extras, summary, bouts: [], finishedWorkouts: [], catalogMusclesFor, now: NOW });

  it("counts the plan week per area and group, with no dates, change line or warm-ups", () => {
    expect(result).toMatchObject({ mode: "planned", weeks: null, warmups: null, interval: { kind: "plan_week", planWeek: 2 } });
    expect(result.areas.every((item) => item.change === null && item.days === null && item.groups.every((entry) => entry.change === null))).toBe(true);
    expect(result.areas.map((item) => [item.id, brief(item.counts)])).toEqual([
      ["inner", { ...none, sets: 8, target: 3, holds: 3, other: 2 }],
      ["outer", { ...none, sets: 2, target: 2 }],
      ["distal", { ...none, sets: 8, target: 5, holds: 3 }],
      ["digits", { ...none, sets: 8, holds: 3, other: 5 }],
    ]);
    expect(area(result, "distal").counts.holds).toEqual({ sets: 3, seconds: 90, withTime: 3, withoutTime: 0 });
  });

  it("lists the plan entries that load an area, in the plan's order, by kind", () => {
    const inner = countTendonAreas({ region: forearmRegionData, extras, summary }).areas[0];
    expect(tendonPlannedEntries(inner.counts, bouts).map((entry) => [entry.dayKey, entry.exerciseName, entry.sets, entry.target, entry.holds, entry.other])).toEqual([
      [slots[0].key, "Wrist Curl", 3, 3, 0, 0],
      [slots[0].key, "Reverse Wrist Curl", 2, 0, 0, 2],
      [slots[1].key, "Plate Pinch", 3, 0, 3, 0],
    ]);
    const outer = countTendonAreas({ region: forearmRegionData, extras, summary }).areas[1];
    expect(tendonPlannedEntries(outer.counts, bouts).map((entry) => [entry.exerciseName, entry.planWeek, entry.sets])).toEqual([["Reverse Wrist Curl", 2, 2]]);
  });
});

// ---------------------------------------------------------------- determinism and region-agnosticism

describe("determinism", () => {
  const sessions = [
    ...weeks([2, null, 3, "legs", 4]),
    finished("mon", MON, [exercise("e1", "Wrist Curl", 139, [workSet({ warmup: true }), workSet()]), exercise("e2", "Farmer’s Walk", 299, [workSet({ holdSeconds: "40" })])]),
    finished("wed", WED, [exercise("e3", "Barbell Bent-Over Row", 43, sets(2), { straps: "yes" }), exercise("e4", "Kettlebell Clean", 387, sets(1))]),
  ];

  it("gives the same result for the same inputs, whatever order the bouts arrive in", () => {
    const first = exposureOf(sessions);
    expect(exposureOf(sessions)).toEqual(first);
    expect(exposureOf(sessions, { bouts: [...boutsOf(sessions)].reverse() })).toEqual(first);
    expect(JSON.stringify(exposureOf(sessions))).toBe(JSON.stringify(first));
  });
});

describe("the deltoid fixture, with test-local areas and no deltoid code", () => {
  const d = deltoidIds;
  const deltoidExtras: TendonExtras = {
    tendonAreas: [
      { id: "upper", label: "Upper", description: "", groups: [group("front", reviewed(d.anterior, d.lateral)), group("point", reviewed(d.lateral))] },
      { id: "rear", label: "Rear", description: "", groups: [group("rear", reviewed(d.posterior)), group("helper", reviewed(d.triceps))] },
    ],
  };
  const result = counted([finished("s1", WED, [
    exercise("e1", "Dumbbell Lateral Raise", 111, sets(2)),
    exercise("e2", "Barbell Overhead Press", 101, sets(1)),
    exercise("e3", "Bent-Over Rear-Delt Fly", 90, sets(2)),
    exercise("e4", "Cable Upright Row", 317, sets(1)),
  ])], { region: deltoidRegionData, extras: deltoidExtras });

  it("counts each set once per group and area, with its kind", () => {
    // The raise credits both heads of the front group: 2 sets, not 4.
    expect(brief(groupIn(result, "upper", "front").counts)).toEqual({ ...none, sets: 3, target: 3 });
    expect(brief(area(result, "upper").counts)).toEqual({ ...none, sets: 3, target: 3 });
    expect(brief(groupIn(result, "rear", "rear").counts)).toEqual({ ...none, sets: 2, target: 2 });
    expect(brief(groupIn(result, "rear", "helper").counts)).toEqual({ ...none, sets: 1, other: 1 });
    expect(result.setsInAnyArea).toBe(5);
  });

  it("keeps a pending row apart only where the set counted nothing", () => {
    // The press's lateral-head mapping is a draft: pending where the group has only that head.
    expect(brief(groupIn(result, "upper", "point").counts)).toEqual({ ...none, sets: 2, target: 2, pending: 1 });
    expect(groupIn(result, "upper", "point").counts.lists.pending.map((row) => row.exerciseName)).toEqual(["Barbell Overhead Press"]);
  });

  it("says its region-only set at section level", () => {
    expect(result.regionOnly).toMatchObject({ sets: 1, rows: [{ exerciseName: "Cable Upright Row" }] });
    expect(result.mappingVersion).toBe(deltoidRegionData.mappingVersion.key);
  });
});

describe("review fixes (adversarial review of 03ca352)", () => {
  const pinchWeeks = (earlier: AtlasSet[], last: AtlasSet[]) => MONDAYS.map((monday, index) => finished(`w${index}`, at(addDaysToDateKey(monday, 2)), [exercise(`p${index}`, "Plate Pinch", 142, index === MONDAYS.length - 1 ? last : earlier)]));

  it("never compares hold seconds across an untimed hold: earlier weeks untimed, last week timed", () => {
    // Each earlier week: 2 holds with no time recorded. Last week: one hold of 30 s. The holds fell; the seconds must not read as New.
    const digits = area(exposureOf(pinchWeeks([workSet(), workSet()], [workSet({ holdSeconds: "30" })])), "digits").change!;
    expect(digits.holds).toMatchObject({ state: "change", last: 1, median: 2, change: -1 });
    expect(digits.holdSeconds).toMatchObject({ state: "some_untimed", last: 30, lastHoldsWithoutTime: 0, knownWeeks: 4 });
    expect(digits.holdSeconds.state === "some_untimed" && digits.holdSeconds.baseline.map((week) => [week.value, week.holdsWithoutTime])).toEqual([[0, 2], [0, 2], [0, 2], [0, 2]]);
  });

  it("never compares hold seconds across an untimed hold: earlier weeks timed, last week untimed", () => {
    const digits = area(exposureOf(pinchWeeks([workSet({ holdSeconds: "30" })], [workSet()])), "digits").change!;
    expect(digits.holdSeconds).toMatchObject({ state: "some_untimed", last: 0, lastHoldsWithoutTime: 1 });
    expect(digits.holds).toMatchObject({ state: "change", last: 1, median: 1, change: 0 });
    // Timed in every week, the seconds are compared as usual.
    expect(area(exposureOf(pinchWeeks([workSet({ holdSeconds: "30" })], [workSet({ holdSeconds: "45" })])), "digits").change!.holdSeconds).toMatchObject({ state: "change", last: 45, median: 30, change: 15, lastHoldsWithoutTime: 0 });
  });

  it("keeps last week's counts and sets on every area and group, so its sets open without another summary", () => {
    const result = exposureOf(weeks([2, 2, 2, 2, 3]));
    const inner = area(result, "inner");
    expect(brief(inner.lastWeek!)).toEqual({ ...none, sets: 3, target: 3 });
    expect(inner.lastWeek!.lists.target.map((row) => row.boutId)).toEqual(["w4/w4e/0", "w4/w4e/1", "w4/w4e/2"]);
    expect(brief(groupIn(result, "inner", "cfo").lastWeek!)).toEqual({ ...none, sets: 3, target: 3 });
    expect(brief(area(result, "digits").lastWeek!)).toEqual({ ...none, sets: 3, other: 3 });
  });

  it("gives a group or area with no reviewed member no change line", () => {
    const result = exposureOf(weeks([2, 2, 2, 2, 3]));
    expect(groupIn(result, "outer", "sup").change).toBeNull();
    expect(groupIn(result, "distal", "deep").change).toBeNull();
    expect(groupIn(result, "outer", "ceo").change).not.toBeNull();
    const empty: TendonExtras = { tendonAreas: [{ id: "x", label: "X", description: "", groups: [group("g", [member(m.supinator, "draft")])] }] };
    const lonely = exposureOf(weeks([2, 2, 2, 2, 3]), { extras: empty });
    expect(lonely.areas[0].change).toBeNull();
    expect(lonely.areas[0].groups[0].change).toBeNull();
  });

  it("lists the trained plan week's entries in any window, from the plan week the page passes", () => {
    const plan = plannedSummary([[{ id: 139, prescription: "3 × 10–25" }], [{ id: 142, prescription: "2 × 30 sec" }]]);
    const rolling = exposureOf([], { interval: rolling7dInterval(NOW, TZ), planned: { summary: plan.summary, bouts: plan.bouts } });
    expect(rolling.plannedWeek).toBe(2);
    expect(area(rolling, "inner").planned!.entries.map((entry) => [entry.exerciseName, entry.sets, entry.target, entry.holds])).toEqual([["Wrist Curl", 3, 3, 0], ["Plate Pinch", 2, 0, 2]]);
    expect(brief(area(rolling, "outer").planned!.counts)).toEqual(none);
    expect(exposureOf([]).plannedWeek).toBeNull();
    expect(area(exposureOf([]), "inner").planned).toBeNull();
    const completed = windowSummary(forearmRegionData, []);
    expect(() => tendonExposure({ region: forearmRegionData, extras, summary: completed, bouts: [], finishedWorkouts: [], catalogMusclesFor, now: NOW, planned: { summary: completed, bouts: [] } })).toThrow(/planned summary/);
  });

  it("reuses week counts made for the same key, so only the warm-up pass is summarized again", () => {
    const sessions = weeks([2, 2, 2, 2, 3]);
    const bouts = boutsOf(sessions);
    const summary = windowSummary(forearmRegionData, bouts);
    const base = { region: forearmRegionData, extras, summary, bouts, finishedWorkouts: finishedWorkoutsOf(sessions), catalogMusclesFor, now: NOW };
    const weekCounts = tendonWeekCounts(base);
    const calls: SummaryRequest[] = [];
    const summarize = (request: SummaryRequest) => { calls.push(request); return getSpecializationSummary(request); };
    const reused = tendonExposure({ ...base, weekCounts, summarize });
    expect(calls).toHaveLength(1);
    expect(reused).toEqual(tendonExposure(base));
    // Counts made for other areas are not reused.
    calls.length = 0;
    const other: TendonExtras = { tendonAreas: forearmAreas.slice(1) };
    tendonExposure({ ...base, extras, weekCounts: tendonWeekCounts({ ...base, extras: other }), summarize });
    expect(calls).toHaveLength(6);
  });

  it("keys week counts on what they read, not on the minute", () => {
    const summary = windowSummary(forearmRegionData, []);
    const key = tendonWeekCountsKey(summary, NOW);
    // London leaves summer time on Sunday 25 Oct, so this week ends at 2026-10-26T00:00:00.000Z.
    expect(tendonWeekCountsKey(summary, "2026-10-25T23:59:59.999Z")).toBe(key);
    expect(tendonWeekCountsKey(summary, "2026-10-26T00:00:00.000Z")).not.toBe(key);
    expect(tendonWeekCountsKey({ ...summary, sourceRevision: "other" }, NOW)).not.toBe(key);
    expect(tendonWeekCountsKey({ ...summary, interval: calendarWeekInterval(NOW, "America/New_York") }, NOW)).not.toBe(key);
  });

  it("puts a set and a workout at exactly Monday 00:00:00.000 local in the week that Monday starts", () => {
    // Monday 12 Oct 2026 00:00 BST is 2026-10-11T23:00:00.000Z; one millisecond earlier is Sunday 11 Oct.
    const result = exposureOf([
      finished("onMonday", "2026-10-11T23:00:00.000Z", [exercise("e", "Wrist Curl", 139, sets(2))]),
      finished("onSunday", "2026-10-11T22:59:59.999Z", [exercise("e", "Wrist Curl", 139, sets(1))]),
      finished("thisMonday", "2026-10-18T23:00:00.000Z", [exercise("e", "Wrist Curl", 139, sets(1))]),
      finished("lastSunday", "2026-10-18T22:59:59.999Z", [exercise("e", "Wrist Curl", 139, sets(1))]),
    ]);
    expect(result.weeks!.last).toMatchObject({ label: "12–18 Oct", finishedWorkouts: 2 });
    expect(result.weeks!.earlier[3]).toMatchObject({ label: "5–11 Oct", finishedWorkouts: 1 });
    expect(area(result, "inner").lastWeek!.lists.target.map((row) => row.sessionId)).toEqual(["onMonday", "onMonday", "lastSunday"]);
    expect(area(result, "inner").change!.sets).toMatchObject({ state: "building_baseline", last: 3, knownWeeks: 1 });
    // This week's window and its first day column hold the set at its first instant.
    expect(brief(area(result, "inner").counts)).toEqual({ ...none, sets: 1, target: 1 });
    expect(daysIn(area(result, "inner").days)[0]).toMatchObject({ dayKey: "2026-10-19", sets: 1 });
  });

  it("lists a set strapped for one member and pending for another once, as strapped", () => {
    // A test assumption: a draft FCR mapping on 43 Barbell Bent-Over Row, so the strapped FDS and FDP rows and FCR's pending row meet at the inner area.
    const base = forearmRegionData.mappings.find((mapping) => mapping.id === "cat-139:forearm.fcr" && mapping.versionKey === forearmRegionData.mappingVersion.key)!;
    const region: SpecializationRegionData = { ...forearmRegionData, mappings: [...forearmRegionData.mappings, { ...base, id: "test-43-fcr-draft", variantId: "cat-43", reviewStatus: "draft" }] };
    const result = counted([finished("s1", WED, [exercise("e1", "Barbell Bent-Over Row", 43, sets(2), { straps: "yes" })])], { region });
    expect(brief(area(result, "inner").counts)).toEqual({ ...none, strapped: 2 });
    expect(brief(groupIn(result, "distal", "front").counts)).toEqual({ ...none, pending: 2 });
    expect(brief(area(result, "digits").counts)).toEqual({ ...none, strapped: 2 });
  });
});

describe("the module's words", () => {
  const source = readFileSync(join(process.cwd(), "shared/specialization/tendonAreas.ts"), "utf8");

  /**
   * Every line, comments included, with identifiers split at their capitals ("aboveThreshold" reads
   * "above threshold") and read as plain text, not word by word, so a word inside an identifier is
   * found too. One token is allowed: `timezone`, the calculator's own `SummaryInterval` field, which
   * names the page's local time, not a zone in the sense the list means.
   */
  const lines = source.split("\n").map((line, index) => [index + 1, line.replace(/\btimezone\b/g, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase()] as const);

  it("has no percentage, ratio, cut-off or risk word anywhere, comments and identifiers included", () => {
    // 11-forearm-research-and-stack.md §4.4's list, and the words for a share or a line drawn.
    const words = ["risk", "safe", "danger", "injur", "tendonitis", "tendinitis", "tendinopathy", "overuse", "overload", "strain", "damage", "warning", "alert", "limit", "budget", "threshold", "zone", "spike", "red flag", "acwr", "acute", "chronic", "push through", "percent", "ratio", "cut-off", "cutoff", "%"];
    expect(lines.filter(([, line]) => words.some((word) => line.includes(word)))).toEqual([]);
  });

  it("finds a word inside an identifier", () => {
    const read = (text: string) => text.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
    expect(["aboveThreshold", "leftSide", "loadRatio", "riskScore"].map((word) => /threshold|left|ratio|risk/.test(read(word)))).toEqual([true, true, true, true]);
  });

  it("names no side", () => {
    expect(lines.filter(([, line]) => /left|right/.test(line))).toEqual([]);
  });
});
