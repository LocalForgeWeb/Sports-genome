import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ApiOriginConfigError, apiUrl, buildApiOriginConfig, resolveApiOrigin } from "./apiOrigin";

/**
 * iOS readiness audit, A02: one place decides the API address. The website stays relative; a
 * native build must name an HTTPS origin, and one that does not fails at start-up, clearly.
 */
describe("the API address", () => {
  it("stays relative on the website, whatever else is set", () => {
    expect(apiUrl("/api/trpc", buildApiOriginConfig({}))).toBe("/api/trpc");
    expect(apiUrl("/api/trpc", buildApiOriginConfig({ VITE_API_ORIGIN: "https://api.example.com" }))).toBe("/api/trpc");
  });

  it("is the configured HTTPS origin in a native build", () => {
    const config = buildApiOriginConfig({ VITE_NATIVE_SHELL: "1", VITE_API_ORIGIN: "https://sports-genome.example.com/" });
    expect(apiUrl("/api/trpc", config)).toBe("https://sports-genome.example.com/api/trpc");
  });

  it("refuses a native build with no address, a plain-http one, or one with a path", () => {
    expect(() => resolveApiOrigin(buildApiOriginConfig({ VITE_NATIVE_SHELL: "1" }))).toThrow(ApiOriginConfigError);
    expect(() => resolveApiOrigin(buildApiOriginConfig({ VITE_NATIVE_SHELL: "1", VITE_API_ORIGIN: "http://api.example.com" }))).toThrow(/HTTPS/);
    expect(() => resolveApiOrigin(buildApiOriginConfig({ VITE_NATIVE_SHELL: "1", VITE_API_ORIGIN: "https://api.example.com/v1" }))).toThrow(/origin only/);
    expect(() => resolveApiOrigin(buildApiOriginConfig({ VITE_NATIVE_SHELL: "1", VITE_API_ORIGIN: "nope" }))).toThrow(/not a valid URL/);
  });

  it("is what the app's tRPC client uses, and a missing one stops start-up with an explanation", () => {
    const main = readFileSync(join(process.cwd(), "client/src/main.tsx"), "utf8");
    expect(main).toContain('return apiUrl("/api/trpc");');
    expect(main).toContain("url: trpcUrl,");
    expect(main).toContain("renderStartupFailure(root, apiConfigError);");
    expect(main).not.toContain('url: "/api/trpc"');
  });
});
