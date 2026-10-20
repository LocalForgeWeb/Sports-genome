import { actionsFor } from "@shared/specialization/actions";
import { hipActionIds as hip, kneeActionIds as knee, shoulderActionIds as shoulder, spineActionIds as spine } from "@shared/specialization/actions/ids";
import { composeRegionData } from "@shared/specialization/compose";
import type { AnatomyNode, ExerciseVariant, MappingVersion, RegionContent, SpecializationRegion, SpecializationRegionData, VariantMapping } from "@shared/specialization/types";

/**
 * Four test regions for the side rules of 10-multi-region.md §2.1 and the crediting of §4.2: a
 * thigh paired by the leg, a core counted on the midline, a back paired by the arm (its side word
 * is "side"), and a shoulder that is the home of a muscle the back lists. Never registered
 * (`status: "fixture"`); every mapping is a test assumption chosen to exercise one rule, not
 * evidence, and is marked reviewed only so the calculator counts it.
 *
 * Real catalog rows, so the catalog's tags apply: 161 Back Squat, 171 Leg Extension, 173 Bulgarian
 * Split Squat, 188 Single-Leg Romanian Deadlift, 46 Dumbbell Row, 409 Suitcase Carry, 241 Decline
 * Sit-Up and 247 Side Plank. Variants are `fx-<id>`, so the shared library never meets them.
 */

export const fx = {
  quads: "fx_thigh.quads",
  hamstrings: "fx_thigh.hamstrings",
  rectus: "fx_core.rectus",
  obliques: "fx_core.obliques",
  lat: "fx_back.lat",
  erectors: "fx_back.erectors",
  ql: "fx_back.ql",
  rearDelt: "fx_shoulder.rear_delt",
} as const;

const node = (id: string, name: string, catalogMuscleKey: string | null): AnatomyNode => ({
  id,
  regionId: id.slice(0, id.indexOf(".")),
  parentId: null,
  kind: "muscle",
  role: "target",
  name,
  shortName: name.replace(/[^A-Za-z]/g, ""),
  aliases: [],
  layer: "surface",
  surfaceVisibility: "clear",
  status: "draft",
  catalogMuscleKey,
  databaseMuscle: null,
  border: null,
  location: "",
  whatItDoes: "",
  shapeNote: "",
  caveats: [],
});

const variant = (catalogExerciseId: number, catalogName: string, sides: Pick<ExerciseVariant, "laterality" | "sidedBy" | "legLaterality" | "sideAnchor">, hold = false): ExerciseVariant => ({
  id: `fx-${catalogExerciseId}`,
  catalogExerciseId,
  catalogName,
  organization: "multi_joint",
  forearmOrientation: "not_applicable",
  wristPosition: "not_applicable",
  gripType: "none",
  straps: "not_applicable",
  phase: "concentric_eccentric",
  measure: hold ? "seconds" : "reps",
  deliberateHold: hold,
  elbowAngleDeg: null,
  notes: "Test fixture.",
  ...sides,
});

export const fxVariants = {
  backSquat: variant(161, "Back Squat", { laterality: "bilateral", sidedBy: "none", legLaterality: "bilateral" }),
  legExtension: variant(171, "Leg Extension", { laterality: "not_applicable", sidedBy: "none", legLaterality: "bilateral" }),
  splitSquat: variant(173, "Bulgarian Split Squat", { laterality: "bilateral", sidedBy: "leg", legLaterality: "unilateral", sideAnchor: "front_leg" }),
  singleLegRdl: variant(188, "Single-Leg Romanian Deadlift", { laterality: "either", sidedBy: "leg", legLaterality: "unilateral", sideAnchor: "stance_leg" }),
  oneArmRow: variant(46, "Dumbbell Row", { laterality: "unilateral", sidedBy: "arm" }),
  suitcaseCarry: variant(409, "Suitcase Carry", { laterality: "unilateral", sidedBy: "arm" }, true),
  declineSitUp: variant(241, "Decline Sit-Up", { laterality: "not_applicable", sidedBy: "none", legLaterality: "bilateral" }),
  sidePlank: variant(247, "Side Plank", { laterality: "not_applicable", sidedBy: "leg", legLaterality: "unilateral", sideAnchor: "bottom_leg" }, true),
} as const;

