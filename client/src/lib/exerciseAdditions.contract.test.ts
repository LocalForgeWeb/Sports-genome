import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { muscleLabels } from "@/components/AnatomyMap";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { zercherNeckBenchExercises } from "@/lib/exerciseCatalogZercherNeckBench";
import { catalogEquipment } from "@/lib/equipmentProfile";
import { catalogAliasesOf, existingRowAliases, exerciseExecutionById, isProvisionalCatalogId, roleMuscleKey, sourceKindLabel, type LoadConvention } from "@/lib/exerciseExecution";

/**
 * The data contract of the Zercher, neck and bench handoff (23 Oct 2026; §7 "Automated verification"):
 * every proposed key resolves to exactly one current exercise, the reused rows are the rows they
 * say, and every new row carries what the engines and the detail read - fields, equipment, muscle
 * keys, five sports, sources, a load convention, roles, a measure.
 */

type Resolution = { catalogMaxBefore: number; rows: { key: string; catalogId: number; decision: "new" | "reuse"; name: string; aliases: string[] }[]; reused: { catalogId: number; name: string; action: string }[] };
const resolution: Resolution = JSON.parse(readFileSync(resolve(process.cwd(), "docs/exercise-additions/exercise-addition-resolution.json"), "utf8"));
const byId = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const newIds = zercherNeckBenchExercises.map((exercise) => exercise.id);
const LOAD_CONVENTIONS: LoadConvention[] = ["total_bar_mass", "machine_display", "plates_per_arm", "smith_declared", "suspended_external_mass", "manual_unmeasured"];
const NECK_GROUPS = ["neck.flexors", "neck.extensors", "neck.lateral_flexors", "neck.rotators"];
/** The muscle keys the catalog used before these rows, and the one key they add. */
const knownKeys = new Set([...exercises.filter((exercise) => exercise.id <= 420).flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles]), "neck"]);

describe("the resolution of the handoff's 24 proposals", () => {
  it("resolves every key to exactly one current exercise, by id and by name, with no key or id twice", () => {
    expect(resolution.rows).toHaveLength(24);
    expect(new Set(resolution.rows.map((row) => row.key)).size).toBe(24);
    expect(new Set(resolution.rows.map((row) => row.catalogId)).size).toBe(24);
    for (const row of resolution.rows) {
      const matches = exercises.filter((exercise) => exercise.id === row.catalogId);
      expect(matches, row.key).toHaveLength(1);
      expect(matches[0].name, row.key).toBe(row.name);
      expect(exercises.filter((exercise) => exercise.name.toLowerCase() === row.name.toLowerCase()), row.key).toHaveLength(1);
    }
    // 23 new rows, from 421 after the 420 the catalog held; one reuse.
    expect(resolution.catalogMaxBefore).toBe(420);
    expect(resolution.rows.filter((row) => row.decision === "new").map((row) => row.catalogId).sort((a, b) => a - b)).toEqual(newIds);
    expect(resolution.rows.filter((row) => row.decision === "reuse").map((row) => [row.key, row.catalogId])).toEqual([["smith_incline_bench", 15]]);
  });

  it("names every reused row by its id and its current name, and gives it the handoff's words to be found by", () => {
    const reused = [...resolution.reused.map((row) => [row.catalogId, row.name] as const)];
    expect(reused.map(([id]) => id).sort((a, b) => a - b)).toEqual([12, 15, 164, 300]);
    for (const [id, name] of reused) {
      expect(byId.get(id)?.name, String(id)).toBe(name);
      expect(isProvisionalCatalogId(id), `${id} keeps its own record`).toBe(false);
      expect(existingRowAliases.get(id)?.length, String(id)).toBeGreaterThan(0);
    }
  });

  it("keeps the handoff's aliases on each row (a row may have more, never fewer)", () => {
    for (const row of resolution.rows) {
      const aliases = catalogAliasesOf(row.catalogId).map((alias) => alias.toLowerCase());
      for (const alias of row.aliases) expect(aliases, `${row.key}: ${alias}`).toContain(alias.toLowerCase());
    }
  });
});

