/**
 * R0: the import report for the owner's forearm research package (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §1, §2, §8.2 row R0).
 *
 *   npx tsx scripts/specialization/research/forearm-v1/import.ts          # rewrite report.json and report.md
 *   npx tsx scripts/specialization/research/forearm-v1/import.ts --check  # exit 1 if either is stale
 *
 * What it is. A read-only adapter: it reads the package as received
 * (docs/specialization-atlas/forearm-research-v1/: exercises.json, muscles.json, sources.json,
 * rep-profiles.json, the manifest and SHA256SUMS.txt) and the app's own code (the forearm's
 * shipped mapping version, the shared variants, the catalog, the source library and the 3D
 * model's identity table), and writes one report in a sibling folder,
 * docs/specialization-atlas/forearm-research-v1-import/. The package's folder is never written.
 * Running it twice writes the same bytes: nothing from the run (no date, no counter) reaches the
 * output, rows keep the package's order, and the JSON is formatted by a fixed rule.
 *
 * What it is not. An importer. The design reconciles the package into the app's catalog and
 * never imports it as a second one (§0.1); `forearm_mappings_v2` is written by hand by lane V1
 * against this report's decisions (§1.7). The report is the "staging" the package asks for
 * (its §7.1, §7.2; the design's §1.8 row 1): it says, for every one of the 57 records and all
 * 1,083 cells, what the app does with it. The package's grades, indices, bands and tissue grades
 * appear only here, inside each cell's `packageOwn`, as the package's own values; no file under
 * shared/ or client/src holds them (forearmResearchImport.test.ts scans for their field names).
 *
 * How it reads. Muscles by code, through one explicit table (`muscleNodeByCode`) checked
 * against the 3D model's identity table (client/src/components/specialization/anatomy3d/
 * modelIdentity.ts), never by name similarity: an unknown id is an error. Each cell through the
 * design's vocabulary (§2.1) into a relationship and a mode, and the category `categoryFor`
 * gives them on the variant it is read against. Each record against its disposition (§1.2,
 * written out below as data, since it is the design's decision and not something the package
 * says); a cell where the package and the app differ against the decision §1.3 or §1.4 takes for
 * its family. Nulls stay null.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exercises as catalog } from "../../../../client/src/lib/exerciseCatalog";
import { trainingEvidence } from "../../../../client/src/lib/trainingEvidence";
import { forearmModelSourceToCanonical } from "../../../../client/src/components/specialization/anatomy3d/modelIdentity";
import { forearmHomeContent } from "../../../../shared/specialization/regions/forearm/content";
import { coreForearmMuscleIds, forearmMuscleIds as m } from "../../../../shared/specialization/regions/forearm/ids";
import { categoryFor } from "../../../../shared/specialization/rules";
import { sourceLibrary } from "../../../../shared/specialization/sources";
import { variantFor } from "../../../../shared/specialization/variants";
import type { ExposureCategory, MuscleMode, NodeId, Relationship, VariantMapping } from "../../../../shared/specialization/types";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../..");
export const PACKAGE_DIR = resolve(repoRoot, "docs/specialization-atlas/forearm-research-v1");
export const REPORT_DIR = resolve(repoRoot, "docs/specialization-atlas/forearm-research-v1-import");
export const REPORT_JSON_PATH = resolve(REPORT_DIR, "report.json");
export const REPORT_MD_PATH = resolve(REPORT_DIR, "report.md");
const DESIGN = "docs/specialization-atlas/11-forearm-research-and-stack.md";
const rel = (path: string) => relative(repoRoot, path).split("\\").join("/");

// ---------------------------------------------------------------- the package, as received

export interface PackageCell {
  muscle_id: string;
  targeting_grade_0_4: number | null;
  targeting_index_0_100: number | null;
  plausible_grade_band: [number, number] | null;
  band_type: string;
  contraction: string;
  exposure_bucket: string;
  confidence: string;
  evidence_basis: string;
  tissue_exposure_grade_0_4: number | null;
  tissue_force_newtons: number | null;
}

export interface PackageRecord {
  id: string;
  original_candidate_number: number;
  name: string;
  profile_id: string | null;
  publication_status: string;
  canonical_alias_of: string | null;
  setup_definition: string;
  notes: string;
  source_ids: string[];
  external_contributors: string[];
  context_flags: string[];
  prescription_profile_id: string | null;
  prescription_application: string;
  mappings: PackageCell[];
}

export interface PackageMuscle {
  id: string;
  code: string;
  display_name: string;
}

export interface PackageSource {
  id: string;
  url: string;
  title: string;
  pmid?: string;
  doi?: string;
  publication_date?: string;
  access: string;
  use: string;
}

export type PackageRepProfiles = Record<string, Record<string, unknown>>;

export interface ForearmResearchPackage {
  dir: string;
  files: { name: string; sha256: string; listed: string | null }[];
  manifest: Record<string, unknown>;
  exercises: PackageRecord[];
  muscles: PackageMuscle[];
  sources: PackageSource[];
  repProfiles: PackageRepProfiles;
}

const readJson = <T>(dir: string, name: string): T => JSON.parse(readFileSync(resolve(dir, name), "utf8")) as T;

/** Reads the package. Writes nothing; the folder is the owner's, as received. */
export function readPackage(dir: string = PACKAGE_DIR): ForearmResearchPackage {
  const listed = new Map<string, string>();
  for (const line of readFileSync(resolve(dir, "SHA256SUMS.txt"), "utf8").split("\n")) {
    const match = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim());
    if (match) listed.set(match[2], match[1]);
  }
  const names = readdirSync(dir).filter((name) => statSync(resolve(dir, name)).isFile()).sort();
  const files = names.map((name) => ({
    name,
    sha256: createHash("sha256").update(readFileSync(resolve(dir, name))).digest("hex"),
    listed: listed.get(name) ?? null,
  }));
  return {
    dir,
    files,
    manifest: readJson(dir, "model-manifest.json"),
    exercises: readJson(dir, "exercises.json"),
    muscles: readJson(dir, "muscles.json"),
    sources: readJson(dir, "sources.json"),
    repProfiles: readJson(dir, "rep-profiles.json"),
  };
}

// ---------------------------------------------------------------- muscles, by code

/**
 * The package's 19 muscles onto the forearm's node ids, by the package's own `code`, written out
 * once (§1.1, §2.2). Each row also names the package id it must carry, so a renamed id or a
 * swapped code is an error rather than a guess. The 3D model's identity table, which names its
 * structures by the same ids, must agree row for row (checked in `buildMuscleMap`).
 */
export const muscleNodeByCode: Readonly<Record<string, { packageId: string; nodeId: NodeId }>> = {
  BR: { packageId: "brachioradialis", nodeId: m.brachioradialis },
  FCR: { packageId: "flexor-carpi-radialis", nodeId: m.flexorCarpiRadialis },
  FCU: { packageId: "flexor-carpi-ulnaris", nodeId: m.flexorCarpiUlnaris },
  PL: { packageId: "palmaris-longus", nodeId: m.palmarisLongus },
  FDS: { packageId: "flexor-digitorum-superficialis", nodeId: m.flexorDigitorumSuperficialis },
  FDP: { packageId: "flexor-digitorum-profundus", nodeId: m.flexorDigitorumProfundus },
  FPL: { packageId: "flexor-pollicis-longus", nodeId: m.flexorPollicisLongus },
  PT: { packageId: "pronator-teres", nodeId: m.pronatorTeres },
  PQ: { packageId: "pronator-quadratus", nodeId: m.pronatorQuadratus },
  ECRL: { packageId: "extensor-carpi-radialis-longus", nodeId: m.extensorCarpiRadialisLongus },
  ECRB: { packageId: "extensor-carpi-radialis-brevis", nodeId: m.extensorCarpiRadialisBrevis },
  ECU: { packageId: "extensor-carpi-ulnaris", nodeId: m.extensorCarpiUlnaris },
  ED: { packageId: "extensor-digitorum", nodeId: m.extensorDigitorum },
  EDM: { packageId: "extensor-digiti-minimi", nodeId: m.extensorDigitiMinimi },
  EI: { packageId: "extensor-indicis", nodeId: m.extensorIndicis },
  APL: { packageId: "abductor-pollicis-longus", nodeId: m.abductorPollicisLongus },
  EPB: { packageId: "extensor-pollicis-brevis", nodeId: m.extensorPollicisBrevis },
  EPL: { packageId: "extensor-pollicis-longus", nodeId: m.extensorPollicisLongus },
  SUP: { packageId: "supinator", nodeId: m.supinator },
};

export interface MuscleMapRow {
  packageId: string;
  code: string;
  displayName: string;
  nodeId: NodeId;
  /** What the 3D model's identity table gives for the same id. */
  modelIdentity: NodeId | null;
}

function buildMuscleMap(muscles: PackageMuscle[]): MuscleMapRow[] {
  const rows = muscles.map((muscle) => {
    const entry = muscleNodeByCode[muscle.code];
    if (!entry) throw new Error(`muscles.json: unknown muscle code "${muscle.code}" (id "${muscle.id}"); no muscle is matched by name`);
    if (entry.packageId !== muscle.id) throw new Error(`muscles.json: code ${muscle.code} carries id "${muscle.id}", expected "${entry.packageId}"`);
    const modelIdentity = (forearmModelSourceToCanonical as Record<string, NodeId>)[muscle.id] ?? null;
    if (modelIdentity !== entry.nodeId) throw new Error(`muscles.json: ${muscle.id} → ${entry.nodeId} here, but the 3D identity table gives ${modelIdentity}`);
    return { packageId: muscle.id, code: muscle.code, displayName: muscle.display_name, nodeId: entry.nodeId, modelIdentity };
  });
  const nodes = new Set(rows.map((row) => row.nodeId));
  const codes = new Set(rows.map((row) => row.code));
  if (rows.length !== Object.keys(muscleNodeByCode).length || nodes.size !== rows.length || codes.size !== rows.length) {
    throw new Error(`muscles.json: expected the ${Object.keys(muscleNodeByCode).length} muscles once each, found ${rows.length} (${codes.size} codes, ${nodes.size} nodes)`);
  }
  const missing = coreForearmMuscleIds.filter((id) => !nodes.has(id));
  if (missing.length) throw new Error(`muscles.json: no package muscle for ${missing.join(", ")}`);
  return rows;
}

// ---------------------------------------------------------------- the design's decisions, as data

export type Disposition = "existing" | "set-up not recorded" | "alias" | "new row" | "referred" | "deferred" | "blocked";
/** The three dispositions §1.2 counts together as "existing" (28 records). */
const EXISTING_GROUP: ReadonlySet<Disposition> = new Set<Disposition>(["existing", "set-up not recorded", "alias"]);

interface DesignRecord {
  disposition: Disposition;
  /** The catalog rows §1.2 names for the record. */
  rows: number[];
  /** The rows whose mappings the cells are read against; none for a record with no app row. */
  readAgainst: number[];
  /** §1.2's reason, in its words where they are short. */
  note: string;
}

const SETUP = "set-up not recorded";
const MACHINE = "Deferred: \"Machine\" in the equipment profile cannot say which machine a gym has, so the stack would offer a rare machine to every gym athlete (§10, decision 3).";
const RICE = "Deferred: no equipment value for a rice bucket, uncalibrated resistance (§10, decision 3); the app trains every one of these movements with a reviewed exercise.";
const FINGERTIP = "Referred to the chest and core waves (B, C): closed-chain support whose finger credit the package makes a deliberate hold inside a compound, against its own §4.";

