import type { ExposureCategory, ExposureRuleSpec, Limb, MuscleMode, RegionWording, Relationship, RuleVersion } from "./types";
import { EXPOSURE_RULE_VERSION } from "./ids";

/**
 * The published accounting policy (brief §5). The calculator implements exactly this
 * text; the page shows it under "How this is counted"; the seed writes it to
 * `specialization.rule_versions`. Changing what is counted means a new version id,
 * never an edit to this one.
 */
export const exposureRuleV1: RuleVersion = {
  id: EXPOSURE_RULE_VERSION,
  publishedAt: "2026-10-16",
  notes: "First published accounting model for specialization exposure. Raw categories only; no fractional set model.",
  specification: {
    bout: "One logged work set, or one planned set. Each bout has an id; a standard set is one segment.",
    dropSet: "A drop set is one bout. Its stages are segments, each with its own load and reps. It is never counted as several sets.",
    excludedFromCompleted: [
      "Sets not logged as completed (typed but not logged, or skipped).",
      "Sets marked as warm-ups.",
      "Workouts not finished (the live workout's sets count once it is finished).",
      "Removed workouts and sets (they no longer exist on the device).",
    ],
    categories: {
      direct_dynamic: "The muscle performs the movement through its range in this exercise (a reviewed direct, dynamic mapping).",
      contributing_dynamic: "The muscle helps move the load but is not the main target (a reviewed contributing, dynamic mapping).",
      deliberate_isometric: "The muscle holds against load in an exercise whose purpose is the hold (hangs, carries, pinches).",
      incidental_isometric: "The muscle holds or steadies while something else is trained (gripping a bar during a row).",
      mixed: "One set loads the muscle in two different ways; it counts once here, with the parts listed.",
      unknown: "The mapping exists but its relationship or muscle action is not known.",
    },
    perNodeBout: "A muscle counts a bout once. Two categories from one bout make it `mixed`, with the parts listed.",
    sides: "A two-handed bout counts once for each arm (3 sets are 3 per arm, not 6). A one-arm bout counts for that arm only. A bout whose side is unknown is reported separately and never added to either arm.",
    straps: "Grip credit that needs a bare hand is not given to a set logged with straps. Unknown straps keep the credit and say so.",
    holds: "Hold seconds are summed per segment and reported as seconds. They are never converted into sets.",
    unmapped: "Work tagged with the region in the exercise catalog but with no reviewed atlas mapping counts only at region level, never as work for a specific muscle. Draft mappings are shown as pending review and not counted. Unknown is never shown as zero.",
    regionTotal: "The region total counts distinct bouts that touched any of its muscles on that arm. It is not the sum of the muscle rows.",
    notConverted: [
      "Load × reps is external volume-load, not muscle force.",
      "Effort that was not recorded stays unknown; it never defaults to failure.",
      "Incidental grip is never counted as dynamic work.",
      "No number here predicts growth, recovery or injury.",
    ],
  },
};

/**
 * The category a mapping gives a bout (02-design.md §3). Pure, so the database seed,
 * the calculator and the tests read the same table.
 */
export function categoryFor(relationship: Relationship, mode: MuscleMode, deliberateHold: boolean): ExposureCategory {
  if (relationship === "unknown" || mode === "unknown") return "unknown";
  if (mode === "mixed") return "mixed";
  if (mode === "dynamic") {
    if (relationship === "direct") return "direct_dynamic";
    if (relationship === "contributing") return "contributing_dynamic";
    // A stabilizer or incidental muscle that moves through range is still not a target.
    return "unknown";
  }
  // isometric
  if ((relationship === "direct" || relationship === "contributing") && deliberateHold) return "deliberate_isometric";
  return "incidental_isometric";
}

export const exposureCategoryOrder: readonly ExposureCategory[] = [
  "direct_dynamic",
  "contributing_dynamic",
  "deliberate_isometric",
  "incidental_isometric",
  "mixed",
  "unknown",
];

export const exposureCategoryLabels: Record<ExposureCategory, string> = {
  direct_dynamic: "Direct dynamic",
  contributing_dynamic: "Other dynamic",
  deliberate_isometric: "Deliberate holds",
  incidental_isometric: "Incidental grip / stabilization",
  mixed: "Mixed",
  unknown: "Unclassified",
};

/**
 * The category labels in a region's words: incidental work is named by the region's
 * `wording.incidentalWork` ("Incidental bracing / stabilization"), so the forearm's "grip" gives
 * `exposureCategoryLabels` exactly (10-multi-region.md §4.3).
 */
export function exposureCategoryLabelsFor(wording: Pick<RegionWording, "incidentalWork">): Record<ExposureCategory, string> {
  return { ...exposureCategoryLabels, incidental_isometric: `Incidental ${wording.incidentalWork} / stabilization` };
}

// ---------------------------------------------------------------- published versions and their clauses

/**
 * The published rules, oldest first (10-multi-region.md §4.3). A rule is added here by the release
 * whose regions first use its clauses; each is a superset of the one before. A clause no
 * production region rests on yet waits in `ruleClauses` under the version that will publish it.
 */
export const publishedExposureRules: readonly RuleVersion[] = [exposureRuleV1];

/** The rule every page reads: the latest published one. A summary records its id (`ruleVersion`). */
export const currentExposureRule: RuleVersion = publishedExposureRules[publishedExposureRules.length - 1];

