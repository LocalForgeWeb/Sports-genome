// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exercises } from "./exerciseCatalog";
import { catalogEquipment } from "./equipmentProfile";
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

    // Everything without its own icon shares one honest fallback. Since Pass 3
    // that is the ambiguous bucket and anything unrecognised - Cable and Machine
    // have marks of their own now, and must NOT land here.
    const plate = draw("Free weights");
    expect(plate).toContain("<circle");
    expect(draw("Something the catalog has not used yet")).toBe(plate);
    expect(draw("Cable")).not.toBe(plate);
    expect(draw("Machine")).not.toBe(plate);
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

/**
 * Pass 3: the family past the three pilots.
 *
 * Twelve of the catalog's thirteen equipment values now have their own mark. The
 * thirteenth, "Free weights", keeps the plate on purpose - it is 114 rows of
 * several different implements, so there is no one object to draw.
 *
 * Two of the nine new marks failed at 16px and were redrawn rather than shipped:
 * the landmine ended in a crossbar that closed into an arrowhead and read as
 * "external link", and the band was an ellipse inside an ellipse, which is an eye
 * - already the interface's symbol for "view". Both are checked here by shape, so
 * neither can drift back.
 */
describe("the family past the pilots", () => {
  const draw = (equipment: string) => renderToStaticMarkup(createElement(EquipmentIcon, { equipment }));

  it("gives every equipment choice in onboarding a mark of its own", () => {
    // That step rendered the same lucide dumbbell against all ten choices, so the
    // icon column carried no information at all.
    const drawn = catalogEquipment.map((value) => draw(value));
    expect(new Set(drawn).size, "ten distinct marks").toBe(catalogEquipment.length);
    const quiz = readFileSync(join(process.cwd(), "client/src/components/AthleteBaselineQuiz.tsx"), "utf8");
    // Bounded forwards from the grid: "athlete-quiz-note" appears on every step,
    // and the first one is long before this step.
    const gridStart = quiz.indexOf("athlete-equipment-grid");
    const grid = quiz.slice(gridStart, quiz.indexOf("athlete-quiz-note", gridStart));
    expect(grid).toContain("<EquipmentIcon equipment={equipment}");
    expect(grid, "no single glyph standing in for every choice").not.toContain("<Dumbbell");
  });

  it("draws every catalog value except the ambiguous bucket", () => {
    const values = new Set(exercises.map((exercise) => exercise.equipment));
    for (const value of values) {
      const id = equipmentIdFor(value);
      expect(equipmentHasOwnIcon(id) || equipmentIsAmbiguous(id), `${value} is neither drawn nor declared ambiguous`).toBe(true);
    }
    expect(drawnEquipmentIds).toHaveLength(12);
  });

  it("keeps the landmine off shapes the interface already uses for something else", () => {
    // A bar ending in a crossbar is an arrow; a bar ending in a disc is not.
    const landmine = draw("Landmine");
    expect(landmine).toContain("<circle");
    expect(landmine.match(/<path/g) ?? []).toHaveLength(2);
  });

  it("keeps the band from reading as an eye", () => {
    const band = draw("Band");
    // Concentric ellipses are an eye. One tube is a band.
    expect((band.match(/<ellipse/g) ?? []).length).toBe(0);
    expect(band).toContain("rotate(-20 12 12)");
  });

  it("stays one family: same box, same stroke, no colour of its own", () => {
    const all = [...catalogEquipment, "Free weights", "Plyometric box", "Battle ropes"].map(draw).join("");
    const boxes = all.match(/viewBox="0 0 24 24"/g) ?? [];
    expect(boxes).toHaveLength(13);
    const widths = new Set(all.match(/stroke-width="[\d.]+"/g) ?? []);
    expect(widths.size, "one stroke weight across the family").toBe(1);
    expect(all).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it("shows the equipment where a suggestion already names it", () => {
    const panel = readFileSync(join(process.cwd(), "client/src/components/ProgressionReviewPanel.tsx"), "utf8");
    expect(panel).toContain("<EquipmentIcon equipment={suggestion.equipment}");
  });
});