/** §1.2, every record decided. */
export const designRecords: Readonly<Record<string, DesignRecord>> = {
  "fa-01": { disposition: SETUP, rows: [139], readAgainst: [139], note: "Seated: seated against kneeling is a set-up no attribute records." },
  "fa-02": { disposition: SETUP, rows: [140], readAgainst: [140], note: "Seated: seated against kneeling is a set-up no attribute records." },
  "fa-03": { disposition: "new row", rows: [418], readAgainst: [418], note: "418 Behind-the-Back Wrist Curl (Barbell; standing, the bar behind the thighs, palms back): v1's wrist-curl family, 5 rows." },
  "fa-04": { disposition: "existing", rows: [135], readAgainst: [135], note: "The same task." },
  "fa-05": { disposition: SETUP, rows: [135], readAgainst: [135], note: "Preacher bench; decided here, not referred: its only direct cell is the brachioradialis, whose home is the forearm." },
  "fa-06": { disposition: "new row", rows: [419], readAgainst: [419], note: "419 Barbell Hold (Barbell; measured in seconds, a deliberate hold, double overhand at arm's length), 6 rows." },
  "fa-07": { disposition: "blocked", rows: [238, 415, 416, 141], readAgainst: [], note: "Blocked; every reading already has a row: 238 (the abdominal rollout), 415 or 416 (the roller by direction), 141 (direction not recorded)." },
  "fa-08": { disposition: SETUP, rows: [121], readAgainst: [121], note: "Thick handle: S07 found it changes forearm EMG in some lifts and not in the curl it tested, so no multiplier and no separate credit." },
  "fa-09": { disposition: SETUP, rows: [42, 186], readAgainst: [42, 186], note: "Thick handle. The catalog lists the name twice; both mapped alike." },
  "fa-10": { disposition: "blocked", rows: [140, 415, 401], readAgainst: [], note: "Blocked; its readings have rows." },
  "fa-11": { disposition: "existing", rows: [410], readAgainst: [410], note: "The same task." },
  "fa-12": { disposition: "existing", rows: [411], readAgainst: [411], note: "The same task." },
  "fa-13": { disposition: "blocked", rows: [407], readAgainst: [], note: "Blocked; the radial-deviation reading has a row." },
  "fa-14": { disposition: "existing", rows: [132], readAgainst: [132], note: "The same task." },
  "fa-15": { disposition: SETUP, rows: [132], readAgainst: [132], note: "Preacher bench; decided here, not referred (as fa-05)." },
  "fa-16": { disposition: "existing", rows: [136], readAgainst: [136], note: "Rotation already withheld, as the package asks: no full pronator and supinator credit for the turn between phases." },
  "fa-17": { disposition: "existing", rows: [405], readAgainst: [405], note: "405 turns toward palm-down against an offset load: the package's correction and its offset-lever rule." },
  "fa-18": { disposition: "existing", rows: [406], readAgainst: [406], note: "The same task." },
  "fa-19": { disposition: "existing", rows: [407], readAgainst: [407], note: "Gravity opposes the movement, as the package asks." },
  "fa-20": { disposition: "existing", rows: [408], readAgainst: [408], note: "The same task." },
  "fa-21": { disposition: SETUP, rows: [299], readAgainst: [299], note: "Thick handle (as fa-08)." },
  "fa-22": { disposition: "alias", rows: [411], readAgainst: [411], note: "Alias of fa-12: no second row, no second dose." },
  "fa-23": { disposition: "new row", rows: [417], readAgainst: [417], note: "417 Cable Wrist Curl (Cable; a low pulley, forearms on the thighs, palms up): v1's wrist-curl family, 5 rows." },
  "fa-24": { disposition: "existing", rows: [350], readAgainst: [350], note: "The same task." },
  "fa-25": { disposition: SETUP, rows: [135], readAgainst: [135], note: "A cable in place of a bar; decided here, not referred (as fa-05)." },
  "fa-26": { disposition: "existing", rows: [337, 134], readAgainst: [337, 134], note: "The catalog holds it twice; both frozen, both mapped alike." },
  "fa-27": { disposition: "blocked", rows: [129], readAgainst: [], note: "Blocked; the elbow reading has a row." },
  "fa-28": { disposition: "existing", rows: [332], readAgainst: [332], note: "The same task." },
  "fa-29": { disposition: "referred", rows: [], readAgainst: [], note: "Referred to the back (wave B): a row whose main work the back maps; the forearm's credit would be grip." },
  "fa-30": { disposition: "deferred", rows: [], readAgainst: [], note: MACHINE },
  "fa-31": { disposition: "deferred", rows: [], readAgainst: [], note: MACHINE },
  "fa-32-flexion": { disposition: "deferred", rows: [], readAgainst: [], note: MACHINE },
  "fa-32-extension": { disposition: "deferred", rows: [], readAgainst: [], note: MACHINE },
  "fa-33": { disposition: "existing", rows: [409], readAgainst: [409], note: "The same task." },
  "fa-34": { disposition: "referred", rows: [], readAgainst: [], note: "Referred to the shoulders (wave B): a press with a grip challenge." },
  "fa-35": { disposition: "deferred", rows: [], readAgainst: [], note: "Deferred: ballistic, as 387 Kettlebell Clean, which v1 lists unmapped (unmapped.ts)." },
  "fa-36": { disposition: "deferred", rows: [132], readAgainst: [132], note: "Deferred: no source shows the bell changes which muscles do the work; logged as 132, which a kettlebell profile already reaches." },
  "fa-37-flexion": { disposition: "deferred", rows: [410], readAgainst: [410], note: "Deferred, as fa-36; logged as 410." },
  "fa-37-extension": { disposition: "deferred", rows: [411], readAgainst: [411], note: "Deferred, as fa-36; logged as 411." },
  "fa-38": { disposition: "existing", rows: [142], readAgainst: [142], note: "The same task." },
  "fa-39": { disposition: "blocked", rows: [], readAgainst: [], note: "Blocked (ballistic, no protocol)." },
  "fa-40": { disposition: "blocked", rows: [], readAgainst: [], note: "Blocked." },
  "fa-41": { disposition: "existing", rows: [143], readAgainst: [143], note: "The same task." },
  "fa-42": { disposition: "existing", rows: [78], readAgainst: [78], note: "The same task." },
  "fa-43": { disposition: "existing", rows: [144], readAgainst: [144], note: "The same task." },
  "fa-44": { disposition: SETUP, rows: [143], readAgainst: [143], note: "Thick bar (as fa-08)." },
  "fa-45": { disposition: "referred", rows: [], readAgainst: [], note: FINGERTIP },
  "fa-46": { disposition: "referred", rows: [], readAgainst: [], note: FINGERTIP },
  "fa-47": { disposition: "existing", rows: [402], readAgainst: [402], note: "The same task; 403 Gripper Hold is the sustained squeeze the package's §4 asks to tell apart." },
  "fa-48": { disposition: "deferred", rows: [], readAgainst: [], note: "Deferred: no equipment value for a grip ball, uncalibrated resistance (§10, decision 3)." },
  "fa-49": { disposition: "deferred", rows: [], readAgainst: [], note: "Deferred: whole-body, flat palms; the package credits finger-flexor steadying no source measured." },
  "fa-50-finger-close": { disposition: "deferred", rows: [], readAgainst: [], note: RICE },
  "fa-50-finger-open": { disposition: "deferred", rows: [], readAgainst: [], note: RICE },
  "fa-50-pronation": { disposition: "deferred", rows: [], readAgainst: [], note: RICE },
  "fa-50-supination": { disposition: "deferred", rows: [], readAgainst: [], note: RICE },
  "fa-50-wrist-flexion": { disposition: "deferred", rows: [], readAgainst: [], note: RICE },
  "fa-50-wrist-extension": { disposition: "deferred", rows: [], readAgainst: [], note: RICE },
};

/** The catalog names the design gives its rows (§1.2), checked against the catalog. */
const designRowNames: Readonly<Record<number, string>> = {
  42: "Romanian Deadlift", 78: "Towel Pull-Up", 121: "Barbell Curl", 129: "Bayesian Cable Curl", 132: "Hammer Curl", 134: "Rope Hammer Curl", 135: "Reverse Curl",
  136: "Zottman Curl", 139: "Wrist Curl", 140: "Reverse Wrist Curl", 142: "Plate Pinch", 143: "Dead Hang", 144: "Towel Dead Hang", 186: "Romanian Deadlift",
  299: "Farmer's Walk", 332: "Rope Cable Row", 337: "Rope Hammer Cable Curl", 350: "Cable Wrist Extension", 387: "Kettlebell Clean", 402: "Gripper Close",
  403: "Gripper Hold", 405: "Lever Pronation", 406: "Lever Supination", 407: "Lever Radial Deviation", 408: "Lever Ulnar Deviation", 409: "Suitcase Carry",
  410: "One-Arm Dumbbell Wrist Curl", 411: "One-Arm Dumbbell Reverse Wrist Curl",
};

/** The three rows §1.2 adds at F3 (ids reserved, 417–419; 420 for decision 2's drill). */
const plannedRows: Readonly<Record<number, { name: string; equipment: string; deliberateHold: boolean }>> = {
  417: { name: "Cable Wrist Curl", equipment: "Cable", deliberateHold: false },
  418: { name: "Behind-the-Back Wrist Curl", equipment: "Barbell", deliberateHold: false },
  419: { name: "Barbell Hold", equipment: "Barbell", deliberateHold: true },
};

// ---------------------------------------------------------------- one cell, read through §2.1

export interface Reading {
  relationship: Relationship;
  mode: MuscleMode;
  category: ExposureCategory;
}

/** §2.1: the package's bucket in the app's words. FPL holding the implement is incidental, not a stabilizer (§1.3). */
export const vocabulary = [
  { bucket: "direct_dynamic", contraction: "dynamic_concentric_eccentric", relationship: "direct", mode: "dynamic", note: "direct_dynamic" },
  { bucket: "deliberate_isometric", contraction: "isometric", relationship: "direct", mode: "isometric", note: "deliberate_isometric on a variant with deliberateHold; incidental_isometric on one without" },
  { bucket: "supporting_dynamic", contraction: "dynamic_concentric_eccentric", relationship: "contributing", mode: "dynamic", note: "contributing_dynamic; grades 3 and 2 read alike, the grade is kept only in this report" },
  { bucket: "supporting_isometric", contraction: "isometric", relationship: "stabilizer", mode: "isometric", note: "incidental_isometric; FPL, which holds the implement rather than steadying a joint, reads as incidental (same category)" },
  { bucket: "incidental_grip", contraction: "isometric", relationship: "incidental", mode: "isometric", note: "incidental_isometric; requiresNoStraps where a strap takes the grip" },
  { bucket: "unmodeled", contraction: "unmodeled", relationship: null, mode: null, note: "no row; the package's unmodeled is not the app's unknown" },
] as const;

function readCell(cell: PackageCell, code: string, deliberateHold: boolean): Reading | null {
  const rule = vocabulary.find((entry) => entry.bucket === cell.exposure_bucket);
  if (!rule) throw new Error(`Unknown exposure bucket "${cell.exposure_bucket}"`);
  if (rule.contraction !== cell.contraction) throw new Error(`Bucket ${cell.exposure_bucket} with contraction ${cell.contraction}`);
  if ((rule.relationship === null) !== (cell.targeting_grade_0_4 === null)) throw new Error(`Bucket ${cell.exposure_bucket} with grade ${cell.targeting_grade_0_4}`);
  if (rule.relationship === null || rule.mode === null) return null;
  const relationship: Relationship = rule.bucket === "supporting_isometric" && code === "FPL" ? "incidental" : rule.relationship;
  return { relationship, mode: rule.mode, category: categoryFor(relationship, rule.mode, deliberateHold) };
}

/** The package's own values for one cell, as received: labelled, never imported. */
function packageOwn(cell: PackageCell) {
  return {
    targeting_grade_0_4: cell.targeting_grade_0_4,
    targeting_index_0_100: cell.targeting_index_0_100,
    plausible_grade_band: cell.plausible_grade_band,
    exposure_bucket: cell.exposure_bucket,
    contraction: cell.contraction,
    confidence: cell.confidence,
    tissue_exposure_grade_0_4: cell.tissue_exposure_grade_0_4,
  };
}
/** Fields every cell carries with one value; listed once (`packageCellConstants`) and checked. */
const CONSTANT_CELL_FIELDS = ["band_type", "evidence_basis", "tissue_force_newtons"] as const;

// ---------------------------------------------------------------- the app's side of a cell

export interface AppRow {
  id: string;
  relationship: Relationship;
  mode: MuscleMode;
  category: ExposureCategory;
  /** `planned` for a row the design adds with a new catalog row (§1.2), not yet in code. */
  status: "reviewed" | "draft" | "rejected" | "planned";
  allocation: "individual" | "shared";
  requiresNoStraps: boolean;
}

const mappings: readonly VariantMapping[] = forearmHomeContent.mappings;
const mappingVersion = forearmHomeContent.mappingVersion;
if (!mappingVersion) throw new Error("The forearm content has no mapping version");
const MAPPING_VERSION = mappingVersion.key;
const MAPPING_STATE = mappingVersion.state;
const rowsByVariant = new Map<string, VariantMapping[]>();
for (const mapping of mappings) rowsByVariant.set(mapping.variantId, [...(rowsByVariant.get(mapping.variantId) ?? []), mapping]);

/** §1.2: the three new rows follow families v1 already reviewed. */
function plannedMappings(catalogId: number): { nodeId: NodeId; relationship: Relationship; mode: MuscleMode; allocation: "individual" | "shared"; requiresNoStraps: boolean }[] {
  const wristCurl = [
    { nodeId: m.flexorCarpiRadialis, relationship: "direct", mode: "dynamic", allocation: "individual", requiresNoStraps: false },
    { nodeId: m.flexorCarpiUlnaris, relationship: "direct", mode: "dynamic", allocation: "individual", requiresNoStraps: false },
    { nodeId: m.palmarisLongus, relationship: "contributing", mode: "dynamic", allocation: "individual", requiresNoStraps: false },
    { nodeId: m.flexorDigitorumSuperficialis, relationship: "incidental", mode: "isometric", allocation: "shared", requiresNoStraps: false },
    { nodeId: m.flexorDigitorumProfundus, relationship: "incidental", mode: "isometric", allocation: "shared", requiresNoStraps: false },
  ] as const;
  const hold = [
    { nodeId: m.flexorDigitorumSuperficialis, relationship: "direct", mode: "isometric", allocation: "shared", requiresNoStraps: true },
    { nodeId: m.flexorDigitorumProfundus, relationship: "direct", mode: "isometric", allocation: "shared", requiresNoStraps: true },
    { nodeId: m.extensorCarpiRadialisLongus, relationship: "stabilizer", mode: "isometric", allocation: "individual", requiresNoStraps: false },
    { nodeId: m.extensorCarpiRadialisBrevis, relationship: "stabilizer", mode: "isometric", allocation: "individual", requiresNoStraps: false },
    { nodeId: m.extensorCarpiUlnaris, relationship: "stabilizer", mode: "isometric", allocation: "individual", requiresNoStraps: false },
    { nodeId: m.flexorPollicisLongus, relationship: "incidental", mode: "isometric", allocation: "individual", requiresNoStraps: true },
  ] as const;
  if (catalogId === 417 || catalogId === 418) return [...wristCurl];
  if (catalogId === 419) return [...hold];
  return [];
}

