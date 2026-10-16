import type { AnatomyNode, ExerciseVariant, SpecializationRegionData, VariantMapping } from "@shared/specialization/types";

/**
 * A deltoid region for tests only (brief §1 "Deltoid specialization can be added without a
 * new schema or calculator", §11 "New deltoid region fixture"). It is never registered in
 * production (`status: "fixture"`), and its mappings are marked reviewed only so the
 * calculator has something to count: they are product assumptions for a test, not evidence.
 *
 * The exercises are real catalog rows, checked by test against the catalog:
 * 111 Dumbbell Lateral Raise, 101 Barbell Overhead Press, 90 Bent-Over Rear-Delt Fly and
 * 93 Single-Arm Cable Rear-Delt Fly.
 */

const REGION = "deltoid";
const MAPPINGS = "deltoid_fixture_mappings_v1";

export const deltoidIds = {
  anterior: "deltoid.anterior",
  lateral: "deltoid.lateral",
  posterior: "deltoid.posterior",
  triceps: "upper_arm.triceps",
} as const;

export const deltoidActionIds = {
  flexion: "shoulder.flexion",
  abduction: "shoulder.abduction",
  horizontalAbduction: "shoulder.horizontal_abduction",
  elbowExtension: "elbow.extension",
} as const;

const head = (id: string, name: string, shortName: string, catalogMuscleKey: string, location: string): AnatomyNode => ({
  id,
  regionId: REGION,
  parentId: null,
  kind: "head",
  role: "target",
  name,
  shortName,
  aliases: [],
  layer: "surface",
  surfaceVisibility: "clear",
  status: "draft",
  catalogMuscleKey,
  databaseMuscle: null,
  border: null,
  location,
  whatItDoes: "",
  shapeNote: "",
  caveats: [],
});

const variant = (catalogExerciseId: number, catalogName: string, laterality: ExerciseVariant["laterality"]): ExerciseVariant => ({
  id: `cat-${catalogExerciseId}`,
  catalogExerciseId,
  catalogName,
  organization: "single_joint",
  forearmOrientation: "unknown",
  wristPosition: "unknown",
  gripType: "unknown",
  straps: "not_applicable",
  laterality,
  phase: "concentric_eccentric",
  measure: "reps",
  deliberateHold: false,
  elbowAngleDeg: null,
  notes: "Test fixture.",
});

const mapping = (id: string, variantId: string, nodeId: string, actionId: string, relationship: VariantMapping["relationship"], reviewStatus: VariantMapping["reviewStatus"] = "reviewed"): VariantMapping => ({
  id,
  versionKey: MAPPINGS,
  variantId,
  nodeId,
  actionId,
  relationship,
  muscleMode: "dynamic",
  evidenceBasis: "inference",
  allocation: "individual",
  requiresNoStraps: false,
  rationale: "Test fixture: a product assumption, not evidence.",
  reviewStatus,
  sources: [{ sourceId: "F1", locator: null, limitation: "Fixture only." }],
});

