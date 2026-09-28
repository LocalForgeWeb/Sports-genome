// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import {
  drawnEquipmentIds,
  equipmentHasOwnIcon,
  equipmentIconLabel,
  equipmentIdFor,
  equipmentIsAmbiguous,
} from "./equipmentIdentity";
import { EquipmentIcon } from "@/components/EquipmentIcon";

describe("resolving the catalog's equipment strings", () => {
  it("maps every value the catalog actually uses", () => {
    // The guard that matters: a new equipment string added to the catalog shows up
    // here as `unknown` rather than silently borrowing another implement's icon.
    const values = new Set(exercises.map((exercise) => exercise.equipment));
    const unmapped = [...values].filter((value) => equipmentIdFor(value) === "unknown");
    expect(unmapped, `unmapped catalog equipment: ${unmapped.join(", ")}`).toEqual([]);
  });

  it("resolves by exact value, never by substring", () => {
    expect(equipmentIdFor("Barbell")).toBe("barbell");
    expect(equipmentIdFor("Dumbbells")).toBe("dumbbell");
    // "Free weights" contains neither word, and must not be coerced into either.
    expect(equipmentIdFor("Free weights")).toBe("freeWeights");
    // A near-miss is unknown, not a guess.
    expect(equipmentIdFor("Barbells")).toBe("unknown");
    expect(equipmentIdFor("barbell")).toBe("unknown");
    expect(equipmentIdFor("")).toBe("unknown");
    expect(equipmentIdFor(undefined)).toBe("unknown");
  });
});

/**
 * The finding this module exists for. "Free weights" is 114 of the 400 catalog
 * rows and holds Conventional Deadlift next to Plate Squeeze Press; 102 of them
 * cannot be resolved even by reading the exercise name. Drawing a barbell there
 * would be a guess presented as a fact, on 28% of the catalog.
 */
describe("equipment the catalog does not resolve to one object", () => {
  it("still covers more than a quarter of the catalog", () => {
    const ambiguous = exercises.filter((exercise) => equipmentIsAmbiguous(equipmentIdFor(exercise.equipment)));
    expect(ambiguous.length).toBeGreaterThan(100);
    expect(Math.round((ambiguous.length / exercises.length) * 100)).toBeGreaterThanOrEqual(25);
  });

  it("gets a mark that claims nothing about which implement it is", () => {
    expect(equipmentIsAmbiguous("freeWeights")).toBe(true);
    expect(equipmentIsAmbiguous("unknown")).toBe(true);
    expect(equipmentHasOwnIcon("freeWeights")).toBe(false);
    for (const id of drawnEquipmentIds) expect(equipmentIsAmbiguous(id)).toBe(false);
  });

  it("says so when the mark is read aloud on its own", () => {
    expect(equipmentIconLabel("barbell", "Barbell")).toBe("Barbell");
    expect(equipmentIconLabel("freeWeights", "Free weights")).toContain("general weights mark");
  });
});

describe("the rendered mark", () => {
  const draw = (equipment: string, props = {}) =>
    renderToStaticMarkup(createElement(EquipmentIcon, { equipment, ...props }));

  it("draws a distinct shape for each pilot, and the plate for everything else", () => {
    const barbell = draw("Barbell");
    const dumbbell = draw("Dumbbells");
    const kettlebell = draw("Kettlebell");
    expect(new Set([barbell, dumbbell, kettlebell]).size, "three distinct marks").toBe(3);

    // A dumbbell's bells are closed bodies; a barbell's plates are open lines.
    expect(dumbbell).toContain("<rect");
    expect(barbell).not.toContain("<rect");
    // The kettlebell's handle is a separate arc, so the gap under it cannot close.
    expect(kettlebell.match(/<path/g) ?? []).toHaveLength(2);

    // Everything without its own icon shares one honest fallback.
    const plate = draw("Free weights");
    expect(plate).toContain("<circle");
    expect(draw("Cable")).toBe(plate);
    expect(draw("Machine")).toBe(plate);
    expect(draw("Something the catalog has not used yet")).toBe(plate);
  });

  it("is silent beside a label that already names the equipment", () => {
    // Every current placement prints the equipment as text next to the mark, so
    // announcing it again would just say "Dumbbells Dumbbells".
    expect(draw("Dumbbells")).toContain('aria-hidden="true"');
    expect(draw("Dumbbells")).not.toContain("aria-label");
  });

  it("names itself when it has to stand alone", () => {
    const standalone = draw("Free weights", { decorative: false });
    expect(standalone).toContain('role="img"');
    expect(standalone).toContain("general weights mark");
  });

  it("scales from one box rather than shipping a second drawing per size", () => {
    expect(draw("Barbell", { size: 18 })).toContain('viewBox="0 0 24 24"');
    expect(draw("Barbell", { size: 32 })).toContain('viewBox="0 0 24 24"');
    expect(draw("Barbell", { size: 32 })).toContain('width="32"');
  });

  it("takes its colour from the text it sits beside", () => {
    // Never a hardcoded hex: the row is rendered on light chrome and on dark.
    const markup = draw("Barbell") + draw("Dumbbells") + draw("Kettlebell") + draw("Free weights");
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).not.toMatch(/#[0-9a-f]{3,6}/i);
  });
});
