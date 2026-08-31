export type SupabaseEvidenceCoverageLevel =
  | "direct_norm"
  | "direct_outcome"
  | "variant_derived"
  | "movement_derived"
  | "unavailable";

export type SupabaseEvidenceSource = {
  title: string;
  publicationYear: number | null;
  sourceUrl: string;
  studyType: string | null;
  populationSummary: string | null;
  sex: string | null;
  trainingStatus: string | null;
  sportPopulation: string | null;
  evidenceLevel: string | null;
};

export type SupabaseExerciseEvidence = {
  status: "connected" | "not_mapped" | "unavailable";
  catalogExerciseId: number;
  canonicalExerciseName: string | null;
  coverageLevel: SupabaseEvidenceCoverageLevel;
  coverageLabel: string;
  anchorMetric: string | null;
  source: SupabaseEvidenceSource | null;
  normativeRecordCount: number;
  sourceOutcomeCount: number;
  sourceOutcomeMetrics: string[];
  boundary: string;
};

export type SupabaseEvidenceInventory = {
  status: "connected" | "unavailable";
  sourceExercises: number;
  localCatalogLinks: number;
  sourceOnlyExercises: number;
  linkedCoverageRecords: number;
  studies: number;
  studyOutcomes: number;
  strengthNorms: number;
  performanceTests: number;
  performanceNorms: number;
  strengthEstimationModels: number;
  stagingStudies: number;
  boundary: string;
};
