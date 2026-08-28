export type StrengthEvidenceStatus =
  | "AWAITING_EVIDENCE"
  | "REFERENCE_SUPPORTED";

export type StrengthDomainDefinition = {
  id: string;
  label: string;
  group: "Pressing" | "Pulling and arms" | "Trunk" | "Hip and knee" | "Lower leg";
  description: string;
  evidenceStatus: StrengthEvidenceStatus;
};

export type StrengthRegionDefinition = {
  id: string;
  label: string;
  bodyArea: "Upper body" | "Trunk" | "Lower body";
  description: string;
};

/**
 * These records establish the shared vocabulary for data routing and UI.
 * They intentionally contain no numeric inference/mapping coefficients until
 * approved evidence records are attached in the database.
 */
export const strengthDomainDefinitions: StrengthDomainDefinition[] = [
  { id: "horizontal_press", label: "Horizontal pressing", group: "Pressing", description: "Pressing force in a horizontal line of action.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "incline_press", label: "Incline / angled pressing", group: "Pressing", description: "Pressing force through an inclined or angled line of action.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "vertical_press", label: "Vertical pressing", group: "Pressing", description: "Pressing force overhead or close to a vertical line of action.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "shoulder_abduction", label: "Shoulder abduction", group: "Pressing", description: "Strength expressed while moving the upper arm away from the torso.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "shoulder_extension", label: "Shoulder extension", group: "Pressing", description: "Strength expressed while moving the upper arm behind the torso.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "shoulder_external_rotation", label: "Shoulder external rotation", group: "Pressing", description: "Externally rotating shoulder capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "shoulder_internal_rotation", label: "Shoulder internal rotation", group: "Pressing", description: "Internally rotating shoulder capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "horizontal_pull", label: "Horizontal pulling", group: "Pulling and arms", description: "Pulling force toward the torso in a horizontal line of action.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "vertical_pull", label: "Vertical pulling", group: "Pulling and arms", description: "Pulling force along a vertical line of action.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "elbow_flexion", label: "Elbow flexion", group: "Pulling and arms", description: "Elbow-flexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "elbow_extension", label: "Elbow extension", group: "Pulling and arms", description: "Elbow-extension capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "grip", label: "Grip", group: "Pulling and arms", description: "Hand-grip capacity measured with a stated testing protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "wrist_flexion", label: "Wrist flexion", group: "Pulling and arms", description: "Wrist-flexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "wrist_extension", label: "Wrist extension", group: "Pulling and arms", description: "Wrist-extension capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "trunk_flexion", label: "Trunk flexion", group: "Trunk", description: "Trunk-flexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "trunk_extension", label: "Trunk extension", group: "Trunk", description: "Trunk-extension capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "anti_extension", label: "Anti-extension", group: "Trunk", description: "Trunk control against extension measured with a stated task.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "anti_flexion", label: "Anti-flexion", group: "Trunk", description: "Trunk control against flexion measured with a stated task.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "anti_rotation", label: "Anti-rotation", group: "Trunk", description: "Trunk control against rotation measured with a stated task.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "rotation", label: "Rotation", group: "Trunk", description: "Rotational trunk capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "lateral_trunk", label: "Lateral trunk strength", group: "Trunk", description: "Lateral trunk control measured with a stated task.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "hip_extension", label: "Hip extension", group: "Hip and knee", description: "Hip-extension capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "hip_flexion", label: "Hip flexion", group: "Hip and knee", description: "Hip-flexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "hip_abduction", label: "Hip abduction", group: "Hip and knee", description: "Hip-abduction capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "hip_adduction", label: "Hip adduction", group: "Hip and knee", description: "Hip-adduction capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "knee_extension", label: "Knee extension", group: "Hip and knee", description: "Knee-extension capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "knee_flexion", label: "Knee flexion", group: "Hip and knee", description: "Knee-flexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "plantarflexion", label: "Plantarflexion", group: "Lower leg", description: "Ankle plantarflexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
  { id: "dorsiflexion", label: "Dorsiflexion", group: "Lower leg", description: "Ankle dorsiflexion capacity measured with a suitable protocol.", evidenceStatus: "AWAITING_EVIDENCE" },
];

export const strengthRegionDefinitions: StrengthRegionDefinition[] = [
  { id: "shoulders", label: "Shoulders", bodyArea: "Upper body", description: "An athlete-facing region informed by multiple shoulder and pressing domains." },
  { id: "chest", label: "Chest", bodyArea: "Upper body", description: "An athlete-facing region informed by appropriately mapped pressing domains." },
  { id: "upper_back", label: "Upper back", bodyArea: "Upper body", description: "An athlete-facing region informed by appropriately mapped pulling domains." },
  { id: "lats", label: "Lats", bodyArea: "Upper body", description: "An athlete-facing region informed by appropriately mapped pulling domains." },
  { id: "biceps", label: "Biceps", bodyArea: "Upper body", description: "An athlete-facing region informed by elbow-flexion and related domains." },
  { id: "triceps", label: "Triceps", bodyArea: "Upper body", description: "An athlete-facing region informed by elbow-extension and pressing domains." },
  { id: "forearms_grip", label: "Forearms / grip", bodyArea: "Upper body", description: "An athlete-facing region informed by grip and wrist domains." },
  { id: "abdominals", label: "Abdominals", bodyArea: "Trunk", description: "An athlete-facing region informed by trunk domains." },
  { id: "obliques", label: "Obliques", bodyArea: "Trunk", description: "An athlete-facing region informed by rotation and lateral trunk domains." },
  { id: "spinal_erectors", label: "Spinal erectors", bodyArea: "Trunk", description: "An athlete-facing region informed by trunk-extension domains." },
  { id: "glutes", label: "Glutes", bodyArea: "Lower body", description: "An athlete-facing region informed by hip-extension and related domains." },
  { id: "hip_flexors", label: "Hip flexors", bodyArea: "Lower body", description: "An athlete-facing region informed by hip-flexion domains." },
  { id: "hip_adductors", label: "Hip adductors", bodyArea: "Lower body", description: "An athlete-facing region informed by hip-adduction domains." },
  { id: "hip_abductors", label: "Hip abductors", bodyArea: "Lower body", description: "An athlete-facing region informed by hip-abduction domains." },
  { id: "quadriceps", label: "Quadriceps", bodyArea: "Lower body", description: "An athlete-facing region informed by knee-extension domains." },
  { id: "hamstrings", label: "Hamstrings", bodyArea: "Lower body", description: "An athlete-facing region informed by knee-flexion and hip-extension domains." },
  { id: "calves", label: "Calves", bodyArea: "Lower body", description: "An athlete-facing region informed by plantarflexion domains." },
  { id: "tibialis_anterior", label: "Tibialis anterior", bodyArea: "Lower body", description: "An athlete-facing region informed by dorsiflexion domains." },
];

export type StrengthObservationRoute = {
  aliases: string[];
  domainIds: string[];
  regionIds: string[];
  basis: "EXERCISE_MOVEMENT_CLASSIFICATION";
  boundary: string;
};

/**
 * These routes classify an athlete-entered test by the exercise named, then
 * report only where an observation belongs. They deliberately contain no
 * conversion coefficient, regional-force estimate, tier, percentile, or
 * cross-test comparison. A squat result, for example, is retained as a squat
 * observation and can be shown as relevant to broad hip/knee domains; it does
 * not measure quadriceps or glute strength directly.
 */
export const strengthObservationRoutes: StrengthObservationRoute[] = [
  { aliases: ["barbell back squat", "back squat", "front squat", "barbell front squat"], domainIds: ["knee_extension", "hip_extension"], regionIds: ["quadriceps", "glutes", "hamstrings"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a squat test to broad hip and knee domains; it does not directly measure individual muscle force." },
  { aliases: ["bench press", "barbell bench press", "dumbbell bench press", "chest press"], domainIds: ["horizontal_press", "elbow_extension"], regionIds: ["chest", "triceps", "shoulders"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a pressing test to broad pressing domains; it does not directly measure chest, shoulder, or triceps force." },
  { aliases: ["overhead press", "barbell overhead press", "shoulder press", "military press"], domainIds: ["vertical_press", "elbow_extension"], regionIds: ["shoulders", "triceps"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes an overhead pressing test to broad pressing domains; it does not directly measure shoulder or triceps force." },
  { aliases: ["deadlift", "conventional deadlift", "romanian deadlift", "rdl"], domainIds: ["hip_extension", "trunk_extension"], regionIds: ["glutes", "hamstrings", "spinal_erectors"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a hip-hinge test to broad hip and trunk domains; it does not directly measure glute, hamstring, or spinal-erector force." },
  { aliases: ["hip thrust", "barbell hip thrust", "glute bridge"], domainIds: ["hip_extension"], regionIds: ["glutes", "hamstrings"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a hip-extension test to a broad hip-extension domain; it does not directly measure glute or hamstring force." },
  { aliases: ["pull up", "pullup", "weighted pull up", "lat pulldown"], domainIds: ["vertical_pull", "elbow_flexion"], regionIds: ["lats", "upper_back", "biceps"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a vertical pulling test to broad pulling domains; it does not directly measure lat, upper-back, or biceps force." },
  { aliases: ["barbell row", "bent over row", "seated cable row", "row"], domainIds: ["horizontal_pull", "elbow_flexion"], regionIds: ["upper_back", "lats", "biceps"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a horizontal pulling test to broad pulling domains; it does not directly measure individual regional force." },
  { aliases: ["biceps curl", "barbell curl", "straight bar curl", "ez bar curl", "dumbbell curl", "alternating dumbbell curl", "cable curl", "preacher curl", "hammer curl"], domainIds: ["elbow_flexion"], regionIds: ["biceps"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes an elbow-flexion curl test to broad biceps context; it does not directly measure biceps force or create a generic strength rank." },
  { aliases: ["leg curl", "seated leg curl", "lying leg curl"], domainIds: ["knee_flexion"], regionIds: ["hamstrings"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a knee-flexion test to a broad hamstring-related domain; it does not directly measure hamstring force." },
  { aliases: ["leg extension", "seated leg extension"], domainIds: ["knee_extension"], regionIds: ["quadriceps"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a knee-extension test to a broad quadriceps-related domain; it does not directly measure quadriceps force." },
  { aliases: ["calf raise", "standing calf raise", "seated calf raise"], domainIds: ["plantarflexion"], regionIds: ["calves"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a plantarflexion test to a broad calf-related domain; it does not directly measure calf force." },
  { aliases: ["grip dynamometry", "hand grip dynamometry", "grip test"], domainIds: ["grip"], regionIds: ["forearms_grip"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a stated grip test to the grip domain; comparability depends on the named dynamometer protocol." },
  { aliases: ["plank", "front plank", "rkc plank", "weighted plank"], domainIds: ["anti_extension"], regionIds: ["abdominals"], basis: "EXERCISE_MOVEMENT_CLASSIFICATION", boundary: "Routes a plank hold to trunk-control context; it does not measure abdominal force or a regional strength rank." },
];

function normalizedTestName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

export function resolveStrengthObservationRoute(exerciseName: string) {
  const normalized = normalizedTestName(exerciseName);
  return strengthObservationRoutes.find(route => route.aliases.some(alias => normalized === normalizedTestName(alias))) ?? null;
}

export type StrengthCatalogSelection = { name: string; primaryMuscles: string[]; secondaryMuscles: string[] };

/**
 * Presentation context for a deliberately selected catalog exercise. The route
 * remains a broad classification, never a measured regional-strength result.
 */
export function getStrengthCatalogSelectionContext(exercise: StrengthCatalogSelection) {
  const route = resolveStrengthObservationRoute(exercise.name);
  return {
    exerciseName: exercise.name,
    primaryMuscles: exercise.primaryMuscles,
    supportingMuscles: exercise.secondaryMuscles,
    domainLabels: route?.domainIds.map((id) => strengthDomainDefinitions.find((domain) => domain.id === id)?.label ?? id) ?? [],
    regionLabels: route?.regionIds.map((id) => strengthRegionDefinitions.find((region) => region.id === id)?.label ?? id) ?? [],
    boundary: route?.boundary ?? "No broad Strength Genome test context is mapped for this catalog exercise yet.",
  };
}
