import sys
p = sys.argv[1]
s = open(p).read()
def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f"expected {count} got {n}: {old[:100]!r}")
    s = s.replace(old, new)

rep("""  const existing = { left: directBoutsOnArm(region, before.left).size, right: directBoutsOnArm(region, before.right).size };
  const existingPerArm = Math.max(existing.left, existing.right);
  const covered = { left: coveredPairs(before.left), right: coveredPairs(before.right) };""",
"""  const beforeWork = directWork(region, before.both);
  const existingPerArm = beforeWork.moving.size;
  const existing = { left: existingPerArm, right: existingPerArm };
  const coveredBoth = coveredPairs(before.both);""")

rep("""  const progress = [...before.left.goals, ...before.right.goals];""", """  const progress = [...before.both.goals];""")
rep("""    const units = goal.metric === "deliberate_hold_seconds" ? Math.ceil(shortfall / (input.goal === "Max strength" ? HOLD_SECONDS.str : HOLD_SECONDS.hyp)) : Math.ceil(shortfall);
    needs.push({ key: `t:${key}`, kind: "target", label: `${subject}: your target, ${shortfall} short (${goal.metric.replace(/_/g, " ")}, ${sides.join(" and ")})`, units, goal, tier: 0 });""",
"""    const units = goal.metric === "deliberate_hold_seconds" ? Math.ceil(shortfall / STACK_RULES.targetHoldSeconds) : Math.ceil(shortfall);
    needs.push({ key: `t:${key}`, kind: "target", label: `${subject}: your target, ${shortfall} short (${goal.metric.replace(/_/g, " ")})`, units, goal, tier: 0 });""")
rep("""  if (Array.from(byTarget.values()).some((t) => t.sides.length === 1) && byTarget.size) notes.push("A target on one arm only is planned for both: a plan's one-arm sets are each side (design §3), so the plan cannot hold one-arm-only work.");
""", "")

rep("""  for (const pair of [...covered.left, ...covered.right]) withDirect.add(pair.split("|")[0]);
  for (const na of primes) {
    const pair = `${na.nodeId}|${na.actionId}`;
    if (covered.left.has(pair) && covered.right.has(pair)) continue;
    const anyReviewed = all.some((c) => c.covers.has(pair));
    const anyUsable = usable.some((c) => c.covers.has(pair));
    const label = `${actionLabel(na.actionId)} (${nodeName(na.nodeId)})`;
    if (!anyReviewed) { notInStack.push(`${label}: no reviewed exercise trains it directly.`); continue; }""",
"""  for (const pair of coveredBoth) if (pair.endsWith("|move")) withDirect.add(pair.split("|")[0]);
  const holdsOn = input.includeHolds || holdGoals.length > 0;
  for (const na of primes) for (const mode of (holdsOn ? ["move", "hold"] : ["move"])) {
    const pair = `${na.nodeId}|${na.actionId}|${mode}`;
    if (coveredBoth.has(pair)) continue;
    const anyReviewed = all.some((c) => c.covers.has(pair));
    const anyUsable = usable.some((c) => c.covers.has(pair));
    const label = `${actionLabel(na.actionId)}${mode === "hold" ? " (hold)" : ""} (${nodeName(na.nodeId)})`;
    if (!anyReviewed) { if (mode === "move") notInStack.push(`${label}: no reviewed exercise trains it directly.`); continue; }""")

rep("""    || Number(plannedIds.has(a.exercise.id)) - Number(plannedIds.has(b.exercise.id)) // not already in the week
    || a.sidesPerformed - b.sidesPerformed""", """    || Number(plannedIds.has(a.exercise.id)) - Number(plannedIds.has(b.exercise.id)) // not already in the week
    || Number(a.isCarry) - Number(b.isCarry) // not a whole-body task
    || a.sidesPerformed - b.sidesPerformed""")

# allocation split
rep("""  const avgMin = ordered.length ? ordered.reduce((s, c) => s + minutesPerArmSet(c), 0) / ordered.length : 2.55;
  const fitsTime = existingPerArm + Math.max(0, Math.floor([...room].sort((a, b) => b - a).slice(0, usableDays).reduce((s, r) => s + Math.max(0, r), 0) / avgMin));
""", """  const movingOrdered = ordered.filter((c) => !c.isHold);
  const holdOrdered = ordered.filter((c) => c.isHold);
  const avgMin = 2.55;
""")
rep("""    const k = Math.min(Math.floor(budget / floor), capacity, ordered.length);
    const kept = ordered.slice(0, k);""", """    const k = Math.min(Math.floor(budget / floor), capacity, movingOrdered.length);
    const kept = movingOrdered.slice(0, k);""")