export const deltoidRegionData: SpecializationRegionData = {
  region: { id: REGION, label: "Deltoids", heading: "Deltoid specialization", sortOrder: 90, status: "fixture" },
  nodes: [
    head(deltoidIds.anterior, "Anterior deltoid", "AD", "frontDelts", "Front of the shoulder"),
    head(deltoidIds.lateral, "Lateral deltoid", "LD", "sideDelts", "Outside of the shoulder"),
    head(deltoidIds.posterior, "Posterior deltoid", "PD", "rearDelts", "Back of the shoulder"),
    { ...head(deltoidIds.triceps, "Triceps brachii", "Triceps", "triceps", "Back of the upper arm"), regionId: "upper_arm", kind: "muscle", role: "external" },
  ],
  actions: [
    { id: deltoidActionIds.flexion, joint: "Shoulder", label: "Shoulder flexion", plainDescription: "Raises the arm forward." },
    { id: deltoidActionIds.abduction, joint: "Shoulder", label: "Shoulder abduction", plainDescription: "Raises the arm out to the side." },
    { id: deltoidActionIds.horizontalAbduction, joint: "Shoulder", label: "Horizontal abduction", plainDescription: "Moves a raised arm backward." },
    { id: deltoidActionIds.elbowExtension, joint: "Elbow", label: "Elbow extension", plainDescription: "Straightens the elbow." },
  ],
  nodeActions: [
    { nodeId: deltoidIds.anterior, actionId: deltoidActionIds.flexion, role: "prime", claimId: "deltoid.anterior.function" },
    { nodeId: deltoidIds.lateral, actionId: deltoidActionIds.abduction, role: "prime", claimId: "deltoid.lateral.function" },
    { nodeId: deltoidIds.posterior, actionId: deltoidActionIds.horizontalAbduction, role: "prime", claimId: "deltoid.posterior.function" },
  ],
  claims: [deltoidIds.anterior, deltoidIds.lateral, deltoidIds.posterior].map((nodeId) => ({
    id: `${nodeId}.function`,
    nodeId,
    kind: "function" as const,
    statement: "Fixture statement, not reviewed.",
    basis: "product_assumption" as const,
    reviewStatus: "draft" as const,
    reviewedAt: null,
    reviewNote: null,
    sources: [{ sourceId: "F1", locator: null, qualification: "Fixture only." }],
  })),
  sources: [{ id: "F1", url: "https://example.invalid/deltoid-fixture", title: "Deltoid test fixture (not evidence)", doi: null, evidenceType: "product_assumption", retrievedOn: "2026-10-16", notes: "Exists to prove the calculator and page need no region-specific code." }],
  variants: [
    variant(111, "Dumbbell Lateral Raise", "bilateral"),
    variant(101, "Barbell Overhead Press", "bilateral"),
    variant(90, "Bent-Over Rear-Delt Fly", "bilateral"),
    variant(93, "Single-Arm Cable Rear-Delt Fly", "unilateral"),
  ],
  mappings: [
    mapping("dm-111-lateral", "cat-111", deltoidIds.lateral, deltoidActionIds.abduction, "direct"),
    mapping("dm-111-anterior", "cat-111", deltoidIds.anterior, deltoidActionIds.abduction, "contributing"),
    mapping("dm-101-anterior", "cat-101", deltoidIds.anterior, deltoidActionIds.flexion, "direct"),
    // Pending on purpose: shown as "pending review", never counted.
    mapping("dm-101-lateral", "cat-101", deltoidIds.lateral, deltoidActionIds.abduction, "contributing", "draft"),
    mapping("dm-101-triceps", "cat-101", deltoidIds.triceps, deltoidActionIds.elbowExtension, "contributing"),
    mapping("dm-090-posterior", "cat-90", deltoidIds.posterior, deltoidActionIds.horizontalAbduction, "direct"),
    mapping("dm-093-posterior", "cat-93", deltoidIds.posterior, deltoidActionIds.horizontalAbduction, "direct"),
  ],
  mappingVersion: { key: MAPPINGS, state: "draft", publishedAt: null, methodNotes: "Test fixture only." },
  diagram: {
    key: "deltoid-fixture",
    version: 1,
    regionId: REGION,
    viewBox: { width: 120, height: 80 },
    // The view ids are the shared diagram vocabulary; "back" is the posterior view here.
    views: {
      back: {
        surface: {
          paths: [
            { id: "back__surface__skin__1", nodeId: null, kind: "skin", d: "M10 70 Q60 0 110 70 Z" },
            { id: "back__surface__AD__1", nodeId: deltoidIds.anterior, kind: "belly", d: "M20 60 Q30 30 45 25 L45 60 Z" },
            { id: "back__surface__LD__1", nodeId: deltoidIds.lateral, kind: "belly", d: "M45 25 Q60 15 75 25 L75 60 L45 60 Z" },
            { id: "back__surface__PD__1", nodeId: deltoidIds.posterior, kind: "belly", d: "M75 25 Q90 30 100 60 L75 60 Z" },
          ],
          labels: [{ text: "Front", x: 20, y: 76, anchor: "start" }, { text: "Back", x: 100, y: 76, anchor: "end" }],
        },
      },
    },
    licenseNote: "Drawn for this test fixture.",
  },
};
