/**
 * Experiment 1 (read-only on the repository): is re-applying the current seed after itself a
 * no-op, and what refuses when multi-region content is emitted onto the frozen forearm rows?
 *
 *   cd /home/user/Sports-genome && npx tsx <scratch>/exp1-noop-and-refusals.ts
 */
import { createHash } from "node:crypto";
import { emitSeedSql, productionSeedInput, referenceRegionLabels, type SeedInput } from "/home/user/Sports-genome/scripts/specialization/emit-seed";
import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import { exposureRuleV1 } from "/home/user/Sports-genome/shared/specialization/rules";
import type { SpecializationRegionData } from "/home/user/Sports-genome/shared/specialization/types";
import { SCHEMA_MIGRATION_PATH, SEED_MIGRATION_PATH, applyMigration, asDoBlock, createSupabaseLikeDb, readMigration, rows, scriptFailure } from "./harness";

type Db = Awaited<ReturnType<typeof createSupabaseLikeDb>>;

async function rowVersions(db: Db): Promise<Record<string, string>> {
  const tables = (await rows<{ relname: string }>(db, "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relkind = 'r' order by 1")).map((r) => r.relname);
  const out: Record<string, string> = {};
  for (const t of tables) {
    const [r] = await rows<{ v: string | null }>(db, `select string_agg(xmin::text || '@' || ctid::text, ',' order by ctid) as v from specialization.${t}`);
    out[t] = r.v ?? "";
  }
  return out;
}
const same = (a: Record<string, string>, b: Record<string, string>) => {
  const changed = Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k]);
  return changed.length ? `CHANGED: ${changed.join(", ")}` : "no row touched";
};
const sha = (text: string) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
const withRegions = (regions: SeedInput["regions"]): SeedInput => ({ ...productionSeedInput(), regions });
const tryEmit = (input: SeedInput): { sql?: string; error?: string } => {
  try {
    return { sql: emitSeedSql(input) };
  } catch (e) {
    return { error: (e as Error).message };
  }
};
const log = (label: string, value: unknown) => console.log(`${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

const f = forearmRegionData;
const biceps = f.nodes.find((n) => n.id === "upper_arm.biceps")!;
const brachialis = f.nodes.find((n) => n.id === "upper_arm.brachialis")!;

/** A minimal production upper-arm region that makes the biceps and brachialis its targets. */
function upperArmRegion(options: { roleTarget: boolean; ownClaims: boolean; variantPatch?: Partial<(typeof f.variants)[number]> }): SpecializationRegionData {
  const curl = f.variants.find((v) => v.id === "cat-121")!;
  const variant = { ...curl, ...(options.variantPatch ?? {}) };
  const nodes = [biceps, brachialis].map((n) => (options.roleTarget ? { ...n, role: "target" as const } : n));
  const fnClaims = f.claims.filter((c) => c.nodeId.startsWith("upper_arm.") && c.kind === "function");
  const sources = f.sources.filter((s) => fnClaims.some((c) => c.sources.some((r) => r.sourceId === s.id)) || s.id === "S4");
  const actions = f.actions.filter((a) => a.id === "elbow.flexion" || a.id === "forearm.supination");
  const nodeActions = f.nodeActions.filter((n) => n.nodeId.startsWith("upper_arm."));
  return {
    region: {
      id: "upper_arm",
      label: "Upper arm",
      heading: "Upper-arm specialization",
      sortOrder: 20,
      status: "production",
      bodyMapKeys: ["biceps", "brachialis", "triceps"],
      entryLabel: "Explore upper-arm coverage",
      wording: { externalGroup: "Forearm muscles credited here", incidentalWork: "bracing", progressSubtitle: "Circumference, by arm" },
      measurementMetrics: ["circumference_cm"],
    },
    nodes,
    actions,
    nodeActions: options.ownClaims ? nodeActions : [],
    claims: options.ownClaims ? fnClaims : [],
    sources,
    variants: [variant],
    mappings: [
      {
        id: "ua-cat-121:upper_arm.biceps",
        versionKey: "upper_arm_mappings_v1",
        variantId: "cat-121",
        nodeId: "upper_arm.biceps",
        actionId: "elbow.flexion",
        relationship: "direct",
        muscleMode: "dynamic",
        evidenceBasis: "anatomy",
        allocation: "individual",
        requiresNoStraps: false,
        rationale: "Experiment only.",
        reviewStatus: "draft",
        sources: [{ sourceId: "S4", locator: "Experiment", limitation: null }],
      },
    ],
    mappingVersion: { key: "upper_arm_mappings_v1", state: "draft", publishedAt: null, methodNotes: "Experiment only." },
    diagram: null,
  };
}

async function main() {
  const db = await createSupabaseLikeDb();
  const schemaText = readMigration(SCHEMA_MIGRATION_PATH);
  const seedText = readMigration(SEED_MIGRATION_PATH);
  log("A. schema v1 sha256", sha(schemaText));
  log("A. seed v1 sha256", sha(seedText));
  log("A. seed v1 characters / bytes", `${seedText.length} / ${Buffer.byteLength(seedText, "utf8")}`);
  log("A. emitter output equals committed seed v1", String(emitSeedSql() === seedText));

  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  await applyMigration(db, SEED_MIGRATION_PATH);
  const base = await rowVersions(db);

  await applyMigration(db, SEED_MIGRATION_PATH);
  log("B1. seed v1 applied after itself", same(base, await rowVersions(db)));
  await db.exec(asDoBlock(seedText));
  log("B2. seed v1 applied after itself as one DO block", same(base, await rowVersions(db)));
  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  log("B3. schema v1 applied again over the seeded database", same(base, await rowVersions(db)));
  // A "v2" seed that is only a re-emit of today's content (other header comments would not matter).
  const reEmit = emitSeedSql(productionSeedInput());
  log("B4. full re-emit of current content applied", `${(await scriptFailure(db, reEmit)) ?? "ok"}; ${same(base, await rowVersions(db))}`);

  console.log("\n-- C. what refuses (each run alone; the whole script rolls back) --");
  const cases: [string, SeedInput][] = [
    ["C1 forearm content gives upper_arm.biceps role target", withRegions([{ ...f, nodes: f.nodes.map((n) => (n.id === "upper_arm.biceps" ? { ...n, role: "target" as const } : n)) }])],
    ["C2 forearm content moves upper_arm.biceps catalog key", withRegions([{ ...f, nodes: f.nodes.map((n) => (n.id === "upper_arm.biceps" ? { ...n, catalogMuscleKey: "upperArm" } : n)) }])],
    ["C3 upper-arm region alone (no forearm) with biceps as target", { rules: [exposureRuleV1], referenceRegionLabels, regions: [upperArmRegion({ roleTarget: true, ownClaims: false })] }],
    ["C4 forearm + upper-arm region with biceps as target", withRegions([f, upperArmRegion({ roleTarget: true, ownClaims: false })])],
    ["C5 forearm + upper-arm region, biceps external (identical node), own claims and node actions", withRegions([f, upperArmRegion({ roleTarget: false, ownClaims: true })])],
    ["C6 upper-arm region alone, own claims and node actions on biceps", { rules: [exposureRuleV1], referenceRegionLabels, regions: [upperArmRegion({ roleTarget: false, ownClaims: true })] }],
    ["C7 forearm + upper-arm region adding a dimension to cat-121 (elbow angle 90)", withRegions([f, upperArmRegion({ roleTarget: false, ownClaims: false, variantPatch: { elbowAngleDeg: 90 } })])],
    ["C8 upper-arm region alone adding a dimension to cat-121 (elbow angle 90)", { rules: [exposureRuleV1], referenceRegionLabels, regions: [upperArmRegion({ roleTarget: false, ownClaims: false, variantPatch: { elbowAngleDeg: 90 } })] }],
    ["C9 upper-arm region alone, cat-121 notes rewritten for the upper arm", { rules: [exposureRuleV1], referenceRegionLabels, regions: [upperArmRegion({ roleTarget: false, ownClaims: false, variantPatch: { notes: "Upper-arm notes." } })] }],
    [
      "C10 upper-arm region referencing the forearm's claim biceps.function without listing it",
      {
        rules: [exposureRuleV1],
        referenceRegionLabels,
        regions: [{ ...upperArmRegion({ roleTarget: false, ownClaims: false }), nodeActions: f.nodeActions.filter((n) => n.nodeId === "upper_arm.biceps") }],
      },
    ],
    ["C11 forearm content drops the reviewed claim forearm:biceps.appearance", withRegions([{ ...f, claims: f.claims.filter((c) => c.id !== "biceps.appearance") }])],
    ["C12 forearm content changes a variant's forearm orientation vocabulary to not_applicable (cat-41)", withRegions([{ ...f, variants: f.variants.map((v) => (v.id === "cat-41" ? { ...v, forearmOrientation: "not_applicable" as never } : v)) }])],
  ];
  for (const [label, input] of cases) {
    const emitted = tryEmit(input);
    if (emitted.error) {
      log(label, `EMITTER REFUSES: ${emitted.error}`);
      continue;
    }
    const failureMessage = await scriptFailure(db, emitted.sql!);
    log(label, failureMessage ? `DATABASE REFUSES: ${failureMessage}` : "APPLIED (no refusal)");
  }
  log("C. after all refusals", same(base, await rowVersions(db)));

  console.log("\n-- D. what does NOT refuse --");
  // D1: the reference upper_arm region becomes a page region by an update: regions has no guard.
  const promote = `update specialization.regions set status = 'production', heading = 'Upper-arm specialization', entry_label = 'Explore upper-arm coverage',
    external_group = 'Forearm muscles credited here', incidental_work = 'bracing', progress_subtitle = 'Circumference, by arm', measurement_metrics = array['circumference_cm'], body_map_keys = array['biceps','brachialis','triceps'], sort_order = 20
    where id = 'upper_arm'`;
  log("D1 promote upper_arm reference -> production", (await scriptFailure(db, promote)) ?? "allowed");
  await applyMigration(db, SEED_MIGRATION_PATH);
  log("D2 seed v1 re-applied after the promotion: upper_arm is", JSON.stringify(await rows(db, "select status, heading from specialization.regions where id = 'upper_arm'")));
  // D3: border is not frozen on a mapped node.
  log("D3 change border of mapped forearm.fcu", (await scriptFailure(db, "update specialization.nodes set border = 'both' where id = 'forearm.fcu'")) ?? "allowed");
  await applyMigration(db, SEED_MIGRATION_PATH);
  // D4: the upper-arm draft version mapping cat-121 to biceps through the forearm's node action and claim, published.
  const okInput = withRegions([f, { ...upperArmRegion({ roleTarget: false, ownClaims: false }), nodeActions: [] }]);
  const ok = tryEmit(okInput);
  log("D4 forearm + upper-arm region, biceps identical (external), no own claims", ok.error ? `EMITTER REFUSES: ${ok.error}` : ((await scriptFailure(db, ok.sql!)) ?? "applied"));
  log("D4 upper_arm after it", JSON.stringify(await rows(db, "select status, heading from specialization.regions where id = 'upper_arm'")));
  log("D4 upper-arm version", JSON.stringify(await rows(db, "select version_key, region_id, state from specialization.mapping_versions order by 1")));
  log(
    "D5 publish upper_arm_mappings_v1 (draft row on biceps elbow.flexion, resting on forearm:biceps.function)",
    (await scriptFailure(db, "update specialization.mapping_versions set state = 'published' where version_key = 'upper_arm_mappings_v1'")) ?? "published",
  );
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