rep("""        const open = kept.filter((c) => canAdd(c) && !onlyMetTargets(remaining, c));""", """        const open = kept.filter((c) => canAdd(c) && !onlyMetTargets(remaining, c) && !c.coverageOnly);""")
rep("""    return { kept, sets, remaining, left: budget, cut: ordered.slice(k) };
  };""", """    return { kept, sets, remaining, left: budget, cut: movingOrdered.slice(k) };
  };
  /** Holds, outside the total: the floor each, plus what a hold target asks, at most the weekly cap. */
  const holdAllocate = (cap: number) => {
    const kept = holdOrdered.slice(0, Math.max(0, Math.min(holdOrdered.length, cap)));
    const sets = new Map<number, number>(kept.map((c) => [c.exercise.id, floor] as const));
    const remaining = new Map(needs.filter((n) => n.kind === "target" && n.goal!.metric !== "direct_dynamic_bouts").map((n) => [n.key, n.units] as const));
    for (const c of kept) for (const n of needs) if (remaining.has(n.key) && fills(c, n)) remaining.set(n.key, remaining.get(n.key)! - floor);
    for (let guard = 0; guard < 100; guard += 1) {
      const open = Array.from(remaining.entries()).filter(([, u]) => u > 0).map(([key]) => key);
      const pick = kept.find((c) => sets.get(c.exercise.id)! < weekCap && needs.some((n) => open.includes(n.key) && fills(c, n)));
      if (!pick) break;
      sets.set(pick.exercise.id, sets.get(pick.exercise.id)! + 1);
      for (const n of needs) if (open.includes(n.key) && fills(pick, n)) remaining.set(n.key, remaining.get(n.key)! - 1);
    }
    return { kept, sets, remaining, cut: holdOrdered.slice(kept.length) };
  };""")

rep("""  const needAll = allocate(10_000, false);
  const needed = Array.from(needAll.sets.values()).reduce((s, v) => s + v, 0);
  const startValue = Math.max(existingPerArm, Math.min(existingPerArm + needed, fitsTime));
  const stepper = { min: existingPerArm, max: Math.min(STACK_RULES.stepperMax, existingPerArm + STACK_RULES.maxSetsPerExercisePerDay * Math.min(capacity, 2 * ordered.length)), fitsTime };""",
"""  const needAll = allocate(10_000, false);
  const needed = Array.from(needAll.sets.values()).reduce((s, v) => s + v, 0);
  const holdPreview = holdAllocate(capacity - needAll.kept.length);
  const holdMinutes = Array.from(holdPreview.sets.values()).reduce((s, v) => s + v, 0) * avgMin;
  const fitsTime = existingPerArm + Math.max(0, Math.floor(([...room].sort((a, b) => b - a).slice(0, usableDays).reduce((s, r) => s + Math.max(0, r), 0) - holdMinutes) / avgMin));
  const startValue = Math.max(existingPerArm, Math.min(existingPerArm + needed, fitsTime));
  const most = allocate(10_000, true);
  const stepper = { min: existingPerArm, max: Math.min(STACK_RULES.stepperMax, existingPerArm + Array.from(most.sets.values()).reduce((s, v) => s + v, 0)), fitsTime };""")

rep("""  const alloc = allocate(total - existingPerArm, true);
  const { kept, sets, remaining } = alloc;""", """  const alloc = allocate(total - existingPerArm, true);
  const holdAlloc = holdAllocate(capacity - alloc.kept.length);
  const kept = [...alloc.kept, ...holdAlloc.kept];
  const sets = new Map<number, number>([...alloc.sets, ...holdAlloc.sets]);
  const remaining = new Map<string, number>([...alloc.remaining]);
  for (const [k2, v] of holdAlloc.remaining) remaining.set(k2, v);""")

# prescriptions: hold length
rep("""export function prescriptionFor(family: TaskFamily, goal: TrainingGoal, sets: number): { text: string; holdSeconds: number | null; note: string | null } {
  const strength = goal === "Max strength";
  if (family === "isometric_grip" || family === "hold_other") {
    const seconds = strength ? HOLD_SECONDS.str : HOLD_SECONDS.hyp;""", """export function prescriptionFor(family: TaskFamily, goal: TrainingGoal, sets: number, forSecondsTarget = false): { text: string; holdSeconds: number | null; note: string | null } {
  const strength = goal === "Max strength";
  if (family === "isometric_grip" || family === "hold_other") {
    const seconds = forSecondsTarget ? 30 : strength ? HOLD_SECONDS.str : HOLD_SECONDS.hyp;""")
rep("""    const rx = prescriptionFor(ch.c.family, input.goal, ch.sets);""", """    const rx = prescriptionFor(ch.c.family, input.goal, ch.sets, servesSeconds(ch.c));""")
rep("""  const changes: SpecializationPlanChange[] = [];
  const entries = new Map<number, StackEntry>();""", """  const servesSeconds = (c: Candidate) => needs.some((n) => n.kind === "target" && n.goal!.metric === "deliberate_hold_seconds" && fills(c, n));
  const changes: SpecializationPlanChange[] = [];
  const entries = new Map<number, StackEntry>();""")