interface ReadAgainst {
  kind: "v1" | "planned" | "logged-as" | "none";
  version: string | null;
  variants: string[];
  deliberateHold: boolean | null;
  /** For two rows read together (the catalog lists the exercise twice): whether they map alike. */
  alike: boolean | null;
  rows: Map<NodeId, AppRow>;
  /** Rows on the variant outside the package's 19 muscles (the upper arm's, in v1). */
  outside: AppRow[];
}

function appRowOf(mapping: VariantMapping, deliberateHold: boolean): AppRow {
  return {
    id: mapping.id,
    relationship: mapping.relationship,
    mode: mapping.muscleMode,
    category: categoryFor(mapping.relationship, mapping.muscleMode, deliberateHold),
    status: mapping.reviewStatus,
    allocation: mapping.allocation,
    requiresNoStraps: mapping.requiresNoStraps,
  };
}

const sameRow = (a: AppRow, b: AppRow) =>
  a.relationship === b.relationship && a.mode === b.mode && a.status === b.status && a.allocation === b.allocation && a.requiresNoStraps === b.requiresNoStraps;

function readAgainstFor(design: DesignRecord): ReadAgainst {
  if (design.readAgainst.length === 0) return { kind: "none", version: null, variants: [], deliberateHold: null, alike: null, rows: new Map(), outside: [] };
  const planned = design.readAgainst.every((id) => id in plannedRows);
  if (planned) {
    const id = design.readAgainst[0];
    const hold = plannedRows[id].deliberateHold;
    const rows = new Map<NodeId, AppRow>(plannedMappings(id).map((row) => [row.nodeId, { id: `cat-${id}:${row.nodeId}`, relationship: row.relationship, mode: row.mode, category: categoryFor(row.relationship, row.mode, hold), status: "planned", allocation: row.allocation, requiresNoStraps: row.requiresNoStraps }]));
    return { kind: "planned", version: "forearm_mappings_v2 (planned, design §1.2; not in code)", variants: [`cat-${id}`], deliberateHold: hold, alike: null, rows, outside: [] };
  }
  const per = design.readAgainst.map((catalogId) => {
    const variant = variantFor(catalogId);
    if (!variant) throw new Error(`Design row ${catalogId} has no variant in the shared library`);
    const forearmNodes = new Set<string>(coreForearmMuscleIds);
    const all = (rowsByVariant.get(variant.id) ?? []).map((mapping) => ({ nodeId: mapping.nodeId, row: appRowOf(mapping, variant.deliberateHold) }));
    return {
      variantId: variant.id,
      deliberateHold: variant.deliberateHold,
      rows: new Map<NodeId, AppRow>(all.filter((entry) => forearmNodes.has(entry.nodeId)).map((entry) => [entry.nodeId, entry.row])),
      outside: all.filter((entry) => !forearmNodes.has(entry.nodeId)).map((entry) => entry.row),
    };
  });
  const [first, ...others] = per;
  const alike =
    others.length === 0
      ? null
      : others.every((other) => other.deliberateHold === first.deliberateHold && other.rows.size === first.rows.size && Array.from(first.rows).every(([node, row]) => {
          const twin = other.rows.get(node);
          return twin !== undefined && sameRow(row, twin);
        }));
  return {
    kind: design.disposition === "deferred" ? "logged-as" : "v1",
    version: MAPPING_VERSION,
    variants: per.map((entry) => entry.variantId),
    deliberateHold: first.deliberateHold,
    alike,
    rows: first.rows,
    outside: first.outside,
  };
}

// ---------------------------------------------------------------- verdicts and decisions

export type Verdict = "AGREE" | "DISAGREE" | "PACKAGE-ONLY" | "OURS-ONLY" | "NEITHER" | "NOT-COMPARED";
export type VerdictDetail = "same" | "same-category" | "different-category" | "ours-draft" | null;

function verdictOf(reading: Reading | null, app: AppRow | null, kind: ReadAgainst["kind"]): { verdict: Verdict; detail: VerdictDetail } {
  if (kind === "none") return { verdict: "NOT-COMPARED", detail: null };
  if (!reading && !app) return { verdict: "NEITHER", detail: null };
  if (!reading) return { verdict: "OURS-ONLY", detail: app?.status === "draft" ? "ours-draft" : null };
  if (!app) return { verdict: "PACKAGE-ONLY", detail: null };
  if (reading.relationship === app.relationship && reading.mode === app.mode) return { verdict: "AGREE", detail: app.status === "draft" ? "ours-draft" : "same" };
  if (app.status === "draft") return { verdict: "DISAGREE", detail: "ours-draft" };
  return { verdict: "DISAGREE", detail: reading.category === app.category ? "same-category" : "different-category" };
}

export interface Family {
  id: string;
  section: string;
  label: string;
  decision: string;
  /** What forearm_mappings_v2 does with the cells of this family. */
  v2: "carries ours" | "reviews ours" | "adds rows" | "adds rows only if a source passes" | "adds nothing";
}

/** §1.3 and §1.4, family by family. */
export const families: readonly Family[] = [
  { id: "keep-ours-wrist-curl-grip", section: "§1.3", label: "Keep ours", v2: "carries ours", decision: "FDS and FDP in wrist curls: package supporting dynamic, app incidental grip. Keep ours: no source measured FDS's or FDP's part in a wrist curl, and finger motion as the bar rolls is not credited (05-mappings.md). v2 carries the v1 row unchanged; the new wrist-curl rows (417, 418) follow the same family (§1.2)." },
  { id: "keep-ours-towel-pull-up", section: "§1.3", label: "Keep ours", v2: "carries ours", decision: "FDS and FDP in the towel pull-up: package incidental grip, app contributing isometric. Keep ours: the same category (incidental_isometric, the variant is not a deliberate hold), so no number differs; ours says why the towel makes the grip limit the set." },
  { id: "fpl-review-incidental", section: "§1.3", label: "Review as incidental, if Hamrick is confirmed", v2: "reviews ours", decision: "FPL in the towel hang, farmer hold, farmer's walk and suitcase carry: app draft contributing isometric. Review as incidental, isometric, basis inference, requiresNoStraps, action thumb IP flexion, sources S4 (FPL's action row) and Hamrick, Churchill, Schmitt and Hylander 1998 (pmid.9503091, abstract). Reviewed only if lane V1 confirms Hamrick's record with its locator; otherwise all five FPL rows stay draft, with no fallback to anatomy alone." },
  { id: "keep-ours-br-supinated-curl", section: "§1.3", label: "Keep ours", v2: "carries ours", decision: "The brachioradialis in a supinated, thick-grip curl: package direct, app contributing. Keep ours: M1 found its contribution differed only with the hand pronated; S07 found no forearm EMG difference with a thick grip in the concentration curl it tested." },
  { id: "adopt-wrist-extensors-grip", section: "§1.4", label: "Adopt: stabilizer, isometric", v2: "adds rows", decision: "The wrist extensors (ECRL, ECRB, ECU) steadying the wrist in the grip tasks (143, 144, 402, 403, and 419): adopt as stabilizer, isometric, action wrist extension, basis emg, citing M2 (\"Wrist-extensor activity accompanied gripping\"; limitation: names the wrist extensors as a group, not each muscle; a dynamometer, not a barbell), with S05 where its excerpt names the muscle; requiresNoStraps on the hangs. 12 rows, plus 3 on 419 counted with the new rows." },
  { id: "conditional-wrist-flexors-grip", section: "§1.4", label: "Adopt only if a source names them", v2: "adds rows only if a source passes", decision: "The wrist flexors (FCR, FCU) steadying in the grip tasks and the carries (143, 144, 145, 299, 402, 403, 409, 419): adopt only if S05's or M2's excerpt names FCR, FCU or the wrist flexors as a group among the muscles active in the grip. M2's recorded note says only \"flexor activity\", which does not pass as recorded; lane V1 reads both excerpts first. 0 to 16 rows." },
  { id: "not-adopted-wrist-steadying", section: "§1.4", label: "Not adopted in v2", v2: "adds nothing", decision: "Any wrist muscle steadying in curls, rows, pulldowns, deadlifts, levers and the pinch: not adopted in v2. M2 measured a hand gripping a dynamometer; v1 applied it to holds and carries, where the grip is the task, not to lifts where the grip is incidental. A later version may, with a source on gym grips." },
  { id: "adopt-fpl-full-hand-hold", section: "§1.3, §1.4", label: "Adopt as incidental", v2: "adds rows", decision: "FPL in deliberate full-hand holds (143, and 419): adopt as §1.3, incidental, isometric, basis inference, Hamrick 1998, bare hand only (requiresNoStraps); draft if Hamrick's record is not confirmed. 1 row, plus 1 on 419 counted with the new rows." },
  { id: "not-reviewed-fpl-handles", section: "§1.4", label: "Not reviewed in v2", v2: "adds nothing", decision: "FPL in every other gripped handle (curls, rows, deadlifts, shrugs; here also the wrist curls, the levers and the gripper): not reviewed in this version. Hamrick's finding makes these candidates for a later version, reviewed family by family with the same limitation." },
  { id: "conditional-pq-supination", section: "§1.4", label: "Adopt only if S03 says so", v2: "adds rows only if a source passes", decision: "PQ steadying in lever supination (406): adopt only if S03's abstract is found and says the pronator quadratus is active in supination, with a locator; action forearm.distal_radioulnar_stabilization. 0 or 1 row." },
  { id: "not-adopted-pl-edm-ei", section: "§1.4", label: "Not adopted", v2: "adds nothing", decision: "PL, EDM and EI as helpers in more exercises: not adopted; nothing new in the package." },
  { id: "undecided", section: "—", label: "Not decided by the design", v2: "adds nothing", decision: "The design names no decision for this cell's family. Listed under Design checks for the owner of §1.3–§1.4." },
];

const WRIST_CURL_ROWS = new Set([139, 410, 417, 418]);
const FPL_DRAFT_ROWS = new Set([144, 145, 299, 409]);
const EXTENSOR_GRIP_ROWS = new Set([143, 144, 402, 403, 419]);
const FLEXOR_GRIP_ROWS = new Set([143, 144, 145, 299, 402, 403, 409, 419]);
const FPL_HOLD_ROWS = new Set([143, 419]);
const WRIST_CODES = new Set(["FCR", "FCU", "ECRL", "ECRB", "ECU"]);

function familyOf(verdict: Verdict, detail: VerdictDetail, code: string, catalogId: number): string | null {
  if (verdict === "DISAGREE") {
    if ((code === "FDS" || code === "FDP") && WRIST_CURL_ROWS.has(catalogId)) return "keep-ours-wrist-curl-grip";
    if ((code === "FDS" || code === "FDP") && catalogId === 78) return "keep-ours-towel-pull-up";
    if (code === "FPL" && detail === "ours-draft" && FPL_DRAFT_ROWS.has(catalogId)) return "fpl-review-incidental";
    if (code === "BR" && catalogId === 121) return "keep-ours-br-supinated-curl";
    return "undecided";
  }
  if (verdict === "PACKAGE-ONLY") {
    if ((code === "ECRL" || code === "ECRB" || code === "ECU") && EXTENSOR_GRIP_ROWS.has(catalogId)) return "adopt-wrist-extensors-grip";
    if ((code === "FCR" || code === "FCU") && FLEXOR_GRIP_ROWS.has(catalogId)) return "conditional-wrist-flexors-grip";
    if (WRIST_CODES.has(code)) return "not-adopted-wrist-steadying";
    if (code === "FPL") return FPL_HOLD_ROWS.has(catalogId) ? "adopt-fpl-full-hand-hold" : "not-reviewed-fpl-handles";
    if (code === "PQ" && catalogId === 406) return "conditional-pq-supination";
    if (code === "PL" || code === "EDM" || code === "EI") return "not-adopted-pl-edm-ei";
    return "undecided";
  }
  return null;
}

// ---------------------------------------------------------------- forearm_mappings_v2, from the design

export interface PlannedChange {
  id: string;
  change: "insert" | "update";
  family: string;
  condition: string | null;
  /** The package cells (record:code) read against this row that ask for it; empty where the design extends a family to a row no record names. */
  packageCells: string[];
}

