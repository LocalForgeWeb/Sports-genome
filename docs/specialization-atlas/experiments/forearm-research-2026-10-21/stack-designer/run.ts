/** PROTOTYPE runner: seeds plans as Home stores them (Home.specializationJourney.test.ts) and runs the designer. */
import { writeFileSync } from "node:fs";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { gymAccessProfiles } from "/home/user/Sports-genome/client/src/lib/equipmentProfile";
import { splitDaysForFrequency } from "/home/user/Sports-genome/client/src/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore, type WeeklyDayStore } from "/home/user/Sports-genome/client/src/lib/trainingDayPlan";
import type { TrainingGoal } from "/home/user/Sports-genome/client/src/lib/workoutPlanner";
import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import type { SpecializationGoal } from "/home/user/Sports-genome/shared/specialization/types";
import { designStack, type CoverageGroup, type StackInput, type StackResult } from "./stackDesigner";

const OUT = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/forearm-v2/stack-designer";
const byId = new Map(exercises.map((e) => [e.id, e] as const));
const NOW = "2026-10-21T12:00:00.000Z";

/** A plan week as Home keeps it: day key -> catalog exercises (entry id = catalog id, as a fresh add is). */
function planOf(days: number, content: number[][], prescriptions: Record<number, string>[] = []): { slots: ReturnType<typeof buildDaySlots>; store: WeeklyDayStore } {
  const slots = buildDaySlots(splitDaysForFrequency(days));
  let store = emptyDayStore();
  slots.forEach((slot, i) => {
    const workout = (content[i] ?? []).map((id) => byId.get(id)!);
    store = commitDay(store, slot.key, { workout, prescriptions: prescriptions[i] ?? {}, settings: {}, context: [] });
  });
  return { slots, store };
}

const goal = (id: string, subject: { nodeId?: string; actionId?: string }, side: "left" | "right", metric: SpecializationGoal["metric"], target: number): SpecializationGoal => ({
  id, regionId: "forearm", nodeId: subject.nodeId ?? null, actionId: subject.actionId ?? null, side, metric, target, period: "calendar_week",
  startsOn: "2026-10-19", endsOn: null, timezone: "Europe/London", createdAt: NOW, updatedAt: NOW,
});
const both = (id: string, subject: { nodeId?: string; actionId?: string }, metric: SpecializationGoal["metric"], target: number) => [goal(`${id}:left`, subject, "left", metric, target), goal(`${id}:right`, subject, "right", metric, target)];

type Scenario = { id: string; title: string; days: number; content: number[][]; prescriptions?: Record<number, string>[]; goal: TrainingGoal; gymMinutes: number; access: keyof typeof gymAccessProfiles; goals?: SpecializationGoal[]; totals: (number | null)[]; leaveOut?: CoverageGroup[]; includeHolds?: boolean; exclusions?: { catalogExerciseIds: number[]; equipment: string[] }; keepOneDayFree?: boolean };

