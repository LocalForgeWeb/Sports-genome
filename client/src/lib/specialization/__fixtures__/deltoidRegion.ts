import { actionsFor } from "@shared/specialization/actions";
import { forearmActionIds, shoulderActionIds } from "@shared/specialization/actions/ids";
import { composeRegionData } from "@shared/specialization/compose";
import type { AnatomyNode, ExerciseVariant, RegionContent, RegionExtras, SpecializationRegion, SpecializationRegionData, TendonMember, VariantMapping } from "@shared/specialization/types";

/**
 * A deltoid region for tests only (brief §1 "Deltoid specialization can be added without a
 * new schema or calculator", §11 "New deltoid region fixture"). It is never registered in
 * production (`status: "fixture"`), and its mappings are marked reviewed only so the
 * calculator has something to count: they are product assumptions for a test, not evidence.
 *
 * The exercises are real catalog rows, checked by test against the catalog:
 * 111 Dumbbell Lateral Raise, 101 Barbell Overhead Press, 90 Bent-Over Rear-Delt Fly and
 * 93 Single-Arm Cable Rear-Delt Fly.
 *
 * It is a second region in full: its own small drawing from the front, the side and the rear
 * (Front · Side · Rear, the lateral head drawn from the side), its own page wording, and
 * circumference as its only measure. The page renders it with no deltoid code
 * (SpecializationPanel.deltoid.render.test.ts) and the seed loads it with no schema change
 * (server/specializationSeed.test.ts).
 *
 * It is composed as a production region is (compose.ts): its own content, and the triceps it
 * lists as an external member from its home, a fixture arm region. Nothing in it shares an id
 * with production content except the joint actions, which are the shared library's: the
 * external is `fixture_arm.triceps`, the variants are `fx-<catalog id>`, so production regions
 * that later map these exercises never collide with it (docs/specialization-atlas/
 * 10-multi-region.md §5.2).
 */

const REGION = "deltoid";
const ARM = "fixture_arm";
const MAPPINGS = "deltoid_fixture_mappings_v1";

export const deltoidIds = {
  anterior: "deltoid.anterior",
  lateral: "deltoid.lateral",
  posterior: "deltoid.posterior",
  triceps: "fixture_arm.triceps",
} as const;