type MappingSeed = Pick<VariantMapping, "nodeId" | "relationship" | "muscleMode"> & { actionId: string; sideRelation?: VariantMapping["sideRelation"]; allocation?: VariantMapping["allocation"] };
const mapping = (versionKey: string, target: ExerciseVariant, seed: MappingSeed): VariantMapping => ({
  id: `${target.id}:${seed.nodeId}`,
  versionKey,
  variantId: target.id,
  evidenceBasis: "inference",
  allocation: "individual",
  requiresNoStraps: false,
  rationale: "Test fixture: a product assumption, not evidence.",
  reviewStatus: "reviewed",
  sources: [],
  ...seed,
});

const version = (key: string, state: MappingVersion["state"] = "published"): MappingVersion => ({ key, state, publishedAt: state === "published" ? "2026-10-19" : null, methodNotes: "Test fixture only." });

const region = (id: string, label: string, sides: SpecializationRegion["sides"], catalogKeys: string[], words: { one?: string; many?: string; onSide: string }): SpecializationRegion => ({
  id,
  label,
  heading: `${label} specialization`,
  sortOrder: 90,
  status: "fixture",
  sides,
  bodyMapKeys: [],
  catalogKeys,
  regionOnlyTagScope: "primary",
  entryLabel: `Explore ${label.toLowerCase()} coverage`,
  wording: {
    externalGroup: "Other muscles credited here",
    externalHeading: `${label} muscles credited here`,
    incidentalWork: "steadying",
    progressSubtitle: "Performance from your logged sets",
    ...(words.one ? { sideWord: words.one, sideWordPlural: words.many } : {}),
    onSideTemplate: words.onSide,
  },
  measurementMetrics: [],
  measurementDefaults: {},
});

const content = (r: SpecializationRegion, nodes: AnatomyNode[], memberIds: string[], actionIds: string[], variants: ExerciseVariant[], mappings: VariantMapping[], mappingVersion: MappingVersion | null): RegionContent => ({
  region: r,
  nodes,
  members: memberIds.map((nodeId, sortOrder) => ({ nodeId, sortOrder })),
  actions: actionsFor(actionIds),
  nodeActions: [],
  claims: [],
  sources: [],
  variants,
  mappings,
  mappingVersion,
  unmappedTagged: [],
  diagram: null,
});

// ---------------------------------------------------------------- the thigh: paired by the leg

const THIGH = "fx_thigh_mappings_v1";
export const fxThighContent = content(
  region("fx_thigh", "Fixture thighs", { model: "paired", limb: "leg" }, ["quads", "hamstrings"], { one: "leg", many: "legs", onSide: "your {side} fixture thigh" }),
  [node(fx.quads, "Fixture quadriceps", "quads"), node(fx.hamstrings, "Fixture hamstrings", "hamstrings")],
  [fx.quads, fx.hamstrings],
  [knee.extension, hip.extension],
  [fxVariants.backSquat, fxVariants.legExtension, fxVariants.splitSquat, fxVariants.singleLegRdl],
  [
    mapping(THIGH, fxVariants.backSquat, { nodeId: fx.quads, actionId: knee.extension, relationship: "direct", muscleMode: "dynamic" }),
    mapping(THIGH, fxVariants.legExtension, { nodeId: fx.quads, actionId: knee.extension, relationship: "direct", muscleMode: "dynamic" }),
    mapping(THIGH, fxVariants.splitSquat, { nodeId: fx.quads, actionId: knee.extension, relationship: "direct", muscleMode: "dynamic" }),
    mapping(THIGH, fxVariants.singleLegRdl, { nodeId: fx.hamstrings, actionId: hip.extension, relationship: "direct", muscleMode: "dynamic" }),
  ],
  version(THIGH),
);

// ---------------------------------------------------------------- the shoulder: home of a muscle the back lists

const SHOULDER = "fx_shoulder_mappings_v1";
const shoulderRegion = region("fx_shoulder", "Fixture shoulders", { model: "paired", limb: "arm" }, ["rearDelts"], { one: "arm", many: "arms", onSide: "your {side} fixture shoulder" });
const shoulderNodes = [node(fx.rearDelt, "Fixture rear deltoid", "rearDelts")];
const shoulderMappings = [
  // Shared, in the same category as the back's lat on the same row: two versions' shared rows are never grouped.
  mapping(SHOULDER, fxVariants.oneArmRow, { nodeId: fx.rearDelt, actionId: shoulder.extension, relationship: "direct", muscleMode: "dynamic", allocation: "shared" }),
];
export const fxShoulderContent = content(shoulderRegion, shoulderNodes, [fx.rearDelt], [shoulder.extension], [fxVariants.oneArmRow], shoulderMappings, version(SHOULDER));
/** The same shoulder before it has published a version: the back reads its own rows for the rear deltoid. */
export const fxShoulderUnpublished: RegionContent = { ...fxShoulderContent, mappingVersion: version(SHOULDER, "draft") };

