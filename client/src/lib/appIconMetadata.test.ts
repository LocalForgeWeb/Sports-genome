import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const manifest = JSON.parse(readFileSync(new URL("public/manifest.webmanifest", root), "utf8"));

describe("Sports Genome app icon metadata", () => {
  it("uses the official Apple touch icon and avoids the prior favicon asset", () => {
    expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="/manus-storage/sports-genome-apple-touch-icon_06bc5f79.png"');
    expect(html).toContain('rel="icon" type="image/png" sizes="32x32" href="/manus-storage/sports-genome-favicon-32_34c5540f.png"');
    expect(html).not.toContain("gym-optimizer-logo_32341cfa.png");
  });

  it("declares a standalone navy PWA with official 192px and 512px icon assets", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBe("#0b2240");
    expect(manifest.theme_color).toBe("#0b2240");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/manus-storage/sports-genome-icon-192_ae889a25.png", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "/manus-storage/sports-genome-icon-512_eba882de.png", sizes: "512x512", type: "image/png" }),
    ]));
  });
});