/** The rule versions 10-multi-region.md §4.3 plans, published or not. */
export const exposureRuleIds = {
  v1: EXPOSURE_RULE_VERSION,
  v2: "specialization_exposure_v2",
  v3: "specialization_exposure_v3",
  v4: "specialization_exposure_v4",
  v5: "specialization_exposure_v5",
} as const;

/** How `nodeSideFor` (exposure.ts) decided a side within a paired region's limb: its rules 2 to 6. */
export type PairedSideBranch = "relation_both" | "structural" | "recorded" | "recorded_opposite" | "not_applicable" | "unknown";

/**
 * Every branch of the calculator that decides what is counted, each answered by one clause of a
 * rule (`ruleClauses`):
 * - `side.*`: `nodeSideFor`'s rules, per limb (`side.midline` is its rule 1);
 * - `plan.*`: a planned one-sided set, on its limb: one bout per planned set, read as done with
 *   both sides (`boutsFromPlan`; both sides are counted as one, owner 20 Oct 2026, so the plan
 *   counts what the logger builds, one row per planned set);
 * - `version.*`: the version `indexRegion` credits a node by: the region's own, the node's home
 *   region's, or the listing region's own rows where the home has published none;
 * - `class.*`: how a bout is classified by the region's own muscles (10-multi-region.md §4.2);
 * - `scope.*`: which catalog tags put unmapped work in the region-only bucket.
 */
export type RuleBranch =
  | "side.midline"
  | `side.${Limb}.${PairedSideBranch}`
  | `plan.${Limb}.one_bout`
  | "version.own"
  | "version.home"
  | "version.listing_fallback"
  | "class.mapped"
  | "class.region_only"
  | "class.region_only_external"
  | "class.external_only"
  | "class.unrelated"
  | "scope.any"
  | "scope.primary";

/**
 * The clause of a rule that answers a branch: a key of the rule's published specification, or,
 * for a rule not yet published, the words 10-multi-region.md §4.3 gives it.
 */
export type RuleClause = { rule: string; clause: string };

const v1 = (clause: keyof ExposureRuleSpec): RuleClause => ({ rule: exposureRuleIds.v1, clause });
const draft = (rule: string, clause: string): RuleClause => ({ rule, clause });
const RELATIONS = "side relations: a mapping's muscle is loaded on the recorded side, the opposite side, or both";
const MIDLINE = "midline: a midline region counts every bout once and has no sides";
const LIMB = "the leg limb: a leg's side is the anchor leg's; a limb the exercise does not use gives no side; a planned one-sided set counts once, as done with both sides";
const BY_HOME = "a muscle of another region is credited as its home region's current mapping version credits it";
const OWN_MUSCLES = "a bout is classified by the page's own muscles";

/**
 * Each branch and the clause that publishes it. A test maps every branch the calculator takes to an
 * entry here, and refuses production data that reaches a branch whose rule is not in
 * `publishedExposureRules`: no midline production region before v4, no leg one before v5. Each
 * later release adds its rule to the published list; its entries are already here.
 */
export const ruleClauses: Record<RuleBranch, RuleClause> = {
  "side.midline": draft(exposureRuleIds.v4, MIDLINE),
  "side.arm.relation_both": draft(exposureRuleIds.v3, RELATIONS),
  "side.arm.structural": v1("sides"),
  "side.arm.recorded": v1("sides"),
  "side.arm.recorded_opposite": draft(exposureRuleIds.v3, RELATIONS),
  "side.arm.not_applicable": draft(exposureRuleIds.v5, LIMB),
  "side.arm.unknown": v1("sides"),
  "side.leg.relation_both": draft(exposureRuleIds.v5, LIMB),
  "side.leg.structural": draft(exposureRuleIds.v5, LIMB),
  "side.leg.recorded": draft(exposureRuleIds.v5, LIMB),
  "side.leg.recorded_opposite": draft(exposureRuleIds.v5, LIMB),
  "side.leg.not_applicable": draft(exposureRuleIds.v5, LIMB),
  "side.leg.unknown": draft(exposureRuleIds.v5, LIMB),
  "plan.arm.one_bout": v1("sides"),
  "plan.leg.one_bout": draft(exposureRuleIds.v5, LIMB),
  "version.own": v1("categories"),
  "version.listing_fallback": v1("categories"),
  "version.home": draft(exposureRuleIds.v2, BY_HOME),
  "class.mapped": v1("categories"),
  "class.region_only": v1("unmapped"),
  "class.region_only_external": draft(exposureRuleIds.v2, OWN_MUSCLES),
  "class.external_only": draft(exposureRuleIds.v2, OWN_MUSCLES),
  "class.unrelated": v1("unmapped"),
  "scope.any": v1("unmapped"),
  "scope.primary": draft(exposureRuleIds.v2, "catalog keys and their tag scope named per region"),
};

/** Of the branches given, those whose clause no published rule holds, in order. */
export function unpublishedBranches(branches: Iterable<RuleBranch>, published: readonly RuleVersion[] = publishedExposureRules): RuleBranch[] {
  const ids = new Set(published.map((rule) => rule.id));
  return Array.from(new Set(branches)).filter((branch) => !ids.has(ruleClauses[branch].rule)).sort();
}
