import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./mobile-training-card.css", import.meta.url), "utf8");

describe("mobile Training Day card action layout", () => {
  it("keeps ordering controls compactly within the card header and clear of the disclosure chevron", () => {
    expect(stylesheet).toContain(".day-orderable-exercise .day-order-controls { position: absolute !important; top: .7rem; right: .7rem;");
    expect(stylesheet).toContain("width: 34px; min-width: 34px; height: 34px; min-height: 34px");
    // The reorder arrows are absolutely positioned over the row, so the summary
    // reserves their width. Measured at 390px and 1366px: without it the chevron
    // renders underneath them and the row looks like it does not open.
    expect(stylesheet).toContain("padding: .8rem 5.6rem .8rem .9rem;");
  });

  it("collapses the prescription to what is read and opens to what is edited", () => {
    expect(stylesheet).toContain(".custom-prescription > summary.custom-row");
    expect(stylesheet).toContain("grid-template-columns: 2.1rem minmax(0, 1fr) auto");
    // The exercise name is the thing being scanned for, so it wraps rather than
    // truncating the way it did when a full-width Duplicate button shared the row.
    const nameRule = stylesheet.match(/\.custom-row-identity strong \{[^}]*\}/)?.[0] ?? "";
    expect(nameRule).not.toContain("nowrap");
    expect(nameRule).not.toContain("text-overflow");
    expect(stylesheet).toContain(".custom-prescription[open] > summary .custom-row-chevron");
    // Duplicate and remove moved to the foot of the open disclosure, where a
    // destructive control cannot be hit while scanning the list.
    expect(stylesheet).toContain(".custom-prescription .custom-row-actions");
    expect(stylesheet).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 2.75rem");
    expect(stylesheet).toContain(".custom-prescription .custom-row-actions button { min-height: 2.75rem; }");
  });
});
