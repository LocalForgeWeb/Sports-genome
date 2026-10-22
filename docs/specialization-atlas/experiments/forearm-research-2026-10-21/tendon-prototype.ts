/**
 * Scratch prototype (not repository code): the "Tendon exposure" view as a projection over the
 * atlas's existing summary (shared/specialization/exposure.ts), run on a synthetic history through
 * the real adapters (client/src/lib/specialization/bouts.ts) and the real published forearm data
 * (forearm_mappings_v1). Nothing here changes the calculator: it reads `summary.nodes[*].contributions`
 * and `notCounted`, which already carry side, category, segments and hold seconds per bout.
 *
 * Run from the repo root:
 *   npx tsx --tsconfig tsconfig.json <this file>
 */
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog.ts";
import { boutsFromSessions, excludedRecordsFromSessions } from "/home/user/Sports-genome/client/src/lib/specialization/bouts.ts";
import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession } from "/home/user/Sports-genome/client/src/lib/deviceWorkoutLog.ts";
import { getSpecializationSummary } from "/home/user/Sports-genome/shared/specialization/exposure.ts";
import { forearmRegionData as data } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index.ts";
import { addDaysToDateKey, calendarWeekInterval, dateRangeLabel, intervalContains, localDateKey, zonedStartOfDay } from "/home/user/Sports-genome/shared/specialization/time.ts";
import type { Contribution, ExposureBout, ExposureCategory, SpecializationSummary, SummaryInterval, SummaryRequest } from "/home/user/Sports-genome/shared/specialization/types.ts";
import { writeFileSync } from "node:fs";

const OUT = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/forearm-v2";
const TZ = "Europe/London";
const NOW = "2026-10-21T18:00:00.000Z"; // Wed 21 Oct 2026, 19:00 in London
const lines: string[] = [];
const say = (text = "") => { lines.push(text); };

// ---------------------------------------------------------------- the proposed region data

/** The package's `regional_groups` (muscles.json), verbatim, on our node ids (one per muscle). */
const PACKAGE_GROUP: Record<string, string> = {
  "forearm.br": "br-attachments",
  "forearm.fcr": "medial-flexor-origin",
  "forearm.fcu": "medial-flexor-origin",
  "forearm.pl": "medial-flexor-origin",
  "forearm.fds": "medial-flexor-origin",
  "forearm.fdp": "deep-digital-flexors",
  "forearm.fpl": "thumb-flexor",
  "forearm.pt": "medial-flexor-origin",
  "forearm.pq": "distal-rotators",
  "forearm.ecrl": "radial-wrist-extensors",
  "forearm.ecrb": "lateral-extensor-origin",
  "forearm.ecu": "lateral-extensor-origin",
  "forearm.ed": "lateral-extensor-origin",
  "forearm.edm": "lateral-extensor-origin",
  "forearm.ei": "deep-digital-extensors",
  "forearm.apl": "thumb-abductor-extensor-region",
  "forearm.epb": "thumb-abductor-extensor-region",
  "forearm.epl": "thumb-long-extensor",
  "forearm.supinator": "proximal-supinator-attachments",
};

type Area = "inner_elbow" | "outer_elbow" | "wrist_thumb" | "fingers";
const AREAS: Area[] = ["inner_elbow", "outer_elbow", "wrist_thumb", "fingers"];
const AREA_LABEL: Record<Area, string> = { inner_elbow: "Inner elbow", outer_elbow: "Outer elbow", wrist_thumb: "Wrist & thumb", fingers: "Fingers" };

