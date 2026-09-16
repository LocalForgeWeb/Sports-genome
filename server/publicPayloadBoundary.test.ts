import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { opaqueDigest, toPublicReferenceRow, type RegistryRow } from "./normsRegistry";

const routers = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
const sharedRow = readFileSync(join(process.cwd(), "shared/normsReference.ts"), "utf8");

/** A row as the registry holds it, internals and all. */
function registryRow(overrides: Partial<RegistryRow> = {}): RegistryRow {
  return {
    referenceKey: opaqueDigest("gate-1"),
    tableGroup: opaqueDigest("strength_norms"),
    exerciseId: "exercise-1",
    exerciseName: "Back Squat",
    localCatalogIds: [101],
    measurementType: "direct_relative_1rm_by_age_sex",
    unit: "x_bodyweight",
    sex: "male",
    ageMin: 18,
    ageMax: 35,
    bodyweightMinKg: null,
    bodyweightMaxKg: null,
    trainingStatus: "strength-trained competitive",
    equipment: null,
    protocol: "Competition 1RM/bodyweight percentile.",
    competitionConditions: "powerlifting; drug-tested unequipped competition",
    populationDefinition: "powerlifting; strength-trained competitive",
    percentile: 50,
    value: 2.28,
    sampleSize: 103984,
    sourceText: "van den Hoek et al. 2024",
    sourceStudyId: "study-1",
    sourceUrl: "https://example.org/study-1",
    sourceRecordId: "norm-1",
    sourceTable: "strength_norms",
    referenceFamily: "strength_norm",
    normalizationMethod: "direct_relative_1rm_by_age_sex",
    reviewerNote: "Metadata/test-catalog display only; no benchmark or scoring approval.",
    ...overrides,
  };
}

/**
 * `strengthGenome.referenceRows` is a public, unauthenticated query: every field it
 * returns is readable by anyone who loads the app. It was serving the registry's own
 * bookkeeping - primary keys, table names, the internal taxonomy - and, in
 * `blocking_reason`, notes the reviewers wrote to each other, none of which any
 * component renders.
 */
describe("the public reference payload carries no registry internals", () => {
  const internalKeys = ["sourceRecordId", "sourceTable", "referenceFamily", "normalizationMethod", "reviewerNote"];

  it("drops every internal column", () => {
    const published = toPublicReferenceRow(registryRow()) as Record<string, unknown>;
    for (const key of internalKeys) {
      expect(published, `${key} must not be published`).not.toHaveProperty(key);
    }
  });

  it("does not leak a reviewer note anywhere in the serialized row", () => {
    const note = "Existing Piper 2021 Preacher Curl route preserved; usable by strength_beta_v1 source policy.";
    const serialized = JSON.stringify(toPublicReferenceRow(registryRow({ reviewerNote: note })));
    expect(serialized).not.toContain("route preserved");
    expect(serialized).not.toContain("strength_beta_v1");
  });

  it("does not name a database table on the wire", () => {
    const serialized = JSON.stringify(toPublicReferenceRow(registryRow()));
    expect(serialized).not.toContain("strength_norms");
    expect(serialized).not.toContain("performance_norms");
    expect(serialized).not.toContain("app_reference_eligibility");
  });

  it("does not publish a row's database primary key", () => {
    const published = toPublicReferenceRow(registryRow({ referenceKey: opaqueDigest("gate-1") }));
    expect(published.referenceKey).not.toBe("gate-1");
    expect(published.referenceKey).not.toBe("norm-1");
  });

  it("keeps everything the device needs to match and cite", () => {
    const published = toPublicReferenceRow(registryRow());
    for (const key of [
      "exerciseName", "localCatalogIds", "measurementType", "unit", "sex", "ageMin", "ageMax",
      "bodyweightMinKg", "bodyweightMaxKg", "trainingStatus", "competitionConditions",
      "percentile", "value", "sampleSize", "sourceUrl", "tableGroup", "referenceKey",
    ]) {
      expect(published, `${key} is needed on the device`).toHaveProperty(key);
    }
  });

  it("is what the public procedure actually serves", () => {
    // Types do not strip fields at runtime, so the router has to call the projection.
    expect(routers).toContain("referenceRows: publicProcedure.query(() => getPublicNormsReference())");
    expect(routers).not.toContain("referenceRows: publicProcedure.query(() => getApprovedNormsReference())");
  });

  it("keeps the internal columns off the shared type, so they cannot drift back", () => {
    for (const key of internalKeys) {
      expect(sharedRow, `${key} must not be on NormsReferenceRow`).not.toMatch(
        new RegExp(`^\\s*${key}:`, "m")
      );
    }
  });
});

/**
 * Grouping and memo keys need their inputs distinct, never readable. The digest is
 * what lets a table name keep doing that job without travelling to the browser.
 */
describe("opaqueDigest", () => {
  it("is stable across calls, so a memo key does not thrash", () => {
    expect(opaqueDigest("strength_norms")).toBe(opaqueDigest("strength_norms"));
  });

  it("separates the two published tables, which must never pool", () => {
    expect(opaqueDigest("strength_norms")).not.toBe(opaqueDigest("performance_norms"));
  });

  it("does not echo its input", () => {
    expect(opaqueDigest("strength_norms")).not.toContain("strength");
    expect(opaqueDigest("app_reference_eligibility")).not.toContain("app");
  });

  it("is short, since it only has to be distinct", () => {
    expect(opaqueDigest("a-very-long-primary-key-value-from-the-registry").length).toBeLessThanOrEqual(8);
  });

  it("handles an empty string without collapsing to nothing", () => {
    expect(opaqueDigest("").length).toBeGreaterThan(0);
  });
});

describe("the public registry status says nothing about the schema", () => {
  const resolution = readFileSync(join(process.cwd(), "server/normsResolution.ts"), "utf8");

  it("no longer publishes the internal taxonomy", () => {
    // referenceFamilies served ["strength_norm", "performance_test_catalog"] and
    // nothing consumed it.
    expect(resolution).not.toContain("referenceFamilies");
  });

  it("still reports what an operator needs", () => {
    const status = resolution.slice(resolution.indexOf("export async function getNormsRegistryStatus"));
    for (const field of ["available", "approvedCutPointCount", "exerciseNames", "connection"]) {
      expect(status).toContain(field);
    }
  });
});