export const deltoidActionIds = {
  flexion: shoulderActionIds.flexion,
  abduction: shoulderActionIds.abduction,
  horizontalAbduction: shoulderActionIds.horizontalAbduction,
  elbowExtension: forearmActionIds.elbowExtension,
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
  id: `fx-${catalogExerciseId}`,
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
  sidedBy: laterality === "bilateral" ? "none" : "arm",
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

/** The home of the triceps the deltoid lists: a fixture region, never registered, with no page of its own. */
export const fixtureArmRegion: SpecializationRegion = {
  id: ARM,
  label: "Fixture arm",
  heading: "Fixture arm specialization",
  sortOrder: 91,
  status: "fixture",
  sides: { model: "paired", limb: "arm" },
  bodyMapKeys: [],
  catalogKeys: ["triceps"],
  regionOnlyTagScope: "primary",
  entryLabel: "Explore fixture arm coverage",
  wording: {
    externalGroup: "Other muscles credited here", externalHeading: "Fixture arm muscles credited here", incidentalWork: "steadying", progressSubtitle: "Circumference, by arm",
    sideWord: "arm", sideWordPlural: "arms", onSideTemplate: "your {side} fixture arm",
  },
  measurementMetrics: [],
  measurementDefaults: {},
};

export const fixtureArmContent: RegionContent = {
  region: fixtureArmRegion,
  nodes: [{ ...head(deltoidIds.triceps, "Triceps brachii", "Triceps", "triceps", "Back of the upper arm"), regionId: ARM, kind: "muscle" }],
  members: [{ nodeId: deltoidIds.triceps, sortOrder: 0 }],
  actions: actionsFor([deltoidActionIds.elbowExtension]),
  nodeActions: [],
  claims: [],
  sources: [],
  variants: [],
  mappings: [],
  mappingVersion: null,
  unmappedTagged: [],
  diagram: null,
};

export const deltoidContent: RegionContent = {
  region: {
    id: REGION,
    label: "Deltoids",
    heading: "Deltoid specialization",
    sortOrder: 90,
    status: "fixture",
    sides: { model: "paired", limb: "arm" },
    bodyMapKeys: ["frontDelts", "sideDelts", "rearDelts"],
    catalogKeys: ["frontDelts", "sideDelts", "rearDelts"],
    regionOnlyTagScope: "any",
    entryLabel: "Explore deltoid coverage",
    // Its own words, so a test can tell them from the forearm's.
    wording: {
      externalGroup: "Other muscles credited here", externalHeading: "Deltoid muscles credited here", incidentalWork: "bracing", progressSubtitle: "Circumference, by arm",
      sideWord: "arm", sideWordPlural: "arms", onSideTemplate: "your {side} shoulder",
    },
    measurementMetrics: ["circumference_cm"],
    measurementDefaults: { circumference_cm: { landmark: "Around the shoulder", posture: "arm_relaxed_hanging" } },
  },
  nodes: [
    head(deltoidIds.anterior, "Anterior deltoid", "AD", "frontDelts", "Front of the shoulder"),
    head(deltoidIds.lateral, "Lateral deltoid", "LD", "sideDelts", "Outside of the shoulder"),
    head(deltoidIds.posterior, "Posterior deltoid", "PD", "rearDelts", "Back of the shoulder"),
  ],
  members: [deltoidIds.anterior, deltoidIds.lateral, deltoidIds.posterior, deltoidIds.triceps].map((nodeId, sortOrder) => ({ nodeId, sortOrder })),
  actions: actionsFor([deltoidActionIds.flexion, deltoidActionIds.abduction, deltoidActionIds.horizontalAbduction, deltoidActionIds.elbowExtension]),
  nodeActions: [
    { nodeId: deltoidIds.anterior, actionId: deltoidActionIds.flexion, role: "prime", claimId: "deltoid.anterior.function", claimKey: "deltoid:deltoid.anterior.function" },
    { nodeId: deltoidIds.lateral, actionId: deltoidActionIds.abduction, role: "prime", claimId: "deltoid.lateral.function", claimKey: "deltoid:deltoid.lateral.function" },
    { nodeId: deltoidIds.posterior, actionId: deltoidActionIds.horizontalAbduction, role: "prime", claimId: "deltoid.posterior.function", claimKey: "deltoid:deltoid.posterior.function" },
  ],
  claims: [deltoidIds.anterior, deltoidIds.lateral, deltoidIds.posterior].map((nodeId) => ({
    id: `${nodeId}.function`,
    ownerRegionId: REGION,
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
    mapping("dm-111-lateral", "fx-111", deltoidIds.lateral, deltoidActionIds.abduction, "direct"),
    mapping("dm-111-anterior", "fx-111", deltoidIds.anterior, deltoidActionIds.abduction, "contributing"),
    mapping("dm-101-anterior", "fx-101", deltoidIds.anterior, deltoidActionIds.flexion, "direct"),
    // Pending on purpose: shown as "pending review", never counted.
    mapping("dm-101-lateral", "fx-101", deltoidIds.lateral, deltoidActionIds.abduction, "contributing", "draft"),
    mapping("dm-101-triceps", "fx-101", deltoidIds.triceps, deltoidActionIds.elbowExtension, "contributing"),
    mapping("dm-090-posterior", "fx-90", deltoidIds.posterior, deltoidActionIds.horizontalAbduction, "direct"),
    mapping("dm-093-posterior", "fx-93", deltoidIds.posterior, deltoidActionIds.horizontalAbduction, "direct"),
  ],
  mappingVersion: { key: MAPPINGS, state: "draft", publishedAt: null, methodNotes: "Test fixture only." },
  unmappedTagged: [],
  diagram: {
    key: "deltoid-fixture",
    version: 1,
    regionId: REGION,
    viewBox: { width: 120, height: 80 },
    // Its own views, in its own words: nothing in the page or the renderer knows these ids.
    viewOrder: [{ id: "front", label: "Front" }, { id: "side", label: "Side" }, { id: "rear", label: "Rear" }],
    // The subject's right shoulder. From the front its outer edge is on the viewer's left; from
    // the side the subject faces right; from behind the outer edge is on the viewer's right.
    views: {
      front: {
        surface: {
          paths: [
            { id: "front__surface__skin__1", nodeId: null, kind: "skin", d: "M10 72 Q20 10 60 10 Q100 10 110 72 Z" },
            { id: "front__surface__ld__1", nodeId: deltoidIds.lateral, kind: "belly", d: "M14 64 Q20 26 34 18 L40 60 Z" },
            { id: "front__surface__ad__1", nodeId: deltoidIds.anterior, kind: "belly", d: "M34 18 Q60 10 84 22 L72 62 L40 60 Z" },
          ],
          labels: [{ text: "Outside", x: 4, y: 77, anchor: "start" }, { text: "Chest", x: 116, y: 77, anchor: "end" }],
        },
      },
      side: {
        surface: {
          paths: [
            { id: "side__surface__skin__1", nodeId: null, kind: "skin", d: "M10 70 Q60 0 110 70 Z" },
            { id: "side__surface__pd__1", nodeId: deltoidIds.posterior, kind: "belly", d: "M20 60 Q30 30 45 25 L45 60 Z" },
            { id: "side__surface__ld__1", nodeId: deltoidIds.lateral, kind: "belly", d: "M45 25 Q60 15 75 25 L75 60 L45 60 Z" },
            { id: "side__surface__ad__1", nodeId: deltoidIds.anterior, kind: "belly", d: "M75 25 Q90 30 100 60 L75 60 Z" },
          ],
          labels: [{ text: "Back", x: 4, y: 77, anchor: "start" }, { text: "Front", x: 116, y: 77, anchor: "end" }],
        },
      },
      rear: {
        surface: {
          paths: [
            { id: "rear__surface__skin__1", nodeId: null, kind: "skin", d: "M10 72 Q20 10 60 10 Q100 10 110 72 Z" },
            { id: "rear__surface__pd__1", nodeId: deltoidIds.posterior, kind: "belly", d: "M36 22 Q60 10 86 18 L80 60 L48 62 Z" },
            { id: "rear__surface__ld__1", nodeId: deltoidIds.lateral, kind: "belly", d: "M86 18 Q100 26 106 64 L80 60 Z" },
          ],
          labels: [{ text: "Spine", x: 4, y: 77, anchor: "start" }, { text: "Outside", x: 116, y: 77, anchor: "end" }],
        },
      },
    },
    licenseNote: "Drawn for this test fixture.",
  },
  // The stack designer, with the profiles below (`deltoidRepProfiles`), so the page's card renders on a second region;
  // tendon exposure, with the areas below (`deltoidTendonAreas`), likewise.
  sections: { stack: true, tendonExposure: true },
};

export const deltoidRegionData: SpecializationRegionData = composeRegionData(deltoidContent, [fixtureArmContent]);

/**
 * The deltoid's rep profiles (11-forearm-research-and-stack.md §3.10: "the deltoid fixture, which
 * gains two rep profiles"), so the stack designer runs on a second region with no deltoid code.
 * Test numbers, not guidance. The press keeps its whole-exercise prescription (no profile), so the
 * designer's no-profile path runs too; the one-arm fly is marked for coverage only, as a reviewed
 * family would mark a drill, so the coverage-only rule runs on a region other than the forearm.
 */
export const deltoidRepProfiles: RegionExtras = {
  regionId: REGION,
  repProfiles: [
    { id: "deltoid.raise", label: "Raise", measure: "reps", growth: [12, 20], strength: [8, 12], evidence: "starting_default", origin: { family: "fixture_raise", status: "fixture" }, note: "Test fixture: not guidance." },
    { id: "deltoid.rear_fly", label: "Rear fly", measure: "reps", growth: [12, 25], strength: null, evidence: "starting_default", origin: { family: "fixture_rear_fly", status: "fixture" }, note: "Test fixture: not guidance." },
  ],
  repProfileAssignments: [
    { variantId: "fx-111", profileId: "deltoid.raise", strengthApplies: true, coverageOnly: false },
    { variantId: "fx-90", profileId: "deltoid.rear_fly", strengthApplies: false, coverageOnly: false },
    { variantId: "fx-93", profileId: "deltoid.rear_fly", strengthApplies: false, coverageOnly: true, coverageNote: "Test fixture: a drill marked for coverage, not volume." },
  ],
  unprofiledVariants: [{ variantId: "fx-101", reason: "Test fixture: a press keeps its whole-exercise prescription." }],
  repGuidanceCitations: { general: ["F1"], effort: ["F1"], holds: ["F1"] },
  referenceSources: [],
};

const tendonMember = (nodeId: string, reviewStatus: TendonMember["reviewStatus"] = "reviewed"): TendonMember => ({
  nodeId,
  citations: [{ sourceId: "F1", locator: "Fixture only.", qualification: null }],
  packageGroups: [],
  reviewStatus,
  reviewNote: reviewStatus === "reviewed" ? "Test fixture: a product assumption, not evidence." : "Test fixture: a draft pair, kept out of this group only.",
  singleSource: true,
});

/**
 * The deltoid's tendon areas (11-forearm-research-and-stack.md §4.6: "the deltoid fixture gains two
 * areas"), so tendon exposure runs on a second region with no deltoid code. Test data, not anatomy,
 * shaped to run every path once:
 * - the lateral head is in both areas, so one set counts once in each and the areas are never added;
 * - the anterior head is a reviewed member of the first area's group and a draft member of the
 *   second's, so that one pair is kept out while the head still counts in the first area;
 * - the posterior head is in no group, so it is listed as not placed, with its reason;
 * - the triceps, an external member, is in none;
 * - one group has a caveat and the other none.
 */
export const deltoidTendonAreas: RegionExtras = {
  regionId: REGION,
  tendonAreas: [
    {
      id: "deltoid.tendon.front",
      label: "Front of the shoulder",
      description: "Test fixture: where the front and side heads attach at the front.",
      groups: [{ id: "deltoid.tendon.front_heads", label: "Front and side heads", members: [tendonMember(deltoidIds.anterior), tendonMember(deltoidIds.lateral)], caveat: "Test fixture: a caveat, said on the page." }],
    },
    {
      id: "deltoid.tendon.outer",
      label: "Outer shoulder",
      description: "Test fixture: where the side head attaches on the outside.",
      groups: [{ id: "deltoid.tendon.outer_heads", label: "Side and front heads", members: [tendonMember(deltoidIds.lateral), tendonMember(deltoidIds.anterior, "draft")], caveat: null }],
    },
  ],
  tendonNotPlaced: [{ nodeId: deltoidIds.posterior, reason: "Test fixture: a head in no group, so the not-placed line runs on a second region." }],
  referenceSources: [],
};
