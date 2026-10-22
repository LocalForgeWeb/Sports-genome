/**
 * Scratch prototype: "Tendon exposure" over the shipped calculator (read-only use of repo code).
 *
 * Run: cd /home/user/Sports-genome && npx tsx --tsconfig tsconfig.json <this file>
 *
 * Design under test (not repo code):
 * - Attachment groups are region data: each group lists node ids (package muscles.json
 *   regional_groups, one group per muscle, reconciled to our node ids by muscle code).
 * - Per side and window, a group counts DISTINCT bouts in which any member node has a counted
 *   contribution on that side (the shipped calculator's contributions; nothing re-derived).
 *   Each bout gets ONE kind per group: target (some member direct_dynamic) > hold (some member
 *   deliberate_isometric) > other (contributing, incidental, mixed or unknown parts).
 * - Hold seconds are summed once per hold bout (never per muscle); a hold bout with no seconds
 *   is counted as "time not recorded", never as 0 s or an assumed time.
 * - Warm-ups: a second summary over the warm-up sets only (warmup cleared for that pass), kept
 *   apart, never in the columns or the change line.
 * - Unknown side, strapped grip and pending-review mappings: listed per group, never counted.
 * - Region-only and unidentified sets: listed once for the forearm, never placed in a group.
 * - Recent change: calendar weeks (Mon-Sun, local zone); the latest COMPLETE week against the
 *   median of the up-to-4 complete weeks before it (at least 3), same group, side, measure,
 *   mapping version and rule. A week is complete when it has ended, at least one finished
 *   workout is logged in it (any exercise), and no set touching the group has an unknown side.
 *   Absolute change only; no percentage; no threshold; no risk wording.
 */
