import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { exercises as catalog, type Exercise } from "@/lib/exerciseCatalog";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, emptyDayStore, commitDay, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getWorkoutDiagnostics, type TrainingGoal } from "@/lib/workoutPlanner";
import { forearmRegionData as region } from "@shared/specialization/regions/forearm/index";
import type { SpecializationGoal } from "@shared/specialization/types";
import { applyAll, buildModel, designStack, equipmentFor, minutesPerSet, plannedSummary, previewOf, textFor, type StackInput } from "./stackDesigner";

const OUT = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/forearm-v2/";
const byId = new Map(catalog.map((e) => [e.id, e] as const));
const model = buildModel(region);

/** A plan week stored as Home stores it (Home.specializationJourney.test.ts: weeklyPlanEntries by `${index}-${day}` with entryId = catalogExerciseId). */
function planOf(days: number, content: (number | [number, string])[][]): { slots: ReturnType<typeof buildDaySlots>; store: WeeklyDayStore } {
  const slots = buildDaySlots(splitDaysForFrequency(days));
  let store = emptyDayStore();
  slots.forEach((slot, i) => {
    const items = content[i] ?? [];
    const workout: Exercise[] = items.map((item) => byId.get(Array.isArray(item) ? item[0] : item)!);
    const prescriptions: Record<number, string> = {};
    for (const item of items) if (Array.isArray(item)) prescriptions[item[0]] = item[1];
    store = commitDay(store, slot.key, { workout, prescriptions, settings: {}, context: [] });
  });
  return { slots, store };
}

