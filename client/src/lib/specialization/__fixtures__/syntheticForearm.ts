import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { externalContributorIds as ext, forearmActionIds as a, forearmGroupIds as g, forearmMuscleIds as m } from "@shared/specialization/ids";
import type { AnatomyNode, ExerciseVariant, SpecializationRegionData, VariantMapping } from "@shared/specialization/types";

/**
 * A forearm-shaped region for calculator tests, built here rather than read from the
 * forearm content (which other work fills in parallel and reviews against sources). It uses
 * the real stable ids and real catalog exercises so tests read like the brief, but every
 * mapping below is a TEST ASSUMPTION chosen to exercise one rule, not a reviewed claim.
 *
 * Catalog rows used: 139 Wrist Curl, 140 Reverse Wrist Curl, 141 Wrist Roller, 142 Plate
 * Pinch, 143 Dead Hang, 145 Farmer Hold, 135 Reverse Curl, 132 Hammer Curl, 43 Barbell
 * Bent-Over Row, 80 Rope Climb. 144 Towel Dead Hang is deliberately left unmapped: it is
 * tagged "forearms" in the catalog, so it is region-level work only.
 */

export const REGION_ID = "forearm";
const VERSION = "synthetic_forearm_v1";

const node = (id: string, name: string, shortName: string, parentId: string | null, extra: Partial<AnatomyNode> = {}): AnatomyNode => ({
  id,
  regionId: REGION_ID,
  parentId,
  kind: "muscle",
  role: "target",
  name,
  shortName,
  aliases: [],
  layer: "surface",
  surfaceVisibility: "partial",
  status: "draft",
  catalogMuscleKey: "forearms",
  databaseMuscle: null,
  border: null,
  location: "",
  whatItDoes: "",
  shapeNote: "",
  caveats: [],
  ...extra,
});

const variant = (catalogExerciseId: number, catalogName: string, extra: Partial<ExerciseVariant> = {}): ExerciseVariant => ({
  id: `cat-${catalogExerciseId}`,
  catalogExerciseId,
  catalogName,
  organization: "single_joint",
  forearmOrientation: "unknown",
  wristPosition: "unknown",
  gripType: "unknown",
  straps: "not_applicable",
  laterality: "either",
  phase: "concentric_eccentric",
  measure: "reps",
  deliberateHold: false,
  elbowAngleDeg: null,
  notes: null,
  ...extra,
});

type MappingSeed = Partial<VariantMapping> & Pick<VariantMapping, "nodeId" | "relationship" | "muscleMode"> & { actionId: string | null };
const map = (catalogExerciseId: number, seed: MappingSeed): VariantMapping => ({
  id: `sm-${catalogExerciseId}-${seed.nodeId.split(".")[1]}-${seed.actionId ?? "none"}`,
  versionKey: VERSION,
  variantId: `cat-${catalogExerciseId}`,
  evidenceBasis: "inference",
  allocation: "individual",
  requiresNoStraps: false,
  rationale: "Synthetic test mapping.",
  reviewStatus: "reviewed",
  sources: [],
  ...seed,
});

const grip = (catalogExerciseId: number, relationship: VariantMapping["relationship"], extra: Partial<VariantMapping> = {}): VariantMapping[] => [
  map(catalogExerciseId, { nodeId: m.flexorDigitorumSuperficialis, actionId: a.fingersPipFlexion, relationship, muscleMode: "isometric", allocation: "shared", ...extra }),
  map(catalogExerciseId, { nodeId: m.flexorDigitorumProfundus, actionId: a.fingersDipFlexion, relationship, muscleMode: "isometric", allocation: "shared", ...extra }),
];

