import { describe, expect, it } from "vitest";
import { drawnMuscleKeys } from "@/components/anatomy/figureGeometry";
import {
  defaultAnatomySide,
  oppositeSide,
  sideDrawsMuscle,
  sideForSelection,
  sideShowsSelection,
  sideLabel,
  sidesDrawingMuscle,
  turnToSideLabel,
} from "@/lib/anatomySide";

describe("which way the body figure faces", () => {
  it("opens on the front", () => {
    expect(defaultAnatomySide).toBe("front");
    expect(oppositeSide("front")).toBe("back");
    expect(oppositeSide("back")).toBe("front");
  });

  it("reads the sides from the artwork rather than a second list", () => {
    // A hand-kept map of muscle to side would drift from the drawing the moment
    // the geometry is regenerated.
    expect(sideDrawsMuscle("front", "chest")).toBe(true);
    expect(sideDrawsMuscle("back", "chest")).toBe(false);
    expect(sideDrawsMuscle("back", "lats")).toBe(true);
    expect(sideDrawsMuscle("front", "lats")).toBe(false);
    expect(drawnMuscleKeys.front).toContain("chest");
    expect(drawnMuscleKeys.back).toContain("lats");
  });

  it("knows the muscles drawn on both bodies", () => {
    expect(sidesDrawingMuscle("calves")).toEqual(["front", "back"]);
    expect(sidesDrawingMuscle("chest")).toEqual(["front"]);
    expect(sidesDrawingMuscle("glutes")).toEqual(["back"]);
    // Nothing is claimed for artwork that draws neither.
    expect(sidesDrawingMuscle("serratusAnterior")).toEqual([]);
  });

  describe("turning to show a selection", () => {
    it("turns around for a selection the current side cannot show", () => {
      expect(sideForSelection("front", ["lats"])).toBe("back");
      expect(sideForSelection("back", ["chest"])).toBe("front");
    });

    it("stays put when the current side already shows it", () => {
      expect(sideForSelection("front", ["chest"])).toBe("front");
      expect(sideForSelection("back", ["glutes"])).toBe("back");
      // Drawn on both: no reason to move the figure under the athlete.
      expect(sideForSelection("back", ["calves"])).toBe("back");
      expect(sideForSelection("front", ["calves"])).toBe("front");
    });

    it("stays put when there is nothing to show", () => {
      expect(sideForSelection("back", [])).toBe("back");
      // Turning to another body that also draws nothing would say nothing.
      expect(sideForSelection("back", ["serratusAnterior"])).toBe("back");
      expect(sideForSelection("front", ["rotatorCuff"])).toBe("front");
    });

    it("turns for a multi-key region as long as one key lands", () => {
      // A Strength Genome region maps to several artwork keys; the figure has to
      // face the one it can actually draw.
      expect(sideForSelection("front", ["lats", "upperBack"])).toBe("back");
      expect(sideForSelection("front", ["chest", "lats"])).toBe("front");
    });

    it("never returns a side that shows nothing when one would have", () => {
      for (const key of [...drawnMuscleKeys.front, ...drawnMuscleKeys.back]) {
        for (const start of ["front", "back"] as const) {
          expect(sideShowsSelection(sideForSelection(start, [key]), [key])).toBe(true);
        }
      }
    });
  });

  it("labels the control by where it takes you, and the figure by what it is", () => {
    expect(turnToSideLabel("front")).toBe("Show back");
    expect(turnToSideLabel("back")).toBe("Show front");
    expect(sideLabel("front")).toBe("Front");
    expect(sideLabel("back")).toBe("Back");
  });
});
