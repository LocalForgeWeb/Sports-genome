import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
for (const key of ["shoulders", "serratusAnterior", "feet", "hipFlexors", "lowerBack", "rotatorCuff", "tibialis"]) {
  const p = exercises.filter((e) => e.primaryMuscles.includes(key)).map((e) => `${e.id} ${e.name}`);
  const s = exercises.filter((e) => e.secondaryMuscles.includes(key)).map((e) => `${e.id} ${e.name}`);
  console.log(`${key}: primary(${p.length}) ${p.join("; ")}\n   secondary(${s.length}) ${s.slice(0, 25).join("; ")}`);
}
