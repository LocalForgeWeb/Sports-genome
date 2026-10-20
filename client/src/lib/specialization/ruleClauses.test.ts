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
  publishedExposureRules,
  ruleClauses,
  unpublishedBranches,
  type RuleBranch,
} from "@shared/specialization/rules";
import { calendarWeekInterval } from "@shared/specialization/time";
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
  it("through wave 0, v1 is the only published rule and every page reads it", () => {
    expect(publishedExposureRules.map((rule) => rule.id)).toEqual([exposureRuleIds.v1]);
    expect(currentExposureRule).toBe(exposureRuleV1);
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
    expect(missing(fxCore)).toEqual([exposureRuleIds.v2, exposureRuleIds.v4, exposureRuleIds.v5]);
    expect(missing(fxThigh)).toEqual([exposureRuleIds.v2, exposureRuleIds.v5]);
    expect(missing(fxBack)).toEqual([exposureRuleIds.v2, exposureRuleIds.v3]);
    expect(missing(fxBackBeforeShoulder)).toEqual([exposureRuleIds.v2, exposureRuleIds.v3]);
    expect(ruleBranchesOf(fxBack).has("version.home")).toBe(true);
    // The deltoid fixture is paired by the arm like the forearm, maps only its own muscles' and the
    // triceps' rows, and reads tags at any scope: v1 covers it.
    expect(missing(deltoidRegionData)).toEqual([]);
  });

  it("lets each wave publish its rule: with v2 to v5 published, every fixture region is covered", () => {
    const later: RuleVersion[] = [exposureRuleIds.v2, exposureRuleIds.v3, exposureRuleIds.v4, exposureRuleIds.v5].map((id) => ({ ...exposureRuleV1, id, publishedAt: null }));
    for (const region of [fxCore, fxThigh, fxBack, fxBackBeforeShoulder]) expect(unpublishedBranches(ruleBranchesOf(region), [exposureRuleV1, ...later]), region.region.id).toEqual([]);
  });
});

describe("the rule a summary applies", () => {
  const request = { region: forearmRegionData, bouts: [], interval: calendarWeekInterval("2026-10-16T12:00:00.000Z", "Europe/London"), side: "left" as const, mode: "completed" as const, goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: "2026-10-16T12:00:00.000Z" };

  it("records the rule passed in, else the current published one", () => {
    expect(getSpecializationSummary(request).ruleVersion).toBe(exposureRuleIds.v1);
    expect(getSpecializationSummary({ ...request, rule: { ...exposureRuleV1, id: exposureRuleIds.v2 } }).ruleVersion).toBe(exposureRuleIds.v2);
  });

  it("names incidental work in the region's word, the forearm's labels as shipped", () => {
    expect(exposureCategoryLabelsFor(forearmRegionData.region.wording)).toEqual(exposureCategoryLabels);
    expect(exposureCategoryLabelsFor({ incidentalWork: "bracing" }).incidental_isometric).toBe("Incidental bracing / stabilization");
    expect(exposureCategoryLabelsFor(fxBack.region.wording).incidental_isometric).toBe("Incidental steadying / stabilization");
  });
});
