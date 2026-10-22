import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { writeFileSync } from "node:fs";
const out = exercises.map((e: any) => ({ id: e.id, name: e.name, equipment: e.equipment, movement: e.movement, category: e.category, primary: e.primaryMuscles, secondary: e.secondaryMuscles, sourceGroup: e.sourceGroup }));
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(out.length);
