import type { Source } from "../types";

/**
 * Training-evidence sources cited only by rep guidance (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §1.5, §5.3): the owner's research package's S09, S13, S14 and
 * S18, re-keyed `pmid.<n>` because the package's keys mean other papers here. No region lists
 * them in its `sources`, so the seed never writes them (emit-seed.ts reads only those lists); they
 * reach the page through a region's `referenceSources`, loaded with its rep profiles.
 *
 * What they support, and what they do not. Each supports one general sentence of the guidance and
 * nothing more. None of them gives the starting ranges: those are the package's own practical
 * defaults (its rep-profiles.json, "practical_starting_range_not_muscle_specific_optimum"; its
 * §2.2 "implementation defaults, not research-derived optima"), recorded as such in the profiles,
 * never as a tested or optimal number. None measured an isolated muscle of the region.
 *
 * Checked by web search on 20–21 Oct 2026 at abstract level or less (page fetches are refused in
 * this build), as each note says.
 */
export const trainingSources: Source[] = [
  {
    id: "pmid.27174923",
    url: "https://pubmed.ncbi.nlm.nih.gov/27174923/",
    title: "Morton et al., Neither load nor systemic hormones determine resistance training-mediated hypertrophy or strength gains in resistance-trained young men (Journal of Applied Physiology, 2016)",
    doi: "10.1152/japplphysiol.00154.2016",
    evidenceType: "longitudinal",
    retrievedOn: "2026-10-21",
    notes: "The package's S09. Title, journal and abstract confirmed by search: resistance-trained young men, whole-body lifts taken to failure with lighter sets of 20–25 reps or heavier sets of 8–12 (as the package records it); muscle growth was similar, so load did not decide hypertrophy in that trial. Cited only for the rep guidance's general sentence (growth across a wide range of reps when sets are hard). It measured no isolated small muscle and gives no range for one; the app's starting ranges are not from it.",
  },
  {
    id: "pmid.38970765",
    url: "https://pubmed.ncbi.nlm.nih.gov/38970765/",
    title: "Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions (Sports Medicine, 2024)",
    doi: "10.1007/s40279-024-02069-2",
    evidenceType: "systematic_review",
    retrievedOn: "2026-10-21",
    notes: "The package's S13; the same PubMed record client/src/lib/trainingEvidence.ts cites. Exploratory meta-regressions associating training closer to failure with more hypertrophy; the exact relationship is uncertain, as the package's own note says. Cited only for the rep guidance's effort sentence, said as a common starting point and not a rule; no reps-in-reserve number is computed from it, and the logger records no such number. It gives no rep range; the app's starting ranges are not from it.",
  },
  {
    id: "pmid.30580468",
    url: "https://pubmed.ncbi.nlm.nih.gov/30580468/",
    title: "Oranchuk et al., Isometric training and long-term adaptations: effects of muscle length, intensity, and intent: a systematic review (Scandinavian Journal of Medicine & Science in Sports, 2019)",
    doi: "10.1111/sms.13375",
    evidenceType: "systematic_review",
    retrievedOn: "2026-10-21",
    notes: "The package's S14. Title, journal and abstract confirmed by search: adaptations to isometric training depend on muscle length, contraction intensity and intent. Cited only for the hold sentence (results from holds depend on their length, how hard they are and the intent). It is not the source of the 10–30 s starting range, gives no conversion from hold seconds to sets, and studied no grip hold of the region.",
  },
  {
    id: "pmid.28834797",
    url: "https://pubmed.ncbi.nlm.nih.gov/28834797/",
    title: "Schoenfeld et al., Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis (Journal of Strength and Conditioning Research, 2017)",
    doi: "10.1519/JSC.0000000000002200",
    evidenceType: "systematic_review",
    retrievedOn: "2026-10-21",
    notes: "The package's S18, read from its PubMed record. Meta-analysis of low- against high-load training: maximal strength favoured heavier loads, and hypertrophy was similar across loading ranges in the conditions studied. Cited only for the rep guidance's general sentence (heavier sets suit maximal strength). Not a table of optimal reps for any muscle; the app's strength ranges are the package's practical defaults, not from it.",
  },
];
