import { exercises } from "@/lib/exerciseCatalog";
import { forearmRegionData as R } from "@shared/specialization/regions/forearm/index";
const mapped = new Set(R.variants.map(v => v.catalogExerciseId));
const re = /wrist|curl|grip|hang|carry|farmer|pinch|forearm|pronat|supinat|finger|thumb|towel|fat|thick|plate|roller|gripper|deviation|rice|kettlebell|bottoms|fingertip|crab|zottman|hammer|reverse|row|pull-up|chin/i;
for (const e of exercises) if (re.test(e.name) || /forearm|grip/i.test(String((e as any).primaryMuscles)+String((e as any).secondaryMuscles))) console.log(e.id, mapped.has(e.id) ? "M" : "-", e.name, "|", e.equipment, "|", e.movement, "|", (e as any).primaryMuscles?.join?.(","), "/", (e as any).secondaryMuscles?.join?.(","));
console.log("catalog size", exercises.length);