rep("""      reasons: needs.filter((n) => fills(ch.c, n)).map((n) => n.label),""", """      reasons: [`Direct ${ch.c.isHold ? "hold" : "moving"} work for ${Array.from(ch.c.directNodes).filter((id) => index.nodeById.get(id)?.role === "target").map((id) => index.nodeById.get(id)?.shortName ?? id).join(", ")}${ch.c.coverageOnly ? " (coverage only: stays at its floor unless you raise it)" : ""}`, ...needs.filter((n) => fills(ch.c, n)).map((n) => n.label)],""")

# check
rep("""  const after = plannedSummaries(input, storeAfter);
  const reached = (s: SpecializationSummary) => s.nodes.filter((n) => index.nodeById.get(n.nodeId)?.role === "target" && n.directDynamicBouts + n.deliberateHoldBouts > 0).length;
  const holdSeconds = (s: SpecializationSummary) => Math.max(0, ...s.nodes.map((n) => n.deliberateHoldSeconds));
  const afterCovered = coveredPairs(after.right);
  const remainingGaps = primes.map((na) => `${na.nodeId}|${na.actionId}`).filter((pair) => !afterCovered.has(pair)).map((pair) => { const [node, action] = pair.split("|"); return `${actionLabel(action)} (${nodeName(node)})`; });
  const targets = [...after.left.goals, ...after.right.goals].map((p) => `${p.goal.nodeId ?? p.goal.actionId} ${p.goal.side} ${p.goal.metric}: ${p.label}`);""",
"""  const after = plannedSummaries(input, storeAfter);
  const reachedMoving = (s: SpecializationSummary) => new Set(Array.from(coveredPairs(s)).filter((k2) => k2.endsWith("|move")).map((k2) => k2.split("|")[0])).size;
  const reached = (s: SpecializationSummary) => new Set(Array.from(coveredPairs(s)).map((k2) => k2.split("|")[0])).size;
  const holdSeconds = (s: SpecializationSummary) => Math.max(0, ...s.nodes.map((n) => n.deliberateHoldSeconds ?? 0));
  const afterCovered = coveredPairs(after.both);
  const remainingGaps = primes.map((na) => `${na.nodeId}|${na.actionId}|move`).filter((pair) => !afterCovered.has(pair)).map((pair) => { const [node, action] = pair.split("|"); return `${actionLabel(action)} (${nodeName(node)})`; });
  const targets = [...after.both.goals].map((p) => `${p.goal.nodeId ?? p.goal.actionId} ${p.goal.metric}: ${p.label}`);
  const afterWork = directWork(region, after.both);
  (globalThis as any).__lastCheck = { movingBefore: beforeWork.moving.size, movingAfter: afterWork.moving.size, holdsBefore: beforeWork.holds.size, holdsAfter: afterWork.holds.size, movingMusclesBefore: reachedMoving(before.both), movingMusclesAfter: reachedMoving(after.both), anyMusclesBefore: reached(before.both), anyMusclesAfter: reached(after.both) };""")
rep("""    const minutesAfter = minutesBefore + addedHere.reduce((s, x) => s + x.ch.sets * minutesPerArmSet(x.ch.c), 0);
    return { slot, minutesBefore, minutesAfter: Math.round(minutesAfter), added:""", """    const minutesAfter = minutesBefore + addedHere.reduce((s, x) => s + x.ch.sets * minutesPerArmSet(x.ch.c), 0);
    const secondArm = addedHere.reduce((s, x) => s + (x.ch.c.sidesPerformed === 2 ? x.ch.sets * STACK_RULES.minutesPerPerformedSet : 0), 0);
    return { slot, minutesBefore, secondArm: Math.round(secondArm), exercisesBefore: (input.store.plan[slot.key] ?? []).length, exercisesAfter: (input.store.plan[slot.key] ?? []).length + addedHere.length, minutesAfter: Math.round(minutesAfter), added:""")
rep("""      left: { before: existing.left, after: directBoutsOnArm(region, after.left).size },
      right: { before: existing.right, after: directBoutsOnArm(region, after.right).size },
      musclesWithDirect: { before: reached(before.right), after: reached(after.right) },
      holdSecondsRight: { before: holdSeconds(before.right), after: holdSeconds(after.right) },""", """      left: { before: existingPerArm, after: afterWork.moving.size },
      right: { before: existingPerArm, after: afterWork.moving.size },
      musclesWithDirect: { before: reachedMoving(before.both), after: reachedMoving(after.both) },
      holdSecondsRight: { before: holdSeconds(before.both), after: holdSeconds(after.both) },""")
rep("""  days: { slot: DaySlot; minutesBefore: number; minutesAfter: number; added: string[]; overWindow: boolean }[];""", """  days: { slot: DaySlot; minutesBefore: number; minutesAfter: number; secondArm: number; exercisesBefore: number; exercisesAfter: number; added: string[]; overWindow: boolean }[];""")
open(p, "w").write(s)
print("patch2 ok")
