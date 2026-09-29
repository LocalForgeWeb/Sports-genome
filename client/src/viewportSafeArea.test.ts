import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The home-screen app uses the black-translucent status bar, so the page is drawn under
// the clock. iOS reports env(safe-area-inset-*) only when the viewport covers the screen;
// without viewport-fit=cover every inset is 0, the status-area backdrop has no height,
// and scrolled content shows behind the clock and Dynamic Island.
const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("./index.css", import.meta.url), "utf8");

describe("safe-area insets on iPhone", () => {
  it("covers the screen whenever the status bar is translucent", () => {
    expect(page).toContain('name="apple-mobile-web-app-status-bar-style" content="black-translucent"');
    const viewport = page.match(/<meta name="viewport" content="([^"]+)"/)?.[1] ?? "";
    expect(viewport.split(",").map((part) => part.trim())).toContain("viewport-fit=cover");
  });

  it("gives the status-area backdrop the top inset as its height", () => {
    expect(styles).toMatch(/\.status-backdrop \{[^}]*height: env\(safe-area-inset-top, 0px\)/);
  });
});