// ---------------------------------------------------------------- the back: paired by the arm, side word "side"

const BACK = "fx_back_mappings_v1";
const backMappings = [
  mapping(BACK, fxVariants.oneArmRow, { nodeId: fx.lat, actionId: shoulder.extension, relationship: "direct", muscleMode: "dynamic", allocation: "shared" }),
  mapping(BACK, fxVariants.oneArmRow, { nodeId: fx.erectors, actionId: spine.extension, relationship: "stabilizer", muscleMode: "isometric", sideRelation: "both" }),
  // The back's own row for the rear deltoid: read only while the shoulder has published no version.
  mapping(BACK, fxVariants.oneArmRow, { nodeId: fx.rearDelt, actionId: shoulder.extension, relationship: "contributing", muscleMode: "dynamic" }),
  mapping(BACK, fxVariants.suitcaseCarry, { nodeId: fx.ql, actionId: spine.lateralFlexion, relationship: "direct", muscleMode: "isometric", sideRelation: "opposite" }),
  mapping(BACK, fxVariants.suitcaseCarry, { nodeId: fx.erectors, actionId: spine.extension, relationship: "stabilizer", muscleMode: "isometric", sideRelation: "both" }),
];
export const fxBackContent = content(
  region("fx_back", "Fixture back", { model: "paired", limb: "arm" }, ["lats", "lowerBack"], { one: "side", many: "sides", onSide: "the {side} side of your fixture back" }),
  [node(fx.lat, "Fixture latissimus dorsi", "lats"), node(fx.erectors, "Fixture erector spinae", "lowerBack"), node(fx.ql, "Fixture quadratus lumborum", null)],
  [fx.lat, fx.erectors, fx.ql, fx.rearDelt],
  [shoulder.extension, spine.extension, spine.lateralFlexion],
  [fxVariants.oneArmRow, fxVariants.suitcaseCarry],
  backMappings,
  version(BACK),
);

// ---------------------------------------------------------------- the core: midline

const CORE = "fx_core_mappings_v1";
export const fxCoreContent = content(
  region("fx_core", "Fixture core", { model: "midline" }, ["abs", "obliques"], { onSide: "your fixture core" }),
  [node(fx.rectus, "Fixture rectus abdominis", "abs"), node(fx.obliques, "Fixture obliques", "obliques")],
  [fx.rectus, fx.obliques, fx.ql],
  [spine.flexion, spine.lateralFlexion],
  [fxVariants.suitcaseCarry, fxVariants.declineSitUp, fxVariants.sidePlank],
  [
    mapping(CORE, fxVariants.suitcaseCarry, { nodeId: fx.obliques, actionId: spine.lateralFlexion, relationship: "direct", muscleMode: "isometric", sideRelation: "opposite" }),
    mapping(CORE, fxVariants.declineSitUp, { nodeId: fx.rectus, actionId: spine.flexion, relationship: "direct", muscleMode: "dynamic", sideRelation: "both" }),
    mapping(CORE, fxVariants.sidePlank, { nodeId: fx.obliques, actionId: spine.lateralFlexion, relationship: "direct", muscleMode: "isometric" }),
  ],
  version(CORE),
);

/** The four regions' page data. The back credits the rear deltoid by the shoulder's version; the core credits the quadratus lumborum by the back's. */
export const fxThigh: SpecializationRegionData = composeRegionData(fxThighContent, []);
export const fxShoulder: SpecializationRegionData = composeRegionData(fxShoulderContent, []);
export const fxBack: SpecializationRegionData = composeRegionData(fxBackContent, [fxShoulderContent]);
export const fxCore: SpecializationRegionData = composeRegionData(fxCoreContent, [fxBackContent]);
/** The back while the shoulder has no published version. */
export const fxBackBeforeShoulder: SpecializationRegionData = composeRegionData(fxBackContent, [fxShoulderUnpublished]);
