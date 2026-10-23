import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getSpecializationSummary, indexRegion, nodeSideFor, ruleBranchesOf } from "@shared/specialization/exposure";
import { specializationRegions } from "@shared/specialization/registry";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import {
  currentExposureRule,
  exposureCategoryLabels,
  exposureCategoryLabelsFor,
  exposureRuleIds,
  exposureRuleV1,
  exposureRuleV2,
  publishedExposureRules,
  ruleClauses,
  unpublishedBranches,
  type RuleBranch,
} from "@shared/specialization/rules";
import { calendarWeekInterval } from "@shared/specialization/time";
import { variantLibrary } from "@shared/specialization/variants";
import type { ExerciseVariant, ExposureBout, RuleVersion, SideRelation, SpecializationRegion } from "@shared/specialization/types";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { fxBack, fxBackBeforeShoulder, fxCore, fxThigh, fxVariants } from "./__fixtures__/multiRegion";
import { deltoidRegionData } from "./__fixtures__/deltoidRegion";

/**
 * Rule versions (10-multi-region.md §4.3): every branch the calculator takes is answered by a
 * clause of a rule, and production data reaches only branches whose rule is published. Through
 * wave 0 the forearm stays on v1 and v1 is the only published rule; each later wave publishes the
 * rule its regions first use (v2 the upper arm, v3 the shoulders, chest and back, v4 the core, v5
 * the lower leg), and the clauses those rules publish are already mapped here.
 */

const sides: Pick<SpecializationRegion, "sides">[] = [{ sides: { model: "midline" } }, { sides: { model: "paired", limb: "arm" } }, { sides: { model: "paired", limb: "leg" } }];
// The fixtures' variants, a leg-free arm exercise, and the forearm's first twenty.
const variants: ExerciseVariant[] = [...Object.values(fxVariants), { ...fxVariants.oneArmRow, legLaterality: "not_applicable" }, ...forearmRegionData.variants.slice(0, 20)];
const relations: (SideRelation | undefined)[] = [undefined, "same", "opposite", "both"];
const records = [null, ...(["left", "right", "both"] as const).flatMap((side) => (["recorded", "plan_assumption"] as const).map((source) => ({ side, source })))];
const bouts: Pick<ExposureBout, "armSide" | "legSide">[] = records.flatMap((armSide) => records.map((legSide) => ({ armSide, legSide })));
/** A hands-free exercise a later wave's library may hold, tagged with the forearms as a secondary muscle: 200 45-Degree Back Extension. */
const handsFree: ExerciseVariant = { ...forearmRegionData.variants[0], id: "cat-200", catalogExerciseId: 200, catalogName: "45-Degree Back Extension", laterality: "not_applicable", sidedBy: "none" };