/** Design A: each package group in exactly one area (a partition). */
const AREA_OF_GROUP_A: Record<string, Area> = {
  "medial-flexor-origin": "inner_elbow",
  "lateral-extensor-origin": "outer_elbow",
  "radial-wrist-extensors": "outer_elbow",
  "br-attachments": "outer_elbow",
  "proximal-supinator-attachments": "outer_elbow",
  "thumb-flexor": "wrist_thumb",
  "thumb-abductor-extensor-region": "wrist_thumb",
  "thumb-long-extensor": "wrist_thumb",
  "distal-rotators": "wrist_thumb",
  "deep-digital-flexors": "fingers",
  "deep-digital-extensors": "fingers",
};
const areasA = (nodeId: string): Area[] => (PACKAGE_GROUP[nodeId] ? [AREA_OF_GROUP_A[PACKAGE_GROUP[nodeId]]] : []);

/** Design B (recommended): a muscle is in each area where one of its two ends attaches. */
const AREAS_B: Record<string, Area[]> = {
  "forearm.br": ["outer_elbow"],
  "forearm.fcr": ["inner_elbow", "wrist_thumb"],
  "forearm.fcu": ["inner_elbow", "wrist_thumb"],
  "forearm.pl": ["inner_elbow", "wrist_thumb"],
  "forearm.fds": ["inner_elbow", "fingers"],
  "forearm.fdp": ["fingers"],
  "forearm.fpl": ["wrist_thumb"],
  "forearm.pt": ["inner_elbow"],
  "forearm.pq": ["wrist_thumb"],
  "forearm.ecrl": ["outer_elbow", "wrist_thumb"],
  "forearm.ecrb": ["outer_elbow", "wrist_thumb"],
  "forearm.ecu": ["outer_elbow", "wrist_thumb"],
  "forearm.ed": ["outer_elbow", "fingers"],
  "forearm.edm": ["outer_elbow", "fingers"],
  "forearm.ei": ["fingers"],
  "forearm.apl": ["wrist_thumb"],
  "forearm.epb": ["wrist_thumb"],
  "forearm.epl": ["wrist_thumb"],
  "forearm.supinator": ["outer_elbow"],
};
const areasB = (nodeId: string): Area[] => AREAS_B[nodeId] ?? [];

// ---------------------------------------------------------------- catalog lookup (as useSpecializationSummary.ts:80)

const byId = new Map(exercises.map((exercise) => [exercise.id, exercise] as const));
const catalogMusclesFor: SummaryRequest["catalogMusclesFor"] = (id, name) => {
  const exercise = (id !== null ? byId.get(id) : undefined) ?? exercises.find((item) => item.name === name);
  return exercise ? { primary: exercise.primaryMuscles, secondary: exercise.secondaryMuscles } : null;
};

// ---------------------------------------------------------------- the synthetic history

let seq = 0;
const next = (prefix: string) => `${prefix}${++seq}`;
const at = (dateKey: string, hour: number) => new Date(Date.parse(zonedStartOfDay(dateKey, TZ)) + hour * 3_600_000).toISOString();
type SetSeed = Partial<DeviceSetLog>;
const reps = (count: number, weight = "20", extra: SetSeed = {}): DeviceSetLog => ({ id: next("set"), weight, reps: String(count), unit: "kg", completed: true, ...extra });
const hold = (seconds: number | null, extra: SetSeed = {}): DeviceSetLog => ({ id: next("set"), weight: "", reps: "", unit: "kg", completed: true, ...(seconds === null ? {} : { holdSeconds: String(seconds) }), ...extra });
const drop = (stages: [string, number][]): DeviceSetLog => {
  const id = next("set");
  return { id, type: "drop", weight: stages[0][0], reps: String(stages[0][1]), unit: "kg", completed: true, stages: stages.map(([weight, count], index) => ({ id: `${id}-stage-${index + 1}`, weight, reps: String(count), unit: "kg" })) };
};
const ex = (catalogId: number, sets: DeviceSetLog[], extra: Partial<DeviceWorkoutExercise> = {}): DeviceWorkoutExercise => ({ id: next("ex"), exerciseName: byId.get(catalogId)!.name, catalogId, plannedPrescription: "3 x 12", sets, ...extra });
const session = (dateKey: string, title: string, list: DeviceWorkoutExercise[], status: "completed" | "active" = "completed"): DeviceWorkoutSession => ({
  id: next(`s-${dateKey}-`), title, dayLabel: title, startedAt: at(dateKey, 17), ...(status === "completed" ? { completedAt: at(dateKey, 18) } : {}), status, exercises: list, weightUnit: "kg",
});

