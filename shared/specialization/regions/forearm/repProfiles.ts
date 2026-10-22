import { variantIdFor } from "../../ids";
import type { RepProfile, RepProfileAssignment, UnprofiledVariant } from "../../repProfiles";
import { trainingSources } from "../../sources/training";
import type { RegionExtras } from "../../types";

/**
 * The forearm's rep profiles (docs/specialization-atlas/11-forearm-research-and-stack.md §5.1):
 * the owner's research package's task families (forearm-research-v1/rep-profiles.json), each
 * assigned per variant. Region data, loaded only when the stack designer or the add sheet opens,
 * never with the page (§3.10); the forearm opts in with `sections.stack` in its content.
 *
 * **The numbers are the package's practical starting defaults, not tested ones.** The package
 * records every family as "practical_starting_range_not_muscle_specific_optimum" and its §2.2
 * calls them "implementation defaults, not research-derived optima"; every family cites the same
 * five sources, none of which gives these ranges (11 §1.9). So no range here cites a study. The
 * page says so wherever a range appears (§5.3), and calls them the app's starting ranges.
 *
 * What is deliberately absent: a per-muscle number of any kind (the package's
 * `validated_muscle_specific_rep_optimum`, weekly set targets and maximums are null by design and
 * not imported), its reps-in-reserve number (the logger records no such field; the guidance says
 * "1 to 3 reps short of failure" as words), and its ballistic-or-mixed family, which has no ranges
 * and maps no variant here.
 *
 * The order is the order the stack lists its exercises within a day (§3.4: elbow, wrist,
 * rotation, fingers, thumb, holds last, since a tired grip limits the rest).
 */

const PACKAGE_STATUS = "practical_starting_range_not_muscle_specific_optimum";
const DEFAULT_NOTE = "The research package's practical starting default for this kind of movement (rep-profiles.json), not a tested or muscle-specific optimum.";

export const forearmRepProfileList: RepProfile[] = [
  {
    id: "forearm.elbow",
    label: "Elbow (brachioradialis curls)",
    measure: "reps",
    growth: [6, 20],
    strength: [3, 6],
    evidence: "starting_default",
    origin: { family: "elbow", status: PACKAGE_STATUS },
    note: `${DEFAULT_NOTE} The package's own name for curls that work the brachioradialis (its §5.1); the upper arm may give the same curls a profile of its own, shown on its own page.`,
  },
  {
    id: "forearm.wrist",
    label: "Wrist",
    measure: "reps",
    growth: [10, 25],
    strength: [6, 12],
    evidence: "starting_default",
    origin: { family: "wrist", status: PACKAGE_STATUS },
    note: DEFAULT_NOTE,
  },
  {
    id: "forearm.rotation",
    label: "Rotation",
    measure: "reps",
    growth: [10, 20],
    strength: [6, 12],
    evidence: "starting_default",
    origin: { family: "rotation", status: PACKAGE_STATUS },
    note: DEFAULT_NOTE,
  },
  {
    id: "forearm.finger",
    label: "Finger",
    measure: "reps",
    growth: [10, 25],
    strength: [5, 10],
    evidence: "starting_default",
    origin: { family: "finger", status: PACKAGE_STATUS },
    note: `${DEFAULT_NOTE} The strength range is for loaded finger work; band drills keep the growth range under every goal (their assignments say so).`,
  },
  {
    id: "forearm.thumb",
    label: "Thumb",
    measure: "reps",
    growth: [12, 25],
    strength: null,
    evidence: "starting_default",
    origin: { family: "thumb", status: PACKAGE_STATUS },
    note: `${DEFAULT_NOTE} The package gives no strength range for thumb isolation, so its 12–25 is kept under every goal.`,
  },
  {
    id: "forearm.grip_hold",
    label: "Deliberate grip hold (stationary)",
    measure: "seconds",
    growth: [10, 30],
    strength: [3, 10],
    // The plan counts a written range by its low end, so a hold is written as one number.
    written: { growth: 30, strength: 10 },
    evidence: "starting_default",
    origin: { family: "isometric_grip", status: PACKAGE_STATUS },
    note: `${DEFAULT_NOTE} Hold seconds, never converted into sets of moving work. The package's 10–30 s is not the cited review's finding: that review says only that results from holds depend on their length, intensity and intent.`,
  },
];

const THUMB_COVERAGE = "05-mappings.md (Thumb, 412–414) and the reviewed rows (regions/forearm/mappings.ts, 412): \"small-muscle coverage, not high-volume defaults\"; the package's §4.1 calls such drills \"not automatically imported prescriptions\".";

const assign = (profile: string, catalogIds: readonly number[], options: Partial<Pick<RepProfileAssignment, "strengthApplies" | "coverageOnly" | "coverageNote">> = {}): RepProfileAssignment[] =>
  catalogIds.map((id) => ({ variantId: variantIdFor(id), profileId: profile, strengthApplies: options.strengthApplies ?? true, coverageOnly: options.coverageOnly ?? false, ...(options.coverageNote ? { coverageNote: options.coverageNote } : {}) }));

/**
 * One assignment per variant whose own work is a movement or a stationary hold of the forearm (a
 * reviewed direct mapping on one of its target muscles). 417 and 418 join the wrist family, and
 * 419 the grip hold, when lane C1 adds them (F3).
 */
export const forearmRepProfileAssignments: RepProfileAssignment[] = [
  ...assign("forearm.elbow", [132, 133, 134, 135, 136, 337, 342]),
  ...assign("forearm.wrist", [139, 140, 350, 407, 408, 410, 411, 415, 416]),
  ...assign("forearm.rotation", [405, 406]),
  ...assign("forearm.finger", [401, 402]),
  // A band drill: the finger family's strength range is for loaded finger work.
  ...assign("forearm.finger", [404], { strengthApplies: false }),
  ...assign("forearm.thumb", [412, 413, 414], { strengthApplies: false, coverageOnly: true, coverageNote: THUMB_COVERAGE }),
  ...assign("forearm.grip_hold", [142, 143, 144, 145, 403]),
];

/**
 * Variants with direct work on a forearm muscle that take no profile. The carries keep their
 * whole-exercise prescriptions: a carry's forearm role is a time-based hold inside a whole-body
 * task that does not become forearm sets (the package's §2.2 and §10; 11 §1.8 row 15).
 */
export const forearmUnprofiledVariants: UnprofiledVariant[] = [
  { variantId: variantIdFor(299), reason: "A loaded carry (Farmer's Walk): the grip holds inside a whole-body task, so the exercise keeps its own prescription and takes no grip-hold profile." },
  { variantId: variantIdFor(409), reason: "A loaded carry (Suitcase Carry): the grip holds inside a whole-body task, so the exercise keeps its own prescription and takes no grip-hold profile." },
];

/** What a region's `repProfiles.ts` exports, under this one name, so a region-agnostic loader finds it. */
export const repProfileExtras: RegionExtras = {
  regionId: "forearm",
  repProfiles: forearmRepProfileList,
  repProfileAssignments: forearmRepProfileAssignments,
  unprofiledVariants: forearmUnprofiledVariants,
  repGuidanceCitations: {
    // S09 and S18: growth across a wide range of reps when sets are hard; heavier sets suit maximal strength.
    general: ["pmid.27174923", "pmid.28834797"],
    // S13: stopping 1 to 3 reps short of failure is a common starting point, not a rule.
    effort: ["pmid.38970765"],
    // S14: results from holds depend on their length, intensity and intent.
    holds: ["pmid.30580468"],
  },
  referenceSources: trainingSources,
};