const HAMRICK = "Reviewed only if lane V1 confirms Hamrick 1998 (pmid.9503091) with its locator; otherwise draft.";
function v2Plan(): { updated: PlannedChange[]; inserted: PlannedChange[]; conditional: PlannedChange[] } {
  const row = (id: number, node: NodeId) => `cat-${id}:${node}`;
  const updated = [144, 145, 299, 409].map((id) => ({ id: row(id, m.flexorPollicisLongus), change: "update" as const, family: "fpl-review-incidental", condition: `${HAMRICK} If not confirmed, the row stays as v1 has it.`, packageCells: [] as string[] }));
  const inserted: PlannedChange[] = [
    { id: row(143, m.flexorPollicisLongus), change: "insert", family: "adopt-fpl-full-hand-hold", condition: `${HAMRICK} If not confirmed, inserted as a draft.`, packageCells: [] },
    ...[143, 144, 402, 403].flatMap((id) => [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris].map((node) => ({ id: row(id, node), change: "insert" as const, family: "adopt-wrist-extensors-grip", condition: null, packageCells: [] as string[] }))),
    ...[417, 418, 419].flatMap((id) => plannedMappings(id).map((planned) => ({
      id: row(id, planned.nodeId),
      change: "insert" as const,
      family: `new row ${id} (§1.2)`,
      condition: id === 419 && planned.nodeId === m.flexorPollicisLongus ? `${HAMRICK} If not confirmed, inserted as a draft.` : null,
      packageCells: [] as string[],
    }))),
  ];
  const conditional: PlannedChange[] = [
    ...[143, 144, 145, 299, 402, 403, 409, 419].flatMap((id) => [m.flexorCarpiRadialis, m.flexorCarpiUlnaris].map((node) => ({ id: row(id, node), change: "insert" as const, family: "conditional-wrist-flexors-grip", condition: "Only if S05's or M2's excerpt names FCR, FCU or the wrist flexors as a group.", packageCells: [] as string[] }))),
    { id: row(406, m.pronatorQuadratus), change: "insert", family: "conditional-pq-supination", condition: "Only if S03's abstract is found and says the pronator quadratus is active in supination, with a locator.", packageCells: [] },
  ];
  return { updated, inserted, conditional };
}

// ---------------------------------------------------------------- sources

interface DesignSource {
  /** Library keys §1.5 says the package source already is. */
  sameAs: string[];
  /** The key §1.5 plans for a source not yet in the library; null when it is not added. */
  plannedKey: string | null;
  confirmed: string;
  usedFor: string;
}

/** §1.5, row by row. */
const designSources: Readonly<Record<string, DesignSource>> = {
  A01: { sameAs: ["A36"], plannedKey: null, confirmed: "same URL", usedFor: "nothing new" },
  A02: { sameAs: [], plannedKey: null, confirmed: "not added: the PDF was not found", usedFor: "—" },
  S02: { sameAs: ["S2"], plannedKey: null, confirmed: "same DOI", usedFor: "nothing new" },
  S03: { sameAs: [], plannedKey: "pmid.14656682", confirmed: "citation only (J Orthop Res 22:208-213); added once its abstract is seen", usedFor: "PQ steadying (§1.4), conditional" },
  S04: { sameAs: [], plannedKey: "pmid.32636008", confirmed: "title, journal, abstract", usedFor: "a second source on 407 and 408 where it names the muscle; limitation: a robot task" },
  S05: { sameAs: [], plannedKey: "pmid.35646483", confirmed: "title, journal, abstract (PeerJ 10:e13495; eight muscles; activity rose with grip force); the muscle list not confirmed", usedFor: "wrist steadying in the grip tasks (§1.4), where its excerpt names the muscle" },
  S06: { sameAs: ["M1", "A4"], plannedKey: null, confirmed: "same DOI; A4 and M1 are the shipped pair, frozen, the one allowed duplicate", usedFor: "nothing new" },
  S07: { sameAs: [], plannedKey: "pmid.30694963", confirmed: "title, journal, abstract", usedFor: "this report's reason for \"set-up not recorded\"; cited by no row" },
  S08: { sameAs: ["S3"], plannedKey: null, confirmed: "same DOI", usedFor: "nothing new" },
  S09: { sameAs: [], plannedKey: "pmid.27174923", confirmed: "title, journal, abstract", usedFor: "rep guidance's general sentence only (§5.3)" },
  S10: { sameAs: [], plannedKey: null, confirmed: "bibliographic details only; not added until its abstract is seen", usedFor: "—" },
  S11: { sameAs: [], plannedKey: null, confirmed: "title only; not added", usedFor: "—" },
  S12: { sameAs: ["S1"], plannedKey: null, confirmed: "same DOI; its date is Dec 2025 in the record found, not Feb 2026 as the package says", usedFor: "nothing new" },
  S13: { sameAs: [], plannedKey: "pmid.38970765", confirmed: "the PubMed record (also in trainingEvidence.ts)", usedFor: "rep guidance's effort sentence only" },
  S14: { sameAs: [], plannedKey: "pmid.30580468", confirmed: "title, journal, abstract", usedFor: "only \"isometric results depend on hold length, intensity and intent\" (§5.3); not the 10–30 s range" },
  S15: { sameAs: [], plannedKey: "pmid.35657492", confirmed: "objectives only", usedFor: "the tendon section's method note only" },
  S16: { sameAs: [], plannedKey: "cdc.lateral_epicondylitis_hand_force_2014", confirmed: "title and record only", usedFor: "the tendon section's method note only" },
  S17: { sameAs: [], plannedKey: "pmid.30621312", confirmed: "title, journal, abstract", usedFor: "the tendon section's method note only" },
  S18: { sameAs: [], plannedKey: "pmid.28834797", confirmed: "the PubMed record (also in trainingEvidence.ts)", usedFor: "rep guidance's general sentence only (§5.3)" },
  S19: { sameAs: [], plannedKey: null, confirmed: "not added: no record found", usedFor: "—" },
};

const normalizeUrl = (url: string) => url.trim().toLowerCase().replace(/^http:/, "https:").replace(/\/+$/, "");
const normalizeDoi = (doi: string) => doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
function pmidOfUrl(url: string): string | null {
  const match = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(url);
  return match ? match[1] : null;
}
function doiOfUrl(url: string): string | null {
  const match = /doi\.org\/(.+)$/i.exec(url.trim());
  return match ? normalizeDoi(match[1]) : null;
}

function allUrls(value: unknown): string[] {
  if (typeof value === "string") return value.startsWith("http") ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(allUrls);
  if (value && typeof value === "object") return Object.values(value).flatMap(allUrls);
  return [];
}

export interface SourceRow {
  id: string;
  title: string;
  pmid: string | null;
  doi: string | null;
  url: string;
  status: "duplicate" | "new";
  /** Library keys the source already is, with what matched. */
  library: { key: string; by: ("pmid" | "doi" | "url")[] }[];
  alsoIn: string[];
  design: DesignSource;
}

function buildSources(sources: PackageSource[]): SourceRow[] {
  const trainingUrls = allUrls(trainingEvidence);
  return sources.map((source) => {
    const pmid = source.pmid ?? pmidOfUrl(source.url);
    const doi = source.doi ? normalizeDoi(source.doi) : doiOfUrl(source.url);
    const library = sourceLibrary.flatMap((entry) => {
      const by: ("pmid" | "doi" | "url")[] = [];
      const entryPmid = /^pmid\.(\d+)$/.exec(entry.id)?.[1] ?? pmidOfUrl(entry.url);
      const entryDoi = entry.doi ? normalizeDoi(entry.doi) : doiOfUrl(entry.url);
      if (pmid && entryPmid === pmid) by.push("pmid");
      if (doi && entryDoi === doi) by.push("doi");
      if (normalizeUrl(entry.url) === normalizeUrl(source.url)) by.push("url");
      return by.length ? [{ key: entry.id, by }] : [];
    });
    const alsoIn = trainingUrls.some((url) => (pmid && pmidOfUrl(url) === pmid) || (doi && doiOfUrl(url) === doi)) ? ["client/src/lib/trainingEvidence.ts"] : [];
    const design = designSources[source.id];
    if (!design) throw new Error(`sources.json: ${source.id} has no row in the design's §1.5`);
    return { id: source.id, title: source.title, pmid: pmid ?? null, doi: doi ?? null, url: source.url, status: library.length ? "duplicate" : "new", library, alsoIn, design };
  });
}

// ---------------------------------------------------------------- rep profiles

/** §5.1: the design's family for each package profile, with the numbers it shows. */
const designRepFamilies: Readonly<Record<string, { family: string; growth: [number, number] | null; strength: [number, number] | null; unit: "reps" | "seconds" | null }>> = {
  wrist: { family: "Wrist", growth: [10, 25], strength: [6, 12], unit: "reps" },
  rotation: { family: "Rotation", growth: [10, 20], strength: [6, 12], unit: "reps" },
  elbow: { family: "Elbow (brachioradialis curls)", growth: [6, 20], strength: [3, 6], unit: "reps" },
  finger: { family: "Finger", growth: [10, 25], strength: [5, 10], unit: "reps" },
  thumb: { family: "Thumb", growth: [12, 25], strength: null, unit: "reps" },
  isometric_grip: { family: "Deliberate grip hold (stationary)", growth: [10, 30], strength: [3, 10], unit: "seconds" },
  ballistic_or_mixed: { family: "Ballistic or mixed", growth: null, strength: null, unit: null },
};

const sameRange = (a: unknown, b: [number, number] | null) => JSON.stringify(a ?? null) === JSON.stringify(b);

// ---------------------------------------------------------------- the report

export interface CellEntry {
  code: string;
  node: NodeId;
  packageOwn: ReturnType<typeof packageOwn>;
  reading: Reading | null;
  app: AppRow | null;
  verdict: Verdict;
  detail: VerdictDetail;
  family: string | null;
}

export interface RecordEntry {
  id: string;
  candidate: number;
  name: string;
  packageStatus: string;
  aliasOf: string | null;
  canonical: string;
  disposition: Disposition;
  group: "existing" | "new row" | "referred" | "deferred" | "blocked";
  catalogRows: { id: number; name: string; inCatalog: boolean }[];
  note: string;
  readAgainst: { kind: ReadAgainst["kind"]; version: string | null; variants: string[]; deliberateHold: boolean | null; alike: boolean | null };
  /** Whether the categories in `reading` are read on a deliberate hold: the variant's own attribute, or, with no variant, the set-up the package describes. */
  readingDeliberateHold: boolean;
  package: { profile: string | null; prescriptionProfile: string | null; prescriptionApplication: string; contextFlags: string[]; sources: string[]; externalContributors: string[]; setup: string; notes: string };
  tally: Record<Verdict, number>;
  cells: CellEntry[];
  appRowsOutsideThe19: AppRow[];
}

export interface DesignCheck {
  section: string;
  claim: string;
  found: string;
  holds: boolean;
}

const VERDICTS: Verdict[] = ["AGREE", "DISAGREE", "PACKAGE-ONLY", "OURS-ONLY", "NEITHER", "NOT-COMPARED"];
const emptyTally = (): Record<Verdict, number> => ({ AGREE: 0, DISAGREE: 0, "PACKAGE-ONLY": 0, "OURS-ONLY": 0, NEITHER: 0, "NOT-COMPARED": 0 });
const normalizeName = (name: string) => name.replace(/[’‘]/g, "'");

function resolveAlias(records: PackageRecord[], id: string): string {
  const byId = new Map(records.map((record) => [record.id, record]));
  const seen = new Set<string>();
  let current = id;
  for (;;) {
    if (seen.has(current)) throw new Error(`Alias cycle through ${Array.from(seen).join(" → ")} → ${current}`);
    seen.add(current);
    const record = byId.get(current);
    if (!record) throw new Error(`Alias target ${current} is not a record`);
    if (!record.canonical_alias_of) return current;
    current = record.canonical_alias_of;
  }
}

