import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/ui/sonner.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

/** Every `--name` this project actually defines. */
const declared = new Set(Array.from(styles.matchAll(/(--[a-z0-9-]+)\s*:/gi), (match) => match[1]));

describe("the toast has a surface of its own", () => {
  it("is built from variables this project defines", () => {
    // This shipped as the shadcn starter untouched, pointing --normal-bg,
    // --normal-text and --normal-border at --popover, --popover-foreground and
    // --border, none of which this project has ever declared. A custom
    // property whose substitution fails is invalid at computed-value time, so
    // each of those properties resolved to `unset`: the background became
    // `transparent` and the text inherited whatever was behind it. The toast
    // rendered as bare words lying across the page and the bottom bar.
    const referenced = Array.from(source.matchAll(/var\((--[a-z0-9-]+)\)/gi), (match) => match[1]);
    expect(referenced.length, "the toast reads its surface from variables").toBeGreaterThan(0);
    expect(referenced.filter((name) => !declared.has(name)), "every variable the toast reads is declared").toEqual([]);
  });

  it("is opaque, because it covers what is under it", () => {
    // A translucent panel over a navy page with a nav bar beneath it is how
    // the reported screen ended up with two sentences interleaved. The colour
    // reaches the toast through --normal-bg, so the opacity that matters is
    // the one on the token that variable points at.
    const background = source.match(/"--normal-bg":\s*"var\((--[a-z0-9-]+)\)"/)![1];
    const value = styles.match(new RegExp(`${background}:\\s*([^;]+);`))![1].trim();
    expect(value).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("does not follow the phone's theme, because the app never does", () => {
    // This read next-themes and fell back to "system". On a light phone that
    // selected sonner's light treatment - which hardcodes a #3f3f3f
    // description - and printed it on the navy panel the variables above set.
    expect(source).toContain('theme="dark"');
    expect(source).not.toContain("useTheme");
  });

  it("outranks sonner's own rules wherever it overrides them", () => {
    // Sonner injects its stylesheet at runtime, so it lands after this file
    // and takes any tie at equal specificity. A bare [data-sonner-toast] rule
    // here silently painted nothing - measured: the gradient it declared
    // never reached the element. Matching sonner's own [data-styled=true] and
    // adding the toaster class puts these one step above it.
    const rules = Array.from(styles.matchAll(/^(\S*)\s*\[data-sonner-toast\](\S*)/gm));
    expect(rules.length, "the toast overrides are present").toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule[1], `"${rule[0]}" needs the toaster class`).toBe(".toaster");
      expect(rule[2], `"${rule[0]}" needs to match sonner's own [data-styled=true]`).toContain('[data-styled="true"]');
    }
  });

  it("stands clear of the four destinations pinned to the bottom of the screen", () => {
    // Sonner's default is bottom-right at a 32px offset, which on a phone is a
    // full-width slab exactly where this app puts Home, Body Lab, Train and
    // Progress. The offset clears the bar and its safe-area inset.
    expect(source).toContain('position="bottom-center"');
    expect(source).toMatch(/mobileOffset=\{\{ bottom: "calc\(4\.375rem \+ env\(safe-area-inset-bottom, 0px\) \+ \.75rem\)"/);
    // The same 4.375rem the record sheet sits on, so the two agree about how
    // tall the bar is.
    expect(styles).toContain("bottom: calc(4.375rem + env(safe-area-inset-bottom, 0px));");
  });

  it("keeps the description a step below the title rather than level with it", () => {
    // Sonner's dark description is #e8e8e8 at the title's own weight, so the
    // two lines read as one block. The app has a token for supporting text on
    // a dark panel.
    const description = styles.match(/\[data-description\] \{[^}]*\}/)![0];
    expect(description).toContain("var(--sg-text-muted-on-dark)");
  });
});
