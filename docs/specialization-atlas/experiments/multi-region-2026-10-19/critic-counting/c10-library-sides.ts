// Wave 1 adds library variants for rows a region key tags (draft §3, §9.1) and one resolver reads
// the library for bouts (§3 "variantFor ... used by exposure, bouts, planBouts"). The forearm
// does not map 190 Good Morning (tagged forearms, secondary): today it is region-only with no arm.
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { boutsFromSessions } from "/home/user/Sports-genome/client/src/lib/specialization/bouts";
import { getSpecializationSummary } from "/home/user/Sports-genome/shared/specialization/exposure";
import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
const gm = exercises.find((e) => e.id === 190)!;
const session = { id: "s1", status: "completed", startedAt: "2026-10-14T10:00:00Z", completedAt: "2026-10-14T11:00:00Z", dayLabel: "Legs", title: "Legs", exercises: [{ id: "e1", exerciseName: gm.name, catalogId: 190, plannedPrescription: "3 × 8", sets: [0, 1, 2].map((i) => ({ id: `g${i}`, weight: "60", reps: "8", completed: true, skipped: false })) }] } as any;
const catalogMusclesFor = (id: number | null) => { const e = exercises.find((x) => x.id === id); return e ? { primary: e.primaryMuscles, secondary: e.secondaryMuscles } : null; };
const interval = { kind: "calendar_week" as const, startAt: "2026-10-12T00:00:00Z", endAtExclusive: "2026-10-19T00:00:00Z", timezone: "UTC", planWeek: null, label: "w" };
const summarize = (variants: any[]) => {
  const bouts = boutsFromSessions([session], { catalog: exercises, variants, fallbackUnit: "kg" });
  const s = getSpecializationSummary({ region: f, bouts, interval, side: "left", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "r", planRevision: null, now: "2026-10-18T12:00:00Z" });
  return { sides: bouts.map((b) => b.side).join(","), regionOnly: s.regionUnclassified.bouts, unknownSide: s.completeness.boutsUnknownSide, rowsWithNoArm: (s.regionUnclassifiedRows ?? []).filter((r) => r.side === "unknown").length };
};
console.log("today (forearm variants only):     ", JSON.stringify(summarize(f.variants)));
const goodMorning = { ...f.variants.find((v) => v.id === "cat-41")!, id: "cat-190", catalogExerciseId: 190, catalogName: gm.name, laterality: "bilateral" };
console.log("wave 1 (library has cat-190):      ", JSON.stringify(summarize([...f.variants, goodMorning])));
