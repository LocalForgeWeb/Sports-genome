import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog.ts";
import { boutsFromSessions } from "/home/user/Sports-genome/client/src/lib/specialization/bouts.ts";
const ids = [139,140,132,143,144,145,43,66,402,404,409,410,411,413,405,343,41];
for (const id of ids) { const e = exercises.find((x) => x.id === id); console.log(id, e?.name, JSON.stringify(e?.primaryMuscles), JSON.stringify(e?.secondaryMuscles)); }
console.log(typeof boutsFromSessions);
