import { describe, expect, it } from "vitest";
import { loggerGatesFor, loggerGatesForRegions, noLoggerGates } from "./loggerGates";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import { loggingTable, type LoggingTableRow } from "@shared/specialization/loggingTable.generated";
import type { SpecializationGoal } from "@shared/specialization/types";

/**
 * What the athlete's targets switch on in the logger, per exercise (10-multi-region.md §6.4):
 * straps only with a target in a region whose straps-sensitive mappings include the exercise, and
 * rows per side for a one-side exercise with a target in any production region that maps it.
 */
const NOW = "2026-10-20T12:00:00.000Z";
const goal = (regionId: string, fields: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id: `g-${regionId}`, regionId, nodeId: `${regionId}.muscle`, actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week",
  startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", ...fields,
});

describe("for the forearm in wave 0, nothing changes", () => {
  // Today's rule (Home before 20 Oct): any active target turned on straps where the exercise is
  // straps-sensitive, and rows per arm where it is one arm at a time.
  const ids = [...loggingTable.keys(), 1, 167, 173, 217, 247];
  const today = (anyActiveTarget: boolean, id: number) => {
    const policy = loggingPolicyFor(id);
    return { askStraps: anyActiveTarget && policy.strapsSensitive, perSideRows: anyActiveTarget && policy.oneArm };
  };

  it("asks straps and lays rows out per arm exactly as before, for an athlete with a forearm target", () => {
    const gates = loggerGatesFor([goal("forearm", { nodeId: "forearm.fcr" }), goal("forearm", { id: "g2", nodeId: null, actionId: "wrist.flexion" })], NOW);
    for (const id of ids) expect(gates.of(loggingPolicyFor(id)), `catalog ${id}`).toEqual(today(true, id));
    // Some of each, so the comparison is not of nothing.
    expect(ids.filter((id) => gates.of(loggingPolicyFor(id)).askStraps).length).toBe(72);
    expect(ids.filter((id) => gates.of(loggingPolicyFor(id)).perSideRows).length).toBe(26);
  });

  it("asks neither of an athlete without a target, or whose targets have ended or not begun", () => {
    const ended = goal("forearm", { startsOn: "2026-09-01", endsOn: "2026-10-01" });
    const later = goal("forearm", { startsOn: "2026-11-01" });
    for (const gates of [loggerGatesFor([], NOW), loggerGatesFor([ended, later], NOW), noLoggerGates]) {
      for (const id of ids) expect(gates.of(loggingPolicyFor(id)), `catalog ${id}`).toEqual(today(false, id));
    }
  });

  it("names the regions the athlete has an active target in", () => {
    expect([...loggerGatesFor([goal("forearm"), goal("forearm", { id: "g2" }), goal("thigh", { endsOn: "2026-10-02" })], NOW).targetRegionIds]).toEqual(["forearm"]);
  });
});

describe("with several regions, each exercise is gated by the regions that map it", () => {
  const row = (fields: Partial<LoggingTableRow>): LoggingTableRow => ({ measure: "reps", laterality: "bilateral", sidedBy: "none", sideCounted: false, strapsBy: [], mappedBy: [], ...fields });
  const table = new Map<number, LoggingTableRow>([
    // A deadlift: the forearm's grip mapping needs a bare hand; the thigh maps it too.
    [41, row({ strapsBy: ["forearm"], mappedBy: ["forearm", "thigh"] })],
    // Suitcase carry: one arm, mapped by the forearm and the core.
    [409, row({ measure: "seconds", laterality: "unilateral", sidedBy: "arm", sideCounted: true, strapsBy: ["forearm"], mappedBy: ["forearm", "core"] })],
    // Bulgarian split squat: one leg, mapped by the thigh.
    [173, row({ laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "front_leg", sideCounted: true, mappedBy: ["thigh"] })],
    // Side plank: mapped only by the core, so its side is not asked; still one leg at a time.
    [247, row({ measure: "seconds", laterality: "not_applicable", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "bottom_leg", mappedBy: ["core"] })],
  ]);
  const gatesOf = (regions: string[], id: number) => loggerGatesForRegions(regions).of(loggingPolicyFor(id, table));

  it("asks straps only with a target in a region whose straps-sensitive mappings include the exercise", () => {
    expect(gatesOf(["lower_leg"], 41).askStraps).toBe(false);
    expect(gatesOf(["thigh"], 41).askStraps).toBe(false);
    expect(gatesOf(["forearm"], 41).askStraps).toBe(true);
    expect(gatesOf(["core"], 409).askStraps).toBe(false);
  });

  it("lays a one-side exercise out per side with a target in any production region that maps it, paired or midline", () => {
    expect(gatesOf(["core"], 409).perSideRows).toBe(true);
    expect(gatesOf(["forearm"], 409).perSideRows).toBe(true);
    expect(gatesOf(["thigh"], 409).perSideRows).toBe(false);
    expect(gatesOf(["thigh"], 173).perSideRows).toBe(true);
    expect(gatesOf(["forearm"], 173).perSideRows).toBe(false);
    // The side question is not shown on a side plank, and its rows still carry a side for the core's count.
    expect(loggingPolicyFor(247, table).askSide).toBe(false);
    expect(gatesOf(["core"], 247).perSideRows).toBe(true);
    // A two-sided exercise is never split.
    expect(gatesOf(["forearm", "thigh"], 41).perSideRows).toBe(false);
  });

  it("gates an exercise no production region maps not at all", () => {
    expect(gatesOf(["forearm", "core", "thigh"], 999)).toEqual({ askStraps: false, perSideRows: false });
  });
});
