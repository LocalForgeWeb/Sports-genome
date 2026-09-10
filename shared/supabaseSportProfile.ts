export type SupabaseSportMovementDemand = {
  patternName: string;
  importanceWeight: number | null;
  confidenceScore: number | null;
};

export type SupabaseSportMuscleDemand = {
  muscleName: string;
  region: string | null;
  importanceWeight: number | null;
  confidenceScore: number | null;
};

export type SupabaseSportQualityDemand = {
  qualityName: string;
  importanceWeight: number | null;
  confidenceScore: number | null;
};

export type SupabaseSportExerciseRecommendation = {
  catalogExerciseId: number | null;
  exerciseName: string;
  recommendationGoal: string | null;
  recommendationRole: string | null;
  confidenceScore: number | null;
  effectMetric: string | null;
  effectSize: number | null;
  rationale: string | null;
  doseSummary: string | null;
};

export type SupabaseSportProfile = {
  status: "connected" | "not_mapped" | "unavailable";
  sportId: string;
  sportName: string | null;
  category: string | null;
  movementDemands: SupabaseSportMovementDemand[];
  muscleDemands: SupabaseSportMuscleDemand[];
  qualityDemands: SupabaseSportQualityDemand[];
  recommendations: SupabaseSportExerciseRecommendation[];
  boundary: string;
};