const R = { side: "right" as const };
const L = { side: "left" as const };
const B = { side: "both" as const };

/** One ordinary training week: pull day, lower day, arm day. */
function ordinaryWeek(monday: string): DeviceWorkoutSession[] {
  return [
    session(addDaysToDateKey(monday, 1), "Pull", [
      ex(66, [reps(8, ""), reps(8, ""), reps(7, "")]), // Pull-Up, straps not recorded
      ex(43, [reps(10, "60"), reps(10, "60"), reps(10, "60")]), // Barbell Bent-Over Row
      ex(132, [reps(12, "14"), reps(12, "14"), reps(10, "14")]), // Hammer Curl (two-handed by definition)
      ex(139, [reps(15, "30"), reps(15, "30")]), // Wrist Curl
      ex(143, [hold(30), hold(30)]), // Dead Hang
    ]),
    session(addDaysToDateKey(monday, 3), "Lower", [
      ex(41, [reps(5, "140"), reps(5, "140"), reps(5, "140")], { straps: "yes" }), // Conventional Deadlift, strapped
      ex(343, [reps(12, "25"), reps(12, "25")]), // Cable Triceps Pressdown: tagged forearms, unmapped (region only)
    ]),
    session(addDaysToDateKey(monday, 5), "Arms", [
      ex(140, [reps(15, "20"), reps(15, "20")]), // Reverse Wrist Curl
      ex(410, [reps(15, "12", R), reps(15, "12", R), reps(15, "12", L)]), // One-Arm DB Wrist Curl: right twice, left once
      ex(409, [hold(40, R), hold(40, L)]), // Suitcase Carry, straps not recorded
    ]),
  ];
}

const THIS_MONDAY = "2026-10-19";
const weekMonday = (offset: number) => addDaysToDateKey(THIS_MONDAY, 7 * offset);

const history: DeviceWorkoutSession[] = [];
// W-5 (14 Sep), W-3 (28 Sep), W-2 (5 Oct): ordinary weeks. W-4 (21 Sep): nothing logged at all.
history.push(...ordinaryWeek(weekMonday(-5)), ...ordinaryWeek(weekMonday(-3)), ...ordinaryWeek(weekMonday(-2)));
// W-1 (12 Oct), "last week": the ordinary week plus a forearm block.
history.push(...ordinaryWeek(weekMonday(-1)));
history.push(session(addDaysToDateKey(weekMonday(-1), 6), "Forearm block", [
  ex(139, [reps(12, "30", { warmup: true }), drop([["40", 5], ["30", 6], ["20", 10]]), reps(15, "30")]), // a warm-up, a drop set, a set
  ex(402, [reps(10, "", R), reps(10, "", L), reps(10, "")]), // Gripper Close: right, left, and one with no hand recorded
  ex(404, [reps(15, "", R), reps(15, "", L)]), // Band Finger Extension: new
  ex(413, [reps(15, "", R), reps(15, "", R)]), // Band Thumb Extension: new, right only
  ex(405, [reps(12, "5", R), reps(12, "5", R), reps(12, "5", R)]), // Lever Pronation: right only
  ex(144, [hold(25), hold(null)]), // Towel Dead Hang: one hold with seconds, one without (FPL mapping is a draft)
  ex(145, [hold(40), hold(40)], { straps: "yes" }), // Farmer Hold, strapped: grip withheld, wrist steadying kept
]));
// This week (W0, 19-21 Oct): Monday's pull day was imported twice (same ids); Tuesday swaps mid-workout.
const monday = session(addDaysToDateKey(THIS_MONDAY, 0), "Pull", [ex(66, [reps(8, ""), reps(8, "")]), ex(139, [reps(15, "30"), reps(15, "30")]), ex(143, [hold(35)])]);
history.push(monday, JSON.parse(JSON.stringify(monday)));
const wristCurl = ex(139, [reps(15, "30"), reps(15, "30")], { replacedBy: { swapId: "sw1", exerciseName: "Reverse Wrist Curl", catalogId: 140, afterSets: 2, at: at(addDaysToDateKey(THIS_MONDAY, 1), 17) } });
const reverse = ex(140, [reps(15, "20"), reps(15, "20")], { swappedFrom: { swapId: "sw1", exerciseName: "Wrist Curl", catalogId: 139, afterSets: 2, at: at(addDaysToDateKey(THIS_MONDAY, 1), 17) } });
history.push(session(addDaysToDateKey(THIS_MONDAY, 1), "Arms", [wristCurl, reverse, ex(402, [reps(10, "", R), reps(10, "", R)])]));
// Today's workout is still open: its sets are excluded until it is finished.
history.push(session(addDaysToDateKey(THIS_MONDAY, 2), "Forearm (open)", [ex(410, [reps(15, "12", R)])], "active"));

