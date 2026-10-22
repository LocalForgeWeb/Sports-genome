import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { getSpecializationSummary, indexRegion } from "/home/user/Sports-genome/shared/specialization/exposure";
import { loggingPolicyFor } from "/home/user/Sports-genome/shared/specialization/loggingPolicy";
import { calendarWeekInterval } from "/home/user/Sports-genome/shared/specialization/time";
import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { exposureRuleV1 } from "/home/user/Sports-genome/shared/specialization/rules";
import { emitSeedSql, referenceRegionLabels } from "/home/user/Sports-genome/scripts/specialization/emit-seed";
const catalogMusclesLookup = (catalog: typeof exercises) => (id: number | null, name: string) => { const e = catalog.find((x) => (id !== null && x.id === id)) ?? catalog.find((x) => x.name === name); return e ? { primary: e.primaryMuscles, secondary: e.secondaryMuscles } : null; };
import { boutsFromSessions } from "/home/user/Sports-genome/client/src/lib/specialization/bouts";
import type { AnatomyNode, ExerciseVariant, ExposureBout, SpecializationRegionData, VariantMapping } from "/home/user/Sports-genome/shared/specialization/types";

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const catalogMusclesFor = catalogMusclesLookup(exercises);
const fv = (id: number) => forearmRegionData.variants.find((v) => v.catalogExerciseId === id)!;

function node(id: string, regionId: string, role: AnatomyNode["role"], key: string | null): AnatomyNode {
  return { id, regionId, parentId: null, kind: "muscle", role, name: id, shortName: id, aliases: [], layer: "surface", surfaceVisibility: "clear", status: "reviewed", catalogMuscleKey: key, databaseMuscle: null, border: null, location: "x", whatItDoes: "x", shapeNote: "x", caveats: [] };
}
function variant(id: number, laterality: ExerciseVariant["laterality"], measure: ExerciseVariant["measure"] = "reps", deliberateHold = false): ExerciseVariant {
  return { id: `cat-${id}`, catalogExerciseId: id, catalogName: exercises.find((e) => e.id === id)!.name, organization: "multi_joint", forearmOrientation: "unknown", wristPosition: "unknown", gripType: "unknown", straps: "not_applicable", laterality, phase: "concentric_eccentric", measure, deliberateHold, elbowAngleDeg: null, notes: null };
}
function mapping(version: string, variantId: string, nodeId: string, actionId: string, relationship: VariantMapping["relationship"] = "direct", mode: VariantMapping["muscleMode"] = "dynamic"): VariantMapping {
  return { id: `${variantId}:${nodeId}`, versionKey: version, variantId, nodeId, actionId, relationship, muscleMode: mode, evidenceBasis: "anatomy", allocation: "individual", requiresNoStraps: false, rationale: "x", reviewStatus: "reviewed", sources: [{ sourceId: "X1", locator: "x", limitation: null }] };
}
function region(id: string, nodes: AnatomyNode[], variants: ExerciseVariant[], mappings: VariantMapping[], version: string): SpecializationRegionData {
  return {
    region: { id, label: id, heading: id, sortOrder: 50, status: "production", bodyMapKeys: [], entryLabel: id, wording: { externalGroup: "x", incidentalWork: "x", progressSubtitle: "x" }, measurementMetrics: ["circumference_cm"] },
    nodes, actions: [forearmRegionData.actions.find((a) => a.id === "elbow.flexion")!, { id: "hip.extension", joint: "Hip", label: "Hip extension", plainDescription: "x" }, { id: "trunk.lateral_flexion", joint: "Trunk", label: "x", plainDescription: "x" }],
    nodeActions: [], claims: [], sources: [{ id: "X1", url: "https://example.invalid", title: "x", doi: null, evidenceType: "anatomy", retrievedOn: "2026-10-19", notes: null }],
    variants, mappings, mappingVersion: { key: version, state: "draft", publishedAt: null, methodNotes: "x" }, diagram: null,
  };
}
const bout = (id: string, catalogExerciseId: number, side: ExposureBout["side"], over: Partial<ExposureBout> = {}): ExposureBout => ({
  id, mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s1", sessionLabel: "x", planWeek: null, dayKey: null, exerciseEntryId: "e1", catalogExerciseId,
  exerciseName: exercises.find((e) => e.id === catalogExerciseId)!.name, matchedBy: "id", side, sideSource: "recorded", straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 10, loadKg: 20, holdSeconds: null }], ...over,
});
const sum = (r: SpecializationRegionData, bouts: ExposureBout[], side: "left" | "right") => getSpecializationSummary({ region: r, bouts, interval: WEEK, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "s", planRevision: null, now: NOW });

// 1. Upper arm as a production region: biceps must be a target there, but the node object is shared.
console.log("== 1. upper_arm region with biceps as target (the forearm lists it as external)");
const upperArm = region("upper_arm", [node("upper_arm.biceps", "upper_arm", "target", "biceps")], [fv(121)], [mapping("upper_arm_mappings_v1", "cat-121", "upper_arm.biceps", "elbow.flexion")], "upper_arm_mappings_v1");
try { emitSeedSql({ regions: [forearmRegionData, upperArm], rules: [exposureRuleV1], referenceRegionLabels }); console.log("seed: ok"); } catch (e) { console.log("seed:", (e as Error).message); }
const upperArmFrozen = region("upper_arm", [{ ...forearmRegionData.nodes.find((n) => n.id === "upper_arm.biceps")! }], [fv(121)], [mapping("upper_arm_mappings_v1", "cat-121", "upper_arm.biceps", "elbow.flexion")], "upper_arm_mappings_v1");
const s1 = sum(upperArmFrozen, [bout("b1", 121, "bilateral")], "left");
console.log("with the frozen node (role external): regionDistinctBouts", s1.regionDistinctBouts, "regionCatalogKeys", [...indexRegion(upperArmFrozen).regionCatalogKeys], "-> page lists biceps under the external heading of its own region");
const s1b = sum(upperArmFrozen, [bout("b2", 23 /* close-grip? */, "bilateral")], "left");
console.log("an unmapped biceps-tagged exercise is region work?", s1b.completeness.boutsRegionOnly, "(0: role external drops 'biceps' from the region's catalog keys)");

