import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { composeRegionData } from "@shared/specialization/compose";
import { getSpecializationSummary, indexRegion } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { ExposureBout, RegionContent, SpecializationRegionData, SpecializationSummary, SummarySide } from "@shared/specialization/types";
import { boutsFromSessions } from "./bouts";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { fx, fxBackContent, fxCore, fxCoreContent, fxVariants } from "./__fixtures__/multiRegion";
import { exercise, finished, workSet, type AtlasSet } from "./__fixtures__/syntheticForearm";

/**
 * How a bout is classified by the region's OWN muscles (10-multi-region.md §4.2), which catalog
 * tags make region-only work (§1.1: the region's catalog keys and tag scope, written out), and the
 * sets that tag the region but are not counted here (§8).
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const catalogMusclesFor = catalogMusclesLookup(exercises);
const summarize = (region: SpecializationRegionData, bouts: readonly ExposureBout[], side: SummarySide): SpecializationSummary =>
  getSpecializationSummary({ region, bouts, interval: WEEK, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "s", planRevision: null, now: NOW });
const row = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;

let count = 0;
function logged(catalogId: number, sets: Partial<AtlasSet>[]): ExposureBout[] {
  const id = `c${++count}`;
  const name = exercises.find((item) => item.id === catalogId)!.name;
  return boutsFromSessions([finished(id, "2026-10-14T18:00:00.000Z", [exercise(`${id}-e`, name, catalogId, sets.map((over, index) => workSet({ id: `${id}-${index}`, ...over })))])], { catalog: exercises, fallbackUnit: "kg" });
}

/** The core with no mapping of its own for the suitcase carry (409, tagged obliques as a primary muscle): the back still maps its quadratus lumborum. */
function coreWithout409(catalogKeys: string[]): SpecializationRegionData {
  const content: RegionContent = {
    ...fxCoreContent,
    region: { ...fxCoreContent.region, catalogKeys },
    variants: fxCoreContent.variants.filter((variant) => variant.catalogExerciseId !== 409),
    mappings: fxCoreContent.mappings.filter((mapping) => mapping.variantId !== "fx-409"),
  };
  return composeRegionData(content, [fxBackContent]);
}

describe("a bout is classified by the region's own muscles", () => {
  it("region-only: no own muscle mapped, tagged within scope; counted at region level, and its external credit still on the external row", () => {
    const region = coreWithout409(["abs", "obliques"]);
    const summary = summarize(region, logged(409, [{ side: "left" }]), "midline");
    expect(summary.regionUnclassified).toEqual({ bouts: 1, exercises: [{ name: "Suitcase Carry", catalogExerciseId: 409, bouts: 1 }] });
    expect(summary.completeness).toMatchObject({ boutsConsidered: 1, boutsRegionOnly: 1, boutsWithReviewedMapping: 0, boutsPendingReview: 0 });
    expect(row(summary, fx.ql).deliberateHoldBouts).toBe(1);
    expect([row(summary, fx.obliques).contributions, summary.regionDistinctBouts]).toEqual([[], 0]);
  });

  it("external-only: no own muscle mapped and not tagged within scope: on the external row, in no total and not in completeness", () => {
    const region = coreWithout409(["abs"]);
    const summary = summarize(region, logged(409, [{ side: "left" }]), "midline");
    expect(row(summary, fx.ql).deliberateHoldBouts).toBe(1);
    expect([summary.regionDistinctBouts, summary.regionUnclassified.bouts, summary.completeness.boutsConsidered]).toEqual([0, 0, 0]);
    // 409 tags abs as a secondary muscle, outside this core's primary scope: listed as not counted here, with the row that credits it (§8).
    expect(summary.listedUnmappedRows!.map((item) => [item.tag, item.creditedTo])).toEqual([["secondary", [fx.ql]]]);
    // Tagged with none of the region's keys, it is not listed either.
    expect(summarize(coreWithout409(["calves"]), logged(409, [{ side: "left" }]), "midline").completeness.boutsListedUnmapped).toBe(0);
  });

  it("mapped: an own muscle is mapped; reviewed and pending counts read own mappings only", () => {
    const summary = summarize(fxCore, logged(409, [{ side: "left" }]), "midline");
    expect(summary.completeness).toMatchObject({ boutsConsidered: 1, boutsWithReviewedMapping: 1, boutsRegionOnly: 0 });
    expect(row(summary, fx.obliques).deliberateHoldBouts).toBe(1);
  });

  it("reads the catalog keys the region writes out, not its target nodes' keys", () => {
    // The forearm's written-out key is what its targets gave before (§1.1).
    expect(Array.from(indexRegion(forearmRegionData).regionCatalogKeys)).toEqual(["forearms"]);
    const renamed = { ...fxCore, region: { ...fxCore.region, catalogKeys: ["calves"] } };
    expect(Array.from(indexRegion(renamed).regionCatalogKeys)).toEqual(["calves"]);
  });
});

