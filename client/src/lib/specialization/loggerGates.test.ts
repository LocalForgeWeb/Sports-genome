import { describe, expect, it } from "vitest";
import { loggerGatesFor, loggerGatesForRegions, noLoggerGates } from "./loggerGates";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import { loggingTable, type LoggingTableRow } from "@shared/specialization/loggingTable.generated";
import type { SpecializationGoal } from "@shared/specialization/types";

/**
 * What the athlete's targets switch on in the logger, per exercise (10-multi-region.md §6.4):
 * straps only with a target in a region whose straps-sensitive mappings include the exercise. No
 * planned set is laid out per side: both sides are counted as one (owner, 20 Oct 2026), so a
 * planned set is one row for everyone, as main (4dac1ae) builds it.
 */
const NOW = "2026-10-20T12:00:00.000Z";
const goal = (regionId: string, fields: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id: `g-${regionId}`, regionId, nodeId: `${regionId}.muscle`, actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week",
  startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", ...fields,
});

describe("for the forearm, as main builds it (4dac1ae)", () => {
  // Main's rule: any active target turns on straps where the exercise is straps-sensitive, and no
  // planned set is laid out per arm (both arms as one, 20 Oct 2026).
  const ids = [...loggingTable.keys(), 1, 167, 173, 217, 247];
  const today = (anyActiveTarget: boolean, id: number) => {
    const policy = loggingPolicyFor(id);
    return { askStraps: anyActiveTarget && policy.strapsSensitive };
  };

  it("asks straps as before, and lays no row out per arm, for an athlete with a forearm target", () => {
    const gates = loggerGatesFor([goal("forearm", { nodeId: "forearm.fcr" }), goal("forearm", { id: "g2", nodeId: null, actionId: "wrist.flexion" })], NOW);
    for (const id of ids) expect(gates.of(loggingPolicyFor(id)), `catalog ${id}`).toEqual(today(true, id));
    // Some of each, so the comparison is not of nothing (72 as main builds it, and from F3 419 Barbell Hold, a hold the straps can take).
    expect(ids.filter((id) => gates.of(loggingPolicyFor(id)).askStraps).length).toBe(73);
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

  it("gates nothing about sides, whichever regions the athlete has a target in, paired or midline: straps is all", () => {
    for (const [regions, id] of [[["core"], 409], [["forearm"], 409], [["thigh"], 173], [["core"], 247], [["forearm", "thigh"], 41]] as const) {
      expect(Object.keys(gatesOf([...regions], id)), `${regions.join("+")} ${id}`).toEqual(["askStraps"]);
    }
    // No side is asked, of an arm or a leg, and the policy lays no planned set out per side.
    for (const id of [409, 173, 247]) expect(loggingPolicyFor(id, table).askSide, `catalog ${id}`).toBe(false);
  });

  it("gates an exercise no production region maps not at all", () => {
    expect(gatesOf(["forearm", "core", "thigh"], 999)).toEqual({ askStraps: false });
  });
});
