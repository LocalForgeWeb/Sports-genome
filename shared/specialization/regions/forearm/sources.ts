import type { Source } from "../../types";

/**
 * Sources named in the brief (§13), plus anatomy references added during review.
 * Each claim and mapping cites these by id with a locator.
 */
export const forearmSources: Source[] = [
  { id: "S1", url: "https://doi.org/10.1007/s40279-025-02344-w", title: "Pelland et al., The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains (Sports Medicine)", doi: "10.1007/s40279-025-02344-w", evidenceType: "systematic_review", retrievedOn: "2026-10-16", notes: "Supports a positive volume–hypertrophy relationship with diminishing returns and fractional set counting as the best fit within the included studies. Does not set a forearm-muscle target." },
  { id: "S2", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11740565/", title: "Ikeda et al., Effects of forearm rotation on wrist flexor and extensor muscle activities (2025)", doi: null, evidenceType: "emg", retrievedOn: "2026-10-16", notes: "Acute, controlled isometric tasks. Not a longitudinal hypertrophy study." },
  { id: "S3", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1474175/", title: "Butler et al., Selective recruitment of single motor units in human flexor digitorum superficialis muscle during flexion of individual fingers (2005)", doi: null, evidenceType: "emg", retrievedOn: "2026-10-16", notes: "Finger-component specificity with coupling between fingers. Does not show complete isolation." },
  { id: "S4", url: "https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html", title: "Texas Tech University Health Sciences Center El Paso: forearm muscle tables", doi: null, evidenceType: "anatomy", retrievedOn: "2026-10-16", notes: "Muscle identities and actions." },
  { id: "S5", url: "https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_ans.html", title: "Texas Tech University Health Sciences Center El Paso: forearm dissection teaching material", doi: null, evidenceType: "anatomy", retrievedOn: "2026-10-16", notes: "Layers, orientation and identification." },
  { id: "S6", url: "https://pubmed.ncbi.nlm.nih.gov/31183837/", title: "Sonoanatomy of anterior forearm muscles (2019)", doi: null, evidenceType: "anatomy", retrievedOn: "2026-10-16", notes: "Superficial, intermediate and deep anterior structures." },
  { id: "S7", url: "https://anatomy.app/encyclopedia/flexor-carpi-radialis", title: "Anatomy.app: flexor carpi radialis", doi: null, evidenceType: "anatomy", retrievedOn: "2026-10-16", notes: "Superficial location and wrist action; not a quantified appearance claim." },
  { id: "S8", url: "https://www.ncbi.nlm.nih.gov/sites/books/NBK526046/", title: "StatPearls: flexor digitorum profundus", doi: null, evidenceType: "anatomy", retrievedOn: "2026-10-16", notes: "Deep extrinsic finger flexor identity and joint actions." },
  { id: "S9", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", title: "Supabase: Row Level Security", doi: null, evidenceType: "product_assumption", retrievedOn: "2026-10-16", notes: "Access-control implementation reference, not anatomy evidence." },
];
