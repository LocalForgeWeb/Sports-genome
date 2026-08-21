/**
 * Source-linked planning rules. These are population-level anchors, never
 * physiological measurements or personal prescriptions.
 */
export const trainingEvidence = {
  hypertrophy: {
    workingRepetitions: [6, 15] as const,
    weeklyHardSetStartingReference: 10,
    trainedWeeklySetContext: [12, 20] as const,
    restFloorSeconds: 60,
    sourceUrls: [
      "https://doi.org/10.1136/bjsports-2023-106807",
      "https://pubmed.ncbi.nlm.nih.gov/35291645/",
      "https://doi.org/10.1519/SSC.0000000000000363",
    ],
  },
  strength: {
    primaryWorkingRepetitions: [1, 6] as const,
    trainedRestFloorSeconds: 180,
    sourceUrls: [
      "https://doi.org/10.1136/bjsports-2023-106807",
      "https://pubmed.ncbi.nlm.nih.gov/28933024/",
      "https://doi.org/10.1519/JSC.0000000000002200",
    ],
  },
  frequency: {
    practicalHypertrophyDistributionDays: [1, 3] as const,
    sourceUrls: [
      "https://pubmed.ncbi.nlm.nih.gov/27102172/",
      "https://doi.org/10.1007/s40279-018-0872-x",
    ],
  },
  proximityToFailure: {
    sourceUrls: [
      "https://doi.org/10.1007/s40279-022-01784-y",
      "https://pubmed.ncbi.nlm.nih.gov/38970765/",
    ],
  },
} as const;

export const evidenceBoundary = "Population-level planning anchor; adapt to training status, exercise selection, recovery, technical skill, and the athlete’s response.";