import { writeFileSync } from "node:fs";
import { exercises } from "@/lib/exerciseCatalog";
import { boutsFromSessions, excludedRecordsFromSessions } from "@/lib/specialization/bouts";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData as data } from "@shared/specialization/regions/forearm";
import { forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { addDaysToDateKey, customInterval, localDateKey, mondayIndexOfDateKey, zonedStartOfDay, intervalContains } from "@shared/specialization/time";
import type { Contribution, ExposureBout, SpecializationSummary, SummaryInterval, BodySide } from "@shared/specialization/types";

const OUT = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/forearm-v2";
const TZ = "Europe/London";
const NOW = "2026-10-20T12:00:00.000Z"; // Tuesday
const catalogMusclesFor = catalogMusclesLookup(exercises);
const catalog = exercises;

// ---------------------------------------------------------------- attachment groups (proposed region data)

type Area = "inner_elbow" | "outer_elbow" | "wrist_thumb" | "fingers";
type Group = { id: string; area: Area; label: string; nodeIds: string[]; packageGroup: string };
const groups: Group[] = [
  { id: "common_flexor_origin", area: "inner_elbow", label: "Common flexor origin (FCR, PL, FCU, FDS, PT)", nodeIds: [m.flexorCarpiRadialis, m.palmarisLongus, m.flexorCarpiUlnaris, m.flexorDigitorumSuperficialis, m.pronatorTeres], packageGroup: "medial-flexor-origin" },
  { id: "common_extensor_origin", area: "outer_elbow", label: "Common extensor origin (ECRB, ED, EDM, ECU)", nodeIds: [m.extensorCarpiRadialisBrevis, m.extensorDigitorum, m.extensorDigitiMinimi, m.extensorCarpiUlnaris], packageGroup: "lateral-extensor-origin" },
  { id: "ecrl", area: "outer_elbow", label: "ECRL (ridge above the outer elbow)", nodeIds: [m.extensorCarpiRadialisLongus], packageGroup: "radial-wrist-extensors" },
  { id: "brachioradialis", area: "outer_elbow", label: "Brachioradialis (ridge above the outer elbow)", nodeIds: [m.brachioradialis], packageGroup: "br-attachments" },
  { id: "supinator", area: "outer_elbow", label: "Supinator (outer elbow, deep)", nodeIds: [m.supinator], packageGroup: "proximal-supinator-attachments" },
  { id: "thumb_first_compartment", area: "wrist_thumb", label: "APL and EPB (thumb side of the wrist)", nodeIds: [m.abductorPollicisLongus, m.extensorPollicisBrevis], packageGroup: "thumb-abductor-extensor-region" },
  { id: "epl", area: "wrist_thumb", label: "EPL (back of the wrist to the thumb)", nodeIds: [m.extensorPollicisLongus], packageGroup: "thumb-long-extensor" },
  { id: "fpl", area: "wrist_thumb", label: "FPL (thumb flexor)", nodeIds: [m.flexorPollicisLongus], packageGroup: "thumb-flexor" },
  { id: "pronator_quadratus", area: "wrist_thumb", label: "Pronator quadratus (above the wrist)", nodeIds: [m.pronatorQuadratus], packageGroup: "distal-rotators" },
  { id: "fdp", area: "fingers", label: "FDP (deep finger flexor)", nodeIds: [m.flexorDigitorumProfundus], packageGroup: "deep-digital-flexors" },
  { id: "ei", area: "fingers", label: "EI (index extensor)", nodeIds: [m.extensorIndicis], packageGroup: "deep-digital-extensors" },
];

// ---------------------------------------------------------------- synthetic history

let n = 0;
const sid = () => `set-${++n}`;
type SetOver = Partial<DeviceSetLog> & { holdSeconds?: string; warmup?: boolean };
const set = (over: SetOver = {}): DeviceSetLog => ({ id: sid(), weight: "20", reps: "12", unit: "kg", completed: true, ...over });
const sets = (count: number, over: SetOver = {}) => Array.from({ length: count }, () => set(over));
const holds = (count: number, seconds: string | null, over: SetOver = {}) => Array.from({ length: count }, () => set({ reps: "", ...(seconds ? { holdSeconds: seconds } : {}), ...over }));
const names = new Map(catalog.map((e) => [e.id, e.name] as const));
let ex = 0;
const exercise = (catalogId: number | null, s: DeviceSetLog[], extra: Partial<DeviceWorkoutExercise> = {}): DeviceWorkoutExercise => ({
  id: `ex-${++ex}`, exerciseName: catalogId === null ? "Barbell wrist roll" : names.get(catalogId)!, ...(catalogId === null ? {} : { catalogId }), plannedPrescription: "3 x 12", sets: s, ...extra,
});
const session = (id: string, day: string, title: string, exs: DeviceWorkoutExercise[], status: "completed" | "active" = "completed"): DeviceWorkoutSession => ({
  id, title, dayLabel: title, startedAt: `${day}T17:00:00.000Z`, ...(status === "completed" ? { completedAt: `${day}T18:00:00.000Z` } : {}), status, exercises: exs, weightUnit: "kg",
});
const pull = (day: string, id: string, straps?: "yes") => session(id, day, "Pull", [
  exercise(66, sets(3, { weight: "" })), // pull-up: BR contributing, FDS/FDP incidental (no-straps grip)
  exercise(43, sets(3, { weight: "60" }), straps ? { straps } : {}), // barbell row
  exercise(132, sets(3, { weight: "14" })), // hammer curl: BR direct
]);
const arms = (day: string, id: string) => session(id, day, "Arms", [
  exercise(139, sets(3, { weight: "30" })), // wrist curl: FCR/FCU direct, PL contributing, FDS/FDP incidental
  exercise(140, sets(2, { weight: "15" })), // reverse wrist curl: ECRL/ECRB/ECU direct, ED contributing
  exercise(145, holds(2, "40", { weight: "32" })), // farmer hold: FDS/FDP deliberate hold, wrist extensors incidental
]);

const history: DeviceWorkoutSession[] = [
  // W0 31 Aug: nothing logged (not tracked: unknown, not zero)
  // W1 7 Sep
  pull("2026-09-08", "w1-pull"), arms("2026-09-10", "w1-arms"),
  session("w1-live", "2026-09-12", "Arms (never finished)", [exercise(139, sets(2))], "active"),
  // W2 14 Sep
  pull("2026-09-15", "w2-pull"), arms("2026-09-17", "w2-arms"),
  // W3 21 Sep: two one-arm wrist curls logged with no arm recorded
  pull("2026-09-22", "w3-pull"), arms("2026-09-24", "w3-arms"),
  session("w3-extra", "2026-09-26", "Extra", [exercise(410, sets(2, { weight: "12" }))]),
  // W4 28 Sep: pull day only
  pull("2026-09-29", "w4-pull"),
  // W5 5 Oct
  pull("2026-10-06", "w5-pull"), arms("2026-10-08", "w5-arms"),
  // W6 12 Oct (the latest complete week): more grip and wrist work, straps, a drop set, a warm-up, a swap, unresolved sets
  session("w6-pull", "2026-10-12", "Pull", [
    exercise(66, sets(3, { weight: "" })),
    exercise(43, sets(3, { weight: "70" }), { straps: "yes" }),
    exercise(41, sets(2, { weight: "140" }), { straps: "yes" }),
    exercise(132, sets(3, { weight: "16" })),
  ]),
  session("w6-arms", "2026-10-14", "Arms", [
    exercise(139, [
      set({ weight: "20", reps: "15", warmup: true }),
      set({ id: "drop-1", weight: "45", reps: "5", unit: "lb", type: "drop", stages: [{ id: "drop-1a", weight: "45", reps: "5", unit: "lb" }, { id: "drop-1b", weight: "30", reps: "6", unit: "lb" }, { id: "drop-1c", weight: "20", reps: "10", unit: "lb" }] }),
      ...sets(2, { weight: "30" }),
    ]),
    exercise(135, sets(3, { weight: "25" })), // reverse curl: BR direct; wrist extensors incidental
    exercise(402, [...sets(3, { weight: "", side: "right" }), ...sets(3, { weight: "", side: "left" })]), // gripper close: FDS/FDP direct
    exercise(142, [...holds(2, "30", { weight: "10", side: "right" }), set({ weight: "10", reps: "1", side: "right" })]), // plate pinch: third set has no seconds
    exercise(144, holds(2, "25", { weight: "" })), // towel dead hang: FPL mapping is a draft (pending)
  ]),
  session("w6-fri", "2026-10-16", "Accessories", [
    exercise(140, sets(1, { weight: "15" }), { replacedBy: { swapId: "sw1", exerciseName: "Cable Wrist Extension", catalogId: 350, afterSets: 1, at: "2026-10-16T17:20:00.000Z" } }),
    exercise(350, sets(2, { weight: "10", side: "both" }), { swappedFrom: { swapId: "sw1", exerciseName: "Reverse Wrist Curl", catalogId: 140, afterSets: 1, at: "2026-10-16T17:20:00.000Z" } }),
    exercise(145, holds(2, "40", { weight: "36" })),
    exercise(387, sets(2, { weight: "16" })), // kettlebell clean: tagged forearms (secondary), listed unmapped -> region only
    exercise(null, sets(2, { weight: "10" })), // a name the catalog does not know
  ]),
  // W7 19 Oct (this week, in progress)
  session("w7-mon", "2026-10-19", "Pull and wrists", [
    exercise(66, sets(3, { weight: "" })),
    exercise(139, sets(3, { weight: "30" })),
    exercise(414, sets(2, { weight: "", side: "right" })), // band thumb abduction: APL direct
  ]),
];

const deps = { catalog, variants: data.variants, fallbackUnit: "kg" as const };
const allBouts: ExposureBout[] = [...boutsFromSessions(history, deps), ...excludedRecordsFromSessions(history, deps)];

// ---------------------------------------------------------------- the calculation

type Kind = "target" | "hold" | "other";
const rank: Record<Kind, number> = { target: 3, hold: 2, other: 1 };
function kindOf(c: Contribution): Kind {
  const cats = new Set(c.parts.map((p) => p.category));
  if (cats.has("direct_dynamic")) return "target";
  if (cats.has("deliberate_isometric")) return "hold";
  return "other";
}

type GroupWindow = {
  group: string; bouts: number; target: number; hold: number; other: number;
  holdSecondsKnown: number; holdBoutsNoTime: number; warmupBouts: number;
  unknownSideBouts: number; strappedBouts: number; pendingBouts: number;
  rows: { boutId: string; day: string; kind: Kind; exercise: string; segments: number; reps: number; seconds: number }[];
};

function summarize(bouts: readonly ExposureBout[], interval: SummaryInterval, side: BodySide): SpecializationSummary {
  return getSpecializationSummary({ region: data, bouts, interval, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: NOW });
}

function groupWindow(work: SpecializationSummary, warm: SpecializationSummary, group: Group, side: BodySide): GroupWindow {
  const counted = new Map<string, { kind: Kind; c: Contribution }>();
  const unknown = new Set<string>(), strapped = new Set<string>(), pending = new Set<string>(), warmups = new Set<string>();
  for (const nodeId of group.nodeIds) {
    const node = work.nodes.find((x) => x.nodeId === nodeId);
    if (node) {
      for (const c of node.contributions) {
        if (c.countedSide === side) {
          const k = kindOf(c);
          const prev = counted.get(c.boutId);
          if (!prev || rank[k] > rank[prev.kind]) counted.set(c.boutId, { kind: k, c });
        } else if (c.countedSide === "unknown") unknown.add(c.boutId);
      }
      for (const c of node.notCounted ?? []) {
        if (c.notes.some((x) => x.startsWith("Strapped"))) strapped.add(c.boutId);
        else if (c.notes.includes("Mapping pending review")) pending.add(c.boutId);
      }
    }
    const wnode = warm.nodes.find((x) => x.nodeId === nodeId);
    for (const c of wnode?.contributions ?? []) if (c.countedSide === side) warmups.add(c.boutId);
  }
  for (const id of counted.keys()) { unknown.delete(id); strapped.delete(id); pending.delete(id); }
  const rows = Array.from(counted.entries()).map(([boutId, { kind, c }]) => ({
    boutId, day: c.performedAt ? localDateKey(c.performedAt, TZ) : "?", kind, exercise: c.exerciseName,
    segments: c.segments.length, reps: c.reps, seconds: kind === "hold" ? c.holdSeconds : 0,
  }));
  const holdRows = rows.filter((r) => r.kind === "hold");
  return {
    group: group.id, bouts: rows.length,
    target: rows.filter((r) => r.kind === "target").length, hold: holdRows.length, other: rows.filter((r) => r.kind === "other").length,
    holdSecondsKnown: holdRows.reduce((t, r) => t + r.seconds, 0), holdBoutsNoTime: holdRows.filter((r) => !(r.seconds > 0)).length,
    warmupBouts: warmups.size, unknownSideBouts: unknown.size, strappedBouts: strapped.size, pendingBouts: pending.size, rows,
  };
}

function windowFor(fromKey: string, toKey: string, side: BodySide) {
  const interval = customInterval(fromKey, toKey, TZ);
  const inside = allBouts.filter((b) => intervalContains(interval, b.performedAt));
  const work = summarize(inside.filter((b) => !b.warmup), interval, side);
  const warm = summarize(inside.filter((b) => b.warmup).map((b) => ({ ...b, warmup: false })), interval, side);
  const loggedWorkouts = history.filter((s) => s.status === "completed" && intervalContains(interval, s.completedAt ?? s.startedAt)).length;
  return { interval, work, warm, loggedWorkouts, groups: groups.map((g) => groupWindow(work, warm, g, side)) };
}

// ---------------------------------------------------------------- weeks and the change line

const todayKey = localDateKey(NOW, TZ);
const thisMonday = addDaysToDateKey(todayKey, -mondayIndexOfDateKey(todayKey));
const mondays = Array.from({ length: 8 }, (_, i) => addDaysToDateKey(thisMonday, -7 * (7 - i))); // oldest first, last = this week
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };

