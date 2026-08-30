import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const manifest = JSON.parse(readFileSync(new URL("public/manifest.webmanifest", root), "utf8"));

describe("Sports Genome app icon metadata", () => {
  it("uses the supplied upright S/DNA artwork for the favicon and Apple touch icon", () => {
    expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="%VITE_SUPABASE_URL%/storage/v1/object/public/sports-genome-assets/sports-genome-upright-s-dna-180_c496e9d0.png"');
    expect(html).toContain('rel="icon" type="image/png" sizes="64x64" href="%VITE_SUPABASE_URL%/storage/v1/object/public/sports-genome-assets/sports-genome-upright-s-dna-64_904d4b7b.png"');
    expect(html).not.toContain("/manus-storage/");
    expect(html).not.toContain("gym-optimizer-logo_32341cfa.png");
  });

  it("declares a standalone navy PWA with the supplied upright S/DNA 192px and 512px icon assets", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBe("#0b2240");
    expect(manifest.theme_color).toBe("#0b2240");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets/sports-genome-upright-s-dna-192_979589c2.png", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "https://qiccnqkypbhlwpmjcsri.supabase.co/storage/v1/object/public/sports-genome-assets/sports-genome-upright-s-dna-512_1a0f292a.png", sizes: "512x512", type: "image/png" }),
    ]));
  });
});