// 2. A second region with its own cat-188 variant (leg laterality) vs the forearm's frozen cat-188.
console.log("\n== 2. thigh region defines cat-188 Single-Leg RDL as unilateral (legs); forearm's cat-188 says", fv(188).laterality);
const thigh = region("thigh", [node("thigh.hamstrings", "thigh", "target", "hamstrings")], [variant(188, "unilateral")], [mapping("thigh_mappings_v1", "cat-188", "thigh.hamstrings", "hip.extension")], "thigh_mappings_v1");
try { emitSeedSql({ regions: [forearmRegionData, thigh], rules: [exposureRuleV1], referenceRegionLabels }); console.log("seed: ok"); } catch (e) { console.log("seed:", (e as Error).message); }
const regionsForLogger = [forearmRegionData, thigh];
console.log("logger policy (first variant across regions):", JSON.stringify(loggingPolicyFor(188, regionsForLogger.flatMap((r) => r.variants), regionsForLogger.flatMap((r) => r.mappings))));
console.log("logger policy, thigh listed first:", JSON.stringify(loggingPolicyFor(188, [thigh, forearmRegionData].flatMap((r) => r.variants), [])));
// Logged with the logger's default 'both' (forearm 'either' starts on Both)
const sessions = [{ id: "s1", status: "completed", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", title: "x", dayLabel: "x", exercises: [{ id: "e1", exerciseName: "Single-Leg Romanian Deadlift", catalogId: 188, plannedPrescription: "", sets: [{ id: "x1", weight: "20", reps: "10", unit: "kg", completed: true, side: "both" }, { id: "x2", weight: "20", reps: "10", unit: "kg", completed: true }] }] }] as any;
const thighBouts = boutsFromSessions(sessions, { catalog: exercises, variants: thigh.variants, fallbackUnit: "kg" });
console.log("thigh bouts sides:", thighBouts.map((b) => `${b.id}:${b.side}/${b.sideSource}`).join(", "));
const tl = sum(thigh, thighBouts, "left"), tr = sum(thigh, thighBouts, "right");
console.log("hamstrings direct bouts left/right:", tl.nodes[0].directDynamicBouts, tr.nodes[0].directDynamicBouts, "unknown side:", tl.nodes[0].unknownSide.bouts, "(one single-leg set counted on BOTH legs; the other on neither)");

// 3. A trunk region on a per-arm model.
console.log("\n== 3. core region on the per-arm model");
const core = region("core", [node("core.rectus_abdominis", "core", "target", "abs"), node("core.external_oblique", "core", "target", "obliques")], [variant(247, "unilateral", "seconds", true), variant(409, "unilateral", "seconds", true), variant(241, "bilateral")],
  [mapping("core_mappings_v1", "cat-247", "core.external_oblique", "trunk.lateral_flexion", "direct", "isometric"), mapping("core_mappings_v1", "cat-409", "core.external_oblique", "trunk.lateral_flexion", "direct", "isometric"), mapping("core_mappings_v1", "cat-241", "core.rectus_abdominis", "trunk.lateral_flexion")], "core_mappings_v1");
const coreBouts = [bout("c1", 241, "bilateral"), bout("c2", 247, "left", { segments: [{ id: "c2", reps: null, loadKg: null, holdSeconds: 45 }] }), bout("c3", 409, "left", { segments: [{ id: "c3", reps: null, loadKg: 24, holdSeconds: 60 }] }), bout("c4", 247, "unknown", { sideSource: "unknown", segments: [{ id: "c4", reps: null, loadKg: null, holdSeconds: 45 }] })];
for (const side of ["left", "right"] as const) {
  const s = sum(core, coreBouts, side);
  console.log(`${side}: rectus direct ${s.nodes[0].directDynamicBouts}, oblique hold bouts ${s.nodes[1].deliberateHoldBouts} (${s.nodes[1].deliberateHoldSeconds}s), oblique unknown-side ${s.nodes[1].unknownSide.bouts}, region distinct ${s.regionDistinctBouts}`);
}
console.log("-> the decline sit-up shows twice (once per 'arm'); the suitcase carry held in the LEFT hand credits the LEFT oblique, though the side resisting the bend is the right; a side plank with no side recorded counts for neither.");
// 4. Region-only flood for core: unmapped secondary 'abs' tags.
console.log("\n== 4. region-level bucket for a core region from secondary tags");
const squats = [161, 163, 1, 101, 41].map((id, n) => bout(`q${n}`, id, "bilateral"));
const s4 = sum(core, squats, "left");
console.log("squat/bench/press/deadlift bouts counted as core region-only work:", s4.completeness.boutsRegionOnly, s4.regionUnclassified.exercises.map((e) => e.name).join(", "));