export function buildImportReport(pkg: ForearmResearchPackage = readPackage()) {
  const muscleMap = buildMuscleMap(pkg.muscles);
  const codeById = new Map(muscleMap.map((row) => [row.packageId, row]));
  const catalogById = new Map(catalog.map((exercise) => [exercise.id, exercise]));

  // Every record is decided exactly once, and the design decides no record the package lacks.
  const packageIds = pkg.exercises.map((record) => record.id);
  if (new Set(packageIds).size !== packageIds.length) throw new Error("exercises.json: duplicate record ids");
  const undecided = packageIds.filter((id) => !designRecords[id]);
  const unknown = Object.keys(designRecords).filter((id) => !packageIds.includes(id));
  if (undecided.length || unknown.length) throw new Error(`Design dispositions out of step with the package: undecided ${undecided.join(", ") || "none"}; unknown ${unknown.join(", ") || "none"}`);

  // Cell constants, checked once.
  const constants: Record<string, unknown> = {};
  for (const field of CONSTANT_CELL_FIELDS) {
    const values = new Set(pkg.exercises.flatMap((record) => record.mappings.map((cell) => JSON.stringify(cell[field]))));
    if (values.size !== 1) throw new Error(`exercises.json: ${field} is not one value across the cells (${Array.from(values).join(", ")})`);
    constants[field] = JSON.parse(Array.from(values)[0]);
  }

  const records: RecordEntry[] = pkg.exercises.map((record) => {
    const design = designRecords[record.id];
    const canonical = resolveAlias(pkg.exercises, record.id);
    const against = readAgainstFor(design);
    // The cells, in muscles.json's order; each of the 19 exactly once, an unknown id an error.
    const byMuscle = new Map<string, PackageCell>();
    for (const cell of record.mappings) {
      if (!codeById.has(cell.muscle_id)) throw new Error(`${record.id}: unknown muscle id "${cell.muscle_id}"; no muscle is matched by name`);
      if (byMuscle.has(cell.muscle_id)) throw new Error(`${record.id}: ${cell.muscle_id} twice`);
      byMuscle.set(cell.muscle_id, cell);
    }
    if (byMuscle.size !== muscleMap.length) throw new Error(`${record.id}: ${byMuscle.size} cells, expected ${muscleMap.length}`);
    const deliberateHold = against.deliberateHold ?? record.mappings.some((cell) => cell.exposure_bucket === "deliberate_isometric");
    const tally = emptyTally();
    const cells: CellEntry[] = muscleMap.map((muscle) => {
      const cell = byMuscle.get(muscle.packageId) as PackageCell;
      const reading = readCell(cell, muscle.code, deliberateHold);
      const app = against.rows.get(muscle.nodeId) ?? null;
      const { verdict, detail } = verdictOf(reading, app, against.kind);
      tally[verdict] += 1;
      return { code: muscle.code, node: muscle.nodeId, packageOwn: packageOwn(cell), reading, app, verdict, detail, family: against.kind === "none" ? null : familyOf(verdict, detail, muscle.code, design.readAgainst[0]) };
    });
    const group = EXISTING_GROUP.has(design.disposition) ? "existing" : (design.disposition as RecordEntry["group"]);
    return {
      id: record.id,
      candidate: record.original_candidate_number,
      name: record.name,
      packageStatus: record.publication_status,
      aliasOf: record.canonical_alias_of,
      canonical,
      disposition: design.disposition,
      group,
      catalogRows: design.rows.map((id) => ({ id, name: catalogById.get(id)?.name ?? plannedRows[id]?.name ?? "(not in the catalog)", inCatalog: catalogById.has(id) })),
      note: design.note,
      readAgainst: { kind: against.kind, version: against.version, variants: against.variants, deliberateHold: against.deliberateHold, alike: against.alike },
      readingDeliberateHold: deliberateHold,
      package: {
        profile: record.profile_id,
        prescriptionProfile: record.prescription_profile_id,
        prescriptionApplication: record.prescription_application,
        contextFlags: record.context_flags,
        sources: record.source_ids,
        externalContributors: record.external_contributors,
        setup: record.setup_definition,
        notes: record.notes,
      },
      tally,
      cells,
      appRowsOutsideThe19: against.outside,
    };
  });

  // ------------------------------------------------------------ counts
  const allCells = records.flatMap((record) => record.cells.map((cell) => ({ record, cell })));
  const countBy = <T extends string>(values: T[]) => values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
  const dispositionCounts = countBy(records.map((record) => record.disposition));
  const groupCounts = countBy(records.map((record) => record.group));
  const tallyOf = (subset: RecordEntry[]) => {
    const tally = emptyTally();
    // AGREE and DISAGREE split by how (same / same-category / different-category / ours-draft).
    const details: Record<string, number> = {};
    for (const record of subset) for (const cell of record.cells) {
      tally[cell.verdict] += 1;
      if (cell.verdict === "AGREE" || cell.verdict === "DISAGREE") {
        const key = `${cell.verdict === "AGREE" ? "agree" : "disagree"}:${cell.detail}`;
        details[key] = (details[key] ?? 0) + 1;
      }
    }
    const sortedDetails = Object.fromEntries(Object.entries(details).sort(([x], [y]) => x.localeCompare(y)));
    return { records: subset.length, cells: subset.reduce((sum, record) => sum + record.cells.length, 0), verdicts: tally, details: sortedDetails };
  };
  const existingNonAlias = records.filter((record) => record.group === "existing" && record.disposition !== "alias");
  const agreement = {
    existing: { label: "The existing records against forearm_mappings_v1, the alias left out (no second dose)", ...tallyOf(existingNonAlias) },
    alias: { label: "The alias, read through its canonical record's row", ...tallyOf(records.filter((record) => record.disposition === "alias")) },
    newRows: { label: "The three new-row records against the rows the design plans for them (§1.2)", ...tallyOf(records.filter((record) => record.group === "new row")) },
    loggedAs: { label: "Deferred records against the row they are logged as (§1.2)", ...tallyOf(records.filter((record) => record.readAgainst.kind === "logged-as")) },
  };

  const plan = v2Plan();
  const cellsAsking = (rowId: string) =>
    allCells.filter(({ record, cell }) => record.readAgainst.kind !== "none" && record.disposition !== "alias" && record.readAgainst.variants.some((variant) => `${variant}:${cell.node}` === rowId) && cell.reading !== null).map(({ record, cell }) => `${record.id}:${cell.code}`);
  for (const change of [...plan.updated, ...plan.inserted, ...plan.conditional]) change.packageCells = cellsAsking(change.id);
  const forearmNodes = new Set<string>(coreForearmMuscleIds);
  const v1Forearm = mappings.filter((mapping) => forearmNodes.has(mapping.nodeId));
  const v1Outside = mappings.filter((mapping) => !forearmNodes.has(mapping.nodeId));
  const v1Ids = new Set(mappings.map((mapping) => mapping.id));
  const unchanged = v1Forearm.filter((mapping) => !plan.updated.some((change) => change.id === mapping.id));
  const v2Rows = unchanged.length + plan.updated.length + plan.inserted.length;

  const blockedRecords = records.filter((record) => record.group === "blocked");
  const importCounts = {
    basis: "The package's §7.2 asks an idempotent import to report inserted, updated, skipped and blocked counts. Nothing is imported here: these are what the design has wave A's seed (catalog rows) and forearm_mappings_v2 (mapping rows) add or change, read from the design and the code, with nothing written anywhere but this report.",
    catalogRows: {
      inserted: { count: records.filter((record) => record.group === "new row").length, rows: records.filter((record) => record.group === "new row").flatMap((record) => record.catalogRows.map((row) => `${row.id} ${row.name} (${record.id})`)) },
      updated: { count: 0, rows: [] as string[] },
      skipped: { count: records.filter((record) => record.group === "existing" || record.group === "referred" || record.group === "deferred").length, existing: groupCounts.existing ?? 0, referred: groupCounts.referred ?? 0, deferred: groupCounts.deferred ?? 0 },
      blocked: { count: blockedRecords.length, records: blockedRecords.map((record) => `${record.id} (candidate ${record.candidate})`) },
    },
    mappingRows: {
      version: "forearm_mappings_v2 (written by lane V1, published in wave A's seed; §1.7)",
      inserted: { count: plan.inserted.length, onExistingVariants: plan.inserted.filter((change) => !/^cat-41[789]:/.test(change.id)).length, onNewRows: plan.inserted.filter((change) => /^cat-41[789]:/.test(change.id)).length },
      insertedConditional: { atMost: plan.conditional.length, wristFlexors: plan.conditional.filter((change) => change.family === "conditional-wrist-flexors-grip").length, pronatorQuadratus: plan.conditional.filter((change) => change.family === "conditional-pq-supination").length },
      updated: { count: plan.updated.length, condition: HAMRICK },
      skippedUnchanged: { count: unchanged.length, note: `${MAPPING_VERSION}'s rows on forearm muscles, carried unchanged` },
      notCarried: { count: v1Outside.length, note: "v1's rows on the upper arm's muscles (biceps, brachialis): rule 12 refuses them in a forearm version; from wave A the upper arm's own version credits them (10-multi-region.md §4.2)" },
      blocked: { count: 0, note: `${blockedRecords.length} blocked records, ${blockedRecords.length * muscleMap.length} cells, all unmodeled; no row` },
      total: { withoutConditional: v2Rows, atMost: v2Rows + plan.conditional.length },
    },
    cells: {
      total: allCells.length,
      mappedByThePackage: allCells.filter(({ cell }) => cell.reading !== null).length,
      unmodeled: allCells.filter(({ cell }) => cell.reading === null).length,
      byGroup: Object.fromEntries((["existing", "new row", "referred", "deferred", "blocked"] as const).map((group) => [group, records.filter((record) => record.group === group).reduce((sum, record) => sum + record.cells.length, 0)])),
    },
  };

  // ------------------------------------------------------------ families with their cells
  const familyEntries = families.map((family) => {
    const cells = allCells.filter(({ record, cell }) => cell.family === family.id && record.disposition !== "alias");
    return { ...family, cells: cells.map(({ record, cell }) => `${record.id}:${cell.code} → ${record.readAgainst.variants.join("/")}`) };
  });

  const sources = buildSources(pkg.sources);

  const repProfiles = Object.entries(pkg.repProfiles).map(([id, profile]) => {
    const design = designRepFamilies[id] ?? null;
    const growth = (profile.hypertrophy_reps ?? profile.hypertrophy_hold_seconds ?? null) as [number, number] | null;
    const strength = (profile.strength_practice_reps ?? profile.strength_practice_hold_seconds ?? null) as [number, number] | null;
    return {
      id,
      packageOwn: profile,
      designFamily: design?.family ?? null,
      matchesDesign: design !== null && sameRange(growth, design.growth) && sameRange(strength, design.strength),
      records: records.filter((record) => record.package.prescriptionProfile === id).map((record) => record.id),
    };
  });

  // ------------------------------------------------------------ the design's claims against the data
  const checks: DesignCheck[] = [];
  const check = (section: string, claim: string, found: string, holds: boolean) => checks.push({ section, claim, found, holds });
  const candidates = Array.from(new Set(records.map((record) => record.candidate))).sort((a, b) => a - b);
  check("§0.1, §1.2", "57 records from 50 original candidates", `${records.length} records, ${candidates.length} candidates (${candidates[0]}–${candidates[candidates.length - 1]})`, records.length === 57 && candidates.length === 50 && candidates.every((value, index) => value === index + 1));
  check("§0.1", "1,083 cells (57 × 19)", `${allCells.length}`, allCells.length === 1083);
  const mapped = allCells.filter(({ cell }) => cell.reading !== null);
  check("§1.1", "393 mapped cells, all confidence \"low\"; 690 null/unmodeled", `${mapped.length} mapped (confidence ${Array.from(new Set(mapped.map(({ cell }) => cell.packageOwn.confidence))).join(", ")}), ${allCells.length - mapped.length} unmodeled`, mapped.length === 393 && allCells.length - mapped.length === 690 && mapped.every(({ cell }) => cell.packageOwn.confidence === "low"));
  const combo = (grade: number, bucket: string) => mapped.filter(({ cell }) => cell.packageOwn.targeting_grade_0_4 === grade && cell.packageOwn.exposure_bucket === bucket);
  const combos: [number, string, number][] = [[4, "direct_dynamic", 65], [4, "deliberate_isometric", 19], [3, "supporting_dynamic", 3], [2, "supporting_dynamic", 33], [2, "supporting_isometric", 186], [2, "incidental_grip", 87]];
  check("§1.1", "Six combinations: 4 direct dynamic 65, 4 deliberate isometric 19, 3 supporting dynamic 3, 2 supporting dynamic 33, 2 supporting isometric 186, 2 incidental grip 87", combos.map(([grade, bucket]) => `${grade} ${bucket} ${combo(grade, bucket).length}`).join(", "), combos.every(([grade, bucket, count]) => combo(grade, bucket).length === count) && combos.reduce((sum, [, , count]) => sum + count, 0) === mapped.length);
  const grade3 = combo(3, "supporting_dynamic").map(({ record, cell }) => `${record.id} ${cell.code}`);
  check("§1.1", "Grade 3 supporting dynamic only on the brachioradialis in fa-28, fa-29, fa-42", grade3.join(", "), grade3.join(",") === "fa-28 BR,fa-29 BR,fa-42 BR");
  check("§1.1", "Grades 0 and 1 are never used", `grades used: ${Array.from(new Set(mapped.map(({ cell }) => cell.packageOwn.targeting_grade_0_4))).sort().join(", ")}`, mapped.every(({ cell }) => (cell.packageOwn.targeting_grade_0_4 ?? 0) >= 2));
  const indexOk = allCells.every(({ cell }) => cell.packageOwn.targeting_grade_0_4 === null ? cell.packageOwn.targeting_index_0_100 === null && cell.packageOwn.plausible_grade_band === null : cell.packageOwn.targeting_index_0_100 === cell.packageOwn.targeting_grade_0_4 * 25);
  check("package §7.2", "Grades null or integers 0–4; an index equals grade × 25 when present; null grade, null index and band", indexOk ? "holds on all 1,083 cells" : "violated", indexOk);
  const tissue = allCells.every(({ cell }) => cell.packageOwn.tissue_exposure_grade_0_4 === cell.packageOwn.targeting_grade_0_4);
  check("package §3.3", "The tissue grade inherits the targeting grade (a nominal flag)", tissue ? "equal on all 1,083 cells" : "differs on some cells", tissue);
  const nonAlias = pkg.exercises.filter((record) => record.publication_status !== "alias");
  const statusCount = countBy(nonAlias.map((record) => record.publication_status));
  const candidateStatus = countBy(candidates.map((candidate) => {
    const statuses = new Set(pkg.exercises.filter((record) => record.original_candidate_number === candidate).map((record) => record.publication_status));
    return statuses.size === 1 ? Array.from(statuses)[0] : Array.from(statuses).sort().join("+");
  }));
  check("§1.1", "All 50 non-alias records are draft_mapping (44) or blocked_protocol (6)", `${nonAlias.length} non-alias records: ${Object.entries(statusCount).map(([status, count]) => `${status} ${count}`).join(", ")}; by candidate: ${Object.entries(candidateStatus).map(([status, count]) => `${status} ${count}`).join(", ")}`, nonAlias.length === 50 && statusCount.draft_mapping === 44 && statusCount.blocked_protocol === 6);
  check("§1.1", "The manifest sets production_import_default: false", `production_import_default: ${JSON.stringify(pkg.manifest.production_import_default)}`, pkg.manifest.production_import_default === false);
  const sums = pkg.files.filter((file) => file.name !== "SHA256SUMS.txt");
  check("§1.1", "13 files, and SHA256SUMS.txt matches all of them", `${sums.length} files besides SHA256SUMS.txt; ${sums.filter((file) => file.listed === file.sha256).length} match it; ${sums.filter((file) => file.listed === null).length} not listed in it`, sums.length === 13 && sums.every((file) => file.listed === file.sha256));
  check("§1.1, §2.2", "The 19 muscle ids map one to one, by code, onto forearm.<abbr>, as the 3D identity table does", `${muscleMap.length} rows, ${new Set(muscleMap.map((row) => row.nodeId)).size} nodes, all equal to modelIdentity.ts`, muscleMap.length === 19 && muscleMap.every((row) => row.modelIdentity === row.nodeId));
  const blockedCandidates = blockedRecords.map((record) => record.candidate).sort((a, b) => a - b);
  check("§1.2, §10 input A", "Six blocked candidates: 7, 10, 13, 27, 39, 40 (the manifest's list)", `${blockedCandidates.join(", ")}; manifest ${JSON.stringify(pkg.manifest.blocked_original_candidates)}; package status ${Array.from(new Set(blockedRecords.map((record) => record.packageStatus))).join(", ")}`, blockedCandidates.join(",") === "7,10,13,27,39,40" && JSON.stringify(pkg.manifest.blocked_original_candidates) === "[7,10,13,27,39,40]" && blockedRecords.every((record) => record.packageStatus === "blocked_protocol"));
  const blockedNull = blockedRecords.every((record) => record.cells.every((cell) => cell.reading === null));
  check("§1.2", "The blocked records carry no mapped cell", blockedNull ? "all 114 cells unmodeled" : "some blocked cells are mapped", blockedNull);
  const alias = records.find((record) => record.disposition === "alias");
  const aliasCells = pkg.exercises.find((record) => record.id === "fa-22")?.mappings;
  const canonicalCells = pkg.exercises.find((record) => record.id === "fa-12")?.mappings;
  check("§1.2", "fa-22 is an alias of fa-12, resolving to 411; no second row, no second dose", `${alias?.id} → ${alias?.canonical} → ${alias?.readAgainst.variants.join(", ")}; cells ${JSON.stringify(aliasCells) === JSON.stringify(canonicalCells) ? "identical to" : "differ from"} fa-12's`, alias?.id === "fa-22" && alias.canonical === "fa-12" && alias.readAgainst.variants.join() === "cat-411" && records.filter((record) => record.packageStatus === "alias").length === 1);
  const sub = { existing: records.filter((record) => record.disposition === "existing").length, setup: records.filter((record) => record.disposition === SETUP).length, alias: records.filter((record) => record.disposition === "alias").length };
  check("§1.2 totals", "28 existing (18 the same task, 9 set-up not recorded, the alias), 3 new rows, 4 referred, 16 deferred, 6 blocked: 57", `${groupCounts.existing} existing (${sub.existing}, ${sub.setup}, ${sub.alias}), ${groupCounts["new row"]} new rows, ${groupCounts.referred} referred, ${groupCounts.deferred} deferred, ${groupCounts.blocked} blocked`, groupCounts.existing === 28 && sub.existing === 18 && sub.setup === 9 && sub.alias === 1 && groupCounts["new row"] === 3 && groupCounts.referred === 4 && groupCounts.deferred === 16 && groupCounts.blocked === 6);
  const nameProblems = Object.entries(designRowNames).filter(([id, name]) => normalizeName(catalogById.get(Number(id))?.name ?? "") !== name).map(([id, name]) => `${id}: design "${name}", catalog "${catalogById.get(Number(id))?.name ?? "missing"}"`);
  check("§1.2", "Every catalog row the design names exists under that name", nameProblems.length ? nameProblems.join("; ") : `${Object.keys(designRowNames).length} rows, all as named`, nameProblems.length === 0);
  const maxId = Math.max(...catalog.map((exercise) => exercise.id));
  const reserved = [417, 418, 419, 420].filter((id) => catalogById.has(id));
  check("§1.2", "Ids 417–419 are reserved for the new rows and 420 for decision 2's drill; the catalog ends at 416 until lane C1", `catalog ends at ${maxId}; reserved ids present: ${reserved.join(", ") || "none"}`, maxId === 416 && reserved.length === 0);
  for (const id of ["fa-09", "fa-26"]) {
    const record = records.find((entry) => entry.id === id);
    check("§1.2", `${id}: the two catalog rows are mapped alike`, `${record?.readAgainst.variants.join(" and ")}: ${record?.readAgainst.alike ? "alike" : "not alike"}`, record?.readAgainst.alike === true);
  }
  const directProblems = existingNonAlias.flatMap((record) => {
    const pkgDirect = record.cells.filter((cell) => cell.reading?.relationship === "direct").map((cell) => cell.code).sort().join(",");
    const appDirect = record.cells.filter((cell) => cell.app?.relationship === "direct" && cell.app.status === "reviewed").map((cell) => cell.code).sort().join(",");
    return pkgDirect === appDirect ? [] : [`${record.id} (package ${pkgDirect || "none"}; v1 ${appDirect || "none"})`];
  });
  check("§1.1", "The package's direct roles equal v1's reviewed direct rows on every matched record except fa-08", directProblems.length ? `differ on ${directProblems.join("; ")}` : "equal on every existing record", directProblems.length === 1 && directProblems[0].startsWith("fa-08 "));
  const directIn = (catalogId: number) => mappings.filter((mapping) => mapping.variantId === `cat-${catalogId}` && mapping.relationship === "direct" && mapping.reviewStatus === "reviewed").map((mapping) => muscleMap.find((row) => row.nodeId === mapping.nodeId)?.code ?? mapping.nodeId);
  const appDirectCodes = new Set(mappings.filter((mapping) => mapping.relationship === "direct" && mapping.reviewStatus === "reviewed").map((mapping) => muscleMap.find((row) => row.nodeId === mapping.nodeId)?.code).filter(Boolean));
  const packageDirectCodes = new Set(mapped.filter(({ record, cell }) => record.packageStatus !== "alias" && cell.reading?.relationship === "direct").map(({ cell }) => cell.code));
  const noDirect = (codes: Set<unknown>) => muscleMap.map((row) => row.code).filter((code) => !codes.has(code));
  check("§1.1, §10 decision 2", "The package's coverage gap describes its list, not the app: 412–414 and 404 are reviewed direct rows; neither the app nor the package has a direct exercise for EI, EDM or PL", `412 ${directIn(412).join("+")}, 413 ${directIn(413).join("+")}, 414 ${directIn(414).join("+")}, 404 ${directIn(404).join("+")}; no direct row in ${MAPPING_VERSION}: ${noDirect(appDirectCodes).join(", ")}; no direct cell in the package: ${noDirect(packageDirectCodes).join(", ")}`, noDirect(appDirectCodes).join() === "PL,EDM,EI" && ["PL", "EDM", "EI"].every((code) => !packageDirectCodes.has(code)) && directIn(412).join() === "FPL" && directIn(413).sort().join() === "EPB,EPL" && directIn(414).join() === "APL" && directIn(404).join() === "ED");
  const ex = agreement.existing;
  type Tally = ReturnType<typeof tallyOf>;
  const tallyText = (t: Tally) => `${t.records} records (${t.cells} cells): ${t.verdicts.AGREE} agree, ${t.details["disagree:same-category"] ?? 0} agree in category, ${t.details["disagree:different-category"] ?? 0} disagree, ${t.details["disagree:ours-draft"] ?? 0} disagree with a draft, ${t.verdicts["PACKAGE-ONLY"]} package only, ${t.verdicts["OURS-ONLY"]} ours only`;
  const tallyIs = (t: Tally, records: number, agree: number, sameCategory: number, differ: number, draft: number, packageOnly: number, oursOnly: number) =>
    t.records === records && t.verdicts.AGREE === agree && (t.details["disagree:same-category"] ?? 0) === sameCategory && (t.details["disagree:different-category"] ?? 0) === differ && (t.details["disagree:ours-draft"] ?? 0) === draft && t.verdicts["PACKAGE-ONLY"] === packageOnly && t.verdicts["OURS-ONLY"] === oursOnly;
  // §1.1's 24 are the existing records without the three curls an earlier draft referred to the upper arm (Appendix B #30).
  const earlierReferred = new Set(["fa-05", "fa-15", "fa-25"]);
  const scout = tallyOf(existingNonAlias.filter((record) => !earlierReferred.has(record.id)));
  check("§1.1, §1.4", "On the 24 matched, non-blocked, non-alias records (456 cells): 87 agree, 2 agree in category, 5 disagree, 3 disagree with one of our drafts, 94 package only, 0 ours only", `on the existing records without fa-05, fa-15 and fa-25, ${tallyText(scout)}`, tallyIs(scout, 24, 87, 2, 5, 3, 94, 0));
  check("§1.1, §1.2", "§1.1's 24 matched records are the records §1.2 calls existing, the alias left out", `§1.2 has ${ex.records}: the 24 leave out fa-05, fa-15 and fa-25 (the curls an earlier draft referred to the upper arm, Appendix B #30), which §1.2 now decides as existing; with them, ${tallyText(ex)}`, ex.records === 24);
  const undecidedCells = familyEntries.find((family) => family.id === "undecided")?.cells ?? [];
  check("§1.3, §1.4", "Every disagreement and package-only cell falls in a family the design decides", undecidedCells.length ? `not decided: ${undecidedCells.join("; ")}` : "all decided", undecidedCells.length === 0);
  const fplDrafts = mappings.filter((mapping) => mapping.nodeId === m.flexorPollicisLongus && mapping.reviewStatus === "draft");
  const fplNoStraps = fplDrafts.every((mapping) => !mapping.requiresNoStraps && mappings.filter((other) => other.variantId === mapping.variantId && (other.nodeId === m.flexorDigitorumSuperficialis || other.nodeId === m.flexorDigitorumProfundus)).every((other) => other.requiresNoStraps));
  check("§1.3", "v1's four FPL drafts (144, 145, 299, 409) lack requiresNoStraps, which FDS and FDP on the same variants have", `${fplDrafts.map((mapping) => mapping.variantId).join(", ")}: ${fplNoStraps ? "as stated" : "not as stated"}`, fplDrafts.map((mapping) => mapping.variantId).sort().join() === "cat-144,cat-145,cat-299,cat-409" && fplNoStraps);
  const carriers = [145, 299, 409].every((id) => [m.extensorCarpiRadialisLongus, m.extensorCarpiRadialisBrevis, m.extensorCarpiUlnaris].every((node) => mappings.some((mapping) => mapping.id === `cat-${id}:${node}` && mapping.relationship === "stabilizer" && mapping.sources.some((ref) => ref.sourceId === "M2"))));
  check("§1.4", "v1's reviewers already applied M2 to the carries (wrist extensors steadying on 145, 299, 409)", carriers ? "stabilizer rows citing M2 on all three" : "missing", carriers);
  const v1Drafts = mappings.filter((mapping) => mapping.reviewStatus === "draft").length;
  check("§1.7, §9", "v1: 418 rows; 361 on forearm muscles carried unchanged (360 reviewed and the cat-317 brachioradialis draft) once the four FPL drafts are reviewed; 53 on the biceps and brachialis", `${MAPPING_VERSION}: ${mappings.length} rows, ${v1Forearm.length} on forearm muscles (${v1Drafts} drafts), ${unchanged.length} carried unchanged, ${v1Outside.length} outside`, MAPPING_VERSION !== "forearm_mappings_v1" || (mappings.length === 418 && unchanged.length === 361 && v1Outside.length === 53 && unchanged.filter((mapping) => mapping.reviewStatus === "reviewed").length === 360));
  const insertClash = plan.inserted.filter((change) => v1Ids.has(change.id)).concat(plan.conditional.filter((change) => v1Ids.has(change.id)));
  const updateMissing = plan.updated.filter((change) => !mappings.some((mapping) => mapping.id === change.id && mapping.reviewStatus === "draft"));
  check("§1.4, §1.7", "Every row v2 inserts is absent from v1; every row it reviews is a v1 draft", MAPPING_VERSION !== "forearm_mappings_v1" ? `the current version is ${MAPPING_VERSION}; checked against v1 only` : `${insertClash.length} inserts already in v1, ${updateMissing.length} updates not a v1 draft`, MAPPING_VERSION !== "forearm_mappings_v1" || (insertClash.length === 0 && updateMissing.length === 0));
  check("§0.2, §1.7", "v2 holds 394 rows without the conditional ones, at most 411", `${v2Rows} rows, at most ${v2Rows + plan.conditional.length}`, v2Rows === 394 && v2Rows + plan.conditional.length === 411);
  const dupes = sources.filter((source) => source.status === "duplicate").map((source) => `${source.id} = ${source.library.map((entry) => `${entry.key} (${entry.by.join(", ")})`).join(", ")}`);
  const sourceProblems = sources.filter((source) => source.library.map((entry) => entry.key).sort().join() !== [...source.design.sameAs].sort().join());
  check("§1.5", "Five package sources are already in the library (A01 = A36, S02 = S2, S06 = M1 and A4, S08 = S3, S12 = S1); the rest are not", dupes.join("; "), sourceProblems.length === 0 && dupes.length === 5);
  const training = sources.filter((source) => source.alsoIn.length).map((source) => source.id);
  check("§1.5", "S13 and S18 are also in trainingEvidence.ts", training.join(", ") || "none", training.join() === "S13,S18");
  const twice = records.filter((record) => record.package.sources.length !== new Set(record.package.sources).size).map((record) => record.id);
  check("§1.9", "fa-45, fa-46 and fa-49 list A02 twice; there is no S01", `listed twice in ${twice.join(", ")}; S01 ${pkg.sources.some((source) => source.id === "S01") ? "present" : "absent"}`, twice.join() === "fa-45,fa-46,fa-49" && !pkg.sources.some((source) => source.id === "S01"));
  const profileSources = new Set(repProfiles.map((profile) => JSON.stringify((profile.packageOwn as { sources?: unknown }).sources)));
  check("§1.9", "All seven rep profiles cite the same five sources", `${repProfiles.length} profiles; ${profileSources.size} distinct source list(s): ${Array.from(profileSources).join(" | ")}`, repProfiles.length === 7 && profileSources.size === 1 && JSON.parse(Array.from(profileSources)[0]).length === 5);
  const carries = pkg.exercises.filter((record) => /carry/i.test(record.name));
  check("§5.1", "A carry gets no rep profile and keeps its whole-exercise prescription, as the package's §10 and §2.2 say", `the package's carry records: ${carries.map((record) => `${record.id} ${record.prescription_profile_id ?? "no profile"} (${record.prescription_application})`).join("; ")}; its §10 names rows, pull-ups, presses, RDLs and mixed movements, and its §2.2 keeps a carry from becoming wrist-curl sets`, carries.every((record) => record.prescription_profile_id === null && record.prescription_application === "retain_existing_whole_exercise_prescription"));
  const repProblems = repProfiles.filter((profile) => !profile.matchesDesign).map((profile) => profile.id);
  check("§5.1", "The design's growth and strength ranges are the package's, family by family", repProblems.length ? `differ: ${repProblems.join(", ")}` : "all seven equal", repProblems.length === 0);
  const nulls = pkg.exercises.every((record) => (record as unknown as Record<string, unknown>).measured_activation_percent === null && (record as unknown as Record<string, unknown>).validated_tendon_risk_percent === null);
  check("§2.3", "measured_activation_percent and validated_tendon_risk_percent are null on every record; tissue_force_newtons on every cell", `${nulls ? "null on all 57" : "not all null"}; tissue_force_newtons ${JSON.stringify(constants.tissue_force_newtons)}`, nulls && constants.tissue_force_newtons === null);

  return {
    report: "Forearm research package v1: import report",
    generatedBy: "npx tsx scripts/specialization/research/forearm-v1/import.ts",
    design: DESIGN,
    rules: [
      "Nothing is imported. The design reconciles the package into the app's catalog (§0.1); forearm_mappings_v2 is written by hand by lane V1 against this report (§1.7). This report is the staging step the package asks for (§1.8 row 1).",
      "Each cell's packageOwn holds the package's own values as received: its grade, index, band and tissue grade are the package's, labelled as such, and are imported nowhere a person or a calculator can read them (§2.3).",
      "Nulls stay null: an unmodeled cell has no reading and is never a zero.",
      "Muscles are read by code through one table checked against the 3D model's identity table; an unknown id is an error, never a name match.",
      "reading is the cell in the app's vocabulary (§2.1) and the category categoryFor gives it on the variant it is read against; app is that variant's row in the forearm's current version (or the row §1.2 plans for a new catalog row).",
    ],
    package: {
      path: rel(pkg.dir),
      modelVersion: pkg.manifest.version,
      researchDate: pkg.manifest.research_date,
      state: pkg.manifest.state,
      productionImportDefault: pkg.manifest.production_import_default,
      files: pkg.files.map((file) => ({ name: file.name, sha256: file.sha256, matchesSha256Sums: file.name === "SHA256SUMS.txt" ? null : file.listed === file.sha256 })),
    },
    app: {
      mappingVersion: MAPPING_VERSION,
      mappingState: MAPPING_STATE,
      mappingRows: mappings.length,
      catalogEndsAt: maxId,
    },
    headline: {
      records: records.length,
      candidates: candidates.length,
      dispositions: dispositionCounts,
      groups: groupCounts,
      cells: importCounts.cells,
      agreementOnExisting: { records: ex.records, cells: ex.cells, ...ex.verdicts, ...ex.details },
      sources: { total: sources.length, duplicate: sources.filter((source) => source.status === "duplicate").length, new: sources.filter((source) => source.status === "new").length },
      designChecks: { total: checks.length, hold: checks.filter((entry) => entry.holds).length, contradicted: checks.filter((entry) => !entry.holds).map((entry) => `${entry.section}: ${entry.claim}`) },
    },
    importCounts,
    muscleMap,
    vocabulary,
    packageCellConstants: constants,
    candidates: candidates.map((candidate) => ({ candidate, records: records.filter((record) => record.candidate === candidate).map((record) => `${record.id} (${record.disposition})`) })),
    agreement,
    families: familyEntries,
    v2Plan: { ...plan, unchanged: unchanged.length, notCarried: v1Outside.map((mapping) => mapping.id) },
    records,
    sources,
    repProfiles,
    designChecks: checks,
  };
}

