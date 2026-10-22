import { forearmRegionData as R } from "@shared/specialization/regions/forearm/index";
import { buildModel } from "./stackDesigner";
const m = buildModel(R);
for (const u of m.units) for (const c of u.candidates) console.log(u.label, "|", c.exercise.id, c.exercise.name, "|", c.variant.organization, "|", c.variant.measure, c.variant.deliberateHold, "|", c.exercise.primaryMuscles.join(","), "/", c.exercise.secondaryMuscles.join(","));
const z = R.variants.find(v => v.catalogExerciseId === 300)!; console.log("zercher", z.organization, z.deliberateHold);
