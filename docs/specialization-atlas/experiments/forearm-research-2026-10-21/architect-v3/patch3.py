import sys
p = sys.argv[1]
s = open(p).read()
R = "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/"
s = s.replace('"/home/user/Sports-genome/', '"' + R)
s = s.replace('forearm-v2/architect-v2"', 'forearm-v2/architect-v3"')
def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f"expected {count} got {n}: {old[:100]!r}")
    s = s.replace(old, new)
rep("""const both = (id: string, subject: { nodeId?: string; actionId?: string }, metric: SpecializationGoal["metric"], target: number) => [goal(`${id}:left`, subject, "left", metric, target), goal(`${id}:right`, subject, "right", metric, target)];""",
"""// Both arms as one: a target is saved once (stored side "right", as main writes it).
const both = (id: string, subject: { nodeId?: string; actionId?: string }, metric: SpecializationGoal["metric"], target: number) => [goal(id, subject, "right", metric, target)];""")
rep("""      goal("sup:left", { actionId: "forearm.supination" }, "left", "direct_dynamic_bouts", 6),""", """      ...both("sup", { actionId: "forearm.supination" }, "direct_dynamic_bouts", 6),""")
rep("""    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", totals: [null, 8, 16, 30],
  },""", """    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", totals: [null, 8, 16, 30, 40],
  },
  {
    id: "A-holds", title: "Plan A, holds on", days: 3,
    content: [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186, 132]],
    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", includeHolds: true, totals: [null],
  },
  {
    id: "A-carry", title: "Plan A plus a Farmer's Walk (299) on Day 02, holds off (critic evidence #2)", days: 3,
    content: [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121, 299], [173, 2, 54, 186, 132]],
    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", totals: [null],
  },
  {
    id: "A-zercher", title: "Plan A with the Hammer Curl replaced by a Zercher Carry (300), holds off (critic evidence #3)", days: 3,
    content: [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186, 300]],
    goal: "Muscle growth", gymMinutes: 60, access: "Commercial gym", totals: [null],
  },""")
rep("""targets: FCU 8 direct dynamic bouts both arms, FDS 120 s holds both arms, supination 6 on the left arm only""", """targets (both arms as one): FCU 8 direct dynamic bouts, FDS 120 s of holds, supination 6""")
rep("""    goal: "Max strength", gymMinutes: 30, access: "Bodyweight only", includeHolds: true, totals: [null, 12],""", """    goal: "Max strength", gymMinutes: 30, access: "Bodyweight only", includeHolds: true, totals: [null, 12],
  },
  {
    id: "B-strength", title: "Plan B's week and targets under Max strength (the 120 s target in 30 s holds)", days: 4,
    content: [[1, 43, 103, 57, 121, 150], [161, 186, 171, 194, 221], [5, 47, 66, 111, 148, 123], [41, 173, 206, 195, 222]],
    goal: "Max strength", gymMinutes: 75, access: "Commercial gym",
    goals: [...both("fcu", { nodeId: "forearm.fcu" }, "direct_dynamic_bouts", 8), ...both("fds-hold", { nodeId: "forearm.fds" }, "deliberate_hold_seconds", 120), ...both("sup", { actionId: "forearm.supination" }, "direct_dynamic_bouts", 6)],
    totals: [null],""")
rep("""  log(`Stepper: ${r.stepper.min}–${r.stepper.max} (fits the ${s.gymMinutes}-min days: about ${r.stepper.fitsTime}); start value ${r.startValue}; this run ${r.totalPerArm}. Already planned: ${r.existingDirectPerArm.right} right / ${r.existingDirectPerArm.left} left. Added ${r.added}; left unplanned ${r.leftUnplanned}.`);""",
"""  const ck = (globalThis as any).__lastCheck;
  log(`Stepper (direct moving sets): ${r.stepper.min}–${r.stepper.max} (fits the ${s.gymMinutes}-min days: about ${r.stepper.fitsTime}); start value ${r.startValue}; this run ${r.totalPerArm}. Plan's own direct moving sets ${r.existingDirectPerArm.right}. Added moving ${r.added}; left unplanned ${r.leftUnplanned}. Holds (apart, never in the total): ${ck.holdsBefore} → ${ck.holdsAfter}.`);""")
rep("""  log("| Day | Plan's own (min) | Stack adds | After (min) |");
  log("|---|---:|---|---:|");
  for (const d of r.days) log(`| ${d.slot.label} | ${d.minutesBefore} | ${d.added.join("; ") || "nothing"} | ${d.minutesAfter}${d.overWindow ? " (over window)" : ""} |`);""",
"""  log("| Day | Exercises | Plan's own (min) | Stack adds | After (min, Plan's estimate) | + second arm (min) |");
  log("|---|---|---:|---|---:|---:|");
  for (const d of r.days) log(`| ${d.slot.label} | ${d.exercisesBefore} → ${d.exercisesAfter} | ${d.minutesBefore} | ${d.added.join("; ") || "nothing"} | ${d.minutesAfter}${d.overWindow ? " (over window)" : ""} | ${d.secondArm} |`);""")
rep("""  log(`Check (app calculator, planned, Plan Week 1): direct forearm bouts right ${r.check.right.before} → ${r.check.right.after}, left ${r.check.left.before} → ${r.check.left.after}; target muscles with direct work ${r.check.musclesWithDirect.before} → ${r.check.musclesWithDirect.after} of 19; largest deliberate-hold seconds on one muscle (right) ${r.check.holdSecondsRight.before} → ${r.check.holdSecondsRight.after}.`);""",
"""  log(`Check (reconcile's calculator, side both, planned, Plan Week 1): direct moving sets ${ck.movingBefore} → ${ck.movingAfter} (the total: ${r.totalPerArm - r.leftUnplanned}); direct holds ${ck.holdsBefore} → ${ck.holdsAfter}; target muscles with direct moving work ${ck.movingMusclesBefore} → ${ck.movingMusclesAfter} of 19; with any direct work (moving or hold) ${ck.anyMusclesBefore} → ${ck.anyMusclesAfter}; largest deliberate-hold seconds on one muscle ${r.check.holdSecondsRight.before} → ${r.check.holdSecondsRight.after}.`);""")
open(p, "w").write(s)
print("patch3 ok")