const bouts: ExposureBout[] = [...boutsFromSessions(history, { catalog: exercises, fallbackUnit: "kg" }), ...excludedRecordsFromSessions(history, { catalog: exercises, fallbackUnit: "kg" })];

// ---------------------------------------------------------------- the projection

type Column = "target" | "hold" | "other";
/** A bout's column in an area: its strongest kind of work among the area's muscles ("maximum grade per parent bout"). */
const RANK: Record<ExposureCategory, number> = { direct_dynamic: 0, deliberate_isometric: 1, contributing_dynamic: 2, incidental_isometric: 3, mixed: 4, unknown: 5 };
function columnOf(rows: readonly Contribution[]): Column {
  const categories = rows.flatMap((row) => (row.category === "mixed" ? row.parts.map((part) => part.category) : [row.category]));
  const best = categories.sort((a, b) => RANK[a] - RANK[b])[0];
  return best === "direct_dynamic" ? "target" : best === "deliberate_isometric" ? "hold" : "other";
}

type AreaReading = {
  area: Area;
  bouts: number; // distinct working bouts on this side, each once per area
  columns: Record<Column, number>;
  holdSeconds: number; // known seconds, once per hold bout (never per muscle)
  holdsWithoutSeconds: number;
  noSide: number; // bouts with no arm recorded: kept apart, in neither arm
  strapped: number; // bouts whose only work here was grip withheld for straps
  pending: number; // bouts whose only work here is a draft mapping
  byDay: Map<string, Record<Column, number>>;
  boutIds: Set<string>;
  muscles: Map<string, number>; // per muscle, for the drill-down
};

