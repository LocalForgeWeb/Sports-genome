import { exercises } from "@/lib/exerciseCatalog";
import { forearmRegionData as data } from "@shared/specialization/regions/forearm";
const mapped = new Set(data.variants.map(v => v.catalogExerciseId));
for (const e of exercises) if (e.primaryMuscles.includes("forearms") && !mapped.has(e.id)) console.log("primary-unmapped", e.id, e.name);
