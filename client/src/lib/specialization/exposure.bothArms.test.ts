import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { ExposureBout, SpecializationGoal, SpecializationSummary, SummaryRequest } from "@shared/specialization/types";
import { syntheticForearm } from "./__fixtures__/syntheticForearm";
import { catalogMusclesLookup } from "./useSpecializationSummary";

/**
 * Both arms as one (owner, 20 Oct 2026: "there's no reason for a left and right arm"). A
 * summary for side "both" counts each set once per muscle, whichever arm did it: a one-arm
 * set, a two-handed set and a set with no arm recorded alike. Nothing is kept apart as "no
 * arm recorded", and a target counts work from either arm.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const WED = "2026-10-14T18:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(exercises);
const REVERSE_CURL = 135;

let sequence = 0;
function bout(side: ExposureBout["side"], over: Partial<ExposureBout> = {}): ExposureBout {
  const id = `b${String(++sequence).padStart(3, "0")}`;
  return {
    id, mode: "completed", performedAt: WED, sessionId: "s1", sessionLabel: "Week 1 · Day 01 · Pull", planWeek: null, dayKey: null, exerciseEntryId: "e1",
    catalogExerciseId: REVERSE_CURL, exerciseName: "Reverse Curl", matchedBy: "id", side, sideSource: side === "unknown" ? "unknown" : "recorded",
    straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }], ...over,
  };
}
const summarize = (bouts: readonly ExposureBout[], side: SummaryRequest["side"], goals: SpecializationGoal[] = []): SpecializationSummary =>
  getSpecializationSummary({ region: syntheticForearm, bouts, interval: WEEK, side, mode: "completed", goals, catalogMusclesFor, sourceRevision: "src", planRevision: null, now: NOW });
/** The muscle the reverse curl loads directly in the fixture. */
const directNode = () => {
  const node = summarize([bout("bilateral")], "both").nodes.find((item) => item.directDynamicBouts > 0);
  if (!node) throw new Error("the fixture's reverse curl credits no muscle directly");
  return node.nodeId;
};
const direct = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!.directDynamicBouts;

describe("a summary of both arms", () => {
  it("counts a two-handed set once, not once per arm", () => {
    const nodeId = directNode();
    const bouts = [bout("bilateral")];
    expect(direct(summarize(bouts, "left"), nodeId)).toBe(1);
    expect(direct(summarize(bouts, "right"), nodeId)).toBe(1);
    expect(direct(summarize(bouts, "both"), nodeId)).toBe(1);
  });

  it("counts one-arm sets from either arm", () => {
    const nodeId = directNode();
    const bouts = [bout("left"), bout("left"), bout("right")];
    expect(direct(summarize(bouts, "left"), nodeId)).toBe(2);
    expect(direct(summarize(bouts, "right"), nodeId)).toBe(1);
    expect(direct(summarize(bouts, "both"), nodeId)).toBe(3);
  });

  it("counts a set with no arm recorded instead of keeping it apart", () => {
    const nodeId = directNode();
    const bouts = [bout("unknown"), bout("bilateral")];
    const left = summarize(bouts, "left");
    expect(direct(left, nodeId)).toBe(1);
    expect(left.nodes.find((node) => node.nodeId === nodeId)!.unknownSide.bouts).toBe(1);
    expect(left.completeness.boutsUnknownSide).toBe(1);
    const both = summarize(bouts, "both");
    expect(direct(both, nodeId)).toBe(2);
    expect(both.nodes.every((node) => node.unknownSide.bouts === 0)).toBe(true);
    expect(both.regionUnknownSideBouts).toBe(0);
    expect(both.completeness.boutsUnknownSide).toBe(0);
    expect(both.regionDistinctBouts).toBe(2);
  });

  it("reads a target with work from either arm, and a target saved once per arm as one", () => {
    const nodeId = directNode();
    const goal = (side: "left" | "right", id: string): SpecializationGoal => ({
      id, regionId: syntheticForearm.region.id, nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target: 6, period: "calendar_week",
      startsOn: "2026-10-01", endsOn: null, timezone: "Europe/London", createdAt: NOW, updatedAt: NOW,
    });
    const bouts = [bout("left"), bout("right"), bout("unknown")];
    const progress = summarize(bouts, "both", [goal("left", "g:left"), goal("right", "g:right")]).goals;
    expect(progress).toHaveLength(1);
    expect(progress[0]).toEqual(expect.objectContaining({ value: 3, label: "3 of your 6" }));
    // A one-arm summary still reads its own arm only.
    expect(summarize(bouts, "left", [goal("left", "g:left")]).goals[0].value).toBe(1);
  });
});