function readArea(summary: SpecializationSummary, area: Area, areasOf: (nodeId: string) => Area[]): AreaReading {
  const working = new Map<string, Contribution[]>();
  const noSide = new Set<string>();
  const strapped = new Set<string>();
  const pending = new Set<string>();
  const muscles = new Map<string, number>();
  for (const node of summary.nodes) {
    if (!areasOf(node.nodeId).includes(area)) continue;
    for (const row of node.contributions) {
      if (row.countedSide === summary.side) {
        working.set(row.boutId, [...(working.get(row.boutId) ?? []), row]);
        muscles.set(node.nodeId, (muscles.get(node.nodeId) ?? 0) + 1);
      } else if (row.countedSide === "unknown") noSide.add(row.boutId);
    }
    for (const row of node.notCounted ?? []) {
      if (row.countedSide !== summary.side) continue;
      if (row.notes.includes("Strapped: grip not counted")) strapped.add(row.boutId);
      else if (row.notes.includes("Mapping pending review")) pending.add(row.boutId);
    }
  }
  const columns: Record<Column, number> = { target: 0, hold: 0, other: 0 };
  const byDay = new Map<string, Record<Column, number>>();
  let holdSeconds = 0;
  let holdsWithoutSeconds = 0;
  for (const rows of Array.from(working.values())) {
    const column = columnOf(rows);
    columns[column] += 1;
    const day = localDateKey(rows[0].performedAt!, TZ);
    const counts = byDay.get(day) ?? { target: 0, hold: 0, other: 0 };
    counts[column] += 1;
    byDay.set(day, counts);
    if (rows.some((row) => row.category === "deliberate_isometric")) {
      // Seconds are the bout's own, read once: the same segments stand behind every muscle's row.
      const known = rows[0].segments.filter((segment) => segment.holdSeconds !== null);
      if (known.length) holdSeconds += known.reduce((total, segment) => total + segment.holdSeconds!, 0);
      else holdsWithoutSeconds += 1;
    }
  }
  for (const id of Array.from(working.keys())) { noSide.delete(id); strapped.delete(id); pending.delete(id); }
  return { area, bouts: working.size, columns, holdSeconds, holdsWithoutSeconds, noSide: noSide.size, strapped: strapped.size, pending: pending.size, byDay, boutIds: new Set(working.keys()), muscles };
}

const summaryFor = (interval: SummaryInterval, side: "left" | "right", input: readonly ExposureBout[] = bouts): SpecializationSummary =>
  getSpecializationSummary({ region: data, bouts: input, interval, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "prototype", planRevision: null, now: NOW });

/** Warm-ups stay out of every work total (02-design.md §3); here they are read as work only to count them apart. */
const warmupsAsWork = bouts.filter((bout) => bout.warmup).map((bout) => ({ ...bout, warmup: false }));

/** A week is known when at least one workout was finished in it; a week with none is unknown, never zero. */
const knownWeek = (interval: SummaryInterval) => history.some((item) => item.status === "completed" && intervalContains(interval, item.completedAt ?? null));

const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };

type Measure = "bouts" | Column | "holdSeconds";
const MEASURES: Measure[] = ["target", "hold", "other", "bouts", "holdSeconds"];
const MEASURE_LABEL: Record<Measure, string> = { target: "Target sets", hold: "Hold sets", other: "Other sets", bouts: "All sets", holdSeconds: "Hold seconds" };
const valueOf = (reading: AreaReading, measure: Measure) => (measure === "bouts" ? reading.bouts : measure === "holdSeconds" ? reading.holdSeconds : reading.columns[measure]);

function changeLine(current: number, baseline: (number | null)[], unit: string): string {
  const known = baseline.filter((value): value is number => value !== null);
  if (known.length < 3) return `Building your baseline (${known.length} of 3 earlier weeks with a finished workout)`;
  const base = median(known);
  if (base === 0 && current > 0) return `New: ${current}${unit}; none in the ${baseline.length} weeks before`;
  const change = current - base;
  const above = current > Math.max(...known) ? " · more than in any of those weeks" : "";
  return `${current}${unit}; median of ${known.length} weeks before ${base}${unit}; ${change > 0 ? "+" : change < 0 ? "−" : "±"}${Math.abs(change)}${unit}${above}`;
}

// ---------------------------------------------------------------- the output

const thisWeek = calendarWeekInterval(NOW, TZ);
const weekInterval = (offset: number) => calendarWeekInterval(zonedStartOfDay(weekMonday(offset), TZ), TZ);
const lastWeek = weekInterval(-1);
const baselineWeeks = [-5, -4, -3, -2].map(weekInterval);

say(`Tendon exposure prototype, ${NOW} (${TZ}); forearm_mappings_v1 (${data.mappings.length} mappings), ${bouts.length} bout records from ${history.length} sessions.`);
say(`Weeks: this week ${thisWeek.label}; last week ${dateRangeLabel(weekMonday(-1), addDaysToDateKey(weekMonday(-1), 6))}; baseline weeks ${baselineWeeks.map((w, i) => `${dateRangeLabel(weekMonday(-5 + i), addDaysToDateKey(weekMonday(-5 + i), 6))}${knownWeek(w) ? "" : " (no finished workout: unknown)"}`).join(", ")}.`);
say();

