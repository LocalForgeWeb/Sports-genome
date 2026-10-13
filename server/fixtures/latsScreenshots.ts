/**
 * The two lats screenshots of 13 October 2026 (IMG_1592, IMG_1593), as the canonical Supabase
 * project scores them. Recorded 2026-10-13 by read-only queries against the deployed functions:
 * `score_strength_profile_v1(65.8, 'male', …)` then `apply_strengthlevel_age_adjustment_v1(…,
 * 17.0, …)` for each score, with the anchor curve arrays left out. The rows the aggregation
 * joins (exercises, the muscles the two exercises map to, and those mappings) are copied from
 * `exercises`, `muscles` and `exercise_muscle_mappings` the same day.
 *
 * These are reproduction fixtures, not anyone's workouts: 145 lb (65.8 kg once the route rounds
 * it to the tenth), a 17-year-old male (the age that reproduces the displayed 89th: the screen
 * did not show it), and the four lifts the screenshots show.
 *
 *   Screenshot A: Lat Pulldown 187 lb × 6 (26 Sep) and Machine Low Row 600 lb × 12 (13 Oct)
 *   Screenshot B: Lat Pulldown 350 lb × 1 (13 Oct) and Machine Low Row 325 lb × 8 (13 Oct)
 */

const LAT_PULLDOWN = "8a5a495f-dbaa-4536-8bf7-f9582d6c43c3";
const MACHINE_LOW_ROW = "e0d62a4c-1690-42b4-aee9-6c638a924ab7";
const COMMUNITY = {
  source_role: "beta_fallback",
  source_study_id: "485b3c5e-cbe7-4755-b0bd-adb224877193",
  population_label: "Self-selected Strength Level community lifters (not general population)",
  normalization_method: "direct_community_relative_1rm_percentile",
};
const ROW_ALIAS = {
  rationale: "Machine low row is a close supported horizontal-row machine variant, but leverage differs from cable row.",
  e1rm_multiplier: 1,
  relationship_type: "machine_row_variant",
  source_exercise_id: "1da5ddf3-03d9-49b6-8d17-ac259102a1cf",
  confidence_modifier: 0.74,
  source_exercise_name: "Seated Cable Row",
  target_exercise_name: "Machine Low Row",
};
const AGE_17 = { factor: 0.9028, status: "ok", applied: true };