const goalRow = (id: string, side: "left" | "right", nodeId: string, metric: SpecializationGoal["metric"], target: number): SpecializationGoal => ({ id, regionId: "forearm", nodeId, actionId: null, side, metric, target, period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" });

type Scenario = { id: string; title: string; days: number; content: (number | [number, string])[][]; goal: TrainingGoal; gymMinutes: number; access: Parameters<typeof equipmentFor>[0]; goals?: SpecializationGoal[]; over?: Partial<StackInput> };

const fullBody3: Scenario["content"] = [
  [161, 1, 43, 111],       // Back Squat, Barbell Bench Press, Barbell Bent-Over Row, Dumbbell Lateral Raise
  [42, 101, 57, 123],      // Romanian Deadlift, Barbell Overhead Press, Lat Pulldown, Dumbbell Curl
  [169, 5, 54, 150],       // Leg Press, Incline Dumbbell Bench Press, Seated Cable Row, Cable Triceps Pushdown
];
const upperLower4: Scenario["content"] = [
  [1, 43, 101, 66, [132, "3 × 8–12"], 148],          // Upper A: bench, row, OHP, pull-up, hammer curl, skull crusher
  [161, 42, 171, 194, 221],                          // Lower A
  [5, 54, 103, 57, 123, 150],                        // Upper B
  [41, 163, 173, 206, [299, "3 × 30 sec"]],          // Lower B: deadlift, front squat, split squat, hip thrust, farmer's walk
];
const split5: Scenario["content"] = [
  [1, 101, 5, 111, 150],                             // Push
  [41, 66, 43, 87, 121, [139, "3 × 12–15"]],         // Pull: deadlift, pull-up, row, face pull, barbell curl, wrist curl
  [161, 42, 169, 194, 221],                          // Legs
  [4, 54, 103, 57, 132],                             // Upper: hammer curl
  [286, 271, 177, 299],                              // Sport Transfer: box jump, med-ball chest pass, walking lunge, farmer's walk
];

const base = { maxExercisesPerDay: 4, maxSetsPerSession: 3, minutesPerDay: 15, includeHolds: false };
const scenarios: Scenario[] = [
  { id: "P1", title: "3-day full body (slots Day 01 Push, Day 02 Pull, Day 03 Legs, as the app names a 3-day week), Muscle growth, 60 min, commercial gym, no targets, starting total", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym" },
  { id: "P2", title: "4-day upper/lower, Max strength, 75 min, commercial gym; targets: ECU 6 direct dynamic bouts (both arms), FDS 120 s deliberate holds (right 120, left 90)", days: 4, content: upperLower4, goal: "Max strength", gymMinutes: 75, access: "Commercial gym", goals: [goalRow("g1", "right", "forearm.ecu", "direct_dynamic_bouts", 6), goalRow("g2", "left", "forearm.ecu", "direct_dynamic_bouts", 6), goalRow("g3", "right", "forearm.fds", "deliberate_hold_seconds", 120), goalRow("g4", "left", "forearm.fds", "deliberate_hold_seconds", 90)] },
  { id: "P3", title: "5-day split (Push, Pull, Legs, Upper, Sport Transfer), Athleticism, 60 min, small gym, total 20 sets, holds on", days: 5, content: split5, goal: "Athleticism", gymMinutes: 60, access: "Small gym", over: { totalSets: 20, includeHolds: true } },
  // Failure and edge cases
  { id: "F1", title: "P1 with a low total (existing + 5)", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", over: { totalSets: 5 } },
  { id: "F2", title: "P1 with a high total (40)", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", over: { totalSets: 40 } },
  { id: "F3", title: "P1 with one day kept free (Day 01 and Day 03 only), 3 exercises a day", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", over: { allowedDays: ["0-Push", "2-Legs"], maxExercisesPerDay: 3 } },
  { id: "F4", title: "P1, bodyweight only", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Bodyweight only" },
  { id: "F5", title: "2-day upper/lower, total 16", days: 2, content: [[1, 43, 101, 66], [161, 42, 171, 194]], goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", over: { totalSets: 16 } },
  { id: "F6", title: "P1, at home, Band and the gripper left out by the athlete", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "At home", over: { exclusions: { catalogExerciseIds: [402], equipment: ["Band"] } } },
  { id: "F7", title: "P1 with a target nothing can fill (palmaris longus, 4 direct dynamic bouts)", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", goals: [goalRow("g5", "right", "forearm.pl", "direct_dynamic_bouts", 4)] },
  { id: "F8", title: "P1, 10 minutes a day", days: 3, content: fullBody3, goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", over: { minutesPerDay: 10 } },
];

const lines: string[] = [];
const say = (s = "") => lines.push(s);
const nodeName = (id: string) => region.nodes.find((n) => n.id === id)?.name ?? id;

say("# Stack designer prototype: output on the real forearm data");
say("");
say(`Model from forearm_mappings_v1 (reviewed only): ${model.slots.length} main-action slots on the 19 target muscles; ${model.units.filter((u) => u.mode === "dynamic").length} moving units, ${model.units.filter((u) => u.mode === "hold").length} hold units; ${model.gapSlots.length} slots with no reviewed direct exercise.`);
say("");
say("| Unit | Mode | Main actions (muscle:action) | Reviewed candidates |");
say("|---|---|---|---|");
for (const unit of model.units) say(`| ${unit.label} | ${unit.mode} | ${unit.slots.map((s) => `${s.nodeId.replace("forearm.", "")}:${s.actionId}`).join(", ")} | ${unit.candidates.map((c) => `${c.exercise.name} (${c.exercise.id}, ${c.exercise.equipment}, ${c.variant.laterality})`).join("; ")} |`);
say("");
say("Gap slots: " + model.gapSlots.map((g) => `${g.slot.nodeId.replace("forearm.", "")}:${g.slot.actionId} (helpers: ${g.helpers.join(", ") || "none"})`).join("; "));
say("");

const timings: string[] = [];
for (const sc of scenarios) {
  const { slots, store } = planOf(sc.days, sc.content);
  const input: StackInput = { model, week: 1, slots, store, goal: sc.goal, gymMinutes: sc.gymMinutes, equipment: equipmentFor(sc.access), exclusions: { catalogExerciseIds: [], equipment: [] }, goals: sc.goals ?? [], ...base, ...sc.over };
  // Runtime: design alone, and design + apply + preview (the two planned summaries the preview runs).
  const runs = 30;
  let t0 = performance.now();
  for (let i = 0; i < runs; i += 1) designStack(input);
  const designMs = (performance.now() - t0) / runs;
  const design = designStack(input);
  t0 = performance.now();
  let applied = applyAll(store, design.changes);
  for (let i = 0; i < runs; i += 1) { applied = applyAll(store, design.changes); if (applied.ok) previewOf(input, applied.store); }
  const previewMs = (performance.now() - t0) / runs;
  timings.push(`| ${sc.id} | ${design.changes.length} | ${designMs.toFixed(1)} | ${previewMs.toFixed(1)} |`);

  say(`## ${sc.id}: ${sc.title}`);
  say("");
  say("Plan as written: " + slots.map((s) => `${s.label}: ${(store.plan[s.key] ?? []).map((e) => e.name).join(", ") || "(empty)"}`).join(" · "));
  say("");
  say(`Direct forearm sets already planned (distinct bouts, per arm): **${design.existingDirect}**; distinct planned bouts touching any forearm muscle (incidental grip included): ${design.existingAny}. Starting total: **${design.startingTotal}**; most these settings can place: ${design.maxTotal}. Chosen total: ${sc.over?.totalSets ?? design.startingTotal} → designed total **${design.total}** (${design.added} added).`);
  say(`Allowed days: ${design.eligibleDays.join(", ")}.`);
  say("");
  say("| Movement | Exercise | Already planned (direct bouts) | Added sets / week / arm | Why |");
  say("|---|---|---:|---:|---|");
  for (const pick of design.picks) say(`| ${pick.unit.label} | ${pick.candidate.exercise.name} (${pick.candidate.exercise.id}, ${pick.candidate.variant.laterality}) | ${pick.existing} | ${pick.sets} | ${pick.reasons.join(", ") || (pick.sets ? "" : "level already")} |`);
  say("");
  say("| Day | Added (after the plan's own exercises) | Forearm min (est.) | Day total min (est., Plan's formula + forearm) |");
  say("|---|---|---:|---:|");
  for (const slot of slots) {
    const here = design.placements.filter((p) => p.dayKey === slot.key);
    const rec = { workout: store.plan[slot.key] ?? [], prescriptions: store.prescriptions[slot.key] ?? {}, settings: store.settings[slot.key] ?? {} };
    const own = getWorkoutDiagnostics(rec.workout, rec.prescriptions, rec.settings, sc.goal, sc.gymMinutes).estimatedMinutes;
    const fm = here.reduce((s, p) => s + p.minutes, 0);
    say(`| ${slot.label} | ${here.map((p) => `${p.pick.candidate.exercise.name} ${textFor(p.pick, p.sets, sc.goal)}${p.pick.candidate.variant.laterality === "unilateral" ? " each arm" : ""}`).join("; ") || "—"} | ${fm.toFixed(1)} | ${(own + fm).toFixed(0)} |`);
  }
  say("");
  if (design.notes.length) { say("Notes:"); for (const n of design.notes) say(`- ${n}`); say(""); }
  if (design.shortfalls.length) { say("Shortfalls:"); for (const n of design.shortfalls) say(`- ${n}`); say(""); }
  if (design.gaps.length) { say("Not reachable:"); for (const n of design.gaps) say(`- ${n}`); say(""); }

  // Checks
  const checks: string[] = [];
  if (!applied.ok) checks.push(`APPLY REFUSED: ${applied.reason}`);
  else {
    const after = applied.store;
    // Plan's own entries untouched, in order, with their prescriptions.
    for (const slot of slots) {
      const before = store.plan[slot.key] ?? [];
      const afterDay = after.plan[slot.key] ?? [];
      const same = before.every((e, i) => afterDay[i]?.id === e.id) && before.every((e) => (store.prescriptions[slot.key] ?? {})[e.id] === (after.prescriptions[slot.key] ?? {})[e.id]);
      if (!same) checks.push(`plan's own entries changed on ${slot.label}`);
    }
    const undone = applied.undo(after);
    const eq = JSON.stringify(undone.plan) === JSON.stringify(store.plan) && JSON.stringify(undone.prescriptions) === JSON.stringify(store.prescriptions);
    checks.push(eq ? "Undo restores the week exactly" : "UNDO MISMATCH");
    const prev = previewOf(input, after);
    const r = plannedSummary(region, 1, slots, after, sc.goal, "right", input.goals).summary;
    const l = plannedSummary(region, 1, slots, after, sc.goal, "left", input.goals).summary;
    const directAfter = (sum: typeof r) => new Set(sum.nodes.filter((n) => model.targetNodes.has(n.nodeId)).flatMap((n) => n.contributions.filter((c) => c.countedSide === sum.side && c.parts.some((p) => p.relationship === "direct" && (p.category === "direct_dynamic" || p.category === "deliberate_isometric"))).map((c) => c.boutId))).size;
    checks.push(`direct forearm bouts after: right ${directAfter(r)}, left ${directAfter(l)} (designed ${design.total})`);
    checks.push(`region distinct bouts (any credit) before → after: ${prev.regionDistinctBouts.before} → ${prev.regionDistinctBouts.after}`);
    // Same exercise on consecutive days?
    const byEx = new Map<number, number[]>();
    for (const p of design.placements) byEx.set(p.pick.candidate.exercise.id, [...(byEx.get(p.pick.candidate.exercise.id) ?? []), slots.find((s) => s.key === p.dayKey)!.index]);
    const consecutive = Array.from(byEx.entries()).filter(([, idx]) => idx.some((a) => idx.includes(a + 1)));
    checks.push(consecutive.length ? `SAME EXERCISE ON CONSECUTIVE DAYS: ${consecutive.map(([id]) => id).join(",")}` : "no exercise on two consecutive days");
    // Same target muscle with direct work (plan's own or added) on two consecutive plan days.
    const directByDay = slots.map((s) => new Set(r.nodes.filter((n) => model.targetNodes.has(n.nodeId) && n.contributions.some((c) => c.countedSide === "right" && c.boutId.split("/")[2] === s.key && c.parts.some((p) => p.relationship === "direct" && (p.category === "direct_dynamic" || p.category === "deliberate_isometric")))).map((n) => nodeName(n.nodeId))));
    const repeats = slots.slice(1).map((s, i) => [s.label, Array.from(directByDay[i + 1]).filter((n) => directByDay[i].has(n))] as const).filter(([, list]) => list.length);
    checks.push(repeats.length ? `same muscle directly loaded on consecutive days: ${repeats.map(([d, list]) => `${d}: ${list.join(", ")}`).join(" | ")}` : "no muscle directly loaded on two consecutive days");
    const perDay = slots.map((s) => design.placements.filter((p) => p.dayKey === s.key).length);
    checks.push(`forearm exercises per day: ${perDay.join(" / ")}`);
    say("Preview (planned, right arm; before → after), per muscle: " + prev.nodes.filter((n) => model.targetNodes.has(n.nodeId) || n.role === "external").map((n) => `${nodeName(n.nodeId)} direct ${n.before.directDynamicBouts}→${n.after.directDynamicBouts}${n.after.deliberateHoldBouts !== n.before.deliberateHoldBouts ? `, holds ${n.before.deliberateHoldBouts}→${n.after.deliberateHoldBouts} (${n.before.deliberateHoldSeconds}→${n.after.deliberateHoldSeconds} s)` : ""}${n.after.contributingDynamicBouts !== n.before.contributingDynamicBouts ? `, helper ${n.before.contributingDynamicBouts}→${n.after.contributingDynamicBouts}` : ""}${n.after.incidentalBouts !== n.before.incidentalBouts ? `, incidental ${n.before.incidentalBouts}→${n.after.incidentalBouts}` : ""}`).join("; "));
    say("");
    const goalsAfter = r.goals.concat(l.goals);
    if (goalsAfter.length) say("Targets after (planned): " + goalsAfter.map((g) => `${g.goal.side} ${g.goal.nodeId} ${g.goal.metric}: ${g.label}`).join("; "));
    const zero = r.nodes.filter((n) => model.targetNodes.has(n.nodeId) && n.directDynamicBouts + n.deliberateHoldBouts === 0).map((n) => nodeName(n.nodeId));
    checks.push(`target muscles with no direct work after: ${zero.join(", ") || "none"}`);
    // Re-design with the same total on the applied plan: must add nothing.
    const again = designStack({ ...input, store: after, totalSets: design.total });
    checks.push(`re-design on the applied week at the same total adds ${again.added} set(s)`);
  }
  say("Checks: " + checks.join("; ") + ".");
  say("");
}

say("## Runtime (sandbox CPU, Node 22, tsx; mean of 30 runs, warm)");
say("");
say("| Scenario | Exercises added | design (ms) | apply + preview (ms) |");
say("|---|---:|---:|---:|");
for (const t of timings) say(t);
say("");
say(`Minutes per set used: bilateral/either ${minutesPerSet({ laterality: "bilateral" } as never).toFixed(2)}, one-arm ${minutesPerSet({ laterality: "unilateral" } as never).toFixed(2)} (workoutPlanner.ts:132 constants, 90 s rest, one-arm work doubled).`);
writeFileSync(OUT + "stack-prototype-output.md", lines.join("\n") + "\n");
console.log(lines.join("\n"));
