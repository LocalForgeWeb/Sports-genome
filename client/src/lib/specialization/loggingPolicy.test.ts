import { describe, expect, it } from "vitest";
import { defaultLoggingPolicy, loggingEntryFor, loggingPolicyFor, sideQuestionLabel } from "@shared/specialization/loggingPolicy";
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
    expect(defaultLoggingPolicy).toEqual({ measure: "reps", askSide: false, sideLimb: null, sideAnchor: null, oneSide: false, oneArm: false, sideDefault: null, strapsSensitive: false, strapsBy: [], mappedBy: [] });
    expect(loggingEntryFor(999, table)).toBeNull();
    expect(loggingEntryFor(173, table)).toBe(table.get(173));
  });

  it("measures a hold in seconds and everything else in reps", () => {
    expect(policy(4).measure).toBe("seconds");
    expect(policy(1).measure).toBe("reps");
  });

  it("asks the arm only of one-arm or either-arm variants, never of a two-handed one", () => {
    expect(policy(1)).toMatchObject({ askSide: false, sideLimb: null, oneSide: false, oneArm: false, sideDefault: null });
    // One arm at a time: which arm goes first is the athlete's, so nothing is preselected.
    expect(policy(2)).toMatchObject({ askSide: true, sideLimb: "arm", sideAnchor: null, oneSide: true, oneArm: true, sideDefault: null });
    // Usually two arms at once, sometimes one: it starts on Both, and a planned set of it is not split.
    expect(policy(3)).toMatchObject({ askSide: true, sideLimb: "arm", oneSide: false, oneArm: false, sideDefault: "both" });
  });

  it("asks the leg of a one-leg variant, by its anchor, reading the legs' laterality and not the arms'", () => {
    expect(policy(173)).toMatchObject({ askSide: true, sideLimb: "leg", sideAnchor: "front_leg", oneSide: true, oneArm: true, sideDefault: null });
    expect(policy(5)).toMatchObject({ askSide: true, sideLimb: "leg", sideAnchor: "working_leg", oneSide: false, sideDefault: "both" });
  });

  it("asks nothing where no region paired by the limb maps it, and still says the variant is one-sided", () => {
    expect(policy(247)).toMatchObject({ askSide: false, sideLimb: "leg", sideAnchor: "bottom_leg", oneSide: true, measure: "seconds" });
    expect(policy(6)).toMatchObject({ askSide: false, sideLimb: "arm", oneSide: true });
    // Mapped by the forearm too, the carry asks the arm.
    expect(policy(409)).toMatchObject({ askSide: true, sideLimb: "arm", oneSide: true, mappedBy: ["forearm", "core"] });
  });

  it("is straps-sensitive only where a region has a mapping a strapped set does not earn, and names those regions", () => {
    expect(policy(4)).toMatchObject({ strapsSensitive: true, strapsBy: ["forearm"] });
    expect(policy(1)).toMatchObject({ strapsSensitive: false, strapsBy: [] });
  });
});

describe("the side question's words", () => {
  it("is Arm on the arm and the anchor's leg on the leg, in the vocabulary's words", () => {
    expect(sideQuestionLabel(policy(2))).toBe("Arm");
    expect(sideQuestionLabel(policy(173))).toBe("Front leg");
    expect(sideQuestionLabel(policy(5))).toBe("Working leg");
    expect(sideQuestionLabel(policy(247))).toBe("Bottom leg");
    expect(sideQuestionLabel({ sideLimb: "leg", sideAnchor: "stance_leg" })).toBe("Standing leg");
    expect(sideQuestionLabel({ sideLimb: "leg", sideAnchor: "top_leg" })).toBe("Top leg");
    expect(sideQuestionLabel({ sideLimb: "leg", sideAnchor: null })).toBe("Leg");
  });
});

describe("the policy's default data, the generated table", () => {
  it("reads the forearm's exercises as it always has: a one-arm wrist curl, a hang in seconds, an either-arm curl", () => {
    // One-Arm Dumbbell Wrist Curl (410), Dead Hang (143), Machine Preacher Curl (127).
    expect(loggingPolicyFor(410)).toMatchObject({ measure: "reps", askSide: true, sideLimb: "arm", oneSide: true, oneArm: true, sideDefault: null });
    expect(loggingPolicyFor(143)).toMatchObject({ measure: "seconds", askSide: false, oneSide: false, oneArm: false });
    expect(loggingPolicyFor(127)).toMatchObject({ askSide: true, sideLimb: "arm", oneSide: false, sideDefault: "both" });
    // An exercise no production region maps: the Barbell Bench Press.
    expect(loggingPolicyFor(1)).toBe(defaultLoggingPolicy);
  });
});
