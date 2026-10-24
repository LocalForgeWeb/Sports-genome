/**
 * The import report for the owner's forearm research package (lane R0,
 * docs/specialization-atlas/11-forearm-research-and-stack.md §7.3 "All 50 candidates traceable;
 * 57 records with 19 cells; alias and blocked"): the adapter in
 * scripts/specialization/research/forearm-v1/import.ts reads the package as received and the
 * committed report must be exactly its output. The package's grades, indices and bands live only
 * in that report; this file also holds the product to never naming them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { forearmModelSourceToCanonical } from "@/components/specialization/anatomy3d/modelIdentity";
import { coreForearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import {
  buildImportReport,
  designRecords,
  muscleNodeByCode,
  PACKAGE_DIR,
  readPackage,
  renderReport,
  REPORT_DIR,
  REPORT_JSON_PATH,
  REPORT_MD_PATH,
  type ForearmResearchPackage,
} from "../../../../scripts/specialization/research/forearm-v1/import";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../..");
const thisFile = fileURLToPath(import.meta.url);

const pkg = readPackage();
const report = buildImportReport(pkg);
const clone = (value: ForearmResearchPackage): ForearmResearchPackage => ({ ...value, exercises: JSON.parse(JSON.stringify(value.exercises)), muscles: JSON.parse(JSON.stringify(value.muscles)) });

describe("forearm research import: the package as received", () => {
  it("reads the package's own folder and writes only beside it", () => {
    expect(relative(repoRoot, PACKAGE_DIR)).toBe("docs/specialization-atlas/forearm-research-v1");
    expect(relative(repoRoot, REPORT_DIR)).toBe("docs/specialization-atlas/forearm-research-v1-import");
    // The package is never edited: every file SHA256SUMS.txt lists still has its listed hash, and nothing else is there.
    const listed = pkg.files.filter((file) => file.name !== "SHA256SUMS.txt");
    expect(listed).toHaveLength(13);
    for (const file of listed) expect(file.sha256, file.name).toBe(file.listed);
  });

  it("traces all 57 records and all 50 original candidates, each record with one of the design's dispositions", () => {
    expect(report.records.map((record) => record.id)).toEqual(pkg.exercises.map((record) => record.id));
    expect(report.records).toHaveLength(57);
    expect(Object.keys(designRecords).sort()).toEqual(pkg.exercises.map((record) => record.id).sort());
    const candidates = report.candidates.map((entry) => entry.candidate);
    expect(candidates).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
    for (const entry of report.candidates) expect(entry.records.length, `candidate ${entry.candidate}`).toBeGreaterThan(0);
    for (const record of report.records) {
      const source = pkg.exercises.find((entry) => entry.id === record.id);
      expect(record.candidate).toBe(source?.original_candidate_number);
      expect(record.packageStatus).toBe(source?.publication_status);
      expect(["existing", "set-up not recorded", "alias", "new row", "referred", "deferred", "blocked"]).toContain(record.disposition);
    }
    // §1.2's totals: 28 existing (18 the same task, 9 set-up not recorded, the alias), 3 new rows, 4 referred, 16 deferred, 6 blocked.
    expect(report.headline.dispositions).toEqual({ "set-up not recorded": 9, "new row": 3, existing: 18, blocked: 6, alias: 1, referred: 4, deferred: 16 });
    expect(report.headline.groups).toEqual({ existing: 28, "new row": 3, blocked: 6, referred: 4, deferred: 16 });
  });

  it("keeps all 1,083 cells, 19 per record, with the package's values and nulls exactly as received", () => {
    const cells = report.records.flatMap((record) => record.cells);
    expect(cells).toHaveLength(1083);
    for (const record of report.records) {
      const source = pkg.exercises.find((entry) => entry.id === record.id);
      expect(record.cells.map((cell) => cell.node)).toEqual(report.muscleMap.map((row) => row.nodeId));
      for (const cell of record.cells) {
        const packageId = report.muscleMap.find((row) => row.nodeId === cell.node)?.packageId;
        const raw = source?.mappings.find((entry) => entry.muscle_id === packageId);
        expect(raw, `${record.id} ${cell.code}`).toBeDefined();
        const own = cell.packageOwn as Record<string, unknown>;
        for (const [key, value] of Object.entries(own)) expect(value, `${record.id} ${cell.code} ${key}`).toEqual((raw as unknown as Record<string, unknown>)[key]);
        // An unmodeled cell is read as no row, never as a zero.
        if (raw?.exposure_bucket === "unmodeled") {
          expect(cell.reading).toBeNull();
          expect(Object.entries(own).filter(([key]) => key !== "exposure_bucket" && key !== "contraction" && key !== "confidence").every(([, value]) => value === null)).toBe(true);
        } else expect(cell.reading).not.toBeNull();
      }
    }
    expect(cells.filter((cell) => cell.reading === null)).toHaveLength(690);
    expect(cells.filter((cell) => cell.reading !== null)).toHaveLength(393);
    // The three fields every cell carries with one value are listed once, nulls kept.
    expect(report.packageCellConstants).toEqual({ band_type: "editorial_sensitivity_band_not_statistical_CI", evidence_basis: "heuristic_anatomical_mapping_not_measured_percentage", tissue_force_newtons: null });
  });

  it("resolves the alias fa-22 to fa-12 and its row 411, with no second row or dose, and refuses a cycle", () => {
    const alias = report.records.find((record) => record.id === "fa-22");
    expect(alias).toMatchObject({ disposition: "alias", aliasOf: "fa-12", canonical: "fa-12", group: "existing" });
    expect(alias?.readAgainst.variants).toEqual(["cat-411"]);
    expect(report.records.find((record) => record.id === "fa-12")?.readAgainst.variants).toEqual(["cat-411"]);
    for (const record of report.records) if (record.id !== "fa-22") expect(record.canonical, record.id).toBe(record.id);
    // The alias adds nothing to the v2 plan and is left out of the agreement counts and the family lists.
    const planned = [...report.v2Plan.updated, ...report.v2Plan.inserted, ...report.v2Plan.conditional];
    expect(planned.flatMap((change) => change.packageCells).some((cell) => cell.startsWith("fa-22:"))).toBe(false);
    expect(report.families.flatMap((family) => family.cells).some((cell) => cell.startsWith("fa-22:"))).toBe(false);
    expect(report.agreement.existing.records).toBe(27);

    const cyclic = clone(pkg);
    const target = cyclic.exercises.find((record) => record.id === "fa-12");
    if (target) target.canonical_alias_of = "fa-22";
    expect(() => buildImportReport(cyclic)).toThrow(/Alias cycle/);
  });

  it("keeps the six blocked candidates (7, 10, 13, 27, 39, 40) blocked, with no mapped cell and no row", () => {
    const blocked = report.records.filter((record) => record.disposition === "blocked");
    expect(blocked.map((record) => record.candidate).sort((a, b) => a - b)).toEqual([7, 10, 13, 27, 39, 40]);
    expect(pkg.manifest.blocked_original_candidates).toEqual([7, 10, 13, 27, 39, 40]);
    for (const record of blocked) {
      expect(record.packageStatus).toBe("blocked_protocol");
      expect(record.readAgainst.kind).toBe("none");
      expect(record.cells.every((cell) => cell.reading === null && cell.app === null && cell.verdict === "NOT-COMPARED")).toBe(true);
    }
    expect(report.importCounts.catalogRows.blocked.count).toBe(6);
    expect(report.importCounts.mappingRows.blocked.count).toBe(0);
  });

  it("maps the 19 muscles one to one onto the forearm's node ids, by code, as the 3D identity table does", () => {
    expect(report.muscleMap).toHaveLength(19);
    expect(new Set(report.muscleMap.map((row) => row.nodeId))).toEqual(new Set(coreForearmMuscleIds));
    expect(new Set(report.muscleMap.map((row) => row.code)).size).toBe(19);
    expect(report.muscleMap.map((row) => row.code).sort()).toEqual(Object.keys(muscleNodeByCode).sort());
    for (const row of report.muscleMap) {
      expect(muscleNodeByCode[row.code]).toEqual({ packageId: row.packageId, nodeId: row.nodeId });
      expect((forearmModelSourceToCanonical as Record<string, string>)[row.packageId], row.packageId).toBe(row.nodeId);
    }
    // An unknown id is an error, never a name match.
    const renamed = clone(pkg);
    renamed.exercises[0].mappings[0].muscle_id = "brachio-radialis";
    expect(() => buildImportReport(renamed)).toThrow(/unknown muscle id/);
    const recoded = clone(pkg);
    recoded.muscles[0].code = "BRR";
    expect(() => buildImportReport(recoded)).toThrow(/unknown muscle code/);
  });

  it("decides every disagreement and package-only cell, and counts v2 as the design does", () => {
    for (const record of report.records) for (const cell of record.cells) {
      if (cell.verdict === "DISAGREE" || cell.verdict === "PACKAGE-ONLY") expect(cell.family, `${record.id} ${cell.code}`).not.toBe("undecided");
      if (cell.verdict === "DISAGREE" || cell.verdict === "PACKAGE-ONLY") expect(cell.family, `${record.id} ${cell.code}`).not.toBeNull();
    }
    expect(report.headline.agreementOnExisting["OURS-ONLY"]).toBe(0);
    const rows = report.importCounts.mappingRows;
    expect([rows.inserted.count, rows.insertedConditional.atMost, rows.updated.count, rows.skippedUnchanged.count, rows.notCarried.count]).toEqual([29, 17, 4, 361, 53]);
    expect(rows.total).toEqual({ withoutConditional: 394, atMost: 411 });
    expect(report.importCounts.catalogRows.inserted.count).toBe(3);
    expect(report.importCounts.catalogRows.skipped.count).toBe(48);
  });

  it("reads the package against forearm_mappings_v1, and gives F3's final matrix from the code's v2 (§7.3)", () => {
    expect([report.app.mappingVersion, report.app.mappingRows, report.app.currentMappingVersion, report.app.catalogEndsAt]).toEqual(["forearm_mappings_v1", 418, "forearm_mappings_v2", 420]);
    const final = report.finalMatrix;
    expect([final.version, final.state, final.publishedAt, final.rows, final.reviewed, final.draft, final.carriedUnchanged, final.notCarried]).toEqual(["forearm_mappings_v2", "published", "2026-10-24", 421, 420, 1, 361, 53]);
    // Every planned row is in v2, reviewed: Hamrick confirmed, both conditional families adopted.
    expect(final.planned.filter((change) => change.inV2 !== "reviewed")).toEqual([]);
    expect(final.planned).toHaveLength(4 + 29 + 17);
    expect(final.secondSources.map((entry) => `${entry.id} ${entry.added.join()}`).sort()).toEqual([
      "cat-405:forearm.pq pmid.14656682", "cat-405:forearm.pt pmid.14656682", "cat-407:forearm.ecrb pmid.32636008", "cat-407:forearm.ecrl pmid.32636008", "cat-408:forearm.ecu pmid.32636008", "cat-408:forearm.fcu pmid.32636008",
    ]);
    expect(final.beyondPlan.map((entry) => entry.id).sort()).toEqual(["cat-318:forearm.br", "cat-326:forearm.br", "cat-329:forearm.br", "cat-330:forearm.br", "cat-333:forearm.br", "cat-420:forearm.ed", "cat-420:forearm.edm", "cat-420:forearm.ei", "cat-87:forearm.br", "cat-88:forearm.br"]);
    expect(report.designChecks.filter((check) => check.section.includes("F3")).every((check) => check.holds)).toBe(true);
  });

  it("is exactly the committed report (npx tsx scripts/specialization/research/forearm-v1/import.ts --check)", () => {
    const { json, markdown } = renderReport(report);
    expect(readFileSync(REPORT_JSON_PATH, "utf8") === json, "report.json is stale: run npx tsx scripts/specialization/research/forearm-v1/import.ts").toBe(true);
    expect(readFileSync(REPORT_MD_PATH, "utf8") === markdown, "report.md is stale: run npx tsx scripts/specialization/research/forearm-v1/import.ts").toBe(true);
    // Idempotent: a second build from the same files gives the same bytes.
    expect(renderReport(buildImportReport(readPackage())).json === json).toBe(true);
  });
});

describe("forearm research import: the package's numbers never reach the product", () => {
  const banned = ["targeting_grade", "targeting_index", "plausible_grade_band"];
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = resolve(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  it("no file under shared/ or client/src, other than this test, names a grade, index or band field", () => {
    const files = [...walk(resolve(repoRoot, "shared")), ...walk(resolve(repoRoot, "client/src"))].filter((path) => path !== thisFile);
    expect(files.length).toBeGreaterThan(100);
    const offenders = files.flatMap((path) => {
      const text = readFileSync(path, "utf8");
      return banned.filter((word) => text.includes(word)).map((word) => `${relative(repoRoot, path)}: ${word}`);
    });
    expect(offenders).toEqual([]);
  });
});
