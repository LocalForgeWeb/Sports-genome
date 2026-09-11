export type PowerliftingNormLift = "Back Squat" | "Barbell Bench Press" | "Conventional Deadlift";

/** One reported decile cut point from van den Hoek et al. 2024, sourced from the Sports Genome research registry (Supabase strength_norms). */
export type PowerliftingNormRow = {
  exerciseName: PowerliftingNormLift;
  sex: "male" | "female";
  ageMin: number;
  ageMax: number;
  percentile: number;
  relativeStrength: number;
};