describe("what is not counted is shown (§8)", () => {
  it("lists a set tagged with the region only as a secondary muscle, where the region reads primary tags, with no reason when none is listed", () => {
    // Back Squat (161): abs is a secondary tag; the fixture core reads primary tags only.
    const summary = summarize(fxCore, logged(161, [{}, {}]), "midline");
    expect(summary.completeness).toMatchObject({ boutsConsidered: 0, boutsRegionOnly: 0, boutsListedUnmapped: 2 });
    expect(summary.listedUnmappedRows!.map((item) => [item.exerciseName, item.tag, item.reason, item.countedSide])).toEqual([["Back Squat", "secondary", null, "midline"], ["Back Squat", "secondary", null, "midline"]]);
  });

  it("lists an external-only set too, naming the external rows that credit it: a home region's mapping never hides a set from the list", () => {
    // The back maps the back squat to its quadratus lumborum, which the core lists; the core maps no muscle of its own for it.
    const ql = fxBackContent.mappings.find((item) => item.nodeId === fx.ql)!;
    const back: RegionContent = {
      ...fxBackContent,
      variants: [...fxBackContent.variants, fxVariants.backSquat],
      mappings: [...fxBackContent.mappings, { ...ql, id: `${fxVariants.backSquat.id}:${fx.ql}`, variantId: fxVariants.backSquat.id, relationship: "stabilizer", sideRelation: "both" }],
    };
    const sets = logged(161, [{}, {}]);
    const summary = summarize(composeRegionData(fxCoreContent, [back]), sets, "midline");
    expect(row(summary, fx.ql).incidentalBouts).toBe(2);
    expect([summary.regionDistinctBouts, summary.regionUnclassified.bouts, summary.completeness.boutsConsidered]).toEqual([0, 0, 0]);
    expect(summary.completeness.boutsListedUnmapped).toBe(2);
    expect(summary.listedUnmappedRows!.map((item) => [item.exerciseName, item.tag, item.creditedTo])).toEqual([["Back Squat", "secondary", [fx.ql]], ["Back Squat", "secondary", [fx.ql]]]);
    // Without the back's mapping the same sets are listed, and no row credits them.
    expect(summarize(fxCore, sets, "midline").listedUnmappedRows!.map((item) => item.creditedTo)).toEqual([[], []]);
  });

  it("gives a listed unmapped exercise its listed reason", () => {
    const listed = { ...fxCore, unmappedTagged: [{ catalogId: 161, reason: "Bracing only: the trunk holds the bar's load still." }] };
    const summary = summarize(listed, logged(161, [{}]), "midline");
    expect(summary.listedUnmappedRows!.map((item) => [item.tag, item.reason])).toEqual([["secondary", "Bracing only: the trunk holds the bar's load still."]]);
  });

  it("forearm: a listed exercise not tagged with the forearms (a sled push) is listed, a region-only one is counted and not listed, and a warm-up is neither", () => {
    const bouts = [...logged(296, [{}, { warmup: true }]), ...logged(200, [{}])];
    for (const side of ["left", "right"] as const) {
      const summary = summarize(forearmRegionData, bouts, side);
      expect(summary.listedUnmappedRows!.map((item) => [item.catalogExerciseId, item.tag, item.reason !== null]), side).toEqual([[296, "listed", true]]);
      expect([summary.completeness.boutsListedUnmapped, summary.completeness.boutsRegionOnly], side).toEqual([1, 1]);
    }
  });

  it("on a paired page, lists only the sets on this side or with no side", () => {
    const listed = { ...forearmRegionData, unmappedTagged: [...forearmRegionData.unmappedTagged, { catalogId: 1, reason: "Test reason." }] };
    const bouts = logged(1, [{ side: "left" }, {}]);
    expect(summarize(listed, bouts, "right").completeness.boutsListedUnmapped).toBe(1);
    expect(summarize(listed, bouts, "left").completeness.boutsListedUnmapped).toBe(2);
  });
});
