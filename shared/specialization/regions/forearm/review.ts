import type { Claim, ClaimSourceRef } from "../../types";
import { FOREARM_REGION_ID } from "./ids";

/**
 * The forearm atlas's evidence review of 16 Oct 2026 (docs/specialization-atlas/
 * 03-anatomy-evidence.md): its date, its notes and the builders its claims are written with.
 * Every claim built here is the forearm's (`ownerRegionId: "forearm"`), wherever its record is
 * kept: the four on the biceps and brachialis sit beside those nodes in regions/upper_arm/claims.ts.
 */

const REVIEWED_ON = "2026-10-16";
const REVIEW_NOTE = "Checked against the cited sources through web search on 16 Oct 2026; automated review, not a clinician or anatomist.";
const APPEARANCE_REVIEW_NOTE =
  "Checked against the cited sources through web search on 16 Oct 2026, as an anatomical inference from the muscle's cited location and depth; not a measured prediction. Automated review, not a clinician or anatomist.";

/** Common qualifications, said once so every citation of the same limit reads the same. */
export const ACUTE_EMG = "Short-term muscle activity in a controlled task; not a measurement of growth and not a set-credit weight.";
export const SEARCH_EXCERPT = "Seen through web-search excerpts of the page, not the full text.";
export const LOCATION_ONLY = "Gives location and layer only; the contour statement is inferred from them, not reported by the source.";

export const src = (sourceId: string, locator: string, qualification: string | null = null): ClaimSourceRef => ({ sourceId, locator, qualification });

/** The node id without its region prefix: `forearm.fcu` → `fcu`. */
const short = (nodeId: string) => nodeId.slice(nodeId.indexOf(".") + 1);

type ClaimSeed = Pick<Claim, "nodeId" | "statement" | "sources"> & { n?: number };

function reviewedClaim(kind: Claim["kind"], basis: Claim["basis"], seed: ClaimSeed): Claim {
  return {
    id: `${short(seed.nodeId)}.${kind}${seed.n ? `.${seed.n}` : ""}`,
    ownerRegionId: FOREARM_REGION_ID,
    nodeId: seed.nodeId,
    kind,
    statement: seed.statement,
    basis,
    reviewStatus: "reviewed",
    reviewedAt: REVIEWED_ON,
    reviewNote: kind === "appearance" ? APPEARANCE_REVIEW_NOTE : REVIEW_NOTE,
    sources: seed.sources,
  };
}

export const fn = (seed: ClaimSeed) => reviewedClaim("function", "established_anatomy", seed);
export const look = (seed: ClaimSeed) => reviewedClaim("appearance", "anatomical_inference", seed);
export const select = (seed: ClaimSeed) => reviewedClaim("selectivity", "experimental", seed);
export const varies = (seed: ClaimSeed) => reviewedClaim("variation", "established_anatomy", seed);
