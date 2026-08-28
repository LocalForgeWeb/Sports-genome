import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Body Lab workspace hierarchy", () => {
  it("leads with compact selected-action context rather than the retired marketing hero", () => {
    expect(source).toContain('className="body-lab-workspace-context"');
    expect(source).toContain("Qualitative action roles. Select a muscle to inspect.");
    expect(source).not.toContain("Body first.<br /><em className=\"text-[#e4512e]\">Details on demand.");
    expect(source).not.toContain("Switch sport actions directly below, then use the role map");
  });
});