type Measure = "bouts" | "target" | "hold";
function changeLine(weeks: { monday: string; ended: boolean; logged: number; g: GroupWindow }[], measure: Measure, noun: string): string {
  const complete = (w: (typeof weeks)[number]) => w.ended && w.logged > 0 && w.g.unknownSideBouts === 0;
  const ended = weeks.filter((w) => w.ended);
  const latest = ended[ended.length - 1];
  const label = `Week of ${latest.monday}`;
  if (!complete(latest)) {
    const why = latest.logged === 0 ? "no workouts logged" : `${latest.g.unknownSideBouts} set(s) with no arm recorded`;
    return `${label}: Not enough information (${why}).`;
  }
  const value = latest.g[measure];
  const prior = ended.slice(0, -1).filter(complete).slice(-4);
  const skipped = ended.slice(0, -1).length - ended.slice(0, -1).filter(complete).length;
  if (prior.length < 3) return `${label}: ${value} ${noun}. Building your baseline: ${prior.length} of 3 earlier complete weeks.`;
  const base = median(prior.map((w) => w.g[measure]));
  const weeksWord = `${prior.length} earlier weeks${skipped ? `; ${skipped} week(s) left out as incomplete` : ""}`;
  if (base === 0) return value > 0 ? `${label}: New exposure: ${value} ${noun}; none in your ${weeksWord}.` : `${label}: 0 ${noun}, and none in your ${weeksWord}.`;
  const diff = value - base;
  const signed = diff > 0 ? `+${diff}` : `${diff}`;
  return `${label}: ${value} ${noun}. Your weekly median before it: ${base} (${weeksWord}). ${diff === 0 ? "No change" : `${signed} ${noun}`}.`;
}

