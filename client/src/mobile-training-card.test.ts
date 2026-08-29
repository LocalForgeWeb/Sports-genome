import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./mobile-training-card.css", import.meta.url), "utf8");

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