export const syntheticForearm: SpecializationRegionData = {
  region: { id: REGION_ID, label: "Forearms", heading: "Forearm specialization", sortOrder: 10, status: "fixture" },
  nodes: [
    node(g.anterior, "Anterior compartment", "Palm side", null, { kind: "compartment", role: "group", layer: "mixed" }),
    node(g.posterior, "Posterior compartment", "Back side", null, { kind: "compartment", role: "group", layer: "mixed" }),
    node(m.brachioradialis, "Brachioradialis", "BR", g.posterior),
    node(m.flexorCarpiRadialis, "Flexor carpi radialis", "FCR", g.anterior),
    node(m.flexorCarpiUlnaris, "Flexor carpi ulnaris", "FCU", g.anterior),
    node(m.palmarisLongus, "Palmaris longus", "PL", g.anterior),
    node(m.flexorDigitorumSuperficialis, "Flexor digitorum superficialis", "FDS", g.anterior, { layer: "intermediate" }),
    node(m.flexorDigitorumProfundus, "Flexor digitorum profundus", "FDP", g.anterior, { layer: "deep" }),
    node(m.flexorPollicisLongus, "Flexor pollicis longus", "FPL", g.anterior, { layer: "deep" }),
    node(m.extensorCarpiRadialisLongus, "Extensor carpi radialis longus", "ECRL", g.posterior),
    node(m.extensorCarpiRadialisBrevis, "Extensor carpi radialis brevis", "ECRB", g.posterior),
    node(m.extensorCarpiUlnaris, "Extensor carpi ulnaris", "ECU", g.posterior),
    node(m.extensorIndicis, "Extensor indicis", "EI", g.posterior, { layer: "deep" }),
    node(ext.biceps, "Biceps brachii", "Biceps", null, { regionId: "upper_arm", role: "external", catalogMuscleKey: "biceps" }),
    node(ext.brachialis, "Brachialis", "Brachialis", null, { regionId: "upper_arm", role: "external", catalogMuscleKey: "brachialis" }),
  ],
  actions: [
    { id: a.elbowFlexion, joint: "Elbow", label: "Elbow flexion", plainDescription: "Bends the elbow." },
    { id: a.wristFlexion, joint: "Wrist", label: "Wrist flexion", plainDescription: "Bends the wrist toward the palm." },
    { id: a.wristExtension, joint: "Wrist", label: "Wrist extension", plainDescription: "Bends the wrist back." },
    { id: a.radialDeviation, joint: "Wrist", label: "Radial deviation", plainDescription: "Tilts the hand toward the thumb side." },
    { id: a.fingersPipFlexion, joint: "Finger middle joints (PIP)", label: "Middle-joint flexion", plainDescription: "Bends the fingers at their middle joints." },
    { id: a.fingersDipFlexion, joint: "Fingertip joints (DIP)", label: "Fingertip flexion", plainDescription: "Bends the fingertips." },
    { id: a.thumbIpFlexion, joint: "Thumb tip (IP)", label: "Thumb-tip flexion", plainDescription: "Bends the tip of the thumb." },
  ],
  nodeActions: [],
  claims: [],
  sources: [],
  variants: [
    variant(139, "Wrist Curl"),
    variant(140, "Reverse Wrist Curl"),
    variant(141, "Wrist Roller", { laterality: "bilateral" }),
    variant(142, "Plate Pinch", { deliberateHold: true, measure: "seconds", gripType: "pinch" }),
    variant(143, "Dead Hang", { laterality: "bilateral", deliberateHold: true, measure: "seconds", organization: "task", straps: "unknown" }),
    variant(145, "Farmer Hold", { deliberateHold: true, measure: "seconds", organization: "task", straps: "unknown" }),
    variant(135, "Reverse Curl", { laterality: "bilateral", forearmOrientation: "pronated" }),
    variant(132, "Hammer Curl", { forearmOrientation: "neutral" }),
    variant(43, "Barbell Bent-Over Row", { laterality: "bilateral", organization: "multi_joint", straps: "unknown" }),
    variant(80, "Rope Climb", { laterality: "bilateral", organization: "task" }),
  ],
  mappings: [
    // Wrist curl: direct wrist flexion; the fingers only hold the implement.
    map(139, { nodeId: m.flexorCarpiRadialis, actionId: a.wristFlexion, relationship: "direct", muscleMode: "dynamic" }),
    map(139, { nodeId: m.flexorCarpiUlnaris, actionId: a.wristFlexion, relationship: "direct", muscleMode: "dynamic" }),
    map(139, { nodeId: m.palmarisLongus, actionId: a.wristFlexion, relationship: "contributing", muscleMode: "dynamic" }),
    ...grip(139, "stabilizer"),
    // Reverse wrist curl: direct wrist extension; ECRL and ECRB cannot be told apart.
    map(140, { nodeId: m.extensorCarpiRadialisLongus, actionId: a.wristExtension, relationship: "direct", muscleMode: "dynamic", allocation: "shared" }),
    map(140, { nodeId: m.extensorCarpiRadialisBrevis, actionId: a.wristExtension, relationship: "direct", muscleMode: "dynamic", allocation: "shared" }),
    map(140, { nodeId: m.extensorCarpiUlnaris, actionId: a.wristExtension, relationship: "direct", muscleMode: "dynamic" }),
    ...grip(140, "stabilizer"),
    // Wrist roller: two actions for FCR in one set (dynamic flexion, holding radial deviation).
    map(141, { nodeId: m.flexorCarpiRadialis, actionId: a.wristFlexion, relationship: "direct", muscleMode: "dynamic" }),
    map(141, { nodeId: m.flexorCarpiRadialis, actionId: a.radialDeviation, relationship: "stabilizer", muscleMode: "isometric" }),
    // Plate pinch: mapped, but only as a draft.
    map(142, { nodeId: m.flexorPollicisLongus, actionId: a.thumbIpFlexion, relationship: "direct", muscleMode: "isometric", reviewStatus: "draft" }),
    // Holds: deliberate grip that needs a bare hand.
    ...grip(143, "direct", { requiresNoStraps: true }),
    ...grip(145, "direct", { requiresNoStraps: true }),
    // Reverse curl: dynamic elbow flexion, wrist extensors only steady the wrist.
    map(135, { nodeId: m.brachioradialis, actionId: a.elbowFlexion, relationship: "direct", muscleMode: "dynamic" }),
    map(135, { nodeId: m.extensorCarpiRadialisLongus, actionId: a.wristExtension, relationship: "stabilizer", muscleMode: "isometric" }),
    map(135, { nodeId: m.extensorCarpiRadialisBrevis, actionId: a.wristExtension, relationship: "stabilizer", muscleMode: "isometric" }),
    map(135, { nodeId: m.extensorCarpiUlnaris, actionId: a.wristExtension, relationship: "stabilizer", muscleMode: "isometric" }),
    map(135, { nodeId: ext.biceps, actionId: a.elbowFlexion, relationship: "contributing", muscleMode: "dynamic" }),
    map(135, { nodeId: ext.brachialis, actionId: a.elbowFlexion, relationship: "contributing", muscleMode: "dynamic" }),
    // Hammer curl: direct for brachioradialis.
    map(132, { nodeId: m.brachioradialis, actionId: a.elbowFlexion, relationship: "direct", muscleMode: "dynamic" }),
    map(132, { nodeId: ext.brachialis, actionId: a.elbowFlexion, relationship: "contributing", muscleMode: "dynamic" }),
    // Row: incidental grip, not earned with straps.
    ...grip(43, "incidental", { requiresNoStraps: true }),
    // Rope climb: a generic mapping to the palm-side compartment only. It must not fan out.
    map(80, { nodeId: g.anterior, actionId: null, relationship: "contributing", muscleMode: "isometric" }),
    // An older generation of mappings left in the data: never read beside the current one.
    { ...map(139, { nodeId: m.flexorCarpiRadialis, actionId: a.wristFlexion, relationship: "direct", muscleMode: "dynamic" }), id: "old-139-fcr", versionKey: "synthetic_forearm_v0" },
  ],
  mappingVersion: { key: VERSION, state: "draft", publishedAt: null, methodNotes: "Synthetic test region." },
  diagram: null,
};

// ---------------------------------------------------------------- session builders

export type AtlasSet = DeviceSetLog & { side?: "left" | "right" | "both"; holdSeconds?: string; warmup?: boolean };
export type AtlasExercise = Omit<DeviceWorkoutExercise, "sets"> & { sets: AtlasSet[]; straps?: "yes" | "no" };

export const workSet = (over: Partial<AtlasSet> = {}): AtlasSet => ({ weight: "20", reps: "12", unit: "kg", completed: true, ...over });

export function exercise(id: string, exerciseName: string, catalogId: number | undefined, sets: AtlasSet[], over: Partial<AtlasExercise> = {}): AtlasExercise {
  return { id, exerciseName, ...(catalogId !== undefined ? { catalogId } : {}), plannedPrescription: `${sets.length} × 12`, sets, ...over };
}

export function finished(id: string, completedAt: string, exercises: AtlasExercise[], over: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession {
  return {
    id,
    title: "Day 01 workout",
    dayLabel: "Week 1 · Day 01 · Pull",
    startedAt: new Date(Date.parse(completedAt) - 60 * 60_000).toISOString(),
    completedAt,
    status: "completed",
    weightUnit: "kg",
    exercises: exercises as DeviceWorkoutExercise[],
    ...over,
  };
}
