import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { writeFileSync } from "node:fs";
const out = exercises.map((e) => ({ id: e.id, name: e.name, equipment: e.equipment, movement: e.movement, category: e.category, primary: e.primaryMuscles, secondary: e.secondaryMuscles, qualities: e.qualities, sourceGroup: e.sourceGroup }));
writeFileSync(process.argv[2], JSON.stringify(out, null, 0));
console.log(out.length, Math.min(...out.map(e=>e.id)), Math.max(...out.map(e=>e.id)));