// ---------------------------------------------------------------- report

const lines: string[] = [];
const json: Record<string, unknown> = { now: NOW, timeZone: TZ, groups: groups.map(({ id, area, packageGroup, nodeIds }) => ({ id, area, packageGroup, nodeIds })) };
for (const side of ["right", "left"] as const) {
  lines.push(`\n==================== ${side.toUpperCase()} ARM ====================`);
  const weeks = mondays.map((monday) => {
    const w = windowFor(monday, addDaysToDateKey(monday, 6), side);
    return { monday, ended: Date.parse(w.interval.endAtExclusive!) <= Date.parse(NOW), logged: w.loggedWorkouts, w };
  });
  lines.push(`\nWeekly distinct bouts per group (T target / H hold / O other; s = known hold seconds; nt = hold sets with no time; wu = warm-ups; ?side; strap; pend) ; logged workouts per week:`);
  lines.push(`week        logged  ` + groups.map((g) => g.id.padEnd(24)).join(""));
  for (const wk of weeks) {
    lines.push(`${wk.monday}  ${String(wk.logged).padStart(3)}${wk.ended ? " " : "*"}    ` + wk.w.groups.map((g) => {
      const extra = [g.holdSecondsKnown ? `${g.holdSecondsKnown}s` : "", g.holdBoutsNoTime ? `nt${g.holdBoutsNoTime}` : "", g.warmupBouts ? `wu${g.warmupBouts}` : "", g.unknownSideBouts ? `?${g.unknownSideBouts}` : "", g.strappedBouts ? `strap${g.strappedBouts}` : "", g.pendingBouts ? `pend${g.pendingBouts}` : ""].filter(Boolean).join(",");
      return `${g.bouts}=${g.target}T${g.hold}H${g.other}O${extra ? ` ${extra}` : ""}`.padEnd(24);
    }).join(""));
  }
  lines.push(`(* = week not ended yet)`);

  // Change lines per group, for the group's distinct bouts and target bouts.
  lines.push(`\nRecent change (latest complete calendar week vs median of up to 4 earlier complete weeks, min 3):`);
  for (const g of groups) {
    const series = weeks.map((wk) => ({ monday: wk.monday, ended: wk.ended, logged: wk.logged, g: wk.w.groups.find((x) => x.group === g.id)! }));
    lines.push(`  ${g.id}: ${changeLine(series, "bouts", "sets")}`);
    lines.push(`  ${" ".repeat(g.id.length)}  target only: ${changeLine(series, "target", "target sets")}`);
  }

  // Seven-day columns for this week (the page's "This week") and for the latest complete week.
  for (const monday of [mondays[6], mondays[7]]) {
    const wk = weeks.find((x) => x.monday === monday)!;
    lines.push(`\nSeven-day columns, week of ${monday} (${wk.ended ? "complete" : "in progress"}), distinct bouts T/H/O per day:`);
    const days = Array.from({ length: 7 }, (_, i) => addDaysToDateKey(monday, i));
    for (const g of wk.w.groups.filter((x) => x.bouts || x.warmupBouts || x.unknownSideBouts || x.strappedBouts || x.pendingBouts)) {
      const cols = days.map((d) => { const r = g.rows.filter((x) => x.day === d); return r.length ? `${r.filter((x) => x.kind === "target").length}/${r.filter((x) => x.kind === "hold").length}/${r.filter((x) => x.kind === "other").length}` : "."; });
      lines.push(`  ${g.group.padEnd(24)} ${cols.map((c) => c.padEnd(7)).join("")}  | holds ${g.hold}: ${g.holdSecondsKnown} s known, ${g.holdBoutsNoTime} with no time | warm-ups ${g.warmupBouts} | no arm ${g.unknownSideBouts} | strapped grip ${g.strappedBouts} | pending ${g.pendingBouts}`);
    }
    const c = wk.w.work.completeness;
    lines.push(`  Forearm as a whole: ${c.boutsRegionOnly} region-only set(s) (${wk.w.work.regionUnclassified.exercises.map((e) => `${e.name} x${e.bouts}`).join(", ") || "none"}); ${c.boutsExcluded.warmup} warm-up(s) left out of work; ${c.boutsExcluded.notCompleted} not completed; ${c.boutsUnknownSide} with no arm recorded.`);
    const unidentified = allBouts.filter((b) => b.matchedBy === "none" && intervalContains(wk.w.interval, b.performedAt) && !b.excluded).length;
    lines.push(`  Not identified by the catalog (not counted anywhere on the page today): ${unidentified} set(s).`);
  }
  // The drop set and the swap, as rows.
  const w6 = weeks.find((x) => x.monday === mondays[6])!;
  const cfo = w6.w.groups.find((g) => g.group === "common_flexor_origin")!;
  const drop = cfo.rows.find((r) => r.boutId === "drop-1");
  lines.push(`\nDrop set as the common flexor origin counts it (${side}): ${drop ? `1 bout, kind ${drop.kind}, ${drop.segments} segments, ${drop.reps} reps` : "not on this side"}.`);
  const ceo = w6.w.groups.find((g) => g.group === "common_extensor_origin")!;
  lines.push(`Swap on 16 Oct as the common extensor origin counts it (${side}): ${ceo.rows.filter((r) => r.day === "2026-10-16").map((r) => `${r.exercise} (${r.kind})`).join(", ")}.`);
  json[side] = weeks.map((wk) => ({ monday: wk.monday, ended: wk.ended, loggedWorkouts: wk.logged, groups: wk.w.groups.map(({ rows, ...rest }) => rest) }));
}

