/**
 * Experiment 3: the emitter's display order (nodes.sort_order, actions.sort_order) is the index in
 * the FIRST region by id that lists the record (emit-seed.ts firstIndex). A region whose id sorts
 * before "forearm" (back, chest, core) and lists a forearm-listed node or action rewrites the
 * forearm rows: no refusal, but no longer a no-op.
 */
import { emitSeedSql, productionSeedInput } from "/home/user/Sports-genome/scripts/specialization/emit-seed";
import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import type { SpecializationRegionData } from "/home/user/Sports-genome/shared/specialization/types";
import { SCHEMA_MIGRATION_PATH, SEED_MIGRATION_PATH, applyMigration, createSupabaseLikeDb, rows, scriptFailure } from "./harness";

const f = forearmRegionData;
const biceps = f.nodes.find((n) => n.id === "upper_arm.biceps")!;
const elbowFlexion = f.actions.find((a) => a.id === "elbow.flexion")!;
const elbowExtension = f.actions.find((a) => a.id === "elbow.extension")!;
const back: SpecializationRegionData = {
  region: {
    id: "back", label: "Back", heading: "Back specialization", sortOrder: 30, status: "production", bodyMapKeys: ["lats"], entryLabel: "Explore back coverage",
    wording: { externalGroup: "Arm muscles credited here", incidentalWork: "bracing", progressSubtitle: "Circumference, by side" }, measurementMetrics: ["circumference_cm"],
  },
  nodes: [biceps],
  actions: [elbowExtension, elbowFlexion],
  nodeActions: [],
  claims: [],
  sources: [],
  variants: [],
  mappings: [],
  mappingVersion: { key: "back_mappings_v1", state: "draft", publishedAt: null, methodNotes: "Experiment." },
  diagram: null,
};

async function main() {
  const db = await createSupabaseLikeDb();
  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  await applyMigration(db, SEED_MIGRATION_PATH);
  const q = "select (select sort_order from specialization.nodes where id = 'upper_arm.biceps') as biceps, (select sort_order from specialization.actions where id = 'elbow.flexion') as flexion, (select sort_order from specialization.actions where id = 'elbow.extension') as extension, (select xmin::text from specialization.nodes where id = 'upper_arm.biceps') as biceps_xmin";
  console.log("before", JSON.stringify(await rows(db, q)));
  const sql = emitSeedSql({ ...productionSeedInput(), regions: [f, back] });
  console.log("forearm + back applied:", (await scriptFailure(db, sql)) ?? "applied, no refusal");
  console.log("after", JSON.stringify(await rows(db, q)));
  await db.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
