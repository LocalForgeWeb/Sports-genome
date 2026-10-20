import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { specializationLoggingRegions } from "@shared/specialization/loggingRegions";
import { specializationRegions } from "@shared/specialization/registry";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";

/**
 * The workout logger reads the atlas through a light twin of the registry: each region's
 * variants and mappings, without the drawing, the anatomy, the claims or the sources. Opening
 * the workout logger then downloads only what it asks about (brief §11 "Review bundle/asset
 * sizes"). These checks keep the twin in step with the registry and keep it light.
 */
describe("the logger's region list", () => {
  it("holds every production region of the registry, with the very same variants and mappings", () => {
    expect(specializationLoggingRegions.map((data) => data.region.id)).toEqual(specializationRegions.map((data) => data.region.id));
    specializationRegions.forEach((full, index) => {
      const light = specializationLoggingRegions[index];
      expect(light.region).toBe(full.region);
      expect(light.variants).toBe(full.variants);
      expect(light.mappings).toBe(full.mappings);
    });
  });

  it("gives the policy the production data: a one-arm wrist curl, a hang in seconds", () => {
    // One-Arm Dumbbell Wrist Curl (catalog 410) and Dead Hang (143), from the forearm region.
    expect(loggingPolicyFor(410)).toMatchObject({ measure: "reps", askSide: false, oneArm: false, sideDefault: null });
    expect(loggingPolicyFor(143)).toMatchObject({ measure: "seconds", askSide: false, oneArm: false });
  });

  it("imports nothing that carries the drawing, the anatomy, the claims or the sources", () => {
    const heavy = /registry|regions\/forearm["/]?(index)?["]|\.\/index"|diagram|claims|sources|nodes|nodeActions|actions"/;
    for (const file of ["shared/specialization/loggingPolicy.ts", "shared/specialization/loggingRegions.ts", "shared/specialization/regions/forearm/logging.ts"]) {
      const imports = readFileSync(join(process.cwd(), file), "utf8").split("\n").filter((line) => /^\s*import\b/.test(line) && !/^\s*import type\b/.test(line));
      expect(imports.filter((line) => heavy.test(line)), file).toEqual([]);
    }
  });
});