// Realistic weeks. The app's 3-day split is Push / Pull / Legs (splitCycle.ts), so a "3-day full body" is
// seeded as full-body content in those three slots; the slot labels are the app's own.
const scenarios: Scenario[] = [
  {
    id: "A", title: "3 days (full-body content in the app's Push/Pull/Legs slots), 60 min, Muscle growth, commercial gym, no targets",
    days: 3,
    content: [
      [161, 1, 43, 103, 150], // Back Squat, Bench, Bent-Over Row, DB Shoulder Press, Pushdown
      [41, 4, 66, 111, 121], // Deadlift, DB Bench, Pull-Up, Lateral Raise, Barbell Curl
      [173, 2, 54, 186, 132], // Bulgarian, Incline Bench, Seated Cable Row, RDL, Hammer Curl (the plan's own BR work)
    ],
    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", totals: [null, 8, 16, 30],
  },
  {
    id: "B", title: "4 days Upper/Lower x2, 75 min, Muscle growth, commercial gym, targets: FCU 8 direct dynamic bouts both arms, FDS 120 s holds both arms, supination 6 on the left arm only",
    days: 4,
    content: [
      [1, 43, 103, 57, 121, 150],
      [161, 186, 171, 194, 221],
      [5, 47, 66, 111, 148, 123],
      [41, 173, 206, 195, 222],
    ],
    goal: "Muscle growth", gymMinutes: 75, access: "Commercial gym",
    goals: [
      ...both("fcu", { nodeId: "forearm.fcu" }, "direct_dynamic_bouts", 8),
      ...both("fds-hold", { nodeId: "forearm.fds" }, "deliberate_hold_seconds", 120),
      goal("sup:left", { actionId: "forearm.supination" }, "left", "direct_dynamic_bouts", 6),
    ],
    totals: [null, 20, 12],
  },
  {
    id: "C", title: "5 days Push/Pull/Legs/Upper/Sport Transfer, 45 min, Athleticism, At home (bodyweight, band, dumbbells, kettlebell, medicine ball), no targets",
    days: 5,
    content: [
      [4, 103, 26, 155],
      [46, 75, 123, 82],
      [165, 189, 175, 224],
      [7, 46, 108, 132],
      [173, 26, 66],
    ],
    goal: "Athleticism", gymMinutes: 45, access: "At home", totals: [null, 10, 24],
  },
  {
    id: "D", title: "Failure probe: 2 days Upper/Lower, 30 min, Max strength, Bodyweight only, holds on",
    days: 2,
    content: [[26, 66, 75], [184, 217]],
    goal: "Max strength", gymMinutes: 30, access: "Bodyweight only", includeHolds: true, totals: [null, 12],
  },
  {
    id: "E", title: "Failure probe: 1 day Full Body, 60 min, the plan already has 6 direct forearm sets per arm (Wrist Curl 3, Reverse Wrist Curl 3), total set to 4",
    days: 1,
    content: [[161, 1, 43, 139, 140]],
    prescriptions: [{ 139: "3 × 15", 140: "3 × 15" }],
    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", totals: [4, null],
  },
  {
    id: "F", title: "Failure probe: Plan A's week with targets no reviewed exercise can fill (palmaris longus 6 direct dynamic; FCR 90 s holds; EDM 4 direct dynamic), thumb and finger groups left out",
    days: 3,
    content: [
      [161, 1, 43, 103, 150],
      [41, 4, 66, 111, 121],
      [173, 2, 54, 186, 132],
    ],
    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", leaveOut: ["thumb", "fingers"],
    goals: [
      ...both("pl", { nodeId: "forearm.pl" }, "direct_dynamic_bouts", 6),
      ...both("fcr-hold", { nodeId: "forearm.fcr" }, "deliberate_hold_seconds", 90),
      ...both("edm", { nodeId: "forearm.edm" }, "direct_dynamic_bouts", 4),
    ],
    totals: [null],
  },
];

const lines: string[] = [];
const json: unknown[] = [];
const log = (s = "") => { lines.push(s); };

