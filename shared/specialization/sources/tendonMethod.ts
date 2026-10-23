import type { Source, SourceId } from "../types";

/**
 * Sources cited only by tendon exposure's own "How this is counted" (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §1.5, §4.4): the method note's S15, S16, S17 and Impellizzeri et
 * al. 2020. No region lists them in its `sources`, so the seed never writes them (emit-seed.ts reads
 * only those lists), and no membership cites them, so they are not a region's `referenceSources`
 * either: the section's code reads them from here, with its own short label for each
 * (`tendonMethodCitations`), and the page never shows a title.
 *
 * What they support, and what they do not. Together they back two sentences of the method note: that
 * loading can help tendons adapt (S15, in healthy adults' lower-limb tendons), and that no study
 * found ties a count of training sets to how a tendon will respond, so the section shows no ratio or
 * cut-off. S16 and S17 studied force and posture at work, not training sets; Impellizzeri et al.
 * explain why ratios of recent to longer-term training load are not a sound basis for one. None of
 * them gives a number the page uses.
 *
 * Checked by web search on 20–21 Oct 2026 (the package's S15–S17, `reconciliation-sources.json`)
 * and 23 Oct 2026 (Impellizzeri et al.), at abstract level or less: page fetches are refused in this
 * build, so each note says what the search showed and what it could not confirm.
 */
export const tendonMethodSources: Source[] = [
  {
    id: "pmid.35657492",
    url: "https://pubmed.ncbi.nlm.nih.gov/35657492/",
    title: "Lazarczuk et al., Mechanical, material and morphological adaptations of healthy lower limb tendons to mechanical loading: a systematic review and meta-analysis (Sports Medicine, 2022)",
    doi: "10.1007/s40279-022-01695-y",
    evidenceType: "systematic_review",
    retrievedOn: "2026-10-21",
    notes: "The package's S15. Search confirmed the title, the journal (Sports Med 2022;52:2405-2429) and its PMC record (PMC9474511); only the objectives were returned, not the results. Cited only for the method note's \"Loading can help tendons adapt\": healthy adults' lower-limb tendons, so it says nothing about any one tendon of another region and gives no count of sets.",
  },
  {
    id: "cdc.lateral_epicondylitis_hand_force_2014",
    url: "https://stacks.cdc.gov/view/cdc/194977",
    title: "The association between combination of hand force and forearm posture and incidence of lateral epicondylitis in a working population (Human Factors, 2014)",
    doi: "10.1177/0018720813492327",
    evidenceType: "longitudinal",
    retrievedOn: "2026-10-21",
    notes: "The package's S16. Search confirmed the title and a February 2014 prospective-study record (CDC Stacks); the DOI points to Human Factors, and lane R0 found its PubMed record (PMID 24669550). The results were not returned. Cited only for the method note's statement that no study found ties a count of training sets to how a tendon will respond: it studied force and posture in workers' jobs, not training, and the section takes no number from it.",
  },
  {
    id: "pmid.30621312",
    url: "https://pubmed.ncbi.nlm.nih.gov/30621312/",
    title: "Seidel et al., Quantitative measures of physical risk factors associated with work-related musculoskeletal disorders of the elbow: a systematic review (International Journal of Environmental Research and Public Health, 2019)",
    doi: "10.3390/ijerph16010130",
    evidenceType: "systematic_review",
    retrievedOn: "2026-10-21",
    notes: "The package's S17. Search confirmed the title, the journal (IJERPH 2019;16:130), its PMC record (PMC6339038) and the abstract: ten studies from 2007 to 2017 with quantified force, posture and repetition at work. Cited only, as S16 is, for the method note's statement that no study found ties a count of training sets to how a tendon will respond; its work measures are never used as a cut-off here.",
  },
  {
    id: "pmid.32991699",
    url: "https://pubmed.ncbi.nlm.nih.gov/32991699/",
    title: "Impellizzeri et al., Training load and its role in injury prevention, part 2: conceptual and methodologic pitfalls (Journal of Athletic Training, 2020)",
    doi: "10.4085/1062-6050-501-19",
    evidenceType: "systematic_review",
    retrievedOn: "2026-10-23",
    notes: "The record the design cites as PMC7534938. Search on 23 Oct 2026 matched that PMC record to this paper (J Athl Train 2020;55(9):893-901) and gave its PubMed id; the abstract says the field lacks a conceptual framework and reference models, so causal readings of training-load ratios are hard to support. A methods review, not a systematic one (the type list has no closer value). Cited only for why the section shows no ratio of recent to longer-term sets. A second 2020 paper by the same first author on the same ratio (International Journal of Sports Physiology and Performance) is a different record and is not cited.",
  },
];

/** The method note's sources in the order it names them, each with the short label the section shows in place of its title. */
export const tendonMethodCitations: readonly { sourceId: SourceId; label: string }[] = [
  { sourceId: "pmid.35657492", label: "Lazarczuk et al. 2022" },
  { sourceId: "cdc.lateral_epicondylitis_hand_force_2014", label: "A study of force and posture at work, 2014" },
  { sourceId: "pmid.30621312", label: "Seidel et al. 2019" },
  { sourceId: "pmid.32991699", label: "Impellizzeri et al. 2020" },
];
