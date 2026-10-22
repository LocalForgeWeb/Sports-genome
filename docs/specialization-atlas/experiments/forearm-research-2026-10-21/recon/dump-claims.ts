import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
const claims = (forearmRegionData as any).claims as any[];
const maps = (forearmRegionData as any).mappings as any[];
const use = new Map<string, { claims: string[]; mappings: number }>();
for (const c of claims) for (const s of c.sources) { const u = use.get(s.sourceId) ?? { claims: [], mappings: 0 }; u.claims.push(c.id); use.set(s.sourceId, u); }
for (const m of maps) for (const s of m.sources) { const u = use.get(s.sourceId) ?? { claims: [], mappings: 0 }; u.mappings++; use.set(s.sourceId, u); }
for (const id of ["S1","S2","S3","A4","M1","A36","A38","S4","M2","M5","M6"]) console.log(id, JSON.stringify(use.get(id)));
console.log("claims", claims.length, "mappings", maps.length, Object.keys(forearmRegionData));