describe("every branch has a clause", () => {
  it("maps every branch nodeSideFor takes, over every side model, variant, relation and recorded side, and every side clause is taken", () => {
    const taken = new Set<RuleBranch>();
    for (const region of sides) for (const variant of [null, ...variants]) for (const relation of relations) for (const bout of bouts) {
      taken.add(nodeSideFor(region, variant, relation === undefined ? null : { sideRelation: relation }, bout).branch);
    }
    for (const branch of Array.from(taken)) expect(ruleClauses[branch], branch).toBeDefined();
    const sideClauses = (Object.keys(ruleClauses) as RuleBranch[]).filter((branch) => branch.startsWith("side."));
    expect(Array.from(taken).sort()).toEqual(sideClauses.sort());
  });

  it("lists, in ruleBranchesOf, every side branch a region's data can reach: through each mapping that credits it, and for a set no mapping speaks for, with any variant of the region or the shared library", () => {
    for (const region of [...specializationRegions, fxCore, fxThigh, fxBack, fxBackBeforeShoulder, deltoidRegionData]) {
      const index = indexRegion(region);
      const variantById = new Map(region.variants.map((variant) => [variant.id, variant] as const));
      const reached = new Set<RuleBranch>();
      for (const bout of bouts) {
        for (const variant of [null, ...region.variants, ...variantLibrary, handsFree]) reached.add(nodeSideFor(region.region, variant, null, bout).branch);
        for (const [variantId, mappings] of Array.from(index.mappingsByVariant)) for (const mapping of mappings) reached.add(nodeSideFor(region.region, variantById.get(variantId) ?? null, mapping, bout).branch);
      }
      const listed = ruleBranchesOf(region);
      expect(Array.from(reached).filter((branch) => !listed.has(branch)).sort(), region.region.id).toEqual([]);
    }
  });

  it("maps every version indexRegion credits a node by", () => {
    const taken = new Set([fxBack, fxBackBeforeShoulder, fxCore, forearmRegionData].flatMap((region) => Array.from(indexRegion(region).creditedBy.values()).map((entry) => entry.branch)));
    expect(Array.from(taken).sort()).toEqual(["version.home", "version.listing_fallback", "version.own"]);
    for (const branch of Array.from(taken)) expect(ruleClauses[branch], branch).toBeDefined();
  });

  it("names a key of the published rule's text for every published clause, and a planned rule for the rest", () => {
    const published = new Map(publishedExposureRules.map((rule) => [rule.id, rule] as const));
    const planned = new Set<string>(Object.values(exposureRuleIds));
    for (const [branch, clause] of Object.entries(ruleClauses)) {
      expect(planned.has(clause.rule), branch).toBe(true);
      const rule = published.get(clause.rule);
      if (rule) expect(Object.keys(rule.specification), branch).toContain(clause.clause);
      else expect(clause.clause.length, branch).toBeGreaterThan(20);
    }
  });
});

