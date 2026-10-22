import type { SidedBy } from "../types";

/**
 * Both-limb variants (docs/specialization-atlas/10-multi-region.md §3): one-sided for the arms and
 * for the legs, so which limb's side is recorded (`sidedBy`) is decided once, by the first wave
 * that maps the variant in a new version, looking at every region that will map it, and written
 * here with the reason. They are the only exceptions to §3's limb rule (a one-sided or either
 * variant a paired region maps is sided by that region's limb); regionContent.test.ts and
 * variants.test.ts read this list. The reasons, in full, are in
 * docs/specialization-atlas/regions/variants.md.
 *
 * Each wave A decision is `arm`: wave A (the upper arm) maps these first and is an arm region;
 * `leg` would make publication rule 11 require `leg_laterality` and `side_anchor` before any leg
 * lane has reviewed the legs, which §3 leaves to the leg waves (the argument of
 * 11-forearm-research-and-stack.md §10 decision 4 for 188 and 264). With both sides counted as one
 * (the owner, 20 Oct 2026) no side is asked, so no decision here changes a count.
 */
export type BothLimbDecision = { catalogExerciseId: number; sidedBy: Extract<SidedBy, "arm" | "leg">; reason: string };

export const bothLimbDecisions: readonly BothLimbDecision[] = [
  // The forearm's, pinned at wave 0 and kept by 11-forearm-research-and-stack.md §10 decision 4.
  { catalogExerciseId: 188, sidedBy: "arm", reason: "Single-leg Romanian deadlift, one implement or two: the forearm's pinned sided_by, kept (11-forearm §10 decision 4)." },
  { catalogExerciseId: 264, sidedBy: "arm", reason: "Landmine single-leg Romanian deadlift: the forearm's pinned sided_by, kept (11-forearm §10 decision 4)." },
  // Wave A.
  { catalogExerciseId: 252, sidedBy: "arm", reason: "Half-kneeling landmine press: the pressing hand names the set; the kneeling legs brace and the catalog does not tie the down knee to a side." },
  { catalogExerciseId: 270, sidedBy: "arm", reason: "Landmine split jerk: the pressing hand names the set; which foot goes forward in the catch is not defined." },
  { catalogExerciseId: 303, sidedBy: "arm", reason: "Half-kneeling cable chest press: the pressing hand names the set; the kneeling legs brace and the catalog does not tie the down knee to a side." },
  { catalogExerciseId: 325, sidedBy: "arm", reason: "Front-foot-elevated cable press: the pressing hand names the set; the split legs brace and the catalog does not tie the raised foot to a side." },
  { catalogExerciseId: 386, sidedBy: "arm", reason: "Landmine split press: the pressing hand names the set; the split legs brace and the catalog does not tie the front foot to a side." },
  { catalogExerciseId: 390, sidedBy: "arm", reason: "Turkish get-up: the bell's hand names the side, and the driving leg is the same side's by definition, so a leg side would add nothing." },
];

export const bothLimbCatalogIds: ReadonlySet<number> = new Set(bothLimbDecisions.map((decision) => decision.catalogExerciseId));