function render(s: Scenario, total: number | null, r: StackResult) {
  log(`### ${s.id} · total ${total === null ? `start value (${r.startValue})` : total} per arm`);
  log(`Stepper: ${r.stepper.min}–${r.stepper.max} (fits the ${s.gymMinutes}-min days: about ${r.stepper.fitsTime}); start value ${r.startValue}; this run ${r.totalPerArm}. Already planned: ${r.existingDirectPerArm.right} right / ${r.existingDirectPerArm.left} left. Added ${r.added}; left unplanned ${r.leftUnplanned}.`);
  log("");
  log("| Day | Plan's own (min) | Stack adds | After (min) |");
  log("|---|---:|---|---:|");
  for (const d of r.days) log(`| ${d.slot.label} | ${d.minutesBefore} | ${d.added.join("; ") || "nothing"} | ${d.minutesAfter}${d.overWindow ? " (over window)" : ""} |`);
  log("");
  log("| Exercise | Sets/wk per arm | Days | Why (needs it fills) |");
  log("|---|---:|---|---|");
  for (const e of r.entries) log(`| ${e.name} (${e.catalogExerciseId}) | ${e.setsPerWeek} | ${e.days.map((d) => `${d.slot.ordinal}: ${d.prescription}`).join("; ")} | ${e.reasons.join("; ")}${e.sharedNote ? ` — ${e.sharedNote}` : ""} |`);
  log("");
  log(`Check (app calculator, planned, Plan Week 1): direct forearm bouts right ${r.check.right.before} → ${r.check.right.after}, left ${r.check.left.before} → ${r.check.left.after}; target muscles with direct work ${r.check.musclesWithDirect.before} → ${r.check.musclesWithDirect.after} of 19; largest deliberate-hold seconds on one muscle (right) ${r.check.holdSecondsRight.before} → ${r.check.holdSecondsRight.after}.`);
  if (r.adjacency.length) log(`Same muscle's direct work on consecutive plan days: ${r.adjacency.join("; ")}.`);
  log(`Main actions still without direct work: ${r.check.remainingGaps.join("; ") || "none"}.`);
  if (r.check.targets.length) log(`Targets after: ${r.check.targets.join("; ")}.`);
  if (r.notInStack.length) { log("Not in this stack:"); for (const n of r.notInStack) log(`- ${n}`); }
  if (r.notes.length) { log("Notes:"); for (const n of r.notes) log(`- ${n}`); }
  const pl = r.timings.placement;
  log(`Runtime: ${r.timings.totalMs.toFixed(1)} ms (placement ${r.timings.placeMs.toFixed(1)} ms, ${pl.evaluations} cost evaluations; cover search ${r.timings.searched} subsets). Changes written: ${r.changes.length}.`);
  if (pl.exactCost !== null) log(`Placement check: local search cost ${pl.localCost}, exact ${pl.exactComplete ? pl.exactCost : `>= unknown (search stopped at ${pl.exactNodes} nodes; best seen ${pl.exactCost})`} → ${pl.exactComplete ? (pl.localCost === pl.exactCost ? "optimal" : `gap ${pl.localCost - (pl.exactCost as number)}`) : "not proven"}. (cost = minutes over the window × 1e6 + same-muscle consecutive days × 1e4 + every day used × 1e3 + minutes between the longest and shortest day)`);
  log("");
}

// Warm the module graph once so the timings are the designer's, not the first import's.
{
  const s = scenarios[0];
  const { slots, store } = planOf(s.days, s.content);
  designStack({ region: R, catalog: exercises, week: 1, slots, store, goal: s.goal, gymMinutes: s.gymMinutes, equipment: { gymAccess: s.access, availableEquipment: gymAccessProfiles[s.access] }, exclusions: { catalogExerciseIds: [], equipment: [] }, goals: [], totalPerArm: null, leaveOut: [], includeHolds: false, now: NOW, keepOneDayFree: true });
}

for (const s of scenarios) {
  log(`## Plan ${s.id}: ${s.title}`);
  const { slots, store } = planOf(s.days, s.content, s.prescriptions);
  log(`Days: ${slots.map((slot, i) => `${slot.label} = ${(s.content[i] ?? []).map((id) => byId.get(id)!.name).join(", ")}`).join(" | ")}`);
  log("");
  for (const total of s.totals) {
    const input: StackInput = {
      region: R, catalog: exercises, week: 1, slots, store, goal: s.goal, gymMinutes: s.gymMinutes,
      equipment: { gymAccess: s.access, availableEquipment: gymAccessProfiles[s.access] },
      exclusions: s.exclusions ?? { catalogExerciseIds: [], equipment: [] }, goals: s.goals ?? [], totalPerArm: total,
      leaveOut: s.leaveOut ?? [], includeHolds: s.includeHolds ?? false, now: NOW, keepOneDayFree: s.keepOneDayFree ?? true,
    };
    const runs: number[] = [];
    let r!: StackResult;
    for (let k = 0; k < 5; k += 1) { r = designStack(input); runs.push(r.timings.totalMs); }
    const verified = designStack({ ...input, verifyPlacement: true });
    r = { ...r, timings: { ...r.timings, placement: verified.timings.placement } };
    render(s, total, r);
    log(`Five runs: ${runs.map((x) => x.toFixed(1)).join(", ")} ms.`);
    log("");
    json.push({ scenario: s.id, total, result: { ...r, storeAfter: undefined, days: r.days.map((d) => ({ ...d, slot: d.slot.label })), entries: r.entries.map((e) => ({ ...e, days: e.days.map((d) => ({ ...d, slot: d.slot.label })) })) } });
  }
}

writeFileSync(`${OUT}/stack-prototype-output.md`, lines.join("\n"));
writeFileSync(`${OUT}/stack-prototype-output.json`, JSON.stringify(json, null, 1));
console.log(lines.join("\n"));
