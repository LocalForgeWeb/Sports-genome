// Wave A simulation: the forearm page's index once it also reads the upper arm's version for
// upper_arm.biceps (draft §4.2). The merged index is simulated by adding the upper-arm row
// under the forearm's version key, which is what indexRegion's per-variant list would hold.
import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { getSpecializationSummary } from "/home/user/Sports-genome/shared/specialization/exposure";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import type { ExposureBout, SpecializationRegionData, VariantMapping } from "/home/user/Sports-genome/shared/specialization/types";

const catalogMusclesFor = (id: number | null) => { const e = exercises.find((x) => x.id === id); return e ? { primary: e.primaryMuscles, secondary: e.secondaryMuscles } : null; };
const interval = { kind: "custom" as const, startAt: "2026-10-01T00:00:00Z", endAtExclusive: "2026-10-30T00:00:00Z", timezone: "UTC", planWeek: null, label: "x" };
const bout = (id: string, catalogExerciseId: number, side: ExposureBout["side"]): ExposureBout => ({ id, mode: "completed", performedAt: "2026-10-10T10:00:00Z", sessionId: "s", sessionLabel: "s", planWeek: null, dayKey: null, exerciseEntryId: "e", catalogExerciseId, exerciseName: exercises.find((x) => x.id === catalogExerciseId)!.name, matchedBy: "id", side, sideSource: "recorded", straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 10, loadKg: 20, holdSeconds: null }] });
const run = (region: SpecializationRegionData, bouts: ExposureBout[]) => {
  const s = getSpecializationSummary({ region, bouts, interval, side: "left", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "r", planRevision: null, now: "2026-10-19T00:00:00Z" });
  const biceps = s.nodes.find((n) => n.nodeId === "upper_arm.biceps")!;
  return { regionDistinctBouts: s.regionDistinctBouts, regionUnclassified: s.regionUnclassified.bouts, bicepsContributions: biceps.contributions.length, bicepsDirect: biceps.directDynamicBouts + biceps.contributingDynamicBouts, completeness: s.completeness };
};
const pullover = bout("b24", 24, "left");
console.log("forearm v1 today, Dumbbell Pullover (24, tagged forearms secondary, unmapped):", JSON.stringify(run(f, [pullover])));
const v24 = { ...f.variants.find((v) => v.id === "cat-46")!, id: "cat-24", catalogExerciseId: 24, catalogName: "Dumbbell Pullover", laterality: "bilateral" as const };
const upperArmRow: VariantMapping = { ...f.mappings.find((m) => m.id === "cat-121:upper_arm.biceps")!, id: "cat-24:upper_arm.biceps", variantId: "cat-24", relationship: "contributing", muscleMode: "dynamic", actionId: "elbow.flexion" };
const merged: SpecializationRegionData = { ...f, variants: [...f.variants, v24], mappings: [...f.mappings, upperArmRow] };
console.log("wave A, upper arm maps the biceps on 24, current classifier:            ", JSON.stringify(run(merged, [pullover])));