for (const [designName, areasOf] of [["Design B (recommended: both ends)", areasB], ["Design A (package groups as a partition)", areasA]] as const) {
  say(`==================== ${designName}`);
  for (const side of ["right", "left"] as const) {
    const summary = summaryFor(thisWeek, side);
    const warm = summaryFor(thisWeek, side, warmupsAsWork);
    say(`-- ${side} arm, ${thisWeek.label} (region: ${summary.regionDistinctBouts} distinct bouts, ${summary.regionUnknownSideBouts} with no arm, ${summary.regionUnclassified.bouts} region-only, excluded ${summary.completeness.boutsExcluded.notCompleted} not completed / ${summary.completeness.boutsExcluded.warmup} warm-ups)`);
    for (const area of AREAS) {
      const reading = readArea(summary, area, areasOf);
      const warmups = readArea(warm, area, areasOf).bouts;
      say(`   ${AREA_LABEL[area].padEnd(14)} ${String(reading.bouts).padStart(2)} sets = ${reading.columns.target} target · ${reading.columns.hold} hold · ${reading.columns.other} other | holds ${reading.holdSeconds} s${reading.holdsWithoutSeconds ? `, ${reading.holdsWithoutSeconds} with no time` : ""} | apart: ${reading.noSide} no arm, ${reading.strapped} strapped, ${reading.pending} pending | warm-ups ${warmups}`);
      const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(THIS_MONDAY, index));
      say(`      days Mon..Sun [target/hold/other]: ${days.map((day) => { const c = reading.byDay.get(day); return c ? `${c.target}/${c.hold}/${c.other}` : "-"; }).join("  ")}`);
    }
  }
  for (const side of ["right", "left"] as const) {
    const last = summaryFor(lastWeek, side);
    const warm = summaryFor(lastWeek, side, warmupsAsWork);
    say(`-- ${side} arm, last week ${lastWeek.label.replace("This week · ", "")} against the 4 weeks before`);
    for (const area of AREAS) {
      const reading = readArea(last, area, areasOf);
      const warmups = readArea(warm, area, areasOf).bouts;
      const before = baselineWeeks.map((week) => (knownWeek(week) ? readArea(summaryFor(week, side), area, areasOf) : null));
      say(`   ${AREA_LABEL[area]}: ${reading.bouts} sets (${reading.columns.target} target · ${reading.columns.hold} hold · ${reading.columns.other} other), holds ${reading.holdSeconds} s${reading.holdsWithoutSeconds ? ` + ${reading.holdsWithoutSeconds} with no time` : ""}; apart ${reading.noSide} no arm · ${reading.strapped} strapped · ${reading.pending} pending; warm-ups ${warmups}; muscles ${Array.from(reading.muscles).map(([id, n]) => `${id.replace("forearm.", "")}:${n}`).join(" ")}`);
      for (const measure of MEASURES) {
        const unit = measure === "holdSeconds" ? " s" : "";
        say(`      ${MEASURE_LABEL[measure].padEnd(13)} ${changeLine(valueOf(reading, measure), before.map((item) => (item ? valueOf(item, measure) : null)), unit)}   [weeks before: ${before.map((item) => (item ? valueOf(item, measure) : "unknown")).join(", ")}]`);
      }
    }
  }
  say();
}

// The package's 11 groups, once per bout per group (its reference_engine semantics), last week, right arm.
{
  const last = summaryFor(lastWeek, "right");
  const groups = Array.from(new Set(Object.values(PACKAGE_GROUP)));
  say("==================== Package regional_groups, last week, right arm (distinct working bouts per group)");
  for (const group of groups) {
    const reading = readArea(last, "inner_elbow", (nodeId) => (PACKAGE_GROUP[nodeId] === group ? ["inner_elbow"] : []));
    say(`   ${group.padEnd(32)} ${reading.bouts} (${reading.columns.target}/${reading.columns.hold}/${reading.columns.other})`);
  }
  say();
}

