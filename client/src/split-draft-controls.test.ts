import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive split-draft controls", () => {
  it("keeps the cycle state readable and control buttons touch-friendly on narrow screens", () => {
    const css = readFileSync(new URL("./components/SplitDraftControls.css", import.meta.url), "utf8");
    expect(css).toContain(".split-cycle-label");
    expect(css).toContain("width: 2.5rem");
    expect(css).toContain("max-width: calc(100vw - 12.2rem)");
  });
});