describe("production data reaches only published clauses", () => {
  it("from wave A, v1 and v2 are published, v2 a superset of v1 that every page reads", () => {
    expect(publishedExposureRules.map((rule) => rule.id)).toEqual([exposureRuleIds.v1, exposureRuleIds.v2]);
    expect(currentExposureRule).toBe(exposureRuleV2);
    expect(exposureRuleV2.publishedAt).toBe("2026-10-23");
    // Every clause of v1 is in v2, and v2 adds its own three (10-multi-region.md §4.3).
    expect(Object.keys(exposureRuleV2.specification)).toEqual(expect.arrayContaining(Object.keys(exposureRuleV1.specification)));
    expect(Object.keys(exposureRuleV2.specification).filter((key) => !(key in exposureRuleV1.specification)).sort()).toEqual(["catalogKeys", "classification", "externals"]);
    // What v1 counts, v2 counts the same way: only its words for sides, straps, the region total, region-only work and incidental work changed.
    const changed = (Object.keys(exposureRuleV1.specification) as (keyof typeof exposureRuleV1.specification)[]).filter((key) => JSON.stringify(exposureRuleV1.specification[key]) !== JSON.stringify(exposureRuleV2.specification[key]));
    expect(changed.sort()).toEqual(["notConverted", "regionTotal", "sides", "straps", "unmapped"]);
  });

  it("says v2 in words for every region: no arm, forearm or grip word but in the straps clause, which names grip mappings", () => {
    const { straps, ...rest } = exposureRuleV2.specification;
    // v1's categories keep their examples (gripping a bar during a row; hangs, carries, pinches): unchanged, as every count is.
    const { categories: _categories, ...words } = rest;
    expect(JSON.stringify(words)).not.toMatch(/\b(arms?|forearms?|grip|left|right)\b/i);
    expect(straps).toMatch(/^A grip mapping that needs a bare hand does not credit a set logged with straps\./);
  });

  it("every production region's data reaches only branches of a published rule", () => {
    expect(specializationRegions.length).toBeGreaterThan(0);
    for (const region of specializationRegions) {
      expect(region.region.status).toBe("production");
      expect(unpublishedBranches(ruleBranchesOf(region)), region.region.id).toEqual([]);
    }
  });

  it("refuses a midline region before v4, a leg region before v5, side relations before v3 and a home region's credit before v2", () => {
    const missing = (region: typeof fxCore) => Array.from(new Set(unpublishedBranches(ruleBranchesOf(region)).map((branch) => ruleClauses[branch].rule))).sort();
    // The core: midline (v4), the back's credit for its quadratus lumborum and primary tags only (v2),
    // and a side plank planned once per leg (v5).
    // v2 is published from wave A, so a home region's credit and primary tags are covered.
    expect(missing(fxCore)).toEqual([exposureRuleIds.v4, exposureRuleIds.v5]);
    expect(missing(fxThigh)).toEqual([exposureRuleIds.v5]);
    expect(missing(fxBack)).toEqual([exposureRuleIds.v3]);
    expect(missing(fxBackBeforeShoulder)).toEqual([exposureRuleIds.v3]);
    // Without v2 they would also miss it.
    const v1Only = (region: typeof fxCore) => Array.from(new Set(unpublishedBranches(ruleBranchesOf(region), [exposureRuleV1]).map((branch) => ruleClauses[branch].rule))).sort();
    expect(v1Only(fxThigh)).toEqual([exposureRuleIds.v2, exposureRuleIds.v5]);
    expect(v1Only(fxBack)).toEqual([exposureRuleIds.v2, exposureRuleIds.v3]);
    expect(ruleBranchesOf(fxBack).has("version.home")).toBe(true);
    // The deltoid fixture is paired by the arm like the forearm, maps only its own muscles' and the
    // triceps' rows, and reads tags at any scope: v1 covers it.
    expect(missing(deltoidRegionData)).toEqual([]);
  });

  it("reads a region-only set of a hands-free exercise as a side not recorded, which v1 publishes: a library variant never takes the forearm off v1", () => {
    const region = { ...forearmRegionData, variants: [...forearmRegionData.variants, handsFree] };
    expect(nodeSideFor(region.region, handsFree, null, { armSide: null, legSide: null }).branch).toBe("side.arm.unknown");
    expect(unpublishedBranches(ruleBranchesOf(region))).toEqual([]);
    const set: ExposureBout = {
      id: "b200", mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s", sessionLabel: "Day", planWeek: null, dayKey: null, exerciseEntryId: "e", catalogExerciseId: 200,
      exerciseName: "45-Degree Back Extension", matchedBy: "id", armSide: null, legSide: null, straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id: "b200", reps: 12, loadKg: null, holdSeconds: null }],
    };
    for (const side of ["left", "right"] as const) {
      const summary = getSpecializationSummary({ region, bouts: [set], interval: calendarWeekInterval("2026-10-16T12:00:00.000Z", "Europe/London"), side, mode: "completed", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: "2026-10-16T12:00:00.000Z" });
      expect([summary.regionUnclassified.bouts, summary.completeness.boutsUnknownSide], side).toEqual([1, 1]);
    }
  });

  it("lets each wave publish its rule: with v2 to v5 published, every fixture region is covered", () => {
    const later: RuleVersion[] = [exposureRuleIds.v2, exposureRuleIds.v3, exposureRuleIds.v4, exposureRuleIds.v5].map((id) => ({ ...exposureRuleV1, id, publishedAt: null }));
    for (const region of [fxCore, fxThigh, fxBack, fxBackBeforeShoulder]) expect(unpublishedBranches(ruleBranchesOf(region), [exposureRuleV1, ...later]), region.region.id).toEqual([]);
  });
});

describe("the rule a summary applies", () => {
  const request = { region: forearmRegionData, bouts: [], interval: calendarWeekInterval("2026-10-16T12:00:00.000Z", "Europe/London"), side: "left" as const, mode: "completed" as const, goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: "2026-10-16T12:00:00.000Z" };

  it("records the rule passed in, else the current published one", () => {
    expect(getSpecializationSummary(request).ruleVersion).toBe(exposureRuleIds.v2);
    expect(getSpecializationSummary({ ...request, rule: exposureRuleV1 }).ruleVersion).toBe(exposureRuleIds.v1);
  });

  it("names incidental work in the region's word, the forearm's labels as shipped", () => {
    expect(exposureCategoryLabelsFor(forearmRegionData.region.wording)).toEqual(exposureCategoryLabels);
    expect(exposureCategoryLabelsFor({ incidentalWork: "bracing" }).incidental_isometric).toBe("Incidental bracing / stabilization");
    expect(exposureCategoryLabelsFor(fxBack.region.wording).incidental_isometric).toBe("Incidental steadying / stabilization");
  });
});