export const latsScreenshots = {
  recordedAt: "2026-10-13",
  bodyMassKg: 65.8,
  ageYears: 17,
  ids: { LAT_PULLDOWN, MACHINE_LOW_ROW },
  exercises: [
    { id: LAT_PULLDOWN, name: "Lat Pulldown", canonical_name: "lat_pulldown__catalog_57", movement_pattern: "Vertical pull" },
    { id: MACHINE_LOW_ROW, name: "Machine Low Row", canonical_name: "machine_low_row__catalog_53", movement_pattern: "Horizontal pull" },
  ],
  muscles: [
    { id: "ebcf52e6-1a4f-4a30-8d2e-477881bbe5d3", name: "Latissimus dorsi", canonical_name: "latissimus_dorsi", region: "back", muscle_group: "latissimus" },
    { id: "68d08033-5b02-4da8-92e7-cb51a30f9d57", name: "Biceps brachii", canonical_name: "biceps_brachii", region: "upper arm", muscle_group: "elbow flexors" },
    { id: "f1b3b747-53d7-4589-a0e8-a4eb18f2e315", name: "Brachialis", canonical_name: "brachialis", region: "upper arm", muscle_group: "elbow flexors" },
    { id: "d2743fb6-2854-40d4-b42d-525eb4327d35", name: "Teres major", canonical_name: "teres_major", region: "back", muscle_group: "scapulohumeral" },
    { id: "d8060308-faab-4dde-b96f-381caf74eba5", name: "Brachioradialis", canonical_name: "brachioradialis", region: "forearm", muscle_group: "elbow flexors" },
    { id: "5038f9e0-6c3e-418c-8905-ed1d85c4c36b", name: "Lower trapezius", canonical_name: "lower_trapezius", region: "upper back", muscle_group: "trapezius" },
    { id: "f9efa759-9572-4960-90c1-9e647570e0ff", name: "Rhomboid major", canonical_name: "rhomboid_major", region: "upper back", muscle_group: "rhomboids" },
    { id: "7e1728c3-827c-4a49-94c4-bf6954b89fc1", name: "Rhomboid minor", canonical_name: "rhomboid_minor", region: "upper back", muscle_group: "rhomboids" },
    { id: "ab2ff141-7c43-469f-9a3c-359e6b02376a", name: "Middle trapezius", canonical_name: "middle_trapezius", region: "upper back", muscle_group: "trapezius" },
    { id: "1a11c3a8-6ee1-4e19-b7c4-499b6bdb5398", name: "Posterior deltoid", canonical_name: "posterior_deltoid", region: "shoulder", muscle_group: "deltoid" },
    { id: "d7668dbe-d6c3-45c6-aeec-74ad4b44306b", name: "Forearm flexor group", canonical_name: "forearm_flexors", region: "forearm", muscle_group: "forearm flexors" },
    { id: "052503a0-c538-431a-92f2-2a9b8ed0d875", name: "Rectus abdominis", canonical_name: "rectus_abdominis", region: "trunk", muscle_group: "abdominals" },
    { id: "25250a0d-2a40-4d30-9ddb-4fc071d600b4", name: "Infraspinatus", canonical_name: "infraspinatus", region: "shoulder", muscle_group: "rotator cuff" },
    { id: "83ebb2df-4934-4eba-b1f6-cbbaabadae05", name: "Erector spinae", canonical_name: "erector_spinae", region: "back", muscle_group: "spinal extensors" },
  ],
  mappings: [
    { exercise_id: LAT_PULLDOWN, muscle_id: "ebcf52e6-1a4f-4a30-8d2e-477881bbe5d3", role: "primary", contribution_weight: "0.95000", confidence_score: "94.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "68d08033-5b02-4da8-92e7-cb51a30f9d57", role: "secondary", contribution_weight: "0.62000", confidence_score: "91.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "f1b3b747-53d7-4589-a0e8-a4eb18f2e315", role: "secondary", contribution_weight: "0.52000", confidence_score: "87.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "d2743fb6-2854-40d4-b42d-525eb4327d35", role: "secondary", contribution_weight: "0.48000", confidence_score: "84.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "d8060308-faab-4dde-b96f-381caf74eba5", role: "secondary", contribution_weight: "0.42000", confidence_score: "84.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "5038f9e0-6c3e-418c-8905-ed1d85c4c36b", role: "secondary", contribution_weight: "0.40000", confidence_score: "83.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "f9efa759-9572-4960-90c1-9e647570e0ff", role: "secondary", contribution_weight: "0.34000", confidence_score: "78.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "ab2ff141-7c43-469f-9a3c-359e6b02376a", role: "secondary", contribution_weight: "0.32000", confidence_score: "79.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "1a11c3a8-6ee1-4e19-b7c4-499b6bdb5398", role: "secondary", contribution_weight: "0.28000", confidence_score: "76.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "d7668dbe-d6c3-45c6-aeec-74ad4b44306b", role: "stabilizer", contribution_weight: "0.28000", confidence_score: "78.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "052503a0-c538-431a-92f2-2a9b8ed0d875", role: "stabilizer", contribution_weight: "0.22000", confidence_score: "72.00" },
    { exercise_id: LAT_PULLDOWN, muscle_id: "25250a0d-2a40-4d30-9ddb-4fc071d600b4", role: "stabilizer", contribution_weight: "0.20000", confidence_score: "74.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "ebcf52e6-1a4f-4a30-8d2e-477881bbe5d3", role: "primary", contribution_weight: "0.84000", confidence_score: "90.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "ab2ff141-7c43-469f-9a3c-359e6b02376a", role: "primary", contribution_weight: "0.72000", confidence_score: "89.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "f9efa759-9572-4960-90c1-9e647570e0ff", role: "primary", contribution_weight: "0.70000", confidence_score: "86.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "1a11c3a8-6ee1-4e19-b7c4-499b6bdb5398", role: "secondary", contribution_weight: "0.58000", confidence_score: "88.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "68d08033-5b02-4da8-92e7-cb51a30f9d57", role: "secondary", contribution_weight: "0.54000", confidence_score: "87.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "5038f9e0-6c3e-418c-8905-ed1d85c4c36b", role: "secondary", contribution_weight: "0.46000", confidence_score: "82.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "7e1728c3-827c-4a49-94c4-bf6954b89fc1", role: "secondary", contribution_weight: "0.45000", confidence_score: "80.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "f1b3b747-53d7-4589-a0e8-a4eb18f2e315", role: "secondary", contribution_weight: "0.42000", confidence_score: "82.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "d2743fb6-2854-40d4-b42d-525eb4327d35", role: "secondary", contribution_weight: "0.38000", confidence_score: "78.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "d8060308-faab-4dde-b96f-381caf74eba5", role: "secondary", contribution_weight: "0.35000", confidence_score: "80.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "83ebb2df-4934-4eba-b1f6-cbbaabadae05", role: "stabilizer", contribution_weight: "0.28000", confidence_score: "75.00" },
    { exercise_id: MACHINE_LOW_ROW, muscle_id: "25250a0d-2a40-4d30-9ddb-4fc071d600b4", role: "stabilizer", contribution_weight: "0.24000", confidence_score: "76.00" },
  ],
  /** Each lift's score after the age adjustment, as the route receives it. Keyed by "load×reps". */
  scores: {
    "84.822x6": {
      status: "ok", scoring_version: "strength_beta_v2", exercise_id: LAT_PULLDOWN, overall_confidence: 0.8,
      e1rm: { e1rm_kg: 98.503, method: "brzycki_strengthlevel_compatible" },
      percentile: { sex: "male", status: "ok", e1rm_kg: 109.108, censored: false, norm_unit: "x_bodyweight", confidence: 0.8, exercise_id: LAT_PULLDOWN, norm_source: COMMUNITY, lower_anchor: { value: 1.5, percentile: 80 }, upper_anchor: { value: 1.75, percentile: 95 }, bodyweight_kg: 65.8, norm_resolution: "direct", scoring_version: "strength_beta_v1", bodyweight_matched: true, observed_norm_value: 1.65818, percentile_estimate: 89.49, supported_percentile_max: 95, supported_percentile_min: 5 },
      age_adjustment: AGE_17,
      input_observation: { load: 84.822, reps: 6, unit: "kg", exercise_id: LAT_PULLDOWN, exercise_name: "Lat Pulldown" },
    },
    "272.155x12": {
      status: "ok", scoring_version: "strength_beta_v2", exercise_id: MACHINE_LOW_ROW, overall_confidence: 0.592,
      e1rm: { e1rm_kg: 381.017, method: "epley_strengthlevel_compatible" },
      percentile: { sex: "male", status: "above_range", e1rm_kg: 422.039, censored: true, norm_unit: "x_bodyweight", confidence: 0.592, norm_alias: ROW_ALIAS, exercise_id: MACHINE_LOW_ROW, norm_source: COMMUNITY, lower_anchor: { value: 1.75, percentile: 95 }, upper_anchor: { value: 1.75, percentile: 95 }, bodyweight_kg: 65.8, norm_resolution: "aliased_variant", scoring_version: "strength_beta_v1", bodyweight_matched: true, observed_norm_value: 6.41397, percentile_estimate: 95, supported_percentile_max: 95, supported_percentile_min: 5 },
      age_adjustment: AGE_17,
      input_observation: { load: 272.155, reps: 12, unit: "kg", exercise_id: MACHINE_LOW_ROW, exercise_name: "Machine Low Row" },
    },
    "158.757x1": {
      status: "ok", scoring_version: "strength_beta_v2", exercise_id: LAT_PULLDOWN, overall_confidence: 0.8,
      e1rm: { e1rm_kg: 158.757, method: "brzycki_strengthlevel_compatible" },
      percentile: { sex: "male", status: "above_range", e1rm_kg: 175.85, censored: true, norm_unit: "x_bodyweight", confidence: 0.8, exercise_id: LAT_PULLDOWN, norm_source: COMMUNITY, lower_anchor: { value: 1.75, percentile: 95 }, upper_anchor: { value: 1.75, percentile: 95 }, bodyweight_kg: 65.8, norm_resolution: "direct", scoring_version: "strength_beta_v1", bodyweight_matched: true, observed_norm_value: 2.67249, percentile_estimate: 95, supported_percentile_max: 95, supported_percentile_min: 5 },
      age_adjustment: AGE_17,
      input_observation: { load: 158.757, reps: 1, unit: "kg", exercise_id: LAT_PULLDOWN, exercise_name: "Lat Pulldown" },
    },
    "147.418x8": {
      status: "ok", scoring_version: "strength_beta_v2", exercise_id: MACHINE_LOW_ROW, overall_confidence: 0.592,
      e1rm: { e1rm_kg: 183.002, method: "brzycki_epley_linear_blend_strengthlevel_compatible" },
      percentile: { sex: "male", status: "above_range", e1rm_kg: 202.705, censored: true, norm_unit: "x_bodyweight", confidence: 0.592, norm_alias: ROW_ALIAS, exercise_id: MACHINE_LOW_ROW, norm_source: COMMUNITY, lower_anchor: { value: 1.75, percentile: 95 }, upper_anchor: { value: 1.75, percentile: 95 }, bodyweight_kg: 65.8, norm_resolution: "aliased_variant", scoring_version: "strength_beta_v1", bodyweight_matched: true, observed_norm_value: 3.08062, percentile_estimate: 95, supported_percentile_max: 95, supported_percentile_min: 5 },
      age_adjustment: AGE_17,
      input_observation: { load: 147.418, reps: 8, unit: "kg", exercise_id: MACHINE_LOW_ROW, exercise_name: "Machine Low Row" },
    },
  } as Record<string, Record<string, any>>,
};

/** The four lifts in lb, as typed, and the kg the client sends for each. */
export const screenshotLifts = {
  latPulldown187x6: { exerciseName: "Lat Pulldown", catalogExerciseId: 57, loadKg: 84.822, repetitions: 6 },
  machineLowRow600x12: { exerciseName: "Machine Low Row", catalogExerciseId: 53, loadKg: 272.155, repetitions: 12 },
  latPulldown350x1: { exerciseName: "Lat Pulldown", catalogExerciseId: 57, loadKg: 158.757, repetitions: 1 },
  machineLowRow325x8: { exerciseName: "Machine Low Row", catalogExerciseId: 53, loadKg: 147.418, repetitions: 8 },
} as const;
