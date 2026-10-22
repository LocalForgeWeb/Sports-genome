async function main() {
  const { forearmMappings } = await import("/home/user/Sports-genome/shared/specialization/regions/forearm/mappings");
  const { variantById } = await import("/home/user/Sports-genome/shared/specialization/variants");
  const { categoryFor } = await import("/home/user/Sports-genome/shared/specialization/rules");
  const { exercises } = await import("/home/user/Sports-genome/client/src/lib/exerciseCatalog");
  const names = Object.fromEntries(exercises.map((e: any) => [e.id, e.name]));
  const out = forearmMappings.map((m: any) => ({ id: m.id, catalogId: Number(m.variantId.slice(4)), name: names[Number(m.variantId.slice(4))], nodeId: m.nodeId, relationship: m.relationship, mode: m.muscleMode, status: m.reviewStatus, category: categoryFor(m.relationship, m.muscleMode, variantById.get(m.variantId)!.deliberateHold) }));
  console.log(JSON.stringify(out));
}
main();
