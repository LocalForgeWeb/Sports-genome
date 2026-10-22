import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
for (const id of [126, 127, 132, 135, 337, 139, 140]) { const e = exercises.find((x) => x.id === id)!; console.log(id, e.name, e.equipment, "primary", JSON.stringify(e.primaryMuscles), "secondary", JSON.stringify(e.secondaryMuscles)); }