export type ImportReport = ReturnType<typeof buildImportReport>;

// ---------------------------------------------------------------- JSON, formatted by a fixed rule

/** Pretty JSON, with any array element whose compact form fits in 800 characters on one line (cells, sources, rows). */
export function renderReportJson(report: ImportReport): string {
  const format = (value: unknown, indent: string, inArray: boolean): string => {
    const compact = JSON.stringify(value);
    if (value === null || typeof value !== "object") return compact;
    if (compact.length <= (inArray ? 800 : 120)) return compact;
    const next = `${indent}  `;
    if (Array.isArray(value)) return `[\n${value.map((item) => `${next}${format(item, next, true)}`).join(",\n")}\n${indent}]`;
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined);
    return `{\n${entries.map(([key, item]) => `${next}${JSON.stringify(key)}: ${format(item, next, false)}`).join(",\n")}\n${indent}}`;
  };
  return `${format(report, "", false)}\n`;
}

// ---------------------------------------------------------------- Markdown

const cellText = (value: string) => value.replace(/\|/g, "\\|");
const ownText = (own: CellEntry["packageOwn"]) =>
  own.targeting_grade_0_4 === null
    ? `null · ${own.exposure_bucket}`
    : `${own.targeting_grade_0_4} · ${own.targeting_index_0_100} · [${(own.plausible_grade_band ?? []).join(", ")}] · ${own.exposure_bucket} · ${own.contraction} · ${own.confidence}`;