// The package's Example A, through OUR mappings: two right wrist curls and one 20 s farmer hold.
const exA = [session("exA", "2026-10-19", "Example A", [exercise(139, sets(2, { side: "right" })), exercise(145, holds(1, "20", { weight: "20" }))])];
const exABouts = boutsFromSessions(exA, deps);
const exAInt = customInterval("2026-10-19", "2026-10-19", TZ);
const exASum = summarize(exABouts, exAInt, "right");
const exAWarm = summarize([], exAInt, "right");
lines.push(`\n==================== Package Example A through forearm_mappings_v1 (right) ====================`);
for (const id of [m.flexorCarpiRadialis, m.flexorCarpiUlnaris, m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus, m.brachioradialis, m.flexorPollicisLongus, m.extensorCarpiRadialisBrevis]) {
  const node = exASum.nodes.find((x) => x.nodeId === id)!;
  lines.push(`  ${id}: direct ${node.directDynamicBouts}, other dynamic ${node.contributingDynamicBouts}, holds ${node.deliberateHoldBouts} (${node.deliberateHoldSeconds} s), incidental ${node.incidentalBouts}`);
}
for (const g of groups) { const gw = groupWindow(exASum, exAWarm, g, "right"); if (gw.bouts) lines.push(`  group ${g.id}: ${gw.bouts} distinct bouts (${gw.target}T ${gw.hold}H ${gw.other}O), ${gw.holdSecondsKnown} s`); }

const text = lines.join("\n");
writeFileSync(`${OUT}/tendon-exposure-prototype-output.txt`, text + "\n");
writeFileSync(`${OUT}/tendon-exposure-prototype-output.json`, JSON.stringify(json, null, 1));
console.log(text);
