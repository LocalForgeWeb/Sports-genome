import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
for (const e of exercises) console.log(e.id, "|", e.name, "|", e.equipment, "|", e.category, "|", e.primaryMuscles.join(","));
