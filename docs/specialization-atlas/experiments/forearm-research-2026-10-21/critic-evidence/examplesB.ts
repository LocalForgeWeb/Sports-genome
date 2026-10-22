import { exercises } from "@/lib/exerciseCatalog";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData as data } from "@shared/specialization/regions/forearm";
import { customInterval } from "@shared/specialization/time";

const TZ = "Europe/London";
const NOW = "2026-10-20T12:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(exercises);
const names = new Map(exercises.map((e) => [e.id, e.name] as const));
let n = 0;
const set = (over: Partial<DeviceSetLog> & { holdSeconds?: string } = {}): DeviceSetLog => ({ id: `s${++n}`, weight: "10", reps: "12", unit: "kg", completed: true, ...over } as DeviceSetLog);
let e = 0;
const ex = (catalogId: number | null, sets: DeviceSetLog[], name?: string): DeviceWorkoutExercise => ({ id: `e${++e}`, exerciseName: name ?? names.get(catalogId!)!, ...(catalogId === null ? {} : { catalogId }), plannedPrescription: "3 x 12", sets } as DeviceWorkoutExercise);
const session = (id: string, exs: DeviceWorkoutExercise[]): DeviceWorkoutSession => ({ id, title: id, dayLabel: id, startedAt: "2026-10-19T17:00:00.000Z", completedAt: "2026-10-19T18:00:00.000Z", status: "completed", exercises: exs, weightUnit: "kg" } as DeviceWorkoutSession);
const deps = { catalog: exercises, variants: data.variants, fallbackUnit: "kg" as const };
const interval = customInterval("2026-10-19", "2026-10-19", TZ);
function show(label: string, sessions: DeviceWorkoutSession[], ids: string[]) {
  const bouts = boutsFromSessions(sessions, deps);
  const s = getSpecializationSummary({ region: data, bouts, interval, side: "right", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: NOW } as any);
  console.log(`== ${label}: bouts ${bouts.length}; region distinct ${JSON.stringify((s as any).regionDistinctBouts ?? (s as any).region)}`);
  for (const id of ids) {
    const x: any = s.nodes.find((node) => node.nodeId === id);
    if (!x) { console.log(`  ${id}: (no row)`); continue; }
    console.log(`  ${id}: direct ${x.directDynamicBouts}, contrib ${x.contributingDynamicBouts}, holds ${x.deliberateHoldBouts} (${x.deliberateHoldSeconds} s), incidental ${x.incidentalBouts}, mixed ${x.mixedBouts}, pending ${x.pendingReviewBouts}, coverage ${x.mappingCoverage}, reps direct ${x.directDynamicReps}`);
  }
  const c: any = (s as any).completeness; console.log("  completeness:", JSON.stringify(c).slice(0, 400));
}
const all = ["forearm.fcr","forearm.fcu","forearm.pl","forearm.fds","forearm.fdp","forearm.fpl","forearm.br","forearm.ecrl","forearm.ecrb","forearm.ecu","forearm.epl","forearm.epb","forearm.apl"];
show("A: 2x410 right + 409 20 s right", [session("A", [ex(410, [set({ side: "right" } as any), set({ side: "right" } as any)]), ex(409, [set({ reps: "", holdSeconds: "20", side: "right" } as any)])])], all);
show("B: drop set 410 right (5,6,10)", [session("B", [ex(410, [set({ side: "right", type: "drop", reps: "5", stages: [{ id: "st1", weight: "70", reps: "6" }, { id: "st2", weight: "50", reps: "10" }] } as any)])])], ["forearm.fcr"]);
show("C: 'Barbell wrist roll' unknown name", [session("C", [ex(null, [set()], "Barbell wrist roll")])], ["forearm.fcr","forearm.ecrb","forearm.fds"]);
show("D: curls 121,132 + carries 299,409 + wrist curl 139", [session("D", [ex(121, [set(), set(), set()]), ex(132, [set(), set(), set()]), ex(299, [set({ reps: "", holdSeconds: "30" } as any)]), ex(409, [set({ reps: "", holdSeconds: "30", side: "right" } as any)]), ex(139, [set(), set(), set()])])], ["forearm.epl","forearm.epb","forearm.apl","forearm.fpl","forearm.br"]);
// Zercher carry: does BR read as a deliberate hold, and would it count as "direct" under the draft's definition?
show("Z: 300 Zercher Carry 3 x 30 s", [session("Z", [ex(300, [set({ reps: "", holdSeconds: "30" } as any), set({ reps: "", holdSeconds: "30" } as any), set({ reps: "", holdSeconds: "30" } as any)])])], ["forearm.br"]);
// Holds with one untimed
show("H: 143 Dead Hang 2 timed + 1 untimed", [session("H", [ex(143, [set({ reps: "", holdSeconds: "30" } as any), set({ reps: "", holdSeconds: "20" } as any), set({ reps: "" } as any)])])], ["forearm.fds"]);
