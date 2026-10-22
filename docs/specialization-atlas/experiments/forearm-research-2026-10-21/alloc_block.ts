  // ---------------------------------------------------------------- targets (the athlete's own; never created or raised here)
  const summaryFor = (side: string) => (side === "left" ? left : right).summary;
  const goalGap = (goal: SpecializationGoal) => {
    const progress = summaryFor(goal.side).goals.find((p) => p.goal.id === goal.id) ?? null;
    return progress ? Math.max(0, goal.target - progress.value) : 0;
  };
  const servesGoal = (pick: Pick, goal: SpecializationGoal) => {
    const wanted = goal.metric === "direct_dynamic_bouts" ? "dynamic" : "hold";
    return pick.unit.mode === wanted && pick.unit.slots.some((slot) => (goal.nodeId ? slot.nodeId === goal.nodeId : slot.actionId === goal.actionId));
  };
  // A hold that answers a seconds target is written at the top of the package's range as one number ("3 × 30 sec"):
  // the plan counts a range's low end (planBouts plannedTarget), so a range would need three times the sets.
  const holdSecondsFor = (pick: Pick) => {
    const profile = repProfiles.isometric_grip;
    return (input.goal === "Max strength" ? profile.strength_practice_hold_seconds! : profile.hypertrophy_hold_seconds!)[1];
  };
  // Sets each target needs; one subject (muscle or movement + metric) takes the larger of its two arms' needs.
  const needBySubject = new Map<string, { sets: number; goal: SpecializationGoal; sides: Set<string> }>();
  for (const goal of input.goals) {
    const gap = goalGap(goal);
    if (gap <= 0) continue;
    const able = picks.filter((pick) => servesGoal(pick, goal));
    if (!able.length) { shortfalls.push(`No reviewed exercise in this stack counts toward your ${goal.side}-arm target of ${goal.target} ${goal.metric.replace(/_/g, " ")} for ${goal.nodeId ?? goal.actionId}${model.gapSlots.some((g) => g.slot.nodeId === goal.nodeId) ? " (no reviewed exercise trains its main action directly)" : ""}.`); continue; }
    const sets = goal.metric === "deliberate_hold_seconds" ? Math.ceil(gap / holdSecondsFor(able[0])) : Math.ceil(gap);
    for (const pick of able) if (goal.metric === "deliberate_hold_seconds") pick.secondsTarget = holdSecondsFor(pick);
    const subject = `${goal.nodeId ?? goal.actionId}|${goal.metric}`;
    const was = needBySubject.get(subject);
    if (was && was.sets !== sets) notes.push(`Your left and right targets for ${goal.nodeId ?? goal.actionId} need different amounts; the plan writes both arms alike, so it follows the larger (${Math.max(sets, was.sets)} sets) and the other arm gets more than its target. Extra sets for one arm only cannot be planned yet.`);
    needBySubject.set(subject, { sets: Math.max(sets, was?.sets ?? 0), goal: was && was.sets >= sets ? was.goal : goal, sides: new Set([...(was?.sides ?? []), goal.side]) });
  }

  // ---------------------------------------------------------------- allocation of the athlete's total
  const capOf = () => input.maxSetsPerSession * maxSessions;
  const slotCapacity = eligible.length * input.maxExercisesPerDay;
  const minuteCapacity = eligible.length * input.minutesPerDay;
  type Run = { sets: Map<Pick, number>; reasons: Map<Pick, string[]>; shortfalls: string[]; leftover: number };
  const sessionsOf = (sets: number) => Math.ceil(sets / input.maxSetsPerSession);
  const allocate = (budgetIn: number, stopAfterCoverage: boolean): Run => {
    const sets = new Map<Pick, number>(picks.map((p) => [p, 0] as const));
    const reasons = new Map<Pick, string[]>(picks.map((p) => [p, []] as const));
    const out: string[] = [];
    let budget = budgetIn;
    const sessions = () => picks.reduce((sum, p) => sum + sessionsOf(sets.get(p)!), 0);
    const minutes = () => picks.reduce((sum, p) => sum + sets.get(p)! * minutesPerSet(p.candidate.variant), 0);
    // A set may open a new session only while the allowed days have room for one more forearm exercise.
    const roomFor = (p: Pick) => sets.get(p)! < capOf() && (sets.get(p)! % input.maxSetsPerSession !== 0 || sessions() < slotCapacity);
    const give = (p: Pick, why: string) => { sets.set(p, sets.get(p)! + 1); budget -= 1; if (!reasons.get(p)!.includes(why)) reasons.get(p)!.push(why); };
    // 1. Targets: one set at a time to the target furthest from met, onto the movement that serves it with the least direct work so far.
    const remaining = new Map(Array.from(needBySubject.entries()).map(([k, v]) => [k, v.sets] as const));
    while (budget > 0 && Array.from(remaining.values()).some((n) => n > 0)) {
      const [subject] = Array.from(remaining.entries()).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      const goal = needBySubject.get(subject)!.goal;
      const able = picks.filter((p) => servesGoal(p, goal) && roomFor(p));
      if (!able.length) { out.push(`Your target for ${goal.nodeId ?? goal.actionId} needs ${remaining.get(subject)} more set(s) than ${plural(maxSessions, "day")} of at most ${input.maxSetsPerSession} sets, within ${input.maxExercisesPerDay} forearm exercises a day, can hold.`); remaining.set(subject, 0); continue; }
      const p = able.sort((a, b) => a.existing + sets.get(a)! - (b.existing + sets.get(b)!) || a.unit.order - b.unit.order)[0];
      give(p, "your target");
      remaining.set(subject, remaining.get(subject)! - 1);
    }
    const short = Array.from(remaining.values()).reduce((a, b) => a + b, 0);
    if (short > 0) out.push(`Your targets need ${short} more set${short === 1 ? "" : "s"} than this total leaves. Raise the total by ${short} to meet them; nothing is raised for you.`);
    // 2. Coverage: one set for each movement with no direct work, the movement reaching the most main actions first.
    const order = [...picks].sort((a, b) => b.unit.slots.length - a.unit.slots.length || a.unit.order - b.unit.order);
    for (const p of order) {
      if (budget <= 0) break;
      if (p.existing + sets.get(p)! > 0) continue;
      if (!roomFor(p)) continue;
      give(p, "no direct work this week");
    }
    const uncovered = picks.filter((p) => p.existing + sets.get(p)! === 0);
    if (uncovered.length) {
      const why = budget <= 0 ? `Raise the total by ${uncovered.length} to reach them.` : `${plural(eligible.length, "allowed day")} with ${input.maxExercisesPerDay} forearm exercises each hold ${slotCapacity}; allow another day or more exercises a day.`;
      out.push(`${plural(uncovered.length, "movement")} still get${uncovered.length === 1 ? "s" : ""} no direct work: ${uncovered.map((p) => p.unit.label.toLowerCase()).join(", ")}. ${why}`);
    }
    // 3. Even share: one set at a time to the movement with the least direct work so far, within the minutes chosen.
    while (!stopAfterCoverage && budget > 0) {
      const open = picks.filter((p) => roomFor(p) && minutes() + minutesPerSet(p.candidate.variant) <= minuteCapacity);
      if (!open.length) break;
      const p = open.sort((a, b) => a.existing + sets.get(a)! - (b.existing + sets.get(b)!) || b.unit.slots.length - a.unit.slots.length || a.unit.order - b.unit.order)[0];
      give(p, "even share");
    }
    if (!stopAfterCoverage && budget > 0) out.push(`${plural(budget, "set")} did not fit in ${Math.round(minuteCapacity)} min a week (${input.minutesPerDay} a day on ${plural(eligible.length, "day")}), at most ${input.maxSetsPerSession} sets of one exercise a day and never on two days in a row.`);
    return { sets, reasons, shortfalls: out, leftover: budget };
  };
  // The starting total: the plan's own direct sets, plus what the targets and one set per uncovered movement need.
  const coverageRun = allocate(10_000, true);
  const startingTotal = existingDirect + (10_000 - coverageRun.leftover);
  const capacityRun = allocate(10_000, false);
  const maxTotal = existingDirect + (10_000 - capacityRun.leftover);
  const total = input.totalSets ?? startingTotal;
  if (total < existingDirect) notes.push(`Your plan already has ${existingDirect} direct forearm sets a week, more than the ${total} chosen. The designer never removes the plan's own exercises, so it adds nothing.`);
  const run = allocate(Math.max(0, total - existingDirect), false);
  for (const p of picks) { p.sets = run.sets.get(p)!; p.reasons = run.reasons.get(p)!; }
  shortfalls.push(...run.shortfalls);
  const dayCap = slotCapacity;
  void dayCap;

