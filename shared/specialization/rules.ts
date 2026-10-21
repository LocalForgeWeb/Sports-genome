import type { ExposureCategory, MuscleMode, Relationship, RuleVersion } from "./types";
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
