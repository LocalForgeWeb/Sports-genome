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
 *
 * Adapted to wave 0's bout shape only (10-multi-region.md §2.1): a bout carries the arm's side as
 * recorded (`armSide`) and the calculator resolves it per mapping, where it once carried one
 * resolved `side`. The helper below keeps this test's words: "bilateral" is a set recorded Both,
 * "left" and "right" a set recorded on that arm, "unknown" a set with no arm recorded.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const WED = "2026-10-14T18:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(exercises);
/**
 * The exercise these sets are of. Main's test used the Reverse Curl (135), which the fixture holds
 * as two-handed; since wave 0 a set's sides are read from its exercise per mapping (a two-handed
 * exercise is on both arms whatever was recorded), so "no arm recorded" means something only on an
 * exercise that can be done one arm at a time: the Wrist Curl (139, either arm).
 */
const ONE_ARM_CAPABLE = 139;

let sequence = 0;
type RecordedArm = "left" | "right" | "bilateral" | "unknown";
function bout(side: RecordedArm, over: Partial<ExposureBout> = {}): ExposureBout {
  const id = `b${String(++sequence).padStart(3, "0")}`;
  const armSide: ExposureBout["armSide"] = side === "unknown" ? null : { side: side === "bilateral" ? "both" : side, source: "recorded" };
  return {
    id, mode: "completed", performedAt: WED, sessionId: "s1", sessionLabel: "Week 1 · Day 01 · Pull", planWeek: null, dayKey: null, exerciseEntryId: "e1",
    catalogExerciseId: ONE_ARM_CAPABLE, exerciseName: "Wrist Curl", matchedBy: "id", armSide, legSide: null,
    straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }], ...over,
  };
}
const summarize = (bouts: readonly ExposureBout[], side: SummaryRequest["side"], goals: SpecializationGoal[] = []): SpecializationSummary =>
  getSpecializationSummary({ region: syntheticForearm, bouts, interval: WEEK, side, mode: "completed", goals, catalogMusclesFor, sourceRevision: "src", planRevision: null, now: NOW });
/** The muscle the wrist curl loads directly in the fixture. */
const directNode = () => {
  const node = summarize([bout("bilateral")], "both").nodes.find((item) => item.directDynamicBouts > 0);
  if (!node) throw new Error("the fixture's wrist curl credits no muscle directly");
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