describe("every new row (421-443)", () => {
  it("is a whole catalog record: every required field, legal equipment, known muscle keys and five sports", () => {
    const equipment = new Set<string>([...catalogEquipment, "Free weights"]);
    const grades = new Set(["F", "D", "C", "B", "A", "S", "SS"]);
    expect(newIds).toEqual(Array.from({ length: 23 }, (_, index) => 421 + index));
    for (const exercise of zercherNeckBenchExercises) {
      for (const field of ["name", "sourceGroup", "category", "movement"] as const) expect(exercise[field].trim().length, `${exercise.id} ${field}`).toBeGreaterThan(0);
      expect(equipment.has(exercise.equipment), `${exercise.id}: ${exercise.equipment}`).toBe(true);
      expect(exercise.primaryMuscles.length, String(exercise.id)).toBeGreaterThan(0);
      for (const key of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
        expect(knownKeys.has(key), `${exercise.id}: ${key}`).toBe(true);
        expect(muscleLabels[key], `${exercise.id}: ${key} has a label`).toBeTruthy();
      }
      expect(exercise.qualities.length, String(exercise.id)).toBeGreaterThan(0);
      expect(grades.has(exercise.muscleGrade), String(exercise.id)).toBe(true);
      expect(Object.keys(exercise.sportFit).sort(), String(exercise.id)).toEqual(["baseball", "basketball", "combat", "soccer", "tennis"]);
      for (const fit of Object.values(exercise.sportFit)) {
        expect(grades.has(fit.grade), String(exercise.id)).toBe(true);
        expect(fit.movementHelp.length, String(exercise.id)).toBeGreaterThan(8);
      }
    }
  });

  it("has an execution record: provisional, three steps, a legal load convention, at least one role on a known key, sources with a link and a kind", () => {
    expect(Array.from(exerciseExecutionById.keys()).sort((a, b) => a - b)).toEqual(newIds);
    for (const id of newIds) {
      const execution = exerciseExecutionById.get(id)!;
      expect(isProvisionalCatalogId(id), String(id)).toBe(true);
      expect(execution.steps, String(id)).toHaveLength(3);
      expect(execution.distinction.length, String(id)).toBeGreaterThan(20);
      expect(LOAD_CONVENTIONS, String(id)).toContain(execution.load);
      expect(execution.loadRequired, String(id)).toBe(execution.load !== "manual_unmeasured");
      expect(execution.roles.length, String(id)).toBeGreaterThan(0);
      for (const role of execution.roles) {
        expect(role.target.startsWith("neck.") ? NECK_GROUPS.includes(role.target) : knownKeys.has(role.target), `${id}: ${role.target}`).toBe(true);
        if (role.relationship === "stabilizer") expect(role.mode, `${id}: ${role.target} steadies, so it holds`).toBe("isometric");
      }
      // A neck row's roles are the neck's alone, and the neck is never the trapezius.
      if (execution.group === "neck") expect(execution.roles.map((role) => roleMuscleKey(role.target))).toEqual(execution.roles.map(() => "neck"));
      expect(execution.sources.length, String(id)).toBeGreaterThan(0);
      for (const source of execution.sources) {
        expect(source.url, `${id}: ${source.id}`).toMatch(/^https:\/\//);
        expect(["Scientific study", "Manufacturer", "Coaching reference", "Image dataset"], `${id}: ${source.id}`).toContain(sourceKindLabel(source));
      }
      expect(["photo", "fallback"], String(id)).toContain(execution.media);
    }
  });

  it("logs 18 rows in reps and 5 in seconds, the five holds; a head direction only on the side-bend and rotation rows", () => {
    const seconds = newIds.filter((id) => exerciseExecutionById.get(id)!.measure === "seconds");
    expect(seconds).toEqual([424, 433, 434, 435, 436]);
    expect(newIds.filter((id) => exerciseExecutionById.get(id)!.measure === "reps")).toHaveLength(18);
    expect(newIds.filter((id) => exerciseExecutionById.get(id)!.headDirection !== null)).toEqual([427, 431, 432, 435, 436]);
    for (const id of newIds) {
      const execution = exerciseExecutionById.get(id)!;
      if (execution.headDirection) expect(execution.neckAction, String(id)).toBe(execution.headDirection);
      // Manual resistance has no load to log; nothing else does without one.
      expect(execution.load === "manual_unmeasured", String(id)).toBe([433, 434, 435, 436].includes(id));
    }
  });

  it("needs a neck machine or a head harness exactly where Machine or Cable does not say so", () => {
    const needs = newIds.filter((id) => exerciseExecutionById.get(id)!.requires.length > 0).map((id) => [id, ...exerciseExecutionById.get(id)!.requires]);
    expect(needs).toEqual([[425, "neck_machine"], [426, "neck_machine"], [427, "neck_machine"], [428, "head_harness"], [429, "head_harness"], [430, "head_harness"], [431, "head_harness"], [432, "head_harness"]]);
  });
});

describe("the reused Zercher rows' catalog fixes (2 Nov 2026)", () => {
  it("drops 300 Zercher Carry's grip quality and 164 Zercher Squat's unilateral one, and changes nothing else in them", () => {
    expect(byId.get(300)!.qualities).toEqual(["conditioning", "locomotion", "bracing", "sprintSupport"]);
    expect(byId.get(164)!.qualities).toEqual(["strength", "hypertrophy", "deceleration"]);
    expect(byId.get(300)!.primaryMuscles).toEqual(["forearms", "upperBack", "abs"]);
    expect(byId.get(164)!.primaryMuscles).toEqual(["quads", "glutes"]);
  });
});
