import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./mobile-training-card.css", import.meta.url), "utf8");

/**
 * Split at the real breakpoint, not at a mention of it.
 *
 * The file's own header comment names the media query while explaining why the
 * rules left it, so a plain indexOf finds the prose rather than the block. The
 * at-rule is matched at the start of a line instead.
 */
const breakpoint = stylesheet.search(/^@media \(max-width: 640px\)/m);
const phoneBlock = stylesheet.slice(breakpoint);
/** Everything that applies at every width. */
const everyWidth = stylesheet.slice(0, breakpoint);

describe("Training Day prescription card layout above the phone breakpoint", () => {
  it("lays the card out at every width, not only on a phone", () => {
    // The whole stylesheet used to sit inside the phone media query, so above
    // 640px the card had no layout at all: the sets and reps inputs had no field
    // chrome and no gap after their own labels ("Sets3", "Reps / target8"), and
    // "Duplicate" escaped its button as raw 16px text over the reorder chevrons.
    expect(everyWidth).toContain(".custom-row-actions {");
    expect(everyWidth).toContain(".duplicate-prescription {");
    expect(everyWidth).toContain(".custom-prescription-inputs {");
    expect(everyWidth).toContain(".custom-prescription-inputs input {");
  });

  it("gives the fields and the duplicate control visible chrome at every width", () => {
    for (const rule of [".duplicate-prescription {", ".custom-prescription-inputs input {"]) {
      const body = everyWidth.slice(everyWidth.indexOf(rule));
      const declarations = body.slice(0, body.indexOf("}"));
      expect(declarations).toContain("border:");
      expect(declarations).toContain("background:");
    }
  });

  it("keeps the phone breakpoint for what is genuinely phone-specific", () => {
    // Stacking and 44px touch targets stay; they are not the card's only layout.
    expect(phoneBlock).toContain("min-height: 44px");
    expect(phoneBlock).toContain(".custom-row-actions { grid-column: 1 / -1;");
  });
});

describe("mobile Training Day card action layout", () => {
  it("keeps ordering controls compactly within the card header and reserves a separate remove-control column", () => {
    expect(stylesheet).toContain(".day-orderable-exercise .day-order-controls { position: absolute !important; top: .7rem; right: .7rem;");
    expect(stylesheet).toContain("width: 34px; min-width: 34px; height: 34px; min-height: 34px");
    expect(stylesheet).toContain("grid-template-columns: 38px minmax(0, 1fr)");
    expect(stylesheet).toContain(".custom-row-actions { grid-column: 1 / -1; grid-row: 2;");
    expect(stylesheet).toContain("grid-template-columns: minmax(0, 1fr) 44px");
    expect(stylesheet).toContain(".custom-row-actions select, .custom-row-actions button { min-height: 44px;");
  });
});
