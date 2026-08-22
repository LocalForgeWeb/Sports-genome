import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("standalone authentication boundary", () => {
  it("keeps OAuth redirect utility out of the standalone client and does not wire an OAuth login handler globally", () => {
    const clientRoot = resolve(process.cwd(), "client", "src");
    const mainSource = readFileSync(resolve(clientRoot, "main.tsx"), "utf8");
    expect(existsSync(resolve(clientRoot, "const.ts"))).toBe(false);
    expect(mainSource).not.toMatch(/startLogin|oauth|redirectToLogin/i);
  });
});
