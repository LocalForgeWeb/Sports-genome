import { describe, expect, it } from "vitest";
import { deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { fxBack, fxCore, fxThigh } from "@/lib/specialization/__fixtures__/multiRegion";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { DiagramAsset, RecordedSide } from "@shared/specialization/types";
import { drawingMirrored } from "./model";
import { recordedSideNote, rowSideLabel, rowSideTextFor, sideWordsFor } from "./sideWords";

/**
 * Every side phrase the page uses comes from the region (docs/specialization-atlas/
 * 10-multi-region.md §1.1, §2.2): its side model, its side word ("arm", "side", "leg") and the
 * limb the logger asks about. A midline region has none.
 */

const forearm = sideWordsFor(forearmRegionData.region);
const thigh = sideWordsFor(fxThigh.region);
const back = sideWordsFor(fxBack.region);
const core = sideWordsFor(fxCore.region);
const recorded = (limb: "arm" | "leg", side: RecordedSide["side"], source: RecordedSide["source"] = "recorded"): RecordedSide => ({ limb, side, source });

describe("the side words", () => {
  it("are the forearm's as shipped: the switch, a side in a sentence, both, and the arm asked about", () => {
    expect([forearm.group, forearm.label("left"), forearm.label("right")]).toEqual(["Arm", "Left arm", "Right arm"]);
    expect([forearm.of("right"), forearm.adjective("left"), forearm.only("right"), forearm.both, forearm.perSide]).toEqual(["right arm", "left-arm", "Right arm only", "Both arms", "per arm"]);
    expect(forearm.onSide("right")).toBe("your right forearm");
    expect([forearm.noneRecorded, forearm.noneRecordedTitle, forearm.neither, forearm.aLimb]).toEqual(["no arm recorded", "No arm recorded", "counted for neither arm", "an arm"]);
    expect(forearm.asksWhich).toBe("One-arm work logged from now on asks which arm.");
  });

  it("say leg on a region paired by the leg", () => {
    expect([thigh.group, thigh.label("left"), thigh.both, thigh.onSide("left")]).toEqual(["Leg", "Left leg", "Both legs", "your left fixture thigh"]);
    expect([thigh.noneRecorded, thigh.neither, thigh.aLimb]).toEqual(["no leg recorded", "counted for neither leg", "a leg"]);
    expect(thigh.differ).toBe("Sets done with both legs count for each leg; only one-leg sets make the legs differ.");
  });

  it("say side on the back, and still name the arm the logger asks about", () => {
    expect([back.group, back.label("right"), back.both, back.onSide("right")]).toEqual(["Side", "Right side", "Both sides", "the right side of your fixture back"]);
    expect([back.noneRecorded, back.neither]).toEqual(["no arm recorded", "counted for neither side"]);
    expect(back.differ).toBe("Sets done with both arms count for each side; only one-arm sets make the sides differ.");
  });

  it("are empty on a midline region, which names no side", () => {
    expect(core.paired).toBe(false);
    expect([core.group, core.label("left"), core.of("right"), core.both, core.noneRecorded, core.neither, core.differ]).toEqual(["", "", "", "", "", "", ""]);
    expect(core.onSide("midline")).toBe("your fixture core");
  });
});

describe("a ledger row's side", () => {
  it("is the side it is counted on, or that none was recorded; nothing on a midline region", () => {
    expect(rowSideLabel(forearm, { side: "bilateral", countedSide: "right" })).toBe("Right arm");
    expect(rowSideLabel(forearm, { side: "unknown", countedSide: "unknown" })).toBe("No arm recorded");
    expect(rowSideLabel(thigh, { side: "left", countedSide: "left" })).toBe("Left leg");
    expect(rowSideLabel(core, { side: "bilateral", countedSide: "midline" })).toBeNull();
    // A summary made before rows carried a counted side is read by its single side.
    expect(rowSideLabel(forearm, { side: "bilateral" })).toBe("Both arms");
  });

  it("notes what the set recorded where the counted side does not say it", () => {
    // A suitcase carry in the left hand credits the right quadratus lumborum on the back page.
    expect(recordedSideNote(back, { side: "right", countedSide: "right", recordedSide: recorded("arm", "left"), sideRelation: "opposite" }, null)).toBe("Left hand: opposite side");
    // A single-leg RDL logged "Standing leg: Left" credits the left hamstrings.
    expect(recordedSideNote(thigh, { side: "left", countedSide: "left", recordedSide: recorded("leg", "left"), sideRelation: "same" }, "stance_leg")).toBe("Standing leg: left");
    expect(recordedSideNote(back, { side: "bilateral", countedSide: "left", recordedSide: recorded("arm", "right"), sideRelation: "both" }, null)).toBe("Right hand: both sides");
    expect(recordedSideNote(forearm, { side: "bilateral", countedSide: "left", recordedSide: recorded("arm", "both"), sideRelation: "same" }, null)).toBe("Both hands");
    // A hand recorded for work counted on a leg says which hand.
    expect(recordedSideNote(thigh, { side: "unknown", countedSide: "unknown", recordedSide: recorded("arm", "left"), sideRelation: "same" }, null)).toBe("Left hand");
  });

  it("adds nothing where the counted side says it all, for a plan's assumed side, on a midline region, or for a leg on an arm's region", () => {
    expect(recordedSideNote(forearm, { side: "right", countedSide: "right", recordedSide: recorded("arm", "right"), sideRelation: "same" }, null)).toBeNull();
    expect(recordedSideNote(forearm, { side: "bilateral", countedSide: "right", recordedSide: null }, null)).toBeNull();
    expect(recordedSideNote(forearm, { side: "bilateral", countedSide: "right", recordedSide: recorded("arm", "right", "plan_assumption") }, null)).toBeNull();
    expect(recordedSideNote(core, { side: "bilateral", countedSide: "midline", recordedSide: recorded("arm", "left"), sideRelation: "opposite" }, null)).toBeNull();
    // A leg's side on a region paired by the arm: its page names no leg, and the row says "No arm recorded".
    expect(recordedSideNote(forearm, { side: "unknown", countedSide: "unknown", recordedSide: recorded("leg", "right"), sideRelation: "same" }, "front_leg")).toBeNull();
    expect(recordedSideNote(back, { side: "unknown", countedSide: "unknown", recordedSide: recorded("leg", "left"), sideRelation: "same" }, "stance_leg")).toBeNull();
  });

  it("reads each exercise's anchor leg from its variant", () => {
    const text = rowSideTextFor(fxThigh);
    expect(text({ side: "left", countedSide: "left", recordedSide: recorded("leg", "left"), sideRelation: "same", catalogExerciseId: 188 })).toEqual(["Left leg", "Standing leg: left"]);
    expect(text({ side: "right", countedSide: "right", recordedSide: recorded("leg", "right"), sideRelation: "same", catalogExerciseId: 173 })).toEqual(["Right leg", "Front leg: right"]);
  });
});

describe("the drawing is mirrored", () => {
  const oneSide = deltoidRegionData.diagram!;
  const bothSides: Pick<DiagramAsset, "sides"> = { sides: "both_sides" };
  it("for the left side of a drawing of one side, on a paired region only", () => {
    expect(drawingMirrored(forearmRegionData.region, forearmRegionData.diagram!, "left")).toBe(true);
    expect(drawingMirrored(forearmRegionData.region, forearmRegionData.diagram!, "right")).toBe(false);
    expect(drawingMirrored(deltoidRegionData.region, oneSide, "left")).toBe(true);
  });
  it("never for a drawing of both sides, nor on a midline region", () => {
    expect(drawingMirrored(fxBack.region, bothSides, "left")).toBe(false);
    expect(drawingMirrored(fxCore.region, bothSides, "left")).toBe(false);
    expect(drawingMirrored(fxCore.region, oneSide, "left")).toBe(false);
  });
});
