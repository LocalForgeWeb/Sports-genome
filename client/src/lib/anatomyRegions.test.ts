import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MUSCLE_MAP } from "body-muscles";
import {
  approximateRegionNotes,
  describeSubregion,
  landmarkName,
  regionDisplayName,
  splitRegionId,
} from "./anatomyRegions";

const map = readFileSync(join(process.cwd(), "client/src/components/AnatomyMap.tsx"), "utf8");
const css = readFileSync(join(process.cwd(), "client/src/anatomy-clean.css"), "utf8");
const chartIds: string[] = (MUSCLE_MAP as { id: string }[]).map(muscle => muscle.id);

describe("splitRegionId", () => {
  it("separates the side from the muscle stem", () => {
    expect(splitRegionId("lats-mid-right")).toEqual({ stem: "lats-mid", side: "right" });
    expect(splitRegionId("lats-mid-left")).toEqual({ stem: "lats-mid", side: "left" });
  });

  it("leaves a midline region without a side", () => {
    expect(splitRegionId("spine")).toEqual({ stem: "spine", side: "" });
  });

  it("does not mistake a stem that merely contains a side word", () => {
    // "lower-back-erectors-left" must not split on the first hyphen.
    expect(splitRegionId("lower-back-erectors-left").stem).toBe("lower-back-erectors");
  });
});

/**
 * The chart draws the latissimus dorsi in three bands and the trapezius in three
 * parts, but every one of them resolved to its parent catalog key, so tapping the mid
 * lats and the lower lats produced the identical reading "Latissimus dorsi".
 */
describe("the three bands of a subdivided muscle are told apart", () => {
  it("names each lat band distinctly", () => {
    const names = ["lats-upper-right", "lats-mid-right", "lats-lower-right"].map(id => regionDisplayName(id));
    expect(new Set(names).size).toBe(3);
    for (const name of names) expect(name).toContain("Latissimus dorsi");
  });

  it("names each trapezius part distinctly", () => {
    const names = ["traps-upper-left", "traps-mid-left", "traps-lower-left"].map(id => regionDisplayName(id));
    expect(new Set(names).size).toBe(3);
  });

  it("keeps left and right distinct", () => {
    expect(regionDisplayName("lats-mid-left")).not.toBe(regionDisplayName("lats-mid-right"));
  });

  it("uses anatomical naming rather than the chart library's abbreviation", () => {
    // The library calls this "Right Lats (Mid)".
    const name = regionDisplayName("lats-mid-right");
    expect(name).toContain("Latissimus dorsi");
    expect(name).not.toContain("Lats (");
  });

  it("gives every band a distinction an athlete can act on", () => {
    for (const id of ["lats-upper-right", "lats-mid-right", "lats-lower-right", "traps-lower-left"]) {
      expect(describeSubregion(id)?.distinction, id).toBeTruthy();
    }
  });

  it("routes every band back to the one parent key that owns roles and evidence", () => {
    for (const id of ["lats-upper-right", "lats-mid-right", "lats-lower-left"]) {
      expect(describeSubregion(id)?.parentKey).toBe("lats");
    }
  });
});

describe("the region table matches the chart it describes", () => {
  it("describes every region the chart can actually draw, or names it a landmark", () => {
    const undescribed = chartIds.filter(id => !describeSubregion(id) && !landmarkName(id));
    // Joints and extremities are drawn for shape; they are not trainable muscles.
    const expectedGaps = undescribed.every(id => /hand|foot|knee|elbow|neck|face/.test(id));
    expect(expectedGaps, `unexpected undescribed regions: ${undescribed.join(", ")}`).toBe(true);
  });

  it("never invents a region the chart does not draw", () => {
    const stems = new Set(chartIds.map(id => splitRegionId(id).stem));
    const described = chartIds.filter(id => describeSubregion(id));
    expect(described.length).toBeGreaterThan(40);
    for (const id of described) expect(stems.has(splitRegionId(id).stem)).toBe(true);
  });

  it("separates the quadratus lumborum from the erector spinae", () => {
    // They were both labelled "Spinal erectors"; they are different muscles.
    expect(describeSubregion("lower-back-ql-left")?.muscle).toBe("Quadratus lumborum");
    expect(describeSubregion("lower-back-erectors-left")?.muscle).toBe("Erector spinae");
  });

  it("names the lateral hamstring as biceps femoris rather than lumping the group", () => {
    expect(describeSubregion("hamstrings-lateral-right")?.muscle).toBe("Biceps femoris");
  });

  it("falls back rather than throwing on an id it does not know", () => {
    expect(regionDisplayName("not-a-region", "Fallback")).toBe("Fallback");
    expect(describeSubregion("not-a-region")).toBeNull();
  });
});

