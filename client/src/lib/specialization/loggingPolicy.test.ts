import { describe, expect, it } from "vitest";
import { defaultLoggingPolicy, loggingEntryFor, loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import type { LoggingTableRow } from "@shared/specialization/loggingTable.generated";

/**
 * The logging policy, read from a fixture logging table (10-multi-region.md §6.4). The table's
 * rows are what the emitter writes for each catalog exercise a production region maps; here they
 * stand for regions that are not in production yet (no leg region is in wave 0), so the leg path
 * is proved on data written by hand.
 */
const row = (fields: Partial<LoggingTableRow>): LoggingTableRow => ({ measure: "reps", laterality: "bilateral", sidedBy: "none", sideCounted: false, strapsBy: [], mappedBy: ["forearm"], ...fields });
const table = new Map<number, LoggingTableRow>([
  [1, row({})], // two-handed
  [2, row({ laterality: "unilateral", sidedBy: "arm", sideCounted: true })], // one arm at a time
  [3, row({ laterality: "either", sidedBy: "arm", sideCounted: true })], // either arm
  [4, row({ measure: "seconds", strapsBy: ["forearm"] })], // a hang
  // Bulgarian split squat: one leg at a time, named by the front leg, mapped by a leg region.
  [173, row({ laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "front_leg", sideCounted: true, mappedBy: ["lower_leg", "thigh"] })],
  // A walking lunge done either way, named by the working leg.
  [5, row({ laterality: "not_applicable", legLaterality: "either", sidedBy: "leg", sideAnchor: "working_leg", sideCounted: true, mappedBy: ["thigh"] })],
  // Side plank mapped only by the core (midline): one-sided, but no region counts its side.
  [247, row({ measure: "seconds", laterality: "not_applicable", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "bottom_leg", sideCounted: false, mappedBy: ["core"] })],
  // Suitcase carry: one arm, mapped by a paired arm region and the core.
  [409, row({ measure: "seconds", laterality: "unilateral", sidedBy: "arm", sideCounted: true, strapsBy: ["forearm"], mappedBy: ["forearm", "core"] })],
  // A one-arm variant no arm region maps (a core-only carry): one-sided, not asked.
  [6, row({ laterality: "unilateral", sidedBy: "arm", sideCounted: false, mappedBy: ["core"] })],
]);
const policy = (id: number | null | undefined) => loggingPolicyFor(id, table);

describe("the logging policy for one exercise", () => {
  it("asks nothing new of an exercise no production region maps, or of no exercise at all", () => {
    expect(policy(999)).toBe(defaultLoggingPolicy);
    expect(policy(undefined)).toBe(defaultLoggingPolicy);
    expect(policy(null)).toBe(defaultLoggingPolicy);
    expect(policy(Number.NaN)).toBe(defaultLoggingPolicy);
    expect(defaultLoggingPolicy).toEqual({ measure: "reps", askSide: false, sideLimb: null, oneArm: false, sideDefault: null, strapsSensitive: false, strapsBy: [], mappedBy: [] });
    expect(loggingEntryFor(999, table)).toBeNull();
    expect(loggingEntryFor(173, table)).toBe(table.get(173));
  });

  it("measures a hold in seconds and everything else in reps", () => {
    expect(policy(4).measure).toBe("seconds");
    expect(policy(1).measure).toBe("reps");
  });

  it("asks no side and splits no planned set by side, one-side exercises included: both sides count as one (owner, 20 Oct 2026)", () => {
    // Main's rule (d8d95f4), read from the generated table's shape: no arm is asked, and a planned one-arm set is one row.
    for (const id of [1, 2, 3]) expect(policy(id), `catalog ${id}`).toMatchObject({ askSide: false, oneArm: false });
    // The limb a side would be recorded on, and the side a set would start on, are still read from the variant, for a decision that asks again.
    expect(policy(2)).toMatchObject({ sideLimb: "arm", sideDefault: null });
    expect(policy(3)).toMatchObject({ sideLimb: "arm", sideDefault: "both" });
    expect(policy(1)).toMatchObject({ sideLimb: null, sideDefault: null });
  });

  it("asks no leg either, of a one-leg variant or one done either way, reading the legs' laterality for the side a set would start on", () => {
    expect(policy(173)).toMatchObject({ askSide: false, sideLimb: "leg", oneArm: false, sideDefault: null });
    expect(policy(5)).toMatchObject({ askSide: false, sideLimb: "leg", sideDefault: "both" });
  });

  it("asks nothing whichever regions map a one-side exercise, paired or midline", () => {
    expect(policy(247)).toMatchObject({ askSide: false, sideLimb: "leg", measure: "seconds" });
    expect(policy(6)).toMatchObject({ askSide: false, sideLimb: "arm" });
    expect(policy(409)).toMatchObject({ askSide: false, sideLimb: "arm", mappedBy: ["forearm", "core"] });
  });

  it("is straps-sensitive only where a region has a mapping a strapped set does not earn, and names those regions", () => {
    expect(policy(4)).toMatchObject({ strapsSensitive: true, strapsBy: ["forearm"] });
    expect(policy(1)).toMatchObject({ strapsSensitive: false, strapsBy: [] });
  });
});

describe("the side question", () => {
  it("is gone from the policy: no field names the leg a side question would ask about", () => {
    // The side anchor stays the variant's data (it names a one-leg exercise's leg for a decision
    // that asks again); the logger has no question to label with it (both sides as one, 20 Oct 2026).
    for (const id of [2, 173, 5, 247]) expect(policy(id), `catalog ${id}`).not.toHaveProperty("sideAnchor");
    expect(table.get(173)!.sideAnchor).toBe("front_leg");
  });
});

describe("the policy's default data, the generated table", () => {
  it("reads the forearm's exercises with no arm asked: a one-arm wrist curl, a hang in seconds, an either-arm curl", () => {
    // One-Arm Dumbbell Wrist Curl (410) and Dead Hang (143), as main's loggingRegions.test.ts (d8d95f4) reads them; Machine Preacher Curl (127).
    expect(loggingPolicyFor(410)).toMatchObject({ measure: "reps", askSide: false, oneArm: false, sideDefault: null });
    expect(loggingPolicyFor(410)).toMatchObject({ sideLimb: "arm" });
    expect(loggingPolicyFor(143)).toMatchObject({ measure: "seconds", askSide: false, oneArm: false });
    expect(loggingPolicyFor(127)).toMatchObject({ askSide: false, sideLimb: "arm", sideDefault: "both" });
    // An exercise no production region maps: the Back Squat (the Barbell Bench Press was the example until wave A's upper arm mapped it).
    expect(loggingPolicyFor(166)).toBe(defaultLoggingPolicy);
    // The Barbell Bench Press, mapped by the upper arm from wave A: still no arm asked.
    expect(loggingPolicyFor(1)).toMatchObject({ measure: "reps", askSide: false, oneArm: false, strapsSensitive: false, mappedBy: ["upper_arm"] });
  });
});
