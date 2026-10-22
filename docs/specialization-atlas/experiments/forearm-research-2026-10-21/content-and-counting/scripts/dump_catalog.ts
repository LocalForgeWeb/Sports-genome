import { writeFileSync } from "node:fs";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog.ts";
const out = process.argv[2];
const rows = exercises.map((e) => ({ id: e.id, name: e.name, equipment: e.equipment, movement: e.movement, category: e.category, primary: e.primaryMuscles, secondary: e.secondaryMuscles, qualities: e.qualities, sourceGroup: e.sourceGroup }));
writeFileSync(out, JSON.stringify(rows, null, 0));
console.log(rows.length, Math.max(...rows.map((r) => r.id)));