// The package's worked examples (START-HERE §9), through our real pipeline.
{
  say("==================== START-HERE §9 examples through the real pipeline (right arm, one day)");
  const day = "2026-09-01";
  const window = calendarWeekInterval(zonedStartOfDay(day, TZ), TZ);
  const run = (name: string, sessions: DeviceWorkoutSession[]) => {
    const input = boutsFromSessions(sessions, { catalog: exercises, fallbackUnit: "kg" });
    const summary = getSpecializationSummary({ region: data, bouts: input, interval: window, side: "right", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: NOW });
    const rows = summary.nodes.filter((node) => node.directDynamicBouts + node.contributingDynamicBouts + node.deliberateHoldBouts + node.incidentalBouts + node.mixedBouts + node.unknownBouts > 0)
      .map((node) => `${node.nodeId.replace("forearm.", "").replace("upper_arm.", "UA.")}[dd${node.directDynamicBouts} cd${node.contributingDynamicBouts} hold${node.deliberateHoldBouts}/${node.deliberateHoldSeconds}s inc${node.incidentalBouts}]`);
    say(`   ${name}: region ${summary.regionDistinctBouts} bouts; ${rows.join(" ")}`);
    say(`      areas (B): ${AREAS.map((area) => `${AREA_LABEL[area]} ${readArea(summary, area, areasB).bouts}`).join(" · ")}; package medial-flexor-origin ${readArea(summary, "inner_elbow", (id) => (PACKAGE_GROUP[id] === "medial-flexor-origin" ? ["inner_elbow"] : [])).bouts}`);
    return summary;
  };
  run("A: two one-arm wrist curls + 20 s suitcase carry", [session(day, "A", [ex(410, [reps(15, "12", R), reps(15, "12", R)]), ex(409, [hold(20, R)])])]);
  const b = run("B: one drop set of 3 stages (5+6+10 reps), delivered twice", (() => { const s = session(day, "B", [ex(410, [{ ...drop([["45", 5], ["32", 6], ["23", 10]]), side: "right" }])]); return [s, JSON.parse(JSON.stringify(s))]; })());
  const fcr = b.nodes.find((node) => node.nodeId === "forearm.fcr")!;
  say(`      FCR: ${fcr.directDynamicBouts} direct bout, ${fcr.directDynamicReps} reps, ${fcr.contributions[0]?.segments.length} segments, kind ${fcr.contributions[0]?.kind}`);
  const c = run("C: an exercise the atlas has no muscle mapping for (Cable Triceps Pressdown, tagged forearms)", [session(day, "C", [ex(343, [reps(12, "25")])])]);
  say(`      region-only bouts ${c.regionUnclassified.bouts}; in no area`);
  run("D: a week of curls, carries and wrist curls (no thumb-extension credit)", [session(day, "D", [ex(132, [reps(12, "14")]), ex(409, [hold(40, R)]), ex(410, [reps(15, "12", R)])])]);
  say();
}

// The change line's states on fixed inputs (the reference engine's workload_change cases, and ours).
say("==================== Change-line states (current; weeks before, null = no finished workout)");
for (const [current, before] of [[8, [5, 5, 5, 5]], [8, [0, 0, 0, 0]], [8, [1, null, 2, null]], [0, [0, 0, 0, 0]], [3, [1, 1, 9, 9]], [6, [2, null, 3, 4]]] as [number, (number | null)[]][]) {
  say(`   ${current} vs [${before.map((value) => value ?? "unknown").join(", ")}]: ${changeLine(current, before, "")}`);
}
say();

writeFileSync(`${OUT}/tendon-prototype-output.txt`, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
