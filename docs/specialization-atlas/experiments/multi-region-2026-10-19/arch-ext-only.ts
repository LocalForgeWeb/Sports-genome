import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
const byVariant = new Map<string, string[]>();
for (const m of f.mappings) { if (m.reviewStatus === "rejected") continue; const l = byVariant.get(m.variantId) ?? []; l.push(m.nodeId); byVariant.set(m.variantId, l); }
const extOnly = [...byVariant].filter(([, nodes]) => nodes.every((n) => !n.startsWith("forearm.")));
console.log("variants whose forearm_mappings_v1 rows credit only external nodes:", extOnly.length, extOnly.map(([v, n]) => `${v}:${[...new Set(n)].join("+")}`).join(", "));
console.log("rows on externals:", f.mappings.filter((m) => !m.nodeId.startsWith("forearm.")).length);
const lat = new Map<string, number>(); for (const v of f.variants) lat.set(v.laterality, (lat.get(v.laterality) ?? 0) + 1); console.log("laterality:", Object.fromEntries(lat));
