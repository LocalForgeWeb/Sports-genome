import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every stylesheet parses without a warning in the parser the production build minifies with
 * (iOS readiness audit, A07). A token find-and-replace once turned `.border-\[\#e4512e\]` into
 * `.border-\[\var(--sg-action)\]`: an invalid selector, so the build warned and the browser dropped
 * the whole rule. Nothing failed, which is how it lasted. The parser is Vite's own lightningcss,
 * resolved through Vite so the test reads exactly what the build reads.
 */
const require = createRequire(import.meta.url);
const lightningcss = require(require.resolve("lightningcss", { paths: [require.resolve("vite")] })) as {
  transform: (options: { filename: string; code: Buffer; minify: boolean; errorRecovery: boolean }) => { warnings: { message: string; loc?: { line: number } }[] };
};

const root = join(process.cwd(), "client/src");
function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return stylesheets(path);
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

describe("stylesheets", () => {
  const files = stylesheets(root);

  it("are found", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files.map((file) => [relative(root, file), file]))("%s parses without a warning", (_name, file) => {
    // Tailwind's one-line statements (`@import "tailwindcss";`, `@custom-variant …;`) are expanded by the
    // build before the minifier sees them; only those are dropped here. Block rules are read as written.
    const code = readFileSync(file, "utf8").replace(/^\s*@(tailwind|import|plugin|custom-variant|source)\b[^;{]*;/gm, "");
    const { warnings } = lightningcss.transform({ filename: file, code: Buffer.from(code), minify: true, errorRecovery: true });
    // Tailwind's own block rules, which Tailwind expands first, are the only at-rules let through.
    const real = warnings.filter((warning) => !/^Unknown at rule: @(theme|apply|utility|variant|custom-variant|layer)\b/.test(warning.message));
    expect(real.map((warning) => `${warning.loc?.line ?? "?"}: ${warning.message}`)).toEqual([]);
  });

  it("would catch the selector that slipped through", () => {
    const { warnings } = lightningcss.transform({ filename: "probe.css", code: Buffer.from(".border-\\[\\var(--sg-action)\\] { color: red }"), minify: true, errorRecovery: true });
    expect(warnings.length).toBeGreaterThan(0);
  });
});
