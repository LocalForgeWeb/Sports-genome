import { regionDataFor } from "/home/user/Sports-genome/shared/specialization/registry.ts";
const r = regionDataFor("forearm") as any;
console.log("frozen", Object.isFrozen(r), Object.getOwnPropertyDescriptor(r, "mappingVersion"));
(async () => {
  const reg2 = await import("@shared/specialization/registry");
  console.log("same object", (reg2 as any).regionDataFor("forearm") === r);
})();
