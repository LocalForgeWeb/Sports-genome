import sys
p = sys.argv[1]
s = open(p).read()
R = "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/"
s = s.replace('"/home/user/Sports-genome/', '"' + R)
def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f"expected {count} got {n}: {old[:80]!r}")
    s = s.replace(old, new)

# rules
rep("""  /** Typo guard for the stepper, not a safety ceiling. */
  stepperMax: 60,
} as const;""", """  /** Typo guard for the stepper, not a safety ceiling. */
  stepperMax: 60,
  /** A seconds target is filled in holds of this length, whatever the goal (critique: evidence #2). */
  targetHoldSeconds: 30,
  /** Region data in the app (`coverageOnly` on the variant): 05-mappings.md:91, "Small-muscle coverage, not high-volume defaults". */
  coverageOnly: [412, 413, 414] as readonly number[],
} as const;""")

# candidate type
rep("""  sidesPerformed: 1 | 2;
  isHold: boolean;
};""", """  sidesPerformed: 1 | 2;
  isHold: boolean;
  isCarry: boolean;
  coverageOnly: boolean;
};""")

# direct definitions
rep("""const isDirect = (relationship: VariantMapping["relationship"], category: ExposureCategory) => relationship === "direct" && (category === "direct_dynamic" || category === "deliberate_isometric");
const countsAsDirectSet = (category: ExposureCategory) => category === "direct_dynamic" || category === "deliberate_isometric";""",
"""/** "move" for direct moving work, "hold" for a direct deliberate hold; a contributing hold (cat-300 BR) is neither. */
const modeOf = (relationship: VariantMapping["relationship"], category: ExposureCategory): "move" | "hold" | null =>
  category === "direct_dynamic" ? "move" : relationship === "direct" && category === "deliberate_isometric" ? "hold" : null;
const countsAsDirectSet = (category: ExposureCategory) => category === "direct_dynamic" || category === "deliberate_isometric";""")

rep("""      if (isDirect(mapping.relationship, category) && mapping.actionId) {
        covers.add(`${mapping.nodeId}|${mapping.actionId}`);""", """      const mode = modeOf(mapping.relationship, category);
      if (mode && mapping.actionId) {
        covers.add(`${mapping.nodeId}|${mapping.actionId}|${mode}`);""")
rep("""    out.push({ variant, exercise, family, group, covers, credits, directNodes, sidesPerformed: variant.laterality === "unilateral" ? 2 : 1, isHold: variant.deliberateHold });""",
"""    out.push({ variant, exercise, family, group, covers, credits, directNodes, sidesPerformed: variant.laterality === "unilateral" ? 2 : 1, isHold: variant.deliberateHold, isCarry: (exercise as { movement?: string }).movement === "Loaded carry", coverageOnly: STACK_RULES.coverageOnly.includes(exercise.id) });""")

# summaries: one, both
rep("""  const summarize = (side: "left" | "right") => getSpecializationSummary({
    region: input.region, bouts, interval: planWeekInterval(input.week), side, mode: "planned", goals: input.goals,
    catalogMusclesFor, sourceRevision: "", planRevision: null, now: input.now,
  });
  return { bouts, left: summarize("left"), right: summarize("right") };""", """  const both = getSpecializationSummary({
    region: input.region, bouts, interval: planWeekInterval(input.week), side: "both", mode: "planned", goals: input.goals,
    catalogMusclesFor, sourceRevision: "", planRevision: null, now: input.now,
  } as any);
  return { bouts, both };""")

rep("""/** Distinct planned bouts on this arm that give a forearm target muscle direct work: the stack's total. */
export function directBoutsOnArm(region: SpecializationRegionData, summary: SpecializationSummary): Set<string> {
  const targets = new Set(region.nodes.filter((node) => node.role === "target").map((node) => node.id));
  const out = new Set<string>();
  for (const node of summary.nodes) {
    if (!targets.has(node.nodeId)) continue;
    for (const c of node.contributions) {
      if (c.countedSide !== summary.side) continue;
      if (countsAsDirectSet(c.category) || (c.category === "mixed" && c.parts.some((p) => countsAsDirectSet(p.category)))) out.add(c.boutId);
    }
  }
  return out;
}""", """/** The one shared count (critique: evidence #3): distinct bouts with a direct moving part on an own target muscle, and, apart, direct holds. */
export function directWork(region: SpecializationRegionData, summary: SpecializationSummary): { moving: Set<string>; holds: Set<string> } {
  const targets = new Set(region.nodes.filter((node) => node.role === "target").map((node) => node.id));
  const moving = new Set<string>(); const holds = new Set<string>();
  for (const node of summary.nodes) {
    if (!targets.has(node.nodeId)) continue;
    for (const c of node.contributions) {
      const parts = c.parts?.length ? c.parts : [{ relationship: "direct", category: c.category } as any];
      if (parts.some((p: any) => modeOf(p.relationship, p.category) === "move")) moving.add(c.boutId);
      else if (parts.some((p: any) => modeOf(p.relationship, p.category) === "hold")) holds.add(c.boutId);
    }
  }
  for (const id of moving) holds.delete(id);
  return { moving, holds };
}
export const directBoutsOnArm = (region: SpecializationRegionData, summary: SpecializationSummary) => directWork(region, summary).moving;""")

rep("""  for (const node of summary.nodes) for (const c of node.contributions) {
    if (c.countedSide !== summary.side) continue;
    for (const p of c.parts) if (p.actionId && isDirect(p.relationship, p.category)) out.add(`${node.nodeId}|${p.actionId}`);
  }""", """  for (const node of summary.nodes) for (const c of node.contributions) {
    for (const p of c.parts) { const mode = modeOf(p.relationship, p.category); if (p.actionId && mode) out.add(`${node.nodeId}|${p.actionId}|${mode}`); }
  }""")

open(p, "w").write(s)
print("patch1 ok")