const readingText = (reading: Reading | null) => (reading ? `${reading.relationship} · ${reading.mode} → ${reading.category}` : "no row");
const appText = (row: AppRow | null) => (row ? `${row.relationship} · ${row.mode} → ${row.category}${row.status === "reviewed" ? "" : ` (${row.status})`}${row.allocation === "shared" ? ", shared" : ""}${row.requiresNoStraps ? ", no straps" : ""}` : "—");

export function renderReportMarkdown(report: ImportReport): string {
  const out: string[] = [];
  const line = (text = "") => out.push(text);
  const table = (head: string[], rows: string[][]) => {
    line(`| ${head.join(" | ")} |`);
    line(`|${head.map(() => "---").join("|")}|`);
    for (const row of rows) line(`| ${row.map(cellText).join(" | ")} |`);
    line();
  };
  const familyById = new Map(report.families.map((family) => [family.id, family]));
  const decisionText = (record: RecordEntry, cell: CellEntry) => {
    const family = cell.family ? familyById.get(cell.family) : undefined;
    if (family) return `${family.label} (${family.section})`;
    if (cell.verdict === "NOT-COMPARED") return `the record is ${record.disposition}`;
    if (cell.verdict === "AGREE") return record.readAgainst.kind === "planned" ? "v2 adds the planned row (§1.2)" : record.readAgainst.kind === "logged-as" ? "no change (the record is deferred)" : "v2 carries ours";
    if (cell.verdict === "OURS-ONLY") return "v2 carries ours";
    return "—";
  };
  const n = (value: number) => value.toLocaleString("en-US");
  const h = report.headline;
  const ic = report.importCounts;

  line(`# ${report.report}`);
  line();
  line(`Generated by \`${report.generatedBy}\` from the package as received (\`${report.package.path}/\`, never edited) and the app's code; \`--check\` exits 1 when this file or \`report.json\` is stale. Do not edit by hand. Every disposition and decision is the design's: \`${report.design}\` (§1.2–§1.5, §2). This report is lane R0 (§8.2).`);
  line();
  for (const rule of report.rules) line(`- ${rule}`);
  line();

  line("## Headline");
  line();
  line(`- **Records:** ${h.records} from ${h.candidates} original candidates. ${h.groups.existing} existing (${h.dispositions.existing} the same task, ${h.dispositions["set-up not recorded"]} set-up not recorded, ${h.dispositions.alias} alias), ${h.groups["new row"]} new rows, ${h.groups.referred} referred, ${h.groups.deferred} deferred, ${h.groups.blocked} blocked.`);
  line(`- **Cells:** ${n(h.cells.total)} (${h.records} × 19): ${h.cells.mappedByThePackage} mapped by the package, ${h.cells.unmodeled} null/unmodeled, kept null.`);
  const a = h.agreementOnExisting as Record<string, number>;
  line(`- **Against ${report.app.mappingVersion}** on the ${a.records} existing records, the alias left out (${a.cells} cells): AGREE ${a.AGREE}, DISAGREE ${a.DISAGREE} (same category ${a["disagree:same-category"] ?? 0}, different category ${a["disagree:different-category"] ?? 0}, against our draft ${a["disagree:ours-draft"] ?? 0}), PACKAGE-ONLY ${a["PACKAGE-ONLY"]}, OURS-ONLY ${a["OURS-ONLY"]}, NEITHER ${a.NEITHER}.`);
  line(`- **forearm_mappings_v2, from the design (nothing written):** inserted ${ic.mappingRows.inserted.count} (${ic.mappingRows.inserted.onExistingVariants} on existing variants, ${ic.mappingRows.inserted.onNewRows} on the new rows), up to ${ic.mappingRows.insertedConditional.atMost} more if their sources pass; updated ${ic.mappingRows.updated.count} (if Hamrick 1998 is confirmed); unchanged ${ic.mappingRows.skippedUnchanged.count}; not carried ${ic.mappingRows.notCarried.count}; ${ic.mappingRows.total.withoutConditional} rows, at most ${ic.mappingRows.total.atMost}.`);
  line(`- **Sources:** ${h.sources.total} in the package; ${h.sources.duplicate} already in the library under another key, ${h.sources.new} new.`);
  line(`- **Design checks:** ${h.designChecks.hold} of ${h.designChecks.total} hold.${h.designChecks.contradicted.length ? ` Contradicted by the data: ${h.designChecks.contradicted.join("; ")}.` : ""}`);
  line();

  line("## Counts in the package's §7.2 sense");
  line();
  line(ic.basis);
  line();
  table(["Level", "Inserted", "Updated", "Skipped", "Blocked"], [
    ["Catalog rows (wave A's seed)", `${ic.catalogRows.inserted.count}: ${ic.catalogRows.inserted.rows.join("; ")}`, `${ic.catalogRows.updated.count}`, `${ic.catalogRows.skipped.count}: ${ic.catalogRows.skipped.existing} existing (already in the catalog), ${ic.catalogRows.skipped.referred} referred, ${ic.catalogRows.skipped.deferred} deferred`, `${ic.catalogRows.blocked.count}: ${ic.catalogRows.blocked.records.join(", ")}`],
    ["Mapping rows (forearm_mappings_v2 against v1)", `${ic.mappingRows.inserted.count} (${ic.mappingRows.inserted.onExistingVariants} on existing variants, ${ic.mappingRows.inserted.onNewRows} on 417–419); up to ${ic.mappingRows.insertedConditional.atMost} more, conditional (${ic.mappingRows.insertedConditional.wristFlexors} wrist-flexor, ${ic.mappingRows.insertedConditional.pronatorQuadratus} pronator quadratus)`, `${ic.mappingRows.updated.count}, conditional: ${ic.mappingRows.updated.condition}`, `${ic.mappingRows.skippedUnchanged.count} carried unchanged; ${ic.mappingRows.notCarried.count} not carried (${ic.mappingRows.notCarried.note})`, `${ic.mappingRows.blocked.count} (${ic.mappingRows.blocked.note})`],
  ]);
  line(`v2 totals: ${ic.mappingRows.total.withoutConditional} rows without the conditional ones, at most ${ic.mappingRows.total.atMost}. Cells by record group: ${Object.entries(ic.cells.byGroup).map(([group, count]) => `${group} ${count}`).join(", ")}.`);
  line();

  line("## Package integrity");
  line();
  line(`${report.package.modelVersion}, research date ${report.package.researchDate}, state \`${report.package.state}\`, production_import_default ${JSON.stringify(report.package.productionImportDefault)}.`);
  line();
  table(["File", "SHA-256", "Matches SHA256SUMS.txt"], report.package.files.map((file) => [file.name, `\`${file.sha256}\``, file.matchesSha256Sums === null ? "(the list itself)" : file.matchesSha256Sums ? "yes" : "**no**"]));

  line("## Muscles, by code");
  line();
  line("One explicit table (`muscleNodeByCode` in the adapter), checked row for row against the 3D model's identity table (`client/src/components/specialization/anatomy3d/modelIdentity.ts`). The anconeus is outside the package's 19 and stays the app's adjacent, unmapped muscle.");
  line();
  table(["Code", "Package id", "Name", "App node", "3D identity table"], report.muscleMap.map((row) => [row.code, `\`${row.packageId}\``, row.displayName, `\`${row.nodeId}\``, row.modelIdentity === row.nodeId ? "same" : `**${row.modelIdentity}**`]));

  line("## Vocabulary (§2.1), as applied");
  line();
  const bucketCount = (bucket: string) => report.records.reduce((sum, record) => sum + record.cells.filter((cell) => cell.packageOwn.exposure_bucket === bucket).length, 0);
  table(["Package bucket", "Contraction", "App relationship · mode", "Category, and how it is read", "Cells"], report.vocabulary.map((entry) => [entry.bucket, entry.contraction, entry.relationship ? `${entry.relationship} · ${entry.mode}` : "no row", entry.note, `${bucketCount(entry.bucket)}`]));
  line(`Constant on every cell, listed once: ${Object.entries(report.packageCellConstants).map(([key, value]) => `\`${key}\` = ${JSON.stringify(value)}`).join("; ")}. The package's tissue grade equals its targeting grade on every cell (Design checks), so the cell tables below show the targeting grade only; \`report.json\` keeps both.`);
  line();

  line("## Every record");
  line();
  line("Verdicts count the record's 19 cells. NOT-COMPARED: the record has no row to read against (referred, deferred without a row, blocked).");
  line();
  table(["Record", "Cand.", "Name", "Package status", "Disposition", "Catalog row(s)", "Read against", "AGREE", "DISAGREE", "PKG-ONLY", "OURS-ONLY", "NEITHER", "NOT-COMPARED"], report.records.map((record) => [
    record.id,
    `${record.candidate}`,
    record.name,
    record.packageStatus + (record.aliasOf ? ` of ${record.aliasOf}` : ""),
    record.disposition,
    record.catalogRows.map((row) => `${row.id} ${row.name}${row.inCatalog ? "" : " (planned)"}`).join("; ") || "—",
    record.readAgainst.kind === "none" ? "—" : `${record.readAgainst.variants.join(", ")} (${record.readAgainst.kind})`,
    `${record.tally.AGREE}`, `${record.tally.DISAGREE}`, `${record.tally["PACKAGE-ONLY"]}`, `${record.tally["OURS-ONLY"]}`, `${record.tally.NEITHER}`, `${record.tally["NOT-COMPARED"]}`,
  ]));
  line("All 50 original candidates, each traceable:");
  line();
  line(report.candidates.map((entry) => `${entry.candidate}: ${entry.records.join(", ")}`).join(" · "));
  line();

  line("## Decisions on disagreements and package-only cells");
  line();
  line("One family per decision of §1.3–§1.4. Cells are `record:muscle → variant`; the alias's cells repeat fa-12's and are left out here.");
  line();
  table(["Family", "Decision", "v2", "Cells"], report.families.filter((family) => family.cells.length || family.id !== "undecided").map((family) => [`${family.label} (${family.section})`, family.decision, family.v2, family.cells.length ? `${family.cells.length}: ${family.cells.join(", ")}` : "none in the package's records"]));
  line(`Agreement by group: ${Object.values(report.agreement).map((group) => `${group.label}: ${group.records} records, ${group.cells} cells, ${VERDICTS.filter((verdict) => group.verdicts[verdict]).map((verdict) => `${verdict} ${group.verdicts[verdict]}`).join(", ")}`).join(". ")}.`);
  line();

  line("## forearm_mappings_v2, row by row (from the design; nothing written)");
  line();
  table(["Row", "Change", "Family", "Condition", "Package cells asking for it"], [...report.v2Plan.updated, ...report.v2Plan.inserted, ...report.v2Plan.conditional].map((change) => [`\`${change.id}\``, report.v2Plan.conditional.includes(change) ? "insert, conditional" : change.change, familyById.get(change.family)?.label ?? change.family, change.condition ?? "—", change.packageCells.join(", ") || "none (the design extends the family to this row)"]));
  line(`Carried unchanged: ${report.v2Plan.unchanged} rows. Not carried (rule 12): ${report.v2Plan.notCarried.length} rows on the upper arm's muscles.`);
  line();

  line("## Cells, record by record");
  line();
  line("Package's own: grade · index · band · bucket · contraction · confidence, as received and labelled (not imported). Read as: the app's relationship · mode → category on the variant read against. App row: that variant's row (`planned` for a new row's design, not yet in code).");
  line();
  for (const record of report.records) {
    line(`### ${record.id} · candidate ${record.candidate} · ${record.name}`);
    line();
    const rows = record.catalogRows.map((row) => `${row.id} ${row.name}${row.inCatalog ? "" : " (planned)"}`).join("; ") || "no catalog row";
    const against = record.readAgainst.kind === "none" ? `not read against any row; categories read ${record.readingDeliberateHold ? "on a deliberate hold" : "on a set that is not a deliberate hold"}, as the package describes the set-up` : `read against ${record.readAgainst.version} \`${record.readAgainst.variants.join("`, `")}\`${record.readAgainst.alike === null ? "" : record.readAgainst.alike ? " (mapped alike)" : " (**not mapped alike**)"}, ${record.readAgainst.deliberateHold ? "a deliberate hold" : "not a deliberate hold"}`;
    line(`Package status \`${record.packageStatus}\`${record.aliasOf ? ` (alias of ${record.aliasOf}, resolving to ${record.canonical})` : ""} · **${record.disposition}** · ${rows} · ${against}. ${record.note}`);
    line();
    line(`Package: profile \`${record.package.profile}\`, prescription \`${record.package.prescriptionProfile}\` (${record.package.prescriptionApplication}); sources ${record.package.sources.join(", ")}${record.package.contextFlags.length ? `; flags ${record.package.contextFlags.join(", ")}` : ""}. Set-up: ${record.package.setup}`);
    line();
    const shown = record.cells.filter((cell) => cell.reading !== null || cell.app !== null);
    if (shown.length) {
      table(["Muscle", "Package's own", "Read as", "App row", "Verdict", "Decision"], shown.map((cell) => [
        cell.code,
        ownText(cell.packageOwn),
        readingText(cell.reading),
        appText(cell.app),
        cell.verdict + (cell.detail && cell.detail !== "same" ? ` (${cell.detail})` : ""),
        decisionText(record, cell),
      ]));
    }
    const rest = record.cells.filter((cell) => cell.reading === null && cell.app === null).map((cell) => cell.code);
    if (rest.length) {
      line(`${record.readAgainst.kind === "none" ? "Package null · unmodeled (kept null)" : "Neither maps (package null · unmodeled, no app row)"}: ${rest.join(", ")}.`);
      line();
    }
    if (record.appRowsOutsideThe19.length) {
      line(`Also on the variant, outside the package's 19 (the package lists ${record.package.externalContributors.join(", ") || "none"} as external contributors): ${record.appRowsOutsideThe19.map((row) => `\`${row.id}\` ${row.relationship} · ${row.mode}`).join("; ")}. Not carried into v2 (rule 12).`);
      line();
    }
  }

  line("## Sources");
  line();
  line("Each package source against the app's library (`shared/specialization/sources/`), by PubMed id, DOI and URL. The package's keys look like the app's and mean other papers (its S03 is not the app's S3), so no package key is used (§1.5).");
  line();
  table(["Package", "Title", "PMID", "Library", "Design (§1.5)", "Used for"], report.sources.map((source) => [
    source.id,
    source.title,
    source.pmid ?? "—",
    source.status === "duplicate" ? `duplicate of ${source.library.map((entry) => `${entry.key} (${entry.by.join(", ")})`).join(", ")}` : `new${source.alsoIn.length ? `; also in ${source.alsoIn.join(", ")}` : ""}`,
    source.design.plannedKey ? `\`${source.design.plannedKey}\`; ${source.design.confirmed}` : source.design.confirmed,
    source.design.usedFor,
  ]));

  line("## Rep profiles (the package's practical defaults)");
  line();
  line("As received, labelled as the package's: \"practical_starting_range_not_muscle_specific_optimum\". The design holds them as region data per task family (§5.1, lane S2), never per muscle; nothing here is written into app code.");
  line();
  table(["Profile", "Design family (§5.1)", "Growth practice", "Strength practice", "Sources", "Same as §5.1", "Records"], report.repProfiles.map((profile) => {
    const own = profile.packageOwn as Record<string, unknown>;
    const range = (value: unknown, unit: string) => (Array.isArray(value) ? `${value.join("–")} ${unit}` : "none");
    const seconds = own.hypertrophy_hold_seconds !== undefined;
    return [profile.id, profile.designFamily ?? "—", range(seconds ? own.hypertrophy_hold_seconds : own.hypertrophy_reps, seconds ? "s" : "reps"), range(seconds ? own.strength_practice_hold_seconds : own.strength_practice_reps, seconds ? "s" : "reps"), Array.isArray(own.sources) ? own.sources.join(", ") : "—", profile.matchesDesign ? "yes" : "**no**", profile.records.join(", ") || "—"];
  }));

  line("## Design checks");
  line();
  line("What the design states about the package and the app, recomputed from the data.");
  line();
  table(["§", "The design says", "Found", "Holds"], report.designChecks.map((entry) => [entry.section, entry.claim, entry.found, entry.holds ? "yes" : "**no**"]));
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

// ---------------------------------------------------------------- command line

export function renderReport(report: ImportReport = buildImportReport()): { json: string; markdown: string } {
  return { json: renderReportJson(report), markdown: renderReportMarkdown(report) };
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  if (REPORT_DIR === PACKAGE_DIR || REPORT_DIR.startsWith(`${PACKAGE_DIR}/`)) throw new Error("The report is never written into the package's folder");
  const { json, markdown } = renderReport();
  if (process.argv.includes("--check")) {
    const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");
    const stale = [[REPORT_JSON_PATH, json], [REPORT_MD_PATH, markdown]].filter(([path, text]) => read(path) !== text).map(([path]) => rel(path));
    if (stale.length) {
      console.error(`${stale.join(" and ")} ${stale.length > 1 ? "are" : "is"} stale: run npx tsx scripts/specialization/research/forearm-v1/import.ts`);
      process.exit(1);
    }
    console.log("Import report is current.");
  } else {
    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(REPORT_JSON_PATH, json);
    writeFileSync(REPORT_MD_PATH, markdown);
    console.log(`Wrote ${rel(REPORT_JSON_PATH)} (${json.length} characters) and ${rel(REPORT_MD_PATH)} (${markdown.length} characters).`);
  }
}
