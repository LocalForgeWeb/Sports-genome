import { exercises } from "@/lib/exerciseCatalog";
const e = exercises.find(x => x.id === 387)!; console.log(e.id, e.name, e.primaryMuscles, e.secondaryMuscles);