/**
 * Some muscles have no path in the chart and borrow the nearest one that does. Left
 * silent, a highlighted posterior deltoid reads as the rotator cuff - a different
 * muscle, at a different depth, doing a different job.
 */
describe("borrowed positions are disclosed", () => {
  it("flags the mappings that are approximations", () => {
    for (const key of ["rhomboids", "rotatorCuff", "peroneals", "brachialis", "tfl"]) {
      expect(approximateRegionNotes[key], key).toBeTruthy();
    }
  });

  it("says what the real muscle is, not just that it is approximate", () => {
    expect(approximateRegionNotes.rotatorCuff).toContain("supraspinatus");
    expect(approximateRegionNotes.rhomboids).toContain("deeper");
  });

  it("does not flag a muscle the chart draws directly", () => {
    for (const key of ["lats", "traps", "glutes", "hamstrings", "quads"]) {
      expect(approximateRegionNotes[key], key).toBeUndefined();
    }
  });

  it("is surfaced in the selection strip", () => {
    expect(map).toContain("selectedApproximation");
    expect(map).toContain("Approximate position.");
  });
});

describe("the chart selection carries the exact region", () => {
  it("marks only the band that was tapped as selected", () => {
    // Marking every id of the parent key lit all three lat bands at once.
    expect(map).toContain("selected: selectedId === id");
    expect(map).not.toContain("selected: selectedKey === key");
  });

  it("records the tapped region id alongside the parent key", () => {
    expect(map).toContain("setSelectedId(id)");
    expect(map).toContain("setSelectedKey(matchedKey)");
  });

  it("clears the region id on reset, so a stale band cannot stay lit", () => {
    const reset = map.slice(map.indexOf("const reset ="), map.indexOf("const reset =") + 160);
    expect(reset).toContain('setSelectedId("")');
  });

  it("shows the part and its distinction under the muscle name", () => {
    expect(map).toContain("atlas-selected-part");
    expect(map).toContain("atlas-selected-distinction");
  });

  it("names the hovered region precisely rather than echoing the library id", () => {
    expect(map).toContain("regionDisplayName(id,");
  });
});

/**
 * The panel flips --sg-text-on-light to the light-text value on the dark
 * destination. The hover chip hardcoded a white background and took its colour from
 * that token, so it rendered white-on-white.
 */
describe("the hover chip stays legible on both grounds", () => {
  it("takes both its surface and its text from tokens", () => {
    const rule = css.slice(css.indexOf(".atlas-hover-label{"), css.indexOf(".atlas-hover-label{") + 500);
    expect(rule).toContain("var(--sg-atlas-tooltip-surface,");
    expect(rule).toContain("var(--sg-atlas-tooltip-text,");
    expect(rule).not.toContain("color:var(--sg-text-on-light)");
  });

  it("is given an opaque surface on the dark destination", () => {
    const dark = css.slice(css.indexOf(".destination-body .anatomy-atlas-pro {"));
    const block = dark.slice(0, dark.indexOf("}"));
    expect(block).toContain("--sg-atlas-tooltip-surface");
    expect(block).toContain("--sg-atlas-tooltip-text: var(--sg-text-on-dark)");
    // --sg-surface-light is transparent in this subtree, which an overlay cannot use.
    expect(block).not.toContain("--sg-atlas-tooltip-surface: var(--sg-surface-light)");
  });

  it("cannot overflow the chart frame with a long anatomical name", () => {
    const rule = css.slice(css.indexOf(".atlas-hover-label{"), css.indexOf(".atlas-hover-label{") + 500);
    expect(rule).toContain("max-width:");
    expect(rule).toContain("text-overflow:ellipsis");
  });
});
