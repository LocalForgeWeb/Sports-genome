import type { Claim, ClaimSourceRef } from "../../types";
import { UPPER_ARM_REGION_ID } from "./ids";

/**
 * The upper arm's evidence review of 19 Oct 2026 and its second automated review the same day
 * (docs/specialization-atlas/regions/upper_arm/anatomy-evidence.md, from research/dossier.md),
 * and the fix round of 22 Oct 2026 after the lane's adversarial review: its dates, its notes and the
 * builders its own claims are written with. Every claim built here is
 * the upper arm's (`ownerRegionId: "upper_arm"`), with an id of the full node id and the kind
 * (`upper_arm.biceps.appearance`, key `upper_arm:upper_arm.biceps.appearance`; 10-multi-region.md
 * §1.3). The forearm's four claims on the biceps and brachialis are built with the forearm's
 * builders (regions/forearm/review.ts) and stay the forearm's.
 */

const REVIEWED_ON = "2026-10-19";
const REVIEW_NOTE = "Checked against the cited sources through web search on 19 Oct 2026; automated review, not a clinician or anatomist.";
const APPEARANCE_REVIEW_NOTE =
  "Checked against the cited sources through web search on 19 Oct 2026, as an anatomical inference from the muscle's cited location and depth; not a measured prediction. Automated review, not a clinician or anatomist.";

/** A claim reworded, or given a new source, in the fix round: re-checked against its sources then. */
const RECHECKED_ON = "2026-10-22";
const RECHECK_NOTE =
  "Checked against the cited sources through web search on 19 Oct 2026, reworded after an adversarial review and re-checked on 22 Oct 2026; automated review, not a clinician or anatomist.";
const APPEARANCE_RECHECK_NOTE =
  "Checked against the cited sources through web search on 19 Oct 2026, reworded after an adversarial review and re-checked on 22 Oct 2026, as an anatomical inference from the muscle's cited location and depth; not a measured prediction. Automated review, not a clinician or anatomist.";

/** Common qualifications of this review, said once so every citation of the same limit reads the same. */
export const ACUTE_EMG = "Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight.";
export const SEARCH_EXCERPT = "Seen through web-search excerpts of the page, not the full text.";
export const LOCATION_ONLY = "Gives location and layer only; the contour statement is inferred from them, not reported by the source.";
export const IMAIOS_MIRROR = "Seen through the imaios.cn mirror.";
export const GARBLED_SUMMARY = "The search summary reported its own citation markers as partly garbled; the facts matched IMAIOS.";
export const MODELLED_FORCE = `${ACUTE_EMG} Ten adults; force estimated by a musculoskeletal computer model from surface EMG and movement. Abstract only.`;

export const src = (sourceId: string, locator: string, qualification: string | null = null): ClaimSourceRef => ({ sourceId, locator, qualification });

/** `rechecked`: reworded or re-sourced in the fix round of 22 Oct 2026, and dated then. */
type ClaimSeed = Pick<Claim, "nodeId" | "statement" | "sources"> & { n?: number; rechecked?: boolean };

function claim(kind: Claim["kind"], basis: Claim["basis"], seed: ClaimSeed, review: Pick<Claim, "reviewStatus" | "reviewedAt" | "reviewNote">): Claim {
  return {
    id: `${seed.nodeId}.${kind}${seed.n ? `.${seed.n}` : ""}`,
    ownerRegionId: UPPER_ARM_REGION_ID,
    nodeId: seed.nodeId,
    kind,
    statement: seed.statement,
    basis,
    ...review,
    sources: seed.sources,
  };
}

const reviewed = (kind: Claim["kind"], seed: ClaimSeed) => {
  const appearance = kind === "appearance";
  if (seed.rechecked) return { reviewStatus: "reviewed" as const, reviewedAt: RECHECKED_ON, reviewNote: appearance ? APPEARANCE_RECHECK_NOTE : RECHECK_NOTE };
  return { reviewStatus: "reviewed" as const, reviewedAt: REVIEWED_ON, reviewNote: appearance ? APPEARANCE_REVIEW_NOTE : REVIEW_NOTE };
};

export const fn = (seed: ClaimSeed) => claim("function", "established_anatomy", seed, reviewed("function", seed));
export const look = (seed: ClaimSeed) => claim("appearance", "anatomical_inference", seed, reviewed("appearance", seed));
export const select = (seed: ClaimSeed) => claim("selectivity", "experimental", seed, reviewed("selectivity", seed));
export const varies = (seed: ClaimSeed) => claim("variation", "established_anatomy", seed, reviewed("variation", seed));
